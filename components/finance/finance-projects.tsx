"use client";

import { useState, useEffect, useCallback, useMemo, createElement } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Target,
  PiggyBank,
  Laptop,
  PaintBucket,
  Plane,
  Heart,
  GraduationCap,
  Car,
  Home,
  Smartphone,
  Shirt,
  Gift,
  Utensils,
  Cross,
  MoreHorizontal,
  Circle,
  Wallet,
  Loader2,
} from "lucide-react";

import type { FinanceProject, TransactionCategory } from "@/lib/finance-types";
import {
  getProjectsByUser,
  createProject,
  updateProject,
  deleteProject,
  getCategoriesByUser,
} from "@/lib/finance-client";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  { value: "Laptop", label: "Ноутбук" },
  { value: "PaintBucket", label: "Ремонт" },
  { value: "Plane", label: "Путешествия" },
  { value: "Heart", label: "Здоровье" },
  { value: "GraduationCap", label: "Обучение" },
  { value: "Car", label: "Машина" },
  { value: "Home", label: "Недвижимость" },
  { value: "Smartphone", label: "Телефон" },
  { value: "Shirt", label: "Одежда" },
  { value: "Gift", label: "Подарок" },
  { value: "Utensils", label: "Еда" },
  { value: "Cross", label: "Медицина" },
  { value: "PiggyBank", label: "Копилка" },
  { value: "Target", label: "Цель" },
  { value: "Wallet", label: "Кошелёк" },
  { value: "MoreHorizontal", label: "Другое" },
];

const COLOR_OPTIONS = [
  { value: "red", label: "Красный", class: "bg-red-500" },
  { value: "blue", label: "Синий", class: "bg-blue-500" },
  { value: "green", label: "Зелёный", class: "bg-green-500" },
  { value: "yellow", label: "Жёлтый", class: "bg-yellow-500" },
  { value: "purple", label: "Фиолетовый", class: "bg-purple-500" },
  { value: "pink", label: "Розовый", class: "bg-pink-500" },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop, PaintBucket, Plane, Heart, GraduationCap, Car, Home,
  Smartphone, Shirt, Gift, Utensils, Cross, PiggyBank, Target, Wallet, MoreHorizontal,
};

const COLOR_MAP: Record<string, string> = {
  red: "text-red-500 border-red-200 bg-red-500/10",
  blue: "text-blue-500 border-blue-200 bg-blue-500/10",
  green: "text-green-500 border-green-200 bg-green-500/10",
  yellow: "text-yellow-500 border-yellow-200 bg-yellow-500/10",
  purple: "text-purple-500 border-purple-200 bg-purple-500/10",
  pink: "text-pink-500 border-pink-200 bg-pink-500/10",
};

function getIconComponent(iconName: string) {
  return ICON_MAP[iconName] || Circle;
}

function getColorClass(color: string) {
  return COLOR_MAP[color] || COLOR_MAP.blue;
}

