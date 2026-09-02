import { getAdminDb } from "./firebase-admin";
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

const COL = (name: string) => name;
const toPlain = <T>(snap: {
  id: string;
  data: () => T;
}): T & { id: string } => ({
  id: snap.id,
  ...snap.data(),
});

/**
 * Verifies a document exists in `collection`, has id `id`, and belongs to `uid`
 * (its stored `userId` field). Used before update/delete to prevent
 * cross-user reads and writes through the API.
 */
export async function ensureOwned(
  collection: string,
  id: string,
  uid: string,
): Promise<boolean> {
  const snap = await getAdminDb().collection(collection).doc(id).get();
  if (!snap.exists) return false;
  return (snap.data()?.userId ?? null) === uid;
}

// --- Accounts ---

export async function getAccountsByUser(
  uid: string,
): Promise<FinanceAccount[]> {
  const snap = await getAdminDb()
    .collection(COL("FINANCE_ACCOUNTS"))
    .where("userId", "==", uid)
    .get();
  return snap.docs.map((d) => toPlain(d) as FinanceAccount);
}

export async function createAccount(
  data: Omit<FinanceAccount, "createdAt" | "updatedAt">,
): Promise<FinanceAccount> {
  const now = new Date().toISOString();
  const account: FinanceAccount = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb()
    .collection(COL("FINANCE_ACCOUNTS"))
    .doc(account.id)
    .set(account);
  return account;
}

export async function updateAccount(
  id: string,
  data: Partial<
    Omit<FinanceAccount, "id" | "userId" | "createdAt" | "updatedAt">
  >,
): Promise<FinanceAccount> {
  await getAdminDb()
    .collection(COL("FINANCE_ACCOUNTS"))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb()
    .collection(COL("FINANCE_ACCOUNTS"))
    .doc(id)
    .get();
  return toPlain(snap) as FinanceAccount;
}

export async function deleteAccount(id: string): Promise<void> {
  await getAdminDb().collection(COL("FINANCE_ACCOUNTS")).doc(id).delete();
}

// --- Categories ---

export async function getCategoriesByUser(
  uid: string,
): Promise<TransactionCategory[]> {
  const snap = await getAdminDb()
    .collection(COL("FINANCE_CATEGORIES"))
    .where("userId", "==", uid)
    .get();
  return snap.docs.map((d) => toPlain(d) as TransactionCategory);
}

export async function createCategory(
  data: Omit<TransactionCategory, "id">,
): Promise<TransactionCategory> {
  const docRef = await getAdminDb()
    .collection(COL("FINANCE_CATEGORIES"))
    .add(data);
  const snap = await docRef.get();
  return toPlain(snap) as TransactionCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  await getAdminDb().collection(COL("FINANCE_CATEGORIES")).doc(id).delete();
}

// --- Transactions ---

export async function getTransactionsByUser(
  uid: string,
  filters?: TransactionFilters,
): Promise<Transaction[]> {
  let query: FirebaseFirestore.Query = getAdminDb()
    .collection(COL("FINANCE_TRANSACTIONS"))
    .where("userId", "==", uid);

  if (filters?.type) query = query.where("type", "==", filters.type);
  if (filters?.categoryId)
    query = query.where("categoryId", "==", filters.categoryId);
  if (filters?.accountId)
    query = query.where("accountId", "==", filters.accountId);

  const snap = await query.orderBy("date", "desc").get();
  let results = snap.docs.map((d) => toPlain(d) as Transaction);

  if (filters?.dateFrom) {
    results = results.filter((t) => t.date >= filters.dateFrom!);
  }
  if (filters?.dateTo) {
    results = results.filter((t) => t.date <= filters.dateTo!);
  }
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
  await getAdminDb().collection(COL("FINANCE_TRANSACTIONS")).doc(tx.id).set(tx);
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
      | "toAccountId"
      | "type"
    >
  >,
): Promise<Transaction> {
  await getAdminDb()
    .collection(COL("FINANCE_TRANSACTIONS"))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb()
    .collection(COL("FINANCE_TRANSACTIONS"))
    .doc(id)
    .get();
  return toPlain(snap) as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  await getAdminDb().collection(COL("FINANCE_TRANSACTIONS")).doc(id).delete();
}

// --- Budget Plans ---

export async function getBudgetPlansByUser(uid: string): Promise<BudgetPlan[]> {
  const snap = await getAdminDb()
    .collection(COL("FINANCE_BUDGETS"))
    .where("userId", "==", uid)
    .get();
  return snap.docs.map((d) => toPlain(d) as BudgetPlan);
}

export async function createBudgetPlan(
  data: Omit<BudgetPlan, "createdAt" | "updatedAt">,
): Promise<BudgetPlan> {
  const now = new Date().toISOString();
  const plan: BudgetPlan = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb().collection(COL("FINANCE_BUDGETS")).doc(plan.id).set(plan);
  return plan;
}

export async function updateBudgetPlan(
  id: string,
  data: Partial<Pick<BudgetPlan, "expectedIncome" | "categoryBudgets">>,
): Promise<BudgetPlan> {
  await getAdminDb()
    .collection(COL("FINANCE_BUDGETS"))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb()
    .collection(COL("FINANCE_BUDGETS"))
    .doc(id)
    .get();
  return toPlain(snap) as BudgetPlan;
}

export async function deleteBudgetPlan(id: string): Promise<void> {
  await getAdminDb().collection(COL("FINANCE_BUDGETS")).doc(id).delete();
}

