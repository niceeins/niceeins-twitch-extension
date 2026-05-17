import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'https://niceeins.de/wp-json/niceeins-extension/v1/panel'
const MAX_UPCOMING = 3
const TWITCH_HOST_PATTERN = /(^|\.)twitch\.tv$/i
const DISCORD_HOST_PATTERN = /(^|\.)discord(?:app)?\.com$|^discord\.gg$/i

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

function DiscordIcon() {
  return (
    <svg className="discord-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18.7 5.4A15.1 15.1 0 0 0 15 4.2l-.2.4a13.8 13.8 0 0 1 3.3 1.6 11.6 11.6 0 0 0-9.1 0 13.8 13.8 0 0 1 3.3-1.6l-.2-.4a15.1 15.1 0 0 0-3.7 1.2C6.1 8.8 5.5 12.1 5.8 15.4a15 15 0 0 0 4.5 2.3l.6-1a9.6 9.6 0 0 1-1.4-.7l.3-.2a10.8 10.8 0 0 0 9.4 0l.3.2a9.6 9.6 0 0 1-1.4.7l.6 1a15 15 0 0 0 4.5-2.3c.4-3.8-.7-7-3.1-10Zm-7.8 8.1c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Zm4.7 0c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Z" />
    </svg>
  )
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

function App() {
  const [theme, setTheme] = useState('dark')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

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
  const visibleUpcoming = data?.upcoming_streams?.slice(1, 1 + MAX_UPCOMING) || []
  const displayName = data?.streamer?.display_name || data?.streamer?.twitch_login
  const discordLink = data?.links?.find(isDiscordLink)
  const visibleLinks = data?.links?.filter((link) => !isTwitchLink(link) && !isDiscordLink(link)).slice(0, 5) || []

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
          <div className="profile-links">
            {data.streamer.twitch_login && <p className="subtitle">twitch.tv/{data.streamer.twitch_login}</p>}
            {discordLink && (
              <a
                className="discord-link"
                href={discordLink.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Discord extern öffnen"
              >
                <DiscordIcon />
              </a>
            )}
          </div>
        </div>
      </section>

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
    </main>
  )
}

export default App
