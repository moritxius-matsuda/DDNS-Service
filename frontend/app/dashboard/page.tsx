'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Eye, EyeOff, Clock } from 'lucide-react'
import HostnameModal from '@/components/HostnameModal'
import LogsModal from '@/components/LogsModal'

interface Hostname {
  hostname: string
  ip: string
  ttl: number
  userId: string
  createdAt: string
  lastUpdated: string
  updatedBy: string
}

interface Log {
  hostname: string
  oldIp?: string
  newIp?: string
  action?: string
  timestamp: string
  updatedBy: string
  userAgent?: string
}

export default function Dashboard() {
  const { user } = useUser()
  const [hostnames, setHostnames] = useState<Hostname[]>([])
  const [loading, setLoading] = useState(true)
  const [apiToken, setApiToken] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false)
  const [editingHostname, setEditingHostname] = useState<Hostname | null>(null)
  const [selectedHostnameLogs, setSelectedHostnameLogs] = useState<string>('')
  const [logs, setLogs] = useState<Log[]>([])

  useEffect(() => {
    if (user) {
      fetchHostnames()
      loadApiToken()
    }
  }, [user])

  const loadApiToken = () => {
    const token = localStorage.getItem('ddns_api_token')
    if (token) {
      setApiToken(token)
    }
  }

  const fetchHostnames = async () => {
    try {
      const token = localStorage.getItem('ddns_api_token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_DDNS_API_URL}/api/hostnames`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHostnames(data)
      } else if (response.status === 401) {
        localStorage.removeItem('ddns_api_token')
        setApiToken(null)
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Hostnames')
    } finally {
      setLoading(false)
    }
  }

  const generateApiToken = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_DDNS_API_URL}/api/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.emailAddresses[0]?.emailAddress
        })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('ddns_api_token', data.token)
        setApiToken(data.token)
        toast.success('API Token erstellt!')
        fetchHostnames()
      } else {
        toast.error('Fehler beim Erstellen des API Tokens')
      }
    } catch (error) {
      toast.error('Fehler beim Erstellen des API Tokens')
    }
  }

  const handleSaveHostname = async (hostnameData: Partial<Hostname>) => {
    try {
      const token = localStorage.getItem('ddns_api_token')
      if (!token) return

      const url = editingHostname 
        ? `${process.env.NEXT_PUBLIC_DDNS_API_URL}/api/hostnames/${editingHostname.hostname}`
        : `${process.env.NEXT_PUBLIC_DDNS_API_URL}/api/hostnames`
      
      const method = editingHostname ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(hostnameData)
      })

      if (response.ok) {
        toast.success(editingHostname ? 'Hostname aktualisiert!' : 'Hostname erstellt!')
        fetchHostnames()
        setIsModalOpen(false)
        setEditingHostname(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      toast.error('Fehler beim Speichern')
    }
  }

  const handleDeleteHostname = async (hostname: string) => {
    if (!confirm('Hostname wirklich löschen?')) return

    try {
      const token = localStorage.getItem('ddns_api_token')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_DDNS_API_URL}/api/hostnames/${hostname}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Hostname gelöscht!')
        fetchHostnames()
      } else {
        toast.error('Fehler beim Löschen')
      }
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  const fetchLogs = async (hostname: string) => {
    try {
      const token = localStorage.getItem('ddns_api_token')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_DDNS_API_URL}/api/hostnames/${hostname}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data)
        setSelectedHostnameLogs(hostname)
        setIsLogsModalOpen(true)
      } else {
        toast.error('Fehler beim Laden der Logs')
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Logs')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!apiToken) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">API Token benötigt</h2>
          <p className="text-gray-600 mb-6">
            Sie benötigen einen API Token, um Hostnames zu verwalten.
          </p>
          <button
            onClick={generateApiToken}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium"
          >
            API Token erstellen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Hostnames</h1>
          <p className="mt-2 text-sm text-gray-700">
            Verwalten Sie Ihre DDNS Hostnames (maximal 2 pro Account)
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setEditingHostname(null)
              setIsModalOpen(true)
            }}
            disabled={hostnames.length >= 2}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Hostname hinzufügen
          </button>
        </div>
      </div>

      {/* API Token Section */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">API Token</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Verwenden Sie diesen Token für Router-Updates und Python-Scripts.</p>
          </div>
          <div className="mt-5">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={apiToken}
                  readOnly
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                />
              </div>
              <button
                onClick={() => setShowToken(!showToken)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(apiToken)
                  toast.success('Token kopiert!')
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Kopieren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hostnames Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hostname
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Adresse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TTL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Letztes Update
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hostnames.map((hostname) => (
                    <tr key={hostname.hostname}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {hostname.hostname}.dm1lx.de
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {hostname.ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hostname.ttl}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(hostname.lastUpdated).toLocaleString('de-DE')}
                        <br />
                        <span className="text-xs text-gray-400">
                          via {hostname.updatedBy}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => fetchLogs(hostname.hostname)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingHostname(hostname)
                              setIsModalOpen(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHostname(hostname.hostname)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hostnames.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Keine Hostnames vorhanden</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <HostnameModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingHostname(null)
        }}
        onSave={handleSaveHostname}
        hostname={editingHostname}
      />

      <LogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        hostname={selectedHostnameLogs}
        logs={logs}
      />
    </div>
  )
}