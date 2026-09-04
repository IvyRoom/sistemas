# sistemas

Static, multi-project frontend for Machado | Método Gerencial para Empresas.
The marketing-site source lives in `apps/marketing-site/`, and the other
frontends live in their own path-based source directories. GitHub Actions
generates an allowlisted `dist/` tree from those sources, and Azure Static Web
Apps publishes only that tree. There is no application-wide router; public
paths are independent from source locations and remain defined by the
deployment manifest. Shared runtime infrastructure lives in `apps/shared/` and
is mapped separately from maintained application identities.

## URL contract

The canonical public origin is [https://machadogestao.com](https://machadogestao.com/).
Use this HTTPS, non-`www` origin for every customer-facing or externally
consumed production URL.

The current Azure production hostname is
`https://red-cliff-0b4173b0f.5.azurestaticapps.net`. It is an operational
deployment address, not a public URL contract. Azure-generated production and
pull-request hostnames are for deployment, preview, and diagnostics; they must
not be used in customer links, bookmarks, QR codes, SEO metadata, or
integrations. The current production hostname redirects to the canonical
origin while preserving the path and query string, but that behavior does not
make the Azure hostname canonical.

Path spellings are part of the contract. The page and download paths inventoried
below are the canonical destinations; use those exact spellings in links,
bookmarks, QR codes, metadata, and integrations. Production accepts the current
page entries' slashless compatibility spellings only as described below. That
behavior does not authorize aliases for retired or unknown paths.

## Frontend structure and public routes

The following inventory is based on the repository's real `index.html` entry
points. The deployment contract requires every listed route to return HTTP
`200` without redirect.

| Frontend | Repository entry point | Public route |
| --- | --- | --- |
| Main marketing site (`landing-page/` contains its deployed assets) | [apps/marketing-site/index.html](apps/marketing-site/index.html) | [`/`](https://machadogestao.com/) |
| Quote request | [apps/quote-request/index.html](apps/quote-request/index.html) | [`/solicitacao-orcamento/`](https://machadogestao.com/solicitacao-orcamento/) |
| Client initial-information form | [apps/client-intake/index.html](apps/client-intake/index.html) | [`/formulario-informacoes-iniciais/`](https://machadogestao.com/formulario-informacoes-iniciais/) |
| Machado Conecta referral form | [apps/referrals-management/referral-form/index.html](apps/referrals-management/referral-form/index.html) | [`/conecta/cadastro-recomendacoes/`](https://machadogestao.com/conecta/cadastro-recomendacoes/) |
| Certificate validation | [apps/certificate-validation/index.html](apps/certificate-validation/index.html) | [`/validacao-certificados/`](https://machadogestao.com/validacao-certificados/) |
| Platform viewport warning | [apps/learning-platform/viewport-warning/index.html](apps/learning-platform/viewport-warning/index.html) | [`/plataforma/aviso-viewport/`](https://machadogestao.com/plataforma/aviso-viewport/) |
| Platform device/browser warning | [apps/learning-platform/device-browser-warning/index.html](apps/learning-platform/device-browser-warning/index.html) | [`/plataforma/aviso-dispositivo-navegador/`](https://machadogestao.com/plataforma/aviso-dispositivo-navegador/) |
| Platform initial notices | [apps/learning-platform/initial-notices/index.html](apps/learning-platform/initial-notices/index.html) | [`/plataforma/avisos-iniciais/`](https://machadogestao.com/plataforma/avisos-iniciais/) |
| Platform photo registration | [apps/learning-platform/photo-registration/index.html](apps/learning-platform/photo-registration/index.html) | [`/plataforma/cadastro-foto/`](https://machadogestao.com/plataforma/cadastro-foto/) |
| Platform course content | [apps/learning-platform/course-content/index.html](apps/learning-platform/course-content/index.html) | [`/plataforma/estudo/`](https://machadogestao.com/plataforma/estudo/) |
| Platform login | [apps/learning-platform/login/index.html](apps/learning-platform/login/index.html) | [`/plataforma/login/`](https://machadogestao.com/plataforma/login/) |
| Platform status report | [apps/learning-platform/status-report/index.html](apps/learning-platform/status-report/index.html) | [`/plataforma/statusreport/`](https://machadogestao.com/plataforma/statusreport/) |

The device/browser warning's exact visible message is "Acesse a plataforma em
um computador com Windows, usando o Microsoft Edge." The viewport warning's
exact visible message is "Maximize a janela do navegador ou use uma tela maior
para continuar."

### Canonical navigation behavior

The marketing entry is canonical at `/`; each of the other eleven page entries
is canonical at its exact trailing-slash path in the table. Direct entry and
refresh at a canonical URL return HTTP `200` without redirect and rerun that
page's normal boot and any entry-specific minimum-viewport, browser, query,
authentication, or session logic.
The query string remains part of the URL and may be application input. A
fragment remains browser-only and does not create hash-routing behavior.

Production also serves the slashless counterpart of each current directory
entry with HTTP `200`, no `Location` header, and the same entry bytes. Browser
handling then differs by application group:

| Entry group | Browser-visible slashless behavior | Browser-history effect |
| --- | --- | --- |
| Quote request, client intake, Conecta referral, and certificate validation | A parser-blocking inline script calls `location.replace` to change only the current slashless path to its trailing-slash canonical path and preserve the exact query string and fragment. | The correction replaces the current entry, so Back skips the slashless spelling and returns to the preceding document. Refresh and Forward retain the canonical URL. |
| Seven learning-platform entries | There is no route normalizer. The slashless path, query string, and fragment remain visible and survive refresh when existing page-lifecycle logic does not navigate away. | The route layer adds no normalization entry. Admission transitions to either warning use `location.replace`, and validated viewport-warning recovery also replaces the warning. Ordinary login, registration, study, logout, and content navigation still use `window.location.href` and add one document-history entry. |

Slashless spellings are compatibility inputs, not authoring destinations; new
or updated links must use the canonical paths. This compatibility applies only
to the eleven current non-root directory entries. It does not make explicit
`index.html` spellings public contracts, create an SPA fallback, or alter any
of the 64 explicit `404` paths. The three downloads use their exact file paths
and are not subject to directory-slash normalization.

These are URL entry points, not statements about anonymous access. A page's
JavaScript may still apply minimum-viewport, browser, query-parameter,
authentication, or session checks after its static HTML loads. Login, initial
notices, photo registration, and study first apply the combined device/browser
rule: only qualifying Windows/Microsoft Edge candidates proceed, while rejected
and unverified profiles replace the current entry with the slashless
`/plataforma/aviso-dispositivo-navegador` warning. Qualifying profiles then
apply the inclusive minimum-viewport rule. At `window.innerWidth <= 1024`, those
four entries and the public, browser-ungated status report replace the current
entry with slashless `/plataforma/aviso-viewport`; the public, browser-ungated
client-intake form uses the trailing-slash `/plataforma/aviso-viewport/`
destination. The deployed `landing-page/`
namespace and the `apps/learning-platform/` source directory do not contain root
`index.html` files and therefore are not independent routes. There is no
single-page-application fallback: those namespaces and unknown paths return
`404` when no entry point exists.

Every minimum-viewport transition supplies one percent-encoded `returnTo`
value limited to 2,048 encoded characters and containing the originating path,
query string, and fragment.
Only relative same-origin targets whose normalized path is login, initial
notices, photo registration, study, status report, or client intake are
accepted; each accepted slashless or trailing-slash spelling is preserved.
Absolute, protocol-relative, cross-origin, malformed, traversal, oversized,
`javascript:` scheme, credential-bearing, and otherwise unapproved targets are
rejected. The viewport warning evaluates the strict recovery boundary on
initial execution and resize: it remains at widths through `1024`, and above
`1024` it replaces itself with the validated origin at most once. Missing or
invalid origins, including a direct wide warning visit, replace to canonical
`/plataforma/login/`; a direct narrow visit renders the warning normally.

The learning-platform namespace intentionally has no root entry:
`/plataforma/` returns `404` without redirect. The former `/plataforma_v2/`
root and all seven former entries are retired without redirects:
`/plataforma_v2/aviso-dispositivo/`,
`/plataforma_v2/aviso-navegador/`,
`/plataforma_v2/avisos-iniciais/`, `/plataforma_v2/cadastro/`,
`/plataforma_v2/estudo/`, `/plataforma_v2/login/`, and
`/plataforma_v2/statusreport/`. The backend API and remote-media namespaces
that retain `plataforma_v2` are separate contracts, not frontend routes.

The photo-registration entry is now canonical at
`/plataforma/cadastro-foto/`. Its former current-namespace forms
`/plataforma/cadastro`, `/plataforma/cadastro/`, and
`/plataforma/cadastro/index.html` are retired as `404` responses without
aliases or redirects. This retirement is independent of the older
`/plataforma_v2/cadastro/` frontend route above and the unchanged
`/plataforma_v2/CadastroFoto_e_FaceID` backend API.

The current warning routes were renamed without compatibility aliases. All
forms `/plataforma/aviso-navegador`, `/plataforma/aviso-navegador/`,
`/plataforma/aviso-navegador/index.html`, `/plataforma/aviso-dispositivo`,
`/plataforma/aviso-dispositivo/`, and
`/plataforma/aviso-dispositivo/index.html` return `404` without a `Location`
header. Their former asset subtrees are not emitted. This is independent of the
unchanged historical `/plataforma_v2/aviso-dispositivo/` and
`/plataforma_v2/aviso-navegador/` retirements above.

The authoritative current-state compatibility specification for the legacy
learning platform is
[`docs/learning-platform-contracts.md`](docs/learning-platform-contracts.md).
It records route, state, API, runtime-asset, and artifact behavior separately
from known risks and approved future changes.

Learning-platform access remains intentionally lean. Excel `PRAZO ACESSO`
drives the calculated `STATUS LOGIN`; only exact `Ativo` permits login to
return the signed four-hour `IndexVerificado` handle used by Registration and
Study requests. Explicit logout and timer expiry remove this tab's stored
handle and make Study locally final without a backend logout request or
cross-tab synchronization. A previously copied handle can remain technically
usable until its original expiry.

Machado Conecta personal links add both required query parameters to the
referral-form route:
`/conecta/cadastro-recomendacoes/?ncr=<URL-encoded recommender name>&eb=<URL-encoded benefited company>`.
Values must be URL-encoded before the link is shared. `/conecta/` is reserved
for a future program hub and does not currently resolve to a page.

Quote request links use `/solicitacao-orcamento/`. The slashless spelling
normalizes before external assets load while preserving its query string and
fragment. A successful submission stays on the same page and replaces the form
with its confirmation message. The former `/solicitação`, `/solicitação/`,
`/solicitação/index.html`, `/confirmação`, `/confirmação/`, and
`/confirmação/index.html` routes are retired without redirects.

Client intake links use `/formulario-informacoes-iniciais/`. The slashless
spelling normalizes before external assets load while preserving its query
string and fragment. The former `/formulario`, `/formulario/`, and
`/formulario/index.html` routes are retired without redirects.

Certificate links use `/validacao-certificados/`. The slashless spelling
normalizes before external assets load while preserving its query string and
fragment. The former `/validacao` route and its directory variants are retired
without redirects.

The main site also exposes these public downloads:

| Document | Repository file | Canonical path |
| --- | --- | --- |
| Ementa e softwares | [apps/marketing-site/pdf/EMENTA E SOFTWARES.pdf](apps/marketing-site/pdf/EMENTA%20E%20SOFTWARES.pdf) | [`/landing-page/pdf/EMENTA%20E%20SOFTWARES.pdf`](https://machadogestao.com/landing-page/pdf/EMENTA%20E%20SOFTWARES.pdf) |
| Bibliografia | [apps/marketing-site/pdf/BIBLIOGRAFIA.pdf](apps/marketing-site/pdf/BIBLIOGRAFIA.pdf) | [`/landing-page/pdf/BIBLIOGRAFIA.pdf`](https://machadogestao.com/landing-page/pdf/BIBLIOGRAFIA.pdf) |
| Cronograma | [apps/marketing-site/pdf/CRONOGRAMA.pdf](apps/marketing-site/pdf/CRONOGRAMA.pdf) | [`/landing-page/pdf/CRONOGRAMA.pdf`](https://machadogestao.com/landing-page/pdf/CRONOGRAMA.pdf) |

The former `/principal/...` asset and download paths are retired without
redirects.

Other files under project directories are implementation assets rather than
independent public route contracts. The platform entries above are documented
for completeness; this inventory does not change their frozen maintenance
status.

## Relative and absolute links

- Use root-relative paths such as `/formulario-informacoes-iniciais/` for public
  navigation and cross-application route contracts. They keep the same public
  path on the canonical site and on Azure previews without coupling the code to
  a hostname.
- Use document-relative paths such as `./style.css` and `./img/LOGO.png` for
  assets packaged with an application. This keeps source previews working when
  repository paths and public deployment paths differ.
- Preserve working links unless a separate route change is approved.
- Use canonical absolute URLs beginning with `https://machadogestao.com` when a
  URL will be copied, shared, indexed, embedded outside this deployment, or
  consumed by an external system.
- Never use an `*.azurestaticapps.net` hostname as a customer-facing absolute
  URL. Preview hostnames are temporary, and the production hostname is
  infrastructure rather than product identity.

This README follows the same rule: repository source links are relative to the
README, while live-site links are canonical absolute URLs.

## Deployment

The [Azure Static Web Apps workflow](.github/workflows/azure-static-web-apps-red-cliff-0b4173b0f.yml)
deploys production from `main`. The machine-readable
[frontend deployment manifest](frontend-deployment.json) maps stable
application identities plus shared runtime infrastructure from current source
locations to public `dist/` paths.
The dependency-free scripts in [`scripts/`](scripts/) recreate only the ignored
repository-local `dist/` directory, copy mapped tracked files, and validate the
route contract, references, file set, bytes, repeatability, and expected `404`
responses.

The repository-wide [line-ending contract](.gitattributes) keeps tracked text
at LF and explicitly classifies binary assets. Because artifact generation
copies mapped bytes unchanged, fresh Windows and Ubuntu checkouts produce the
same `dist/` file set, byte count, and whole-tree SHA-256 digest.

- To preview source, run `node scripts/serve-frontend.mjs` from the repository
  root and open `http://127.0.0.1:4173/` or another documented public route.
  The server validates `frontend-deployment.json`, maps public routes and their
  document-relative assets back to tracked sources, and also preserves direct
  mapped source paths such as `/apps/marketing-site/index.html`. It rejects
  repository-only and unknown paths. Stop it with `Ctrl+C`.
- To preview the deployment artifact, serve `dist/` as the web root and open
  the public route. Opening `/dist/...` through a repository-root server does
  not reproduce Azure's web-root behavior.
- A non-filtered push to `main` builds and validates `dist/`, retains that exact
  tree as a GitHub Actions artifact, and deploys the same tree with Azure-side
  application building disabled.
- Markdown-only pushes are ignored, as are changes limited to `.agents/` or
  `.github/dependabot.yml`.
- Pull requests targeting `main` create or update temporary Azure preview
  deployments, except Dependabot pull requests, and validate every documented
  page and download against the preview.
- Closing or merging a non-Dependabot pull request removes its preview.
- Repository-only material such as `AGENTS.md`, `README.md`, `.agents/`,
  `.github/`, `.git/`, the manifest, and the build scripts is not emitted to
  `dist/` and is not published.

The repository has no root-level `staticwebapp.config.json`, `routes.json`, or
`CNAME`. Routes come from the directory entry points listed above; DNS, custom
domain, Azure redirect, and Static Web App settings are managed outside this
repository.

Actions hardening, reviewed action pins, separate Node/runtime layers, lifecycle
dates, and the maintenance review policy are recorded in
[Actions and Node lifecycle](docs/actions-node-lifecycle.md).
