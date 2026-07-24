# sistemas

Static, multi-project frontend for Machado | Método Gerencial para Empresas.
Azure Static Web Apps publishes the repository root as one site: the main
marketing page lives at the root, and the other frontends live in path-based
directories beside it. There is no application-wide router or generated build
directory; each page is served from its tracked HTML, CSS, JavaScript, and
assets.

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
with a trailing slash; Azure currently also serves their slashless forms, so
preserve existing working references rather than normalizing them during
unrelated work. In particular, `/solicitação/` and `/confirmação/` are accented,
while `/validacao/` is not.

## Frontend structure and public routes

The following inventory is based on the repository's real `index.html` entry
points. Each listed route returned HTTP `200` when verified on 2026-07-23.

| Frontend | Repository entry point | Public route |
| --- | --- | --- |
| Main marketing site (`principal/` contains its assets) | [index.html](index.html) | [`/`](https://machadogestao.com/) |
| Quote request | [solicitação/index.html](solicita%C3%A7%C3%A3o/index.html) | [`/solicitação/`](https://machadogestao.com/solicita%C3%A7%C3%A3o/) |
| Quote-request confirmation | [confirmação/index.html](confirma%C3%A7%C3%A3o/index.html) | [`/confirmação/`](https://machadogestao.com/confirma%C3%A7%C3%A3o/) |
| Client initial-information form | [formulario/index.html](formulario/index.html) | [`/formulario/`](https://machadogestao.com/formulario/) |
| Machado Conecta referral form | [conecta/index.html](conecta/index.html) | [`/conecta/`](https://machadogestao.com/conecta/) |
| Certificate validation | [validacao/index.html](validacao/index.html) | [`/validacao/`](https://machadogestao.com/validacao/) |
| Platform device warning | [plataforma_v2/aviso-dispositivo/index.html](plataforma_v2/aviso-dispositivo/index.html) | [`/plataforma_v2/aviso-dispositivo/`](https://machadogestao.com/plataforma_v2/aviso-dispositivo/) |
| Platform browser warning | [plataforma_v2/aviso-navegador/index.html](plataforma_v2/aviso-navegador/index.html) | [`/plataforma_v2/aviso-navegador/`](https://machadogestao.com/plataforma_v2/aviso-navegador/) |
| Platform initial notices | [plataforma_v2/avisos-iniciais/index.html](plataforma_v2/avisos-iniciais/index.html) | [`/plataforma_v2/avisos-iniciais/`](https://machadogestao.com/plataforma_v2/avisos-iniciais/) |
| Platform registration | [plataforma_v2/cadastro/index.html](plataforma_v2/cadastro/index.html) | [`/plataforma_v2/cadastro/`](https://machadogestao.com/plataforma_v2/cadastro/) |
| Platform study page | [plataforma_v2/estudo/index.html](plataforma_v2/estudo/index.html) | [`/plataforma_v2/estudo/`](https://machadogestao.com/plataforma_v2/estudo/) |
| Platform login | [plataforma_v2/login/index.html](plataforma_v2/login/index.html) | [`/plataforma_v2/login/`](https://machadogestao.com/plataforma_v2/login/) |
| Platform status report | [plataforma_v2/statusreport/index.html](plataforma_v2/statusreport/index.html) | [`/plataforma_v2/statusreport/`](https://machadogestao.com/plataforma_v2/statusreport/) |

These are URL entry points, not statements about anonymous access. A page's
JavaScript may still apply device, browser, query-parameter, authentication, or
session checks after its static HTML loads. `principal/` and
`plataforma_v2/` do not contain root `index.html` files and therefore are not
independent routes. There is no single-page-application fallback: those
namespaces and unknown paths return `404` when no entry point exists.

Machado Conecta personal links add both required query parameters to the
existing route:
`/conecta/?ncr=<URL-encoded recommender name>&eb=<URL-encoded benefited company>`.
The path remains `/conecta/`; values must be URL-encoded before the link is
shared.

The main site also exposes these public downloads:

| Document | Repository file | Canonical path |
| --- | --- | --- |
| Ementa e softwares | [principal/pdf/EMENTA E SOFTWARES.pdf](principal/pdf/EMENTA%20E%20SOFTWARES.pdf) | [`/principal/pdf/EMENTA%20E%20SOFTWARES.pdf`](https://machadogestao.com/principal/pdf/EMENTA%20E%20SOFTWARES.pdf) |
| Bibliografia | [principal/pdf/BIBLIOGRAFIA.pdf](principal/pdf/BIBLIOGRAFIA.pdf) | [`/principal/pdf/BIBLIOGRAFIA.pdf`](https://machadogestao.com/principal/pdf/BIBLIOGRAFIA.pdf) |
| Cronograma | [principal/pdf/CRONOGRAMA.pdf](principal/pdf/CRONOGRAMA.pdf) | [`/principal/pdf/CRONOGRAMA.pdf`](https://machadogestao.com/principal/pdf/CRONOGRAMA.pdf) |

Other files under project directories are implementation assets rather than
independent public route contracts. The platform entries above are documented
for completeness; this inventory does not change their frozen maintenance
status.

## Relative and absolute links

- For navigation and assets within this deployment, use root-relative paths
  such as `/formulario/` and `/principal/img/LOGO_MACHADO.png`. They keep the
  same path on the canonical site and on Azure previews without coupling the
  code to a hostname.
- Use document-relative paths such as `../confirmação/` only when the target is
  intentionally expressed relative to the current project directory. Preserve
  working relative links unless a separate route change is approved.
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
deploys production from `main`. It uploads `/` as already-built static content;
there is no API directory or separate output directory.

- A non-filtered push to `main` uploads the current repository content to the
  production Static Web App.
- Markdown-only pushes are ignored, as are changes limited to `.agents/` or
  `.github/dependabot.yml`.
- Pull requests targeting `main` create or update temporary Azure preview
  deployments, except Dependabot pull requests.
- Closing or merging a non-Dependabot pull request removes its preview.

The repository has no root-level `staticwebapp.config.json`, `routes.json`, or
`CNAME`. Routes come from the directory entry points listed above; DNS, custom
domain, Azure redirect, and Static Web App settings are managed outside this
repository.
