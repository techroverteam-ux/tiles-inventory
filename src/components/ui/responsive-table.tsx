import * as React from "react"
import { cn } from "@/lib/utils"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MobileCard, MobileCardField } from "./table"

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface ResponsiveTableProps {
  columns: Column[]
  data: any[]
  className?: string
  onRowClick?: (row: any) => void
}

export function ResponsiveTable({ columns, data, className, onRowClick }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow 
                key={index} 
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "cursor-pointer" : ""}
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => (
          <MobileCard 
            key={index}
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
          >
            {columns.map((column) => (
              <MobileCardField
                key={column.key}
                label={column.label}
                value={column.render ? column.render(row[column.key], row) : row[column.key]}
              />
            ))}
          </MobileCard>
        ))}
      </div>
    </div>
  )
}