import { ImagePlus, Link2, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GOAL_LABELS, GOAL_ORDER } from "@/data/meals";
import { formatIQD } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MealDraft } from "@/store/DrDietStore";
import type { Goal, Meal } from "@/types";

const MAX_IMAGE_BYTES = 1_500_000;

interface MealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Meal being edited, or null when creating a new one. */
  meal: Meal | null;
  onSubmit: (draft: MealDraft) => void;
}

interface FormState {
  name: string;
  price: string;
  protein: string;
  calories: string;
  image: string;
  description: string;
  goals: Goal[];
}

const EMPTY_FORM: FormState = {
  name: "",
  price: "",
  protein: "",
  calories: "",
  image: "",
  description: "",
  goals: ["highProtein"],
};

/** Create / edit form for a kitchen meal: name, IQD price, protein, calories and photo. */
export function MealFormDialog({ open, onOpenChange, meal, onSubmit }: MealFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      meal
        ? {
            name: meal.name,
            price: String(meal.price),
            protein: String(meal.protein),
            calories: String(meal.calories),
            image: meal.image,
            description: meal.description,
            goals: meal.goals,
          }
        : EMPTY_FORM,
    );
  }, [open, meal]);

  const handlePickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("الملف غير مدعوم", { description: "اختر صورة بصيغة JPG أو PNG." });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("حجم الصورة كبير", { description: "الحد الأقصى 1.5 ميغابايت — صغّر الصورة وحاول مجدداً." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, image: reader.result as string }));
        setErrors((prev) => ({ ...prev, image: undefined }));
      }
    };
    reader.onerror = () => toast.error("تعذّرت قراءة الصورة", { description: "جرّب صورة ثانية." });
    reader.readAsDataURL(file);
  };

  const toggleGoal = (goal: Goal) => {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter((item) => item !== goal) : [...prev.goals, goal],
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const price = Number(form.price);
    const protein = Number(form.protein);
    const calories = Number(form.calories);
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (form.name.trim().length < 3) nextErrors.name = "اكتب اسم وجبة واضح.";
    if (!Number.isFinite(price) || price <= 0) nextErrors.price = "أدخل سعراً صحيحاً بالدينار.";
    if (!Number.isFinite(protein) || protein <= 0) nextErrors.protein = "أدخل غرامات البروتين.";
    if (!Number.isFinite(calories) || calories <= 0) nextErrors.calories = "أدخل السعرات الحرارية.";
    if (form.image.trim().length === 0) nextErrors.image = "أضف صورة للوجبة.";
    if (form.goals.length === 0) nextErrors.goals = "اختر تصنيفاً واحداً على الأقل.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      goals: form.goals,
      protein: Math.round(protein),
      calories: Math.round(calories),
      price: Math.round(price),
    });
    onOpenChange(false);
  };

  const priceNumber = Number(form.price);
  const showPricePreview = Number.isFinite(priceNumber) && priceNumber > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-md border-border bg-card p-0 scrollbar-slim">
        <DialogHeader className="space-y-1 border-b border-border p-5 text-right">
          <DialogTitle className="text-lg font-black text-foreground">
            {meal ? "تعديل الوجبة" : "إضافة وجبة جديدة"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {meal ? "حدّث بيانات الوجبة وسترى التغيير مباشرة في القائمة العامة." : "املأ بيانات الوجبة لتظهر فوراً لكل المشتركين."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 p-5" noValidate>
          {/* Photo */}
          <div className="space-y-2">
            <Label className="text-xs font-extrabold text-muted-foreground">صورة الوجبة</Label>
            <div className="flex gap-3">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-sunken">
                {form.image.length > 0 ? (
                  <img src={form.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="h-10 justify-start gap-2 rounded-md border-border bg-sunken text-xs font-extrabold text-foreground hover:border-primary/60"
                >
                  <Upload className="h-4 w-4 text-primary" />
                  رفع صورة من الجهاز
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePickFile}
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <div className="relative">
                  <Link2 className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.image.startsWith("data:") ? "" : form.image}
                    onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                    placeholder={form.image.startsWith("data:") ? "تم رفع صورة من الجهاز" : "أو ألصق رابط الصورة"}
                    dir="ltr"
                    className="h-10 border-border bg-sunken pr-8 text-left text-xs"
                    aria-label="رابط صورة الوجبة"
                  />
                </div>
              </div>
            </div>
            {errors.image && <p className="text-xs font-bold text-destructive">{errors.image}</p>}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="meal-name" className="text-xs font-extrabold text-muted-foreground">
              اسم الوجبة
            </Label>
            <Input
              id="meal-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="مثال: صدر دجاج مشوي مع رز أسمر"
              className="h-11 border-border bg-sunken text-sm font-bold"
              aria-invalid={errors.name !== undefined}
            />
            {errors.name && <p className="text-xs font-bold text-destructive">{errors.name}</p>}
          </div>

          {/* Numbers */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="meal-price" className="text-xs font-extrabold text-muted-foreground">
                السعر (د.ع)
              </Label>
              <Input
                id="meal-price"
                type="number"
                inputMode="numeric"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="8500"
                className="tnum h-11 border-border bg-sunken text-center text-sm font-extrabold text-primary"
                aria-invalid={errors.price !== undefined}
              />
              {errors.price && <p className="text-xs font-bold text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meal-protein" className="text-xs font-extrabold text-muted-foreground">
                البروتين (غرام)
              </Label>
              <Input
                id="meal-protein"
                type="number"
                inputMode="numeric"
                value={form.protein}
                onChange={(event) => setForm((prev) => ({ ...prev, protein: event.target.value }))}
                placeholder="52"
                className="tnum h-11 border-border bg-sunken text-center text-sm font-extrabold text-accent"
                aria-invalid={errors.protein !== undefined}
              />
              {errors.protein && <p className="text-xs font-bold text-destructive">{errors.protein}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meal-calories" className="text-xs font-extrabold text-muted-foreground">
                السعرات الحرارية
              </Label>
              <Input
                id="meal-calories"
                type="number"
                inputMode="numeric"
                value={form.calories}
                onChange={(event) => setForm((prev) => ({ ...prev, calories: event.target.value }))}
                placeholder="620"
                className="tnum h-11 border-border bg-sunken text-center text-sm font-extrabold text-accent"
                aria-invalid={errors.calories !== undefined}
              />
              {errors.calories && <p className="text-xs font-bold text-destructive">{errors.calories}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="meal-description" className="text-xs font-extrabold text-muted-foreground">
              وصف مختصر <span className="font-bold text-muted-foreground/60">(اختياري)</span>
            </Label>
            <Textarea
              id="meal-description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="مكونات الوجبة وطريقة تحضيرها بسطر أو سطرين."
              rows={2}
              className="resize-none border-border bg-sunken text-sm"
            />
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <Label className="text-xs font-extrabold text-muted-foreground">تصنيف الوجبة</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ORDER.map((goal) => {
                const active = form.goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-md border px-4 py-2 text-xs font-extrabold transition-all active:scale-95",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-sunken text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {GOAL_LABELS[goal]}
                  </button>
                );
              })}
            </div>
            {errors.goals && <p className="text-xs font-bold text-destructive">{errors.goals}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="tnum text-sm font-extrabold text-primary">
              {showPricePreview ? formatIQD(Math.round(priceNumber)) : "—"}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 rounded-md border-border px-5 text-sm font-extrabold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="h-11 gap-2 rounded-md bg-primary px-6 text-sm font-extrabold text-primary-foreground hover:bg-primary/90 active:scale-95"
              >
                <Save className="h-4 w-4" />
                {meal ? "حفظ التعديلات" : "إضافة الوجبة"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
