# Production Readiness Guide

This document explains how to build, containerize, and deploy the Authyntic site for production.

## 1) Build the optimized site

Requirements: Node.js 18+ and Python 3.10+ (for QA script)

```bash
npm ci
npm run build
# Copies manifest.json, robots.txt, sitemap.xml into dist/
```

The optimized site will be in `dist/`.

## 2) Quick local preview

```bash
npm run preview
```

## 3) Containerized deployment (Nginx)

Build the image and run it:

```bash
docker build -t authyntic/site:latest .
docker run --rm -p 8080:80 authyntic/site:latest
```

Open <http://localhost:8080>

The Nginx config (`nginx.conf`) includes:

- Strong security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy)
- Gzip compression
- Long-lived, immutable caching for static assets
- Short caching for HTML

## 4) GitHub Pages (optional)

A CI workflow at `.github/workflows/production.yml` builds the site, runs QA, and deploys to GitHub Pages.

To enable:

1. In repository Settings → Pages, set Source = GitHub Actions.
2. Push to `main` and the site will deploy automatically.

## 5) Backend note

The public site is fully static. The `/api/session` endpoint in `server.py` is for the representative demo only and should not be exposed on the public internet without additional hardening. For production, serve the static site via a CDN or Nginx as above. Keep the Python server for internal demo environments.

## 6) CSP and external resources

We load Google Fonts; CSP allows:

- `style-src` <https://fonts.googleapis.com> with `'unsafe-inline'` for inline critical styles
- `font-src` <https://fonts.gstatic.com>

If additional third-party resources are added, update `nginx.conf` CSP accordingly.

## 7) SEO & PWA

- `robots.txt` and `sitemap.xml` are copied into `dist/`
- `manifest.json` is included for app metadata and icons

## 8) QA checks

Before deploying, run:

```bash
python3 scripts/qa_header_links.py
```

This validates header link integrity and key meta tags.
