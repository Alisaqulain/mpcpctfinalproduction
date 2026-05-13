import "./globals.css";
import { Poppins } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import LayoutWrapper from "./components/LayoutWrapper";
import AnalyticsScripts from "./components/AnalyticsScripts";
import { defaultMetadata } from "../lib/metadata";
import { defaultViewport } from "../lib/viewport";
import {
  OrganizationBrandSchema,
  EducationalOrganizationSchema,
  WebSiteSchema,
  ServiceSchema,
  LocalBusinessSchema,
  ExamPaperSchema,
} from "./components/SEO/StructuredData";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata = defaultMetadata;

export const viewport = defaultViewport;

export default function RootLayout({ children }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mpcpct.com";

  return (
    <html lang="en" className="scroll-smooth">
      <head>
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

        {/* Structured Data for SEO */}
        <OrganizationBrandSchema siteUrl={siteUrl} />
        <EducationalOrganizationSchema siteUrl={siteUrl} />
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
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased ${poppins.className}`}
      >
        <AnalyticsScripts />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
