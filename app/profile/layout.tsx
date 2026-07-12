import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль — In Motion",
  description: "In Motion",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
