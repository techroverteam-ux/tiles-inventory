'use client'

import { useState } from 'react'
import { Bell, X, Check, CheckCheck, Trash2, Dot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/contexts/NotificationContext'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    clearAllNotifications,
    unreadCount,
  } = useNotifications()

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-destructive/10 text-destructive'
      case 'warning': return 'bg-secondary text-secondary-foreground'
      case 'success': return 'bg-primary/10 text-primary'
      default: return 'bg-accent text-accent-foreground'
    }
  }

  const formatTimestamp = (value: Date) => {
    const date = new Date(value)
    const day = String(date.getDate()).padStart(2, '0')
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]
    const year = date.getFullYear()
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${day}-${month}-${year} ${time}`
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full text-xs text-destructive-foreground flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-popover rounded-lg shadow-lg border border-border z-50 text-popover-foreground">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1 text-muted-foreground" />
                    Read all
                  </Button>
                )}
                {notifications.some((n) => n.read) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteReadNotifications}
                    className="text-xs"
                    title="Delete all read notifications"
                  >
                    <CheckCheck className="h-3 w-3 mr-1 text-muted-foreground" />
                    Delete read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-xs"
                    title="Delete all notifications"
                  >
                    <Trash2 className="h-3 w-3 mr-1 text-muted-foreground" />
                    Clear all
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 border-b border-border hover:bg-accent cursor-pointer ${
                      !notification.read ? 'bg-accent/50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                          {!notification.read && (
                            <Dot className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm text-foreground">{notification.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/80 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      <div className="ml-3 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (notification.read) {
                              markAsUnread(notification.id)
                            } else {
                              markAsRead(notification.id)
                            }
                          }}
                          title={notification.read ? 'Mark as unread' : 'Mark as read'}
                        >
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          title="Delete notification"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}