'use client'

import { useState } from 'react'
import { User, ChevronDown, Settings, HelpCircle, LogOut, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserDropdownProps {
  onLogout: () => void
}

export default function UserDropdown({ onLogout }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { icon: UserCircle, label: 'Profile', action: () => console.log('Profile') },
    { icon: Settings, label: 'Account Settings', action: () => console.log('Settings') },
    { icon: HelpCircle, label: 'Help & Support', action: () => console.log('Help') },
    { icon: LogOut, label: 'Sign Out', action: onLogout, danger: true }
  ]

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-300" />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-3 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Admin User</p>
                  <p className="text-xs text-gray-500">admin@tiles.com</p>
                </div>
              </div>
            </div>
            
            <div className="py-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.action()
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    item.danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <item.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}