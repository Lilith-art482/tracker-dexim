"use client";

import { useState, useRef, useCallback } from "react";
import {
  Download,
  Upload,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { Habit, HabitLog, Achievement } from "@/lib/habit-types";

interface ModuleBackupProps {
  habits: Habit[];
  logs: HabitLog[];
  achievements: Achievement[];
  onReset: () => void;
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ModuleBackup({
  habits,
  logs,
  achievements,
  onReset,
}: ModuleBackupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleExport = useCallback(() => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        habits,
        logs,
        achievements,
      };
      downloadJSON(
        data,
        `habits-backup-${new Date().toISOString().split("T")[0]}.json`,
      );
      toast.success("Данные экспортированы");
    } catch {
      toast.error("Ошибка при экспорте");
    }
  }, [habits, logs, achievements]);

  const handleDownloadBackup = useCallback(() => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        habits,
        logs,
        achievements,
      };
      downloadJSON(
        data,
        `habits-backup-${new Date().toISOString().split("T")[0]}.json`,
      );
      toast.success("Бэкап скачан");
    } catch {
      toast.error("Ошибка при создании бэкапа");
    }
  }, [habits, logs, achievements]);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.habits && !data.logs && !data.achievements) {
          toast.error("Неверный формат файла");
          setImporting(false);
          return;
        }
        localStorage.setItem("habits_import", text);
        toast.success(
          "Данные импортированы. Перезагрузите страницу для применения.",
        );
      } catch {
        toast.error("Ошибка при импорте");
      }
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleReset = useCallback(() => {
    onReset();
    setResetDialogOpen(false);
    setResetConfirm(false);
    toast.success("Все данные сброшены");
  }, [onReset]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Экспорт и импорт</CardTitle>
          <CardDescription>
            Сохраните или восстановите свои данные
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="w-full justify-start sm:w-auto"
          >
            <Download className="size-4" />
            Экспорт данных
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadBackup}
            className="w-full justify-start sm:w-auto"
          >
            <FileDown className="size-4" />
            Скачать бэкап
          </Button>

          <Separator />

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              className="w-full justify-start sm:w-auto"
            >
              <Upload className="size-4" />
              {importing ? "Импорт..." : "Импорт данных"}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              Выберите JSON-файл с резервной копией
            </p>
          </div>

          <Separator />

          <Dialog
            open={resetDialogOpen}
            onOpenChange={(open) => {
              setResetDialogOpen(open);
              if (!open) {
                setResetConfirm(false);
              }
            }}
          >
            <DialogTrigger
              render={
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start sm:w-auto"
                />
              }
            >
              <Trash2 className="size-4" />
              Сбросить все данные
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Сбросить все данные?</DialogTitle>
                <DialogDescription>
                  Это действие удалит все привычки, логи и достижения. Операция
                  необратима.
                </DialogDescription>
              </DialogHeader>

              {!resetConfirm ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <AlertTriangle className="size-4 shrink-0 text-destructive" />
                    <span>
                      Вы уверены, что хотите удалить все данные? Это действие
                      нельзя отменить.
                    </span>
                  </div>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      Отмена
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => setResetConfirm(true)}
                    >
                      Да, сбросить
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <AlertTriangle className="size-4 shrink-0 text-destructive" />
                    <span>
                      Последнее подтверждение. Все данные будут безвозвратно
                      удалены.
                    </span>
                  </div>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      Отмена
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={handleReset}
                    >
                      Подтвердить сброс
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}