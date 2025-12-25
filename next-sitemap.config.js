/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: "https://www.dwaparyug.org", // 👈 Always use your canonical domain
    generateRobotsTxt: true,              // Creates robots.txt
    sitemapSize: 5000,                     // Split if too many URLs
    changefreq: "daily",                   // SEO hint
    priority: 0.7,                         // Default priority
    exclude: ["/server-sitemap.xml"],      // If you use dynamic sitemap
    robotsTxtOptions: {
        policies: [
            { userAgent: "*", allow: "/" },
        ],
        additionalSitemaps: [
            "https://www.dwaparyug.org/sitemap.xml",
        ],
    },
};
