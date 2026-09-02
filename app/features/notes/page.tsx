import { BookOpen } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function NotesPage() {
  return (
    <FeaturePageTemplate
      icon={BookOpen}
      title="Заметки"
      subtitle="Блочный редактор для ваших идей"
      features={[
        "Блочный редактор",
        "Заголовки, списки, цитаты, код",
        "Задачи и делители",
        "Теги и поиск",
      ]}
      color="bg-violet-500/10 text-violet-500"
    />
  );
}
