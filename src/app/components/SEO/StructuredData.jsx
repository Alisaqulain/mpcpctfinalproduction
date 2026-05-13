/**
 * Structured Data (JSON-LD) Component for SEO
 * Implements Schema.org markup for better search engine understanding
 */

/** Brand-level Organization (parent entity for Knowledge Graph) */
export function OrganizationBrandSchema({ siteUrl }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MPC PCT",
    "alternateName": ["MPCPCT", "MPC PCT — CCC & CPCT Practice Platform"],
    "url": siteUrl,
    "logo": `${siteUrl}/logo2.png`,
    "image": `${siteUrl}/logo2.png`,
    "description":
      "MPC PCT is an online exam and typing practice platform for CCC, CPCT, and government computer certification aspirants in Indore and Madhya Pradesh.",
    "foundingLocation": {
      "@type": "Place",
      "name": "Indore, Madhya Pradesh, India",
    },
    "brand": {
      "@type": "Brand",
      "name": "MPC PCT",
      "slogan": "Practice. Improve. Succeed.",
    },
    "sameAs": [
      process.env.NEXT_PUBLIC_FACEBOOK_URL,
      process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      process.env.NEXT_PUBLIC_LINKEDIN_URL,
      process.env.NEXT_PUBLIC_YOUTUBE_URL,
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function EducationalOrganizationSchema({ siteUrl }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "MPC PCT",
    "alternateName": ["MPCPCT", "MPC PCT Exam Practice"],
    "url": siteUrl,
    "logo": `${siteUrl}/logo2.png`,
    "image": `${siteUrl}/logo2.png`,
    "description": "MPCPCT - The #1 online platform for CPCT, RSCIT, and CCC exam preparation in Indore, Madhya Pradesh, India. MPCPCT offers comprehensive typing practice in Hindi & English, real-time results, expert guidance, and government job exam preparation for Data Entry Operator, IT Operator, Assistant Grade 3, Shorthand, and Typist positions. Best CPCT coaching in Indore, MP.",
    "brand": {
      "@type": "Brand",
      "name": "MPC PCT"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-8989966753",
      "contactType": "Customer Service",
      "email": "Mpcpct111@gmail.com",
      "areaServed": {
        "@type": "City",
        "name": "Indore",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      "availableLanguage": ["en", "hi"]
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Indore",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Bhopal",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Gwalior",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Jabalpur",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Ujjain",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "State",
        "name": "Madhya Pradesh"
      }
    ],
    // Add social media links when available
    // "sameAs": [
    //   "https://www.facebook.com/mpcpct",
    //   "https://www.twitter.com/mpcpct",
    //   "https://www.linkedin.com/company/mpcpct"
    // ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
      "addressRegion": "Madhya Pradesh",
      "addressLocality": "Indore"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BlogPostingSchema({ siteUrl, post }) {
  if (!post?.title) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || post.excerpt || "",
    image: post.featuredImage ? [post.featuredImage] : [`${siteUrl}/logo2.png`],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Organization",
      name: post.author || "MPC PCT",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "MPC PCT",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo2.png`,
      },
    },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    url: `${siteUrl}/blog/${post.slug}`,
    inLanguage: "en-IN",
    keywords: (post.tags || []).join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteSchema({ siteUrl }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MPC PCT",
    "alternateName": ["MPCPCT", "mpcpct.com"],
    "url": siteUrl,
    "description": "MPC PCT — Practice CCC, CPCT, RSCIT, and typing exams with bilingual support in Indore, Madhya Pradesh. Online mock tests, typing labs, and skill assessments for MP government exam aspirants.",
    "inLanguage": ["en-IN", "hi-IN"]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function CourseSchema({ siteUrl, courseName, description, provider }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": courseName,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": provider || "MPCPCT",
      "url": siteUrl
    },
    "educationalLevel": "Beginner to Advanced",
    "inLanguage": ["en-IN", "hi-IN"],
    "courseCode": courseName.replace(/\s+/g, "").toUpperCase(),
    "teaches": [
      "Typing Skills",
      "Computer Proficiency",
      "Hindi Typing",
      "English Typing",
      "Government Exam Preparation"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({ faqs }) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items, siteUrl }) {
  if (!items || items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${siteUrl}${item.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function LocalBusinessSchema({ siteUrl }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}#localbusiness`,
    "name": "MPC PCT",
    "alternateName": "MPC PCT — CCC, CPCT & Typing Practice (Indore)",
    "url": siteUrl,
    "logo": `${siteUrl}/logo2.png`,
    "image": `${siteUrl}/logo2.png`,
    "description": "Best CPCT, RSCIT, and CCC exam preparation platform in Indore, Madhya Pradesh, India. Practice typing in Hindi & English, get real-time results, comprehensive learning materials, and expert guidance. Join thousands of students from Indore, Bhopal, Gwalior, Jabalpur, and across MP using MPCPCT for government job exam preparation.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Indore",
      "addressLocality": "Indore",
      "addressRegion": "Madhya Pradesh",
      "postalCode": "452001",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "22.7196",
      "longitude": "75.8577"
    },
    "telephone": "+91-8989966753",
    "email": "Mpcpct111@gmail.com",
    "priceRange": "₹₹",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Indore",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Bhopal",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Gwalior",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Jabalpur",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Ujjain",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "State",
        "name": "Madhya Pradesh"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ExamPaperSchema({ siteUrl, examName, examType, description, questionCount, duration, datePublished }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": `${examName} Exam Paper`,
    "description": description || `Free ${examName} exam paper, ${examName} question paper, ${examName} previous year paper, ${examName} sample paper for practice. Download ${examName} exam paper PDF, ${examName} solved paper with answers.`,
    "educationalLevel": "Professional",
    "learningResourceType": "Exam Paper",
    "about": {
      "@type": "Thing",
      "name": examName
    },
    "provider": {
      "@type": "EducationalOrganization",
      "name": "MPCPCT",
      "url": siteUrl
    },
    "inLanguage": ["en-IN", "hi-IN"],
    "datePublished": datePublished || new Date().toISOString(),
    "numberOfQuestions": questionCount || 75,
    "timeRequired": duration ? `PT${duration}M` : "PT120M",
    "keywords": `${examName} exam paper, ${examName} question paper, ${examName} previous year paper, ${examName} sample paper, ${examName} practice paper, ${examName} solved paper, ${examName} mock test paper, ${examName} exam paper download, ${examName} paper PDF`,
    "url": `${siteUrl}/exam`
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ServiceSchema({ siteUrl }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Online Education Platform",
    "provider": {
      "@type": "EducationalOrganization",
      "name": "MPCPCT",
      "url": siteUrl
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Indore",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Bhopal",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Gwalior",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Jabalpur",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "City",
        "name": "Ujjain",
        "containedIn": {
          "@type": "State",
          "name": "Madhya Pradesh"
        }
      },
      {
        "@type": "State",
        "name": "Madhya Pradesh"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Exam Preparation Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Course",
            "name": "CPCT Exam Preparation",
            "description": "Practice and prepare for CPCT (Computer Proficiency Certificate Test) exam. Download free CPCT exam papers, CPCT question papers, CPCT previous year papers, CPCT sample papers 2025. Get CPCT solved papers, CPCT mock test papers, CPCT practice papers with answers.",
            "keywords": "CPCT exam paper, CPCT question paper, CPCT previous year paper, CPCT sample paper, CPCT practice paper, CPCT solved paper, CPCT mock test paper, CPCT exam paper download, CPCT paper PDF"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Course",
            "name": "RSCIT Exam Preparation",
            "description": "Practice and prepare for RSCIT (Rajasthan State Certificate in Information Technology) exam"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Course",
            "name": "CCC Exam Preparation",
            "description": "Practice and prepare for CCC (Course on Computer Concepts) exam"
          }
        }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

