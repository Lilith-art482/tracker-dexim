import Link from "next/link";
import { ArrowLeft, FileText, Construction } from "lucide-react";

export default function NotesPage() {
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 mx-auto mb-4">
            <FileText className="h-7 w-7 text-violet-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
            Заметки
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 mb-4">
            <Construction className="h-3.5 w-3.5" />В разработке
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Здесь появится удобный редактор заметок с поддержкой форматирования,
            тегов, поиска и прикрепления файлов.
          </p>
        </div>
      </div>
    </div>
  );
}
