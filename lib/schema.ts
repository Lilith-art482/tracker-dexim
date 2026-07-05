export const TableName = {
  SERVICES: "services",
  BOARDS: "boards",
  COLUMNS: "columns",
  TASKS: "tasks",
  COMMENTS: "comments",
  BOARD_MEMBERS: "board_members",
  PERSONAL_TASKS: "personal_tasks",
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];

export const TABLE_NAMES: TableName[] = Object.values(TableName);
