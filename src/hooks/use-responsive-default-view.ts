import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

export type ViewMode = "grid" | "list"

/**
 * Device defaults only (no persistence):
 * - Desktop/Laptop: list
 * - Mobile/Tablet: grid
 */
export function useResponsiveDefaultView() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [view, setView] = React.useState<ViewMode>("grid")

  return { view, setView, isMobile }
}

