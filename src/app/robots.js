export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mpcpct.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/exam_mode",
          "/payment",
          "/payment-success",
          "/payment-failed",
          "/dashboard",
          "/profile",
          "/login",
          "/signup",
          "/forget",
          "/debug",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/exam_mode",
          "/payment",
          "/payment-success",
          "/payment-failed",
          "/dashboard",
          "/profile",
          "/login",
          "/signup",
          "/forget",
          "/debug",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
