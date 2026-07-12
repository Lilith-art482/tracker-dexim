import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль - On Track",
  description: "On Track",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
