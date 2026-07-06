export type TransactionType = "income" | "expense" | "transfer";
export type BudgetPeriod = "day" | "week" | "month" | "year";
export type GoalPriority = "high" | "medium" | "low";

export interface FinanceAccount {
  id: string;
  userId: string;
  name: string;
  type: "cash" | "card" | "crypto" | "investment" | "savings";
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCategory {
  id: string;
  userId: string;
  name: string;
  icon: string;
  type: TransactionType;
  color: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  description: string;
  tags: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetPlan {
  id: string;
  userId: string;
  period: BudgetPeriod;
  periodStart: string;
  periodEnd: string;
  expectedIncome: number;
  categoryBudgets: { categoryId: string; limit: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface FinanceGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: GoalPriority;
  accountId?: string;
  autoDepositPercent?: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  interestRate: number;
  monthlyPayment: number;
  remainingAmount: number;
  nextPaymentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyFund {
  id: string;
  userId: string;
  targetAmount: number;
  currentAmount: number;
}

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}
