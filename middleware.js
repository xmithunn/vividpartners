// Routing Middleware for vividpartners.ca
//
// Responsibilities (see /README-agent-readiness.md for the full writeup):
//
//   1. Accept: text/markdown content negotiation on every canonical page URL,
//      per the acceptmarkdown.com convention (RFC 9110 media-range
//      negotiation over the Accept header, same URL, Vary: Accept).
//   2. Vary: Accept, Accept-Encoding on every negotiated response so CDNs
//      and browser caches never mix up the HTML and Markdown variants.
//   3. A real HTTP 404 with a short Markdown/HTML recovery body (links to
//      the sitemap, llms.txt, and top pages) for any unmatched clean-URL
//      path, also content-negotiated.
//
// This file intentionally avoids any Node-only APIs so it can run on the
// Edge runtime (the Vercel default for Routing Middleware / middleware.js).

import { next } from '@vercel/functions';
import { PAGES } from './lib/content.js';
import { NOT_FOUND_MARKDOWN } from './lib/not-found.js';

// Skip anything that looks like a static asset (has a file extension):
// images, fonts, robots.txt, sitemap.xml, llms.txt, site.webmanifest, etc.
// Those are served as-is and never need Markdown negotiation. Everything
// else (clean-URL pages, plus any path that doesn't map to a real page) is
// handled below.
export const config = {
  matcher: ['/((?!.*\\.[a-zA-Z0-9]+$).*)'],
};

/**
 * Parse an HTTP Accept header into a list of { type, subtype, q } entries,
 * in header order. Entries with q=0 (explicitly rejected) are dropped.
 */
function parseAccept(header) {
  if (!header || !header.trim()) {
    return [{ type: '*', subtype: '*', q: 1 }];
  }
  const entries = [];
  for (const part of header.split(',')) {
    const pieces = part.trim().split(';').map((s) => s.trim());
    const mediaType = pieces[0];
    if (!mediaType) continue;
    const [rawType, rawSubtype] = mediaType.split('/');
    if (!rawType) continue;
    let q = 1;
    for (let i = 1; i < pieces.length; i++) {
      const [key, value] = pieces[i].split('=').map((s) => s.trim());
      if (key === 'q') {
        const parsed = parseFloat(value);
        q = Number.isNaN(parsed) ? 1 : parsed;
      }
    }
    if (q <= 0) continue;
    entries.push({
      type: rawType.toLowerCase(),
      subtype: (rawSubtype || '*').toLowerCase(),
      q,
    });
  }
  return entries;
}

/**
 * Find the best-matching entry for an exact (type, subtype) pair.
 * Specificity: 2 = exact match, 1 = type-level wildcard match (e.g.
 * "text/star"), 0 = full wildcard ("star/star") match. Returns
 * { q, spec, index } for the best match, or null if nothing (not even a
 * full wildcard) matches.
 */
function qualityFor(entries, type, subtype) {
  let best = null;
  entries.forEach((entry, index) => {
    let spec = -1;
    if (entry.type === type && entry.subtype === subtype) spec = 2;
    else if (entry.type === type && entry.subtype === '*') spec = 1;
    else if (entry.type === '*' && entry.subtype === '*') spec = 0;
    if (spec === -1) return;
    if (
      !best ||
      entry.q > best.q ||
      (entry.q === best.q && spec > best.spec)
    ) {
      best = { q: entry.q, spec, index };
    }
  });
  return best;
}

/**
 * Decide whether to serve 'markdown', 'html', or 'none' (406) for a given
 * Accept header. Markdown is only ever chosen when the client explicitly
 * names text/markdown (or a type-level wildcard) - a bare full wildcard or
 * an absent Accept header always resolves to 'html', matching normal
 * browser/curl expectations.
 */
function negotiate(acceptHeader) {
  const entries = parseAccept(acceptHeader);
  const html = qualityFor(entries, 'text', 'html');
  const markdown = qualityFor(entries, 'text', 'markdown');
  const markdownExplicit = markdown && markdown.spec >= 1;

  if (!markdownExplicit) {
    if (html) return 'html';
    return markdown ? 'markdown' : 'none';
  }
  if (!html) return 'markdown';
  if (markdown.q !== html.q) return markdown.q > html.q ? 'markdown' : 'html';
  return markdown.index <= html.index ? 'markdown' : 'html';
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
}

export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = normalizePath(url.pathname);
  const decision = negotiate(request.headers.get('accept'));

  if (decision === 'none') {
    return Response.json(
      { error: 'Not Acceptable', available: ['text/html', 'text/markdown'] },
      {
        status: 406,
        headers: { vary: 'Accept, Accept-Encoding' },
      },
    );
  }

  const page = PAGES[pathname];

  if (!page) {
    // Unknown clean-URL path. Any file-extension path was already excluded
    // by the matcher, so this is a genuine 404, not a missing asset.
    if (decision === 'markdown') {
      return new Response(NOT_FOUND_MARKDOWN, {
        status: 404,
        headers: {
          'content-type': 'text/markdown; charset=utf-8',
          vary: 'Accept, Accept-Encoding',
        },
      });
    }
    // Let the platform continue to its normal static routing, which
    // resolves to /404.html (a real HTTP 404) for any unmatched path.
    return next({ headers: { vary: 'Accept, Accept-Encoding' } });
  }

  if (decision === 'markdown') {
    return new Response(page.markdown, {
      status: 200,
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        vary: 'Accept, Accept-Encoding',
        'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  // decision === 'html': continue to the static HTML file, tagging the
  // response so shared caches keep the HTML and Markdown variants separate.
  return next({ headers: { vary: 'Accept, Accept-Encoding' } });
}
