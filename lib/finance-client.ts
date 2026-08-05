import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { convert, getCachedRates, getAllRates } from "./exchange-rates";

function clean<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export { db } from "./firebase";
import type {
  FinanceAccount,
  Transaction,
  TransactionCategory,
  BudgetPlan,
  FinanceGoal,
  Loan,
  EmergencyFund,
  TransactionFilters,
  ShoppingList,
  RecurringTransaction,
} from "./finance-types";

const accountsCol = () => collection(db, "FINANCE_ACCOUNTS");
const categoriesCol = () => collection(db, "FINANCE_CATEGORIES");
const transactionsCol = () => collection(db, "FINANCE_TRANSACTIONS");
const budgetsCol = () => collection(db, "FINANCE_BUDGETS");
const goalsCol = () => collection(db, "FINANCE_GOALS");
const loansCol = () => collection(db, "FINANCE_LOANS");
const emergencyFundCol = () => collection(db, "FINANCE_EMERGENCY_FUND");
const shoppingListsCol = () => collection(db, "SHOPPING_LISTS");
const recurringCol = () => collection(db, "FINANCE_RECURRING");

async function resolveRates() {
  return getCachedRates() || (await getAllRates());
}

function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number {
  if (fromCurrency === toCurrency) return amount;
  return convert(amount, fromCurrency, toCurrency, rates);
}

function computeAccountUpdate(
  acc: FinanceAccount,
  newBalance: number,
  rates: Record<string, number>,
): Record<string, unknown> {
  const update: Record<string, unknown> = {
    balance: newBalance,
    updatedAt: new Date().toISOString(),
  };
  if (acc.type === "crypto" && acc.cryptoCoin) {
    const rateToCurrency = convert(1, acc.cryptoCoin, acc.currency, rates);
    if (rateToCurrency > 0) {
      update.cryptoAmount = newBalance / rateToCurrency;
    }
  }
  return update;
}

function toPlain<T>(snap: {
  id: string;
  data: () => object | undefined;
}): T & { id: string } {
  return { id: snap.id, ...snap.data()! } as T & { id: string };
}

