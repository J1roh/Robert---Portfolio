# PROMPTS.md

Copy-paste prompt templates for working with AI on this project. Each one points the AI at the right docs so output stays modular. Replace `<...>` values.

## 0. Session starter (use at the beginning of every AI session)
```
You are working on a modular portfolio website. Before doing anything, read
README.md, AGENTS.md, ARCHITECTURE.md, MODULES.md, CONVENTIONS.md, CONTENT.md,
TASKS.md and GLOSSARY.md in that order. Follow AGENTS.md strictly.
Current phase: <phase from TASKS.md>.
Confirm you understand the layer rules in one short paragraph, then wait.
```

## 1. Build one module
```
Build the module "<name>" exactly as specified in MODULES.md.
Layer: <L#>. Follow CONVENTIONS.md and the file template in ARCHITECTURE.md.
Do not touch any other module. Do not hardcode content.
When done, give the report format from AGENTS.md section 8 and update MODULES.md status.
```

## 2. Add a project (content only)
```
Add a new project to the portfolio using the schema in CONTENT.md.
Facts from me: <paste notes>.
Create only content/projects/<slug>.json and update _index.json.
Use "TBD" for anything I did not provide. Do not edit any code files.
```

## 3. Add a new section/feature
```
Propose a new feature module called "<name>" for <purpose>.
First, write its MODULES.md entry (input, output, depends on, must NOT) and its
content schema for CONTENT.md. Wait for my approval before writing any code.
```

## 4. Spaghetti audit
```
Audit the repo against AGENTS.md section 5 and the dependency matrix in MODULES.md.
List every violation with file, line, rule broken, and the smallest fix.
Do not change anything yet.
```

## 5. Refactor safely
```
Refactor <file or module> to fix: <problem>.
Constraints: public API (render signature) unchanged, no new dependencies,
behavior identical. Show the plan first, then the change, then the self-check
from AGENTS.md section 6.
```

## 6. Accessibility pass
```
Review <module or page> for WCAG AA issues: semantics, keyboard, focus, contrast,
alt text, reduced motion. Output a table of issue / location / fix.
Apply only fixes that stay inside that module.
```

## 7. Doc sync
```
Compare the code in <module> with its MODULES.md entry and the schemas in CONTENT.md.
List mismatches. Do not edit code or docs until I choose which side is correct.
```

## 8. Debugging
```
Bug: <what happens> vs expected <what should happen>.
Steps: <steps>. Find the root cause first and name the module responsible.
Fix it inside that module only. If the fix needs changes elsewhere, stop and explain.
```

## 9. Design proposal
```
Using DESIGN.md, propose 3 visual directions for my portfolio (palette, type pairing,
layout feel) as token values only. Do not apply any. I will choose one.
Mood notes from me: <notes>.
```

## Prompt tips for the owner
- Name the module and the doc; vague prompts cause vague structure.
- Ask for the plan before code on anything touching more than one file.
- Paste only the facts you want used; everything else stays `TBD`.
- If an AI proposes breaking a rule, reply: "Follow AGENTS.md; propose a compliant alternative."
