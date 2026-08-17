import { CalendarDays, Flame, Package, Target, Truck, Utensils } from "lucide-react";
import { Link } from "react-router-dom";

import { MacroBadges } from "@/components/MacroBadges";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { daysUntil, formatIQD, formatNumber } from "@/lib/format";
import { calculateMacros, type CalculatorGoal } from "@/lib/macros";
import { useDrDiet } from "@/store/DrDietStore";

export default function MySubscription() {
  const { mySubscription, orders, meals } = useDrDiet();

  if (!mySubscription) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md border border-border bg-card">
            <Package className="h-7 w-7 text-muted-foreground" />
          </span>
          <h1 className="mb-3 text-3xl font-black text-foreground">ما عندك اشتراك فعّال</h1>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            احسب احتياجك اليومي من السعرات والماكروز، اختر وجباتك، واشترك مع دكتور دايت — راح تشوف تفاصيل اشتراكك هنا.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="h-12 rounded-md bg-primary px-7 text-base font-extrabold text-primary-foreground cta-glow hover:bg-primary/90"
            >
              <Link to="/checkout">اشترك الآن</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-md border-border px-7 text-base font-extrabold">
              <Link to="/menu">تصفح وجبات الدكتور</Link>
            </Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const goalForMacros: CalculatorGoal =
    mySubscription.goal === "إنقاص وزن" ? "تنشيف" : (mySubscription.goal as CalculatorGoal);

  const macros = calculateMacros({
    weightKg: mySubscription.weightKg,
    heightCm: mySubscription.heightCm,
    age: mySubscription.age,
    goal: goalForMacros,
    gender: "ذكر",
    activity: 1.55,
  });

  const remaining = Math.max(0, daysUntil(mySubscription.endDate));
  const totalDays = Math.max(
    1,
    Math.round(
      (new Date(`${mySubscription.endDate}T00:00:00`).getTime() -
        new Date(`${mySubscription.startDate}T00:00:00`).getTime()) /
        86_400_000,
    ),
  );
  const elapsed = Math.min(100, Math.max(0, ((totalDays - remaining) / totalDays) * 100));
  const latestOrder = orders[0] ?? null;
  const suggestedMeals = meals
    .filter((meal) => (goalForMacros === "تنشيف" ? meal.calories <= 560 : meal.protein >= 45))
    .slice(0, 3);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">اشتراكي</p>
            <h1 className="text-3xl font-black text-foreground sm:text-4xl">أهلاً {mySubscription.name}</h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            اشتراك نشط — {mySubscription.goal}
          </span>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="space-y-6">
            <div className="panel p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  مدة الاشتراك
                </h2>
                <span className="tnum text-sm text-muted-foreground" dir="ltr">
                  {mySubscription.startDate} → {mySubscription.endDate}
                </span>
              </div>

              <Progress value={elapsed} className="h-2 bg-sunken" />

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <Stat value={formatNumber(remaining)} label="يوم متبقي" tone="primary" />
                <Stat value={formatNumber(totalDays)} label="يوم كامل" tone="plain" />
                <Stat value={formatNumber(mySubscription.mealsPerDay)} label="وجبة يومياً" tone="accent" />
              </div>
            </div>

            <div className="panel p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold text-foreground">
                <Flame className="h-5 w-5 text-accent" />
                أهدافك اليومية
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat value={formatNumber(macros.calories)} label="سعرة يومياً" tone="primary" boxed />
                <Stat value={`${macros.protein}غ`} label="بروتين" tone="accent" boxed />
                <Stat value={`${macros.carbs}غ`} label="كارب" tone="plain" boxed />
                <Stat value={`${macros.fat}غ`} label="دهون" tone="plain" boxed />
              </div>
              <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-3">
                <Detail label="العمر" value={`${mySubscription.age} سنة`} />
                <Detail label="الطول" value={`${mySubscription.heightCm} سم`} />
                <Detail label="الوزن" value={`${mySubscription.weightKg} كغم`} />
              </dl>
            </div>

            <div className="panel p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold text-foreground">
                <Utensils className="h-5 w-5 text-primary" />
                وجبات مقترحة لهدفك
              </h2>
              <ul className="space-y-3">
                {suggestedMeals.map((meal) => (
                  <li key={meal.id} className="flex items-center gap-3 rounded-md border border-border bg-sunken p-3">
                    <img src={meal.image} alt="" loading="lazy" className="h-14 w-14 rounded-sm object-cover" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-sm font-extrabold text-foreground">{meal.name}</p>
                      <MacroBadges meal={meal} size="sm" />
                    </div>
                    <span className="tnum shrink-0 text-sm font-extrabold text-primary">{formatIQD(meal.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="panel p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-foreground">
                <Truck className="h-5 w-5 text-primary" />
                توصيلك القادم
              </h2>
              {latestOrder ? (
                <div className="space-y-3 text-sm">
                  <Detail label="العنوان" value={latestOrder.address} />
                  <Detail label="الوقت المفضل" value={latestOrder.deliveryWindow} />
                  <Detail label="رقم الهاتف" value={latestOrder.phone} />
                  <div className="mt-4 rounded-md border border-border bg-sunken p-4">
                    <p className="mb-3 text-xs font-extrabold text-muted-foreground">تفاصيل الطلب {latestOrder.id}</p>
                    <ul className="space-y-2">
                      {latestOrder.meals.map((line) => (
                        <li key={line.name} className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate text-foreground/85">
                            {line.name} × {line.quantity}
                          </span>
                          <span className="tnum shrink-0 text-muted-foreground">
                            {formatIQD(line.price * line.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-sm font-extrabold text-foreground">المجموع</span>
                      <span className="tnum text-lg font-extrabold text-primary">{formatIQD(latestOrder.total)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ما كو طلب مسجل بعد.</p>
              )}
            </div>

            <div className="panel space-y-4 p-6">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
                <Target className="h-5 w-5 text-accent" />
                تحتاج تعديل الخطة؟
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                وزنك أو هدفك تغيّر؟ أعد حساب الماكروز واختر وجبات جديدة، ودكتور دايت يحدّث باقتك.
              </p>
              <Button
                asChild
                className="h-11 w-full rounded-md bg-primary text-sm font-extrabold text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/checkout">إعادة حساب الماكروز</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Stat({
  value,
  label,
  tone,
  boxed = false,
}: {
  value: string;
  label: string;
  tone: "primary" | "accent" | "plain";
  boxed?: boolean;
}) {
  const color = tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <div className={boxed ? "rounded-md border border-border bg-sunken px-3 py-4 text-center" : "text-center"}>
      <p className={`tnum text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 sm:block">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold text-foreground">{value}</dd>
    </div>
  );
}
