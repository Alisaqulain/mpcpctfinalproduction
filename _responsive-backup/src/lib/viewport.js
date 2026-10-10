/** Shared viewport + theme for App Router metadata API */
export const defaultViewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#290c52" },
    { media: "(prefers-color-scheme: dark)", color: "#290c52" },
  ],
};
