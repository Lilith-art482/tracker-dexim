"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const STORAGE_KEY = "inmotion_personal_settings";
const MAX_DAYS = 60;

export interface PersonalSettings {
  autoDeleteCompletedDays: number | null;
}

export function getPersonalSettings(): PersonalSettings {
  if (typeof window === "undefined") {
    return { autoDeleteCompletedDays: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { autoDeleteCompletedDays: null };
    return JSON.parse(raw);
  } catch {
    return { autoDeleteCompletedDays: null };
  }
}

export function savePersonalSettings(settings: PersonalSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface PersonalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonalSettingsDialog({
  open,
  onOpenChange,
}: PersonalSettingsDialogProps) {
  const [days, setDays] = useState<string>(() => {
    const settings = getPersonalSettings();
    return settings.autoDeleteCompletedDays?.toString() ?? "";
  });

  const handleSave = () => {
    const trimmed = days.trim();
    if (trimmed === "") {
      savePersonalSettings({ autoDeleteCompletedDays: null });
      toast.success("Настройки сохранены");
      onOpenChange(false);
      return;
    }
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 1 || num > MAX_DAYS) {
      toast.error(`Введите число от 1 до ${MAX_DAYS}`);
      return;
    }
    savePersonalSettings({ autoDeleteCompletedDays: num });
    toast.success("Настройки сохранены");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Автоудаление выполненных
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <p className="text-sm text-muted-foreground">
            Задачи с пометкой «Выполнено» будут автоматически удалены через
            указанное количество дней.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Хранение (дней, 1–{MAX_DAYS})
            </label>
            <Input
              type="number"
              min={1}
              max={MAX_DAYS}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Не удалять"
              className="h-9"
            />
            <p className="text-[11px] text-muted-foreground/70">
              Пустое значение = автоудаление выключено
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
