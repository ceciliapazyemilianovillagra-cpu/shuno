import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHUNO · AI Music Studio",
  description: "Estudio personal de composición y generación musical con IA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
