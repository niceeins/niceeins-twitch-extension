import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL = 'https://niceeins.de/wp-json/niceeins-extension/v1/panel'
const MAX_UPCOMING = 3
const MAX_ANNOUNCEMENTS = 3
const TWITCH_HOST_PATTERN = /(^|\.)twitch\.tv$/i
const DISCORD_HOST_PATTERN = /(^|\.)discord(?:app)?\.com$|^discord\.gg$/i
const TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'links', label: 'Links' },
  { id: 'commands', label: 'Chat' },
]

function getFallbackParams() {
  const params = new URLSearchParams(window.location.search)
  const query = new URLSearchParams()

  if (params.get('channel')) query.set('channel', params.get('channel'))
  if (params.get('user_id')) query.set('user_id', params.get('user_id'))
  if (params.get('limit')) query.set('limit', params.get('limit'))

  return query
}

function buildPanelUrl(query) {
  const params = new URLSearchParams(query)
  if (!params.get('limit')) params.set('limit', '5')

  return `${API_URL}?${params.toString()}`
}

function formatDate(value) {
  if (!value) return null

  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function isTwitchLink(link) {
  if (link.network === 'twitch') return true

  try {
    return TWITCH_HOST_PATTERN.test(new URL(link.url).hostname)
  } catch {
    return false
  }
}

function isDiscordLink(link) {
  if (link.network === 'discord') return true

  try {
    return DISCORD_HOST_PATTERN.test(new URL(link.url).hostname)
  } catch {
    return false
  }
}

function CategoryArt({ stream }) {
  const categoryName = stream.category?.name || 'Stream'
  const boxArtUrl = stream.category?.box_art_url

  return (
    <span className="box-art" aria-hidden="true">
      <span className="box-art-fallback">{categoryName.charAt(0).toUpperCase()}</span>
      {boxArtUrl && (
        <img
          src={boxArtUrl}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
        />
      )}
    </span>
  )
}

function AnnouncementList({ announcements }) {
  const visibleAnnouncements = announcements?.slice(0, MAX_ANNOUNCEMENTS) || []

  if (visibleAnnouncements.length === 0) return null

  return (
    <section className="announcements" aria-label="Mitteilungen">
      {visibleAnnouncements.map((announcement) => {
        const html = announcement.body_html || ''
        const color = announcement.severity_color || '#3b82f6'

        return (
          <article
            key={announcement.id}
            className="announcement"
            style={{ '--announcement-color': color }}
          >
            <div className="announcement-meta">
              <span className="announcement-badge">{announcement.severity_label || 'Info'}</span>
              {announcement.is_pinned && <span className="announcement-pinned">Fixiert</span>}
            </div>
            {announcement.title && <strong>{announcement.title}</strong>}
            {html ? (
              <div
                className="announcement-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p className="announcement-body">{announcement.body}</p>
            )}
          </article>
        )
      })}
    </section>
  )
}

function App() {
  const [theme, setTheme] = useState('dark')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('plan')
  const [slideDirection, setSlideDirection] = useState('next')
  const touchStartX = useRef(null)

  useEffect(() => {
    let cancelled = false
    const fallbackQuery = getFallbackParams()

    const loadPanel = (query, token = '') => {
      setLoading(true)
      setError(null)

      fetch(buildPanelUrl(query), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(async (response) => {
          const payload = await response.json()
          if (!response.ok) {
            throw new Error(payload.message || payload.code || 'Panel konnte nicht geladen werden')
          }
          return payload
        })
        .then((payload) => {
          if (!cancelled) setData(payload)
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    if (window.Twitch?.ext) {
      window.Twitch.ext.onContext((context) => {
        if (context.theme) setTheme(context.theme)
      })

      window.Twitch.ext.onAuthorized((auth) => {
        const query = getFallbackParams()
        if (auth.channelId) query.set('channel_id', auth.channelId)
        loadPanel(query, auth.token || '')
      })

      if (fallbackQuery.toString()) {
        loadPanel(fallbackQuery)
      }
    } else {
      loadPanel(fallbackQuery)
    }

    return () => {
      cancelled = true
    }
  }, [])

  const accent = data?.streamer?.accent_color || '#9146ff'
  const nextStream = data?.next_stream
  const announcements = data?.announcements || []
  const visibleUpcoming = data?.upcoming_streams?.slice(1, 1 + MAX_UPCOMING) || []
  const displayName = data?.streamer?.display_name || data?.streamer?.twitch_login
  const discordLink = data?.links?.find(isDiscordLink)
  const visibleLinks = data?.links?.filter((link) => !isTwitchLink(link) && !isDiscordLink(link)).slice(0, 5) || []
  const activeTabIndex = TABS.findIndex((tab) => tab.id === activeTab)

  const changeTab = (tabId) => {
    const nextIndex = TABS.findIndex((tab) => tab.id === tabId)
    if (nextIndex < 0 || nextIndex === activeTabIndex) return

    setSlideDirection(nextIndex > activeTabIndex ? 'next' : 'previous')
    setActiveTab(tabId)
  }

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const deltaX = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(deltaX) < 45) return

    const nextIndex = deltaX < 0 ? activeTabIndex + 1 : activeTabIndex - 1
    if (nextIndex >= 0 && nextIndex < TABS.length) {
      changeTab(TABS[nextIndex].id)
    }
  }

  if (loading) {
    return (
      <main className={`panel panel-${theme}`}>
        <section className="state">
          <strong>Panel wird geladen</strong>
          <span>NiceEins synchronisiert die Streamdaten.</span>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className={`panel panel-${theme}`}>
        <section className="state">
          <strong>Panel nicht verfügbar</strong>
          <span>{error}</span>
        </section>
      </main>
    )
  }

  if (!data?.streamer) {
    return (
      <main className={`panel panel-${theme}`}>
        <section className="state">
          <strong>Kein Channel gefunden</strong>
          <span>Öffne das Panel über Twitch oder nutze ?channel=login für die Entwicklung.</span>
        </section>
      </main>
    )
  }

  return (
    <main className={`panel panel-${theme}`} style={{ '--accent': accent }}>
      <section className="profile">
        {data.streamer.profile_image_url && (
          <img className="avatar" src={data.streamer.profile_image_url} alt="" />
        )}
        <div>
          <h1>{displayName}</h1>
          {data.streamer.twitch_login && <p className="subtitle">twitch.tv/{data.streamer.twitch_login}</p>}
        </div>
      </section>

      <nav className="tabs" aria-label="Panel Bereiche">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === activeTab ? 'tab tab-active' : 'tab'}
            type="button"
            onClick={() => changeTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section
        key={activeTab}
        className={`tab-panel tab-panel-${slideDirection}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === 'plan' && (
          <>
            <AnnouncementList announcements={announcements} />

            <section className="card">
              <div className="card-head">
                <span className="eyebrow">Nächster Stream</span>
                {nextStream?.category?.name && <span className="pill">{nextStream.category.name}</span>}
              </div>
              {nextStream ? (
                <div className="featured-stream">
                  <CategoryArt stream={nextStream} />
                  <div>
                    <strong>{formatDate(nextStream.starts_at_local || nextStream.starts_at)}</strong>
                    <p>{nextStream.title || 'Stream'}</p>
                    {nextStream.category?.name && <small>{nextStream.category.name}</small>}
                  </div>
                </div>
              ) : (
                <p>Aktuell ist kein öffentlicher Stream geplant.</p>
              )}
            </section>

            {visibleUpcoming.length > 0 && (
              <section className="list">
                {visibleUpcoming.map((stream) => (
                  <article key={stream.id} className="stream">
                    <CategoryArt stream={stream} />
                    <div>
                      <span>{formatDate(stream.starts_at_local || stream.starts_at)}</span>
                      <strong>{stream.title || 'Stream'}</strong>
                      {stream.category?.name && <small>{stream.category.name}</small>}
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}

        {activeTab === 'links' && (
          <>
            {discordLink && (
              <a
                className="button button-discord"
                href={discordLink.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Discord extern öffnen"
              >
                <span>Discord</span>
                <span className="external" aria-hidden="true">
                  ↗
                </span>
              </a>
            )}

            {visibleLinks.length > 0 && (
              <nav className="links" aria-label="Community Links">
                {visibleLinks.map((link) => (
                  <a
                    key={`${link.network}-${link.url}`}
                    className="button"
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${link.label} extern öffnen`}
                  >
                    <span>{link.label}</span>
                    <span className="external" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ))}
              </nav>
            )}

            {!discordLink && visibleLinks.length === 0 && (
              <section className="state state-compact">
                <strong>Keine Links</strong>
                <span>Für diesen Channel sind keine öffentlichen Links hinterlegt.</span>
              </section>
            )}
          </>
        )}

        {activeTab === 'commands' && (
          <section className="state state-compact">
            <strong>Chat-Kommandos</strong>
            <span>Dieser Bereich ist vorbereitet.</span>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
