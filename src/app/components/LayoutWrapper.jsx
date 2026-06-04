"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Header from "./common/Header";
import Footer from "./common/Footer";

const FloatingGrowthWidgets = dynamic(() => import("./FloatingGrowthWidgets"), {
  ssr: false,
});

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  const hideLayout =
    pathname?.startsWith("/exam") ||
    pathname?.startsWith("/tips/") ||
    pathname?.startsWith("/keyboard") ||
    pathname?.startsWith("/hindi-keyboard") ||
    pathname?.startsWith("/typing") ||
    pathname?.startsWith("/learning") ||
    pathname?.startsWith("/skill_test") ||
    pathname?.startsWith("/result");

  const hideFooter =
    hideLayout ||
    pathname === "/contact-us" ||
    pathname === "/login" ||
    pathname === "/payment-app";

  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>
      {!hideLayout && <Header />}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      {!hideLayout && <FloatingGrowthWidgets />}
    </>
  );
}

