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
  mealsTotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  plan: SubscriberGoal;
  durationMonths: number;
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
