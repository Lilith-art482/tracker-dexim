export type CategoryGroupCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
};

export type CategoryGroup = {
  id: string;
  name: string;
  icon: string;
  accent: string;
  defaultColor: string;
  categories: CategoryGroupCategory[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "other",
    name: "Прочее",
    icon: "MoreHorizontal",
    accent: "#9ca3af",
    defaultColor: "slate",
    categories: [
      {
        id: "cat-other",
        name: "Прочие расходы",
        icon: "MoreHorizontal",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "salary-work",
    name: "Зарплата и работа",
    icon: "DollarSign",
    accent: "#10b981",
    defaultColor: "emerald",
    categories: [
      { id: "cat-salary", name: "Зарплата", icon: "DollarSign", color: "emerald", type: "income" },
      { id: "cat-salary-official", name: "Оклад", icon: "DollarSign", color: "emerald", type: "income" },
      { id: "cat-advance", name: "Аванс", icon: "Wallet", color: "emerald", type: "income" },
      { id: "cat-bonus", name: "Премия", icon: "Award", color: "emerald", type: "income" },
      { id: "cat-fee", name: "Гонорар", icon: "Crown", color: "emerald", type: "income" },
      { id: "cat-commission", name: "Комиссионные", icon: "Percent", color: "emerald", type: "income" },
      { id: "cat-parttime", name: "Подработка", icon: "Briefcase", color: "emerald", type: "income" },
    ],
  },
  {
    id: "investment-income",
    name: "Инвестиционные доходы",
    icon: "TrendingUp",
    accent: "#10b981",
    defaultColor: "emerald",
    categories: [
      { id: "cat-investment", name: "Инвестиционный доход", icon: "TrendingUp", color: "emerald", type: "income" },
      { id: "cat-deposit-interest", name: "Процент по вкладу", icon: "PiggyBank", color: "emerald", type: "income" },
      { id: "cat-royalty", name: "Роялти", icon: "Crown", color: "emerald", type: "income" },
      { id: "cat-exchange-rate", name: "Курсовая разница", icon: "TrendingUp", color: "emerald", type: "income" },
    ],
  },
  {
    id: "debt-returns",
    name: "Возвраты и долги",
    icon: "Banknote",
    accent: "#14b8a6",
    defaultColor: "teal",
    categories: [
      { id: "cat-debt-return", name: "Возвращение долга", icon: "Banknote", color: "teal", type: "income" },
      { id: "cat-overpayment-return", name: "Возврат переплаты", icon: "RefreshCw", color: "teal", type: "income" },
      { id: "cat-debt-forgiveness", name: "Прощение долга", icon: "Heart", color: "teal", type: "income" },
      { id: "cat-tax-deduction", name: "Налоговый вычет", icon: "Receipt", color: "teal", type: "income" },
      { id: "cat-tax-recalculation", name: "Перерасчет налога", icon: "ScrollText", color: "teal", type: "income" },
    ],
  },
  {
    id: "social-benefits",
    name: "Пособия и компенсации",
    icon: "Heart",
    accent: "#ec4899",
    defaultColor: "pink",
    categories: [
      { id: "cat-scholarship", name: "Стипендия", icon: "GraduationCap", color: "indigo", type: "income" },
      { id: "cat-social-benefits", name: "Социальные пособия", icon: "Heart", color: "pink", type: "income" },
      { id: "cat-subsidy", name: "Субсидия", icon: "Building2", color: "pink", type: "income" },
      { id: "cat-maternity-capital", name: "Материнский капитал", icon: "Baby", color: "pink", type: "income" },
      { id: "cat-insurance-payout", name: "Страховые выплаты", icon: "Shield", color: "pink", type: "income" },
      { id: "cat-grant", name: "Гранты", icon: "Award", color: "indigo", type: "income" },
      { id: "cat-alimony", name: "Алименты", icon: "Heart", color: "pink", type: "income" },
      { id: "cat-compensation", name: "Компенсация", icon: "Hand", color: "pink", type: "income" },
    ],
  },
  {
    id: "property-income",
    name: "Доходы от имущества",
    icon: "Key",
    accent: "#3b82f6",
    defaultColor: "blue",
    categories: [
      { id: "cat-rental", name: "Аренда", icon: "Key", color: "blue", type: "income" },
      { id: "cat-property-sale", name: "Продажа имущества", icon: "Building2", color: "blue", type: "income" },
      { id: "cat-item-sale", name: "Продажа вещи", icon: "Package", color: "blue", type: "income" },
    ],
  },
  {
    id: "credit-loans",
    name: "Кредиты и займы",
    icon: "Landmark",
    accent: "#06b6d4",
    defaultColor: "cyan",
    categories: [
      { id: "cat-loan-received", name: "Получение кредита/займа", icon: "Landmark", color: "cyan", type: "income" },
    ],
  },
  {
    id: "other-income",
    name: "Прочие доходы",
    icon: "Gift",
    accent: "#f59e0b",
    defaultColor: "amber",
    categories: [
      { id: "cat-gift", name: "Подарок", icon: "Gift", color: "amber", type: "income" },
      { id: "cat-winnings", name: "Выигрыши", icon: "Gem", color: "amber", type: "income" },
      { id: "cat-inheritance", name: "Наследство", icon: "Heart", color: "amber", type: "income" },
      { id: "cat-treasure", name: "Клад", icon: "Gem", color: "amber", type: "income" },
      { id: "cat-finding", name: "Находка", icon: "Search", color: "amber", type: "income" },
      { id: "cat-cashback", name: "Кэшбэк", icon: "RefreshCw", color: "amber", type: "income" },
    ],
  },
];

export const getCategoryGroup = (catName: string, catType?: string): CategoryGroup => {
  for (const group of CATEGORY_GROUPS) {
    for (const c of group.categories) {
      if (c.name === catName) return group;
    }
  }
  const fallbackId = catType === "income" ? "other-income" : "other";
  return (
    CATEGORY_GROUPS.find((g) => g.id === fallbackId) ??
    CATEGORY_GROUPS[CATEGORY_GROUPS.length - 1]
  );
};
