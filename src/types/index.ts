export type Emotion = 'happy' | 'sleepy' | 'thirsty' | 'inspired' | 'neutral' | 'love' | 'thinking';

export type Tab = 'planner' | 'finances' | 'habits' | 'nutrition' | 'recipes' | 'sport';

export type OperationType = 'income' | 'expense';

export interface Task {
  id: string;
  text: string;
  date: string;
  completed: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  lastCompleted: string | null;
  dates: string[];
  color: string;
}

export interface FinanceOperation {
  id: string;
  type: OperationType;
  amount: number;
  category: string;
  description: string;
  date: string;
  account: string;
  createdAt: string;
}

export interface DebtPayment {
  amount: number;
  date: string;
}

export interface Debt {
  id: string;
  title: string;
  type: 'credit' | 'installment' | 'utilities' | 'internet' | 'other';
  totalAmount: number;
  monthlyPayment?: number;
  remainingAmount: number;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'closed' | 'overdue';
  notes?: string;
  payments?: DebtPayment[];
}

export interface Saving {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution?: number;
  targetDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface FinanceData {
  operations: FinanceOperation[];
  debts: Debt[];
  savings: Saving[];
  monthlyExpenses?: number;
}

export const INCOME_CATEGORIES = [
  'Зарплата',
  'Фриланс / Подработка',
  'Подарок',
  'Инвестиции / Проценты',
  'Кэшбэк',
  'Возврат долга',
  'Продажа вещей',
  'Другое',
];

export const EXPENSE_CATEGORIES = [
  'Еда',
  'Транспорт',
  'Одежда',
  'Развлечения',
  'Здоровье',
  'Дом',
  'Связь',
  'Образование',
  'Другое',
];

export const ACCOUNTS = ['Наличные', 'Карта', 'Сбережения'];

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  fats?: number;
  carbs?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  createdAt: string;
}

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Завтрак', icon: '🌅' },
  { value: 'lunch', label: 'Обед', icon: '☀️' },
  { value: 'dinner', label: 'Ужин', icon: '🌙' },
  { value: 'snack', label: 'Перекус', icon: '🍪' },
] as const;

export interface RecipeIngredient {
  name: string;
  weight: number;
  unit?: string;
}

export interface RecipeNutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  image?: string;
  ingredients: RecipeIngredient[];
  nutrition: RecipeNutrition;
  time: number;
  difficulty: string;
  instructions: string[];
}

export interface WorkoutEntry {
  id: string;
  exercise: string;
  duration: number;
  calories?: number;
  date: string;
  createdAt: string;
}
