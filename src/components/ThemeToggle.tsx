'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { actualTheme, toggleTheme } = useTheme()

  const getIcon = () => {
    switch (actualTheme) {
      case 'light':
        return <Sun className="h-5 w-5 text-muted-foreground" />
      case 'dark':
        return <Moon className="h-5 w-5 text-muted-foreground" />
      default:
        return <Monitor className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme}
      title={`Current theme: ${actualTheme}`}
      className="transition-smooth"
    >
      {getIcon()}
    </Button>
  )
}