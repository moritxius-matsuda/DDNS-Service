'use client'

import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import HostnameManager from '../components/HostnameManager'

export default function Home() {
  const { isSignedIn, user } = useUser()

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              DM1LX DDNS Service
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Verwalten Sie Ihre dynamischen DNS-Einträge für *.dm1lx.de
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <SignInButton mode="modal">
              <button className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Anmelden
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">DM1LX DDNS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Willkommen, {user.firstName || user.emailAddresses[0].emailAddress}
              </span>
              <SignOutButton>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Abmelden
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <HostnameManager />
        </div>
      </main>
    </div>
  )
}