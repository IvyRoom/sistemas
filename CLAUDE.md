# CLAUDE.md — sistemas

Multi-project frontend. Deploys to an Azure Static Web App via CI/CD on `main`.

<!-- ========================================================= -->
<!-- SHARED WORKING AGREEMENT — MIRRORED WITH backend/CLAUDE.md -->
<!-- ========================================================= -->
## Working agreement — KEEP IN SYNC across repos
> This section is mirrored **verbatim** in `sistemas/CLAUDE.md` and
> `backend/CLAUDE.md`. If it changes in one, make the identical change in the
> other in the same edit. Claude can access both repos and edits both together,
> then flags each for its own commit.

### Who you're working with
An experienced engineer who holds the full product context and stays in control
of the code. Be assertive and concise — skip basics, don't pad. Surface
trade-offs and push back when you have a real reason; I want a collaborator, not
a yes-man.

### Build rhythm — default loop for new code
Scale it to the change: a one-line fix goes straight to a commit; the full loop
is for non-trivial new logic. Offer each step and **wait** — never run the whole
loop automatically.
1. **Write first, no comments.** Working code, no explanatory comments; lean on
   clear names. I test behaviour, not prose.
2. **When it works, offer to explain.** Once I confirm it behaves, ask if you
   should add temporary explanatory comments so I can walk your logic.
3. **Then offer to trim** to navigation-only signposts.
4. **Then flag the commit** and draft the message + description.

### Golden rules
- **Ask before large or structural changes.** Propose, wait for my OK. Small,
  obvious fixes: just do them.
- **One concern per change.** No unrelated refactors in passing.
- **Never invent scope.** No fields, endpoints, or copy I didn't ask for.
- **Match the surrounding code** of whichever repo/folder you're in — its
  naming, language, and structure win over your defaults. Flag mismatches
  instead of silently "fixing" them.
- **If a request conflicts with a convention, say so** and propose the
  convention-following alternative.

### Git — I drive, you assist
- **I handle all git myself** (commit, push, merge) in GitHub Desktop. Never run
  git commands or rewrite history.
- **One feature = one branch per repo**, same feature name across repos. Branch
  names `type/short-desc`, lowercase, hyphens.
- **Point out commit-worthy moments and draft the message + description.**
  Conventional Commits: `feat | fix | refactor | style | docs | chore`;
  imperative summary ≤ ~50 chars; body explains *why* when non-obvious.
- Branches are workspaces; merging to `main` deploys. Nothing's "ready" until I
  say so.

<!-- ========================================================= -->
<!-- REPO SPECIFICS — sistemas only                            -->
<!-- ========================================================= -->
## Legacy folders — don't touch
Every folder in this repo **except `formulario`** is legacy: built in an older
style, **running in production and business-critical**. Don't edit or restyle
them unless I explicitly ask; if I do, match their existing style — never impose
the conventions below. `formulario`'s only tie to a legacy folder is a redirect
into `plataforma_v2`.

## formulario — the only new-style folder
A single-page form (`index.html` + `style.css` + `main.js`) where a client
company submits its initial information to Machado. **Visible text is Brazilian
Portuguese; code identifiers are English.** Preserve the wine/grey/green visual
identity — don't restyle unprompted. Keep HTML, CSS, and JS in sync: a rename in
one file must be reflected in the others (classes, ids, the `__INDEX__`
contract); flag any mismatch you notice.

Files: `index.html` (structure) · `style.css` (all styling) · `main.js`
(behaviour: validation, participant cloning, same-address copy, device gate).

### Naming
- Identifiers (class/id/variable): English, lowercase, hyphen-separated, ASCII
  (`company-cnpj`, `text-input`); `camelCase` for JS variables/functions. No
  accents or capitals in code.
- Visible text stays Portuguese, accents intact.
- IDs unique per page; repeated/dynamic elements use classes, never duplicate ids.

### HTML
- Semantic elements: `<main>`, `<fieldset>` + `<legend>` per section,
  `<label for>` paired with every `<input id name>`, `<button type="...">`
  (never a `<div>` as a control), one `<h1>`, headings in order.
- Void elements (`<img>`, `<input>`) have no closing tag; `<img>` always has `alt`.
- Inputs: correct `type`, `inputmode` for numeric fields, `autocomplete` where a
  standard token exists, `maxlength` where fixed-length. Optional fields (e.g.
  Complemento) have no `required`.
- 2-space indent, no trailing whitespace. `<p>` and `<input>` each on one line.
- No blank line between same-type siblings; one blank line between distinct
  sub-groups (e.g. two `.field-row`s) and at section boundaries.
- Comments are navigational signposts only (`<!-- SECTION: ... -->`). Exception:
  document any HTML↔JS interface as a `JS CONTRACT:` comment.

### CSS
- **Use the `:root` design tokens** (`--color-*`, `--space-*`, `--radius-*`).
  Never hard-code a hex or a raw pixel a token already covers.
- Style by class, not id. Per-field width via
  `.field:has(> #the-id) { --field-width: Nch; }` — a `ch` flex-basis; fields
  stretch to fill their row (`flex: 1 1 var(--field-width)`).
- Section banners (`.section-title`, `.section-description`) span edge-to-edge
  via `width: calc(100% + 2*var(--space-md))` + negative horizontal margins.
- Keep accessibility defaults: `:focus-visible` outlines, `prefers-reduced-motion`.
- 2-space indent, no trailing whitespace.

### JS (main.js)
- Vanilla JS, no framework. Clear, small, well-named functions over clever
  one-liners.
- **`__INDEX__` contract:** `#participant-template` uses the literal token
  `__INDEX__` in every id/name/`for`/`data-participant-index`. JS clones it per
  participant, replacing **every** `__INDEX__` with the participant number
  (1, 2, 3, …) before inserting into `.participants-list`. Keep ids unique.
- **Device gate:** if `window.innerWidth <= 1024`, redirect to the
  device-warning page; check on load and on resize.

### Scope
- Don't add dependencies, build tools, or frameworks without asking.
