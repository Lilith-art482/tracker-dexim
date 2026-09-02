import { BedDouble } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function SleepPage() {
  return (
    <FeaturePageTemplate
      icon={BedDouble}
      title="Сон"
      subtitle="Отслеживайте качество сна и отдыха"
      features={[
        "Дневник сна",
        "Статистика",
        "Калькулятор циклов",
        "Контроль качества отдыха",
      ]}
      color="bg-indigo-500/10 text-indigo-500"
    />
  );
}
