import { ArrowRight, CheckCircle2, ChevronLeft, Minus, Plus, Trash2, User } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DELIVERY_FEE } from "@/data/meals";
import { addDays, formatIQD, formatNumber, toISODate } from "@/lib/format";
import { ACTIVITY_LEVELS, calculateMacros, type CalculatorGoal } from "@/lib/macros";
import { cn } from "@/lib/utils";
import { openWhatsAppOrder } from "@/lib/whatsapp";
import { useDrDiet } from "@/store/DrDietStore";

const GOALS: CalculatorGoal[] = ["تضخيم", "تثبيت", "تنشيف"];
const DELIVERY_WINDOWS = ["10:00 - 12:00 صباحاً", "2:00 - 4:00 عصراً", "6:00 - 8:00 مساءً", "8:00 - 10:00 مساءً"];
interface DurationOption {
  /** Length of the subscription in days. */
  days: number;
  label: string;
  hint: string;
}

/** Free delivery kicks in for subscriptions of a month or longer. */
const FREE_DELIVERY_FROM_DAYS = 30;

const DURATION_OPTIONS: DurationOption[] = [
  { days: 1, label: "يوم واحد", hint: "تجربة" },
  { days: 30, label: "شهر", hint: "30 يوم" },
  { days: 60, label: "شهرين", hint: "60 يوم" },
];