async function applyGoalDelta(
  userId: string,
  categoryId: string | undefined,
  delta: number,
) {
  if (!categoryId || delta === 0) return;
  const q = query(
    goalsCol(),
    where("userId", "==", userId),
    where("categoryId", "==", categoryId),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const goal = toPlain<FinanceGoal>(snap.docs[0]);
  const newAmount = Math.max(0, goal.currentAmount + delta);
  await updateDoc(doc(goalsCol(), goal.id), {
    currentAmount: newAmount,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAccountsByUser(
  uid: string,
): Promise<FinanceAccount[]> {
  const q = query(accountsCol(), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPlain<FinanceAccount>(d));
}

export async function createAccount(
  data: Omit<FinanceAccount, "createdAt" | "updatedAt">,
): Promise<FinanceAccount> {
  const now = new Date().toISOString();
  const account: FinanceAccount = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(accountsCol(), account.id), clean(clean(account)));
  return account;
}

export async function updateAccount(
  id: string,
  data: Partial<
    Omit<FinanceAccount, "id" | "userId" | "createdAt" | "updatedAt">
  >,
): Promise<FinanceAccount> {
  const ref = doc(accountsCol(), id);
  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<FinanceAccount>(snap);
}

export async function deleteAccount(id: string): Promise<void> {
  await deleteDoc(doc(accountsCol(), id));
}

export async function getCategoriesByUser(
  uid: string,
): Promise<TransactionCategory[]> {
  const q = query(categoriesCol(), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPlain<TransactionCategory>(d));
}

export async function createCategory(
  data: Omit<TransactionCategory, "id">,
): Promise<TransactionCategory> {
  const ref = await addDoc(categoriesCol(), clean(data));
  const snap = await getDoc(ref);
  return toPlain<TransactionCategory>(snap);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(categoriesCol(), id));
}

export async function getTransactionsByUser(
  uid: string,
  filters?: TransactionFilters,
): Promise<Transaction[]> {
  let q = query(transactionsCol(), where("userId", "==", uid));
  if (filters?.type) q = query(q, where("type", "==", filters.type));
  if (filters?.categoryId)
    q = query(q, where("categoryId", "==", filters.categoryId));
  if (filters?.accountId)
    q = query(q, where("accountId", "==", filters.accountId));
  const snap = await getDocs(q);
  let results = snap.docs.map((d) => toPlain<Transaction>(d));
  if (filters?.dateFrom)
    results = results.filter((t) => t.date >= filters.dateFrom!);
  if (filters?.dateTo)
    results = results.filter((t) => t.date <= filters.dateTo!);
  if (filters?.tags && filters.tags.length > 0) {
    results = results.filter((t) =>
      filters.tags!.some((tag) => t.tags.includes(tag)),
    );
  }
  return results;
}

export async function createTransaction(
  data: Omit<Transaction, "createdAt" | "updatedAt">,
): Promise<Transaction> {
  const now = new Date().toISOString();
  const tx: Transaction = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(transactionsCol(), tx.id), clean(tx));

  const accRef = doc(accountsCol(), tx.accountId);
  const accSnap = await getDoc(accRef);
  if (accSnap.exists()) {
    const acc = toPlain<FinanceAccount>(accSnap);
    const txCurrency = tx.currency || acc.currency;
    const rates = await resolveRates();

    let delta = 0;
    if (tx.type === "income" || tx.type === "expense") {
      const converted = convertAmount(
        tx.amount,
        txCurrency,
        acc.currency,
        rates,
      );
      delta = tx.type === "income" ? converted : -converted;
    }

    if (delta !== 0) {
      const newBalance = acc.balance + delta;
      await updateDoc(
        accRef,
        clean(computeAccountUpdate(acc, newBalance, rates)),
      );
    }
  }

  const goalDelta =
    tx.type === "income" ? tx.amount : tx.type === "expense" ? -tx.amount : 0;
  await applyGoalDelta(tx.userId, tx.categoryId, goalDelta);

  return tx;
}

export async function updateTransaction(
  id: string,
  data: Partial<
    Pick<
      Transaction,
      | "amount"
      | "description"
      | "tags"
      | "date"
      | "categoryId"
      | "accountId"
      | "type"
      | "currency"
    >
  >,
): Promise<Transaction> {
  const ref = doc(transactionsCol(), id);
  const oldSnap = await getDoc(ref);
  if (oldSnap.exists()) {
    const old = toPlain<Transaction>(oldSnap);
    const rates = await resolveRates();

    const oldAccSnap = await getDoc(doc(accountsCol(), old.accountId));
    const oldAcc = oldAccSnap.exists()
      ? toPlain<FinanceAccount>(oldAccSnap)
      : null;
    const oldAccCurrency = oldAcc?.currency || "RUB";
    const oldTxCurrency = old.currency || oldAccCurrency;
    const oldConverted =
      old.type === "income" || old.type === "expense"
        ? convertAmount(old.amount, oldTxCurrency, oldAccCurrency, rates)
        : 0;
    const oldDelta = old.type === "income" ? oldConverted : -oldConverted;

    await updateDoc(
      ref,
      clean({ ...data, updatedAt: new Date().toISOString() }),
    );
    const newSnap = await getDoc(ref);
    const updated = toPlain<Transaction>(newSnap);

    const newAccSnap = await getDoc(doc(accountsCol(), updated.accountId));
    const newAcc = newAccSnap.exists()
      ? toPlain<FinanceAccount>(newAccSnap)
      : null;
    const newAccCurrency = newAcc?.currency || "RUB";
    const newTxCurrency = updated.currency || newAccCurrency;
    const newConverted =
      updated.type === "income" || updated.type === "expense"
        ? convertAmount(updated.amount, newTxCurrency, newAccCurrency, rates)
        : 0;
    const newDelta = updated.type === "income" ? newConverted : -newConverted;

    if (updated.accountId === old.accountId) {
      const netDelta = newDelta - oldDelta;
      if (netDelta !== 0 && newAcc) {
        await updateDoc(
          doc(accountsCol(), updated.accountId),
          clean(computeAccountUpdate(newAcc, newAcc.balance + netDelta, rates)),
        );
      }
    } else {
      if (oldDelta !== 0 && oldAcc) {
        await updateDoc(
          doc(accountsCol(), old.accountId),
          clean(computeAccountUpdate(oldAcc, oldAcc.balance - oldDelta, rates)),
        );
      }
      if (newDelta !== 0 && newAcc) {
        await updateDoc(
          doc(accountsCol(), updated.accountId),
          clean(computeAccountUpdate(newAcc, newAcc.balance + newDelta, rates)),
        );
      }
    }

    const oldGoalDelta =
      old.type === "income"
        ? old.amount
        : old.type === "expense"
          ? -old.amount
          : 0;
    const newGoalDelta =
      updated.type === "income"
        ? updated.amount
        : updated.type === "expense"
          ? -updated.amount
          : 0;

    if (old.categoryId === updated.categoryId) {
      const netGoal = newGoalDelta - oldGoalDelta;
      if (netGoal !== 0)
        await applyGoalDelta(updated.userId, updated.categoryId, netGoal);
    } else {
      if (oldGoalDelta !== 0)
        await applyGoalDelta(updated.userId, old.categoryId, -oldGoalDelta);
      if (newGoalDelta !== 0)
        await applyGoalDelta(updated.userId, updated.categoryId, newGoalDelta);
    }

    return updated;
  }

  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<Transaction>(snap);
}

export async function deleteTransaction(id: string): Promise<void> {
  const ref = doc(transactionsCol(), id);
  await deleteDoc(ref);
}

export async function getBudgetPlansByUser(uid: string): Promise<BudgetPlan[]> {
  const q = query(budgetsCol(), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPlain<BudgetPlan>(d));
}

export async function createBudgetPlan(
  data: Omit<BudgetPlan, "createdAt" | "updatedAt">,
): Promise<BudgetPlan> {
  const now = new Date().toISOString();
  const plan: BudgetPlan = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(budgetsCol(), plan.id), clean(plan));
  return plan;
}

