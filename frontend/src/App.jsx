import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL = 'https://niceeins.de/wp-json/niceeins-extension/v1/panel'
const PROFILE_API_BASE = 'https://niceeins.de/wp-json/niceeins/v1/profile/public'
// Badges werden aus data.meta.badges_enabled gesteuert (DB-Setting)
const MAX_UPCOMING = 3
const MAX_ANNOUNCEMENTS = 3
const MAX_QUICK_COMMANDS = 3
const MAX_GAME_RATING_STARS = 5
const MAX_SUGGESTIONS_HOME = 3
const MAX_SUGGESTIONS_GAMES = 5

/**
 * Kopiert Text in die Zwischenablage.
 * Nutzt die moderne Clipboard API mit Fallback auf execCommand('copy')
 * für iframes ohne allow="clipboard-write" (z.B. Twitch Panel Extension).
 */
async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback versuchen
    }
  }

  try {
    const scrollY = window.scrollY
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    window.scrollTo(0, scrollY)
    return true
  } catch {
    return false
  }
}
const TWITCH_HOST_PATTERN = /(^|\.)twitch\.tv$/i
const DISCORD_HOST_PATTERN = /(^|\.)discord(?:app)?\.com$|^discord\.gg$/i
const TABS = [
  { id: 'home', label: 'Start' },
  { id: 'plan', label: 'Plan' },
  { id: 'links', label: 'Links' },
  { id: 'games', label: 'Games' },
  { id: 'commands', label: 'Cmds' },
]
const GAME_FILTERS = [
  {
    id: 'currently_playing',
    label: 'Im letzten Stream gespielt',
    empty: 'Keine Games aus dem letzten Stream',
    emptyDetail: 'Sobald der Streamer ein Spiel spielt, erscheint es hier.',
    hint: 'Games aus dem letzten Stream.',
  },
  {
    id: 'recently_played',
    label: 'Vorherige Streams',
    empty: 'Keine Games aus früheren Streams',
    emptyDetail: 'Hier siehst du Games, die in früheren Streams gespielt wurden.',
    hint: 'Games, die in früheren Streams gespielt wurden.',
  },
  {
    id: 'top_rated',
    label: 'Top',
    empty: 'Noch keine bewerteten Spiele',
    emptyDetail: 'Bewertete Spiele erscheinen hier mit ihrer Sterne-Wertung.',
    hint: 'Am besten bewertete Games.',
  },
]
const DEFAULT_GAME_FILTER = {
  currently: 'currently_playing',
  recent: 'recently_played',
  rated: 'top_rated',
  all: 'currently_playing',
}
const GAME_WIDGET_FILTERS = {
  currently: 'currently_playing',
  recent: 'recently_played',
  rated: 'top_rated',
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

function formatAgendaTime(startsAt, offsetMinutes) {
  if (!startsAt) return `+${offsetMinutes} min`

  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return `+${offsetMinutes} min`

  date.setMinutes(date.getMinutes() + offsetMinutes)

  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function Agenda({ items, streamStart }) {
  if (!items || items.length === 0) return null

  return (
    <div className="agenda">
      <span className="eyebrow">Ablauf</span>
      <ul className="agenda-list">
        {items.map((item, index) => {
          const timeLabel = formatAgendaTime(streamStart, item.offset_minutes)

          return (
            <li key={`agenda-${item.offset_minutes}-${index}`} className="agenda-item">
              <span className="agenda-time">{timeLabel}</span>
              <span className="agenda-body">
                <span className="agenda-title">{item.title}</span>
                {item.category_name && <small className="agenda-category">{item.category_name}</small>}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
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

function isJustChatting(gameName) {
  return typeof gameName === 'string' && gameName.trim().toLowerCase() === 'just chatting'
}

function isJustChattingGame(game) {
  return isJustChatting(game?.title) || game?.slug === 'just-chatting'
}

function getPreviousPlayedGame(games) {
  const candidates = [
    ...(games?.currently_playing || []),
    ...(games?.recently_played || []),
    ...(games?.top_rated || []),
  ]

  return candidates.find((game) => game && !isJustChattingGame(game)) || null
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
  const [copiedCommandId, setCopiedCommandId] = useState(null)
  const visibleCommands = commands?.filter((command) => command?.command) || []

  if (visibleCommands.length === 0) {
    return (
      <section className="state state-compact">
        <span className="state-icon" aria-hidden="true">&#9000;</span>
        <strong>Keine Commands</strong>
        <span>F&uuml;r diesen Channel sind keine &ouml;ffentlichen Chat-Commands hinterlegt. Schau sp&auml;ter wieder vorbei.</span>
      </section>
    )
  }

  const commandGroups = groupCommandsByCategory(visibleCommands)

  const copyCommand = async (command) => {
    const ok = await copyToClipboard(command.command)
    if (!ok) return

    setCopiedCommandId(command.id)
    window.setTimeout(() => setCopiedCommandId(null), 2000)
  }

  return (
    <section className="commands" aria-label="Chat-Kommandos">
      {commandGroups.map((group) => (
        <section key={group.category} className="command-group" aria-label={group.label}>
          <h2>{group.label}</h2>
          <div className="command-pills">
            {group.commands.map((command) => {
              const isCopied = copiedCommandId === command.id

              return (
                <article key={command.id} className="command-card">
                  <button
                    className={`command-pill${isCopied ? ' command-pill-copied' : ''}`}
                    type="button"
                    title={command.command + ' in Zwischenablage kopieren'}
                    onClick={() => copyCommand(command)}
                  >
                    <span
                      className="permission-dot"
                      style={{ '--permission-color': command.permission_color || '#6b7280' }}
                      aria-label={command.permission_label || command.permission || 'Alle'}
                    />
                    <span className="command-name" aria-hidden={isCopied}>{command.command}</span>
                    <span className={`copy-flash${isCopied ? ' copy-flash-visible' : ''}`} aria-hidden={!isCopied}>Kopiert!</span>
                  </button>
                  {command.description && (
                    <p className="command-desc">{command.description}</p>
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

function QuickCommands({ commands }) {
  const [toast, setToast] = useState('')
  const [copiedCommandId, setCopiedCommandId] = useState(null)
  const quickCommands = commands?.filter((command) => command?.command).slice(0, MAX_QUICK_COMMANDS) || []

  if (quickCommands.length === 0) {
    return (
      <section className="home-card">
        <span className="eyebrow">Quick Commands</span>
        <p>Aktuell sind keine öffentlichen Commands verfügbar.</p>
      </section>
    )
  }

  const copyCommand = async (command) => {
    const ok = await copyToClipboard(command.command)
    if (!ok) return

    setCopiedCommandId(command.id || command.command)
    setToast('Kopiert')
    window.setTimeout(() => {
      setToast('')
      setCopiedCommandId(null)
    }, 1400)
  }

  return (
    <section className="home-card home-card-commands">
      <div className="home-card-head">
        <span className="eyebrow">Quick Commands</span>
        {toast && (
          <span className="mini-toast" role="status" aria-live="polite">
            {toast}
          </span>
        )}
      </div>
      <div className="quick-commands">
        {quickCommands.map((command) => {
          const cmdId = command.id || command.command
          const isCopied = copiedCommandId === cmdId

          return (
            <button
              key={cmdId}
              className={isCopied ? 'quick-command quick-command-copied' : 'quick-command'}
              type="button"
              title={command.description || command.command}
              onClick={() => copyCommand(command)}
            >
              {command.command}
            </button>
          )
        })}
      </div>
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

function getHomeGame({ live, games }) {
  const previousPlayedGame = getPreviousPlayedGame(games)
  const recentGame = games?.recently_played?.[0] || games?.top_rated?.[0]

  if (live?.is_live && live.game) {
    const isChatting = isJustChatting(live.game)

    return {
      label: 'Jetzt im Stream',
      title: live.game,
      meta: live.title || 'Live auf Twitch',
      game: isChatting ? previousPlayedGame : null,
      cardLabel: isChatting ? 'Davor gespielt' : null,
      previousGame: isChatting ? previousPlayedGame : null,
    }
  }

  const currentGame = games?.currently_playing?.[0]
  if (currentGame) {
    const isChatting = isJustChattingGame(currentGame)

    return {
      label: 'Aktuelles Game',
      title: currentGame.title || 'Game',
      meta: currentGame.status_label || 'Wird gespielt',
      game: isChatting ? previousPlayedGame || currentGame : currentGame,
      cardLabel: isChatting && previousPlayedGame ? 'Davor gespielt' : 'Aktuelles Game',
      previousGame: isChatting ? previousPlayedGame : null,
    }
  }

  if (recentGame) {
    return {
      label: 'Im letzten Stream gespielt',
      title: recentGame.title || 'Game',
      meta: formatRelativeTime(recentGame.last_streamed_at || recentGame.completed_at) || recentGame.status_label,
      game: recentGame,
      cardLabel: 'Im letzten Stream gespielt',
    }
  }

  return null
}

function SuggestionsCard({ suggestions, suggestionsUrl, limit, variant = 'home' }) {
  const items = (suggestions || []).slice(0, limit)

  if (items.length === 0 && variant === 'home') return null

  const openSuggestions = () => {
    if (!suggestionsUrl) return
    window.open(suggestionsUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className={variant === 'games' ? 'home-card suggestions-card suggestions-card-wide' : 'home-card suggestions-card'}>
      <div className="home-card-head">
        <span className="eyebrow">Community-Wünsche</span>
      </div>
      <p className="suggestions-sub">Diese Spiele stehen bei der Community hoch im Kurs.</p>

      {items.length > 0 ? (
        <ul className="suggestions-list">
          {items.map((suggestion, index) => (
            <li key={`${suggestion.game_name}-${index}`} className="suggestion-item">
              <span className="suggestion-rank">{index + 1}</span>
              <span className="suggestion-body">
                <span className="suggestion-title">{suggestion.game_name}</span>
                {suggestion.status_label && (
                  <span
                    className="suggestion-status"
                    style={{ '--suggestion-status-color': suggestion.status_color || '#6b7280' }}
                  >
                    {suggestion.status_label}
                  </span>
                )}
              </span>
              {typeof suggestion.votes === 'number' && (
                <span className="suggestion-votes" aria-label={`${suggestion.votes} Stimmen`}>
                  ▲ {suggestion.votes}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="suggestions-empty">Noch keine Vorschläge — sei die/der Erste!</p>
      )}

      {suggestionsUrl && (
        <button className="suggestions-cta" type="button" onClick={openSuggestions}>
          <span>Spiel vorschlagen</span>
          <span className="external" aria-hidden="true">↗</span>
        </button>
      )}
    </section>
  )
}

function HomeTab({ announcements, commands, games, live, nextStream, suggestions, suggestionsUrl }) {
  const homeGame = getHomeGame({ live, games })

  return (
    <section className="home" aria-label="Start">
      <section className="home-card">
        <div className="home-card-head">
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
      <Agenda items={nextStream?.agenda_items} streamStart={nextStream?.starts_at_local || nextStream?.starts_at} />
      </section>

      {homeGame?.game ? (
        <section className="home-card home-game-card">
          <span className="eyebrow">{homeGame.cardLabel || homeGame.label}</span>
          <GameCard game={homeGame.game} />
        </section>
      ) : (
        <section className="home-card">
          <span className="eyebrow">Aktuelles Game</span>
          <p>Noch keine Games erfasst.</p>
        </section>
      )}

      <AnnouncementList announcements={announcements} />

      <SuggestionsCard
        suggestions={suggestions}
        suggestionsUrl={suggestionsUrl}
        limit={MAX_SUGGESTIONS_HOME}
      />

      <QuickCommands commands={commands} />
    </section>
  )
}

function GamesTab({ games, widgetMode, suggestions, suggestionsUrl }) {
  const widgetModes = String(widgetMode || 'all')
    .split(',')
    .map((mode) => mode.trim())
    .filter(Boolean)
  const enabledFilterIds = widgetModes.includes('all')
    ? GAME_FILTERS.map((filter) => filter.id)
    : widgetModes
      .map((mode) => GAME_WIDGET_FILTERS[mode])
      .filter(Boolean)
  const visibleFilters = GAME_FILTERS.filter((filter) => enabledFilterIds.includes(filter.id))
  const initialFilter = visibleFilters[0]?.id || DEFAULT_GAME_FILTER[widgetMode] || DEFAULT_GAME_FILTER.all
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const currentFilter = visibleFilters.find((filter) => filter.id === activeFilter) || visibleFilters[0]

  if (!currentFilter) {
    return (
      <section className="games" aria-label="Games">
        <section className="state state-compact">
          <span className="state-icon" aria-hidden="true">&#127918;</span>
          <strong>Games ausgeblendet</strong>
          <span>Für diesen Channel sind aktuell keine Games-Ansichten im Panel freigegeben.</span>
        </section>
      </section>
    )
  }

  const items = games?.[currentFilter.id]?.slice(0, currentFilter.id === 'top_rated' ? 3 : 5) || []

  return (
    <section className="games" aria-label="Games">
      <div className="game-filters" role="tablist" aria-label="Game Filter">
        {visibleFilters.map((filter) => (
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

      {currentFilter.hint && (
        <p className="game-filter-hint">{currentFilter.hint}</p>
      )}

      {items.length > 0 ? (
        <div className="game-list">
          {items.map((game) => (
            <GameCard key={`${currentFilter.id}-${game.id}`} game={game} />
          ))}
        </div>
      ) : (
        <section className="state state-compact">
          <span className="state-icon" aria-hidden="true">&#127918;</span>
          <strong>{currentFilter.empty}</strong>
          <span>{currentFilter.emptyDetail}</span>
        </section>
      )}

      {suggestions && suggestions.length > 0 && (
        <SuggestionsCard
          suggestions={suggestions}
          suggestionsUrl={suggestionsUrl}
          limit={MAX_SUGGESTIONS_GAMES}
          variant="games"
        />
      )}
    </section>
  )
}

const BADGE_LABELS = {
  // Stream-Stil
  'variety': 'Variety', 'cozy': 'Cozy', 'chill': 'Chill',
  'hype': 'Hype', 'high-energy': 'High Energy', 'laid-back': 'Laid Back',
  'competitive': 'Competitive', 'speedrun': 'Speedrun', 'hardcore': 'Hardcore',
  'casual': 'Casual', 'late-night': 'Late Night', 'marathon': 'Marathon',
  'educational': 'Educational', 'creative': 'Creative', 'narrative': 'Narrative',
  'technical': 'Technical', 'experimental': 'Experimental', 'nostalgic': 'Nostalgic',
  // Games / Genres
  'indie': 'Indie', 'retro': 'Retro', 'horror': 'Horror',
  'story-games': 'Story Games', 'multiplayer': 'Multiplayer', 'open-world': 'Open World',
  'rpg': 'RPG', 'mmorpg': 'MMORPG', 'soulslike': 'Soulslike', 'roguelike': 'Roguelike',
  'metroidvania': 'Metroidvania', 'strategy': 'Strategy', 'simulation': 'Simulation',
  'management': 'Management', 'farming': 'Farming', 'survival': 'Survival',
  'sandbox': 'Sandbox', 'tower-defense': 'Tower Defense', 'fighting': 'Fighting',
  'shooter': 'Shooter', 'platformer': 'Platformer', 'adventure': 'Adventure',
  'point-and-click': 'Point & Click', 'visual-novel': 'Visual Novel',
  'card-games': 'Card Games', 'rhythm': 'Rhythm', 'puzzle': 'Puzzle', 'sports': 'Sports',
  // Community
  'deutschsprachig': 'Deutschsprachig', 'english-friendly': 'English Friendly',
  'family-friendly': 'Family Friendly', 'lgbtq-friendly': 'LGBTQ+ Friendly',
  'new-streamer': 'New Streamer', 'community-games': 'Community Games',
  'interactive': 'Interactive', 'viewer-games': 'Viewer Games',
  'charity': 'Charity', 'welcoming': 'Welcoming',
  // Challenges
  'challenge-runs': 'Challenge Runs', 'permadeath': 'Permadeath',
  'no-damage': 'No Damage', 'blind-playthrough': 'Blind Playthrough',
  '100-percent': '100%', 'low-level': 'Low Level', 'nuzlocke': 'Nuzlocke',
  'randomizer': 'Randomizer',
  // Content-Typ
  'lets-play': "Let's Play", 'reaction': 'Reaction', 'watch-party': 'Watch Party',
  'tutorial': 'Tutorial', 'talk-show': 'Talk Show', 'podcast': 'Podcast',
  'debate': 'Debate', 'q-and-a': 'Q&A', 'tierlist': 'Tierlist', 'news': 'News',
  'art-stream': 'Art Stream', 'music': 'Music', 'coding': 'Coding',
  'unboxing': 'Unboxing', 'entertaining': 'Entertaining',
  'just-chatting': 'Just Chatting', 'irl': 'IRL',
}

function App() {
  const [theme, setTheme] = useState('dark')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [slideDirection, setSlideDirection] = useState('next')
  const [profileBadges, setProfileBadges] = useState(null)
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

  useEffect(() => {
    if (!data?.meta?.badges_enabled) return

    const twitchLogin = data?.streamer?.twitch_login
    if (!twitchLogin) return

    let cancelled = false

    fetch(`${PROFILE_API_BASE}/${encodeURIComponent(twitchLogin)}`)
      .then((res) => res.json())
      .then((profile) => {
        if (!cancelled && profile?.profile_badges?.length > 0) {
          setProfileBadges(profile)
        }
      })
      .catch(() => {
        // Badges sind optional – Fehler stillschweigend ignorieren
      })

    return () => {
      cancelled = true
    }
  }, [data?.meta?.badges_enabled, data?.streamer?.twitch_login])

  const accent = data?.streamer?.accent_color || '#9146ff'
  const nextStream = data?.next_stream
  const announcements = data?.announcements || []
  const commands = data?.commands || []
  const visibleUpcoming = data?.upcoming_streams?.slice(1, 1 + MAX_UPCOMING) || []
  const displayName = data?.streamer?.display_name || data?.streamer?.twitch_login
  const discordLink = data?.links?.find(isDiscordLink)
  const visibleLinks = data?.links?.filter((link) => !isTwitchLink(link) && !isDiscordLink(link)).slice(0, 5) || []
  const sponsor = data?.sponsor || null
  const suggestions = data?.game_suggestions || []
  const suggestionsUrl = data?.streamer?.suggestions_url || null
  const panelTabIds = data?.meta?.panel_tabs
  const availableTabs = Array.isArray(panelTabIds) && panelTabIds.length > 0
    ? TABS.filter((tab) => panelTabIds.includes(tab.id))
    : TABS
  const currentTab = availableTabs.some((tab) => tab.id === activeTab) ? activeTab : 'home'
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
          <div className="spinner" aria-hidden="true" />
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
          <span className="state-icon" aria-hidden="true">&#9888;</span>
          <strong>Panel nicht verf&uuml;gbar</strong>
          <span>{error}</span>
          <button className="state-retry" type="button" onClick={() => window.location.reload()}>
            Neu laden
          </button>
        </section>
      </main>
    )
  }

  if (!data?.streamer) {
    return (
      <main className={`panel panel-${theme}`}>
        <section className="state">
          <span className="state-icon" aria-hidden="true">&#128269;</span>
          <strong>Kein Channel gefunden</strong>
          <span>&Ouml;ffne das Panel &uuml;ber Twitch oder nutze ?channel=login f&uuml;r die Entwicklung.</span>
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
        <span className={data.live?.is_live ? 'status-badge status-badge-live' : 'status-badge'}>
          {data.live?.is_live ? 'Live' : 'Offline'}
        </span>
      </section>

      {data?.meta?.badges_enabled && profileBadges && profileBadges.profile_badges.length > 0 && (
        <div
          className="ne-badges"
          style={{ '--accent': profileBadges.accent_color || accent }}
        >
          {profileBadges.profile_badges.map((key) => {
            const label = BADGE_LABELS[key]
            if (!label) return null
            return (
              <span key={key} className="ne-badge-pill">{label}</span>
            )
          })}
        </div>
      )}

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
        {currentTab === 'home' && (
          <HomeTab
            announcements={announcements}
            commands={commands}
            games={data.games}
            live={data.live}
            nextStream={nextStream}
            suggestions={suggestions}
            suggestionsUrl={suggestionsUrl}
          />
        )}

        {currentTab === 'plan' && (
          <>
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
            <Agenda items={nextStream?.agenda_items} streamStart={nextStream?.starts_at_local || nextStream?.starts_at} />
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
            {sponsor && (
              <section className="sponsor-card">
                <div className="sponsor-header">
                  {sponsor.logo_url && (
                    <img className="sponsor-logo" src={sponsor.logo_url} alt="" loading="lazy" />
                  )}
                  <strong className="sponsor-name">{sponsor.name}</strong>
                </div>
                {sponsor.description && (
                  <p className="sponsor-desc">{sponsor.description}</p>
                )}
                <div className="sponsor-actions">
                  {sponsor.link && (
                    <a
                      className="button sponsor-cta"
                      href={sponsor.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Zum Sponsor
                      <span className="external" aria-hidden="true">↗</span>
                    </a>
                  )}
                  {sponsor.affiliate_active && (
                    <span className="affiliate-notice">{sponsor.affiliate_text}</span>
                  )}
                </div>
              </section>
            )}

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
                    aria-label={`${link.label}${link.description ? ` — ${link.description}` : ''} extern öffnen`}
                  >
                    <BrandIcon network={link.network} />
                    <span className="button-text">
                      <span className="button-label">{link.label}</span>
                      {link.description && (
                        <span className="button-desc">{link.description}</span>
                      )}
                    </span>
                    <span className="external" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ))}
              </nav>
            )}

            {!sponsor && !discordLink && visibleLinks.length === 0 && (
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
            suggestions={suggestions}
            suggestionsUrl={suggestionsUrl}
          />
        )}
      </section>
    </main>
  )
}

export default App
