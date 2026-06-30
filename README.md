# On Track — Task Tracker

Kanban-доска с персональными задачами на Next.js + Firebase Firestore.

## Быстрый старт

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Деплой на Vercel

1. Залейте репозиторий на GitHub.
2. Импортируйте проект в [Vercel](https://vercel.com).
3. Добавьте переменную окружения:
   - `USE_DATABASE` = `true`
4. Готово — Firestore уже настроен в коде.

## Стек

- **Framework:** Next.js 16
- **Database:** Firebase Firestore (client SDK)
- **UI:** shadcn/ui + Tailwind CSS
- **Validation:** Zod
- **Icons:** Lucide
