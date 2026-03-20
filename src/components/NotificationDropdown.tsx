'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Trash2, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/contexts/NotificationContext'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import Link from 'next/link'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  
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

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Disable body scroll when mobile notification is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, isMobile])

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'error': return { bg: 'bg-destructive/10', text: 'text-destructive', icon: AlertCircle }
      case 'warning': return { bg: 'bg-warning/10', text: 'text-warning', icon: AlertTriangle }
      case 'success': return { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle }
      default: return { bg: 'bg-info/10', text: 'text-info', icon: Info }
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

  const notificationContent = (
    <NotificationListContent 
      notifications={notifications}
      unreadCount={unreadCount}
      onClose={() => setIsOpen(false)}
      markAsRead={markAsRead}
      deleteNotification={deleteNotification}
      markAllAsRead={markAllAsRead}
      deleteReadNotifications={deleteReadNotifications}
      clearAllNotifications={clearAllNotifications}
      getTypeStyles={getTypeStyles}
      formatTimestamp={formatTimestamp}
      isMobile={isMobile}
    />
  )

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-9 w-9 p-0 rounded-full hover:bg-accent border border-transparent hover:border-border transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className={`h-5 w-5 ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-background shadow-sm"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && mounted && (
          <>
            {/* Backdrop - Portaled for Mobile */}
            {isMobile ? createPortal(
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm cursor-default" 
                onClick={() => setIsOpen(false)}
              />,
              document.body
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] cursor-default" 
                onClick={() => setIsOpen(false)}
              />
            )}

            {/* Notification Content - Desktop Dropdown */}
            {!isMobile && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute right-0 mt-3 w-[400px] max-h-[min(calc(100vh-120px),600px)] bg-card rounded-xl shadow-2xl border border-border z-50 overflow-hidden flex flex-col"
              >
                {notificationContent}
              </motion.div>
            )}

            {/* Notification Content - Mobile Bottom Sheet - Portaled */}
            {isMobile && createPortal(
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 glass rounded-t-[2.5rem] shadow-premium z-[101] max-h-[90vh] flex flex-col border-t border-border/40 overflow-hidden"
              >
                <div className="flex justify-center pt-4 pb-2">
                  <div className="w-12 h-1.5 bg-muted/40 rounded-full cursor-grab active:cursor-grabbing" onClick={() => setIsOpen(false)} />
                </div>
                <div className="flex-1 overflow-hidden flex flex-col px-4 pb-12">
                  {notificationContent}
                </div>
              </motion.div>,
              document.body
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotificationListContent({ 
  notifications, 
  unreadCount, 
  onClose, 
  markAsRead, 
  deleteNotification, 
  markAllAsRead, 
  deleteReadNotifications, 
  clearAllNotifications, 
  getTypeStyles, 
  formatTimestamp,
  isMobile
}: any) {
  return (
    <>
      <div className={`p-4 border-b border-border/50 ${isMobile ? 'pt-2' : 'bg-muted/30'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`${isMobile ? 'text-2xl' : 'text-base'} font-bold text-foreground`}>Notifications</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
              {unreadCount} UNREAD
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive group transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-[11px] px-3 rounded-xl font-bold border-primary/20 hover:border-primary text-primary bg-primary/5 hover:bg-primary/10 transition-all"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Read all
            </Button>
          )}
          {notifications.some((n: any) => n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={deleteReadNotifications}
              className="h-8 text-[11px] px-3 rounded-xl font-bold border-border/50 hover:border-border transition-all"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Delete read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={clearAllNotifications}
              className="h-8 text-[11px] px-3 rounded-xl font-bold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear all
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin-violet">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-16 text-center flex flex-col items-center justify-center`}
            >
              <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-base text-foreground font-bold">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">No new notifications to show right now.</p>
            </motion.div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification: any) => {
                const styles = getTypeStyles(notification.type)
                const Icon = styles.icon
                return (
                  <motion.div 
                    layout
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`p-4 border-b border-border/40 hover:bg-accent/40 cursor-pointer transition-colors relative group ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2.5 rounded-xl ${styles.bg} ${styles.text} shadow-sm flex-shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-bold truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground font-medium'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 animate-pulse shadow-[0_0_8px_hsla(var(--primary)/0.5)]" />
                          )}
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${!notification.read ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <span className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 ${isMobile ? 'opacity-100' : ''}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
      
      {notifications.length > 5 && (
        <div className="p-2 border-t border-border bg-muted/10 text-center">
          <Link href="/notifications" onClick={onClose}>
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
              View all notifications
            </Button>
          </Link>
        </div>
      )}
    </>
  )
}