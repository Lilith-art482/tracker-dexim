export const TableName = {
  BOARDS: "boards",
  COLUMNS: "columns",
  TASKS: "tasks",
  COMMENTS: "comments",
  BOARD_MEMBERS: "board_members",
  PERSONAL_TASKS: "personal_tasks",
  PERSONAL_KANBAN_TASKS: "personal_kanban_tasks",
  PERSONAL_PLAN_ENTRIES: "personal_plan_entries",
  FINANCE_ACCOUNTS: "finance_accounts",
  FINANCE_TRANSACTIONS: "finance_transactions",
  FINANCE_CATEGORIES: "finance_categories",
  FINANCE_BUDGETS: "finance_budgets",
  FINANCE_GOALS: "finance_goals",
  FINANCE_LOANS: "finance_loans",
  FINANCE_EMERGENCY_FUND: "finance_emergency_fund",
  SHOPPING_LISTS: "shopping_lists",
  HABITS: "habits",
  HABIT_LOGS: "habit_logs",
  ACHIEVEMENTS: "achievements",
  REMINDERS: "reminders",
  DELETION_REQUESTS: "deletion_requests",
  PROMO_CODES: "promo_codes",
  NOTES: "notes",
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];

export const TABLE_NAMES: TableName[] = Object.values(TableName);
