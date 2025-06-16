'use client'

import { Dialog } from '@headlessui/react'
import { X, Clock, User, Globe } from 'lucide-react'

interface Log {
  hostname: string
  oldIp?: string
  newIp?: string
  action?: string
  timestamp: string
  updatedBy: string
  userAgent?: string
}

interface LogsModalProps {
  isOpen: boolean
  onClose: () => void
  hostname: string
  logs: Log[]
}

export default function LogsModal({ isOpen, onClose, hostname, logs }: LogsModalProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getLogIcon = (log: Log) => {
    if (log.action === 'created') {
      return <Globe className="h-4 w-4 text-green-500" />
    }
    return <Clock className="h-4 w-4 text-blue-500" />
  }

  const getLogDescription = (log: Log) => {
    if (log.action === 'created') {
      return `Hostname erstellt mit IP ${log.newIp || log.ip}`
    }
    if (log.oldIp && log.newIp) {
      return `IP geändert von ${log.oldIp} zu ${log.newIp}`
    }
    return 'Hostname aktualisiert'
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white p-6 shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Logs für {hostname}.dm1lx.de
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Keine Logs vorhanden</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getLogIcon(log)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {getLogDescription(log)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>via {log.updatedBy}</span>
                          </div>
                          {log.userAgent && (
                            <div className="flex items-center space-x-1">
                              <Globe className="h-3 w-3" />
                              <span className="truncate max-w-xs" title={log.userAgent}>
                                {log.userAgent}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Schließen
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}