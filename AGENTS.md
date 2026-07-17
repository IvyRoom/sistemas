# AGENTS.md — sistemas

Multi-project frontend. Deploys to an Azure Static Web App via CI/CD on `main`.

<!-- ========================================================= -->
<!-- SHARED WORKING AGREEMENT — MIRRORED WITH backend/AGENTS.md -->
<!-- ========================================================= -->
## Working agreement — KEEP IN SYNC across repos
> This section is mirrored **verbatim** in `sistemas/AGENTS.md` and
> `backend/AGENTS.md`. If it changes in one, make the identical change in the
> other in the same edit. The agent can access both repos, edit both together,
> and commit each repo separately.

### Who you're working with
Lucas Machado is an experienced founder, business/process operator, and
management specialist who is deliberately building formal software-engineering
practice. He graduated first in his mechanical-engineering class, studied at
Cornell, worked in management consulting and automotive process coordination,
and founded Machado | Método Gerencial para Empresas. He taught himself coding,
GitHub, and Azure while building the company and holds the full product and
business context.

Lucas is fluent in English and prefers technical collaboration, source names,
identifiers, and the rare necessary code comment in English; user-facing copy
remains Brazilian Portuguese. Work with him as an expert product owner and a
fast software-engineering learner:

- Lead with the outcome, then explain the smallest useful mental model.
- Define unfamiliar software terms before relying on them. Never confuse an
  unfamiliar term with limited reasoning ability.
- Recommend genuine best practice and explain the trade-offs; don't silently
  preserve an existing convention merely because it already exists.
- Break structural work into small, independently reviewable tasks and confirm
  the shared reasoning at meaningful boundaries.
- Be assertive and concise without skipping fundamentals. Surface mistakes and
  risks directly; brevity is never an excuse to cut correctness.

