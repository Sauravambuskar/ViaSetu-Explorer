import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ref, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
