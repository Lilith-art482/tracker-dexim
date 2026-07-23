export type TransactionType = "income" | "expense" | "transfer";
export type BudgetPeriod = "day" | "week" | "month" | "year";
export type GoalPriority = "high" | "medium" | "low";

export interface FinanceAccount {
  id: string;
  userId: string;
  name: string;
  type: "cash" | "card" | "crypto" | "investment" | "savings" | "deposit";
  balance: number;
  currency: string;
  cardType?: "debit" | "credit" | "business";
  cryptoCoin?: string;
  /** Amount of cryptoCoin held (fixed). Balance is computed: cryptoAmount × rate(cryptoCoin → currency) */
  cryptoAmount?: number;
  walletName?: string;
  walletAddress?: string;
  url?: string;
  sortOrder?: number;
  priority?: "high" | "medium" | "low";
  interestRate?: number;
  termMonths?: number;
  startDate?: string;
  capitalizeInterest?: boolean;
  gracePeriodDays?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const CURRENCIES: {
  code: string;
  symbol: string;
  label: string;
  type: string;
}[] = [
  { code: "RUB", symbol: "₽", label: "Российский рубль", type: "fiat" },
  { code: "USD", symbol: "$", label: "Доллар США", type: "fiat" },
  { code: "EUR", symbol: "€", label: "Евро", type: "fiat" },
  { code: "CNY", symbol: "¥", label: "Китайский юань", type: "fiat" },
  { code: "UAH", symbol: "₴", label: "Украинская гривна", type: "fiat" },
  { code: "KZT", symbol: "₸", label: "Казахстанский тенге", type: "fiat" },
  { code: "BYN", symbol: "Br", label: "Белорусский рубль", type: "fiat" },
  { code: "AMD", symbol: "֏", label: "Армянский драм", type: "fiat" },
  { code: "AED", symbol: "د.إ", label: "Дирхам ОАЭ", type: "fiat" },
  { code: "TRY", symbol: "₺", label: "Турецкая лира", type: "fiat" },
  { code: "PLN", symbol: "zł", label: "Польский злотый", type: "fiat" },
  { code: "USDT", symbol: "₮", label: "Tether", type: "crypto" },
  { code: "USDC", symbol: "₮", label: "USD Coin", type: "crypto" },
  { code: "BTC", symbol: "₿", label: "Bitcoin", type: "crypto" },
  { code: "SOL", symbol: "SOL", label: "Solana", type: "crypto" },
  { code: "TON", symbol: "TON", label: "TON (GRAM)", type: "crypto" },
  { code: "ETH", symbol: "⟠", label: "Ethereum", type: "crypto" },
  { code: "BNB", symbol: "BNB", label: "BNB", type: "crypto" },
  { code: "TRX", symbol: "TRX", label: "Tron", type: "crypto" },
];

export interface TransactionCategory {
  id: string;
  userId: string;
  name: string;
  icon: string;
  type: TransactionType;
  color: string;
  isArchived?: boolean;
  isPinned?: boolean;
  sortOrder?: number;
  monthlyBudget?: number;
  showInBudget?: boolean;
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

export type ObligationType = "credit" | "enforcement" | "fine" | "utilities";

export interface Loan {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  interestRate: number;
  monthlyPayment: number;
  remainingAmount: number;
  nextPaymentDate: string;
  repaymentType: "monthly" | "lumpSum";
  dueDate?: string;
  obligationType: ObligationType;
  categoryId?: string;
  overdueMonths: number;
  /** For enforcement */
  enforcementFee?: number;
  officialIncome?: number;
  fsspPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceProject {
  id: string;
  userId: string;
  name: string;
  icon: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  description?: string;
  linkedCategoryIds: string[];
  color: string;
  completed: boolean;
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

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  amount?: number;
  accountId?: string;
  transactionId?: string;
}

export type RecurringInterval = "weekly" | "monthly" | "yearly";

export interface RecurringTransaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  interval: RecurringInterval;
  dayOfMonth: number;
  month?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  lastGeneratedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  date: string;
  items: ShoppingItem[];
  completed: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
