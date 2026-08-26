# AGENTS.md — sistemas

Static multi-application frontend deployed through Azure Static Web Apps.

<!-- ========================================================= -->
<!-- SHARED WORKING AGREEMENT — KEEP BYTE-IDENTICAL             -->
<!-- ========================================================= -->
## Working agreement — keep byte-identical across repositories

Keep this entire block byte-for-byte identical in both root `AGENTS.md` files.
Change it in both repositories in the same task, but commit and publish each
repository separately.

### Scope and safety
- Ask before large or structural changes; small, obvious fixes may proceed. Keep
  one concern per change, and do not invent fields, endpoints, dependencies,
  copy, or unrelated refactors. When new user-facing copy is required, match its
  surrounding language and tone and flag it for review.
- Match local naming, language, structure, and conventions. Keep reused names
  accurate for every use. Explain conflicts and propose the convention-following
  alternative instead of silently departing from local practice.
- Prefer clear code to commentary. Comment only a non-obvious reason, security
  invariant, external quirk, or contract that naming cannot express, and match
  the file's existing style.
- Never commit secrets. Use ignored configuration or environment variables, and
  stop if a requested change would expose a credential.
- Before running code, identify its effects. Do not write production data, send
  email or other messages, or exercise a side-effecting external integration
  without explicit approval. A repository-specific read-only exception never
  authorizes writes.
- Verify syntax, tests, logic, and any safe local behavior that adds useful
  signal. Stop local servers you start. Keep approvals narrow, agent-specific,
  and limited to the agreed operation; approval never expands scope or permits
  prohibited Git operations or external side effects.

### Git and publication
- The agent owns feature-branch implementation, verification, commits, normal
  push, and a ready-for-review PR; the repository owner alone merges. Never
  commit on `main`, merge, or enable auto-merge.
- Use one lowercase, hyphenated `type/short-desc` branch per feature and
  repository, with the same feature name for cross-repository work. If work
  starts on `main`, create the branch and report it.
- Commit at natural boundaries. Stage named paths, never `git add -A`. Preserve
  pre-existing user edits; when they are in scope for publication, commit them
  separately rather than folding them into agent work.
- Use Conventional Commits (`feat | fix | refactor | style | docs | chore`), an
  imperative summary of about 50 characters or less, and a body when the reason
  is not obvious. End each commit with a matching-provider `Co-Authored-By:`
  trailer after a blank line.
- Before publishing, self-review the complete diff, run relevant checks, and
  require a clean worktree. Push normally, never force-push, open a PR targeting
  `main`, cross-link any companion PR, and report purpose, verification, risk,
  and deployment effect. Use a draft only for intentionally incomplete or
  failing work.
- Before requesting merge, give one concise briefing covering why, what, how,
  verification, deployment risk, and the decision needed. Correct feedback on
  the same branch and PR with new commits; do not rewrite published history. If
  abandoned, close without merging; reserve revert PRs for changes already
  merged.
- Treat a merge to `main` as production-affecting unless the repository's
  authoritative deployment rules prove the scoped change is filtered out. A
  ready PR is complete work, not merge approval.
- After a reported merge, confirm the PR and resulting `main` CI/deployment
  succeeded before cleanup or new work. Use only safe, proportionate smoke
  checks with no production writes or messages. On failure, preserve the branch
  and context and diagnose.
- Successful post-merge cleanup is mandatory and pre-authorized for the merged
  feature branch: require a clean worktree; fetch/prune `origin`; switch to
  `main`; pull with `--ff-only`; verify local `main` equals `origin/main`;
  delete the local branch with `git branch -d`; if it still exists, delete the
  remote branch only after confirming its PR merged or closed; then verify only
  `main` and active branches remain. Stop on a dirty or diverged `main` or any
  failed prerequisite.
- Never use `git branch -D`, amend, rebase, force-push, or `reset --hard`.

<!-- ========================================================= -->
<!-- REPOSITORY-SPECIFIC GUIDANCE — sistemas                    -->
<!-- ========================================================= -->
## Sources of truth

- `README.md` is authoritative for the canonical origin, current and retired
  route history, public entry points, and downloads.
- `frontend-deployment.json` is authoritative for application identities and
  source-to-`dist/` mappings.
