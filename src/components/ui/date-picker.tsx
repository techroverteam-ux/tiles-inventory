'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, setMonth, setYear, getMonth, getYear } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  date?: Date | string
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  label?: string
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getYearRange() {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let y = current + 1; y >= current - 10; y--) years.push(y)
  return years
}

export function DatePicker({
  date,
  onChange,
  placeholder = 'Select date',
  className,
  disabled,
  required,
  label
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  const selectedDate = React.useMemo(() => {
    if (!date) return undefined
    return typeof date === 'string' ? parseISO(date) : date
  }, [date])

  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date())

  React.useEffect(() => {
    if (selectedDate) setCurrentMonth(selectedDate)
  }, [selectedDate])

  // Position the portal dropdown below the trigger
  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = 380

    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      // Open upward
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 6,
        left: rect.left,
        width: 288,
        zIndex: 9999,
      })
    } else {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: 288,
        zIndex: 9999,
      })
    }
  }, [])

  const handleOpen = () => {
    if (disabled) return
    updatePosition()
    setOpen(v => !v)
  }

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on scroll/resize
  React.useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const years = React.useMemo(() => getYearRange(), [])
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const dropdown = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="w-72 rounded-3xl border border-border bg-popover shadow-xl p-5 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Month/Year nav */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <select
          value={getMonth(currentMonth)}
          onChange={(e) => setCurrentMonth(setMonth(currentMonth, Number(e.target.value)))}
          className="flex-1 text-sm font-bold text-foreground bg-popover border-none outline-none cursor-pointer text-center appearance-none hover:text-primary transition-colors"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i} className="bg-popover text-foreground">{m}</option>
          ))}
        </select>

        <select
          value={getYear(currentMonth)}
          onChange={(e) => setCurrentMonth(setYear(currentMonth, Number(e.target.value)))}
          className="w-16 text-sm font-bold text-foreground bg-popover border-none outline-none cursor-pointer text-center appearance-none hover:text-primary transition-colors"
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-popover text-foreground">{y}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-tighter opacity-70">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          return (
            <button
              key={idx}
              type="button"
              onClick={() => { onChange(day); setOpen(false) }}
              className={cn(
                'h-9 w-9 rounded-xl text-xs font-medium transition-all duration-150 relative flex items-center justify-center',
                !isCurrentMonth && 'text-muted-foreground/25 pointer-events-none',
                isCurrentMonth && !isSelected && 'hover:bg-primary/10 hover:text-primary',
                isSelected && 'bg-primary text-primary-foreground shadow-md scale-105 z-10',
                isTodayDate && !isSelected && "text-primary font-bold after:content-[''] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full"
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => { const t = new Date(); setCurrentMonth(t); onChange(t); setOpen(false) }}
          className="flex-1 text-[10px] font-bold uppercase tracking-widest h-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => { onChange(undefined); setOpen(false) }}
          className="flex-1 text-[10px] font-bold uppercase tracking-widest h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )

  return (
    <div className={cn('relative w-full', className)}>
      {label && (
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5 block">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-muted/20 px-4 py-2 text-sm transition-all duration-200 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
          !selectedDate && 'text-muted-foreground'
        )}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">
            {selectedDate ? format(selectedDate, 'dd-MMM-yyyy') : placeholder}
          </span>
        </div>
        {selectedDate && !disabled ? (
          <div
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(undefined); setOpen(false) }}
            className="hover:text-destructive transition-colors p-1 rounded-md"
          >
            <X className="h-3 w-3" />
          </div>
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
        )}
      </button>

      {mounted && open && createPortal(dropdown, document.body)}
    </div>
  )
}
