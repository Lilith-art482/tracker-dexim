"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  Circle,
  Trash2,
  Tag,
  CalendarClock,
  ArrowUpDown,
  Zap,
  Undo2,
  Sparkles,
  Mail,
  Globe,
} from "lucide-react";
import type { ContentTask, Board } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TaskColorPicker } from "@/components/task-color-picker";
import {
  CONTENT_TOPICS,
  CONTENT_PLATFORMS,
  CONTENT_FORMATS,
  CONTENT_STATUSES,
  CUSTOM_OPTION,
  PLATFORM_LOGOS,
  TOPIC_ICONS,
} from "@/lib/content";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

interface ContentTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string | null;
  task?: ContentTask | null;
  onSaved: (task: ContentTask) => void;
  onDelete?: (task: ContentTask) => void;
  onToggleComplete?: (task: ContentTask) => void;
  activeBoard?: Board;
}

function SectionBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/10 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground/70 font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

function TopicVisual({ name }: { name: string }) {
  const Icon = TOPIC_ICONS[name] ?? Tag;
  return <Icon className="h-4 w-4 shrink-0 text-primary/60" />;
}

function PlatformVisual({ name }: { name: string }) {
  const logo = PLATFORM_LOGOS[name];
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className="h-4 w-4 shrink-0 rounded-sm object-contain"
      />
    );
  }
  const Icon = name === "Email-рассылка" ? Mail : Globe;
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" />;
}