export async function updateBudgetPlan(
  id: string,
  data: Partial<Pick<BudgetPlan, "expectedIncome" | "categoryBudgets">>,
): Promise<BudgetPlan> {
  const ref = doc(budgetsCol(), id);
  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<BudgetPlan>(snap);
}

export async function deleteBudgetPlan(id: string): Promise<void> {
  await deleteDoc(doc(budgetsCol(), id));
}

export async function getGoalsByUser(uid: string): Promise<FinanceGoal[]> {
  const q = query(goalsCol(), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPlain<FinanceGoal>(d));
}

export async function createGoal(
  data: Omit<FinanceGoal, "createdAt" | "updatedAt">,
): Promise<FinanceGoal> {
  const now = new Date().toISOString();
  const goal: FinanceGoal = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(goalsCol(), goal.id), clean(goal));
  return goal;
}

export async function updateGoal(
  id: string,
  data: Partial<
    Pick<
      FinanceGoal,
      | "name"
      | "targetAmount"
      | "currentAmount"
      | "deadline"
      | "priority"
      | "accountId"
      | "autoDepositPercent"
      | "completed"
    >
  >,
): Promise<FinanceGoal> {
  const ref = doc(goalsCol(), id);
  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<FinanceGoal>(snap);
}

export async function deleteGoal(id: string): Promise<void> {
  await deleteDoc(doc(goalsCol(), id));
}

export async function getLoansByUser(uid: string): Promise<Loan[]> {
  const q = query(loansCol(), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPlain<Loan>(d));
}

export async function createLoan(
  data: Omit<Loan, "createdAt" | "updatedAt">,
): Promise<Loan> {
  const now = new Date().toISOString();
  const loan: Loan = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(loansCol(), loan.id), clean(loan));
  return loan;
}

export async function updateLoan(
  id: string,
  data: Partial<Omit<Loan, "id" | "userId" | "createdAt" | "updatedAt">>,
): Promise<Loan> {
  const ref = doc(loansCol(), id);
  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<Loan>(snap);
}

export async function deleteLoan(id: string): Promise<void> {
  await deleteDoc(doc(loansCol(), id));
}

export async function getEmergencyFund(
  uid: string,
): Promise<EmergencyFund | null> {
  const q = query(emergencyFundCol(), where("userId", "==", uid), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return toPlain<EmergencyFund>(snap.docs[0]);
}

export async function upsertEmergencyFund(
  uid: string,
  data: Omit<EmergencyFund, "id" | "userId">,
): Promise<EmergencyFund> {
  const q = query(emergencyFundCol(), where("userId", "==", uid), limit(1));
  const existing = await getDocs(q);
  if (existing.empty) {
    const ref = await addDoc(
      emergencyFundCol(),
      clean({ ...data, userId: uid }),
    );
    const snap = await getDoc(ref);
    return toPlain<EmergencyFund>(snap);
  }
  const ref = existing.docs[0].ref;
  await updateDoc(ref, clean(data as Record<string, unknown>));
  const snap = await getDoc(ref);
  return toPlain<EmergencyFund>(snap);
}

export async function getShoppingListsByUser(
  uid: string,
): Promise<ShoppingList[]> {
  const q = query(shoppingListsCol(), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPlain<ShoppingList>(d));
}

export async function createShoppingList(
  data: Omit<ShoppingList, "createdAt" | "updatedAt">,
): Promise<ShoppingList> {
  const now = new Date().toISOString();
  const list: ShoppingList = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(shoppingListsCol(), list.id), clean(list));
  return list;
}

export async function updateShoppingList(
  id: string,
  data: Partial<
    Omit<ShoppingList, "id" | "userId" | "createdAt" | "updatedAt">
  >,
): Promise<ShoppingList> {
  const ref = doc(shoppingListsCol(), id);
  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<ShoppingList>(snap);
}

export async function deleteShoppingList(id: string): Promise<void> {
  await deleteDoc(doc(shoppingListsCol(), id));
}

// --- Recurring Transactions ---

export async function getRecurringTransactionsByUser(
  uid: string,
): Promise<RecurringTransaction[]> {
  const q = query(recurringCol(), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPlain<RecurringTransaction>(d));
}

export async function createRecurringTransaction(
  data: Omit<RecurringTransaction, "createdAt" | "updatedAt">,
): Promise<RecurringTransaction> {
  const now = new Date().toISOString();
  const rt: RecurringTransaction = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(recurringCol(), rt.id), clean(rt));
  return rt;
}

export async function updateRecurringTransaction(
  id: string,
  data: Partial<
    Omit<RecurringTransaction, "id" | "userId" | "createdAt" | "updatedAt">
  >,
): Promise<RecurringTransaction> {
  const ref = doc(recurringCol(), id);
  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<RecurringTransaction>(snap);
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  await deleteDoc(doc(recurringCol(), id));
}
