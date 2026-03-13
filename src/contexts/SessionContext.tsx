'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface SessionContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  resetIdleTimer: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const IDLE_TIMEOUT = 20 * 60 * 1000 // 20 minutes in milliseconds
const WARNING_TIMEOUT = 18 * 60 * 1000 // 18 minutes - show warning 2 minutes before logout

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null)
  const [warningTimer, setWarningTimer] = useState<NodeJS.Timeout | null>(null)
  const [showIdleWarning, setShowIdleWarning] = useState(false)
  
  const router = useRouter()
  
  // Safely get toast function
  let showToast: ((message: string, type: 'success' | 'error' | 'info' | 'warning') => void) | null = null
  try {
    const toastContext = useToast()
    showToast = toastContext.showToast
  } catch (error) {
    // ToastProvider not available, continue without toast
    console.log('ToastProvider not available in SessionProvider')
  }

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (idleTimer) {
      clearTimeout(idleTimer)
      setIdleTimer(null)
    }
    if (warningTimer) {
      clearTimeout(warningTimer)
      setWarningTimer(null)
    }
    setShowIdleWarning(false)
  }, [idleTimer, warningTimer])

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    clearTimers()
    
    if (isAuthenticated) {
      // Set warning timer (18 minutes)
      const newWarningTimer = setTimeout(() => {
        setShowIdleWarning(true)
        if (showToast) {
          showToast('Your session will expire in 2 minutes due to inactivity', 'warning')
        }
      }, WARNING_TIMEOUT)
      
      // Set logout timer (20 minutes)
      const newIdleTimer = setTimeout(async () => {
        console.log('Session expired due to inactivity')
        await logout()
        if (showToast) {
          showToast('Session expired due to inactivity. Please login again.', 'error')
        }
      }, IDLE_TIMEOUT)
      
      setWarningTimer(newWarningTimer)
      setIdleTimer(newIdleTimer)
    }
  }, [isAuthenticated, clearTimers, showToast])

  // Activity event handlers
  const handleActivity = useCallback(() => {
    if (isAuthenticated && !showIdleWarning) {
      resetIdleTimer()
    }
  }, [isAuthenticated, showIdleWarning, resetIdleTimer])

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔄 SessionContext: Starting login...')
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      console.log('📞 SessionContext: Login response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        const userData = data.user
        
        console.log('👤 SessionContext: User data received:', userData)
        
        setUser(userData)
        setIsAuthenticated(true)
        
        console.log('💾 SessionContext: Storing user data in localStorage')
        // Store user data in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('lastActivity', Date.now().toString())
        
        // Start idle timer
        resetIdleTimer()
        
        console.log('✅ SessionContext: Login successful, authentication state updated')
        
        // Show toast if available
        if (showToast) {
          showToast('Login successful!', 'success')
        }
        return true
      } else {
        const errorData = await response.json()
        console.log('❌ SessionContext: Login failed:', errorData)
        if (showToast) {
          showToast(errorData.error || 'Login failed', 'error')
        }
        return false
      }
    } catch (error) {
      console.error('💥 SessionContext: Login error:', error)
      if (showToast) {
        showToast('Login failed. Please try again.', 'error')
      }
      return false
    } finally {
      setIsLoading(false)
      console.log('🏁 SessionContext: Login process completed')
    }
  }, [resetIdleTimer, showToast])

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      clearTimers()
      
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Clear local state
      setUser(null)
      setIsAuthenticated(false)
      
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('lastActivity')
      
      // Redirect to login
      router.push('/login')
      
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [clearTimers, router])

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('lastActivity', Date.now().toString())
        resetIdleTimer()
      } else {
        // Session invalid, logout
        await logout()
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      await logout()
    }
  }, [resetIdleTimer, logout])

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true)
        
        // Check localStorage for existing session
        const storedUser = localStorage.getItem('user')
        const lastActivity = localStorage.getItem('lastActivity')
        
        if (storedUser && lastActivity) {
          const timeSinceLastActivity = Date.now() - parseInt(lastActivity)
          
          // If more than 20 minutes have passed, clear session
          if (timeSinceLastActivity > IDLE_TIMEOUT) {
            localStorage.removeItem('user')
            localStorage.removeItem('lastActivity')
            router.push('/login')
            return
          }
          
          // Verify session with server
          await refreshSession()
        } else {
          // No stored session, redirect to login if not already there
          if (window.location.pathname !== '/login') {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    initializeSession()
  }, [refreshSession, router])

  // Set up activity listeners
  useEffect(() => {
    if (isAuthenticated) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
      
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true)
      })

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true)
        })
      }
    }
  }, [isAuthenticated, handleActivity])

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Page became visible, check if session is still valid
        const lastActivity = localStorage.getItem('lastActivity')
        if (lastActivity) {
          const timeSinceLastActivity = Date.now() - parseInt(lastActivity)
          if (timeSinceLastActivity > IDLE_TIMEOUT) {
            logout()
            return
          }
        }
        resetIdleTimer()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAuthenticated, logout, resetIdleTimer])

  // Update last activity timestamp
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('lastActivity', Date.now().toString())
    }
  }, [isAuthenticated])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshSession,
    resetIdleTimer
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
      
      {/* Idle Warning Modal */}
      {showIdleWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Session Expiring</h3>
                <p className="text-sm text-muted-foreground">Your session will expire in 2 minutes</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              You've been inactive for a while. Click "Stay Logged In" to continue your session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowIdleWarning(false)
                  resetIdleTimer()
                  if (showToast) {
                    showToast('Session extended', 'success')
                  }
                }}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={logout}
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}