export function ContentTaskDialog({
  open,
  onOpenChange,
  defaultDate,
  task,
  onSaved,
  onDelete,
  onToggleComplete,
  activeBoard,
}: ContentTaskDialogProps) {
  const isEditing = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [topic, setTopic] = useState(task?.topic ?? CONTENT_TOPICS[0]);
  const [topicCustom, setTopicCustom] = useState(false);
  const [platform, setPlatform] = useState(
    task?.platform ?? CONTENT_PLATFORMS[0],
  );
  const [platformCustom, setPlatformCustom] = useState(false);
  const [funnel, setFunnel] = useState(task?.funnel ?? false);
  const [format, setFormat] = useState(task?.format ?? CONTENT_FORMATS[0]);
  const [status, setStatus] = useState(task?.status ?? CONTENT_STATUSES[0]);
  const [hasSchedule, setHasSchedule] = useState(!!(task?.date || task?.time));
  const [date, setDate] = useState(
    task?.date ?? (defaultDate ? defaultDate : ""),
  );
  const [time, setTime] = useState(task?.time ?? "10:00");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [completed, setCompleted] = useState(task?.completed ?? false);
  const [color, setColor] = useState(task?.color ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTopic(task.topic);
      setTopicCustom(
        !(CONTENT_TOPICS as readonly string[]).includes(task.topic),
      );
      setPlatform(task.platform);
      setPlatformCustom(
        !(CONTENT_PLATFORMS as readonly string[]).includes(task.platform),
      );
      setFunnel(task.funnel);
      setFormat(task.format);
      setStatus(task.status);
      setHasSchedule(!!(task.date || task.time));
      setDate(task.date ?? "");
      setTime(task.time ?? "10:00");
      setNotes(task.notes ?? "");
      setCompleted(task.completed);
      setColor(task.color ?? "");
    } else {
      setTitle("");
      setTopic(CONTENT_TOPICS[0]);
      setTopicCustom(false);
      setPlatform(CONTENT_PLATFORMS[0]);
      setPlatformCustom(false);
      setFunnel(false);
      setFormat(CONTENT_FORMATS[0]);
      setStatus(CONTENT_STATUSES[0]);
      setHasSchedule(!!defaultDate);
      setDate(defaultDate ?? "");
      setTime("10:00");
      setNotes("");
      setCompleted(false);
      setColor("");
    }
    setErrors({});
  }, [task, open, defaultDate]);

  const handleSubmit = async (
    decidedDate: string | null,
    decidedTime: string | null,
  ) => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Заголовок обязателен";
    if (!topic.trim()) newErrors.topic = "Выберите или введите тему";
    if (!platform.trim()) newErrors.platform = "Укажите платформу";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const payload = {
      title: title.trim(),
      topic: topic.trim(),
      platform: platform.trim(),
      funnel,
      format,
      status,
      color: color || undefined,
      date: decidedDate || null,
      time: decidedDate ? decidedTime : null,
      notes: notes.trim() || "",
    };

    try {
      if (isEditing && task) {
        const res = await fetch("/api/content-tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id, ...payload, completed }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка сохранения");
          return;
        }

        const updated: ContentTask = await res.json();
        onSaved(updated);
        toast.success("Контент обновлён");
      } else {
        const ownerId = auth?.currentUser?.uid || null;
        const res = await fetch("/api/content-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            ownerId: ownerId || undefined,
            boardId: activeBoard?.id || undefined,
          }),
        });

        if (res.status === 503) {
          toast.error("База данных недоступна");
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка создания");
          return;
        }

        const created: ContentTask = await res.json();
        onSaved(created);
        toast.success(
          created.date ? "Контент запланирован" : "Контент добавлен в бэклог",
        );
      }

      onOpenChange(false);
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b bg-muted/20">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base">
                  {isEditing ? "Редактировать контент" : "Новый контент"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 text-muted-foreground/60">
                  {isEditing
                    ? "Измените поля единицы контента"
                    : "Заполните поля для нового поста, видео или сторис"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <SectionBlock icon={Tag} title="Основное">
            <FieldRow label="Заголовок">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Разбор ошибок в сторис"
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </FieldRow>

            <FieldRow label="Тема / грань">
              <Select
                value={topic}
                onValueChange={(v) => {
                  if (v === CUSTOM_OPTION) {
                    setTopicCustom(true);
                    setTopic("");
                  } else if (v != null) {
                    setTopicCustom(false);
                    setTopic(v);
                  }
                }}
              >
                <SelectTrigger className="w-full" aria-invalid={!!errors.topic}>
                  {topic ? (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <TopicVisual name={topic} />
                      <span className="truncate">{topic}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Выберите тему / грань
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TOPICS.map((t) => (
                    <SelectItem key={t} value={t}>
                      <TopicVisual name={t} />
                      <span>{t}</span>
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_OPTION}>
                    <Tag className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                    <span>Своя тема…</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {topicCustom && (
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Введите свою тему / грань"
                  autoFocus
                />
              )}
              {errors.topic && (
                <p className="text-xs text-destructive">{errors.topic}</p>
              )}
            </FieldRow>

            <FieldRow label="Платформа">
              <Select
                value={platform}
                onValueChange={(v) => {
                  if (v === CUSTOM_OPTION) {
                    setPlatformCustom(true);
                    setPlatform("");
                  } else if (v != null) {
                    setPlatformCustom(false);
                    setPlatform(v);
                  }
                }}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={!!errors.platform}
                >
                  {platform ? (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <PlatformVisual name={platform} />
                      <span className="truncate">{platform}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Выберите платформу
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      <PlatformVisual name={p} />
                      <span>{p}</span>
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_OPTION}>
                    <Globe className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                    <span>Другая платформа…</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {platformCustom && (
                <Input
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="Введите платформу"
                  autoFocus
                />
              )}
              {errors.platform && (
                <p className="text-xs text-destructive">{errors.platform}</p>
              )}
            </FieldRow>

            <FieldRow label="Цвет карточки">
              <TaskColorPicker value={color} onChange={setColor} />
              <p className="text-[10px] text-muted-foreground/50">
                Задайте свой цвет, чтобы карточка выделялась на доске
              </p>
            </FieldRow>
          </SectionBlock>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setFunnel((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFunnel((v) => !v);
              }
            }}
            className="flex items-center gap-3 rounded-lg border bg-muted/10 p-4 text-left transition-colors hover:bg-accent/40 cursor-pointer w-full"
          >
            <Checkbox
              checked={funnel}
              onCheckedChange={(v) => setFunnel(!!v)}
              onClick={(e) => e.stopPropagation()}
              className="data-checked:bg-violet-500 data-checked:border-violet-500 border-violet-400/40"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-violet-500" />
                Контент для перелива аудитории
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Материал работает на прогрев и ведёт аудиторию к целевым
                действиям
              </p>
            </div>
          </div>

          <SectionBlock icon={ArrowUpDown} title="Формат и статус">
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Формат">
                <Select
                  value={format}
                  onValueChange={(v) => v != null && setFormat(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Статус">
                <Select
                  value={status}
                  onValueChange={(v) => v != null && setStatus(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            </div>
          </SectionBlock>

          <SectionBlock icon={CalendarClock} title="Публикация">
            <button
              type="button"
              onClick={() => setHasSchedule((v) => !v)}
              className="flex items-center gap-2.5 mb-3"
            >
              <Checkbox checked={hasSchedule} />
              <span className="text-sm text-muted-foreground">
                {hasSchedule
                  ? "Запланировано на дату и время"
                  : "Запланировать на дату и время"}
              </span>
            </button>

            {hasSchedule && (
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Дата публикации">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </FieldRow>
                <FieldRow label="Время">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </FieldRow>
              </div>
            )}

            <div className="rounded-lg bg-background/60 border border-border/40 px-3 py-2.5 space-y-2.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {hasSchedule
                  ? "Оставьте поля пустыми, чтобы вернуть контент в бэклог — панель слева с задачами без даты и времени."
                  : "Без даты и времени контент появится в бэклоге — панели слева. Запланируйте его, чтобы добавить в недельный план."}
              </p>
              {isEditing && hasSchedule && (task?.date || task?.time) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(null, null)}
                  disabled={saving}
                  className="gap-1.5"
                  title="Убрать дату и время — контент вернётся в бэклог"
                >
                  <Undo2 className="h-4 w-4" />
                  Вернуть к бэклогу
                </Button>
              )}
            </div>
          </SectionBlock>

          <SectionBlock icon={Tag} title="Заметки / текст поста">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Тезисы, ссылки, ТЗ…"
              className="min-h-[96px] resize-none"
            />
          </SectionBlock>

          {isEditing && (
            <SectionBlock icon={CheckCircle2} title="Статус">
              <button
                onClick={() => {
                  if (onToggleComplete && task) {
                    onToggleComplete(task);
                  }
                  setCompleted(!completed);
                }}
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-md hover:bg-accent/50 -ml-1 w-fit"
              >
                {completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span>
                  {completed
                    ? "Контент опубликован"
                    : "Отметить как опубликованный"}
                </span>
              </button>
            </SectionBlock>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 m-0 rounded-b-xl gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            {isEditing && onDelete && task && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast("Удалить контент?", {
                    action: {
                      label: "Удалить",
                      onClick: () => {
                        onDelete(task);
                        onOpenChange(false);
                        toast.success("Контент удалён");
                      },
                    },
                    cancel: {
                      label: "Отмена",
                      onClick: () => {},
                    },
                  });
                }}
                disabled={saving}
                className="gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Отмена
          </Button>
          <Button
            size="sm"
            onClick={() =>
              hasSchedule ? handleSubmit(date, time) : handleSubmit(null, null)
            }
            disabled={saving || !title.trim()}
            className="min-w-[120px]"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
