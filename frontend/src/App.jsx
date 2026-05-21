import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL = 'https://niceeins.de/wp-json/niceeins-extension/v1/panel'
const MAX_UPCOMING = 3
const MAX_ANNOUNCEMENTS = 3
const MAX_GAME_RATING_STARS = 5
const TWITCH_HOST_PATTERN = /(^|\.)twitch\.tv$/i
const DISCORD_HOST_PATTERN = /(^|\.)discord(?:app)?\.com$|^discord\.gg$/i
const TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'links', label: 'Links' },
  { id: 'games', label: 'Games' },
  { id: 'commands', label: 'Cmds' },
]
const GAME_FILTERS = [
  {
    id: 'currently_playing',
    label: 'Aktuell',
    empty: 'Aktuell wird nichts gespielt',
  },
  {
    id: 'recently_played',
    label: 'Zuletzt',
    empty: 'Noch keine Games erfasst',
  },
  {
    id: 'top_rated',
    label: 'Top',
    empty: 'Noch keine bewerteten Spiele',
  },
]
const DEFAULT_GAME_FILTER = {
  currently: 'currently_playing',
  recent: 'recently_played',
  rated: 'top_rated',
  all: 'currently_playing',
}
const BRAND_META = {
  bluesky: { label: 'Bluesky', color: '#1185fe', letter: 'B' },
  custom: { label: 'Link', color: '#64748b', letter: 'L' },
  discord: { label: 'Discord', color: '#5865f2', letter: 'D' },
  github: { label: 'GitHub', color: '#24292f', letter: 'G' },
  instagram: { label: 'Instagram', color: '#e1306c', letter: 'I' },
  tiktok: { label: 'TikTok', color: '#111111', letter: 'T' },
  twitch: { label: 'Twitch', color: '#9146ff', letter: 'T' },
  website: { label: 'Website', color: '#0f766e', letter: 'W' },
  x: { label: 'X', color: '#111111', letter: 'X' },
  youtube: { label: 'YouTube', color: '#ff0033', letter: 'Y' },
}

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

function formatRelativeTime(value) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000)

  if (diffDays <= 0) return 'heute'
  if (diffDays === 1) return 'gestern'

  return `vor ${diffDays} Tagen`
}

function ratingStars(rating) {
  if (rating === null || rating === undefined) return ''

  const filled = Math.max(1, Math.min(MAX_GAME_RATING_STARS, Math.round(Number(rating) / 2)))

  return '★'.repeat(filled)
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

function BrandIcon({ network }) {
  const brand = BRAND_META[network] || BRAND_META.custom

  return (
    <span className="brand-icon" style={{ '--brand-color': brand.color }} aria-hidden="true">
      {network === 'discord' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M18.7 5.4A15.1 15.1 0 0 0 15 4.2l-.2.4a13.8 13.8 0 0 1 3.3 1.6 11.6 11.6 0 0 0-9.1 0 13.8 13.8 0 0 1 3.3-1.6l-.2-.4a15.1 15.1 0 0 0-3.7 1.2C6.1 8.8 5.5 12.1 5.8 15.4a15 15 0 0 0 4.5 2.3l.6-1a9.6 9.6 0 0 1-1.4-.7l.3-.2a10.8 10.8 0 0 0 9.4 0l.3.2a9.6 9.6 0 0 1-1.4.7l.6 1a15 15 0 0 0 4.5-2.3c.4-3.8-.7-7-3.1-10Zm-7.8 8.1c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Zm4.7 0c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Z" />
        </svg>
      )}
      {network === 'youtube' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.6 4.6 12 4.6 12 4.6s-5.6 0-7.5.5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8ZM10 15.4V8.6l5.8 3.4L10 15.4Z" />
        </svg>
      )}
      {network === 'instagram' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M7.8 2.5h8.4a5.3 5.3 0 0 1 5.3 5.3v8.4a5.3 5.3 0 0 1-5.3 5.3H7.8a5.3 5.3 0 0 1-5.3-5.3V7.8a5.3 5.3 0 0 1 5.3-5.3Zm0 2A3.3 3.3 0 0 0 4.5 7.8v8.4a3.3 3.3 0 0 0 3.3 3.3h8.4a3.3 3.3 0 0 0 3.3-3.3V7.8a3.3 3.3 0 0 0-3.3-3.3H7.8Zm4.2 3.4a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2Zm0 2a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2Zm4.4-2.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
        </svg>
      )}
      {network === 'tiktok' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M15.2 3c.4 3 2 4.8 4.8 5v3.2a8.2 8.2 0 0 1-4.7-1.5v5.9a5.8 5.8 0 1 1-5.8-5.8c.4 0 .8 0 1.2.1v3.4a2.4 2.4 0 1 0 1.3 2.1V3h3.2Z" />
        </svg>
      )}
      {network === 'github' && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 2.6a9.6 9.6 0 0 0-3 18.7c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-4.8 0-1.1.4-2 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 4.8 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.5 1 2.6 0 3.7-2.4 4.5-4.6 4.8.4.3.7 1 .7 2v2.6c0 .3.2.6.7.5A9.6 9.6 0 0 0 12 2.6Z" />
        </svg>
      )}
      {network === 'x' && <span className="brand-letter">X</span>}
      {network === 'bluesky' && <span className="brand-letter">B</span>}
      {!['discord', 'youtube', 'instagram', 'tiktok', 'github', 'x', 'bluesky'].includes(network) && (
        <span className="brand-letter">{brand.letter}</span>
      )}
    </span>
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

