"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WorkView } from "@/components/work-view";

export default function DeveloperPage() {
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

        <WorkView mode="dev" />
      </div>
    </div>
  );
}
