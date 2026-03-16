'use client'

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAsUnread: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  deleteReadNotifications: () => void
  clearAllNotifications: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationEventDetail {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      const mapped: Notification[] = (data.notifications || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        read: Boolean(item.read),
        timestamp: new Date(item.timestamp),
      }))
      setNotifications(mapped)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    void (async () => {
      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(notification),
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        const created = data.notification
        if (!created) return

        const createdNotification: Notification = {
          id: created.id,
          title: created.title,
          message: created.message,
          type: created.type,
          read: Boolean(created.read),
          timestamp: new Date(created.timestamp),
        }

        setNotifications((prev) => [createdNotification, ...prev])
      } catch (error) {
        console.error('Failed to add notification:', error)
      }
    })()
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationEventDetail>
      const detail = customEvent.detail
      if (!detail?.message || !detail?.type) return

      addNotification({
        title: detail.title || 'Notification',
        message: detail.message,
        type: detail.type,
      })
    }

    window.addEventListener('app:notification:add', handler as EventListener)
    return () => {
      window.removeEventListener('app:notification:add', handler as EventListener)
    }
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    )

    void fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ read: true }),
    })
  }

  const markAsUnread = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: false } : notif)
    )

    void fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ read: false }),
    })
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))

    void fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'markAllRead' }),
    })
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))

    void fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  }

  const deleteReadNotifications = () => {
    setNotifications(prev => prev.filter(notif => !notif.read))

    void fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'deleteRead' }),
    })
  }

  const clearAllNotifications = () => {
    setNotifications([])

    void fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'clearAll' }),
    })
  }

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      deleteNotification,
      deleteReadNotifications,
      clearAllNotifications,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}