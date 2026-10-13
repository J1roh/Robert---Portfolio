# MODULES.md

Module inventory and contracts. A module has one responsibility, a defined public input/output, and no hidden dependency on another module's internals.

## 1. Contract conventions

- Components and features expose `render(props) → HTMLElement`.
- Props are the module's complete input; modules do not fetch content or inspect caller state.
- A module owns and returns its DOM subtree. It may use the DOM helper from `shared/`.
- Optional data is omitted or represented as documented; do not render `"undefined"` or invent a success-shaped fallback.
- An error must be explicit and identify the module and invalid/missing field. Page composition may isolate a feature failure, but it must report it.
- CSS reads design values from `styles/tokens.css`.

## 2. Layer inventory

### L0 — Foundation

| Module / files | Responsibility | Public contract | Must not |
|---|---|---|---|
| Design tokens: `styles/tokens.css` | Define semantic color, spacing, typography, radius, shadow, layout, and motion tokens; provide light/dark values | CSS custom properties documented in `DESIGN.md` | Contain component-specific rules or duplicate values elsewhere |
| Reset: `styles/reset.css` | Normalize browser defaults | Global reset rules | Define brand values or feature layouts |
| Base: `styles/base.css` | Set document-wide typography and element defaults | Base element styles using tokens | Define feature-specific markup selectors |
| Layout: `styles/layout.css` | Define shared containers and page-level layout primitives | Reusable layout classes using tokens | Own feature appearance or content |

### L1 — Shared

| Module / files | Responsibility | Public contract | Must not |
|---|---|---|---|
| DOM: `shared/dom.js` | Small DOM construction helpers | Helpers that return elements from explicit inputs | Know feature content or store global state |
| Data loader: `shared/data-loader.js` | Fetch and validate JSON content | A validated value or an explicit error naming the source/field | Hide network, parse, or validation errors |
| Date formatter: `shared/format-date.js` | Format a supplied date for display | A formatted string from a valid date input | Read the clock, fetch data, or decide content |
| Theme store: `shared/theme-store.js` | Resolve system preference, user override, and persistence | Read/set theme through a documented interface | Own component styling or expose mutable global state |
| CMS content: `src/lib/content.ts`, `src/lib/merge-content.ts` | Load/save the CMS-editable slice (projects, hero stats, links) from the Supabase `content` table (`supabase/mitigations/01_create_content_table.sql`), falling back to bundled JSON | `loadContent() → Content`, `saveContent(Content) → error message \| null`, `mergeContent(saved, defaults)` | Throw on a missing/bad row; the site always renders from defaults |
| Session: `src/lib/use-session.ts` | Track the Supabase auth session | `useSession() → Session \| null \| undefined (loading)` | Sign in/out on its own |
| Enquiries: `src/lib/enquiries.ts`, `src/lib/enquiry-date.ts` | Send contact-page enquiries; list, file (read/status) and purge them for the CMS (`supabase/mitigations/02_create_enquiries_table.sql`, `03_enquiry_folders.sql`) | `sendEnquiry(fields) → error | null`, `loadEnquiries()` (purges messages deleted 30+ days ago), `updateEnquiry(id, patch)`, `formatEnquiryDate(iso)` | Read or change enquiries without the admin session (RLS: visitors insert unread inbox rows only) |

### L2 — Components

Each component is a separate folder under `components/`, containing a stylesheet and a script whose `render(props)` is the template, as specified in `ARCHITECTURE.md`.

| Component | Responsibility | Input / output | Must not |
|---|---|---|---|
| `button` | Present an action or navigation control | Label, destination/action semantics, variant → `HTMLElement` | Decide where the action belongs |
| `tag` | Present one short category label | Label → `HTMLElement` | Filter projects or fetch content |
| `section-heading` | Present a section title and optional intro | Heading and optional intro → `HTMLElement` | Own a page section |
| `card` | Present a generic bordered/surface container | Child content and optional variant → `HTMLElement` | Fetch or interpret project data |
| `icon` | Present an approved icon with accessible treatment | Icon identifier and decorative/label semantics → `HTMLElement` | Load remote icon libraries or add dependencies |
| `theme-toggle` | Expose the theme choice control | Current theme and change callback → `HTMLElement` | Persist separate theme state or define theme tokens |

