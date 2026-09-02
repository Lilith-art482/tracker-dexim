"use client";

import { TASK_COLOR_OPTIONS, taskColorRing } from "@/lib/task-colors";
import { cn } from "@/lib/utils";

export function TaskColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TASK_COLOR_OPTIONS.map((option) => {
        const selected = (value || "") === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            title={option.label}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-all",
              option.swatch,
              selected
                ? cn(
                    "ring-2 ring-offset-2 ring-offset-background",
                    taskColorRing(option.value),
                  )
                : "hover:scale-110",
            )}
          >
            {selected && (
              <span className="h-2 w-2 rounded-full bg-white/90 shadow-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
}
