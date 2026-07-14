import Link from "next/link";
import { ArrowLeft, Newspaper, FileText } from "lucide-react";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        <div className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 mx-auto mb-4">
            <Newspaper className="h-7 w-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
            Блог In Motion
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
            Скоро здесь появятся статьи, гайды и новости проекта. Следите за
            обновлениями!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border/40 bg-muted/20 p-4 text-center opacity-60"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 mx-auto mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Статья {i}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  Скоро
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
