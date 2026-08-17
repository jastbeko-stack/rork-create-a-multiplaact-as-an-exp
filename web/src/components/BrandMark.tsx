import { BRAND_LOGO } from "@/data/images";
import { cn } from "@/lib/utils";

/** The دكتور دايت logo lockup used in the header, footer and admin sidebar. */
export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img
        src={BRAND_LOGO}
        alt="دكتور دايت"
        width={44}
        height={44}
        className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
      />
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
