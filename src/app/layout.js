import "./globals.css";
import { Poppins } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import LayoutWrapper from "./components/LayoutWrapper";
import { defaultMetadata } from "../lib/metadata";
import { OrganizationSchema, WebSiteSchema, ServiceSchema, LocalBusinessSchema, ExamPaperSchema } from "./components/SEO/StructuredData";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap", // Optimize font loading
});

// Export metadata for SEO
export const metadata = defaultMetadata;

export default function RootLayout({ children }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://mpcpct.com';
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#290c52" />
        <meta name="geo.region" content="IN-MP" />
        <meta name="geo.placename" content="Indore, Madhya Pradesh, India" />
        <meta name="geo.position" content="22.7196;75.8577" />
        <meta name="ICBM" content="22.7196, 75.8577" />
        <meta name="location" content="Indore, Madhya Pradesh, India" />
        <meta name="locality" content="Indore" />
        <meta name="region" content="Madhya Pradesh" />
        <meta name="country" content="India" />
        <meta name="language" content="en-IN, hi-IN" />
        <meta name="distribution" content="India" />
        <meta name="target" content="all" />
        <meta name="audience" content="all" />
        <meta name="coverage" content="worldwide" />
        <meta name="rating" content="general" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo2.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo2.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo2.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data for SEO */}
        <OrganizationSchema siteUrl={siteUrl} />
        <LocalBusinessSchema siteUrl={siteUrl} />
        <WebSiteSchema siteUrl={siteUrl} />
        <ServiceSchema siteUrl={siteUrl} />
        <ExamPaperSchema 
          siteUrl={siteUrl} 
          examName="CPCT" 
          examType="Computer Proficiency Certification Test"
          description="Free CPCT exam papers, CPCT question papers, CPCT previous year papers, CPCT sample papers 2025. Download CPCT exam paper PDF, practice CPCT solved papers with answers. Best CPCT exam paper preparation platform."
          questionCount={75}
          duration={120}
        />
        
        {/* Google Analytics */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased ${poppins.className}`}
      >
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
