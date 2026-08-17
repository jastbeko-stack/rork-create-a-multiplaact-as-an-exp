import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { MEALS } from "@/data/meals";
import { SEED_SUBSCRIBERS } from "@/data/subscribers";
import type { CartLine, Meal, Order, Subscriber } from "@/types";

/** v2 drops the old demo roster that shipped with v1. */
const STORAGE_KEY = "dr-diet-state-v2";
const LEGACY_STORAGE_KEYS = ["dr-diet-state-v1"];
const ADMIN_SESSION_KEY = "dr-diet-admin-session-v1";

/** Credentials for the دكتور دايت admin console. */
const ADMIN_USERNAME = "dr.diet";
const ADMIN_PASSWORD = "2254359";

interface PersistedState {
  cart: CartLine[];
  subscribers: Subscriber[];
  orders: Order[];
  mySubscriptionId: string | null;
  unavailableMealIds: string[];
  meals: Meal[];
}

/** Fields the kitchen manager can edit from the admin console. */
export type MealDraft = Pick<Meal, "name" | "description" | "image" | "goals" | "protein" | "calories" | "price">;

interface DrDietValue {
  meals: Meal[];
  cart: CartLine[];
  cartCount: number;
  cartTotal: number;
  cartDetails: { meal: Meal; quantity: number }[];
  addToCart: (mealId: string) => void;
  decrementFromCart: (mealId: string) => void;
  removeFromCart: (mealId: string) => void;
  clearCart: () => void;
  quantityOf: (mealId: string) => number;
  subscribers: Subscriber[];
  addSubscriber: (subscriber: Omit<Subscriber, "id">) => Subscriber;
  removeSubscriber: (id: string) => void;
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "createdAt">) => Order;
  mySubscription: Subscriber | null;
  setMySubscriptionId: (id: string | null) => void;
  toggleMealAvailability: (mealId: string) => void;
  addMeal: (draft: MealDraft) => Meal;
  updateMeal: (mealId: string, draft: MealDraft) => void;
  removeMeal: (mealId: string) => void;
  isAdminAuthed: boolean;
  adminUser: string | null;
  signInAdmin: (username: string, password: string) => boolean;
  signOutAdmin: () => void;
}

const DrDietContext = createContext<DrDietValue | null>(null);

function readPersisted(): Partial<PersistedState> {
  if (typeof window === "undefined") return {};
  try {
    LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return {};
  }
}

