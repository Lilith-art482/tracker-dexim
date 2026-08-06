import { auth } from "./firebase";
import {
  getRecurringTransactionsByUser,
  updateRecurringTransaction,
  createTransaction,
} from "./finance-client";
import type { RecurringTransaction } from "./finance-types";
import { localDateStr, parseLocalDate, todayStart } from "./date-utils";

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function computeNextDate(rt: RecurringTransaction): string | null {
  const today = todayStart();
  const start = parseLocalDate(rt.startDate);
  const end = rt.endDate ? parseLocalDate(rt.endDate) : null;

  if (today < start) return null;
  if (end && today > end) return null;

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  let candidate: Date | null = null;

  if (rt.interval === "monthly") {
    const maxDay = lastDayOfMonth(currentYear, currentMonth + 1);
    const day = Math.min(rt.dayOfMonth, maxDay);
    candidate = new Date(currentYear, currentMonth, day);
    if (candidate < start) {
      const nextMonth = currentMonth + 1;
      const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
      const nextMaxDay = lastDayOfMonth(nextYear, (nextMonth % 12) + 1);
      candidate = new Date(
        nextYear,
        nextMonth % 12,
        Math.min(rt.dayOfMonth, nextMaxDay),
      );
    }
  } else if (rt.interval === "weekly") {
    const diff = (rt.dayOfMonth - today.getDay() + 7) % 7;
    candidate = new Date(currentYear, currentMonth, currentDay + diff);
    if (candidate < start) {
      candidate = new Date(candidate.getTime() + 7 * 86400000);
    }
  } else if (rt.interval === "yearly") {
    const month = (rt.month ?? 1) - 1;
    const maxDay = lastDayOfMonth(currentYear, month + 1);
    const day = Math.min(rt.dayOfMonth, maxDay);
    candidate = new Date(currentYear, month, day);
    if (candidate < start) {
      candidate = new Date(
        currentYear + 1,
        month,
        Math.min(rt.dayOfMonth, lastDayOfMonth(currentYear + 1, month + 1)),
      );
    }
  }

  if (!candidate) return null;
  if (end && candidate > end) return null;
  return localDateStr(candidate);
}

function isDue(rt: RecurringTransaction): boolean {
  const next = computeNextDate(rt);
  if (!next) return false;
  const today = localDateStr();
  return (
    next <= today && (!rt.lastGeneratedDate || rt.lastGeneratedDate < next)
  );
}

export async function syncRecurringTransactions(): Promise<number> {
  const uid = auth.currentUser?.uid;
  if (!uid) return 0;

  const recurring = await getRecurringTransactionsByUser(uid);
  let generatedCount = 0;

  for (const rt of recurring) {
    if (!rt.isActive) continue;
    if (!isDue(rt)) continue;

    const nextDate = computeNextDate(rt);
    if (!nextDate) continue;

    await createTransaction({
      id: crypto.randomUUID(),
      userId: rt.userId,
      accountId: rt.accountId,
      categoryId: rt.categoryId,
      type: rt.type,
      amount: rt.amount,
      description: rt.description + " (регулярная)",
      tags: ["recurring"],
      date: nextDate,
    });

    await updateRecurringTransaction(rt.id, {
      lastGeneratedDate: nextDate,
    });

    generatedCount++;
  }

  return generatedCount;
}