### L3 — Features

Each feature is a separate folder under `features/`, containing a stylesheet and a script whose `render(props)` is the template.

| Feature | Responsibility | Input / output | Must not |
|---|---|---|---|
| `nav` | Render site navigation that remains pinned to the viewport top while scrolling | Navigation labels and destinations → `HTMLElement` | Decide route availability or read another feature |
| `hero` | Introduce the owner and primary action | Owner-supplied hero content → `HTMLElement` | Invent biography or branding |
| `about` | Present the owner's about content | Owner-supplied about content → `HTMLElement` | Add facts not supplied by the owner |
| `skills` | Present listed skills or categories | Content-defined skill groups → `HTMLElement` | Rank or infer skill levels |
| `projects` | Present a collection of project summaries | Validated project summaries → `HTMLElement` | Fetch project data or own project-detail routing |
| `contact` | Present approved contact methods | Owner-supplied contact options → `HTMLElement` | Send messages or add a third-party form service |
| `footer` | Present page footer content | Site identity and approved footer links → `HTMLElement` | Duplicate page navigation logic |
| `project-detail` | Present one project's full detail | One validated project → `HTMLElement` | Select a project, fetch its data, or fabricate missing details |

### L4 — Pages

| Page / files | Responsibility | Public contract | Must not |
|---|---|---|---|
| Home: `pages/home.js` | Load home content and register home features in order | Page initialization → composed home content | Implement feature internals or embed owner copy |
| CMS: `src/pages/Cms.tsx` (`#/cms`) | Signed-in editor for categories, works, stats and links; shows Login when signed out | `Cms({ content, onSaved })` | Write without a session; RLS limits writes to the admin email |
| CMS Enquiries: `src/pages/CmsEnquiries.tsx` (`#/cms/enquiries`) | Inbox / Archive / Recently deleted folders with read/unread, after the owner's design | Rendered by `Cms({ page: "enquiries" })` | Show enquiries without the admin session |
| Contact: `src/pages/Enquiry.tsx` (`#/contact`) | Enquiry form and other contact links, after the owner's design; the landing Contact CTA links here | `Enquiry({ copy, links })` | Email anyone; enquiries are only stored and read in the CMS inbox (`CmsEnquiries.tsx`) |
| Project: `pages/project.js` | Read the slug from `?slug=` (D7), load its project, register project-detail output | Page initialization → project page or explicit not-found/error state | Duplicate the detail feature or silently show another project |

## 3. Dependency matrix

Rows are consumers; columns are dependencies. A check means the dependency is permitted.

| Consumer \ dependency | L0 Foundation | L1 Shared | L2 Component | L3 Feature | L4 Page |
|---|---:|---:|---:|---:|---:|
| L0 Foundation | — | No | No | No | No |
| L1 Shared | Yes | Same layer only when necessary | No | No | No |
| L2 Component | Yes | Yes | No cross-component imports | No | No |
| L3 Feature | Yes | Yes | Yes | No cross-feature imports | No |
| L4 Page | Yes | Yes | No direct composition required | Yes | No cross-page imports |

The matrix describes module/API dependencies. Shared CSS tokens may be consumed by styles at every layer without creating a JavaScript dependency.

## 4. Adding or changing a module

1. Confirm the responsibility belongs to an existing module; do not add a second responsibility to an existing one.
2. If a new module is needed, document its purpose, layer, inputs, outputs, allowed dependencies, and exclusions here before implementation.
3. Keep the public interface small and use `render(props) → HTMLElement` for component and feature output.
4. Add or update the related content schema in `CONTENT.md` if the module consumes owner-editable content.
5. Update the page registration only when the page should include the feature.
6. Update this inventory and `TASKS.md` when the module or its status changes.

## 5. Status

Implementation follows the phase order in `TASKS.md`; its checkboxes are the status of record.

- L0 Foundation (`tokens.css`, `reset.css`, `base.css`, `layout.css`): implemented. Theme values use CSS `light-dark()`; the visitor override is `data-theme="light|dark"` on `<html>`, which `shared/theme-store.js` will set.
- L1–L4: planned.
