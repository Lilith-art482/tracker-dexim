/**
 * Скрипт миграции: удаляет старые задачи из плоской структуры TASKS
 * и очищает Firestore для перехода на подколлекции
 *
 * Запуск: docker compose exec app npm run db:migrate:clean
 */

import { getAdminDb } from "../lib/firebase-admin";

async function cleanOldTasks() {
  console.log("[MIGRATION] Starting cleanup of old flat tasks...");

  const db = getAdminDb();

  try {
    // Получаем все задачи из плоской коллекции TASKS
    const oldTasksSnap = await db.collection("TASKS").get();
    console.log(
      `[MIGRATION] Found ${oldTasksSnap.size} old tasks in flat collection`,
    );

    // Удаляем все старые задачи
    for (const taskDoc of oldTasksSnap.docs) {
      await db.collection("TASKS").doc(taskDoc.id).delete();
      console.log(`[MIGRATION] Deleted old task ${taskDoc.id}`);
    }

    // Получаем все колонки из плоской коллекции COLUMNS
    const oldColumnsSnap = await db.collection("COLUMNS").get();
    console.log(
      `[MIGRATION] Found ${oldColumnsSnap.size} old columns in flat collection`,
    );

    // Удаляем все старые колонки
    for (const colDoc of oldColumnsSnap.docs) {
      await db.collection("COLUMNS").doc(colDoc.id).delete();
      console.log(`[MIGRATION] Deleted old column ${colDoc.id}`);
    }

    console.log("[MIGRATION] Cleanup completed successfully!");
  } catch (error) {
    console.error("[MIGRATION] Error during cleanup:", error);
    throw error;
  }
}

// Запуск если файл вызван напрямую
if (require.main === module) {
  cleanOldTasks()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { cleanOldTasks };
