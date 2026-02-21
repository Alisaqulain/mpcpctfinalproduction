# Policy Pages Routes

This document lists all the policy pages and their routes in the MPCPCT application.

## Policy Pages Routes

| Page Name | Route | File Location | Status |
|-----------|-------|---------------|--------|
| **Cancellation & Refunds** | `/refund` | `src/app/refund/page.jsx` | ✅ Active |
| **Terms and Conditions** | `/terms` | `src/app/terms/page.jsx` | ✅ Active |
| **Shipping** | `/shipping` | `src/app/shipping/page.jsx` | ✅ Active |
| **Privacy** | `/privacy` | `src/app/privacy/page.jsx` | ✅ Active |
| **Contact Us** | `/contact-us` | `src/app/contact-us/page.jsx` | ✅ Active |

## Access Information

All policy pages are **publicly accessible** (no authentication required). They have been added to the public paths in the middleware configuration.

## Full URLs

Assuming your domain is `https://www.mpcpct.com`, the full URLs would be:

- Cancellation & Refunds: `https://www.mpcpct.com/refund`
- Terms and Conditions: `https://www.mpcpct.com/terms`
- Shipping: `https://www.mpcpct.com/shipping`
- Privacy: `https://www.mpcpct.com/privacy`
- Contact Us: `https://www.mpcpct.com/contact-us`

## Where These Pages Are Linked

1. **Footer Component** (`src/app/components/common/Footer.jsx`)
   - All policy pages are linked in the "Legal & Policies" section at the bottom of the footer

2. **Payment Page** (`src/app/payment/page.jsx`)
   - Policy links are displayed at the bottom of the payment page

3. **Header Component** (`src/app/components/common/Header.jsx`)
   - Contact Us is linked in the navigation menu

## Middleware Configuration

All policy pages are included in the public paths array in `src/middleware.js`, allowing unauthenticated access:

```javascript
const publicPaths = [
  "/", 
  "/signup", 
  "/login", 
  "/forget",
  "/terms",
  "/privacy",
  "/refund",
  "/shipping",
  "/contact-us",
  "/about-us"
];
```

## Page Features

All policy pages include:
- ✅ SEO metadata (title, description, keywords, OpenGraph)
- ✅ Responsive design
- ✅ Professional styling
- ✅ "Back to Home" navigation link
- ✅ Contact information section
- ✅ Last updated date


















