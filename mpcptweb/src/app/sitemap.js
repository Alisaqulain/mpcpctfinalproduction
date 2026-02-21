export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://mpcpct.com";
  
  // Define all routes with their priorities and change frequencies
  const routes = [
    {
      url: "",
      priority: 1.0,
      changeFrequency: "daily",
      lastModified: new Date(),
    },
    {
      url: "/exam",
      priority: 0.9,
      changeFrequency: "weekly",
      lastModified: new Date(),
    },
    {
      url: "/learning",
      priority: 0.9,
      changeFrequency: "weekly",
      lastModified: new Date(),
    },
    {
      url: "/skill_test",
      priority: 0.9,
      changeFrequency: "weekly",
      lastModified: new Date(),
    },
    {
      url: "/price",
      priority: 0.8,
      changeFrequency: "monthly",
      lastModified: new Date(),
    },
    {
      url: "/about-us",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: new Date(),
    },
    {
      url: "/contact-us",
      priority: 0.7,
      changeFrequency: "monthly",
      lastModified: new Date(),
    },
    {
      url: "/privacy",
      priority: 0.5,
      changeFrequency: "yearly",
      lastModified: new Date(),
    },
    {
      url: "/terms",
      priority: 0.5,
      changeFrequency: "yearly",
      lastModified: new Date(),
    },
    {
      url: "/refund",
      priority: 0.5,
      changeFrequency: "yearly",
      lastModified: new Date(),
    },
    {
      url: "/shipping",
      priority: 0.5,
      changeFrequency: "yearly",
      lastModified: new Date(),
    },
    {
      url: "/android",
      priority: 0.6,
      changeFrequency: "monthly",
      lastModified: new Date(),
    },
    {
      url: "/notes",
      priority: 0.7,
      changeFrequency: "weekly",
      lastModified: new Date(),
    },
    {
      url: "/faq",
      priority: 0.8,
      changeFrequency: "monthly",
      lastModified: new Date(),
    },
    {
      url: "/android",
      priority: 0.6,
      changeFrequency: "monthly",
      lastModified: new Date(),
    },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
