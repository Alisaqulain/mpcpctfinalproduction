"use client";

import { usePathname } from "next/navigation";
import Header from "./common/Header";
import Footer from "./common/Footer";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  // Add all routes where you want to hide Header and Footer
  const hideLayout = 
    pathname?.startsWith("/exam") || 
    pathname?.startsWith("/tips/") || 
    pathname?.startsWith("/keyboard") || 
    pathname?.startsWith("/hindi-keyboard") || 
    pathname?.startsWith("/typing") ||
    pathname?.startsWith("/learning") ||
    pathname?.startsWith("/skill_test") ||
    pathname?.startsWith("/result");

  return (
    <>
      {!hideLayout && <Header />}
      <main>{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
}

