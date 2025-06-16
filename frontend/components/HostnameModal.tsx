'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { X } from 'lucide-react'

interface Hostname {
  hostname: string
  ip: string
  ttl: number
  userId: string
  createdAt: string
  lastUpdated: string
  updatedBy: string
}

interface HostnameModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (hostname: Partial<Hostname>) => void
  hostname?: Hostname | null
}

export default function HostnameModal({ isOpen, onClose, onSave, hostname }: HostnameModalProps) {
  const [formData, setFormData] = useState({
    hostname: '',
    ip: '',
    ttl: 300
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (hostname) {
      setFormData({
        hostname: hostname.hostname,
        ip: hostname.ip,
        ttl: hostname.ttl
      })
    } else {
      setFormData({
        hostname: '',
        ip: '',
        ttl: 300
      })
    }
    setErrors({})
  }, [hostname, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.hostname.trim()) {
      newErrors.hostname = 'Hostname ist erforderlich'
    } else if (!/^[a-zA-Z0-9-]+$/.test(formData.hostname)) {
      newErrors.hostname = 'Hostname darf nur Buchstaben, Zahlen und Bindestriche enthalten'
    } else if (formData.hostname.length > 63) {
      newErrors.hostname = 'Hostname darf maximal 63 Zeichen lang sein'
    }

    if (!formData.ip.trim()) {
      newErrors.ip = 'IP-Adresse ist erforderlich'
    } else if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(formData.ip)) {
      newErrors.ip = 'Ungültige IPv4-Adresse'
    }

    if (formData.ttl < 60 || formData.ttl > 86400) {
      newErrors.ttl = 'TTL muss zwischen 60 und 86400 Sekunden liegen'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {hostname ? 'Hostname bearbeiten' : 'Neuen Hostname erstellen'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="hostname" className="block text-sm font-medium text-gray-700">
                Hostname
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="hostname"
                  value={formData.hostname}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                  disabled={!!hostname} // Disable editing hostname for existing entries
                  className="block w-full rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100"
                  placeholder="myhome"
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                  .dm1lx.de
                </span>
              </div>
              {errors.hostname && (
                <p className="mt-1 text-sm text-red-600">{errors.hostname}</p>
              )}
            </div>

            <div>
              <label htmlFor="ip" className="block text-sm font-medium text-gray-700">
                IP-Adresse
              </label>
              <input
                type="text"
                id="ip"
                value={formData.ip}
                onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono"
                placeholder="192.168.1.100"
              />
              {errors.ip && (
                <p className="mt-1 text-sm text-red-600">{errors.ip}</p>
              )}
            </div>

            <div>
              <label htmlFor="ttl" className="block text-sm font-medium text-gray-700">
                TTL (Sekunden)
              </label>
              <input
                type="number"
                id="ttl"
                value={formData.ttl}
                onChange={(e) => setFormData({ ...formData, ttl: parseInt(e.target.value) || 300 })}
                min="60"
                max="86400"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.ttl && (
                <p className="mt-1 text-sm text-red-600">{errors.ttl}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Zeit in Sekunden, wie lange DNS-Einträge gecacht werden (60-86400)
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {hostname ? 'Aktualisieren' : 'Erstellen'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}