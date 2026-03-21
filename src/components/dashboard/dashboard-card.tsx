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
  primary: 'from-primary/20 to-primary/5 text-primary border-primary/20',
  success: 'from-success/20 to-success/5 text-success border-success/20',
  warning: 'from-warning/20 to-warning/5 text-warning border-warning/20',
  destructive: 'from-destructive/20 to-destructive/5 text-destructive border-destructive/20',
  info: 'from-info/20 to-info/5 text-info border-info/20',
}

const iconBgMap = {
  primary: 'bg-primary/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  destructive: 'bg-destructive/10',
  info: 'bg-info/10',
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
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
          "bg-gradient-to-br hover:shadow-xl hover:shadow-primary/5",
          colorMap[color],
          className
        )}
      >
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={cn(
              "p-2.5 rounded-xl transition-colors duration-300",
              iconBgMap[color],
              "group-hover:bg-background/80"
            )}>
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
                className: cn("h-5 w-5", (icon.props as any).className) 
              }) : icon}
            </div>
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
          </div>
          
          <div>
            <p className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black tracking-tight text-foreground">{value}</h2>
              {subtitle && (
                <span className="text-xs font-medium opacity-60 truncate">{subtitle}</span>
              )}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-current opacity-[0.03] blur-2xl group-hover:opacity-[0.05] transition-opacity" />
      </motion.div>
    </Link>
  )
}
