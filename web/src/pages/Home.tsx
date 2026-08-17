import { ArrowLeft, ChefHat, ScanLine, Truck, Users, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { MealCard } from "@/components/MealCard";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { GOAL_LABELS, GOAL_ORDER } from "@/data/meals";
import { BRAND_LOGO } from "@/data/images";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDrDiet } from "@/store/DrDietStore";
import type { Goal } from "@/types";

const STEPS: { icon: typeof ScanLine; title: string; body: string }[] = [
  {
    icon: ScanLine,
    title: "احسب احتياجك",
    body: "أدخل وزنك وطولك وهدفك، ودكتور دايت يحسب سعراتك وماكروزك اليومية بدقة.",
  },
  {
    icon: ChefHat,
    title: "نطبخ ونوزن بالغرام",
    body: "كل وجبة تُطبخ يومياً بمكونات طازجة وتُوزن بالميزان قبل التغليف.",
  },
  {
    icon: Truck,
    title: "نوصلها لباب بيتك",
    body: "توصيل يومي 6 أيام بالأسبوع داخل البصرة بالوقت الذي تختاره.",
  },
];

export default function Home() {
  const { meals, quantityOf, addToCart, decrementFromCart, subscribers } = useDrDiet();
  const [filter, setFilter] = useState<Goal | "all">("all");

  const visibleMeals = useMemo(
    () => (filter === "all" ? meals : meals.filter((meal) => meal.goals.includes(filter))).slice(0, 6),
    [meals, filter],
  );

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border">
        {/* Ambient wash sampled from the brand key visual */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(45rem_32rem_at_26%_16%,hsl(111_45%_36%/0.10),transparent_66%),radial-gradient(40rem_30rem_at_88%_82%,hsl(219_62%_26%/0.10),transparent_66%)]"
        />
        <div aria-hidden="true" className="absolute inset-0 noise-veil" />

        <div className="relative mx-auto grid min-h-[560px] max-w-[1400px] items-center gap-10 px-4 py-16 sm:px-6 lg:min-h-[660px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
          <div className="animate-rise-in space-y-6">
            <span className="inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
              <Utensils className="h-3.5 w-3.5" />
              مطبخ دكتور دايت — البصرة
            </span>

            <h1 className="text-4xl font-black leading-[1.25] text-foreground sm:text-5xl lg:text-6xl">
              دكتور دايت — دقة بالمغذيات،
              <span className="block text-primary">أقصى نتائج لبناء الجسم واللياقة</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              وجبات مطبوخة يومياً وموزونة بالغرام، توصيل داخل البصرة.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                asChild
                className="h-12 rounded-md bg-primary px-7 text-base font-extrabold text-primary-foreground cta-glow transition-transform hover:bg-primary/90 active:scale-95"
              >
                <Link to="/checkout">اشترك الآن</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-md border-border bg-background/70 px-7 text-base font-extrabold text-foreground backdrop-blur transition-colors hover:border-primary/60 hover:bg-secondary"
              >
                <Link to="/menu">تصفح وجبات الدكتور</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[360px] animate-fade-in lg:max-w-[420px]">
            <span aria-hidden="true" className="absolute -inset-8 rounded-full bg-primary/10 blur-3xl" />
            <span
              aria-hidden="true"
              className="absolute -bottom-3 -left-3 h-24 w-24 rounded-md border-b-2 border-l-2 border-primary/60"
            />
            <span
              aria-hidden="true"
              className="absolute -right-3 -top-3 h-24 w-24 rounded-md border-r-2 border-t-2 border-accent/40"
            />
            <div className="relative flex aspect-square items-center justify-center rounded-md border border-border bg-card p-10 shadow-[0_28px_70px_-40px_hsl(219_62%_26%/0.55)]">
              <img
                src={BRAND_LOGO}
                alt="شعار دكتور دايت — وجبات صحية محسوبة بدقة"
                width={512}
                height={512}
                loading="eager"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="border-b border-border bg-sunken">
        <ul className="mx-auto grid max-w-[1400px] grid-cols-1 sm:grid-cols-3">
          {[
            { icon: Truck, value: "توصيل يومي 6 أيام", label: "داخل البصرة وضواحيها" },
            { icon: ScanLine, value: "وجبات موزونة بالغرام", label: "ماكروز دقيقة لكل صحن" },
            subscribers.length > 0
              ? {
                  icon: Users,
                  value: `${formatNumber(subscribers.length)} مشترك`,
                  label: "ثقوا بدكتور دايت",
                }
              : { icon: Users, value: "سجل كأول مشترك", label: "المطبخ جاهز يستقبل طلبك" },
          ].map((stat) => (
            <li
              key={stat.value}
              className="flex items-center gap-4 border-b border-border px-6 py-6 last:border-b-0 sm:border-b-0 sm:border-l sm:last:border-l-0"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </span>
              <span className="space-y-0.5">
                <span className="block text-sm font-extrabold text-foreground sm:text-base">{stat.value}</span>
                <span className="block text-xs text-muted-foreground">{stat.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Menu preview */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">وجبات دكتور دايت</h2>
            <p className="text-sm text-muted-foreground">اختر حسب هدفك — كل وجبة بماكروز واضحة وسعر بالدينار العراقي.</p>
          </div>
          <Link
            to="/menu"
            className="group inline-flex items-center gap-2 text-sm font-extrabold text-primary transition-colors hover:text-primary/80"
          >
            شاهد القائمة كاملة
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["all", ...GOAL_ORDER] as const).map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={cn(
                  "rounded-md border px-5 py-2 text-sm font-extrabold transition-all duration-200 active:scale-95",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {key === "all" ? "الكل" : GOAL_LABELS[key]}
              </button>
            );
          })}
        </div>

        {visibleMeals.length === 0 ? (
          <p className="panel p-10 text-center text-sm text-muted-foreground">لا توجد وجبات ضمن هذا التصنيف حالياً.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMeals.map((meal) => (
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
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-sunken">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-2xl font-black text-foreground sm:text-3xl">كيف يشتغل دكتور دايت؟</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="panel relative overflow-hidden p-6">
                <span className="brand-latin absolute -left-2 -top-4 text-7xl text-foreground/[0.07]">
                  0{index + 1}
                </span>
                <step.icon className="mb-4 h-6 w-6 text-accent" />
                <h3 className="mb-2 text-lg font-extrabold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="panel flex flex-col items-center gap-5 bg-gradient-to-l from-primary/[0.08] via-card to-accent/[0.06] p-10 text-center">
          <h2 className="max-w-2xl text-2xl font-black leading-relaxed text-foreground sm:text-3xl">
            جاهز تبدأ؟ احسب سعراتك واختر باقتك بأقل من دقيقتين.
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            حاسبة الماكروز تعطيك احتياجك اليومي وتقترح عدد الوجبات المناسب لهدفك.
          </p>
          <Button
            asChild
            className="h-12 rounded-md bg-primary px-8 text-base font-extrabold text-primary-foreground cta-glow transition-transform hover:bg-primary/90 active:scale-95"
          >
            <Link to="/checkout">احسب احتياجي واشترك</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
