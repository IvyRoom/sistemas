# AGENTS.md — sistemas

Multi-project frontend. Deploys to an Azure Static Web App via CI/CD on `main`.

<!-- ========================================================= -->
<!-- SHARED WORKING AGREEMENT — MIRRORED WITH backend/AGENTS.md -->
<!-- ========================================================= -->
## Working agreement — KEEP IN SYNC across repos
> This section is mirrored **verbatim** in `sistemas/AGENTS.md` and
> `backend/AGENTS.md`. If it changes in one, make the identical change in the
> other in the same edit. The agent can access both repos and edits both
> together, then flags each for its own commit.

### Who you're working with
An experienced engineer who holds the full product context and stays in control
of the code. Be assertive and concise — skip basics, don't pad. Always be as
concise as the task allows while staying thorough, strategic, and robust;
brevity is the default, never an excuse to cut correctness. Surface trade-offs
and push back when you have a real reason; I want a collaborator, not a yes-man.

### Comments — default to none
Working code that leans on clear names; no explanatory or navigational comments.
We trade ideas, you implement, I eyeball and test, and once it's
production-ready I open the PR and merge — so the old staged "explain / trim"
passes are gone. Commits still flow continuously throughout (don't batch them).
Narrow exception: a single line is fine when it captures what a name can't — a
non-obvious *why*, a security-critical invariant, a browser/API quirk, or a
documented contract (e.g. an HTML↔JS interface). When editing a file that's
already commented (e.g. backend `app.js`), match its existing style.

### Session hygiene
A long session grows slower, costlier, and less sharp — details get buried in a
big context. At a task/repo boundary, or when the thread is clearly long, flag
that a fresh session would help and write a short handoff (state, decisions,
open threads, next steps) so the new one starts oriented.

### Golden rules
- **Ask before large or structural changes.** Propose, wait for my OK. Small,
  obvious fixes: just do them.
- **One concern per change.** No unrelated refactors in passing.
- **Never invent scope.** No fields or endpoints I didn't ask for. When a
  change genuinely requires new user-facing copy (labels, messages), write it
  to fit the surrounding tone and language, and list it in your handoff so I
  can review the wording.
- **Match the surrounding code** of whichever repo/folder you're in — its
  naming, language, and structure win over your defaults. Flag mismatches
  instead of silently "fixing" them.
- **If a request conflicts with a convention, say so** and propose the
  convention-following alternative.
- **Never commit secrets.** Keys, tokens, connection strings, passwords stay out
  of tracked files (use ignored config / env vars). If a change would add one,
  stop and flag it.
- **Verify before handoff.** Check what's mechanical — syntax, tests, logic —
  yourself. When it adds real signal, also exercise the change yourself in a
  local preview (serve the frontend, drive it in a browser). Before running
  anything, map what it touches: never exercise paths that reach production —
  Graph API, live spreadsheets, real e-mail — or anything else with side
  effects beyond this machine, without my explicit OK. I still own final
  behavioural and visual testing.

### Git — you commit, I publish
- **You make the commits** (`git add` + `git commit`) on the current feature
  branch, at natural boundaries throughout the work — don't wait for me. Stage
  deliberately (named paths, never a blanket `git add -A`) so secrets and
  untracked junk can't slip in. No need to surface intermediate commits — I
  review at the Pull Request / merge level.
- **Commit my uncommitted manual edits too.** When I've hand-edited files and
  left them uncommitted, commit them as their own commit, with a summary and
  description you infer from the diff — don't fold them into your own work.
- **I handle everything that leaves my machine or rewrites shared history**:
  Publish Branch / Push to Origin / Pull Requests / merge, all in GitHub
  Desktop. Never push, never open or merge PRs, never rewrite history (no
  amend, rebase, force-push, or `reset --hard`).
- **Stay on the feature branch; never commit to `main`.** One feature = one
  branch per repo, same feature name across repos. Branch names
  `type/short-desc`, lowercase, hyphens. Starting a new feature while on `main`
  with no branch yet: create and name it yourself — no need to ask — then tell me.
- Conventional Commits: `feat | fix | refactor | style | docs | chore`;
  imperative summary ≤ ~50 chars; body explains *why* when non-obvious. End
  every commit with a `Co-Authored-By:` trailer naming the model that wrote it
  (e.g. `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`) — a footer
  line after a blank line, never on the summary.
- Branches are workspaces; merging to `main` deploys. Nothing's "ready" until I
  say so.

<!-- ========================================================= -->
<!-- REPO SPECIFICS — sistemas only                            -->
<!-- ========================================================= -->
## Legacy folders — don't touch
Every folder in this repo **except `formulario` and `validação`** is legacy:
built in an older style, **running in production and business-critical**. Don't
edit or restyle them unless I explicitly ask; if I do, match their existing
style — never impose the conventions below. `formulario`'s only tie to a legacy
folder is a redirect into `plataforma_v2`.

## validação — new-style, full rebuild (fully editable)
Public page where an external visitor checks whether a client's certificate is
legit by its **Certificado ID#**. **Everything here is open to change** — the
current files are old-style leftovers we're free to replace wholesale. Build it
to the **same conventions as `formulario`** below (design tokens, English
identifiers / Portuguese visible text, HTML↔CSS↔JS kept in sync). Pairs with a
thin backend lookup endpoint that returns only a public-safe verdict
(valid + holder name + score), never private data (email, CPF, address).

## formulario — the only new-style folder
A single-page form (`index.html` + `style.css` + `main.js`) where a client
company submits its initial information to Machado. **Visible text is Brazilian
Portuguese; code identifiers are English.** Preserve the wine/grey/green visual
identity — don't restyle unprompted. Keep HTML, CSS, and JS in sync: a rename in
one file must be reflected in the others (classes, ids, the `__INDEX__`
contract); flag any mismatch you notice.

Files: `index.html` (structure) · `style.css` (all styling) · `main.js`
(behaviour: validation, participant cloning, same-address copy, device gate).

Tests live outside the deployed folders: `.claude/tests/main.test.js` is a
Node harness over `main.js`'s pure helpers (masks, CPF/CNPJ validators,
normalizers). Run `node .claude/tests/main.test.js` after touching `main.js`;
extend it when adding pure logic. It loads the real `main.js` with a stubbed
DOM, so tested logic is never duplicated.

Backend contract: submissions POST JSON to `/clientes/processa-formulario`;
`SUBMIT_ERROR_MESSAGES` in `main.js` mirrors the backend `Erro_XXX` codes
(registry in `backend/AGENTS.md`).

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
