import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/providers/providers";
import ToasterProvider from "@/components/ui/sooner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { GoogleTagManager } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dwaparyug.org"),
  title: {
    default: "Dwaparyug Foundation – India’s Most Trusted NGO",
    template: "%s | Dwaparyug Foundation",
  },
  description:
    "Dwaparyug Foundation is a non-profit NGO in India dedicated to education, health, women hygiene, and food relief for underprivileged communities. Join us in creating a better future through donations, volunteering, and social development programs.",
  keywords: [
    "Dwaparyug Foundation",
    "Dwaparyug NGO",
    "non profit organization India",
    "best NGO in Delhi",
    "trusted NGO for donations",
    "education NGO India",
    "NGO for child education",
    "women hygiene awareness programs",
    "food distribution NGO India",
    "free health camps Delhi",
    "rural development NGO",
    "volunteer opportunities Delhi",
    "donate online to NGO India",
    "emergency relief campaigns",
    "community development NGO",
    "medical camp NGO India",
    "charity platform India",
    "hunger relief NGO Delhi",
    "sustainable development NGO",
    "youth volunteering India",
  ],
  openGraph: {
    title:
      "Dwaparyug Foundation – Empowering Lives Through Education, Health & Hope",
    description:
      "Join Dwaparyug Foundation in empowering underprivileged communities across India through education, health awareness, food drives, and women hygiene programs.",
    url: "https://www.dwaparyug.org",
    siteName: "Dwaparyug Foundation",
    images: [
      {
        url: "https://www.dwaparyug.org/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dwaparyug Foundation – NGO in India",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dwaparyug Foundation – India’s Most Trusted NGO",
    description:
      "Support education, health, and community welfare with Dwaparyug Foundation. Donate or volunteer to make a difference today!",
    images: ["https://www.dwaparyug.org/og-image.jpg"],
    creator: "@dwaparyug",
  },
  generator: "AJPR WORLD & Jatin Vaishnav",
  alternates: {
    canonical: "https://www.dwaparyug.org",
  },
  authors: [
    { name: "Jatin Vaishnav", url: "https://jatindevv.netlify.app" },
    { name: "AJPR World", url: "https://ajprworld.com" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1318765186360746');  // 👈 your pixel ID
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1318765186360746&ev=PageView&noscript=1"
            alt="facebook pixel"
          />
        </noscript>
        {/* ✅ End Meta Pixel Code */}
      </head>

      <body className={inter.className}>
        <NextAuthProvider>
          <ToasterProvider />
          <GoogleTagManager gtmId="GTM-P33WDTHR" />
          {children}
          <Analytics />
          <SpeedInsights />

          {/* ✅ Google Analytics */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-D9CYQ2RPGP"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-D9CYQ2RPGP');
            `}
          </Script>
        </NextAuthProvider>
      </body>
    </html>
  );
}
