# sistemas

Static, multi-project frontend for Machado | Método Gerencial para Empresas.
The marketing-site source lives in `apps/marketing-site/`, and the other
frontends live in their own path-based source directories. GitHub Actions
generates an allowlisted `dist/` tree from those sources, and Azure Static Web
Apps publishes only that tree. There is no application-wide router; public
paths are independent from source locations and remain defined by the
deployment manifest.

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

Path spellings are part of the contract. The directory routes below are written
with a trailing slash; preserve existing working references rather than
normalizing them during unrelated work. The quote request and Conecta referral
forms normalize their slashless spellings before loading external assets while
preserving the query string and fragment.

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
| Platform device warning | [apps/learning-platform/aviso-dispositivo/index.html](apps/learning-platform/aviso-dispositivo/index.html) | [`/plataforma_v2/aviso-dispositivo/`](https://machadogestao.com/plataforma_v2/aviso-dispositivo/) |
| Platform browser warning | [apps/learning-platform/aviso-navegador/index.html](apps/learning-platform/aviso-navegador/index.html) | [`/plataforma_v2/aviso-navegador/`](https://machadogestao.com/plataforma_v2/aviso-navegador/) |
| Platform initial notices | [apps/learning-platform/avisos-iniciais/index.html](apps/learning-platform/avisos-iniciais/index.html) | [`/plataforma_v2/avisos-iniciais/`](https://machadogestao.com/plataforma_v2/avisos-iniciais/) |
| Platform registration | [apps/learning-platform/cadastro/index.html](apps/learning-platform/cadastro/index.html) | [`/plataforma_v2/cadastro/`](https://machadogestao.com/plataforma_v2/cadastro/) |
| Platform study page | [apps/learning-platform/estudo/index.html](apps/learning-platform/estudo/index.html) | [`/plataforma_v2/estudo/`](https://machadogestao.com/plataforma_v2/estudo/) |
| Platform login | [apps/learning-platform/login/index.html](apps/learning-platform/login/index.html) | [`/plataforma_v2/login/`](https://machadogestao.com/plataforma_v2/login/) |
| Platform status report | [apps/learning-platform/statusreport/index.html](apps/learning-platform/statusreport/index.html) | [`/plataforma_v2/statusreport/`](https://machadogestao.com/plataforma_v2/statusreport/) |

These are URL entry points, not statements about anonymous access. A page's
JavaScript may still apply device, browser, query-parameter, authentication, or
session checks after its static HTML loads. The deployed `landing-page/`
namespace and the `apps/learning-platform/` source directory do not contain root
`index.html` files and therefore are not independent routes. There is no
single-page-application fallback: those namespaces and unknown paths return
`404` when no entry point exists.

The authoritative current-state compatibility specification for the legacy
learning platform is
[`docs/learning-platform-contracts.md`](docs/learning-platform-contracts.md).
It records route, state, API, runtime-asset, and artifact behavior separately
from known risks and approved future changes.

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
application identities and current source locations to public `dist/` paths.
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
