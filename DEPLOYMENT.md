# DEPLOYMENT.md

How the site gets online. Host choice is Decision D3 (default: static hosting); nothing here is final until the owner picks.

## 1. Options (static, no server)
| Host | Good for | Notes |
|---|---|---|
| GitHub Pages | Simplest, free | Tied to a GitHub repo |
| Netlify | Easy previews, forms | Free tier available |
| Cloudflare Pages | Fast global CDN | Free tier available |
| Vercel | Familiar workflow | Free tier available |

Recommendation: pick whichever matches where the repo already lives. Owner decides.

## 2. Pre-deploy checklist
- [ ] All `TBD` values replaced (search the repo for `TBD`)
- [ ] `TASKS.md` Phase 6 complete
- [ ] Lighthouse targets met (see `TESTING.md`)
- [ ] Meta tags set: title, description, Open Graph image, canonical URL
- [ ] Favicon present
- [ ] `robots.txt` and `sitemap.xml` present
- [ ] 404 page exists
- [ ] Contact email or form tested

## 3. SEO basics
- Unique `<title>` and description per page (project pages use the project title and summary).
- One `h1` per page.
- Open Graph and Twitter card tags with a real image.
- Descriptive link text, no "click here".

## 4. Domain and HTTPS
- Custom domain optional: `TBD`
- HTTPS enforced by the host.
- Pick one canonical host (with or without `www`) and redirect the other.

## 5. Release flow (default)
1. Work on `feat/<name>` branch.
2. Merge to `main` when the self-check and manual checklist pass.
3. Host builds/serves `main` automatically.
4. Smoke test the live URL: home, one project, theme toggle, contact link.
5. Tag the release if useful (`v1.0.0`).

## 6. Rollback
- Revert the merge commit on `main`; the host redeploys the previous state.
- Keep the last known-good tag.

## 7. Maintenance
| Task | Frequency |
|---|---|
| Add new projects | As completed |
| Check links | Quarterly |
| Re-run Lighthouse | After significant changes |
| Review dependencies (if any) | Quarterly |
| Review `TBD`/stale copy | Twice a year |

## 8. For AIs
- Never commit secrets, tokens, or API keys.
- Do not add analytics, trackers, or third-party embeds without a Decision Log entry and owner approval.
- Do not configure hosting or domains yourself; provide steps for the owner.
