import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AxiNafa AI — Le carnet financier intelligent des micro-commerçants",
  description:
    "AxiNafa AI transforme l'activité informelle en preuve de confiance : carnet de ventes intelligent, catégorisation automatique, tableau de bord et dossier de financement.",
};

export const viewport: Viewport = {
  themeColor: "#1B5E5A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
