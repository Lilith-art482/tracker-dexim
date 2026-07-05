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
  FileText,
  CalendarDays,
  MessageSquareText,
  Send,
  LayoutList,
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
import { useNotifications } from "@/lib/notification-context";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  boardId: string;
  task?: Task | null;
  onSaved: (task: Task) => void;
  onArchived?: (taskId: string) => void;
}

function FieldLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
      <Icon className="h-3 w-3" />
      {children}
    </Label>
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
  const { addNotification } = useNotifications();
  const isEditing = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [startDate, setStartDate] = useState(task?.startDate ?? "");
  const [endDate, setEndDate] = useState(task?.endDate ?? "");
  const [assignee, setAssignee] = useState<string>(task?.assignee ?? "");
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

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStartDate(task.startDate ?? "");
      setEndDate(task.endDate ?? "");
      setAssignee(task.assignee ?? "");
      setCompleted(task.completed);
    } else {
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setAssignee("");
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

  useEffect(() => {
    if (open) loadMembers();
  }, [open, loadMembers]);

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
        body: JSON.stringify({ id: task.id, boardId, columnId, archived: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        addNotification(err.error || "Ошибка архивирования", "error");
        return;
      }
      onArchived?.(task.id);
      onOpenChange(false);
      addNotification("Задача отправлена в архив", "success");
    } catch {
      addNotification("Ошибка архивирования", "error");
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
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
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
            completed,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          addNotification(err.error || "Ошибка сохранения задачи", "error");
          return;
        }

        const updated: Task = await res.json();
        onSaved(updated);
        addNotification("Задача обновлена", "success");
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
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          addNotification(err.error || "Ошибка создания задачи", "error");
          return;
        }

        const created: Task = await res.json();
        onSaved(created);
        addNotification("Задача создана", "success");
      }

      onOpenChange(false);
    } catch {
      addNotification("Ошибка сохранения задачи", "error");
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
        addNotification(err.error || "Ошибка отправки комментария", "error");
        return;
      }

      const created: Comment = await res.json();
      setComments((prev) => [...prev, created]);
      setNewCommentText("");
      addNotification("Комментарий добавлен", "success");
    } catch {
      addNotification("Ошибка отправки комментария", "error");
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto gap-0 p-0">
        <div className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <LayoutList className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {isEditing ? "Редактировать задачу" : "Создать задачу"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {isEditing ? "Измените поля задачи" : "Заполните поля для новой задачи"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <FieldLabel icon={Tag}>Название</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название задачи"
              aria-invalid={!!errors.title}
              className="h-9"
            />
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={FileText}>Описание</FieldLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание задачи"
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel icon={CalendarDays}>Дата начала</FieldLabel>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel icon={CalendarDays}>Дата окончания</FieldLabel>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={User}>Ответственный</FieldLabel>
            {membersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Загрузка участников...
              </div>
            ) : (
              <Select
                value={assignee}
                onValueChange={(value) => setAssignee(value === "none" || value === null ? "" : value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Не выбран" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не назначен</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isEditing && (
            <>
              <Separator />

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCompleted(!completed)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-accent/50 -ml-2"
                >
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span>{completed ? "Задача выполнена" : "Отметить как выполненную"}</span>
                </button>

                {completed && (
                  <button
                    onClick={handleArchive}
                    disabled={archiving}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-500 transition-colors py-1 px-2 rounded-md hover:bg-accent/50"
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

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Комментарии ({comments.length})
                  </span>
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
                          <span className="font-medium text-foreground">{comment.author}</span>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{comment.text}</p>
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
                      disabled={sendingComment || !newCommentAuthor.trim() || !newCommentText.trim()}
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

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 gap-2">
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