// --- Goals ---

export async function getGoalsByUser(uid: string): Promise<FinanceGoal[]> {
  const snap = await getAdminDb()
    .collection(COL("FINANCE_GOALS"))
    .where("userId", "==", uid)
    .get();
  return snap.docs.map((d) => toPlain(d) as FinanceGoal);
}

export async function createGoal(
  data: Omit<FinanceGoal, "createdAt" | "updatedAt">,
): Promise<FinanceGoal> {
  const now = new Date().toISOString();
  const goal: FinanceGoal = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb().collection(COL("FINANCE_GOALS")).doc(goal.id).set(goal);
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
  await getAdminDb()
    .collection(COL("FINANCE_GOALS"))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb()
    .collection(COL("FINANCE_GOALS"))
    .doc(id)
    .get();
  return toPlain(snap) as FinanceGoal;
}

export async function deleteGoal(id: string): Promise<void> {
  await getAdminDb().collection(COL("FINANCE_GOALS")).doc(id).delete();
}

// --- Loans ---

export async function getLoansByUser(uid: string): Promise<Loan[]> {
  const snap = await getAdminDb()
    .collection(COL("FINANCE_LOANS"))
    .where("userId", "==", uid)
    .get();
  return snap.docs.map((d) => toPlain(d) as Loan);
}

export async function createLoan(
  data: Omit<Loan, "createdAt" | "updatedAt">,
): Promise<Loan> {
  const now = new Date().toISOString();
  const loan: Loan = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb().collection(COL("FINANCE_LOANS")).doc(loan.id).set(loan);
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
  await getAdminDb()
    .collection(COL("FINANCE_LOANS"))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb()
    .collection(COL("FINANCE_LOANS"))
    .doc(id)
    .get();
  return toPlain(snap) as Loan;
}

export async function deleteLoan(id: string): Promise<void> {
  await getAdminDb().collection(COL("FINANCE_LOANS")).doc(id).delete();
}

// --- Emergency Fund ---

export async function getEmergencyFund(
  uid: string,
): Promise<EmergencyFund | null> {
  const snap = await getAdminDb()
    .collection(COL("FINANCE_EMERGENCY_FUND"))
    .where("userId", "==", uid)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return toPlain(snap.docs[0]) as EmergencyFund;
}

export async function upsertEmergencyFund(
  uid: string,
  data: Omit<EmergencyFund, "id" | "userId">,
): Promise<EmergencyFund> {
  const existing = await getAdminDb()
    .collection(COL("FINANCE_EMERGENCY_FUND"))
    .where("userId", "==", uid)
    .limit(1)
    .get();

  if (existing.empty) {
    const docRef = await getAdminDb()
      .collection(COL("FINANCE_EMERGENCY_FUND"))
      .add({ ...data, userId: uid });
    const snap = await docRef.get();
    return toPlain(snap) as EmergencyFund;
  }

  await existing.docs[0].ref.update(data);
  const snap = await existing.docs[0].ref.get();
  return toPlain(snap) as EmergencyFund;
}

// --- Recurring Transactions ---

export async function getRecurringTransactionsByUser(
  uid: string,
): Promise<RecurringTransaction[]> {
  const snap = await getAdminDb()
    .collection(COL("FINANCE_RECURRING"))
    .where("userId", "==", uid)
    .get();
  return snap.docs.map((d) => toPlain(d) as RecurringTransaction);
}

export async function createRecurringTransaction(
  data: Omit<RecurringTransaction, "createdAt" | "updatedAt">,
): Promise<RecurringTransaction> {
  const now = new Date().toISOString();
  const rt: RecurringTransaction = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb().collection(COL("FINANCE_RECURRING")).doc(rt.id).set(rt);
  return rt;
}

export async function updateRecurringTransaction(
  id: string,
  data: Partial<
    Omit<RecurringTransaction, "id" | "userId" | "createdAt" | "updatedAt">
  >,
): Promise<RecurringTransaction> {
  await getAdminDb()
    .collection(COL("FINANCE_RECURRING"))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb()
    .collection(COL("FINANCE_RECURRING"))
    .doc(id)
    .get();
  return toPlain(snap) as RecurringTransaction;
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  await getAdminDb().collection(COL("FINANCE_RECURRING")).doc(id).delete();
}

// --- Shopping Lists ---

export async function getShoppingListsByUser(
  uid: string,
): Promise<ShoppingList[]> {
  const snap = await getAdminDb()
    .collection(COL("SHOPPING_LISTS"))
    .where("userId", "==", uid)
    .get();
  return snap.docs.map((d) => toPlain(d) as ShoppingList);
}

export async function createShoppingList(
  data: Omit<ShoppingList, "createdAt" | "updatedAt">,
): Promise<ShoppingList> {
  const now = new Date().toISOString();
  const list: ShoppingList = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb().collection(COL("SHOPPING_LISTS")).doc(list.id).set(list);
  return list;
}

export async function updateShoppingList(
  id: string,
  data: Partial<
    Omit<ShoppingList, "id" | "userId" | "createdAt" | "updatedAt">
  >,
): Promise<ShoppingList> {
  await getAdminDb()
    .collection(COL("SHOPPING_LISTS"))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb()
    .collection(COL("SHOPPING_LISTS"))
    .doc(id)
    .get();
  return toPlain(snap) as ShoppingList;
}

export async function deleteShoppingList(id: string): Promise<void> {
  await getAdminDb().collection(COL("SHOPPING_LISTS")).doc(id).delete();
}
