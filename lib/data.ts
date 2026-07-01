export interface Board {
  id: string;
  name: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string;
  assignee: string | null;
  endDate: string | null;
  completed: boolean;
}

export const mockBoards: Board[] = [
  { id: "board-1", name: "Разработка MVP" },
  { id: "board-2", name: "Маркетинг" },
];

export const mockColumns: Column[] = [
  { id: "col-1", boardId: "board-1", name: "Нужно сделать", order: 0 },
  { id: "col-2", boardId: "board-1", name: "В работе", order: 1 },
  { id: "col-3", boardId: "board-1", name: "Готово", order: 2 },
  { id: "col-4", boardId: "board-2", name: "Идеи", order: 0 },
  { id: "col-5", boardId: "board-2", name: "Запланировано", order: 1 },
  { id: "col-6", boardId: "board-2", name: "Запущено", order: 2 },
];

export const mockTasks: Task[] = [
  {
    id: "task-1",
    columnId: "col-1",
    title: "Дизайн главной страницы",
    description: "Разработать макет главной страницы в Figma",
    assignee: "Анна",
    endDate: "2024-03-10",
    completed: false,
  },
  {
    id: "task-2",
    columnId: "col-1",
    title: "Настройка CI/CD",
    description: "Настроить автоматическую сборку и деплой",
    assignee: "Иван",
    endDate: "2024-03-12",
    completed: false,
  },
  {
    id: "task-3",
    columnId: "col-2",
    title: "API аутентификации",
    description: "Реализовать JWT аутентификацию",
    assignee: "Пётр",
    endDate: "2024-03-08",
    completed: false,
  },
  {
    id: "task-4",
    columnId: "col-2",
    title: "База данных пользователей",
    description: "Спроектировать и создать схему БД",
    assignee: "Мария",
    endDate: "2024-03-07",
    completed: false,
  },
  {
    id: "task-5",
    columnId: "col-3",
    title: "Репозиторий проекта",
    description: "Создать репозиторий и настроить доступы",
    assignee: "Иван",
    endDate: "2024-02-25",
    completed: true,
  },
  {
    id: "task-6",
    columnId: "col-3",
    title: "Выбор технологического стека",
    description: "Определиться с технологиями для проекта",
    assignee: "Команда",
    endDate: "2024-02-20",
    completed: true,
  },
];
