import { Dumbbell } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function SportPage() {
  return (
    <FeaturePageTemplate
      icon={Dumbbell}
      title="Спорт и питание"
      subtitle="Трекинг тренировок и контроль питания"
      features={[
        "Трекинг тренировок",
        "Дневник питания",
        "Калории и БЖУ",
        "Прогресс и цели",
      ]}
      color="bg-orange-500/10 text-orange-500"
    />
  );
}
