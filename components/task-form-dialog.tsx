"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Archive,
  Tag,
  CalendarDays,
  MessageSquareText,
  Send,
  LayoutList,
  AlertTriangle,
  Plus,
  X,
} from "lucide-react";
import type { Task, Comment, BoardMember } from "@/lib/models";
import { createTaskSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  boardId: string;
  task?: Task | null;
  onSaved: (task: Task) => void;
  onArchived?: (taskId: string) => void;
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

export function TaskFormDialog({
  open,
  onOpenChange,
  columnId,
  boardId,
  task,
  onSaved,
  onArchived,
}: TaskFormDialogProps) {

  const isEditing = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [startDate, setStartDate] = useState(task?.startDate ?? "");
  const [endDate, setEndDate] = useState(task?.endDate ?? "");
  const [assignee, setAssignee] = useState<string>(task?.assignee ?? "");
  const [assignees, setAssignees] = useState<string[]>(task?.assignees ?? []);
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    task?.priority ?? "medium",
  );
  const [completed, setCompleted] = useState(task?.completed ?? false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const [members, setMembers] = useState<BoardMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStartDate(task.startDate ?? "");
      setEndDate(task.endDate ?? "");
      setAssignee(task.assignee ?? "");
      setAssignees(task.assignees ?? []);
      setPriority(task.priority ?? "medium");
      setCompleted(task.completed);
    } else {
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setAssignee("");
      setAssignees([]);
      setPriority("medium");
      setCompleted(false);
    }
    setErrors({});
    setComments([]);
    setNewCommentAuthor("");
    setNewCommentText("");
  }, [task, open]);

  const loadMembers = useCallback(async () => {
    if (!boardId) return;
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/board-members?boardId=${boardId}`);
      if (res.ok) {
        const data: BoardMember[] = await res.json();
        setMembers(data);
      }
    } catch {
      console.error("Ошибка загрузки участников");
    } finally {
      setMembersLoading(false);
    }
  }, [boardId]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data: { nickname?: string; name?: string }[] = await res.json();
        const names = data
          .map((u) => u.nickname || u.name || "")
          .filter(Boolean);
        setUsers(names);
      }
    } catch {
      console.error("Ошибка загрузки пользователей");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadMembers();
      loadUsers();
    }
  }, [open, loadMembers, loadUsers]);

  const loadComments = useCallback(async () => {
    if (!task) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/comments?taskId=${task.id}`);
      if (res.ok) {
        const data: Comment[] = await res.json();
        setComments(data);
      }
    } catch {
      console.error("Ошибка загрузки комментариев");
    } finally {
      setCommentsLoading(false);
    }
  }, [task]);

  useEffect(() => {
    if (open && isEditing && task) loadComments();
  }, [open, isEditing, task, loadComments]);

  const resetForm = () => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setStartDate(task?.startDate ?? "");
    setEndDate(task?.endDate ?? "");
    setAssignee(task?.assignee ?? "");
    setAssignees(task?.assignees ?? []);
    setPriority(task?.priority ?? "medium");
    setCompleted(task?.completed ?? false);
    setErrors({});
  };

  const handleArchive = async () => {
    if (!task) return;
    setArchiving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          boardId,
          columnId,
          archived: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка архивирования");
        return;
      }
      onArchived?.(task.id);
      onOpenChange(false);
      toast.success("Задача отправлена в архив");
    } catch {
      toast.error("Ошибка архивирования");
    } finally {
      setArchiving(false);
    }
  };

  const handleSubmit = async () => {
    const parsed = createTaskSchema.safeParse({
      columnId,
      boardId,
      title,
      description: description || "",
      startDate: startDate || null,
      endDate: endDate || null,
      assignee: assignee || null,
      assignees,
      priority,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, issues] of Object.entries(
        parsed.error.flatten().fieldErrors,
      )) {
        fieldErrors[key] = (issues as string[])[0];
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      if (isEditing && task) {
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: task.id,
            boardId,
            columnId,
            title: parsed.data.title.trim(),
            description: parsed.data.description,
            startDate: parsed.data.startDate,
            endDate: parsed.data.endDate,
            assignee: parsed.data.assignee,
            assignees: parsed.data.assignees,
            priority: parsed.data.priority,
            completed,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка сохранения задачи");
          return;
        }

        const updated: Task = await res.json();
        onSaved(updated);
        toast.success("Задача обновлена");
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columnId,
            boardId,
            title: parsed.data.title.trim(),
            description: parsed.data.description,
            startDate: parsed.data.startDate,
            endDate: parsed.data.endDate,
            assignee: parsed.data.assignee,
            assignees: parsed.data.assignees,
            priority: parsed.data.priority,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка создания задачи");
          return;
        }

        const created: Task = await res.json();
        onSaved(created);
        toast.success("Задача создана");
      }

      onOpenChange(false);
    } catch {
      toast.error("Ошибка сохранения задачи");
    } finally {
      setSaving(false);
    }
  };

  const handleSendComment = async () => {
    if (!task || !newCommentAuthor.trim() || !newCommentText.trim()) return;

    setSendingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          author: newCommentAuthor.trim(),
          text: newCommentText.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка отправки комментария");
        return;
      }

      const created: Comment = await res.json();
      setComments((prev) => [...prev, created]);
      setNewCommentText("");
      toast.success("Комментарий добавлен");
    } catch {
      toast.error("Ошибка отправки комментария");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto gap-0">
        <div className="px-6 pt-5 pb-4 border-b bg-muted/20 shrink-0">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <LayoutList className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base">
                  {isEditing ? "Редактировать задачу" : "Создать задачу"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 text-muted-foreground/60">
                  {isEditing
                    ? "Измените поля задачи"
                    : "Заполните поля для новой задачи"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          <SectionBlock icon={Tag} title="Основное">
            <FieldRow label="Название">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название задачи"
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </FieldRow>
            <FieldRow label="Описание">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание задачи"
                rows={2}
                className="resize-none"
              />
            </FieldRow>
          </SectionBlock>

          <SectionBlock icon={CalendarDays} title="Сроки">
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Дата начала">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FieldRow>
              <FieldRow label="Дата окончания">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FieldRow>
            </div>
          </SectionBlock>

          <SectionBlock icon={User} title="Команда">
            <FieldRow label="Приоритет">
              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as "low" | "medium" | "high")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-sky-500" />
                      Низкий
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Средний
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      Высокий
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Исполнители">
              {usersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Загрузка пользователей...
                </div>
              ) : (
                <div className="space-y-2">
                  {assignees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {assignees.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5"
                        >
                          {name}
                          <button
                            onClick={() =>
                              setAssignees((prev) =>
                                prev.filter((a) => a !== name),
                              )
                            }
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !assignees.includes(value)) {
                        setAssignees((prev) => [...prev, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Добавить исполнителя" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((u) => !assignees.includes(u))
                        .map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      {users.filter((u) => !assignees.includes(u)).length ===
                        0 && (
                        <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                          Все пользователи назначены
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </FieldRow>
          </SectionBlock>

          {isEditing && (
            <>
              <SectionBlock icon={CheckCircle2} title="Статус">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCompleted(!completed)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-md hover:bg-accent/50 -ml-1"
                  >
                    {completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                    <span>
                      {completed
                        ? "Задача выполнена"
                        : "Отметить как выполненную"}
                    </span>
                  </button>

                  {completed && (
                    <button
                      onClick={handleArchive}
                      disabled={archiving}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-500 transition-colors py-1.5 px-3 rounded-md hover:bg-accent/50"
                    >
                      {archiving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                      <span>В архив</span>
                    </button>
                  )}
                </div>
              </SectionBlock>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80">
                  <MessageSquareText className="h-4 w-4" />
                  Комментарии ({comments.length})
                </div>

                {commentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 italic">
                    Нет комментариев
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex flex-col gap-1 rounded-lg border bg-muted/20 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="font-medium text-foreground">
                            {comment.author}
                          </span>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(comment.createdAt).toLocaleDateString(
                              "ru-RU",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Input
                    value={newCommentAuthor}
                    onChange={(e) => setNewCommentAuthor(e.target.value)}
                    placeholder="Ваше имя"
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Textarea
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Напишите комментарий..."
                      rows={2}
                      className="text-sm resize-none"
                    />
                    <Button
                      onClick={handleSendComment}
                      disabled={
                        sendingComment ||
                        !newCommentAuthor.trim() ||
                        !newCommentText.trim()
                      }
                      size="icon"
                      className="shrink-0 self-end"
                    >
                      {sendingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 m-0 rounded-b-xl gap-3 shrink-0">
          <div className="flex-1" />
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
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="min-w-[100px]"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
