# On Track — Task Tracker

Kanban-доска с персональными задачами на Next.js + Firebase Firestore.

## Быстрый старт

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Деплой на Vercel

1. Скопируйте репозиторий на GitHub.
2. Импортируйте проект в [Vercel](https://vercel.com).
3. Добавьте переменную окружения в Vercel:
   - `USE_DATABASE` = `true`
4. Деплой произойдёт автоматически.

Firestore настроен через `lib/firebase.ts` — ключи уже в коде (client-side config).

## Локальная разработка

- `npm run dev` — dev-сервер
- `npm run check` — линт + типчека
- `npm run build` — продакшн-сборка
- `USE_DATABASE=false` — статический режим с моковыми данными

## Стек

- **Framework:** Next.js 16
- **Database:** Firebase Firestore
- **UI:** shadcn/ui + Tailwind CSS
- **Validation:** Zod
- **Icons:** Lucide
