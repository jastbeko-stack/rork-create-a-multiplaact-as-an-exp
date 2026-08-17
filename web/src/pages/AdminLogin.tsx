import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, TriangleAlert, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HERO_ATHLETE } from "@/data/images";
import { daysUntil, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDrDiet } from "@/store/DrDietStore";

const MAX_ATTEMPTS = 5;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signInAdmin, isAdminAuthed, subscribers, orders } = useDrDiet();

  const activeCount = useMemo(
    () => subscribers.filter((subscriber) => daysUntil(subscriber.endDate) >= 0).length,
    [subscribers],
  );

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);
  const [pending, setPending] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdminAuthed) navigate("/admin", { replace: true });
  }, [isAdminAuthed, navigate]);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const locked = attempts >= MAX_ATTEMPTS;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || locked) return;

    if (username.trim().length === 0 || password.length === 0) {
      setError("رجاءً أدخل اسم المستخدم وكلمة السر.");
      setShake(true);
      return;
    }

    setPending(true);
    setError(null);

    window.setTimeout(() => {
      const ok = signInAdmin(username, password);
      setPending(false);

      if (ok) {
        toast.success("أهلاً بعودتك", { description: "تم تسجيل الدخول إلى لوحة تحكم دكتور دايت." });
        navigate("/admin", { replace: true });
        return;
      }

      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPassword("");
      setShake(true);
      setError(
        nextAttempts >= MAX_ATTEMPTS
          ? "تم إيقاف المحاولات مؤقتاً. حدّث الصفحة وحاول مرة أخرى."
          : `اسم المستخدم أو كلمة السر غير صحيحة. المحاولات المتبقية: ${MAX_ATTEMPTS - nextAttempts}`,
      );
    }, 550);
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.05fr]">
      {/* Form column — first on the right in RTL */}
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:order-1 lg:px-14">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="دكتور دايت — الصفحة الرئيسية">
            <BrandMark />
          </Link>
          <Link
            to="/"
            className="text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            العودة للموقع
          </Link>
        </div>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-[420px] py-10">
            <span className="inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-accent">
              <ShieldCheck className="h-3.5 w-3.5" />
              دخول محمي — الإدارة فقط
            </span>

            <h1 className="mt-5 text-3xl font-black leading-tight text-foreground sm:text-4xl">
              لوحة تحكم <span className="text-primary">دكتور دايت</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              سجّل الدخول لإدارة المشتركين، الوجبات، الطلبات وتقارير الاشتراكات.
            </p>

            <form
              onSubmit={handleSubmit}
              onAnimationEnd={() => setShake(false)}
              className={cn("panel mt-6 space-y-5 p-5 sm:p-6", shake && "animate-shake")}
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="admin-username" className="text-xs font-extrabold text-muted-foreground">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="admin-username"
                    ref={usernameRef}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="dr.diet"
                    autoComplete="username"
                    dir="ltr"
                    disabled={locked}
                    aria-invalid={error !== null}
                    className="h-12 border-border bg-sunken pr-10 text-left text-sm font-bold tracking-wide placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-xs font-extrabold text-muted-foreground">
                  كلمة السر
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    dir="ltr"
                    disabled={locked}
                    aria-invalid={error !== null}
                    className="h-12 border-border bg-sunken px-10 text-left text-sm font-bold tracking-[0.2em] placeholder:tracking-normal placeholder:text-muted-foreground/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error !== null && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-bold leading-relaxed text-destructive"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={pending || locked}
                className="h-12 w-full rounded-md bg-primary text-sm font-extrabold text-primary-foreground cta-glow transition-transform hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70"
              >
                {pending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ التحقق...
                  </>
                ) : (
                  <>
                    <KeyRound className="ml-2 h-4 w-4" />
                    تسجيل الدخول
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                هذه الصفحة مخصصة لفريق إدارة دكتور دايت. جلسة الدخول تنتهي عند إغلاق المتصفح.
              </p>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} دكتور دايت — البصرة، العراق
        </p>
      </div>

      {/* Visual column */}
      <aside className="relative hidden overflow-hidden border-l border-border lg:order-2 lg:block">
        <img
          src={HERO_ATHLETE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/70 to-background/92" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <div className="relative flex h-full flex-col justify-end gap-6 p-12">
          <p className="brand-latin text-5xl leading-none text-foreground xl:text-6xl">
            TRAIN HARD.
            <br />
            <span className="text-primary">EAT SMART.</span>
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            نظام إدارة اشتراكات دكتور دايت — متابعة دقيقة للماكروز، جدولة التوصيل اليومي، وتقارير لحظية لكل مشترك.
          </p>

          <div className="grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
            {[
              { value: formatNumber(subscribers.length), label: "مشترك" },
              { value: formatNumber(activeCount), label: "اشتراك نشط" },
              { value: formatNumber(orders.length), label: "طلب مسجل" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card px-4 py-4 text-center">
                <p className="tnum text-xl font-black text-accent">{stat.value}</p>
                <p className="mt-1 text-[11px] font-bold text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
