import { cn } from "@/lib/utils";

/** The دكتور دايت | DR. DIET lockup used in the header, footer and admin sidebar. */
export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="brand-latin text-xl leading-none text-foreground sm:text-2xl">DR. DIET</span>
      <span className="h-5 w-px bg-border" aria-hidden="true" />
      <span
        className={cn(
          "text-base font-extrabold leading-none text-primary sm:text-lg",
          compact && "hidden sm:inline",
        )}
      >
        دكتور دايت
      </span>
    </span>
  );
}
