"use client";

import Link from "next/link";
import { ArrowLeft, StickyNote, Construction } from "lucide-react";

export default function WorkNotesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6">
        <Link
          href="/work"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">В разработке</h3>
          <p className="text-sm text-muted-foreground">
            Раздел «Заметки для работы» скоро будет доступен
          </p>
        </div>
      </div>
    </div>
  );
}
