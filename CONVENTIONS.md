# CONVENTIONS.md

Writing conventions for implementation. Use these rules with `AGENTS.md`, `ARCHITECTURE.md`, and `MODULES.md`.

## 1. Files and names

- Keep the documented root folders and module boundaries; do not add a build system or dependency under the current defaults.
- Use lowercase kebab-case for folders, files, CSS classes, and project slugs.
- Use descriptive names based on responsibility. Avoid `utils`, `helpers`, and `misc`.
- Keep one module per folder with its stylesheet and script; the script's `render(props)` is the module's template (D6). Shared behavior belongs in a purpose-named file under `shared/`.
- Keep JavaScript files at or below 150 lines and CSS files at or below 200 lines where practical. Split a file that exceeds the soft cap by responsibility rather than hiding complexity.

## 2. JavaScript

- Use vanilla JavaScript ES modules; use `const` by default and `let` only when reassignment is needed.
- Prefer named exports and explicit imports. Do not introduce globals, hidden singletons, or cross-feature imports.
- Components and features expose `render(props) → HTMLElement`; keep props focused and pass values in rather than reading external DOM state.
- Keep functions short and single-purpose. Use an options object if a function would otherwise need more than four parameters.
- Validate external content at the loader boundary. Surface fetch, parse, and validation failures explicitly; do not silently substitute empty or success-shaped values.
- Avoid duplicated logic. Extract genuinely shared behavior to a focused `shared/` module.
- Use semantic browser APIs and native HTML behavior before adding custom interaction logic.

## 3. HTML and templates

- Use semantic landmarks and headings in a logical hierarchy, with one page-level `h1`.
- Keep document metadata and page landmarks in the document shell; keep section markup in its feature module.
- Use real links for navigation and buttons for actions. Do not add inline event-handler attributes or inline styles.
- Keep text and links in `content/` rather than hardcoding owner-editable copy into templates or scripts.
- Give meaningful images owner-supplied alternative text; decorative images use empty alt text. Set image dimensions and lazy-load below-the-fold images as described in `DESIGN.md`.

## 4. CSS

- Store colors, spacing, typography, radii, shadows, layout dimensions, and motion values in `styles/tokens.css`; use the tokens everywhere else.
- Do not hardcode repeated design values or introduce a second token source.
- Scope component and feature rules to that module's class names. Avoid selectors that depend on another module's internal markup.
- Keep selector nesting to three levels or fewer. Do not use `!important`.
- Support the documented responsive layouts and both themes. Every text/background pair must meet WCAG AA in light and dark.
- Honor `prefers-reduced-motion`; motion must not carry essential meaning.

## 5. Accessibility and resilience

- Every interactive element must be keyboard-operable and have a visible focus state.
- Give controls accessible names; do not rely on color or icon shape alone to communicate meaning.
- Preserve a logical tab order, skip link, landmarks, and heading order.
- Keep core document landmarks available in static HTML. Enhance with JavaScript where needed; do not present unavailable content as if it loaded successfully.
- External links that open a new browsing context must use safe `rel` values, including `noopener`.

## 6. Content and errors

- Follow `CONTENT.md` schemas and use `TBD` for owner facts that have not been supplied.
- Do not invent identity, biography, skills, project details, job history, or contact information.
- Treat absent optional fields as absent; do not render `"undefined"` or misleading filler.
- Error messages and diagnostics must identify the module and field/source involved. Do not broadly catch errors and then suppress them.

## 7. Verification and documentation

- Add or update the smallest relevant tests with each implementation task, following `TESTING.md`.
- A change is not complete until its module contract, `TASKS.md`, and other directly affected specs match the intended behavior.
- Do not weaken tests to make a change pass. Report a conflict between the specification and behavior.
- Before reporting a module done, run the `AGENTS.md` self-check and the relevant checks in `TESTING.md`.

## 8. Changes requiring owner input

Ask before changing visible branding, personal facts, the tech stack, or adding a dependency. Record approved changes to project defaults in the `README.md` Decision Log.
