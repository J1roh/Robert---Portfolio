# ARCHITECTURE.md

Where each part of the portfolio lives and how its dependencies flow. This specification follows the README Decision Log (D1–D7, confirmed 2026-10-10).

## 1. Architecture rules

- Use the layers below; dependencies flow downward only.
- A module owns one responsibility and exposes a small public interface.
- Pages are the only place feature modules meet.
- Content lives in `content/`, not in markup templates, styles, or JavaScript.
- Keep the site static: plain HTML, CSS, and vanilla JavaScript ES modules, with no build step or server requirement.
- Use relative paths suitable for static hosting. Do not assume a particular host's routing behavior until D3 is confirmed.

## 2. Layers

| Layer | Name | Owns | May depend on |
|---|---|---|---|
| L0 | Foundation | Tokens, reset, base/layout styles, theme token values | Browser platform |
| L1 | Shared | DOM, data loading/validation, date formatting, theme persistence | Browser platform and L0 contracts |
| L2 | Component | Reusable UI parts without feature or content knowledge | L1 and L0 |
| L3 | Feature | One page section or project-detail responsibility | L2, L1, and L0 |
| L4 | Page | Loads page data and composes features in order | L3, L1, and L0 |

CSS in every layer uses L0 tokens. A lower layer must not import from a higher layer. Feature modules must not import from other feature modules; share reusable behavior through an appropriate L1 or L2 module instead.

## 3. Repository layout

Paths below describe the implementation layout. `TASKS.md` shows which parts exist so far.

```text
/
├── index.html                  # Home document shell and accessible landmarks
├── styles/
│   ├── tokens.css              # Sole source of design values and theme values
│   ├── reset.css
│   ├── base.css
│   └── layout.css
├── shared/
│   ├── dom.js
│   ├── data-loader.js
│   ├── format-date.js
│   └── theme-store.js
├── components/
│   └── <component>/
│       ├── <component>.css
│       └── <component>.js
├── features/
│   └── <feature>/
│       ├── <feature>.css
│       └── <feature>.js
├── pages/
│   ├── home.js
│   └── project.js
├── projects/
│   └── project.html            # Project-detail document shell
├── assets/
│   └── projects/                # Owner-supplied project media
├── content/
│   ├── site.json
│   ├── about.json
│   ├── skills.json
│   ├── contact.json
│   └── projects/
│       ├── _index.json
│       └── <slug>.json
└── tests/
    └── fixtures/
```

Each component and feature folder contains its own styles and script; the markup template is the `render(props)` function in that script (D6). The page shell supplies document-level metadata and landmarks; the page composer assembles feature output into those landmarks. Keep global styles and values in `styles/`, and keep project-specific content in `content/projects/`.

## 4. Data and render flow

1. The browser loads a document shell (`index.html` or `projects/project.html`) and its page entry point.
2. The page entry point requests the relevant JSON using `shared/data-loader.js`. The loader validates data against `CONTENT.md` and reports missing or invalid content as an explicit error.
3. The page composer passes only the required content as props to each feature's public render function.
4. A component or feature renders its own output and returns an `HTMLElement`; it does not query another module's DOM or reach into another module's state.
5. The page composer registers feature output in page order. A feature failure must be reported and must not silently become plausible but incomplete content.
6. Theme preference is handled through the shared theme store and L0 theme tokens; modules do not create independent theme state.

Core document landmarks and the skip link belong in the static HTML shell. Use progressive enhancement where practical; JSON-backed sections require JavaScript under the current static-site default.

## 5. Resolved implementation decisions

- **Module template loading (D6):** Markup is written inside each module's synchronous `render(props) → HTMLElement` in its `.js` file, built with `shared/dom.js` (or a `<template>` element created in that file). No separate `.html` fragment, no fetch, no build step. Content still comes only from props.
- **Project URL mapping (D7):** Project pages use `projects/project.html?slug=<slug>`. `pages/project.js` reads the slug with `URLSearchParams`, loads `content/projects/<slug>.json`, and shows an explicit not-found state for a missing or unknown slug. Works on any static host without rewrite rules.

## 6. Page composition

- `pages/home.js` is the home page's composition root.
- `pages/project.js` is the project-detail page's composition root.
- A composition root is the only layer that registers multiple features.
- Adding a section means adding one feature module, its content definition, and one registration in the relevant page composer.
- Project detail pages use the `project-detail` feature and a project selected by its slug. Do not make a feature responsible for routing or fetching unrelated content.

## 7. Boundaries and change safety

- A module communicates through its documented inputs and outputs in `MODULES.md`.
- Do not read another module's internal variables, DOM, or files except through its documented public interface.
- Do not add global mutable state. Pass values in and return values out.
- Shared modules are for behavior genuinely used across modules, not a general-purpose dumping ground.
- If a desired dependency would point upward or sideways, move the shared responsibility down to the correct layer or keep composition in the page.

## 8. Related specifications

- Module contracts and dependency matrix: `MODULES.md`
- File, naming, CSS, JavaScript, and accessibility rules: `CONVENTIONS.md`
- Content locations and schemas: `CONTENT.md`
- Work order: `TASKS.md`
