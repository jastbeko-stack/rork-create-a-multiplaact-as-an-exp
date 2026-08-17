import {
  Activity,
  BarChart3,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { MealFormDialog } from "@/components/MealFormDialog";
import { SiteLayout } from "@/components/SiteLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import { addDays, daysUntil, formatIQD, formatNumber, toISODate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDrDiet, type MealDraft } from "@/store/DrDietStore";
import type { Meal, Subscriber, SubscriberGoal, SubscriptionStatus } from "@/types";

type Section = "overview" | "subscribers" | "meals" | "orders" | "reports";

const SECTIONS: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "لوحة التحكم", icon: LayoutDashboard },
  { id: "subscribers", label: "المشتركون", icon: Users },
  { id: "meals", label: "الوجبات", icon: UtensilsCrossed },
  { id: "orders", label: "الطلبات", icon: ClipboardList },
  { id: "reports", label: "التقارير", icon: BarChart3 },
];

const GOALS: SubscriberGoal[] = ["تضخيم", "تنشيف", "إنقاص وزن", "تثبيت"];
const PAGE_SIZE = 6;

/** Same subscription lengths offered to customers on the checkout page. */
const DURATION_OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: "يوم واحد" },
  { days: 30, label: "شهر (30 يوم)" },
  { days: 60, label: "شهرين (60 يوم)" },
];

function statusOf(subscriber: Subscriber): SubscriptionStatus {
  return daysUntil(subscriber.endDate) >= 0 ? "نشط" : "منتهي";
}

