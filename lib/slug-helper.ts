// File: lib/slug-helper.ts

/**
 * Convert campaign title to URL-friendly slug
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');   // Remove leading/trailing hyphens
}

/**
 * Generate campaign URL path from campaign data
 * Returns: /causes/campaign-title-slug
 */
export function getCampaignPath(campaign: { id: number; title: string }): string {
  const slug = titleToSlug(campaign.title);
  return `/causes/${slug}`;
}

/**
 * Get just the slug from campaign
 */
export function getCampaignSlug(campaign: { title: string }): string {
  return titleToSlug(campaign.title);
}