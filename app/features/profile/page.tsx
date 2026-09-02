import { User } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function ProfilePage() {
  return (
    <FeaturePageTemplate
      icon={User}
      title="Профиль"
      subtitle="Управление аккаунтом и данными"
      features={[
        "Аватар и имя",
        "Статистика использования",
        "Безопасность",
        "Экспорт данных",
      ]}
      color="bg-blue-500/10 text-blue-500"
    />
  );
}
