import { Users } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function FamilyPage() {
  return (
    <FeaturePageTemplate
      icon={Users}
      title="Семья"
      subtitle="Совместное планирование для всей семьи"
      features={[
        "Календари событий",
        "Планирование",
        "Совместные задачи",
        "Напоминания для всей семьи",
      ]}
      color="bg-pink-500/10 text-pink-500"
    />
  );
}
