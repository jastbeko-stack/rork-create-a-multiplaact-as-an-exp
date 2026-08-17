/** Shared domain types for the دكتور دايت platform. */

export type Goal = "bulking" | "cutting" | "highProtein" | "lowCarb";

export type SubscriberGoal = "تضخيم" | "تنشيف" | "إنقاص وزن" | "تثبيت";

export type SubscriptionStatus = "نشط" | "منتهي";

export interface Meal {
  id: string;
  name: string;
  description: string;
  image: string;
  goals: Goal[];
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  price: number;
  available: boolean;
}

export interface CartLine {
  mealId: string;
  quantity: number;
}

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: SubscriberGoal;
  startDate: string;
  endDate: string;
  mealsPerDay: number;
}

export interface Order {
  id: string;
  subscriberName: string;
  phone: string;
  address: string;
  deliveryWindow: string;
  meals: { name: string; quantity: number; price: number }[];
  /** Number of meals delivered each day. */
  mealsPerDay: number;
  /** Cost of a single day of meals, before delivery. */
  dailyTotal: number;
  /** Meals cost across the whole subscription period. */
  mealsTotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  plan: SubscriberGoal;
  /** Subscription length in days (1, 30, 60...). */
  durationDays: number;
  /** Human label for the period, e.g. "شهر — 30 يوم". */
  durationLabel: string;
}

export interface MacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmr: number;
  planLabel: string;
  mealsPerDay: number;
}
