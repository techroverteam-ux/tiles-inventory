'use client'

import { useNotifications } from '@/contexts/NotificationContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function NotificationsPage() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    clearAllNotifications,
    unreadCount,
  } = useNotifications()

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

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 space-y-8 pb-10">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="page-title">Notifications</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary/60" />
              Manage your system alerts and updates
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 sm:pt-0">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
              className="rounded-xl font-bold gap-2 border-primary/20 text-primary hover:bg-primary/10"
            >
              <Check className="h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="secondary"
              onClick={clearAllNotifications}
              className="rounded-xl font-bold gap-2 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/50 rounded-[2.5rem] overflow-hidden glass-card shadow-premium">
        <CardContent className="p-0">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-20 text-center flex flex-col items-center justify-center"
              >
                <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                  <Bell className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-bold text-foreground">You're all caught up!</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">No new notifications to show. We'll alert you when something important happens.</p>
                <Link href="/" className="mt-8">
                  <Button variant="outline" className="rounded-xl font-bold">Return to Dashboard</Button>
                </Link>
              </motion.div>
            ) : (
              <div className="divide-y divide-border/40">
                {notifications.map((notification) => {
                  const styles = getTypeStyles(notification.type)
                  const Icon = styles.icon
                  return (
                    <motion.div 
                      layout
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-6 hover:bg-muted/30 transition-all relative group ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-6">
                        <div className={`p-4 rounded-[1.25rem] ${styles.bg} ${styles.text} shadow-sm flex-shrink-0`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h4 className={`text-lg font-bold truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <Badge className="bg-primary shadow-[0_0_10px_hsla(var(--primary)/0.4)] animate-pulse">New</Badge>
                            )}
                          </div>
                          <p className={`text-base leading-relaxed ${!notification.read ? 'text-foreground/80' : 'text-muted-foreground/70'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-4">
                            <span className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-full hover:bg-primary/10 text-primary"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-5 w-5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full hover:bg-destructive/10 text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
