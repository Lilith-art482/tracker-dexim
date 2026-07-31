"use client";

import { useState } from "react";
import { Trash2, CalendarDays, Columns3, Table2, Clock, ShieldCheck } from "lucide-react";
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
const MAX_DAYS = 90;
const DEFAULT_DAYS = 30;

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
    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/30 via-background to-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary shrink-0 ring-1 ring-primary/10">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Input
            type="number"
            min={1}
            max={MAX_DAYS}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${DEFAULT_DAYS}`}
            className="h-10 w-28 text-center tabular-nums text-sm font-medium rounded-xl"
          />
          <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
            <Clock className="h-3 w-3 text-muted-foreground/40" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground/60 font-medium">
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
    if (trimmed === "") return DEFAULT_DAYS;
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
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                <Trash2 className="h-4.5 w-4.5 text-primary" />
              </div>
              Автоудаление задач
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
            Задачи с пометкой «Выполнено» будут автоматически удалены через
            указанный срок. По умолчанию — {DEFAULT_DAYS} суток.
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
          <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Пустое поле = автоудаление через {DEFAULT_DAYS} суток
            </p>
          </div>
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
