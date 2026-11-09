import type { Metadata, Viewport } from "next";
import "./globals.css";
import Splash from "@/components/Splash";
import { I18nProvider } from "@/components/I18n";
import { getLang, getT } from "@/lib/i18n/server";
import WebAnalytics from "@/components/WebAnalytics";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { default: t.meta.title, template: "%s · E-carte Studio" },
    applicationName: "E-carte Studio",
    appleWebApp: { title: "E-carte Studio" },
    description: t.meta.description,
  };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Italiana&family=Pinyon+Script&family=Great+Vibes&family=Parisienne&family=Cinzel:wght@400;500&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&family=Amiri&family=Fredoka:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <I18nProvider lang={lang}>
          <Splash />
          <WebAnalytics siteTag={process.env.CF_WEB_ANALYTICS_TOKEN || ""} />{/* jeton du script (≠ site tag, qui sert à lire les chiffres) */}
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
