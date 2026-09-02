import { Calendar } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function PlannerPage() {
  return (
    <FeaturePageTemplate
      icon={Calendar}
      title="Планировщик"
      subtitle="Управляйте задачами и планами"
      features={[
        "Канбан-доски с drag-and-drop",
        "Личные и командные задачи",
        "Списки и планы",
        "Недельная таблица",
        "Дашборд с аналитикой",
        "Архив задач",
      ]}
      color="bg-blue-500/10 text-blue-500"
    />
  );
}