/** Delivery charge for a whole period (free for monthly plans). */
function deliveryFor(days: number, hasMeals: boolean): number {
  if (!hasMeals) return 0;
  return days >= FREE_DELIVERY_FROM_DAYS ? 0 : DELIVERY_FEE * days;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cartDetails, cartTotal, cartCount, addToCart, decrementFromCart, removeFromCart, clearCart, addSubscriber, addOrder, setMySubscriptionId } =
    useDrDiet();

  const [weight, setWeight] = useState<string>("84");
  const [height, setHeight] = useState<string>("178");
  const [age, setAge] = useState<string>("27");
  const [gender, setGender] = useState<"ذكر" | "أنثى">("ذكر");
  const [activity, setActivity] = useState<string>("1.55");
  const [goal, setGoal] = useState<CalculatorGoal>("تضخيم");

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [window_, setWindow_] = useState<string>(DELIVERY_WINDOWS[2]);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const macros = useMemo(
    () =>
      calculateMacros({
        weightKg: Math.min(250, Math.max(35, Number(weight) || 0)),
        heightCm: Math.min(230, Math.max(120, Number(height) || 0)),
        age: Math.min(90, Math.max(14, Number(age) || 0)),
        goal,
        gender,
        activity: Number(activity),
      }),
    [weight, height, age, goal, gender, activity],
  );

  const selectedDuration =
    DURATION_OPTIONS.find((option) => option.days === durationDays) ?? DURATION_OPTIONS[1];
  const durationLabel = `${selectedDuration.label} — ${selectedDuration.days} يوم`;

  /** cartTotal is the cost of one day of meals; the period multiplies it. */
  const dailyTotal = cartTotal;
  const mealsTotal = dailyTotal * durationDays;
  const deliveryTotal = deliveryFor(durationDays, cartCount > 0);
  const total = mealsTotal + deliveryTotal;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cartCount === 0) {
      toast.error("سلتك فارغة", { description: "أضف وجبات من قائمة دكتور دايت أولاً." });
      return;
    }
    if (name.trim().length < 3 || phone.trim().length < 8 || address.trim().length < 5) {
      toast.error("أكمل معلومات التوصيل", { description: "الاسم ورقم الهاتف والعنوان مطلوبة." });
      return;
    }

    setSubmitting(true);
    const startDate = toISODate(new Date());
    const orderMeals = cartDetails.map((entry) => ({
      name: entry.meal.name,
      quantity: entry.quantity,
      price: entry.meal.price,
    }));

    openWhatsAppOrder({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      deliveryWindow: window_,
      durationLabel,
      durationDays,
      mealsPerDay: cartCount,
      meals: orderMeals,
      dailyTotal,
      mealsTotal,
      deliveryFee: deliveryTotal,
      total,
      macros,
      body: {
        weightKg: Number(weight) || 75,
        heightCm: Number(height) || 170,
        age: Number(age) || 25,
        gender,
        goal,
      },
    });

    const subscriber = addSubscriber({
      name: name.trim(),
      phone: phone.trim(),
      age: Number(age) || 25,
      heightCm: Number(height) || 170,
      weightKg: Number(weight) || 75,
      goal,
      startDate,
      endDate: addDays(startDate, durationDays),
      mealsPerDay: cartCount,
    });

    addOrder({
      subscriberName: subscriber.name,
      phone: subscriber.phone,
      address: address.trim(),
      deliveryWindow: window_,
      meals: orderMeals,
      mealsPerDay: cartCount,
      dailyTotal,
      mealsTotal,
      deliveryFee: deliveryTotal,
      total,
      plan: goal,
      durationDays,
      durationLabel,
    });

    setMySubscriptionId(subscriber.id);
    clearCart();
    toast.success("تم تأكيد اشتراكك — افتح الواتساب وأرسل الطلب", {
      description: `${macros.planLabel} — ${durationLabel} — ${formatIQD(total)}`,
    });
    setSubmitting(false);
    navigate("/subscription");
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground" aria-label="مسار التنقل">
          <Link to="/menu" className="transition-colors hover:text-primary">
            الوجبات
          </Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="text-foreground">حاسبة الماكروز والدفع</span>
        </nav>

        <h1 className="mb-8 flex items-center gap-3 text-3xl font-black text-foreground sm:text-4xl">
          <User className="h-7 w-7 text-primary" />
          حاسبة الماكروز والدفع
        </h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calculator */}
          <section className="panel p-6" aria-labelledby="calc-title">
            <h2 id="calc-title" className="mb-6 text-xl font-extrabold text-foreground">
              احسب احتياجك اليومي
            </h2>

            <div className="space-y-4">
              <Field label="الوزن" unit="كغم">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  className="tnum h-12 border-0 bg-transparent text-center text-lg font-extrabold focus-visible:ring-0"
                />
              </Field>
              <Field label="الطول" unit="سم">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                  className="tnum h-12 border-0 bg-transparent text-center text-lg font-extrabold focus-visible:ring-0"
                />
              </Field>
              <Field label="العمر" unit="سنة">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  className="tnum h-12 border-0 bg-transparent text-center text-lg font-extrabold focus-visible:ring-0"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">الجنس</Label>
                  <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-sunken p-1">
                    {(["ذكر", "أنثى"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setGender(option)}
                        className={cn(
                          "rounded-sm py-2 text-sm font-extrabold transition-all active:scale-95",
                          gender === option ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">مستوى النشاط</Label>
                  <Select value={activity} onValueChange={setActivity}>
                    <SelectTrigger className="h-[46px] border-border bg-sunken text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover">
                      {ACTIVITY_LEVELS.map((level) => (
                        <SelectItem key={level.factor} value={String(level.factor)} className="text-sm">
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">الهدف</Label>
                <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-sunken p-1">
                  {GOALS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setGoal(option)}
                      aria-pressed={goal === option}
                      className={cn(
                        "rounded-sm py-2.5 text-sm font-extrabold transition-all active:scale-95",
                        goal === option
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="mt-6 rounded-md border border-border bg-sunken">
              <div className="grid grid-cols-2 divide-x divide-x-reverse divide-border sm:grid-cols-4">
                <Readout value={formatNumber(macros.calories)} label="سعرة يومياً" tone="primary" />
                <Readout value={`${macros.protein}غ`} label="بروتين" tone="accent" />
                <Readout value={`${macros.carbs}غ`} label="كارب" tone="plain" />
                <Readout value={`${macros.fat}غ`} label="دهون" tone="plain" />
              </div>
              <p className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
                الخطة المقترحة:{" "}
                <span className="font-extrabold text-primary">{macros.planLabel}</span> — {macros.mealsPerDay} وجبات
                يومياً
              </p>
            </div>
          </section>

          {/* Checkout */}
          <section className="panel p-6" aria-labelledby="delivery-title">
            <h2 id="delivery-title" className="mb-6 text-xl font-extrabold text-foreground">
              معلومات التوصيل
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground">
                  الاسم الكامل
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="مثال: مصطفى عبد الرزاق"
                  className="h-11 border-border bg-sunken"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground">
                  رقم الهاتف
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="07xxxxxxxx"
                  className="tnum h-11 border-border bg-sunken"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-bold text-muted-foreground">
                  العنوان داخل البصرة
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="البصرة - حي الأساتذة - الأربع شوارع"
                  className="h-11 border-border bg-sunken"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">وقت التوصيل المفضل</Label>
                <Select value={window_} onValueChange={setWindow_}>
                  <SelectTrigger className="h-11 border-border bg-sunken text-sm font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover">
                    {DELIVERY_WINDOWS.map((option) => (
                      <SelectItem key={option} value={option} className="text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">مدة الاشتراك</Label>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="مدة الاشتراك">
                  {DURATION_OPTIONS.map((option) => {
                    const optionTotal =
                      dailyTotal * option.days + deliveryFor(option.days, cartCount > 0);
                    const isActive = option.days === durationDays;
                    return (
                      <button
                        key={option.days}
                        type="button"
                        onClick={() => setDurationDays(option.days)}
                        aria-pressed={isActive}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-md border px-2 py-3 transition-all active:scale-95",
                          isActive
                            ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]"
                            : "border-border bg-sunken hover:border-primary/50",
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-extrabold",
                            isActive ? "text-primary" : "text-foreground",
                          )}
                        >
                          {option.label}
                        </span>
                        <span className="tnum text-[10px] text-muted-foreground">{option.hint}</span>
                        <span
                          className={cn(
                            "tnum text-xs font-extrabold",
                            isActive ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {cartCount > 0 ? formatIQD(optionTotal) : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cart lines */}
              <div className="rounded-md border border-border bg-sunken">
                <h3 className="border-b border-border px-4 py-3 text-sm font-extrabold text-foreground">
                  وجباتك المختارة
                </h3>

                {cartDetails.length === 0 ? (
                  <div className="space-y-3 px-4 py-6 text-center">
                    <p className="text-sm text-muted-foreground">ما أضفت أي وجبة بعد.</p>
                    <Button asChild variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
                      <Link to="/menu">
                        تصفح وجبات الدكتور
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {cartDetails.map((entry) => (
                      <li key={entry.meal.id} className="flex items-center gap-3 px-4 py-3">
                        <img
                          src={entry.meal.image}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-sm object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">{entry.meal.name}</p>
                          <p className="tnum text-xs text-muted-foreground">{formatIQD(entry.meal.price)}</p>
                        </div>
                        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => decrementFromCart(entry.meal.id)}
                            aria-label="إنقاص"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="tnum w-5 text-center text-sm font-extrabold">{entry.quantity}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-primary"
                            onClick={() => addToCart(entry.meal.id)}
                            aria-label="زيادة"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromCart(entry.meal.id)}
                          aria-label={`حذف ${entry.meal.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Totals */}
              <dl className="rounded-md border border-border bg-sunken text-sm">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <dt className="text-muted-foreground">سعر اليوم الواحد ({cartCount} وجبة)</dt>
                  <dd className="tnum font-bold text-foreground">{formatIQD(dailyTotal)}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <dt className="text-muted-foreground">
                    الوجبات × {selectedDuration.days} يوم
                  </dt>
                  <dd className="tnum font-bold text-foreground">{formatIQD(mealsTotal)}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <dt className="text-muted-foreground">التوصيل</dt>
                  <dd
                    className={cn(
                      "tnum font-bold",
                      deliveryTotal === 0 && cartCount > 0 ? "text-primary" : "text-foreground",
                    )}
                  >
                    {cartCount > 0 && deliveryTotal === 0 ? "مجاناً" : formatIQD(deliveryTotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <dt className="text-base font-extrabold text-foreground">المجموع</dt>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{durationLabel}</p>
                  </div>
                  <dd className="tnum text-2xl font-extrabold text-primary">{formatIQD(total)}</dd>
                </div>
              </dl>

              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full gap-2 rounded-md bg-primary text-base font-extrabold text-primary-foreground cta-glow transition-transform hover:bg-primary/90 active:scale-95"
              >
                <WhatsAppIcon className="h-5 w-5" />
                تأكيد الطلب عبر الواتساب
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                يفتح الواتساب برسالة جاهزة — الدفع عند الاستلام داخل البصرة
              </p>
            </form>
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

/** Inline WhatsApp glyph (lucide has no brand icons). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.57c.12.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.19.2-.58.2-1.08.14-1.19-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

function Field({ label, unit, children }: { label: string; unit: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm font-extrabold text-foreground">{label}</span>
      <div className="flex flex-1 items-center overflow-hidden rounded-md border border-border bg-sunken">
        <div className="flex-1">{children}</div>
        <span className="border-r border-border px-4 py-3 text-xs font-bold text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function Readout({ value, label, tone }: { value: string; label: string; tone: "primary" | "accent" | "plain" }) {
  return (
    <div className="px-3 py-5 text-center">
      <p
        className={cn(
          "tnum text-2xl font-extrabold sm:text-3xl",
          tone === "primary" && "text-primary",
          tone === "accent" && "text-accent",
          tone === "plain" && "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
