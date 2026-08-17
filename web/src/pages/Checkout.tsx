import { ArrowRight, CheckCircle2, ChevronLeft, Lock, Minus, Plus, Trash2, User } from "lucide-react";
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
import { addMonths, formatIQD, formatNumber, toISODate } from "@/lib/format";
import { ACTIVITY_LEVELS, calculateMacros, type CalculatorGoal } from "@/lib/macros";
import { cn } from "@/lib/utils";
import { useDrDiet } from "@/store/DrDietStore";

const GOALS: CalculatorGoal[] = ["تضخيم", "تثبيت", "تنشيف"];
const DELIVERY_WINDOWS = ["10:00 - 12:00 صباحاً", "2:00 - 4:00 عصراً", "6:00 - 8:00 مساءً", "8:00 - 10:00 مساءً"];
const DURATIONS = [1, 2, 3, 6];

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
  const [duration, setDuration] = useState<string>("1");
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

  const total = cartTotal + (cartCount > 0 ? DELIVERY_FEE : 0);

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
    const months = Number(duration);

    const subscriber = addSubscriber({
      name: name.trim(),
      phone: phone.trim(),
      age: Number(age) || 25,
      heightCm: Number(height) || 170,
      weightKg: Number(weight) || 75,
      goal,
      startDate,
      endDate: addMonths(startDate, months),
      mealsPerDay: macros.mealsPerDay,
    });

    addOrder({
      subscriberName: subscriber.name,
      phone: subscriber.phone,
      address: address.trim(),
      deliveryWindow: window_,
      meals: cartDetails.map((entry) => ({ name: entry.meal.name, quantity: entry.quantity, price: entry.meal.price })),
      mealsTotal: cartTotal,
      deliveryFee: DELIVERY_FEE,
      total,
      plan: goal,
      durationMonths: months,
    });

    setMySubscriptionId(subscriber.id);
    clearCart();
    toast.success("تم تأكيد اشتراكك في دكتور دايت", { description: `${macros.planLabel} — ${months} شهر` });
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
                  العنوان داخل بغداد
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="بغداد - المنصور - شارع 14"
                  className="h-11 border-border bg-sunken"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="h-11 border-border bg-sunken text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover">
                      {DURATIONS.map((months) => (
                        <SelectItem key={months} value={String(months)} className="text-sm">
                          {months} شهر
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <dt className="text-muted-foreground">الوجبات ({cartCount})</dt>
                  <dd className="tnum font-bold text-foreground">{formatIQD(cartTotal)}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <dt className="text-muted-foreground">التوصيل</dt>
                  <dd className="tnum font-bold text-foreground">{formatIQD(cartCount > 0 ? DELIVERY_FEE : 0)}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <dt className="text-base font-extrabold text-foreground">المجموع</dt>
                  <dd className="tnum text-2xl font-extrabold text-primary">{formatIQD(total)}</dd>
                </div>
              </dl>

              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full gap-2 rounded-md bg-primary text-base font-extrabold text-primary-foreground cta-glow transition-transform hover:bg-primary/90 active:scale-95"
              >
                <Lock className="h-4 w-4" />
                تأكيد الاشتراك والدفع
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                الدفع عند الاستلام متاح داخل بغداد
              </p>
            </form>
          </section>
        </div>
      </div>
    </SiteLayout>
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
