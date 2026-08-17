import type { MacroResult, SubscriberGoal } from "@/types";

export type CalculatorGoal = "تضخيم" | "تثبيت" | "تنشيف";

export interface MacroInput {
  weightKg: number;
  heightCm: number;
  age: number;
  goal: CalculatorGoal;
  gender: "ذكر" | "أنثى";
  activity: number;
}

export const ACTIVITY_LEVELS: { label: string; factor: number }[] = [
  { label: "خفيف — تمرين 1-2 يوم", factor: 1.375 },
  { label: "متوسط — تمرين 3-4 أيام", factor: 1.55 },
  { label: "عالي — تمرين 5-6 أيام", factor: 1.725 },
  { label: "رياضي محترف — تمرين يومي", factor: 1.9 },
];

const GOAL_ADJUSTMENT: Record<CalculatorGoal, number> = {
  تضخيم: 1.15,
  تثبيت: 1,
  تنشيف: 0.82,
};

const GOAL_PROTEIN_PER_KG: Record<CalculatorGoal, number> = {
  تضخيم: 2.2,
  تثبيت: 1.9,
  تنشيف: 2.4,
};

const GOAL_MEALS: Record<CalculatorGoal, number> = {
  تضخيم: 3,
  تثبيت: 2,
  تنشيف: 3,
};

const GOAL_PLAN_LABEL: Record<CalculatorGoal, string> = {
  تضخيم: "باقة التضخيم",
  تثبيت: "باقة التثبيت",
  تنشيف: "باقة التنشيف",
};

/**
 * Mifflin-St Jeor BMR, scaled by activity and goal, then split into
 * protein / fat / carbohydrate targets for a دكتور دايت plan.
 */
export function calculateMacros(input: MacroInput): MacroResult {
  const { weightKg, heightCm, age, goal, gender, activity } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "ذكر" ? base + 5 : base - 161;
  const calories = Math.max(1200, bmr * activity * GOAL_ADJUSTMENT[goal]);

  const protein = weightKg * GOAL_PROTEIN_PER_KG[goal];
  const fat = (calories * (goal === "تنشيف" ? 0.24 : 0.26)) / 9;
  const carbs = Math.max(40, (calories - protein * 4 - fat * 9) / 4);

  return {
    calories: Math.round(calories / 10) * 10,
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    bmr: Math.round(bmr),
    planLabel: GOAL_PLAN_LABEL[goal],
    mealsPerDay: GOAL_MEALS[goal],
  };
}

/** Maps a calculator goal to the goal stored on a subscriber profile. */
export function toSubscriberGoal(goal: CalculatorGoal): SubscriberGoal {
  return goal;
}
