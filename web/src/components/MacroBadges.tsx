import { cn } from "@/lib/utils";
import type { Meal } from "@/types";

interface MacroBadgesProps {
  meal: Pick<Meal, "protein" | "carbs" | "fat" | "calories">;
  className?: string;
  size?: "sm" | "md";
}

/** Sharp macro chips — protein in gold, calories in emerald, rest muted. */
export function MacroBadges({ meal, className, size = "md" }: MacroBadgesProps) {
  const base = cn(
    "inline-flex items-center gap-1 rounded-sm border bg-sunken tnum whitespace-nowrap",
    size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]",
  );

  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <li className={cn(base, "border-accent/40 text-accent")}>
        <span className="font-bold">بروتين</span>
        <span className="font-extrabold">{meal.protein}غ</span>
      </li>
      <li className={cn(base, "border-border text-muted-foreground")}>
        <span>كارب</span>
        <span className="font-bold text-foreground/80">{meal.carbs}غ</span>
      </li>
      <li className={cn(base, "border-border text-muted-foreground")}>
        <span>دهون</span>
        <span className="font-bold text-foreground/80">{meal.fat}غ</span>
      </li>
      <li className={cn(base, "border-primary/40 text-primary")}>
        <span className="font-extrabold">{meal.calories}</span>
        <span>سعرة</span>
      </li>
    </ul>
  );
}
