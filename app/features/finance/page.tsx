import { DollarSign } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function FinancePage() {
  return (
    <FeaturePageTemplate
      icon={DollarSign}
      title="Финансы"
      subtitle="Контроль доходов, расходов и бюджетов"
      features={[
        "Счета и кошельки",
        "Транзакции и категории",
        "Бюджет и цели",
        "Кредиты и обязательства",
        "Подушка безопасности",
        "Статистика",
        "Повторяющиеся платежи",
        "Список покупок",
        "Кассовый прогноз",
      ]}
      color="bg-emerald-500/10 text-emerald-500"
    />
  );
}
