import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [theme, setTheme] = useState('dark')
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!window.Twitch?.ext) {
      console.log('Twitch Extension Helper nicht verfügbar')
      return
    }

    window.Twitch.ext.onAuthorized((auth) => {
      console.log('Authorized:', auth)
      setAuthorized(true)
    })

    window.Twitch.ext.onContext((context) => {
      if (context.theme) {
        setTheme(context.theme)
      }
    })
  }, [])

  return (
    <main className={`panel panel-${theme}`}>
      <section className="card">
        <h1>NiceEins Panel</h1>
        <p className="subtitle">Dein dynamisches Streamer-Panel läuft.</p>

        <div className="box">
          <span>Nächster Stream</span>
          <strong>Heute 19:00 Uhr</strong>
        </div>

        <div className="box">
          <span>Status</span>
          <strong>{authorized ? 'Mit Twitch verbunden' : 'Dev Preview'}</strong>
        </div>

        <a className="button" href="https://niceeins.de" target="_blank" rel="noreferrer">
          NiceEins öffnen
        </a>
      </section>
    </main>
  )
}

export default App
