Vivid Partners website (exported October 13, 2026)

WHAT'S IN HERE
  index.html                                  Homepage  (vividpartners.ca/)
  about.html, approach.html, portfolio.html,
  team.html, insights.html                    Main pages (/about, /approach, ...)
  selling-your-business-in-ontario.html,
  what-is-a-holding-company.html,
  holding-company-vs-private-equity.html,
  how-small-businesses-are-valued.html,
  succession-planning-canada.html             Insights articles (same addresses as the old site)
  privacy.html, terms.html, disclosures.html  Legal pages
  vivid-partners-logo-white.png               Spare copy of the logo. Every logo (header, footer,
                                              portfolio) is built into the pages themselves, so
                                              nothing breaks if this file is missing.
  sitemap.xml, robots.txt, llms.txt           SEO files
  vercel.json                                 Clean URLs + redirects from retired pages

HOW TO PUT IT LIVE
  1. Copy everything in this folder into the root of the website repository,
     replacing the old files with the same names.
  2. Keep these files from the old site: favicon.ico, favicon-16x16.png,
     favicon-32x32.png, apple-touch-icon.png, site.webmanifest, og-image.png,
     icon-512.png, middleware.js, package.json.
  3. Delete the old pages that no longer exist: team-mithun.html, team-abishan.html,
     team-vathusan.html, team-rathusan.html, partner-stories.html (and resources,
     careers, contact pages if present). vercel.json redirects their addresses to
     the new pages, so old links and Google results still work.
  4. If the repository already has a vercel.json, merge the "redirects" list from
     this one into it rather than overwriting other settings.

NOTES
  - middleware.js serves a text (Markdown) copy of each page from lib/content.js.
    That file still holds the old site's text, so update it to match the new pages.
  - og-image.png and the favicons still show the old logo; replace them when the
    new versions are ready.
  - Pages load the Hanken Grotesk and Instrument Serif fonts from Google Fonts.
