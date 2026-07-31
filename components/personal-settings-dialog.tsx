"use client";

import { useState } from "react";
import { Trash2, CalendarDays, Columns3, Table2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

const STORAGE_KEY = "inmotion_personal_settings";
const MAX_DAYS = 60;

export interface PersonalSettings {
  autoDeleteTableDays: number | null;
  autoDeleteKanbanDays: number | null;
}

function readRaw(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getPersonalSettings(): PersonalSettings {
  const raw = readRaw();
  // migrate old single-field key
  const legacy =
    typeof raw.autoDeleteCompletedDays === "number"
      ? raw.autoDeleteCompletedDays
      : null;
  return {
    autoDeleteTableDays:
      typeof raw.autoDeleteTableDays === "number"
        ? raw.autoDeleteTableDays
        : legacy,
    autoDeleteKanbanDays:
      typeof raw.autoDeleteKanbanDays === "number"
        ? raw.autoDeleteKanbanDays
        : legacy,
  };
}

export function savePersonalSettings(settings: PersonalSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function SettingRow({
  icon: Icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: typeof Table2;
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={MAX_DAYS}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Выкл"
          className="h-9 w-24 text-center tabular-nums"
        />
        <span className="text-xs text-muted-foreground">
          дн. (1–{MAX_DAYS})
        </span>
      </div>
    </div>
  );
}

interface PersonalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonalSettingsDialog({
  open,
  onOpenChange,
}: PersonalSettingsDialogProps) {
  const [tableDays, setTableDays] = useState<string>(() => {
    const s = getPersonalSettings();
    return s.autoDeleteTableDays?.toString() ?? "";
  });
  const [kanbanDays, setKanbanDays] = useState<string>(() => {
    const s = getPersonalSettings();
    return s.autoDeleteKanbanDays?.toString() ?? "";
  });

  const parse = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 1 || num > MAX_DAYS) return -1;
    return num;
  };

  const handleSave = () => {
    const t = parse(tableDays);
    const k = parse(kanbanDays);
    if (t === -1 || k === -1) {
      toast.error(`Введите число от 1 до ${MAX_DAYS}`);
      return;
    }
    savePersonalSettings({
      autoDeleteTableDays: t,
      autoDeleteKanbanDays: k,
    });
    toast.success("Настройки сохранены");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-primary/5 via-background to-background">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                <Trash2 className="h-4 w-4" />
              </div>
              Автоудаление задач
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Задачи с пометкой «Выполнено» будут автоматически удалены через
            указанный срок. Настройте отдельно для каждого режима.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Settings body */}
        <div className="px-6 py-5 space-y-3">
          <SettingRow
            icon={Table2}
            label="Таблица / Список"
            description="Общий срок для табличного и спискового режимов"
            value={tableDays}
            onChange={setTableDays}
          />
          <SettingRow
            icon={Columns3}
            label="Канбан"
            description="Срок хранения выполненных задач на канбан-доске"
            value={kanbanDays}
            onChange={setKanbanDays}
          />
          <p className="text-[11px] text-muted-foreground/60 text-center pt-1">
            Пустое поле = автоудаление отключено для данного режима
          </p>
        </div>

        {/* Footer */}
        <div className="h-px bg-border" />
        <DialogFooter className="px-6 py-4 gap-2 flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
