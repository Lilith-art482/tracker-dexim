import { FolderKanban } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function WorkPage() {
  return (
    <FeaturePageTemplate
      icon={FolderKanban}
      title="Работа"
      subtitle="Шаблоны задач для разных специальностей"
      features={[
        "Шаблоны для 6+ специальностей",
        "Контент-менеджер, разработчик, юрист, медик",
        "Расписание задач",
        "Рабочие заметки",
      ]}
      color="bg-amber-500/10 text-amber-500"
    />
  );
}
