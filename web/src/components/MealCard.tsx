import { Minus, Plus } from "lucide-react";

import { MacroBadges } from "@/components/MacroBadges";
import { Button } from "@/components/ui/button";
import { GOAL_LABELS } from "@/data/meals";
import { formatIQD } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Meal } from "@/types";

interface MealCardProps {
  meal: Meal;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  className?: string;
}

/** Meal card: vignetted photo, macro chips, IQD price and an emerald add action. */
export function MealCard({ meal, quantity, onAdd, onRemove, className }: MealCardProps) {
  const inCart = quantity > 0;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-md border bg-card transition-all duration-300",
        inCart ? "border-primary/70 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]" : "border-border hover:border-primary/40",
        !meal.available && "opacity-60",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
        <img
          src={meal.image}
          alt={meal.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_40%,transparent_25%,hsl(240_9%_4%/0.75)_100%)]" />
        <div className="absolute right-2 top-2 flex gap-1">
          {meal.goals.map((goal) => (
            <span
              key={goal}
              className="rounded-sm border border-white/15 bg-background/70 px-2 py-0.5 text-[10px] font-bold text-foreground/90 backdrop-blur-sm"
            >
              {GOAL_LABELS[goal]}
            </span>
          ))}
        </div>
        {!meal.available && (
          <span className="absolute inset-x-0 bottom-0 bg-destructive/85 py-1 text-center text-xs font-bold text-foreground">
            غير متوفرة اليوم
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold leading-snug text-foreground">{meal.name}</h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{meal.description}</p>
        </div>

        <MacroBadges meal={meal} size="sm" />

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <span className="tnum text-lg font-extrabold text-primary">{formatIQD(meal.price)}</span>

          {inCart ? (
            <div className="flex items-center gap-1 rounded-md border border-primary/50 bg-sunken p-0.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                aria-label={`إنقاص ${meal.name}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span key={quantity} className="tnum w-6 animate-count-pulse text-center text-sm font-extrabold">
                {quantity}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-primary hover:text-primary"
                onClick={onAdd}
                aria-label={`زيادة ${meal.name}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={onAdd}
              disabled={!meal.available}
              className="h-9 gap-1.5 rounded-md bg-primary px-4 text-xs font-extrabold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              أضف للطلب
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
