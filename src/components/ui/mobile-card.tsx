import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-3 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
MobileCard.displayName = "MobileCard"

interface MobileCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
}

const MobileCardHeader = React.forwardRef<HTMLDivElement, MobileCardHeaderProps>(
  ({ className, title, subtitle, badge, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-start justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700", className)}
      {...props}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-1 ml-2">
          {actions}
        </div>
      )}
    </div>
  )
)
MobileCardHeader.displayName = "MobileCardHeader"

interface MobileCardFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  fullWidth?: boolean
}

const MobileCardField = React.forwardRef<HTMLDivElement, MobileCardFieldProps>(
  ({ className, label, value, fullWidth = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        fullWidth 
          ? "py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
          : "flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0", 
        className
      )}
      {...props}
    >
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}:</span>
      <span className={cn(
        "text-sm text-gray-900 dark:text-gray-100",
        fullWidth ? "block" : "text-right"
      )}>{value}</span>
    </div>
  )
)
MobileCardField.displayName = "MobileCardField"

interface MobileCardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const MobileCardActions = React.forwardRef<HTMLDivElement, MobileCardActionsProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700", className)}
      {...props}
    >
      {children}
    </div>
  )
)
MobileCardActions.displayName = "MobileCardActions"

interface MobileStatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
}

const MobileStatsCard = React.forwardRef<HTMLDivElement, MobileStatsCardProps>(
  ({ className, title, value, subtitle, icon, trend, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-1",
              trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              <span className="text-xs font-medium">{trend.value}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
)
MobileStatsCard.displayName = "MobileStatsCard"

export { MobileCard, MobileCardHeader, MobileCardField, MobileCardActions, MobileStatsCard }