/**
 * Helper function to generate page-specific metadata
 * Use this in page.js files to set dynamic metadata
 */

import { generatePageMetadata } from './metadata';

/**
 * Generate metadata for a specific page
 * @param {Object} options - Metadata options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.keywords - Additional keywords
 * @param {string} options.path - Page path
 * @param {string} options.image - OG image URL
 * @param {boolean} options.noindex - Whether to noindex the page
 * @returns {Object} Metadata object for Next.js
 */
export function getPageMetadata({ title, description, keywords, path, image, noindex = false }) {
  return generatePageMetadata({
    title,
    description,
    keywords,
    path,
    image,
    noindex,
  });
}

/**
 * Example usage in a page.js file:
 * 
 * export const metadata = getPageMetadata({
 *   title: 'About Us',
 *   description: 'Learn about MPCPCT...',
 *   keywords: 'about, company, team',
 *   path: '/about-us',
 * });
 */

