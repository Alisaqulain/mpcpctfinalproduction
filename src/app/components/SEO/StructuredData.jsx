/**
 * Structured Data (JSON-LD) Component for SEO
 * Implements Schema.org markup for better search engine understanding
 */

export function OrganizationSchema({ siteUrl }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "MPCPCT",
    "alternateName": ["MPCPCT - CPCT, RSCIT, CCC Exam Practice Platform"],
    "url": siteUrl,
    "logo": `${siteUrl}/logo2.png`,
    "image": `${siteUrl}/logo2.png`,
    "description": "MPCPCT - The #1 online platform for CPCT, RSCIT, and CCC exam preparation in Indore, Madhya Pradesh, India. MPCPCT offers comprehensive typing practice in Hindi & English, real-time results, expert guidance, and government job exam preparation for Data Entry Operator, IT Operator, Assistant Grade 3, Shorthand, and Typist positions. Best CPCT coaching in Indore, MP.",
    "brand": {
      "@type": "Brand",
      "name": "MPCPCT"
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

export function WebSiteSchema({ siteUrl }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MPCPCT",
    "alternateName": "MPCPCT",
    "url": siteUrl,
    "description": "MPCPCT - Practice CPCT, RSCIT, and CCC exams with bilingual support in Indore, Madhya Pradesh. Master typing skills for government jobs in MP with MPCPCT. Best online exam practice platform in Indore for CPCT, RSCIT, and CCC preparation.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
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
    "@type": "EducationalOrganization",
    "@id": `${siteUrl}#organization`,
    "name": "MPCPCT",
    "alternateName": "MPCPCT - CPCT, RSCIT, CCC Exam Practice Platform",
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
            "description": "Practice and prepare for CPCT (Computer Proficiency Certificate Test) exam"
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

