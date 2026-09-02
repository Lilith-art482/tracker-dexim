"use client"

import { cn } from "@/lib/utils"

interface SectionDividerProps {
  variant?: "timeline" | "dots" | "gantt"
  className?: string
}

export function SectionDivider({ variant = "timeline", className }: SectionDividerProps) {
  if (variant === "timeline") {
    return (
      <div className={cn("relative py-12 flex items-center justify-center", className)}>
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="relative flex items-center gap-4 bg-background px-6">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/60 ring-4 ring-primary/10" />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full bg-primary/50",
                  i === 1 ? "w-8" : "w-4",
                )}
              />
            ))}
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-primary/60 ring-4 ring-primary/10" />
        </div>
      </div>
    )
  }

  if (variant === "gantt") {
    return (
      <div className={cn("relative py-12 flex items-center justify-center", className)}>
        <div className="flex items-center gap-3 max-w-lg w-full px-6">
          <div className="w-3 h-3 rounded-full bg-primary/60 ring-4 ring-primary/10 shrink-0" />
          <div className="flex-1 h-px bg-gradient-to-r from-primary/50 via-border to-primary/50" />
          <div className="flex gap-1.5 items-center">
            <div className="w-10 h-1.5 rounded-full bg-primary/30" />
            <div className="w-16 h-1.5 rounded-full bg-primary/50" />
            <div className="w-6 h-1.5 rounded-full bg-primary/30" />
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/50 via-border to-primary/50" />
          <div className="w-3 h-3 rounded-full bg-primary/60 ring-4 ring-primary/10 shrink-0" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative py-10 flex items-center justify-center", className)}>
      <div className="flex items-center gap-5 px-6">
        <div className="w-20 h-px bg-gradient-to-r from-transparent to-border" />
        <div className="flex gap-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full",
                i === 2 ? "w-2.5 h-2.5 bg-primary/70 ring-3 ring-primary/15" : "w-2 h-2 bg-primary/35",
              )}
            />
          ))}
        </div>
        <div className="w-20 h-px bg-gradient-to-l from-transparent to-border" />
      </div>
    </div>
  )
}
