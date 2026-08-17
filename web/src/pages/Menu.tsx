import { ArrowLeft, RotateCcw, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { MealCard } from "@/components/MealCard";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { GOAL_LABELS, GOAL_ORDER } from "@/data/meals";
import { formatIQD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDrDiet } from "@/store/DrDietStore";
import type { Goal, Meal } from "@/types";

type SortKey = "protein" | "priceAsc" | "priceDesc" | "calories";

const SORT_LABELS: Record<SortKey, string> = {
  protein: "الأعلى بروتين",
  calories: "الأقل سعرات",
  priceAsc: "السعر: من الأقل",
  priceDesc: "السعر: من الأعلى",
};

const MIN_CALORIES = 300;
const MAX_CALORIES = 800;

export default function MenuPage() {
  const { meals, quantityOf, addToCart, decrementFromCart, cartCount, cartTotal } = useDrDiet();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [calorieRange, setCalorieRange] = useState<number[]>([MIN_CALORIES, MAX_CALORIES]);
  const [minProtein, setMinProtein] = useState<number[]>([0]);
  const [sort, setSort] = useState<SortKey>("protein");
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  const filtered = useMemo<Meal[]>(() => {
    const [lowCal, highCal] = calorieRange;
    const result = meals.filter((meal) => {
      const goalMatch = goals.length === 0 || goals.some((goal) => meal.goals.includes(goal));
      const calorieMatch = meal.calories >= lowCal && meal.calories <= highCal;
      const proteinMatch = meal.protein >= minProtein[0];
      return goalMatch && calorieMatch && proteinMatch;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "protein":
          return b.protein - a.protein;
        case "calories":
          return a.calories - b.calories;
        case "priceAsc":
          return a.price - b.price;
        case "priceDesc":
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }, [meals, goals, calorieRange, minProtein, sort]);

  const toggleGoal = (goal: Goal) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((item) => item !== goal) : [...prev, goal]));
  };

  const resetFilters = () => {
    setGoals([]);
    setCalorieRange([MIN_CALORIES, MAX_CALORIES]);
    setMinProtein([0]);
    setSort("protein");
  };

  const filterRail = (
    <div className="space-y-7">
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-extrabold text-foreground">الهدف</legend>
        {GOAL_ORDER.map((goal) => (
          <div key={goal} className="flex items-center justify-between gap-3">
            <Label htmlFor={`goal-${goal}`} className="cursor-pointer text-sm text-muted-foreground">
              {GOAL_LABELS[goal]}
            </Label>
            <Checkbox
              id={`goal-${goal}`}
              checked={goals.includes(goal)}
              onCheckedChange={() => toggleGoal(goal)}
              className="border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
          </div>
        ))}
      </fieldset>

      <div className="h-px bg-border" />

      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-extrabold text-foreground">السعرات</span>
          <span className="tnum text-xs text-muted-foreground" dir="ltr">
            {calorieRange[0]} - {calorieRange[1]}
          </span>
        </div>
        <Slider
          value={calorieRange}
          onValueChange={setCalorieRange}
          min={MIN_CALORIES}
          max={MAX_CALORIES}
          step={10}
          minStepsBetweenThumbs={1}
          aria-label="نطاق السعرات"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-extrabold text-foreground">بروتين لا يقل عن</span>
          <span className="tnum text-xs text-accent">{minProtein[0]}غ</span>
        </div>
        <Slider value={minProtein} onValueChange={setMinProtein} min={0} max={60} step={1} aria-label="أقل بروتين" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={resetFilters}
        className="w-full gap-2 border-primary/40 bg-transparent text-sm font-extrabold text-primary hover:bg-primary/10 hover:text-primary"
      >
        <RotateCcw className="h-4 w-4" />
        إعادة ضبط الفلاتر
      </Button>
    </div>
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground sm:text-4xl">قائمة وجبات دكتور دايت</h1>
            <p className="tnum text-sm text-muted-foreground">{filtered.length} وجبة متاحة حسب الفلاتر الحالية</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className="gap-2 border-border bg-card text-sm font-bold lg:hidden"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" />
              الفلاتر
            </Button>

            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger className="h-10 w-[210px] border-border bg-card text-sm font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <SelectItem key={key} value={key} className="text-sm">
                    ترتيب حسب: {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside
            className={cn(
              "panel h-fit p-5 lg:sticky lg:top-24 lg:block",
              filtersOpen ? "block" : "hidden",
            )}
            aria-label="فلاتر الوجبات"
          >
            {filterRail}
          </aside>

          <div>
            {filtered.length === 0 ? (
              <div className="panel flex flex-col items-center gap-4 p-14 text-center">
                <p className="text-base font-extrabold text-foreground">ما كو وجبة تطابق هذه الفلاتر</p>
                <p className="text-sm text-muted-foreground">جرّب توسيع نطاق السعرات أو تقليل حد البروتين.</p>
                <Button type="button" variant="outline" onClick={resetFilters} className="gap-2 border-primary/40 text-primary">
                  <RotateCcw className="h-4 w-4" />
                  إعادة ضبط الفلاتر
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    quantity={quantityOf(meal.id)}
                    onAdd={() => {
                      addToCart(meal.id);
                      toast.success("تمت الإضافة للسلة", { description: meal.name });
                    }}
                    onRemove={() => decrementFromCart(meal.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {cartCount > 0 && (
        <div className="sticky bottom-0 z-40 animate-slide-up-bar border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
            <span className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-md border border-border bg-sunken">
                <ShoppingCart className="h-5 w-5 text-foreground" />
                <span className="tnum absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
                  {cartCount}
                </span>
              </span>
              <span className="tnum text-sm font-bold text-muted-foreground">{cartCount} وجبات في السلة</span>
            </span>

            <span className="tnum mr-auto flex items-baseline gap-2 text-sm text-muted-foreground">
              المجموع
              <span className="text-xl font-extrabold text-primary">{formatIQD(cartTotal)}</span>
            </span>

            <Button
              asChild
              className="h-11 gap-2 rounded-md bg-primary px-7 text-sm font-extrabold text-primary-foreground cta-glow transition-transform hover:bg-primary/90 active:scale-95"
            >
              <Link to="/checkout">
                إتمام الطلب
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