export function FinanceProjects() {
  const [projects, setProjects] = useState<FinanceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addFundsDialog, setAddFundsDialog] = useState<FinanceProject | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [editingProject, setEditingProject] = useState<FinanceProject | null>(null);

  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("Target");
  const [formTarget, setFormTarget] = useState("");
  const [formSaved, setFormSaved] = useState("0");
  const [formDeadline, setFormDeadline] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [formColor, setFormColor] = useState("blue");
  const uid = auth.currentUser?.uid || "user-1";

  useEffect(() => {
    getProjectsByUser(uid)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [uid]);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormIcon("Target");
    setFormTarget("");
    setFormSaved("0");
    setFormDeadline("");
    setFormDescription("");
    setFormCategoryIds([]);
    setFormColor("blue");
  }, []);

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.completed),
    [projects],
  );
  const completedProjects = useMemo(
    () => projects.filter((p) => p.completed),
    [projects],
  );

  const stats = useMemo(() => {
    const total = projects.length;
    const totalTarget = projects.reduce((s, p) => s + p.targetAmount, 0);
    const totalSaved = projects.reduce((s, p) => s + p.savedAmount, 0);
    return { total, totalTarget, totalSaved };
  }, [projects]);

  const [categories, setCategories] = useState<TransactionCategory[]>([]);

  useEffect(() => {
    getCategoriesByUser(uid)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [uid]);

  const recentLinkedExpenses = useMemo<Record<string, number>>(() => {
    return {};
  }, []);

  const openAddDialog = useCallback(() => {
    setEditingProject(null);
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((project: FinanceProject) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormIcon(project.icon);
    setFormTarget(String(project.targetAmount));
    setFormSaved(String(project.savedAmount));
    setFormDeadline(project.deadline || "");
    setFormDescription(project.description || "");
    setFormCategoryIds(project.linkedCategoryIds);
    setFormColor(project.color);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    resetForm();
    setEditingProject(null);
  }, [resetForm]);

  const handleSave = useCallback(async () => {
    if (!formName.trim() || !formTarget) {
      toast.error("Заполните обязательные поля");
      return;
    }
    const targetAmount = Number(formTarget);
    const savedAmount = Number(formSaved);
    if (targetAmount <= 0) {
      toast.error("Целевая сумма должна быть больше 0");
      return;
    }

    if (editingProject) {
      const updates: Parameters<typeof updateProject>[1] = {
        name: formName.trim(),
        icon: formIcon,
        targetAmount,
        savedAmount,
        color: formColor,
        deadline: formDeadline || undefined,
        description: formDescription || undefined,
        linkedCategoryIds: formCategoryIds,
      };
      try {
        const updated = await updateProject(editingProject.id, updates);
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success("Проект обновлён");
      } catch {
        toast.error("Ошибка при обновлении");
      }
    } else {
      try {
        const id = crypto.randomUUID();
        const created = await createProject({
          id,
          userId: uid,
          name: formName.trim(),
          icon: formIcon,
          targetAmount,
          savedAmount,
          color: formColor,
          deadline: formDeadline || undefined,
          description: formDescription || undefined,
          linkedCategoryIds: formCategoryIds,
          completed: false,
        });
        setProjects((prev) => [...prev, created]);
        toast.success("Проект создан");
      } catch {
        toast.error("Ошибка при создании");
      }
    }
    handleCloseDialog();
  }, [
    formName, formIcon, formTarget, formSaved, formDeadline,
    formDescription, formCategoryIds, formColor, editingProject, handleCloseDialog,
  ]);

  const handleDelete = useCallback((project: FinanceProject) => {
    toast("Удалить проект?", {
      action: {
        label: "Удалить",
        onClick: async () => {
          try {
            await deleteProject(project.id);
            setProjects((prev) => prev.filter((p) => p.id !== project.id));
            toast.success("Проект удалён");
          } catch {
            toast.error("Ошибка при удалении");
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  }, []);

  const handleToggleComplete = useCallback(async (project: FinanceProject) => {
    const completed = !project.completed;
    try {
      const updated = await updateProject(project.id, { completed });
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(completed ? "Проект завершён!" : "Проект восстановлен");
    } catch {
      toast.error("Ошибка при обновлении");
    }
  }, []);

  const handleAddFunds = useCallback(async () => {
    if (!addFundsDialog) return;
    const amount = Number(addFundsAmount);
    if (!amount || amount <= 0) {
      toast.error("Введите сумму больше 0");
      return;
    }
    const newSaved = addFundsDialog.savedAmount + amount;
    try {
      const updated = await updateProject(addFundsDialog.id, {
        savedAmount: newSaved,
      });
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`Добавлено ${amount.toLocaleString()} ₽`);
    } catch {
      toast.error("Ошибка при добавлении средств");
    }
    setAddFundsDialog(null);
    setAddFundsAmount("");
  }, [addFundsDialog, addFundsAmount]);

  const handleCategoryToggle = useCallback((catId: string) => {
    setFormCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId],
    );
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="h-4 w-4" />
              Всего проектов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PiggyBank className="h-4 w-4" />
              Накоплено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-sky-600">
              {stats.totalSaved.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="h-4 w-4" />
              Общая цель
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.totalTarget.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить проект
        </Button>
      </div>

      {activeProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Target className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Нет активных проектов</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={openAddDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать проект
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeProjects.map((project) => {
            const progressPct = Math.min(
              Math.round((project.savedAmount / project.targetAmount) * 100),
              100,
            );
            const IconComp = getIconComponent(project.icon);

            const linkedExpenses = project.linkedCategoryIds
              .map((catId) => ({
                catId,
                amount: recentLinkedExpenses[catId] || 0,
              }))
              .filter((e) => e.amount > 0);

            return (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg border",
                          getColorClass(project.color),
                        )}
                      >
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-medium truncate">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 text-xs", getColorClass(project.color))}
                    >
                      {progressPct}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Накоплено</span>
                    <span className="font-semibold">
                      {project.savedAmount.toLocaleString()} /{" "}
                      {project.targetAmount.toLocaleString()} ₽
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        progressPct >= 100 ? "bg-emerald-500" : "bg-primary",
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {project.deadline && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        до{" "}
                        {new Date(
                          project.deadline + "T00:00:00Z",
                        ).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  )}

                  {project.linkedCategoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.linkedCategoryIds.map((catId) => {
                        const cat = categories.find(
                          (c) => c.id === catId,
                        );
                        if (!cat) return null;
                        return (
                          <Badge
                            key={catId}
                            variant="secondary"
                            className="text-xs"
                          >
                            {cat.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {linkedExpenses.length > 0 && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                      {linkedExpenses.map((e) => {
                        const cat = categories.find(
                          (c) => c.id === e.catId,
                        );
                        return (
                          <div key={e.catId}>
                            {`Расход в "${cat?.name || e.catId}": `}
                            {e.amount.toLocaleString()} ₽ за 30 дн.
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setAddFundsDialog(project)}
                    >
                      <PiggyBank className="h-3.5 w-3.5 mr-1.5" />
                      Добавить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(project)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Изменить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleComplete(project)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleDelete(project)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {completedProjects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Завершённые ({completedProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedProjects.map((project) => {
              const IconComp = getIconComponent(project.icon);
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <IconComp className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm line-through text-muted-foreground">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.savedAmount.toLocaleString()} /{" "}
                        {project.targetAmount.toLocaleString()} ₽
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleToggleComplete(project)}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Редактировать проект" : "Новый проект"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Например: Ремонт в квартире"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Иконка</label>
                <Select
                  value={formIcon}
                  onValueChange={(v) => v && setFormIcon(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 flex items-center justify-center">
                            {createElement(
                              ICON_MAP[opt.value] || Circle,
                              { className: "h-4 w-4" },
                            )}
                          </span>
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цвет</label>
                <Select
                  value={formColor}
                  onValueChange={(v) => v && setFormColor(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn("w-3 h-3 rounded-full", opt.class)}
                          />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Целевая сумма</label>
                <Input
                  type="number"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder="300000"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Уже накоплено</label>
                <Input
                  type="number"
                  value={formSaved}
                  onChange={(e) => setFormSaved(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Дедлайн (необязательно)
              </label>
              <Input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Описание</label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Описание проекта"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Связанные категории
              </label>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.type === "expense")
                  .map((cat) => {
                    const selected = formCategoryIds.includes(cat.id);
                    return (
                      <Badge
                        key={cat.id}
                        variant={selected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted",
                        )}
                        onClick={() => handleCategoryToggle(cat.id)}
                      >
                        {cat.name}
                      </Badge>
                    );
                  })}
              </div>
              <p className="text-xs text-muted-foreground">
                Расходы в выбранных категориях будут отслеживаться
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              {editingProject ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!addFundsDialog}
        onOpenChange={(open) => {
          if (!open) {
            setAddFundsDialog(null);
            setAddFundsAmount("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Добавить средства — {addFundsDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Сумма</label>
              <Input
                type="number"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                placeholder="10000"
                min={1}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddFundsDialog(null);
                setAddFundsAmount("");
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleAddFunds}>
              <PiggyBank className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
