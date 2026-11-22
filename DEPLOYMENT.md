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

## 9. Backend (Cloudflare Worker, free plan, never pauses)
One Worker (`wrangler.jsonc`, `worker/index.ts`) serves the site and `/api`: D1 database `portfolio` (CMS content, enquiries), KV namespace `POSTERS` (uploaded title images), Resend for the new-enquiry email. Setup steps are at the top of `wrangler.jsonc`. `.github/workflows/backup.yml` keeps 90 days of weekly encrypted D1 exports (Actions → Back up database → artifacts).

**Database lost or corrupted:**
1. `npx wrangler d1 create portfolio`, put the new id in `wrangler.jsonc`, then `npx wrangler d1 execute portfolio --remote --file worker/schema.sql`.
2. Download the latest `d1-data` artifact, `gpg -d data.sql.gpg > data.sql` (passphrase = `BACKUP_PASSPHRASE`), then `npx wrangler d1 execute portfolio --remote --file data.sql`.
3. Poster images live in KV and aren't in the export; re-upload any missing ones in the CMS.

**CMS account:** one account, email + password (D1 table `users`, one row). Change the password in CMS → Settings. The very first sign-in uses the `CMS_PASSWORD` secret with any email, which creates the account.

**Forgot the CMS password:** `npx wrangler d1 execute portfolio --remote --command "delete from users"`, then sign in with your email and `CMS_PASSWORD` (set a new one with `npx wrangler secret put CMS_PASSWORD` first if needed), and change it in Settings. To sign every browser out at once, change `SESSION_SECRET`.
