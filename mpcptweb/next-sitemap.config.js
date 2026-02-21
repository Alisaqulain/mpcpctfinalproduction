/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mpcpct.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/admin',
    '/api/*',
    '/exam_mode',
    '/payment',
    '/payment-success',
    '/payment-failed',
    '/dashboard',
    '/profile',
    '/login',
    '/signup',
    '/forget',
    '/debug',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/exam_mode',
          '/payment',
          '/payment-success',
          '/payment-failed',
          '/dashboard',
          '/profile',
          '/login',
          '/signup',
          '/forget',
          '/debug',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/exam_mode',
          '/payment',
          '/payment-success',
          '/payment-failed',
          '/dashboard',
          '/profile',
          '/login',
          '/signup',
          '/forget',
          '/debug',
        ],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mpcpct.com'}/sitemap.xml`,
    ],
  },
  transform: async (config, path) => {
    // Set priorities based on path
    let priority = 0.7;
    let changefreq = 'weekly';
    
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (['/exam', '/learning', '/skill_test'].includes(path)) {
      priority = 0.9;
      changefreq = 'weekly';
    } else if (['/price', '/about-us', '/contact-us'].includes(path)) {
      priority = 0.8;
      changefreq = 'monthly';
    } else if (['/privacy', '/terms', '/refund', '/shipping'].includes(path)) {
      priority = 0.5;
      changefreq = 'yearly';
    }
    
    return {
      loc: path,
      lastmod: new Date().toISOString(),
      changefreq: changefreq,
      priority: priority,
    }
  },
}
