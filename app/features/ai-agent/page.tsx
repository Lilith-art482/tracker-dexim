import { Bot } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function AiAgentPage() {
  return (
    <FeaturePageTemplate
      icon={Bot}
      title="AI-агент"
      subtitle="Автоматизация и интеллектуальные сценарии"
      features={[
        "Автоматизация задач",
        "Интеграции с сервисами",
        "Умные сценарии",
        "Контекстные рекомендации",
      ]}
      color="bg-violet-500/10 text-violet-500"
    />
  );
}
