import { DuoDaysAuthProvider } from "@/lib/duodays/auth-context";

export default function DuoDaysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DuoDaysAuthProvider>{children}</DuoDaysAuthProvider>;
}
