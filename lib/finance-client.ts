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
  FinanceProject,
  EmergencyFund,
  TransactionFilters,
} from "./finance-types";

const accountsCol = () => collection(db, "FINANCE_ACCOUNTS");
const categoriesCol = () => collection(db, "FINANCE_CATEGORIES");
const transactionsCol = () => collection(db, "FINANCE_TRANSACTIONS");
const budgetsCol = () => collection(db, "FINANCE_BUDGETS");
const goalsCol = () => collection(db, "FINANCE_GOALS");
const loansCol = () => collection(db, "FINANCE_LOANS");
const projectsCol = () => collection(db, "FINANCE_PROJECTS");
const emergencyFundCol = () => collection(db, "FINANCE_EMERGENCY_FUND");

function toPlain<T>(snap: {
  id: string;
  data: () => object | undefined;
}): T & { id: string } {
  return { id: snap.id, ...snap.data()! } as T & { id: string };
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
    const delta =
      tx.type === "income" ? tx.amount : tx.type === "expense" ? -tx.amount : 0;
    if (delta !== 0) {
      await updateDoc(
        accRef,
        clean({
          balance: acc.balance + delta,
          updatedAt: new Date().toISOString(),
        }),
      );
    }
  }

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
    >
  >,
): Promise<Transaction> {
  const ref = doc(transactionsCol(), id);
  const oldSnap = await getDoc(ref);
  if (oldSnap.exists()) {
    const old = toPlain<Transaction>(oldSnap);
    const oldDelta =
      old.type === "income"
        ? old.amount
        : old.type === "expense"
          ? -old.amount
          : 0;

    await updateDoc(
      ref,
      clean({ ...data, updatedAt: new Date().toISOString() }),
    );
    const newSnap = await getDoc(ref);
    const updated = toPlain<Transaction>(newSnap);

    const newDelta =
      updated.type === "income"
        ? updated.amount
        : updated.type === "expense"
          ? -updated.amount
          : 0;
    const netDelta = newDelta - oldDelta;

    if (netDelta !== 0) {
      const accRef = doc(accountsCol(), updated.accountId);
      const accSnap = await getDoc(accRef);
      if (accSnap.exists()) {
        const acc = toPlain<FinanceAccount>(accSnap);
        await updateDoc(
          accRef,
          clean({
            balance: acc.balance + netDelta,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
    }

    return updated;
  }

  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<Transaction>(snap);
}

export async function deleteTransaction(id: string): Promise<void> {
  const ref = doc(transactionsCol(), id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const tx = toPlain<Transaction>(snap);
    const delta =
      tx.type === "income" ? -tx.amount : tx.type === "expense" ? tx.amount : 0;
    if (delta !== 0) {
      const accRef = doc(accountsCol(), tx.accountId);
      const accSnap = await getDoc(accRef);
      if (accSnap.exists()) {
        const acc = toPlain<FinanceAccount>(accSnap);
        await updateDoc(
          accRef,
          clean({
            balance: acc.balance + delta,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
    }
  }
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
  data: Partial<
    Pick<
      Loan,
      | "name"
      | "totalAmount"
      | "interestRate"
      | "monthlyPayment"
      | "remainingAmount"
      | "nextPaymentDate"
    >
  >,
): Promise<Loan> {
  const ref = doc(loansCol(), id);
  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<Loan>(snap);
}

export async function deleteLoan(id: string): Promise<void> {
  await deleteDoc(doc(loansCol(), id));
}

export async function getProjectsByUser(
  uid: string,
): Promise<FinanceProject[]> {
  const q = query(projectsCol(), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPlain<FinanceProject>(d));
}

export async function createProject(
  data: Omit<FinanceProject, "createdAt" | "updatedAt">,
): Promise<FinanceProject> {
  const now = new Date().toISOString();
  const project: FinanceProject = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(projectsCol(), project.id), clean(project));
  return project;
}

export async function updateProject(
  id: string,
  data: Partial<
    Pick<
      FinanceProject,
      | "name"
      | "icon"
      | "targetAmount"
      | "savedAmount"
      | "deadline"
      | "description"
      | "linkedCategoryIds"
      | "color"
      | "completed"
    >
  >,
): Promise<FinanceProject> {
  const ref = doc(projectsCol(), id);
  await updateDoc(ref, clean({ ...data, updatedAt: new Date().toISOString() }));
  const snap = await getDoc(ref);
  return toPlain<FinanceProject>(snap);
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(projectsCol(), id));
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
