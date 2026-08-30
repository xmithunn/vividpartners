// Shared "page not found" content for the negotiated 404 response.
//
// This is used by middleware.js for any unmatched clean-URL path (real
// HTTP 404, negotiated between Markdown and HTML per the Accept header).
// The Markdown body mirrors /404.html's link list so a human landing on
// the branded error page and an agent requesting Accept: text/markdown
// get the same recovery options.

export const NOT_FOUND_LINKS = [
  { href: 'https://www.vividpartners.ca/sitemap.xml', label: 'Sitemap' },
  { href: 'https://www.vividpartners.ca/llms.txt', label: 'llms.txt (guide for AI agents)' },
  { href: 'https://www.vividpartners.ca/', label: 'Home' },
  { href: 'https://www.vividpartners.ca/team', label: 'Team' },
  { href: 'https://www.vividpartners.ca/portfolio', label: 'Portfolio' },
  { href: 'https://www.vividpartners.ca/resources', label: 'Resources' },
  { href: 'https://www.vividpartners.ca/contact', label: 'Contact' },
  ];

export const NOT_FOUND_MARKDOWN = `---
title: 404 - Page Not Found
url: https://www.vividpartners.ca/404
---

# 404 - Page Not Found

The page you requested doesn't exist at this URL. It may have moved or the
link may be out of date.

## Where to look next

${NOT_FOUND_LINKS.map((l) => `- [${l.label}](${l.href})`).join('\n')}

Every current URL on this site is listed in the sitemap above. For a
structured, agent-oriented summary of Vivid Partners, see llms.txt.
`;
