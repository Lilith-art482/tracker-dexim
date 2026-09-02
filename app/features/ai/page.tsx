import { Bot } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function AiPage() {
  return (
    <FeaturePageTemplate
      icon={Bot}
      title="AI-помощник"
      subtitle="Интеллектуальная поддержка в вашем приложении"
      features={[
        "Контекстный анализ финансов",
        "Анализ задач и привычек",
        "Ответы на вопросы",
        "Советы по планированию",
      ]}
      color="bg-purple-500/10 text-purple-500"
    />
  );
}
