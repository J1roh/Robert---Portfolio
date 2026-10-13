# GLOSSARY.md

Shared vocabulary. AIs: use these terms exactly; do not substitute synonyms in code, docs, or reports.

| Term | Meaning in this project |
|---|---|
| **Module** | Any self-contained unit with one responsibility: a component, feature, shared helper, or page. |
| **Layer** | A tier in the stack (L0 Foundation → L4 Pages). Dependencies flow downward only. |
| **Foundation (L0)** | Design tokens, reset, base styles, themes. No logic. |
| **Shared (L1)** | Small logic helpers with no UI knowledge (dom, data loader, date format, theme store). |
| **Component (L2)** | Reusable UI part with no data knowledge (button, card, tag). |
| **Feature (L3)** | A page section that owns one job (hero, projects, contact). Receives data, returns DOM. |
| **Page (L4)** | Composes features in order and loads content. The only place features meet. |
| **Content** | Owner-editable data in `content/` (JSON). Never code. |
| **Token** | A CSS custom property holding a design value (`--color-accent`, `--space-4`). |
| **Render function** | `render(props) → HTMLElement`. The standard public API of components and features. |
| **Spaghetti** | Hidden coupling: cross-module reaching, shared mutable state, duplicated logic, god files. |
| **Registration** | The single line in a page composer that includes a feature. |
| **Slug** | Kebab-case unique project ID; equals the project's filename. |
| **Placeholder** | The literal string `TBD` standing in for an owner-supplied fact. |
| **Decision Log** | Table in `README.md` recording choices and their status. |
| **Owner** | The person whose portfolio this is; sole source of personal facts and brand choices. |
| **Phase** | A stage in `TASKS.md`. Work happens in phase order. |

## Words to avoid
| Avoid | Use instead | Why |
|---|---|---|
| widget, block, partial | component or feature | Ambiguous layer |
| utils, helpers, misc | a purpose-named file in `shared/` | Prevents god files |
| data (alone) | content or props | Distinguishes source from input |
| global | shared | Nothing is globally mutable |
