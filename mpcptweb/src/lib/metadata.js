/**
 * SEO Metadata Configuration for MPCPCT
 * Centralized metadata configuration for consistent SEO across all pages
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://mpcpct.com';
const siteName = 'MPCPCT - CPCT Exam Papers, RSCIT, CCC Practice Tests | Free CPCT Question Papers';
const defaultDescription = 'MPCPCT - Download free CPCT exam papers, practice CPCT question papers online, CPCT previous year papers, CPCT sample papers 2025. Best platform for CPCT exam preparation with real CPCT exam papers, CPCT mock tests, CPCT practice papers in Hindi & English. Get CPCT solved papers, CPCT question bank, CPCT exam pattern, CPCT syllabus. Free CPCT exam papers download, CPCT online test papers for MP government jobs.';
const defaultKeywords = 'CPCT exam paper, CPCT question paper, CPCT previous year paper, CPCT sample paper, CPCT practice paper, CPCT solved paper, CPCT question bank, CPCT exam pattern, CPCT syllabus, CPCT mock test paper, CPCT online test paper, CPCT exam paper download, CPCT paper PDF, CPCT exam paper 2025, CPCT paper solution, CPCT question paper with answer, CPCT exam paper Hindi, CPCT exam paper English, CPCT paper pattern, CPCT exam paper free download, CPCT previous paper, CPCT model paper, CPCT test paper, CPCT exam paper online, CPCT question paper PDF, CPCT exam paper 2024, CPCT paper download, CPCT solved question paper, CPCT exam paper MP, CPCT paper Indore, MPCPCT, MPCPCT Indore, MPCPCT Madhya Pradesh, CPCT exam Indore, CPCT coaching Indore, CPCT preparation Indore, CPCT practice test Indore, CPCT online exam Indore, CPCT mock test Indore, RSCIT exam paper, RSCIT question paper, RSCIT previous year paper, CCC exam paper, CCC question paper, typing practice Indore, Hindi typing Indore, English typing Indore, government job preparation Indore, MP government job, CPCT exam date, CPCT result, CPCT admit card';

export const defaultMetadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | MPCPCT`,
  },
  description: defaultDescription,
  keywords: defaultKeywords,
  authors: [{ name: 'MPCPCT Team', url: siteUrl }],
  creator: 'MPCPCT',
  publisher: 'MPCPCT',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'MPCPCT',
    title: siteName,
    description: defaultDescription,
    images: [
      {
        url: `${siteUrl}/logo2.png`,
        width: 1200,
        height: 630,
        alt: 'MPCPCT - Best CPCT, RSCIT, CCC Exam Practice Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: defaultDescription,
    images: [`${siteUrl}/logo2.png`],
    creator: '@mpcpct',
    site: '@mpcpct',
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en-IN': `${siteUrl}`,
      'hi-IN': `${siteUrl}/hi`,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'Education',
};

export function generatePageMetadata({
  title,
  description,
  keywords,
  path = '',
  image,
  noindex = false,
}) {
  const fullTitle = title ? `${title} | MPCPCT` : defaultMetadata.title.default;
  const fullDescription = description || defaultDescription;
  const fullKeywords = keywords ? `${defaultKeywords}, ${keywords}` : defaultKeywords;
  const fullPath = path ? `${siteUrl}${path}` : siteUrl;
  const ogImage = image || `${siteUrl}/logo2.png`;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords,
    robots: noindex
      ? { index: false, follow: false }
      : defaultMetadata.robots,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: fullTitle,
      description: fullDescription,
      url: fullPath,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: fullTitle,
      description: fullDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: fullPath,
    },
  };
}

export const pageMetadata = {
  home: generatePageMetadata({
    title: 'CPCT Exam Papers Free Download - CPCT Question Papers, Previous Year Papers | MPCPCT.com',
    description: 'MPCPCT.com - Download free CPCT exam papers, CPCT question papers, CPCT previous year papers, CPCT sample papers 2025. Practice CPCT exam papers online with answers. Get CPCT solved papers, CPCT mock test papers, CPCT practice papers in Hindi & English. Best platform for CPCT exam paper preparation. Free CPCT exam papers download, CPCT question bank, CPCT exam pattern for MP government jobs. CPCT exam paper 2025, CPCT paper PDF download.',
    keywords: 'CPCT exam paper, CPCT question paper, CPCT previous year paper, CPCT sample paper, CPCT practice paper, CPCT solved paper, CPCT question bank, CPCT exam pattern, CPCT syllabus, CPCT mock test paper, CPCT online test paper, CPCT exam paper download, CPCT paper PDF, CPCT exam paper 2025, CPCT paper solution, CPCT question paper with answer, CPCT exam paper Hindi, CPCT exam paper English, CPCT paper pattern, CPCT exam paper free download, CPCT previous paper, CPCT model paper, CPCT test paper, CPCT exam paper online, CPCT question paper PDF, CPCT exam paper 2024, CPCT paper download, CPCT solved question paper, MPCPCT, MPCPCT Indore, CPCT exam Indore, CPCT coaching Indore, CPCT preparation Indore, typing practice Indore, government job preparation Indore, MP government job',
    path: '/',
  }),
  about: generatePageMetadata({
    title: 'About Us - MPCPCT Team & Mission',
    description: 'Learn about MPCPCT - your trusted partner for CPCT, RSCIT, and CCC exam preparation. Founded by Captain Nadeem, we help you master typing and computer proficiency skills.',
    keywords: 'about MPCPCT, MPCPCT founder, Captain Nadeem, typing tutor, computer proficiency training',
    path: '/about-us',
  }),
  contact: generatePageMetadata({
    title: 'Contact Us - MPCPCT Support Team',
    description: 'Get in touch with MPCPCT support team. Email: Mpcpct111@gmail.com | Phone: 8989966753. We respond within 24 hours.',
    keywords: 'contact MPCPCT, MPCPCT support, customer service, help desk',
    path: '/contact-us',
  }),
  learning: generatePageMetadata({
    title: 'Learning Mode - Practice Typing & Computer Skills in Indore, MP',
    description: 'Learn typing and computer proficiency skills at your own pace in Indore, Madhya Pradesh. Practice with interactive lessons, bilingual support (Hindi & English), and track your progress. Best typing learning platform in Indore for CPCT, RSCIT, and CCC exam preparation.',
    keywords: 'typing practice Indore, computer skills learning Indore, Hindi typing tutorial Indore, English typing practice Indore, interactive learning Indore, typing classes Indore, typing coaching Indore, Hindi typing classes Indore, English typing classes Indore, typing institute Indore, computer proficiency training Indore, CPCT learning Indore, RSCIT learning Indore, CCC learning Indore, typing course Indore',
    path: '/learning',
  }),
  skillTest: generatePageMetadata({
    title: 'Skill Test - Test Your Typing Speed & Accuracy in Indore, MP',
    description: 'Test your typing speed and accuracy with MPCPCT skill tests in Indore, Madhya Pradesh. Get instant results, detailed analytics, and improve your performance for CPCT, RSCIT, and CCC exams. Best typing speed test platform in Indore for government job preparation.',
    keywords: 'typing speed test Indore, typing accuracy test Indore, WPM test Indore, skill assessment Indore, typing test online Indore, Hindi typing speed test Indore, English typing speed test Indore, typing speed test MP, government job typing test Indore, CPCT typing test Indore, RSCIT typing test Indore, CCC typing test Indore, typing speed test online Indore, typing practice test Indore',
    path: '/skill_test',
  }),
  exam: generatePageMetadata({
    title: 'CPCT Exam Papers - Free CPCT Question Papers, Previous Year Papers, Sample Papers 2025',
    description: 'Download free CPCT exam papers, practice CPCT question papers online. Get CPCT previous year papers, CPCT sample papers 2025, CPCT solved papers with answers. Practice CPCT mock test papers, CPCT practice papers in Hindi & English. Best platform for CPCT exam paper preparation. Free CPCT exam papers download, CPCT question bank, CPCT exam pattern, CPCT syllabus for MP government jobs.',
    keywords: 'CPCT exam paper, CPCT question paper, CPCT previous year paper, CPCT sample paper, CPCT practice paper, CPCT solved paper, CPCT question bank, CPCT exam pattern, CPCT syllabus, CPCT mock test paper, CPCT online test paper, CPCT exam paper download, CPCT paper PDF, CPCT exam paper 2025, CPCT paper solution, CPCT question paper with answer, CPCT exam paper Hindi, CPCT exam paper English, CPCT paper pattern, CPCT exam paper free download, CPCT previous paper, CPCT model paper, CPCT test paper, CPCT exam paper online, CPCT question paper PDF, CPCT exam paper 2024, CPCT paper download, CPCT solved question paper, CPCT exam paper MP, CPCT paper Indore, CPCT exam practice Indore, CPCT online exam Indore, CPCT mock test Indore, government exam preparation Indore, MP government exam',
    path: '/exam',
  }),
  pricing: generatePageMetadata({
    title: 'Pricing Plans - MPCPCT Subscription',
    description: 'Choose the perfect subscription plan for your exam preparation. Affordable pricing with access to all features, practice tests, and learning materials.',
    keywords: 'MPCPCT pricing, subscription plans, exam preparation cost, affordable typing course',
    path: '/price',
  }),
  login: generatePageMetadata({
    title: 'Login - Access Your MPCPCT Account',
    description: 'Login to your MPCPCT account to access practice tests, learning materials, and track your progress.',
    keywords: 'MPCPCT login, user login, account access',
    path: '/login',
    noindex: true,
  }),
  signup: generatePageMetadata({
    title: 'Sign Up - Create Your MPCPCT Account',
    description: 'Create a free MPCPCT account and start your journey to master typing and computer proficiency skills for government job exams.',
    keywords: 'MPCPCT signup, create account, free registration',
    path: '/signup',
  }),
  profile: generatePageMetadata({
    title: 'Profile - Your MPCPCT Dashboard',
    description: 'View your profile, subscription status, exam history, and performance analytics on your MPCPCT dashboard.',
    path: '/profile',
    noindex: true,
  }),
  privacy: generatePageMetadata({
    title: 'Privacy Policy - MPCPCT',
    description: 'Read MPCPCT privacy policy to understand how we collect, use, and protect your personal information.',
    keywords: 'privacy policy, data protection, user privacy',
    path: '/privacy',
  }),
  terms: generatePageMetadata({
    title: 'Terms and Conditions - MPCPCT',
    description: 'Read MPCPCT terms and conditions for using our platform, services, and content.',
    keywords: 'terms and conditions, user agreement, service terms',
    path: '/terms',
  }),
  refund: generatePageMetadata({
    title: 'Refund Policy - MPCPCT',
    description: 'Learn about MPCPCT refund and cancellation policy. 7-day money-back guarantee for unsatisfied customers.',
    keywords: 'refund policy, cancellation policy, money back guarantee',
    path: '/refund',
  }),
  faq: generatePageMetadata({
    title: 'FAQ - Frequently Asked Questions',
    description: 'Find answers to frequently asked questions about MPCPCT, CPCT, RSCIT, and CCC exam preparation. Learn about typing practice, exam formats, and platform features.',
    keywords: 'MPCPCT FAQ, CPCT exam questions, RSCIT exam FAQ, CCC exam help, typing practice questions, computer proficiency FAQ',
    path: '/faq',
  }),
};

