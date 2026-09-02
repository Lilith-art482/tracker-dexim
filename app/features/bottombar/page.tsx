import { BarChart3 } from "lucide-react";
import { FeaturePageTemplate } from "@/components/feature-page-template";

export default function BottombarPage() {
  return (
    <FeaturePageTemplate
      icon={BarChart3}
      title="Нижний бар"
      subtitle="Полезная информация в одном месте"
      features={[
        "Погода в реальном времени",
        "Часы и дата",
        "Курсы валют",
        "Быстрый доступ к разделам",
      ]}
      color="bg-cyan-500/10 text-cyan-500"
    />
  );
}
