'use client'

import { useState } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/contexts/NotificationContext'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications()

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'success': return 'bg-green-100 text-green-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
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
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1 text-gray-600 dark:text-gray-300" />
                    Mark all read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </Button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.timestamp.toLocaleString()}
                        </p>
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