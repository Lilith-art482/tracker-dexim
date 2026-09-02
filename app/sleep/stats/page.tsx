import { BarChart3, Construction } from "lucide-react";

export default function SleepStatsPage() {
  return (
    <div className="text-center py-16 space-y-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 mx-auto mb-4">
        <BarChart3 className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-bold">Статистика сна</h2>
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <Construction className="h-3.5 w-3.5" />В разработке
      </div>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Графики и аналитика вашего сна за неделю, месяц и всё время.
      </p>
    </div>
  );
}
