# AGENTS.md — Instructions for AI Assistants

This file is written for AI agents (Claude, Copilot, Cursor, etc.). Read it fully before changing anything. If a rule here conflicts with a user's direct, current request, follow the user and say so; otherwise these rules win.

## 0. Mission
Build and maintain a **modular** portfolio website. The owner's top complaint is spaghetti code. Every decision should be tested against: *"Could someone change this one thing without touching anything else?"*

## 1. Read order (mandatory)
1. `README.md` — scope, decision log, open questions
2. `ARCHITECTURE.md` — where things go
3. `MODULES.md` — what each module does
4. `CONVENTIONS.md` — how to write it
5. `CONTENT.md` — if touching text, projects, or links
6. `TASKS.md` — what is done and what is next
7. `GLOSSARY.md` — exact term meanings (use these words)
8. `DESIGN.md` — before any visual or styling decision
9. `TESTING.md` — before reporting a module done
10. `DEPLOYMENT.md` — only when preparing a release
11. `PROMPTS.md` — reference only; shows how the owner will likely ask for work

Do not skip to coding.

## 2. Hard rules (never violate)
1. **One module = one responsibility.** If you must write "and" to describe it, split it.
2. **Respect layer direction.** Dependencies only flow downward (see `ARCHITECTURE.md`, Layers). Never import upward or sideways between feature modules.
3. **No hardcoded content in components.** Text, links, project data come from `content/`.
4. **No global mutable state.** No `window.something = ...`. Pass data in, return data out.
5. **No duplicated logic.** If the same code appears twice, extract it into `shared/`.
6. **No giant files.** Soft cap: 150 lines per JS file, 200 per CSS file. Past that, split.
7. **No inline styles, no inline event handlers** (`onclick="..."`).
8. **No new dependency** (library, framework, font, CDN) without recording it in the Decision Log in `README.md` and justifying it.
9. **Do not invent owner facts.** Name, bio, project details, job history, links: use placeholders (`TBD`) and flag them. Never fabricate.
10. **Do not rename or move files** documented here without updating every doc that references them.

## 3. Workflow for any change
1. State the goal in one sentence.
2. Identify which module(s) it belongs to via `MODULES.md`. If none fit, propose a new module entry *first*.
3. List the files you will create/edit. Keep the list small.
4. Make the change.
5. Run the self-check (Section 6).
6. Update docs that the change affects (`MODULES.md`, `TASKS.md`, Decision Log).
7. Report what changed, what you assumed, and what the owner must decide.

## 4. When to ask vs. proceed
**Ask the owner** when: the choice affects visible branding, personal facts, the tech stack, or adds a dependency.
**Proceed with a default** when: the choice is internal (file naming within conventions, small refactors, CSS organization). State the assumption in your report.

## 5. Spaghetti detector (red flags)
Stop and refactor if you notice any of these:
- A component reads another component's DOM or internal variables
- A file imports from more than ~5 other files
- A function takes more than ~4 parameters (use an options object)
- A function longer than ~40 lines
- CSS selectors nested more than 3 levels or using `!important`
- Same string/color/spacing value repeated in many places instead of a token
- A "utils" file that keeps growing with unrelated helpers (split by purpose)
- Comments explaining *what* confusing code does (rewrite the code instead)

## 6. Self-check before reporting done
- [ ] Each new/changed file has a single, stated purpose
- [ ] No upward or sideways feature-to-feature imports
- [ ] No content hardcoded in markup/JS
- [ ] No duplicated logic introduced
- [ ] Tokens used for colors, spacing, type (no magic numbers)
- [ ] Accessible: semantic tags, alt text, keyboard focus, contrast
- [ ] Works without JS for core content where feasible (progressive enhancement)
- [ ] Docs updated (`MODULES.md`, `TASKS.md`)
- [ ] No placeholder facts presented as real

## 7. Clarifications for AIs (common ambiguities)

**"Modular" means what here?**
Each feature (hero, projects, contact, etc.) lives in its own folder with its own markup template (written as `render(props)` in its `.js` file, see D6), styles, and script. A feature can be deleted by removing its folder and one line in the page composer, and nothing else breaks.

**"No spaghetti" means what?**
Predictable structure, one-way dependencies, no hidden coupling. It does *not* mean over-engineering. Do not add abstractions "for the future". Build the simplest thing that respects the layers.

**"Markdown only" means what?**
At this stage, deliver `.md` files only. Do **not** generate HTML/CSS/JS, config files, or scaffolding until the owner says to begin implementation. When implementation starts, follow `TASKS.md` phase order.

**Where do I put a helper used by two features?**
In `shared/`, in a file named for its purpose (e.g. `shared/dom.js`, `shared/format-date.js`), never `helpers.js` or `misc.js`.

**Where do colors, fonts, spacing live?**
Only in `styles/tokens.css` as CSS custom properties. Everything else references them.

**How do I add a new project to the portfolio?**
Add one JSON file under `content/projects/` following the schema in `CONTENT.md`. Do not edit any component. If you find you must edit a component to add a project, the architecture is being violated, so fix the architecture instead.

**How do I add a new section?**
Create a new feature module per `MODULES.md` template, register it in the page composer, add its content file. Three touch points, no more.

**What if the owner asks for something that breaks a rule?**
Do it if they insist, but explain the tradeoff once, isolate the exception in its own clearly named module, and log it in the Decision Log.

**What if docs and code disagree?**
Docs are the intended truth. Flag the mismatch, then ask which to fix. Do not silently change either.

## 8. Reporting format
End each task with:
```
Changed:   <files>
Why:       <one sentence>
Assumed:   <anything you guessed>
Needs owner: <open decisions or missing facts>
Docs updated: <files>
```

## 9. Tone and content guidance
- Write site copy in the owner's voice only after they provide samples; until then use clearly marked placeholders.
- Keep copy concise and honest. No inflated claims or buzzword filler.
