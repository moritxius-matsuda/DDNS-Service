'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export default function HostnameManager() {
  const { user } = useUser()
  const [hostnames, setHostnames] = useState([])
  const [newHostname, setNewHostname] = useState('')
  const [newIP, setNewIP] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      fetchHostnames()
      fetchApiKey()
    }
  }, [user])

  const fetchHostnames = async () => {
    try {
      const response = await fetch('/api/hostnames')
      if (response.ok) {
        const data = await response.json()
        setHostnames(data.hostnames)
      }
    } catch (err) {
      console.error('Error fetching hostnames:', err)
    }
  }

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/apikey')
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
      }
    } catch (err) {
      console.error('Error fetching API key:', err)
    }
  }

  const addHostname = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/hostnames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname: newHostname,
          ip: newIP,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Hostname erfolgreich hinzugefügt!')
        setNewHostname('')
        setNewIP('')
        fetchHostnames()
      } else {
        setError(data.error || 'Fehler beim Hinzufügen des Hostnames')
      }
    } catch (err) {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  const deleteHostname = async (hostname) => {
    if (!confirm(`Möchten Sie ${hostname}.dm1lx.de wirklich löschen?`)) {
      return
    }

    try {
      const response = await fetch('/api/hostnames', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hostname }),
      })

      if (response.ok) {
        setSuccess('Hostname erfolgreich gelöscht!')
        fetchHostnames()
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Löschen des Hostnames')
      }
    } catch (err) {
      setError('Netzwerkfehler')
    }
  }

  const generateNewApiKey = async () => {
    try {
      const response = await fetch('/api/apikey', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
        setSuccess('Neuer API-Schlüssel generiert!')
      } else {
        setError('Fehler beim Generieren des API-Schlüssels')
      }
    } catch (err) {
      setError('Netzwerkfehler')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* API Key Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">API-Schlüssel</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ihr API-Schlüssel für automatische Updates:
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={apiKey}
                readOnly
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50"
              />
              <button
                onClick={() => navigator.clipboard.writeText(apiKey)}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
              >
                Kopieren
              </button>
            </div>
          </div>
          <button
            onClick={generateNewApiKey}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Neuen API-Schlüssel generieren
          </button>
        </div>
      </div>

      {/* Add Hostname Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Neuen Hostname hinzufügen</h2>
        <form onSubmit={addHostname} className="space-y-4">
          <div>
            <label htmlFor="hostname" className="block text-sm font-medium text-gray-700">
              Hostname
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="hostname"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="meinhost"
                required
              />
              <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                .dm1lx.de
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="ip" className="block text-sm font-medium text-gray-700">
              IP-Adresse
            </label>
            <input
              type="text"
              id="ip"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="192.168.1.100"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Wird hinzugefügt...' : 'Hostname hinzufügen'}
          </button>
        </form>
      </div>

      {/* Hostnames List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ihre Hostnames</h2>
        {hostnames.length === 0 ? (
          <p className="text-gray-500">Keine Hostnames vorhanden.</p>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hostname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP-Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zuletzt aktualisiert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hostnames.map((hostname) => (
                  <tr key={hostname.hostname}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {hostname.hostname}.dm1lx.de
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {hostname.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(hostname.lastUpdated).toLocaleString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteHostname(hostname.hostname)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Verwendung</h2>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-900">Python-Skript:</h3>
            <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`python update_ddns.py --hostname meinhost --api-key ${apiKey}`}
            </pre>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">API-Aufruf:</h3>
            <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`curl -X POST https://yourdomain.com/api/ddns/update \\
  -H "Content-Type: application/json" \\
  -d '{"hostname": "meinhost", "apiKey": "${apiKey}"}'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}