'use client'

import * as React from "react"
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  required?: boolean
  emptyMessage?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  className,
  required = false,
  emptyMessage = "No options found."
}: SearchableSelectProps) {
  const [query, setQuery] = React.useState("")

  const filteredOptions = query === ""
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase())
      )

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className={cn("relative w-full", className)}>
      <Combobox
        value={value}
        onChange={(val: string | null) => {
          if (val !== null) onValueChange(val)
        }}
        disabled={disabled}
        onClose={() => setQuery("")}
      >
        <div className="relative w-full cursor-default overflow-hidden rounded-xl border border-input bg-muted/10 text-left transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 hover:bg-muted/20">
          <ComboboxInput
            className="w-full border-none py-2.5 pl-4 pr-10 text-sm leading-5 text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground/60 font-medium h-11"
            displayValue={() => selectedOption?.label || ""}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            required={required}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown
              className="h-4 w-4 text-muted-foreground/60 transition-colors hover:text-foreground"
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>
        <ComboboxOptions
          anchor={{ to: 'bottom start', gap: '4px' }}
          className="z-[9999] min-w-[var(--input-width)] w-max max-h-60 overflow-auto rounded-2xl border border-border bg-popover/95 backdrop-blur-xl py-2 text-base shadow-[0_8px_30px_rgba(0,0,0,0.3)] ring-1 ring-black/5 focus:outline-none sm:text-sm no-scrollbar [--anchor-gap:4px] empty:hidden transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
        >
          {filteredOptions.length === 0 && query !== "" ? (
            <div className="relative cursor-default select-none py-3 px-4 text-muted-foreground font-medium italic">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxOption
                key={option.value}
                className={({ active }: { active: boolean }) =>
                  cn(
                    "relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors duration-150",
                    active ? "bg-primary/10 text-primary" : "text-foreground"
                  )
                }
                value={option.value}
              >
                {({ selected, active }: { selected: boolean; active: boolean }) => (
                  <>
                    <span className={cn("block truncate", selected ? "font-bold text-primary" : "font-medium")}>
                      {option.label}
                    </span>
                    {selected ? (
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 flex items-center pl-3 text-primary"
                        )}
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>
    </div>
  )
}
