import type { Metadata, Viewport } from "next";
import "./globals.css";
import Splash from "@/components/Splash";

export const metadata: Metadata = {
  title: { default: "joyeuxevent · Invitations de mariage animées", template: "%s · joyeuxevent" },
  applicationName: "joyeuxevent",
  appleWebApp: { title: "joyeuxevent" },
  description: "Créez une invitation de mariage qui s'ouvre de façon spectaculaire, et envoyez-la par un simple lien.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Italiana&family=Pinyon+Script&family=Great+Vibes&family=Parisienne&family=Cinzel:wght@400;500&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&family=Amiri&display=swap"
        />
      </head>
      <body>
        <Splash />
        {children}
      </body>
    </html>
  );
}
