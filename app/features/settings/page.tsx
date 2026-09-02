import { Settings } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function SettingsPage() {
  return (
    <FeaturePageTemplate
      icon={Settings}
      title="Настройки"
      subtitle="Персонализация интерфейса и поведения"
      features={[
        "Темы оформления",
        "Языки интерфейса",
        "Уведомления",
        "Внешний вид",
        "Звуки и музыка",
      ]}
      color="bg-gray-500/10 text-gray-500"
    />
  );
}
