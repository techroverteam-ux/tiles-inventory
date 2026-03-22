'use client'

import * as React from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Popover, PopoverButton, PopoverPanel, Transition, Portal } from '@headlessui/react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface DatePickerProps {
  date?: Date | string
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  label?: string
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
  const selectedDate = React.useMemo(() => {
    if (!date) return undefined
    return typeof date === 'string' ? parseISO(date) : date
  }, [date])

  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date())

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, -1)) // Wait, subMonths subtacts. subMonths(d, 1) is prev. 
  // correction:
  const goNext = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goPrev = () => setCurrentMonth(subMonths(currentMonth, 1))

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <Popover className="relative">
        {({ close }) => (
          <>
            <PopoverButton
              disabled={disabled}
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-muted/10 px-4 py-2 text-sm transition-all duration-200 hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
                !selectedDate && "text-muted-foreground",
                className
              )}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {selectedDate ? format(selectedDate, 'dd-MMM-yyyy') : placeholder}
                </span>
              </div>
              {selectedDate && !disabled && (
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(undefined);
                  }}
                  className="hover:text-destructive transition-colors p-1 rounded-md"
                >
                  <X className="h-3 w-3" />
                </div>
              )}
              {!selectedDate && <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-270" style={{ transform: 'rotate(-90deg)' }} />}
            </PopoverButton>

            <Portal>
              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <PopoverPanel 
                  anchor="bottom start"
                  className="z-[9999] mt-2 w-72 rounded-3xl border border-border bg-popover/95 p-5 shadow-premium backdrop-blur-xl focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex items-center justify-between mb-5 px-1">
                    <h2 className="text-sm font-bold text-foreground">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-muted"
                        onClick={goPrev}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-muted"
                        onClick={goNext}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-tighter opacity-70">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => {
                      const isSelected = selectedDate && isSameDay(day, selectedDate)
                      const isTodayDate = isToday(day)
                      const isCurrentMonth = isSameMonth(day, currentMonth)

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            onChange(day)
                            close()
                          }}
                          className={cn(
                            "h-9 w-9 rounded-xl text-xs font-medium transition-all duration-200 relative flex items-center justify-center",
                            !isCurrentMonth && "text-muted-foreground/20",
                            isCurrentMonth && !isSelected && "hover:bg-primary/10 hover:text-primary",
                            isSelected && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 z-10",
                            isTodayDate && !isSelected && "text-primary font-bold after:content-[''] after:absolute after:bottom-1.5 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                          )}
                        >
                          {format(day, 'd')}
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-[10px] font-bold uppercase tracking-widest h-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors"
                      onClick={() => {
                        const today = new Date()
                        setCurrentMonth(today)
                        onChange(today)
                        close()
                      }}
                    >
                      Today
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-[10px] font-bold uppercase tracking-widest h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => {
                        onChange(undefined)
                        close()
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverPanel>
              </Transition>
            </Portal>
          </>
        )}
      </Popover>
    </div>
  )
}