export default function Admin() {
  const {
    subscribers,
    addSubscriber,
    removeSubscriber,
    orders,
    meals,
    toggleMealAvailability,
    addMeal,
    updateMeal,
    removeMeal,
    adminUser,
    signOutAdmin,
  } = useDrDiet();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("subscribers");

  const handleSignOut = () => {
    signOutAdmin();
    toast.success("تم تسجيل الخروج", { description: "انتهت جلسة لوحة التحكم." });
    navigate("/admin/login", { replace: true });
  };

  const [search, setSearch] = useState<string>("");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);

  const [mealDialogOpen, setMealDialogOpen] = useState<boolean>(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [mealPendingDelete, setMealPendingDelete] = useState<Meal | null>(null);

  const handleMealSubmit = (draft: MealDraft) => {
    if (editingMeal) {
      updateMeal(editingMeal.id, draft);
      toast.success("تم حفظ التعديلات", { description: draft.name });
      return;
    }
    addMeal(draft);
    toast.success("تمت إضافة الوجبة", { description: draft.name });
  };

  const confirmMealDelete = () => {
    if (!mealPendingDelete) return;
    removeMeal(mealPendingDelete.id);
    toast.success("تم حذف الوجبة", { description: mealPendingDelete.name });
    setMealPendingDelete(null);
  };

  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    heightCm: "",
    weightKg: "",
    goal: "تضخيم" as SubscriberGoal,
    startDate: toISODate(new Date()),
    durationDays: "30",
  });

  const activeCount = useMemo(
    () => subscribers.filter((subscriber) => statusOf(subscriber) === "نشط").length,
    [subscribers],
  );

  /** Subscribers whose subscription started within the last 7 days. */
  const newThisWeek = useMemo(
    () =>
      subscribers.filter((subscriber) => {
        const elapsed = -daysUntil(subscriber.startDate);
        return elapsed >= 0 && elapsed <= 7;
      }).length,
    [subscribers],
  );

  const expiringCount = useMemo(
    () =>
      subscribers.filter((subscriber) => {
        const days = daysUntil(subscriber.endDate);
        return days >= 0 && days <= 7;
      }).length,
    [subscribers],
  );

  const filtered = useMemo(() => {
    const query = search.trim();
    return subscribers.filter((subscriber) => {
      const nameMatch = query.length === 0 || subscriber.name.includes(query) || subscriber.phone.includes(query);
      const goalMatch = goalFilter === "all" || subscriber.goal === goalFilter;
      const statusMatch = statusFilter === "all" || statusOf(subscriber) === statusFilter;
      return nameMatch && goalMatch && statusMatch;
    });
  }, [subscribers, search, goalFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleAddSubscriber = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.name.trim().length < 3 || form.phone.trim().length < 8) {
      toast.error("بيانات ناقصة", { description: "الاسم الكامل ورقم الهاتف مطلوبان." });
      return;
    }
    const days = Number(form.durationDays) || 30;
    addSubscriber({
      name: form.name.trim(),
      phone: form.phone.trim(),
      age: Number(form.age) || 25,
      heightCm: Number(form.heightCm) || 170,
      weightKg: Number(form.weightKg) || 75,
      goal: form.goal,
      startDate: form.startDate,
      endDate: addDays(form.startDate, days),
      mealsPerDay: form.goal === "تضخيم" ? 3 : 2,
    });
    toast.success("تمت إضافة المشترك", { description: form.name.trim() });
    setForm((prev) => ({ ...prev, name: "", phone: "", age: "", heightCm: "", weightKg: "" }));
    setPage(1);
  };

  const goalDistribution = useMemo(
    () =>
      GOALS.map((goal) => ({
        goal,
        count: subscribers.filter((subscriber) => subscriber.goal === goal).length,
      })),
    [subscribers],
  );

  const maxGoalCount = Math.max(1, ...goalDistribution.map((entry) => entry.count));
  const ordersRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <SiteLayout withFooter={false}>
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
          {/* Main column comes first in DOM; sidebar is pinned to the right visually via grid order */}
          <div className="space-y-6 lg:order-1">
            {section === "overview" && (
              <OverviewSection
                activeCount={activeCount}
                expiringCount={expiringCount}
                totalCount={subscribers.length}
                newThisWeek={newThisWeek}
                subscribers={subscribers}
                ordersRevenue={ordersRevenue}
                ordersCount={orders.length}
              />
            )}

            {section === "subscribers" && (
              <>
                <StatCards
                  activeCount={activeCount}
                  expiringCount={expiringCount}
                  totalCount={subscribers.length}
                  newThisWeek={newThisWeek}
                />

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                  <section className="panel overflow-hidden">
                    <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
                      <div className="relative min-w-[220px] flex-1">
                        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={search}
                          onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                          }}
                          placeholder="ابحث باسم المشترك..."
                          className="h-10 border-border bg-sunken pr-9 text-sm"
                          aria-label="ابحث باسم المشترك"
                        />
                      </div>

                      <Select
                        value={goalFilter}
                        onValueChange={(value) => {
                          setGoalFilter(value);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-10 w-[150px] border-border bg-sunken text-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-popover">
                          <SelectItem value="all">الهدف: الكل</SelectItem>
                          {GOALS.map((goal) => (
                            <SelectItem key={goal} value={goal}>
                              {goal}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-10 w-[140px] border-border bg-sunken text-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-popover">
                          <SelectItem value="all">الحالة: الكل</SelectItem>
                          <SelectItem value="نشط">نشط</SelectItem>
                          <SelectItem value="منتهي">منتهي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="overflow-x-auto scrollbar-slim">
                      <table className="w-full min-w-[860px] text-right text-sm">
                        <thead>
                          <tr className="border-b border-border bg-sunken text-xs text-muted-foreground">
                            <th scope="col" className="px-4 py-3 font-bold">اسم المشترك</th>
                            <th scope="col" className="px-4 py-3 font-bold">العمر</th>
                            <th scope="col" className="px-4 py-3 font-bold">الطول</th>
                            <th scope="col" className="px-4 py-3 font-bold">الوزن</th>
                            <th scope="col" className="px-4 py-3 font-bold">الهدف</th>
                            <th scope="col" className="px-4 py-3 font-bold">بداية الاشتراك</th>
                            <th scope="col" className="px-4 py-3 font-bold">نهاية الاشتراك</th>
                            <th scope="col" className="px-4 py-3 font-bold">الحالة</th>
                            <th scope="col" className="px-4 py-3 font-bold">
                              <span className="sr-only">إجراءات</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                                {subscribers.length === 0
                                  ? "ما كو مشتركين بعد — أي تسجيل من الموقع راح يظهر هنا مباشرة."
                                  : "ما كو مشترك يطابق البحث الحالي."}
                              </td>
                            </tr>
                          ) : (
                            visible.map((subscriber) => {
                              const status = statusOf(subscriber);
                              return (
                                <tr
                                  key={subscriber.id}
                                  className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-sunken/70"
                                >
                                  <td className="px-4 py-3">
                                    <span className="block font-extrabold text-foreground">{subscriber.name}</span>
                                    <span className="tnum block text-xs text-muted-foreground" dir="ltr">
                                      {subscriber.phone}
                                    </span>
                                  </td>
                                  <td className="tnum px-4 py-3 text-muted-foreground">{subscriber.age}</td>
                                  <td className="tnum px-4 py-3 text-muted-foreground">{subscriber.heightCm} سم</td>
                                  <td className="tnum px-4 py-3 text-muted-foreground">{subscriber.weightKg} كغم</td>
                                  <td className="px-4 py-3">
                                    <span className="rounded-sm border border-border bg-sunken px-2 py-1 text-xs font-bold text-foreground/85">
                                      {subscriber.goal}
                                    </span>
                                  </td>
                                  <td className="tnum px-4 py-3 text-muted-foreground" dir="ltr">
                                    {subscriber.startDate}
                                  </td>
                                  <td className="tnum px-4 py-3 text-muted-foreground" dir="ltr">
                                    {subscriber.endDate}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={cn(
                                        "rounded-sm border px-2 py-1 text-xs font-extrabold",
                                        status === "نشط"
                                          ? "border-primary/45 bg-primary/12 text-primary"
                                          : "border-destructive/45 bg-destructive/12 text-destructive",
                                      )}
                                    >
                                      {status}
                                    </span>
                                  </td>
                                  <td className="px-2 py-3">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => {
                                        removeSubscriber(subscriber.id);
                                        toast.success("تم حذف المشترك", { description: subscriber.name });
                                      }}
                                      aria-label={`حذف ${subscriber.name}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
                      <p className="tnum text-xs text-muted-foreground">
                        عرض {visible.length} من {filtered.length} مشترك
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-border bg-sunken"
                          disabled={currentPage === 1}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          aria-label="الصفحة السابقة"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <span className="tnum px-3 text-sm font-extrabold text-foreground">
                          {currentPage} / {pageCount}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-border bg-sunken"
                          disabled={currentPage === pageCount}
                          onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                          aria-label="الصفحة التالية"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </section>

                  {/* Add subscriber form */}
                  <section className="panel h-fit p-5">
                    <h2 className="mb-5 text-lg font-extrabold text-foreground">إضافة مشترك جديد</h2>
                    <form onSubmit={handleAddSubscriber} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="sub-name" className="text-xs font-bold text-muted-foreground">
                          الاسم الكامل
                        </Label>
                        <Input
                          id="sub-name"
                          value={form.name}
                          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                          placeholder="أدخل الاسم الكامل"
                          className="h-10 border-border bg-sunken text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="sub-phone" className="text-xs font-bold text-muted-foreground">
                          رقم الهاتف
                        </Label>
                        <Input
                          id="sub-phone"
                          value={form.phone}
                          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                          placeholder="07xxxxxxxx"
                          className="tnum h-10 border-border bg-sunken text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">العمر / الطول / الوزن</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            value={form.age}
                            onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
                            placeholder="العمر"
                            className="tnum h-10 border-border bg-sunken text-center text-sm"
                            aria-label="العمر"
                          />
                          <Input
                            type="number"
                            value={form.heightCm}
                            onChange={(event) => setForm((prev) => ({ ...prev, heightCm: event.target.value }))}
                            placeholder="الطول"
                            className="tnum h-10 border-border bg-sunken text-center text-sm"
                            aria-label="الطول بالسنتيمتر"
                          />
                          <Input
                            type="number"
                            value={form.weightKg}
                            onChange={(event) => setForm((prev) => ({ ...prev, weightKg: event.target.value }))}
                            placeholder="الوزن"
                            className="tnum h-10 border-border bg-sunken text-center text-sm"
                            aria-label="الوزن بالكيلوغرام"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">الهدف</Label>
                        <Select
                          value={form.goal}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, goal: value as SubscriberGoal }))}
                        >
                          <SelectTrigger className="h-10 border-border bg-sunken text-sm font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-popover">
                            {GOALS.map((goal) => (
                              <SelectItem key={goal} value={goal}>
                                {goal}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="sub-start" className="text-xs font-bold text-muted-foreground">
                          تاريخ البداية
                        </Label>
                        <Input
                          id="sub-start"
                          type="date"
                          value={form.startDate}
                          onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                          className="tnum h-10 border-border bg-sunken text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">مدة الاشتراك</Label>
                        <Select
                          value={form.durationDays}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, durationDays: value }))}
                        >
                          <SelectTrigger className="h-10 border-border bg-sunken text-sm font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-popover">
                            {DURATION_OPTIONS.map((option) => (
                              <SelectItem key={option.days} value={String(option.days)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="submit"
                        className="h-11 w-full gap-2 rounded-md bg-primary text-sm font-extrabold text-primary-foreground hover:bg-primary/90 active:scale-95"
                      >
                        <Save className="h-4 w-4" />
                        حفظ المشترك
                      </Button>
                    </form>
                  </section>
                </div>
              </>
            )}

            {section === "meals" && (
              <section className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-foreground">وجبات المطبخ</h2>
                    <p className="tnum mt-0.5 text-xs text-muted-foreground">
                      {formatNumber(meals.length)} وجبة · {formatNumber(meals.filter((meal) => meal.available).length)}{" "}
                      متوفرة اليوم
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setEditingMeal(null);
                      setMealDialogOpen(true);
                    }}
                    className="h-10 gap-2 rounded-md bg-primary px-5 text-sm font-extrabold text-primary-foreground hover:bg-primary/90 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة وجبة جديدة
                  </Button>
                </div>

                {meals.length === 0 ? (
                  <p className="p-12 text-center text-sm text-muted-foreground">
                    ما كو وجبات بالقائمة — أضف أول وجبة حتى تظهر للمشتركين.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {meals.map((meal) => (
                      <li key={meal.id} className="flex flex-wrap items-center gap-4 p-4">
                        <img
                          src={meal.image}
                          alt=""
                          loading="lazy"
                          className="h-14 w-14 shrink-0 rounded-sm border border-border object-cover"
                        />
                        <div className="min-w-[180px] flex-1">
                          <p className="text-sm font-extrabold text-foreground">{meal.name}</p>
                          <p className="tnum text-xs text-muted-foreground">
                            {meal.protein}غ بروتين · {meal.calories} سعرة
                          </p>
                        </div>
                        <span className="tnum text-sm font-extrabold text-primary">{formatIQD(meal.price)}</span>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{meal.available ? "متوفرة" : "موقوفة"}</span>
                          <Switch
                            checked={meal.available}
                            onCheckedChange={() => toggleMealAvailability(meal.id)}
                            aria-label={`تفعيل ${meal.name}`}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMeal(meal);
                              setMealDialogOpen(true);
                            }}
                            className="h-9 gap-1.5 rounded-md border-border bg-sunken px-3 text-xs font-extrabold text-foreground hover:border-primary/60 hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            تعديل
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setMealPendingDelete(meal)}
                            className="h-9 w-9 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`حذف ${meal.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {section === "orders" && (
              <section className="panel overflow-hidden">
                <h2 className="border-b border-border p-4 text-lg font-extrabold text-foreground">طلبات الاشتراك</h2>
                {orders.length === 0 ? (
                  <p className="p-12 text-center text-sm text-muted-foreground">
                    ما كو طلبات بعد — أي اشتراك يتم من الموقع راح يظهر هنا مباشرة.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {orders.map((order) => (
                      <li key={order.id} className="space-y-2 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-foreground">{order.subscriberName}</p>
                            <p className="tnum text-xs text-muted-foreground" dir="ltr">
                              {order.id} · {order.phone}
                            </p>
                          </div>
                          <span className="tnum text-lg font-extrabold text-primary">{formatIQD(order.total)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.address} — {order.deliveryWindow} · {order.plan} · {order.durationLabel}
                        </p>
                        <p className="text-xs text-foreground/70">
                          {order.meals.map((line) => `${line.name} ×${line.quantity}`).join("، ")}
                        </p>
                        <p className="tnum text-xs text-muted-foreground">
                          {formatIQD(order.dailyTotal)} / اليوم × {order.durationDays} يوم
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {section === "reports" && (
              <div className="grid gap-6 md:grid-cols-2">
                <section className="panel p-5">
                  <h2 className="mb-5 text-lg font-extrabold text-foreground">توزيع المشتركين حسب الهدف</h2>
                  <ul className="space-y-4">
                    {goalDistribution.map((entry) => (
                      <li key={entry.goal} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-foreground">{entry.goal}</span>
                          <span className="tnum text-muted-foreground">{entry.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-sunken">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${(entry.count / maxGoalCount) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="panel p-5">
                  <h2 className="mb-5 text-lg font-extrabold text-foreground">ملخص الإيرادات</h2>
                  <div className="space-y-4">
                    <div className="rounded-md border border-border bg-sunken p-5">
                      <p className="text-xs text-muted-foreground">إيرادات الطلبات المسجلة</p>
                      <p className="tnum mt-1 text-3xl font-extrabold text-primary">{formatIQD(ordersRevenue)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border border-border bg-sunken p-4 text-center">
                        <p className="tnum text-2xl font-extrabold text-foreground">{formatNumber(orders.length)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">عدد الطلبات</p>
                      </div>
                      <div className="rounded-md border border-border bg-sunken p-4 text-center">
                        <p className="tnum text-2xl font-extrabold text-accent">{formatNumber(meals.length)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">وجبات بالقائمة</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Right-pinned admin sidebar */}
          <nav className="panel h-fit p-2 lg:sticky lg:top-24 lg:order-2" aria-label="أقسام لوحة التحكم">
            <div className="mb-2 hidden items-center gap-2.5 rounded-md bg-sunken px-3 py-3 lg:flex">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-xs font-black text-accent">
                DR
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-extrabold text-foreground">
                  {adminUser ?? "dr.diet"}
                </span>
                <span className="block text-[10px] font-bold text-muted-foreground">مدير النظام</span>
              </span>
            </div>
            <ul className="flex gap-1 overflow-x-auto scrollbar-slim lg:block lg:space-y-1 lg:overflow-visible">
              {SECTIONS.map((item) => {
                const active = section === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSection(item.id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-bold transition-colors",
                        active
                          ? "border-r-2 border-accent bg-sidebar-accent text-accent"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
              <li className="lg:pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  تسجيل الخروج
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <MealFormDialog
        open={mealDialogOpen}
        onOpenChange={setMealDialogOpen}
        meal={editingMeal}
        onSubmit={handleMealSubmit}
      />

      <AlertDialog
        open={mealPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setMealPendingDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-md rounded-md border-border bg-card text-right">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-foreground">حذف الوجبة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              راح تنحذف «{mealPendingDelete?.name}» من القائمة العامة ومن سلات الطلب الحالية. هذا الإجراء لا يمكن التراجع
              عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-start sm:space-x-0">
            <AlertDialogAction
              onClick={confirmMealDelete}
              className="h-11 rounded-md bg-destructive px-6 text-sm font-extrabold text-destructive-foreground hover:bg-destructive/90"
            >
              نعم، احذفها
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-11 rounded-md border-border px-6 text-sm font-extrabold">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SiteLayout>
  );
}

function StatCards({
  activeCount,
  expiringCount,
  totalCount,
  newThisWeek,
}: {
  activeCount: number;
  expiringCount: number;
  totalCount: number;
  newThisWeek: number;
}) {
  const cards = [
    {
      icon: Users,
      label: "إجمالي مشتركي دكتور دايت",
      value: formatNumber(totalCount),
      delta: newThisWeek > 0 ? `+${formatNumber(newThisWeek)} خلال هذا الأسبوع` : "ما كو تسجيل جديد هذا الأسبوع",
      positive: newThisWeek > 0,
    },
    {
      icon: Activity,
      label: "الاشتراكات النشطة",
      value: formatNumber(activeCount),
      delta:
        totalCount === 0
          ? "بانتظار أول مشترك"
          : `${formatNumber(activeCount)} من ${formatNumber(totalCount)} ملف`,
      positive: activeCount > 0,
    },
    {
      icon: CalendarClock,
      label: "اشتراكات تنتهي هذا الأسبوع",
      value: formatNumber(expiringCount),
      delta: expiringCount === 0 ? "ما كو اشتراك ينتهي قريباً" : "تحتاج متابعة تجديد",
      positive: expiringCount === 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="panel p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-muted-foreground">{card.label}</p>
            <card.icon className="h-5 w-5 shrink-0 text-accent" />
          </div>
          <p className="tnum text-4xl font-extrabold text-foreground">{card.value}</p>
          <p className={cn("tnum mt-2 text-xs font-bold", card.positive ? "text-primary" : "text-destructive")}>
            {card.delta}
          </p>
        </article>
      ))}
    </div>
  );
}

function OverviewSection({
  activeCount,
  expiringCount,
  totalCount,
  newThisWeek,
  subscribers,
  ordersRevenue,
  ordersCount,
}: {
  activeCount: number;
  expiringCount: number;
  totalCount: number;
  newThisWeek: number;
  subscribers: Subscriber[];
  ordersRevenue: number;
  ordersCount: number;
}) {
  const expiringSoon = subscribers
    .filter((subscriber) => {
      const days = daysUntil(subscriber.endDate);
      return days >= 0 && days <= 14;
    })
    .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <StatCards
        activeCount={activeCount}
        expiringCount={expiringCount}
        totalCount={totalCount}
        newThisWeek={newThisWeek}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4 text-lg font-extrabold text-foreground">اشتراكات تحتاج تجديد قريباً</h2>
          {expiringSoon.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">ما كو اشتراك ينتهي خلال أسبوعين.</p>
          ) : (
            <ul className="divide-y divide-border">
              {expiringSoon.map((subscriber) => (
                <li key={subscriber.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-foreground">{subscriber.name}</p>
                    <p className="text-xs text-muted-foreground">{subscriber.goal}</p>
                  </div>
                  <span className="tnum rounded-sm border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-extrabold text-accent">
                    {daysUntil(subscriber.endDate)} يوم
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="mb-4 text-lg font-extrabold text-foreground">حركة المطبخ</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-sunken p-4">
              <p className="tnum text-2xl font-extrabold text-primary">{formatNumber(ordersCount)}</p>
              <p className="mt-1 text-xs text-muted-foreground">طلبات مسجلة</p>
            </div>
            <div className="rounded-md border border-border bg-sunken p-4">
              <p className="tnum text-2xl font-extrabold text-accent">{formatIQD(ordersRevenue)}</p>
              <p className="mt-1 text-xs text-muted-foreground">إيرادات الطلبات</p>
            </div>
            <div className="rounded-md border border-border bg-sunken p-4">
              <p className="tnum text-2xl font-extrabold text-foreground">{formatNumber(totalCount)}</p>
              <p className="mt-1 text-xs text-muted-foreground">ملفات مشتركين بالنظام</p>
            </div>
            <div className="rounded-md border border-border bg-sunken p-4">
              <p className="tnum text-2xl font-extrabold text-foreground">{formatNumber(activeCount)}</p>
              <p className="mt-1 text-xs text-muted-foreground">اشتراكات فعّالة</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
