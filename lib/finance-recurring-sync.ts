import { auth } from "./firebase";
import { getRecurringTransactionsByUser, updateRecurringTransaction, createTransaction } from "./finance-client";
import type { RecurringTransaction } from "./finance-types";

function computeNextDate(rt: RecurringTransaction): string | null {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(rt.startDate + "T00:00:00Z");
  const end = rt.endDate ? new Date(rt.endDate + "T00:00:00Z") : null;

  if (today < start) return null;
  if (end && today > end) return null;

  let candidate = new Date(start);

  if (rt.interval === "monthly") {
    const day = Math.min(rt.dayOfMonth, 28);
    candidate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), day));
    if (candidate < start) {
      candidate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, day));
    }
  } else if (rt.interval === "weekly") {
    const diff = (rt.dayOfMonth - today.getUTCDay() + 7) % 7;
    candidate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + diff));
    if (candidate < start) {
      candidate = new Date(candidate.getTime() + 7 * 86400000);
    }
  } else if (rt.interval === "yearly") {
    const month = (rt.month ?? 1) - 1;
    const day = Math.min(rt.dayOfMonth, 28);
    candidate = new Date(Date.UTC(today.getUTCFullYear(), month, day));
    if (candidate < start) {
      candidate = new Date(Date.UTC(today.getUTCFullYear() + 1, month, day));
    }
  }

  if (end && candidate > end) return null;
  return candidate.toISOString().split("T")[0];
}

function isDue(rt: RecurringTransaction): boolean {
  const next = computeNextDate(rt);
  if (!next) return false;
  const today = new Date().toISOString().split("T")[0];
  return next <= today && (!rt.lastGeneratedDate || rt.lastGeneratedDate < next);
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