### Comments — default to none
Working code that leans on clear names; no explanatory or navigational comments.
We trade ideas; you implement, verify, publish the branch, and open the PR; I
review, test when useful, and merge. The old staged "explain / trim" passes are
gone. Commits still flow continuously throughout (don't batch them).
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
- **Keep names true to every use.** When reusing a token, helper, or abstraction
  for a new role, verify its name still describes all uses. Prefer one neutral,
  accurate name over a role-specific name used out of context or duplicate
  aliases for the same value.
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
  effects beyond this machine, without my explicit OK. Standing exception:
  **read-only** Graph reads of our workbooks are pre-approved — always verify
  a sheet's real schema (columns, table GUID, AUXILIAR-style lists) by reading
  it before writing endpoint code against it; writes and e-mails stay gated.
  When the task wraps, stop any local preview/stub servers you started so
  their ports (e.g. 3000) are free for my own runs. For interaction features,
  verify the human experience, not only DOM state: where the viewport lands
  after a click, what gains focus, and whether content people need to copy can
  actually be copied (through selection or a copy control, including success
  feedback and a usable failure fallback) — at desktop and mobile widths. I
  still own final behavioural and visual testing.
- **Keep permission approvals agent-specific.** When a command prompts and I
  approve it, prefer a reusable, narrowly scoped rule in the active agent's
  own permission system when supported. Never allowlist what the deny floor
  forbids (merge / rebase / amend / force-push / hard reset) or anything with
  side effects beyond this machine. A normal push of an agreed, verified
  feature branch is allowed as part of the publishing workflow below.

### Git — you publish, I merge
- **You own feature-branch implementation and publication.** Make commits
  (`git add` + `git commit`) at natural boundaries throughout the work — don't
  wait for me. Stage deliberately (named paths, never a blanket `git add -A`)
  so secrets and untracked junk can't slip in. No need to surface intermediate
  commits — I review at the Pull Request / merge level.
- **Commit my uncommitted manual edits too.** When I've hand-edited files and
  left them uncommitted, commit them as their own commit, with a summary and
  description you infer from the diff — don't fold them into your own work.
- **Before publishing, self-review the complete diff and run the relevant
  checks.** Once the agreed scope is complete and the worktree is clean, push
  the current feature branch normally (never force-push) and open a Pull
  Request targeting `main`. Summarize what changed and why, verification,
  risks or deployment impact, and any related PR in the other repo.
- **Open a ready-for-review PR when the work is complete and verified.** Use a
  draft only for intentionally incomplete work, early architectural feedback,
  or known failing checks. Never merge or enable auto-merge; I own the final
  merge decision.
- **Before merge, correct the same PR instead of reverting.** If I request
  changes, add correction commits to the same feature branch, push them, let
  checks rerun, and ask me to review the updated diff. Do not rewrite published
  history. If we abandon the approach, close the PR without merging. Reverting
  is for changes already merged to `main`, normally through a new revert PR.
- **After I merge, verify before cleanup.** Confirm the PR is merged and the
  resulting `main` CI/deployment completed successfully; perform only safe,
  proportionate smoke checks with no production writes or messages. If
  verification fails, keep the branch and task context intact and diagnose it.
- **Clean up only after successful verification.** Require a clean worktree;
  fetch/prune `origin`; switch to `main`; pull with `--ff-only`; verify local
  `main` matches `origin/main`; then delete the local branch with
  `git branch -d`. GitHub deleting the remote branch automatically at merge is
  an accepted exception; otherwise delete it manually only after successful
  verification and confirmation that its PR is merged or closed. If `main` is
  dirty or diverged, stop instead of overwriting anything. Never use
  `git branch -D`, amend, rebase, force-push, or `reset --hard`.
- **Stay on the feature branch; never commit to `main`.** One feature = one
  branch per repo, same feature name across repos. Branch names
  `type/short-desc`, lowercase, hyphens. Starting a new feature while on `main`
  with no branch yet: create and name it yourself — no need to ask — then tell me.
- Conventional Commits: `feat | fix | refactor | style | docs | chore`;
  imperative summary ≤ ~50 chars; body explains *why* when non-obvious. End
  every commit with a `Co-Authored-By:` trailer naming the agent/model that
  wrote it, using the matching provider identity — a footer line after a blank
  line, never on the summary.
- Branches are workspaces; merging to `main` deploys. A ready PR means your
  implementation is complete, not that it is approved; only I decide whether
  to merge.

<!-- ========================================================= -->
<!-- REPO SPECIFICS — sistemas only                            -->
<!-- ========================================================= -->
## Legacy folders — don't touch
Every folder in this repo **except `formulario`, `validação` and `conecta`**
is legacy: built in an older style, **running in production and
business-critical**. Don't
edit or restyle them unless I explicitly ask; if I do, match their existing
style — never impose the conventions below. `formulario`'s only tie to a legacy
folder is a redirect into `plataforma_v2`.

## Error codes (Erro_XXX)
The canonical registry lives in `backend/AGENTS.md` (moved out of the old
dictionary at the top of `plataforma_v2/login/main.js`). Frontends own the
user-facing messages for the codes they consume (`SUBMIT_ERROR_MESSAGES` in
`formulario/main.js` and `conecta/main.js`; inline strings in legacy folders).
`Erro_000` (network fallback) and `Erro_006` (FaceLivenessDetector failure)
are emitted by the frontends themselves, never by the backend.

## validação — new-style, full rebuild (fully editable)
Public page where an external visitor checks whether a client's certificate is
legit by its **Certificado ID#**. **Everything here is open to change** — the
current files are old-style leftovers we're free to replace wholesale. Build it
to the **same conventions as `formulario`** below (design tokens, English
identifiers / Portuguese visible text, HTML↔CSS↔JS kept in sync). Pairs with a
thin backend lookup endpoint that returns only a public-safe verdict
(valid + holder name + score), never private data (email, CPF, address).

## conecta — new-style (fully editable)
Public page of the Machado Conecta referral program: employees of client
companies open a personal link and submit recommendations. Built to the same
conventions as `formulario` below. Specifics:
- The personal link carries URL params `ncr` (recommender full name) and `eb`
  (benefited company); `main.js` fills the read-only fields from them — no
  fetch on load. Missing params hide the form and show the invalid-link notice.
- Accordion: exactly one section open at a time; the open section shows only
  its content (its header row is hidden). First visit opens SOBRE O PROGRAMA;
  later visits open COMO NOS RECOMENDAR (`localStorage` flag
  `conecta-returning-visitor`).
- **Responsive, no device gate** — unlike `formulario`, participants open
  their links on phones. Keep it working at mobile widths.
- Useful-link text is intentionally non-selectable. Each link has a copy-icon
  control that writes the exact URL, confirms success, and falls back to a
  manual-copy prompt when the Clipboard API is unavailable.
- Backend contract: POST `/conecta/processa-recomendacao`;
  `SUBMIT_ERROR_MESSAGES` in `main.js` mirrors the backend `Erro_XXX` codes.
- The WhatsApp field is masked to `+XX XX XXXXX-XXXX` (`maskWhatsapp` /
  `isCompleteWhatsapp` in `main.js`); the backend enforces the same pattern.
  A +55 hard-pin was tried and reverted — users instinctively typed 55 first
  and had to backspace; asking for the full number is clearer.
- Tests: run `node .agents/tests/conecta.test.js` after touching `main.js`;
  extend it when adding pure logic.

## formulario — new-style, conventions reference
A single-page form (`index.html` + `style.css` + `main.js`) where a client
company submits its initial information to Machado. **Visible text is Brazilian
Portuguese; code identifiers are English.** Preserve the wine/grey/green visual
identity — don't restyle unprompted. Keep HTML, CSS, and JS in sync: a rename in
one file must be reflected in the others (classes, ids, the `__INDEX__`
contract); flag any mismatch you notice.

Files: `index.html` (structure) · `style.css` (all styling) · `main.js`
(behaviour: validation, participant cloning, same-address copy, device gate).

Tests live in the repository support folder: `.agents/tests/formulario.test.js` is a
Node harness over `main.js`'s pure helpers (masks, CPF/CNPJ validators,
normalizers). Run `node .agents/tests/formulario.test.js` after touching `main.js`;
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
