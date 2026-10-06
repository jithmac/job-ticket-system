import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Apex Job Tickets",
    default: "Apex Job Tickets",
  },
  description: "Job ticket management system for field operations.",
};

/**
 * Material Symbols (the icon font in the samples) isn't available through next/font,
 * and Next drops remote CSS @imports, so it is imported here. It goes into the `base`
 * cascade layer so Tailwind size/colour utilities on icons win, exactly like the samples.
 */
const iconFontCss =
  '@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block") layer(base);';

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <style>{iconFontCss}</style>
      </head>
      <body className="font-body-md text-on-surface min-h-screen">{children}</body>
    </html>
  );
}