- `docs/learning-platform-contracts.md` is the authoritative current-state
  compatibility specification and behavior-baseline matrix for
  `apps/learning-platform/`. Preserve its stable contract descriptions across
  source moves; update snapshot-specific anchors as evidence moves.
- `docs/project-roadmap.html` is the authoritative status and scope map for the
  coordinated frontend and backend best-practices program. Update the relevant
  card when a concern starts or completes, preserve the headline, topics, then
  rationale order, and cite the card in future task handoffs instead of copying
  the roadmap.
- Automated tests are authoritative for behavior. Keep prose concise; do not
  duplicate route history or detailed behavior already enforced there.

## Maintained applications

| Source | Public route | Backend or cross-application contract |
| --- | --- | --- |
| `apps/marketing-site/` | `/` | Quote CTA: `/solicitacao-orcamento/` |
| `apps/quote-request/` | `/solicitacao-orcamento/` | `POST /landingpage/solicitacaoorcamento` |
| `apps/client-intake/` | `/formulario-informacoes-iniciais/` | `POST /clientes/processa-formulario` |
| `apps/certificate-validation/` | `/validacao-certificados/` | `GET /validacaocertificados/:Solicitante_CertificadoID` |
| `apps/referrals-management/referral-form/` | `/conecta/cadastro-recomendacoes/` | `POST /conecta/processa-recomendacao` |

All five applications are maintained. Preserve established visible copy and
visual identity unless the task changes them. `apps/learning-platform/` is the frozen,
business-critical legacy area; edit it only when explicitly requested and then
match its existing style.

## Frontend rules

- Visible copy is Brazilian Portuguese; new identifiers are English and ASCII.
  Keep HTML, CSS, and JavaScript identifiers and contracts synchronized.
- Use semantic HTML, native controls, correct labels and ARIA relationships,
  unique IDs, deliberate focus behavior, visible `:focus-visible` treatment,
  and `prefers-reduced-motion` support.
- Use document-relative URLs for application assets. Use root-relative URLs for
  public navigation and explicit cross-application contracts.
- Preserve existing routes, API payloads, copy, and styling unless scoped.
  Do not add a dependency, framework, build tool, or device gate without
  approval.
- Frontends own the Portuguese messages for backend errors they consume. The
  canonical registry is in `../backend/AGENTS.md`; `Erro_000` and
  `Erro_006` are frontend-originated.
- Certificate validation may expose only the public-safe verdict, holder name,
  score, and certificate ID—never email, CPF, address, or other private data.

### Marketing-site contract

- Keep the presentation full-width through `430px` and as a centered
  `430px` column above that boundary; do not add a wider layout or device gate.
- Keep `apps/marketing-site/main.js` as the behavior-free native-module entry
  and implementation under `apps/marketing-site/modules/`.
- Keep interactions on native buttons and links, with synchronized ARIA state,
  explicit focus destinations and restoration, visible control focus, and
  borderless programmatic heading focus. Editorial text remains selectable.
- Resolve the live reduced-motion preference for scrolling and authored motion;
  retain the established default behavior when reduced motion is not requested.
- The quote CTA targets `/solicitacao-orcamento/`. Preserve the exact tested
  article, Instagram, Shaka/player, poster, HLS, testimonial, pause/toggle, and
  media load-order and initialization contracts.
- Preserve the three PDF download destinations defined by `README.md` and
  `frontend-deployment.json`. Verify source and generated previews at
  `390px`, `430px`, `431px`, and `1440px` across representative initial,
  expanded, focus, sticky-control, CTA, testimonial, and media states.

## Preview and verification

- Preview tracked sources with `node scripts/serve-frontend.mjs`; it resolves
  public routes from `frontend-deployment.json`. Do not use a generic
  repository-root server for cross-application checks.
- Validate the generated artifact separately with `dist/` as the web root.
  Report source and generated results separately.
- Browser checks must cover viewport landing, focus, selection or copy behavior,
  reduced motion, and console output at relevant desktop and mobile widths.
  Runtime code always selects the production backend origin, including on local,
  source, generated, and pull-request preview hosts. Install production-network
  denial before application scripts execute, and use synthetic origins with
  stubbed or injected transports for request verification.
- Stop every preview or stub server when verification finishes.

Run the complete local suite:

```powershell
node --test .agents/tests/*.test.js
node --test scripts/frontend-deployment.test.mjs
node scripts/build-frontend.mjs
node scripts/check-frontend.mjs
git diff --check
```
