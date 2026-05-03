import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduFlow - Plataforma de Ensino Online",
  description: "Sistema completo de cursos online com aulas em vídeo, exercícios práticos e quizzes interativos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
