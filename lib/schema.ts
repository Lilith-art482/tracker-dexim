export const TableName = {
  SERVICES: "services",
  BOARDS: "boards",
  COLUMNS: "columns",
  TASKS: "tasks",
  COMMENTS: "comments",
  BOARD_MEMBERS: "board_members",
  PERSONAL_TASKS: "personal_tasks",
  FINANCE_ACCOUNTS: "finance_accounts",
  FINANCE_TRANSACTIONS: "finance_transactions",
  FINANCE_CATEGORIES: "finance_categories",
  FINANCE_BUDGETS: "finance_budgets",
  FINANCE_GOALS: "finance_goals",
  FINANCE_LOANS: "finance_loans",
  FINANCE_EMERGENCY_FUND: "finance_emergency_fund",
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];

export const TABLE_NAMES: TableName[] = Object.values(TableName);
