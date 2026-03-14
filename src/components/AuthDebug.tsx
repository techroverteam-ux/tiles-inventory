'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/contexts/SessionContext'

export default function AuthDebug() {
  const { user, isAuthenticated, isLoading } = useSession()
  const [hasLocalUser, setHasLocalUser] = useState(false)
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    setHasLocalUser(!!localStorage.getItem('user'))
    setCurrentPath(window.location.pathname)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">🔍 Auth Debug</div>
      <div>Loading: {isLoading ? '✅' : '❌'}</div>
      <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
      <div>User: {user ? '✅' : '❌'}</div>
      {user && (
        <div className="mt-2 text-xs">
          <div>ID: {user.id}</div>
          <div>Email: {user.email}</div>
          <div>Name: {user.name}</div>
          <div>Role: {user.role}</div>
        </div>
      )}
      <div className="mt-2">
        <div>LocalStorage User: {hasLocalUser ? '✅' : '❌'}</div>
        <div>Current Path: {currentPath || 'N/A'}</div>
      </div>
    </div>
  )
}