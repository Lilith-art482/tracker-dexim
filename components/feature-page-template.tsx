import Link from "next/link";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface FeaturePageProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  features: string[];
  color: string;
}

export function FeaturePageTemplate({ icon: Icon, title, subtitle, features, color }: FeaturePageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center`}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Возможности</h2>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground text-sm">Скоро здесь будут скриншоты и подробное описание</p>
        </div>
      </main>
    </div>
  );
}
