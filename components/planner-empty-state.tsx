"use client";

import { useState } from "react";
import { useMode } from "@/lib/mode-context";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  LayoutGrid,
  Users,
  Archive,
  Palette,
  Pin,
  GripVertical,
  Sparkles,
  ArrowRight,
  Kanban,
  BarChart3,
  FolderKanban,
  UserCheck,
  ListTodo,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const personalFeatures = [
  {
    icon: CalendarDays,
    title: "Недельный планер",
    description:
      "Сетка на 7 дней с почасовыми слотами. Распределяйте задачи по времени и видите весь день на одном экране.",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    icon: LayoutGrid,
    title: "Канбан-доски",
    description:
      "Организуйте задачи по статусам: «К работе», «В процессе», «Готово». Перетаскивайте карточки между колонками.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: BarChart3,
    title: "Дашборд задач",
    description:
      "Визуальная статистика по приоритетам и статусам. Сразу видно, что требует внимания.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: ListTodo,
    title: "Список задач",
    description:
      "Компактный вид для быстрого просмотра. Фильтруйте по приоритету, ищите по названию.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

const teamFeatures = [
  {
    icon: Users,
    title: "Командное планирование",
    description:
      "Недельная таблица с ответственными. Видно, кто за что отвечает и какие задачи на каждый день.",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    icon: Kanban,
    title: "Канбан-колонки",
    description:
      "Настраиваемые колонки с drag-and-drop. Гибкая структура под процессы вашей команды.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: UserCheck,
    title: "Участники доски",
    description:
      "Добавляйте коллег, назначайте ответственных. Каждый видит свои задачи и общий прогресс.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Archive,
    title: "Архив задач",
    description:
      "Выполненные задачи не теряются. Архив хранит историю, к которой можно вернуться.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

const commonFeatures = [
  {
    icon: FolderKanban,
    title: "Несколько досок",
    description: "Отдельные доски для проектов, команд или личных дел",
  },
  {
    icon: Palette,
    title: "Иконки и цвета",
    description: "100+ иконок и палитра цветов для каждой доски",
  },
  {
    icon: Pin,
    title: "Закрепление",
    description: "Закрепляйте важные доски наверху списка",
  },
  {
    icon: GripVertical,
    title: "Перетаскивание",
    description: "Drag-and-drop для задач, колонок и порядка досок",
  },
];

export function PlannerEmptyState() {
  const { mode } = useMode();
  const router = useRouter();
  const features = mode === "personal" ? personalFeatures : teamFeatures;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const name = boardName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const ownerId = auth.currentUser?.uid || null;
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerId, type: mode }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка создания доски");
        return;
      }

      const newBoard = await res.json();
      toast.success("Доска создана");
      setDialogOpen(false);
      setBoardName("");

      const uid = auth.currentUser?.uid;
      const params = new URLSearchParams();
      params.set("boardId", newBoard.id);
      if (uid) params.set("uid", uid);
      router.push(`/?${params.toString()}`);
    } catch {
      toast.error("Ошибка создания доски");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-4 py-12 space-y-16 animate-in fade-in duration-500">
      <section className="relative text-center space-y-6 pt-8 pb-4">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-primary)/8,transparent)]" />
        <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {mode === "personal" ? "Личный режим" : "Режим команды"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Планируйте задачи
          <br />
          <span className="bg-gradient-to-r from-primary via-primary/70 to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
            {mode === "personal" ? "удобно и наглядно" : "вместе с командой"}
          </span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {mode === "personal"
            ? "Создайте первую доску, чтобы начать планировать. Распределяйте задачи по дням, отслеживайте прогресс и держите всё под контролем."
            : "Создайте доску для команды, чтобы распределять задачи, назначать ответственных и контролировать дедлайны в одном месте."}
        </p>
      </section>

      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {mode === "personal"
              ? "Возможности планировщика"
              : "Возможности для команды"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "personal"
              ? "Всё, что нужно для продуктивного дня"
              : "Инструменты для слаженной работы"}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className={cn(
                "group rounded-xl border p-5 space-y-3 transition-all",
                "hover:shadow-md hover:border-primary/20",
              )}
            >
              <div className={cn("inline-flex rounded-lg p-2.5", f.bg)}>
                <f.icon className={cn("h-5 w-5", f.color)} />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            И это ещё не всё
          </h2>
          <p className="text-sm text-muted-foreground">
            Дополнительные возможности для удобства
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {commonFeatures.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border p-4 text-center space-y-2 transition-all hover:shadow-sm hover:border-primary/20"
            >
              <div className="inline-flex rounded-lg bg-muted p-2">
                <f.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center space-y-4 pb-4">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-8 sm:p-12 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Готовы начать?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {mode === "personal"
              ? "Создайте первую доску и начните планировать уже сегодня"
              : "Создайте доску, добавьте команду и распределите задачи"}
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setDialogOpen(true)}
            >
              Создать доску
              <ArrowRight className="h-4 w-4" />
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Новая доска</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="Название доски"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                />
                <Button
                  onClick={handleCreate}
                  disabled={!boardName.trim() || creating}
                  className="w-full"
                >
                  {creating && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  );
}
