import { useState, useEffect } from 'react'
import { Activity, Cpu, RefreshCw } from 'lucide-react'
import './App.css'

interface Stats {
  requestCount: number
  modelUsed: string
  lastResponse?: string
}

function App() {
  const [stats, setStats] = useState<Stats>({ 
    requestCount: 0, 
    modelUsed: 'Loading...',
    lastResponse: 'Awaiting first request...'
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString())

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setStats(data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container">
      <header>
        <h1>Claude Proxy Dashboard</h1>
        <p>Real-time monitoring of your LLM requests</p>
      </header>

      <div className="grid">
        <div className="card">
          <div className="card-header">
            <Activity className="icon text-blue" />
            <h2>Total Requests</h2>
          </div>
          <div className="card-value">{stats.requestCount}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <Cpu className="icon text-purple" />
            <h2>Model Used</h2>
          </div>
          <div className="card-value small">{stats.modelUsed || 'N/A'}</div>
        </div>
      </div>

      <div className="card response-card">
        <div className="card-header">
          <Activity className="icon text-green" />
          <h2>Last AI Response</h2>
        </div>
        <div className="card-value response-text">
          {stats.lastResponse}
        </div>
      </div>

      <div className="controls">
        <button onClick={fetchStats} disabled={loading} className="btn">
          <RefreshCw className={`icon-sm ${loading ? 'spin' : ''}`} />
          Refresh Now
        </button>
      </div>

      <footer>
        <p>Last updated: {lastUpdated} • Updates every 5 seconds • Connected to http://localhost:3000</p>
      </footer>
    </div>
  )
}

export default App