export function DrDietProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(readPersisted, []);

  const [cart, setCart] = useState<CartLine[]>(persisted.cart ?? []);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(persisted.subscribers ?? SEED_SUBSCRIBERS);
  const [orders, setOrders] = useState<Order[]>(persisted.orders ?? []);
  const [mySubscriptionId, setMySubscriptionId] = useState<string | null>(persisted.mySubscriptionId ?? null);
  const [meals, setMeals] = useState<Meal[]>(() => {
    if (persisted.meals && persisted.meals.length > 0) return persisted.meals;
    const unavailable = persisted.unavailableMealIds ?? [];
    return MEALS.map((meal) => ({ ...meal, available: !unavailable.includes(meal.id) }));
  });
  const [adminUser, setAdminUser] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage.getItem(ADMIN_SESSION_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const payload: PersistedState = {
        cart,
        subscribers,
        orders,
        mySubscriptionId,
        meals,
        unavailableMealIds: meals.filter((meal) => !meal.available).map((meal) => meal.id),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* storage unavailable — state stays in memory for this session */
    }
  }, [cart, subscribers, orders, mySubscriptionId, meals]);

  const addToCart = useCallback((mealId: string) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.mealId === mealId);
      if (existing) {
        return prev.map((line) => (line.mealId === mealId ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...prev, { mealId, quantity: 1 }];
    });
  }, []);

  const decrementFromCart = useCallback((mealId: string) => {
    setCart((prev) =>
      prev
        .map((line) => (line.mealId === mealId ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((mealId: string) => {
    setCart((prev) => prev.filter((line) => line.mealId !== mealId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartDetails = useMemo(
    () =>
      cart
        .map((line) => {
          const meal = meals.find((item) => item.id === line.mealId);
          return meal ? { meal, quantity: line.quantity } : null;
        })
        .filter((entry): entry is { meal: Meal; quantity: number } => entry !== null),
    [cart, meals],
  );

  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);

  const cartTotal = useMemo(
    () => cartDetails.reduce((sum, entry) => sum + entry.meal.price * entry.quantity, 0),
    [cartDetails],
  );

  const quantityOf = useCallback(
    (mealId: string) => cart.find((line) => line.mealId === mealId)?.quantity ?? 0,
    [cart],
  );

  const addSubscriber = useCallback((subscriber: Omit<Subscriber, "id">) => {
    const created: Subscriber = { ...subscriber, id: `s-${Date.now()}-${Math.floor(Math.random() * 1000)}` };
    setSubscribers((prev) => [created, ...prev]);
    return created;
  }, []);

  const removeSubscriber = useCallback((id: string) => {
    setSubscribers((prev) => prev.filter((subscriber) => subscriber.id !== id));
  }, []);

  const addOrder = useCallback((order: Omit<Order, "id" | "createdAt">) => {
    const created: Order = {
      ...order,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [created, ...prev]);
    return created;
  }, []);

  const toggleMealAvailability = useCallback((mealId: string) => {
    setMeals((prev) =>
      prev.map((meal) => (meal.id === mealId ? { ...meal, available: !meal.available } : meal)),
    );
  }, []);

  const addMeal = useCallback((draft: MealDraft) => {
    const created: Meal = {
      ...draft,
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      carbs: 0,
      fat: 0,
      available: true,
    };
    setMeals((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateMeal = useCallback((mealId: string, draft: MealDraft) => {
    setMeals((prev) => prev.map((meal) => (meal.id === mealId ? { ...meal, ...draft } : meal)));
  }, []);

  const removeMeal = useCallback((mealId: string) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== mealId));
    setCart((prev) => prev.filter((line) => line.mealId !== mealId));
  }, []);

  const signInAdmin = useCallback((username: string, password: string) => {
    const isValid = username.trim().toLowerCase() === ADMIN_USERNAME && password === ADMIN_PASSWORD;
    if (!isValid) return false;
    setAdminUser(ADMIN_USERNAME);
    try {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, ADMIN_USERNAME);
    } catch {
      /* session storage unavailable — auth stays in memory */
    }
    return true;
  }, []);

  const signOutAdmin = useCallback(() => {
    setAdminUser(null);
    try {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      /* nothing to clear */
    }
  }, []);

  const mySubscription = useMemo(
    () => subscribers.find((subscriber) => subscriber.id === mySubscriptionId) ?? null,
    [subscribers, mySubscriptionId],
  );

  const value = useMemo<DrDietValue>(
    () => ({
      meals,
      cart,
      cartCount,
      cartTotal,
      cartDetails,
      addToCart,
      decrementFromCart,
      removeFromCart,
      clearCart,
      quantityOf,
      subscribers,
      addSubscriber,
      removeSubscriber,
      orders,
      addOrder,
      mySubscription,
      setMySubscriptionId,
      toggleMealAvailability,
      addMeal,
      updateMeal,
      removeMeal,
      isAdminAuthed: adminUser !== null,
      adminUser,
      signInAdmin,
      signOutAdmin,
    }),
    [
      meals,
      cart,
      cartCount,
      cartTotal,
      cartDetails,
      addToCart,
      decrementFromCart,
      removeFromCart,
      clearCart,
      quantityOf,
      subscribers,
      addSubscriber,
      removeSubscriber,
      orders,
      addOrder,
      mySubscription,
      toggleMealAvailability,
      addMeal,
      updateMeal,
      removeMeal,
      adminUser,
      signInAdmin,
      signOutAdmin,
    ],
  );

  return <DrDietContext.Provider value={value}>{children}</DrDietContext.Provider>;
}

/** Access the shared دكتور دايت store (cart, subscribers, orders). */
export function useDrDiet(): DrDietValue {
  const context = useContext(DrDietContext);
  if (!context) throw new Error("useDrDiet must be used inside DrDietProvider");
  return context;
}
