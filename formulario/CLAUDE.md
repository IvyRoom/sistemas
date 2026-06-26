# CLAUDE.md — formulario

Project conventions for this folder. Follow them in every edit unless I explicitly say otherwise.

## What this project is

A single-page form (`index.html` + `style.css` + `main.js`) where a client company
submits its initial information to Machado. The **page content is Brazilian
Portuguese**; the **code (class names, ids, comments, variables) is English**.

Files:
- `index.html` — structure
- `style.css` — all styling
- `main.js` — behaviour (validation, participant cloning, same-address copy, device redirect)

## Golden rules

- **Ask before large or structural changes.** Propose the plan first; wait for my OK.
  Small, obvious fixes can be made directly.
- **One concern per change.** Don't refactor unrelated code while fixing something.
- **Never invent content.** Don't add fields, sections, or copy I didn't ask for.
- **Keep HTML, CSS, and JS in sync.** A rename in one file must be reflected in the
  others (class names, ids, the `__INDEX__` contract). Flag any mismatch you notice.
- **Preserve the visual design** (the wine/grey/green identity). Don't restyle unprompted.

## Naming

- Class/id/variable names: **English, lowercase, hyphen-separated, ASCII** (`company-cnpj`,
  `text-input`). No accents or capitals in code identifiers.
- Visible text stays Portuguese, accents intact.
- IDs are unique per page. Repeated/dynamic elements use classes, never duplicate ids.

## HTML conventions

- Semantic elements: `<main>`, `<fieldset>` + `<legend>` per section, `<label for>` paired
  with every `<input id name>`, `<button type="...">` (never a `<div>` as a control),
  `<footer>`, headings in order (one `<h1>`).
- Void elements (`<img>`, `<input>`) have no closing tag. `<img>` always has `alt`.
- Inputs: correct `type` (`email`, `tel`, `text`), `inputmode` for numeric fields,
  `autocomplete` tokens where a standard one exists, `maxlength` where the data is fixed-length.
  Truly optional fields (e.g. Complemento) have no `required`.
- 2-space indentation. No trailing whitespace.
- `<p>` and `<input>` elements stay on a **single line** each (don't wrap their attributes).
- **No blank line** between same-type sibling elements; **one blank line** between distinct
  sub-groups (e.g. between two `.field-row`s) and at section boundaries.
- Comments are **navigational signposts only** (`<!-- SECTION: ... -->`), not explanations.
  Exception: document any HTML↔JS interface as a `JS CONTRACT:` comment.

## CSS conventions

- **Use the design tokens** in `:root` (`--color-*`, `--space-*`, `--radius-*`). Never
  hard-code a hex colour or a raw pixel value that a token already covers.
- Style by **class**, not id, wherever possible. Per-field sizing uses
  `.field:has(> #the-id) { --field-width: Nch; }`.
- Field widths are set via `--field-width` (in `ch`) as a flex-basis; fields stretch to
  fill their row (`flex: 1 1 var(--field-width)`).
- Section banners (`.section-title`, `.section-description`) span edge-to-edge using
  `width: calc(100% + 2*var(--space-md))` + negative horizontal margins.
- Keep accessibility defaults: visible `:focus-visible` outlines, `prefers-reduced-motion`.
- 2-space indentation. No trailing whitespace.

## JS conventions (main.js)

- Plain vanilla JS, no framework. English names, `camelCase` for variables/functions.
- **Participant `__INDEX__` contract:** `index.html` contains a
  `<template id="participant-template">` whose ids/names/`for`/`data-participant-index`
  all use the literal token `__INDEX__`. JS clones the template per participant and
  replaces **every** `__INDEX__` with the participant number (1, 2, 3, …) before inserting
  the clone into `.participants-list`. Keep ids unique.
- **Device gate:** the page must not be used equal to or below 1024px wide. On load and on resize,
  if `window.innerWidth <= 1024`, redirect to the device-warning page.
- Prefer clear, small, well-named functions over clever one-liners.

## Out of scope / don't touch

- This folder is one project inside a larger, sensitive frontend repo. **Only edit files
  inside `formulario/`** unless I explicitly ask otherwise.
- Don't add dependencies, build tools, or frameworks without asking.
- Don't commit, push, or change git history — I handle git myself.

## Workflow with me

- Show changes as diffs and explain the *why* briefly.
- If a request conflicts with these conventions, say so and propose the convention-following
  alternative rather than silently overriding it.
- When unsure between two reasonable approaches, ask a single focused question.
