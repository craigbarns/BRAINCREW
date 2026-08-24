import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Braincrew — Agent orchestration",
  description: "Déployez des escouades d’agents IA pour votre entreprise.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="noise">{children}</body>
    </html>
  );
}
