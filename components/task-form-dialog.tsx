"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Archive,
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
    if (open) {
      loadMembers();
    }
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
    if (open && isEditing && task) {
      loadComments();
    }
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
        body: JSON.stringify({ id: task.id, archived: true }),
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
      title,
      description: description || "",
      startDate: startDate || null,
      endDate: endDate || null,
      assignee: assignee || null,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, issues] of Object.entries(
        parsed.error.flatten().fieldErrors
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
            title: parsed.data.title.trim(),
            description: parsed.data.description,
            startDate: parsed.data.startDate,
            endDate: parsed.data.endDate,
            assignee: parsed.data.assignee,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Редактировать задачу" : "Создать задачу"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Измените поля задачи"
              : "Заполните поля для новой задачи"}
          </DialogDescription>
        </DialogHeader>

        {isEditing && (
          <button
            onClick={() => setCompleted(!completed)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {completed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
            <span>
              {completed ? "Задача выполнена" : "Отметить как выполненную"}
            </span>
          </button>
        )}

        {isEditing && completed && (
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-500 transition-colors py-1"
          >
            {archiving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Archive className="h-5 w-5" />
            )}
            <span>Отправить в архив</span>
          </button>
        )}

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Название
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название задачи"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Описание
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание задачи"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Дата начала
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                Дата окончания
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="assignee" className="text-sm font-medium">
              Ответственный
            </Label>
            {membersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка участников...
              </div>
            ) : (
              <Select
                value={assignee}
                onValueChange={(value) =>
                  setAssignee(value === "none" || value === null ? "" : value)
                }
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Выберите ответственного" />
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
        </div>

        {isEditing && (
          <>
            <Separator className="my-2" />
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold">
                Комментарии ({comments.length})
              </h4>

              {commentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Нет комментариев
                </p>
              ) : (
                <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex flex-col gap-1 rounded-lg border p-3"
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
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
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
                    className="text-sm"
                  />
                  <Button
                    onClick={handleSendComment}
                    disabled={
                      sendingComment ||
                      !newCommentAuthor.trim() ||
                      !newCommentText.trim()
                    }
                    className="shrink-0 self-end"
                    size="sm"
                  >
                    {sendingComment && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Отправить
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
