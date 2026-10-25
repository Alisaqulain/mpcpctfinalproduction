"use client";

import { useLayoutEffect } from "react";

const DESKTOP_QUERY = "(min-width: 640px)";

/**
 * Scales a result certificate so skill, learning, and exam cards
 * fit in one desktop viewport without a page scrollbar.
 */
export default function useFitResultFrame(pageRef, active = true) {
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!active || !page) {
      document.documentElement.classList.remove("result-frame-lock");
      return undefined;
    }

    const card = page.querySelector(".result-fit-card");
    if (!card) return undefined;

    const mq = window.matchMedia(DESKTOP_QUERY);
    let lastScale = -1;
    let frame = 0;

    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!mq.matches) {
          lastScale = -1;
          card.style.transform = "";
          page.style.alignItems = "";
          document.documentElement.classList.remove("result-frame-lock");
          return;
        }

        document.documentElement.classList.add("result-frame-lock");
        const availableH = page.clientHeight;
        const availableW = page.clientWidth;
        const neededH = card.offsetHeight;
        const neededW = card.offsetWidth;
        if (!availableH || !availableW || !neededH || !neededW) return;

        const scale = Math.min(1, (availableH - 10) / neededH, (availableW - 8) / neededW);
        const next = scale < 0.995 ? scale : 1;
        page.style.alignItems = next < 1 ? "flex-start" : "center";
        if (Math.abs(next - lastScale) < 0.005) return;
        lastScale = next;
        card.style.transformOrigin = "top center";
        card.style.transform = next < 1 ? `scale(${next})` : "";
      });
    };

    fit();
    window.addEventListener("resize", fit);
    const ro = new ResizeObserver(fit);
    ro.observe(card);
    const imgs = [...card.querySelectorAll("img")];
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", fit);
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", fit));
      card.style.transform = "";
      page.style.alignItems = "";
      document.documentElement.classList.remove("result-frame-lock");
    };
  }, [pageRef, active]);
}
