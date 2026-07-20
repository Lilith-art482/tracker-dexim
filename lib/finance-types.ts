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
  walletName?: string;
  walletAddress?: string;
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
  { code: "GBP", symbol: "£", label: "Британский фунт", type: "fiat" },
  { code: "JPY", symbol: "¥", label: "Японская иена", type: "fiat" },
  { code: "KZT", symbol: "₸", label: "Казахстанский тенге", type: "fiat" },
  { code: "BYN", symbol: "Br", label: "Белорусский рубль", type: "fiat" },
  { code: "UAH", symbol: "₴", label: "Украинская гривна", type: "fiat" },
  { code: "AMD", symbol: "֏", label: "Армянский драм", type: "fiat" },
  { code: "GEL", symbol: "₾", label: "Грузинский лари", type: "fiat" },
  { code: "AZN", symbol: "₼", label: "Азербайджанский манат", type: "fiat" },
  { code: "KGS", symbol: "с", label: "Киргизский сом", type: "fiat" },
  { code: "TJS", symbol: "₸", label: "Таджикский сомони", type: "fiat" },
  { code: "TRY", symbol: "₺", label: "Турецкая лира", type: "fiat" },
  { code: "AED", symbol: "د.إ", label: "Дирхам ОАЭ", type: "fiat" },
  { code: "THB", symbol: "฿", label: "Тайский бат", type: "fiat" },
  { code: "VND", symbol: "₫", label: "Вьетнамский донг", type: "fiat" },
  { code: "IDR", symbol: "Rp", label: "Индонезийская рупия", type: "fiat" },
  { code: "KRW", symbol: "₩", label: "Южнокорейская вона", type: "fiat" },
  { code: "INR", symbol: "₹", label: "Индийская рупия", type: "fiat" },
  { code: "BRL", symbol: "R$", label: "Бразильский реал", type: "fiat" },
  { code: "MXN", symbol: "$", label: "Мексиканское песо", type: "fiat" },
  { code: "ZAR", symbol: "R", label: "Южноафриканский рэнд", type: "fiat" },
  { code: "CHF", symbol: "₣", label: "Швейцарский франк", type: "fiat" },
  { code: "SEK", symbol: "kr", label: "Шведская крона", type: "fiat" },
  { code: "NOK", symbol: "kr", label: "Норвежская крона", type: "fiat" },
  { code: "DKK", symbol: "kr", label: "Датская крона", type: "fiat" },
  { code: "PLN", symbol: "zł", label: "Польский злотый", type: "fiat" },
  { code: "CZK", symbol: "Kč", label: "Чешская крона", type: "fiat" },
  { code: "HUF", symbol: "Ft", label: "Венгерский форинт", type: "fiat" },
  { code: "RON", symbol: "lei", label: "Румынский лей", type: "fiat" },
  { code: "BGN", symbol: "лв", label: "Болгарский лев", type: "fiat" },
  { code: "ISK", symbol: "kr", label: "Исландская крона", type: "fiat" },
  { code: "RSD", symbol: "дин", label: "Сербский динар", type: "fiat" },
  { code: "MDL", symbol: "L", label: "Молдавский лей", type: "fiat" },
  { code: "UZS", symbol: "сўм", label: "Узбекский сум", type: "fiat" },
  { code: "TMT", symbol: "m", label: "Туркменский манат", type: "fiat" },
  { code: "MNT", symbol: "₮", label: "Монгольский тугрик", type: "fiat" },
  { code: "ILS", symbol: "₪", label: "Израильский шекель", type: "fiat" },
  { code: "SAR", symbol: "﷼", label: "Саудовский риал", type: "fiat" },
  { code: "EGP", symbol: "£", label: "Египетский фунт", type: "fiat" },
  { code: "NGN", symbol: "₦", label: "Нигерийская найра", type: "fiat" },
  { code: "ARS", symbol: "$", label: "Аргентинское песо", type: "fiat" },
  { code: "CLP", symbol: "$", label: "Чилийское песо", type: "fiat" },
  { code: "COP", symbol: "$", label: "Колумбийское песо", type: "fiat" },
  { code: "PEN", symbol: "S/", label: "Перуанский соль", type: "fiat" },
  { code: "AUD", symbol: "$", label: "Австралийский доллар", type: "fiat" },
  { code: "CAD", symbol: "$", label: "Канадский доллар", type: "fiat" },
  { code: "SGD", symbol: "$", label: "Сингапурский доллар", type: "fiat" },
  { code: "HKD", symbol: "$", label: "Гонконгский доллар", type: "fiat" },
  { code: "NZD", symbol: "$", label: "Новозеландский доллар", type: "fiat" },
  { code: "BTC", symbol: "₿", label: "Bitcoin", type: "crypto" },
  { code: "ETH", symbol: "⟠", label: "Ethereum", type: "crypto" },
  { code: "USDT", symbol: "₮", label: "Tether", type: "crypto" },
  { code: "USDC", symbol: "₮", label: "USD Coin", type: "crypto" },
  { code: "BNB", symbol: "BNB", label: "BNB", type: "crypto" },
  { code: "SOL", symbol: "SOL", label: "Solana", type: "crypto" },
  { code: "XRP", symbol: "XRP", label: "XRP", type: "crypto" },
  { code: "ADA", symbol: "ADA", label: "Cardano", type: "crypto" },
  { code: "DOT", symbol: "DOT", label: "Polkadot", type: "crypto" },
  { code: "AVAX", symbol: "AVAX", label: "Avalanche", type: "crypto" },
  { code: "DOGE", symbol: "Ð", label: "Dogecoin", type: "crypto" },
  { code: "MATIC", symbol: "MATIC", label: "Polygon", type: "crypto" },
  { code: "TRX", symbol: "TRX", label: "Tron", type: "crypto" },
  { code: "TON", symbol: "TON", label: "Toncoin", type: "crypto" },
  { code: "LINK", symbol: "LINK", label: "Chainlink", type: "crypto" },
  { code: "UNI", symbol: "UNI", label: "Uniswap", type: "crypto" },
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
