'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  href: string
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info'
  className?: string
}

const colorMap = {
  primary: 'text-primary border-primary/10 hover:border-primary/30',
  success: 'text-success border-success/10 hover:border-success/30',
  warning: 'text-warning border-warning/10 hover:border-warning/30',
  destructive: 'text-destructive border-destructive/10 hover:border-destructive/30',
  info: 'text-info border-info/10 hover:border-info/30',
}

const iconBgMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  href,
  color = 'primary',
  className
}: DashboardCardProps) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "group relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-all duration-500",
          "glass-card bg-card/60 hover:bg-card/80 shadow-premium hover:shadow-2xl hover:shadow-primary/5",
          colorMap[color],
          className
        )}
      >
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={cn(
              "p-3 rounded-2xl transition-all duration-500",
              iconBgMap[color],
              "group-hover:scale-110 group-hover:rotate-3 shadow-sm"
            )}>
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
                className: cn("h-5 w-5 sm:h-6 sm:w-6", (icon.props as any).className) 
              }) : icon}
            </div>
            <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground opacity-80 group-hover:text-foreground transition-colors">{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-none">{value}</h2>
              {subtitle && (
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground opacity-60 truncate group-hover:opacity-100 transition-opacity">{subtitle}</span>
              )}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className={cn(
          "absolute -right-6 -bottom-6 h-32 w-32 rounded-full opacity-[0.03] blur-3xl transition-all duration-700 group-hover:opacity-[0.08] group-hover:scale-125",
          color === 'primary' && "bg-primary",
          color === 'success' && "bg-success",
          color === 'warning' && "bg-warning",
          color === 'destructive' && "bg-destructive",
          color === 'info' && "bg-info"
        )} />
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
      </motion.div>
    </Link>
  )
}
