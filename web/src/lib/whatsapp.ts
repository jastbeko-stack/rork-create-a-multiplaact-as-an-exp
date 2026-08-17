import { formatIQD, formatNumber } from "@/lib/format";
import type { MacroResult } from "@/types";

/** Business WhatsApp number in international format (no +, no spaces). */
export const WHATSAPP_NUMBER = "9647722017005";

export interface WhatsAppOrderPayload {
  name: string;
  phone: string;
  address: string;
  deliveryWindow: string;
  durationLabel: string;
  durationDays: number;
  mealsPerDay: number;
  meals: { name: string; quantity: number; price: number }[];
  /** Cost of a single day of meals. */
  dailyTotal: number;
  /** Meals cost across the whole period. */
  mealsTotal: number;
  deliveryFee: number;
  total: number;
  macros: MacroResult;
  /** Optional body metrics shown in the macro block. */
  body?: { weightKg: number; heightCm: number; age: number; gender: string; goal: string };
}

/**
 * Builds the formatted Arabic order message sent to the Dr. Diet WhatsApp line.
 * Numbers stay in western digits so they are copy/paste friendly for the kitchen.
 */
export function buildOrderMessage(order: WhatsAppOrderPayload): string {
  const lines: string[] = [];

  lines.push("🥗 *طلب اشتراك جديد — دكتور دايت*");
  lines.push("————————————————");
  lines.push("👤 *معلومات الزبون*");
  lines.push(`• الاسم: ${order.name}`);
  lines.push(`• رقم الهاتف: ${order.phone}`);
  lines.push(`• العنوان: ${order.address}`);
  lines.push(`• وقت التوصيل المفضل: ${order.deliveryWindow}`);
  lines.push(`• مدة الاشتراك: ${order.durationLabel}`);
  lines.push("");

  lines.push(`🍽️ *الوجبات اليومية (${order.mealsPerDay} وجبة باليوم)*`);
  order.meals.forEach((meal, index) => {
    lines.push(
      `${index + 1}. ${meal.name} × ${meal.quantity} = ${formatIQD(meal.price * meal.quantity)}`,
    );
  });
  lines.push(`▪️ سعر اليوم الواحد: ${formatIQD(order.dailyTotal)}`);
  lines.push("");

  lines.push("📊 *تفاصيل الماكروز اليومية*");
  if (order.body) {
    lines.push(
      `• البيانات: ${order.body.gender} — ${order.body.age} سنة — ${order.body.weightKg} كغم — ${order.body.heightCm} سم`,
    );
  }
  lines.push(`• الهدف: ${order.macros.planLabel}`);
  lines.push(`• السعرات: ${formatNumber(order.macros.calories)} سعرة`);
  lines.push(`• البروتين: ${order.macros.protein} غرام`);
  lines.push(`• الكاربوهيدرات: ${order.macros.carbs} غرام`);
  lines.push(`• الدهون: ${order.macros.fat} غرام`);
  lines.push(`• عدد الوجبات يومياً: ${order.macros.mealsPerDay}`);
  lines.push("");

  lines.push("💰 *الفاتورة*");
  lines.push(
    `• الوجبات: ${formatIQD(order.dailyTotal)} × ${order.durationDays} يوم = ${formatIQD(order.mealsTotal)}`,
  );
  lines.push(`• التوصيل: ${order.deliveryFee === 0 ? "مجاناً" : formatIQD(order.deliveryFee)}`);
  lines.push(`• *المجموع الكلي: ${formatIQD(order.total)} (IQD)*`);
  lines.push("————————————————");
  lines.push("✅ يرجى تأكيد الطلب وتحديد موعد أول توصيل.");

  return lines.join("\n");
}

/** Returns the wa.me deep link with the encoded order message. */
export function buildWhatsAppUrl(order: WhatsAppOrderPayload): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderMessage(order))}`;
}

/**
 * Opens WhatsApp with the prefilled order.
 * Must be called synchronously inside a user gesture so popup blockers allow it.
 */
export function openWhatsAppOrder(order: WhatsAppOrderPayload): void {
  const url = buildWhatsAppUrl(order);
  try {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}
