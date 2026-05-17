import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'https://niceeins.de/wp-json/niceeins-extension/v1/panel'
const MAX_UPCOMING = 3

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

function formatLiveSince(value) {
  if (!value) return null

  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
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
  const liveSince = formatLiveSince(data?.live?.since)

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
        {data.live?.is_live && <span className="live">Live</span>}
      </section>

      <section className="card">
        <div className="card-head">
          <span className="eyebrow">Nächster Stream</span>
          {nextStream?.category?.name && <span className="pill">{nextStream.category.name}</span>}
        </div>
        {nextStream ? (
          <>
            <strong>{formatDate(nextStream.starts_at_local || nextStream.starts_at)}</strong>
            <p>{nextStream.title || 'Stream'}</p>
          </>
        ) : (
          <p>Aktuell ist kein öffentlicher Stream geplant.</p>
        )}
      </section>

      {visibleUpcoming.length > 0 && (
        <section className="list">
          {visibleUpcoming.map((stream) => (
            <article key={stream.id} className="stream">
              <span>{formatDate(stream.starts_at_local || stream.starts_at)}</span>
              <strong>{stream.title || 'Stream'}</strong>
              {stream.category?.name && <small>{stream.category.name}</small>}
            </article>
          ))}
        </section>
      )}

      {data.live && (
        <section className="status">
          <span>Status</span>
          <strong>{data.live.is_live ? data.live.title || 'Live auf Twitch' : 'Aktuell offline'}</strong>
          {(data.live.game || liveSince) && (
            <small>{[data.live.game, liveSince ? `seit ${liveSince}` : null].filter(Boolean).join(' · ')}</small>
          )}
        </section>
      )}

      {data.links?.length > 0 && (
        <nav className="links" aria-label="Community Links">
          {data.links.slice(0, 5).map((link) => (
            <a key={`${link.network}-${link.url}`} className="button" href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </main>
  )
}

export default App
