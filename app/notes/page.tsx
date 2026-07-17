import { NotesShell } from "@/components/notes/notes-shell";
import { Suspense } from "react";

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesShell />
    </Suspense>
  );
}
