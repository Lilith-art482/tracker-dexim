import { Heart } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function HabitsPage() {
  return (
    <FeaturePageTemplate
      icon={Heart}
      title="Привычки"
      subtitle="Формируйте полезные привычки и отслеживайте прогресс"
      features={[
        "Трекер привычек с сериями",
        "Достижения",
        "Календарь выполнения",
        "Напоминания",
        "Чеклисты",
        "Статистика по неделям/месяцам/году",
      ]}
      color="bg-rose-500/10 text-rose-500"
    />
  );
}
