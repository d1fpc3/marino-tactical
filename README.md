# Marino Tactical Training | trainforthefight.com

Static marketing site for Marino Tactical Training, Inc., a Delaware firearms and concealed-carry training company (Felton, DE) led by Kirk Marino.

> This repo previously held the Dr. Drew DPT pitch site. It was hard-replaced with the Marino Tactical site on 2026-06-08. The old code is recoverable from git history before that commit.

## Stack

Static HTML, one shared `styles.css` + `app.js`, no build step, no framework. Oswald + Source Sans 3 (Google Fonts). Clean professional navy/steel/charcoal with a gold accent. Glass nav, kinetic hero, bento course grid, embedded Felton, DE location map.

## Site files

All web files live in `site/`:

| File | Purpose |
|------|---------|
| `index.html` | Home: hero, courses (bento), why-train, price band, location map, CTA |
| `ccdw.html` | Delaware CCDW permit training + cost breakdown |
| `permit-to-purchase.html` | Delaware Handgun Permit-to-Purchase training |
| `classes.html` | Full class descriptions + required equipment |
| `schedule.html` | Upcoming class dates and booking policy |
| `faq.html` | FAQs (with FAQPage schema) |
| `about.html` | About the company and instructor |
| `resources.html` | Permit applications + law references + links |
| `contact.html` | Contact info, mailto form, location map |

## Deployment

Auto-deploys to Hostinger via FTP on push to `main` (`.github/workflows/deploy-site.yml`, SamKirkland FTP-Deploy-Action), deploying the `site/` folder. Triggers only when `site/**` changes.

Required repo secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, and `FTP_SITE_SERVER_DIR` (the domain's `public_html` path). The first three are set; confirm `FTP_SITE_SERVER_DIR` points at the trainforthefight.com `public_html` before relying on the deploy.

## To finalize before launch

- Confirm `FTP_SITE_SERVER_DIR` secret = trainforthefight.com public_html path on Hostinger.
- Verify the public email address (placeholder `info@marinotactical.com`).
- Replace placeholder hero/media panels with real instructor + range photos.
- Confirm current class dates on `schedule.html`.
