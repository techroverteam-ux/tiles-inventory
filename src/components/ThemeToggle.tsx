'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      case 'dark':
        return <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      case 'system':
        return <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      default:
        return <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme}
      title={`Current theme: ${theme}`}
      className="transition-smooth"
    >
      {getIcon()}
    </Button>
  )
}