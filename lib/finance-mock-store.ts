import {
  mockFinanceAccounts,
  mockFinanceCategories,
  mockFinanceTransactions,
  mockFinanceBudgetPlans,
  mockFinanceGoals,
  mockFinanceLoans,
  mockFinanceEmergencyFund,
} from "./finance-mock";
import type {
  FinanceAccount,
  Transaction,
  TransactionCategory,
  BudgetPlan,
  FinanceGoal,
  Loan,
  EmergencyFund,
} from "./finance-types";

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

class MockStore {
  accounts: FinanceAccount[];
  categories: TransactionCategory[];
  transactions: Transaction[];
  budgets: BudgetPlan[];
  goals: FinanceGoal[];
  loans: Loan[];
  emergencyFund: EmergencyFund;

  constructor() {
    this.accounts = clone(mockFinanceAccounts);
    this.categories = clone(mockFinanceCategories);
    this.transactions = clone(mockFinanceTransactions);
    this.budgets = clone(mockFinanceBudgetPlans);
    this.goals = clone(mockFinanceGoals);
    this.loans = clone(mockFinanceLoans);
    this.emergencyFund = clone(mockFinanceEmergencyFund);
  }
}

export const mockStore = new MockStore();