function groupCommandsByCategory(commands) {
  return commands.reduce((groups, command) => {
    const category = command.category || 'other'
    const existing = groups.find((group) => group.category === category)

    if (existing) {
      existing.commands.push(command)
      return groups
    }

    groups.push({
      category,
      label: command.category_label || 'Sonstiges',
      commands: [command],
    })

    return groups
  }, [])
}

function CommandList({ commands }) {
  const [activeCommandId, setActiveCommandId] = useState(null)
  const [toast, setToast] = useState('')
  const visibleCommands = commands?.filter((command) => command?.command) || []

  if (visibleCommands.length === 0) return null

  const commandGroups = groupCommandsByCategory(visibleCommands)

  const copyCommand = async (command) => {
    if (!navigator.clipboard?.writeText) return

    try {
      await navigator.clipboard.writeText(command.command)
      setActiveCommandId((current) => (current === command.id ? null : command.id))
      setToast('Kopiert')
      window.setTimeout(() => setToast(''), 1400)
    } catch {
      setToast('')
    }
  }

  return (
    <section className="commands" aria-label="Chat-Kommandos">
      {toast && (
        <span className="toast" role="status" aria-live="polite">
          {toast}
        </span>
      )}

      {commandGroups.map((group) => (
        <section key={group.category} className="command-group" aria-label={group.label}>
          <h2>{group.label}</h2>
          <div className="command-pills">
            {group.commands.map((command) => {
              const isActive = activeCommandId === command.id
              const details = [command.description, command.example ? `Beispiel: ${command.example}` : '']
                .filter(Boolean)
                .join('\n')

              return (
                <article key={command.id} className="command-card">
                  <button
                    className="command-pill"
                    type="button"
                    title={details || command.command}
                    aria-expanded={isActive}
                    onClick={() => copyCommand(command)}
                  >
                    <span
                      className="permission-dot"
                      style={{ '--permission-color': command.permission_color || '#6b7280' }}
                      aria-label={command.permission_label || command.permission || 'Alle'}
                    />
                    <span>{command.command}</span>
                  </button>

                  {isActive && details && (
                    <div className="command-detail">
                      {command.description && <p>{command.description}</p>}
                      {command.example && <code>{command.example}</code>}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </section>
  )
}

function GameCard({ game }) {
  const relativeTime = formatRelativeTime(game.last_streamed_at || game.completed_at)
  const stars = ratingStars(game.rating)

  const openGame = () => {
    if (!game.profile_url) return

    window.open(game.profile_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button className="game-card" type="button" onClick={openGame}>
      <span className="game-cover" aria-hidden="true">
        <span className="game-cover-fallback">{game.title?.charAt(0)?.toUpperCase() || 'G'}</span>
        {game.cover_url && (
          <img
            src={game.cover_url}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true
            }}
          />
        )}
      </span>

      <span className="game-content">
        <span className="game-title">{game.title || 'Game'}</span>
        <span className="game-meta">
          <span className="game-status" style={{ '--game-status-color': game.status_color || '#6b7280' }}>
            {game.status_label || game.status || 'Status'}
          </span>
          {game.rating !== null && game.rating !== undefined && (
            <span className="game-rating">
              {game.rating}/10 {stars}
            </span>
          )}
        </span>
        {relativeTime && <span className="game-time">{relativeTime}</span>}
      </span>
    </button>
  )
}

function GamesTab({ games, widgetMode }) {
  const initialFilter = DEFAULT_GAME_FILTER[widgetMode] || DEFAULT_GAME_FILTER.all
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const currentFilter = GAME_FILTERS.find((filter) => filter.id === activeFilter) || GAME_FILTERS[0]
  const items = games?.[currentFilter.id]?.slice(0, currentFilter.id === 'top_rated' ? 3 : 5) || []

  return (
    <section className="games" aria-label="Games">
      <div className="game-filters" role="tablist" aria-label="Game Filter">
        {GAME_FILTERS.map((filter) => (
          <button
            key={filter.id}
            className={filter.id === currentFilter.id ? 'game-filter game-filter-active' : 'game-filter'}
            type="button"
            role="tab"
            aria-selected={filter.id === currentFilter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="game-list">
          {items.map((game) => (
            <GameCard key={`${currentFilter.id}-${game.id}`} game={game} />
          ))}
        </div>
      ) : (
        <section className="state state-compact">
          <strong>{currentFilter.empty}</strong>
        </section>
      )}
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
  const commands = data?.commands || []
  const hasCommands = commands.length > 0
  const hasGames = Boolean(data?.games)
  const visibleUpcoming = data?.upcoming_streams?.slice(1, 1 + MAX_UPCOMING) || []
  const displayName = data?.streamer?.display_name || data?.streamer?.twitch_login
  const discordLink = data?.links?.find(isDiscordLink)
  const visibleLinks = data?.links?.filter((link) => !isTwitchLink(link) && !isDiscordLink(link)).slice(0, 5) || []
  const availableTabs = TABS.filter((tab) => {
    if (tab.id === 'commands') return hasCommands
    if (tab.id === 'games') return hasGames

    return true
  })
  const currentTab = availableTabs.some((tab) => tab.id === activeTab) ? activeTab : 'plan'
  const activeTabIndex = availableTabs.findIndex((tab) => tab.id === currentTab)

  const changeTab = (tabId) => {
    const nextIndex = availableTabs.findIndex((tab) => tab.id === tabId)
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
    if (nextIndex >= 0 && nextIndex < availableTabs.length) {
      changeTab(availableTabs[nextIndex].id)
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
        <h1>{displayName}</h1>
      </section>

      <nav className="tabs" aria-label="Panel Bereiche">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === currentTab ? 'tab tab-active' : 'tab'}
            type="button"
            onClick={() => changeTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section
        key={currentTab}
        className={`tab-panel tab-panel-${slideDirection}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentTab === 'plan' && (
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

        {currentTab === 'links' && (
          <>
            {discordLink && (
              <a
                className="button button-discord"
                href={discordLink.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Discord extern öffnen"
              >
                <BrandIcon network="discord" />
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
                    <BrandIcon network={link.network} />
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

        {currentTab === 'commands' && <CommandList commands={commands} />}
        {currentTab === 'games' && (
          <GamesTab
            key={data.meta?.games_public_widget || 'all'}
            games={data.games}
            widgetMode={data.meta?.games_public_widget || 'all'}
          />
        )}
      </section>
    </main>
  )
}

export default App
