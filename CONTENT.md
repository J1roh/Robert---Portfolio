# CONTENT.md

Where owner-editable text, project details, and links live. Content is JSON under `content/`; components, features, and page composers must not hardcode it.

> **Current React implementation (2026-10-10):** content lives in two files, imported through `src/lib/content.ts`: `content/site.json` (identity, links, login text, and all UI copy per language under `copy.ja` / `copy.en`) and `content/projects.json` (ordered project list with `ja`/`en` label, subtitle and role). `site.json` `heroArt` lists the hero slides in order: `{ "file": "<path under assets/hero>" }` for one image, or `{ "posters": [<paths>] }` for a poster wall (4 shown, extras swap in). The per-file schemas below describe the original vanilla plan.

## 1. Rules

- The owner is the source of all personal and project facts.
- Use the literal string `TBD` for any required owner-supplied value not yet provided. Do not invent facts or present placeholders as real.
- Keep one project per file under `content/projects/`. The filename without `.json` is its unique kebab-case slug.
- Keep the project listing in `content/projects/_index.json` in the order it should appear.
- JSON files contain data only: no comments, markup, executable code, or presentation styles.
- The current content-format default is JSON (Decision D2). Any change requires owner approval and a Decision Log update.

## 2. Locations

| File | Content |
|---|---|
| `content/site.json` | Site identity, page title/description, and shared navigation/footer links |
| `content/about.json` | Owner-approved hero, tagline, and about copy |
| `content/skills.json` | Owner-provided skills and optional categories |
| `content/contact.json` | Owner-approved contact methods and destinations |
| `content/projects/_index.json` | Ordered list of project slugs to display |
| `content/projects/<slug>.json` | One project's summary and detail |

Do not add the same owner-editable value to multiple files. Put shared site identity and shared navigation in `site.json`; section-specific content belongs to its section file.

## 3. Project index schema

The index is a JSON array of slugs, in display order. Each slug must have a matching project file.

```json
[
  "project-slug"
]
```

The array may be empty when the owner has no projects to publish. The project listing feature must handle an empty list with the empty state defined by its module contract; it must not add sample projects.

## 4. Project schema

### Required fields

| Field | Type | Rules |
|---|---|---|
| `slug` | string | Unique kebab-case ID; must equal the JSON filename without `.json` |
| `title` | string | Owner-provided project title; non-empty |
| `summary` | string | Concise owner-approved summary for cards and metadata; non-empty |
| `description` | string | Owner-approved detail copy; non-empty |

### Optional fields

| Field | Type | Rules |
|---|---|---|
| `role` | string | Include only when the owner supplied it |
| `date` | string | ISO `YYYY-MM` or `YYYY-MM-DD`; omit if unknown |
| `technologies` | array of strings | Owner-supplied names; may be empty |
| `image` | object | `src` (local path) and `alt` (string); omit if no approved image |
| `links` | array of objects | Each object has `label` and `url`; include only owner-approved destinations |

Example structure, with no claims about the owner's real work:

```json
{
  "slug": "project-slug",
  "title": "TBD",
  "summary": "TBD",
  "description": "TBD",
  "role": "TBD",
  "date": "YYYY-MM",
  "technologies": [],
  "image": {
    "src": "assets/projects/project-slug.webp",
    "alt": "TBD"
  },
  "links": [
    {
      "label": "TBD",
      "url": "TBD"
    }
  ]
}
```

The example shows shape only. Replace placeholders only with facts and links supplied or approved by the owner. Omit unknown optional fields rather than leaving illustrative values such as `YYYY-MM` in published data.

## 5. Other content contracts

The initial files use these simple object shapes; add a field only when a module needs it and the owner has supplied or approved its meaning.

| File | Initial fields |
|---|---|
| `site.json` | `name`, `pageTitle`, `pageDescription`, `navigation` (array of `{label, href}`), `footerLinks` (array of `{label, href}`) |
| `about.json` | `hero` (`tagline`, `intro`, `primaryAction` with `label` and `href`), `about` (`heading`, `body`) |
| `skills.json` | `groups` (array of `{name, items}`; each item is an owner-supplied string) |
| `contact.json` | `heading`, `intro`, `methods` (array of `{label, href}`) |

Use `TBD` for required personal copy and links that are not yet known. Empty arrays are valid where there are no approved entries. Do not add a contact form, analytics, or external service without an owner-approved Decision Log entry.

## 6. Validation and rendering

- `shared/data-loader.js` validates required fields and types before data reaches a page or feature.
- Reject a malformed project, filename/slug mismatch, invalid date, or index entry without a matching file with an explicit error naming the file and field.
- A missing optional field is not a validation error. Render the corresponding optional element only when its data is present.
- A valid empty projects index is not an error; the projects feature renders its documented empty state.
- Page composers load and select data; feature modules receive validated props and render only. No feature fetches JSON or reaches into another feature.

## 7. Fixtures and updates

Follow `TESTING.md`: maintain a complete project fixture, a minimal valid project fixture containing required fields only, and an invalid project fixture. Fixtures are test inputs, not portfolio content.

When adding a project, add its JSON file and update `_index.json`. When adding a content field, update this schema, the consuming module's contract in `MODULES.md`, and relevant validation/render tests in the same implementation change.
