import { auth } from "./firebase";
import {
  getRecurringTransactionsByUser,
  updateRecurringTransaction,
  createTransaction,
} from "./finance-client";
import type { RecurringTransaction } from "./finance-types";

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function computeNextDate(rt: RecurringTransaction): string | null {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(rt.startDate + "T00:00:00Z");
  const end = rt.endDate ? new Date(rt.endDate + "T00:00:00Z") : null;

  if (today < start) return null;
  if (end && today > end) return null;

  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth();
  const currentDay = today.getUTCDate();

  let candidate: Date | null = null;

  if (rt.interval === "monthly") {
    const maxDay = lastDayOfMonth(currentYear, currentMonth + 1);
    const day = Math.min(rt.dayOfMonth, maxDay);
    candidate = new Date(Date.UTC(currentYear, currentMonth, day));
    if (candidate < start) {
      const nextMonth = currentMonth + 1;
      const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
      const nextMaxDay = lastDayOfMonth(nextYear, (nextMonth % 12) + 1);
      candidate = new Date(
        Date.UTC(nextYear, nextMonth % 12, Math.min(rt.dayOfMonth, nextMaxDay)),
      );
    }
  } else if (rt.interval === "weekly") {
    const diff = (rt.dayOfMonth - today.getUTCDay() + 7) % 7;
    candidate = new Date(
      Date.UTC(currentYear, currentMonth, currentDay + diff),
    );
    if (candidate < start) {
      candidate = new Date(candidate.getTime() + 7 * 86400000);
    }
  } else if (rt.interval === "yearly") {
    const month = (rt.month ?? 1) - 1;
    const maxDay = lastDayOfMonth(currentYear, month + 1);
    const day = Math.min(rt.dayOfMonth, maxDay);
    candidate = new Date(Date.UTC(currentYear, month, day));
    if (candidate < start) {
      candidate = new Date(
        Date.UTC(
          currentYear + 1,
          month,
          Math.min(rt.dayOfMonth, lastDayOfMonth(currentYear + 1, month + 1)),
        ),
      );
    }
  }

  if (!candidate) return null;
  if (end && candidate > end) return null;
  return candidate.toISOString().split("T")[0];
}

function isDue(rt: RecurringTransaction): boolean {
  const next = computeNextDate(rt);
  if (!next) return false;
  const today = new Date().toISOString().split("T")[0];
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
