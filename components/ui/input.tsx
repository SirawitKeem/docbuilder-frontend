import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base: tenant-hub field geometry
        "h-9 w-full min-w-0 rounded-[8px] border-0 bg-white px-3 py-2 text-sm text-foreground",
        // Shadow-as-border (--elevation-field pattern)
        "shadow-[inset_0_0_0_1px_#D4D4D4,0_1px_2px_rgba(16,24,40,0.05)]",
        "transition-[background-color,box-shadow,color] duration-100 outline-none",
        "placeholder:text-muted-foreground",
        // Focus: violet brand ring (tenant-hub --border-brand)
        "focus-visible:shadow-[inset_0_0_0_2px_#8B5CF6,0_1px_2px_rgba(16,24,40,0.05)]",
        // Error state
        "aria-invalid:bg-red-50 aria-invalid:shadow-[inset_0_0_0_2px_#EF4444,0_1px_2px_rgba(16,24,40,0.05)]",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        // Dark mode
        "dark:bg-muted/30 dark:shadow-[inset_0_0_0_1px_#404040,0_1px_2px_rgba(0,0,0,0.2)]",
        "dark:focus-visible:shadow-[inset_0_0_0_2px_#A78BFA,0_1px_2px_rgba(0,0,0,0.2)]",
        "dark:placeholder:text-muted-foreground",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
