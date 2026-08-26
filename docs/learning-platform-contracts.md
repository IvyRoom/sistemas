# Learning-platform compatibility contracts

Status: authoritative current-state compatibility specification. Its frozen
behavior baseline was characterized from `sistemas` commit
`c68f361de054a936b7a6871d82d75a1cdb457c97`; source-layout, public-route, and
artifact sections are maintained against the current repository tree. Companion
`backend` evidence remains pinned at the verified named-producer merge
`65761539b1fc998e66be383248269270ff2c90a9`. This document does not authorize
application modernization, a production request, data migration, or an
integration exercise.

## How to use this specification

The stable descriptions and acceptance IDs in this document are the contracts
to preserve across route adoption and later modernization. Links under
**Current source anchors** identify where the behavior happens in the current
tree; they are evidence, not future directory requirements. When sources move,
update those anchors without silently changing the stable description.

Evidence was reconciled in this order:

1. `frontend-deployment.json`, tracked source bytes, and executable tests;
2. the companion backend's characterized API contracts, route implementation,
   authorization implementation, and tests;
3. source comments only when they agree with executable behavior.

When those sources disagree, executable behavior wins and the disagreement is
recorded under **Known risks and unresolved legacy behavior**. No production
configuration or external integration was exercised. In particular, this
characterization did not call the backend, Microsoft Graph or workbooks, Azure
Face, the media store, EZDRM, email, or any customer-facing route.

The document keeps five categories separate:

- **Source-observed current behavior** is the compatibility baseline.
- **Known risks and unresolved legacy behavior** must be preserved by a pure
  move/baseline unless a later task explicitly changes them.
- **Route-adoption and deployed-path history** records approved frontend path
  changes and bounded compatibility without redefining backend or remote-media
  contracts.
- **Approved future decisions** are remaining direction already chosen, but not
  implemented here.
- **Questions requiring implementation-time evidence** must not be converted
  into assertions without a safe synthetic or local observation.

## Source-observed current behavior

### Public entries and navigation

`frontend-deployment.json` maps tracked source areas under
`apps/learning-platform/` to their reviewed locations under
`dist/plataforma/`. Seven entry directories retain their approved public
suffixes, including the aligned `photo-registration/` → `cadastro-foto/`
mapping; `azure-ai-vision-face-ui/` retains its matching suffix; and the
canonical module tree preserves matching relative names under `modules/`.
The separate `apps/shared/` → `dist/shared/` infrastructure mapping publishes
the backend-origin module imported by the four API-bearing platform entries.
The phase-B manifest emits only that canonical module tree and declares all 15
former compatibility module URLs described below as explicit not-found paths.
The manifest declares exactly seven public entries. Each canonical entry
includes a trailing slash and must return its listed `index.html` with HTTP
`200` and no redirect.

| Stable entry | Canonical public path | Current entry file | Direct dependencies |
| --- | --- | --- | --- |
| `LP-ENTRY-DEVICE` | `/plataforma/aviso-dispositivo/` | `apps/learning-platform/device-warning/index.html` | Login favicon; own CSS, logo, and async classic script |
| `LP-ENTRY-BROWSER` | `/plataforma/aviso-navegador/` | `apps/learning-platform/browser-warning/index.html` | Login favicon; own CSS, logo, and synchronous classic script |
| `LP-ENTRY-NOTICES` | `/plataforma/avisos-iniciais/` | `apps/learning-platform/initial-notices/index.html` | Login favicon; own CSS/logo; async module; registration storage state |
| `LP-ENTRY-REGISTER` | `/plataforma/cadastro-foto/` | `apps/learning-platform/photo-registration/index.html` | Login favicon; own CSS/logo/reference image; Face `<base>`; async module; vendored Face component; injected production platform base and stored row handle |
| `LP-ENTRY-STUDY` | `/plataforma/estudo/` | `apps/learning-platform/course-content/index.html` | Own favicon/CSS/logo; ordered classic Shaka Player 4.6.0 and jsPDF 2.5.1 dependencies; native-module bootstrap; injected production platform base; stored session state; remote DASH media |
| `LP-ENTRY-LOGIN` | `/plataforma/login/` | `apps/learning-platform/login/index.html` | Own favicon/CSS/logo; Face `<base>`; async module; vendored Face component; shared production backend origin |
| `LP-ENTRY-REPORT` | `/plataforma/statusreport/` | `apps/learning-platform/status-report/index.html` | Own favicon/CSS/logo; async module; query string; shared production backend origin |

The entry documents use these exact initial URL literals; later dynamic Face,
download, certificate, and video paths are specified in their dedicated
sections below:

| Entry | Root-relative and external initial dependencies |
| --- | --- |
| Device warning | `/plataforma/login/img/FAVICON.ico`; `/plataforma/aviso-dispositivo/style.css`; `/plataforma/aviso-dispositivo/img/LOGO_MACHADO.png`; `/plataforma/aviso-dispositivo/main.js` |
| Browser warning | `/plataforma/login/img/FAVICON.ico`; `/plataforma/aviso-navegador/style.css`; `/plataforma/aviso-navegador/img/LOGO_MACHADO.png`; `/plataforma/aviso-navegador/main.js` |
| Initial notices | `/plataforma/login/img/FAVICON.ico`; `/plataforma/avisos-iniciais/style.css`; `/plataforma/avisos-iniciais/img/LOGO_MACHADO.png`; `/plataforma/avisos-iniciais/main.js` |
| Registration | `/plataforma/login/img/FAVICON.ico`; `/plataforma/cadastro-foto/style.css`; `/plataforma/azure-ai-vision-face-ui/` as `<base>`; `/plataforma/cadastro-foto/img/LOGO_MACHADO.png`; `/plataforma/cadastro-foto/img/REFERÊNCIAS_FOTOS.png`; `/plataforma/cadastro-foto/main.js`; user-invoked `https://www.resizepixel.com/` and `https://cloudconvert.com/` links |
| Study | `/plataforma/estudo/img/FAVICON.ico`; `https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.6.0/controls.css`; `/plataforma/estudo/style.css`; `/plataforma/estudo/img/LOGO_MACHADO.png`; `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`; `https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.6.0/shaka-player.ui.js`; `/plataforma/estudo/main.js` |
| Login | `/plataforma/login/img/FAVICON.ico`; `/plataforma/login/style.css`; `/plataforma/azure-ai-vision-face-ui/` as `<base>`; `/plataforma/login/img/LOGO_MACHADO.png`; `/plataforma/login/main.js` |
| Status report | `/plataforma/statusreport/img/FAVICON.ico`; `/plataforma/statusreport/style.css`; `/plataforma/statusreport/img/LOGO_MACHADO.png`; `/plataforma/statusreport/main.js` |

`/plataforma/` is intentionally an HTTP `404` with no redirect. There is no
root `index.html` and no SPA fallback. The seven entries are URL entry points,
not claims that every entry is anonymous: client JavaScript applies the gates
described below after HTML loads. The status-report entry is the exception that
has no Edge, login, session, or participant gate.

#### Route-adoption and deployed-path history

The frontend public and deployment-output namespace changed from
`/plataforma_v2` to `/plataforma`. The former `/plataforma_v2/` root and all
seven former canonical entries are retired and return `404` without redirect:
`/plataforma_v2/aviso-dispositivo/`,
`/plataforma_v2/aviso-navegador/`,
`/plataforma_v2/avisos-iniciais/`, `/plataforma_v2/cadastro/`,
`/plataforma_v2/estudo/`, `/plataforma_v2/login/`, and
`/plataforma_v2/statusreport/`. No `dist/plataforma_v2/` subtree is emitted and
there is no compatibility redirect. The customer-facing URL change is
communicated manually outside this repository.

This adoption changed frontend paths only. The physical source remains
`apps/learning-platform/`, the application ID remains `learning-platform`, the
backend API remains under `/plataforma_v2`, and the protected and bypass
remote-media branches remain under `videosv3/plataforma_v2/` and
`videosv3/plataforma_v2_sem_drm/`. The Conecta source, application ID,
`/conecta/cadastro-recomendacoes/` route, and
`dist/conecta/cadastro-recomendacoes/` output are unchanged.

The later deployed-path alignment makes `/plataforma/cadastro-foto/` the
canonical photo-registration entry. The former current-namespace forms
`/plataforma/cadastro`, `/plataforma/cadastro/`, and
`/plataforma/cadastro/index.html` are explicit `404` contracts without an alias
or redirect. That retirement is independent of the older, still-retired
`/plataforma_v2/cadastro/` frontend route. It also does not change the backend
`POST /plataforma_v2/CadastroFoto_e_FaceID` API, its payload, or its behavior.

The module rollout was deliberately separate from the entry retirement. During
phase A, the artifact emitted both the aligned
`/plataforma/modules/photo-registration.js` and
`/plataforma/modules/course-content/` files and exactly 15 temporary legacy
module files: `/plataforma/modules/registration.js` plus all 14 files under
`/plataforma/modules/study/`. The 14 study aliases covered the fresh-cache race in
which the unchanged `/plataforma/estudo/main.js` URL can retain its former bytes
for up to 30 seconds under its observed `Cache-Control: public, must-revalidate,
max-age=30` policy and request its former imports after deployment. The
registration alias separately let an already loaded or cached legacy
registration bootstrap resolve its former module. Neither compatibility path
restored any `/plataforma/cadastro` entry form.

The phase-B source removed those 15 outputs after phase A exceeded its
30-second cache window and makes every legacy module URL an explicit `404`,
leaving only the aligned module paths. The manifest now contains 50
`notFoundPaths`; with the eight `repositoryOnlyPaths`, source and published
verification expect 58 negative paths. The deployed-path phase-B gate is
complete: its merge, exact production artifact, production routes, and preview
cleanup were verified before the centralized-origin work began.

Current internal navigation is normal document navigation through
`window.location.href`, always using the following **slashless**, lower-case,
root-relative strings:

| Destination | Exact internal path | Writers |
| --- | --- | --- |
| Device warning | `/plataforma/aviso-dispositivo` | Login, initial notices, registration, study, status report |
| Browser warning | `/plataforma/aviso-navegador` | Login, initial notices, registration, study |
| Login | `/plataforma/login` | Registration failure/rejection, unauthenticated study, logout, session expiry |
| Initial notices | `/plataforma/avisos-iniciais` | Active login with Face enabled and no registered photo |
| Registration | `/plataforma/cadastro-foto` | Successful initial-notices acknowledgement |
| Study | `/plataforma/estudo` | Existing logged flag, Face-disabled login, successful Face verification/registration |

The maintained client-intake application separately targets the canonical
`/plataforma/aviso-dispositivo/` entry, including its trailing slash, as an
explicit cross-application device-warning destination. It is not part of the
platform's slashless internal-navigation table.

There is no `location.replace`, History API state, hash router, `popstate`, or
client-side route normalizer in the platform. Module and topic changes are
DOM-only state. The source-preview and generated-artifact local servers accept
a slashless directory request by finding `path/index.html` and do not issue a
redirect. Published verification asserts only the canonical trailing-slash
entries, so production slashless redirect/status/history behavior remains an
implementation-time evidence question.

Two flows use browser history directly:

- the device warning records its origin and calls `history.back()` only after
  the viewport becomes strictly wider than `1024px`;
- login calls `history.back()` when registration authorization is `Sim` and the
  device-warning-origin marker is not `Sim`.

There is no fallback when a direct warning-page visit has no useful prior
history entry.

#### Current source anchors

- Deployment mapping, entries, current root 404, and former-route retirement:
  [`frontend-deployment.json`](../frontend-deployment.json).
- Exhaustive entry and retirement test:
  [`scripts/frontend-deployment.test.mjs`](../scripts/frontend-deployment.test.mjs).
- README route/404 contract: [`README.md` lines 32-78](../README.md#L32-L78).
- Client-intake cross-application warning destination:
  [`main.js` line 4](../apps/client-intake/main.js#L4).
- Published page, support-file, and `404`/no-redirect checks:
  [`scripts/frontend-deployment-lib.mjs` lines 1281-1370](../scripts/frontend-deployment-lib.mjs#L1281-L1370).
- Slashless local behavior: manifest-aware source-preview aliases and routes
  [`scripts/frontend-deployment-lib.mjs` lines 708-747](../scripts/frontend-deployment-lib.mjs#L708-L747)
  and [`scripts/frontend-deployment-lib.mjs` lines 1103-1140](../scripts/frontend-deployment-lib.mjs#L1103-L1140),
  plus generated-artifact index fallback
  [`scripts/frontend-deployment-lib.mjs` lines 1213-1259](../scripts/frontend-deployment-lib.mjs#L1213-L1259).
- Exact HTML dependencies: device
  [`index.html` lines 9-28](../apps/learning-platform/device-warning/index.html#L9-L28),
  browser [`index.html` lines 9-28](../apps/learning-platform/browser-warning/index.html#L9-L28),
  notices [`index.html` lines 9-18](../apps/learning-platform/initial-notices/index.html#L9-L18),
  registration [`index.html` lines 9-62](../apps/learning-platform/photo-registration/index.html#L9-L62),
  login [`index.html` lines 9-59](../apps/learning-platform/login/index.html#L9-L59),
  study [`index.html` lines 9-32](../apps/learning-platform/course-content/index.html#L9-L32) and
  [`index.html` lines 9109-9113](../apps/learning-platform/course-content/index.html#L9109-L9113),
  report [`index.html` lines 9-45](../apps/learning-platform/status-report/index.html#L9-L45).
- Slashless destinations and history: device
  [`main.js` lines 1-3](../apps/learning-platform/device-warning/main.js#L1-L3), shared
  [lifecycle seam](../apps/learning-platform/modules/lifecycle.js),
  [notices factory](../apps/learning-platform/modules/initial-notices.js),
  [registration factory](../apps/learning-platform/modules/photo-registration.js),
  [login factory](../apps/learning-platform/modules/login.js),
  [study coordinator](../apps/learning-platform/modules/course-content/application.js), and
  [status-report coordinator](../apps/learning-platform/modules/status-report/application.js).

### Application modules and production-edge seams

Every existing `main.js` remains the stable public entry asset. The two warning
entries remain their original small classic scripts. Login, initial notices,
registration, and status report retain their existing async native-module
bootstrap. Study now loads its existing ordered classic jsPDF and Shaka
dependencies followed by a non-async native-module `main.js`; this HTML
bootstrap change is the only script-mode delta.

The production entries own browser-global access and construct application
factories immediately during module evaluation. Application modules do not read
browser globals at top level. They receive explicit production edges at
construction; depending on the entry these include `window`, `document`,
`navigator`, a navigation callback, `history`, `sessionStorage`, `fetch`,
`Date`/clock functions, timer functions, `FormData`, Face custom-element
construction, Shaka, or jsPDF. No framework, package, bundler, transpiler,
dependency, generated source, or additional build step is involved.

Login, Study, Registration, and Status Report import the same production origin
from `apps/shared/backend-origin.js`, append the unchanged `/plataforma_v2`
application base at their entry edges, and inject that base into their generic
application/client seams. Neither a platform application module nor Web Storage
selects or overrides the backend base.

| Boundary | Current responsibility |
| --- | --- |
| `modules/session.js` | Centralizes the seven exact legacy key constants and raw `getItem`/`setItem` access for extracted modules. The preserved device-warning script retains direct raw storage access. The seam adds no validation, normalization, removal, authority, expiry, or revocation semantics. |
| `modules/platform-client.js` | Owns injected JSON GET/POST and ordered multipart POST mechanics. It normalizes fetch rejection and malformed JSON through the application error seam, still parses JSON before checking `ok`, and for parsed non-OK responses still throws exactly `{ status: response.status, error: data.error }`. It adds no retry, timeout, abort, dedupe, idempotency, or authorization header. |
| `modules/error-adapter.js` | Owns learning-platform semantic kinds, owner labels, operation allowlists, the exact named backend values, and transport/malformed/HTTP/unknown/application-local normalization. Feature modules branch only on its semantic kinds. |
| `modules/error-presentation.js` | Owns the reviewed Brazilian-Portuguese presentation catalog. It is the only production source containing visible `Erro_XXX` prefixes; machine values are never interpolated into alerts, logs, or rendered HTML. |
| `modules/lifecycle.js` | Owns the exact Edge signal and inclusive `<= 1024` device-warning decision. Entry factories retain listener installation and gate order. |
| `modules/face-startup.js` | Constructs one injected Face custom element, applies the frozen `pt-BR`, font, and button properties, mounts it, and starts it once. Result lookup remains the caller's single backend GET. |
| `modules/login.js`, `modules/photo-registration.js`, `modules/initial-notices.js` | Own their existing credential, upload, Face, notice, form-reset, gate, storage, request, and navigation branches. Production configuration stays at the existing entry edge and is injected without being copied into tests or documentation. |
| `modules/status-report/query.js` | Parses the nine legacy query keys, including all current coercion and missing-value behavior. |
| `modules/status-report/charts.js` | Constructs chart markup/targets, applies the module range, independently sorts each metric, and renders the existing 15-slot layout and label quirks. |
| `modules/status-report/application.js` | Captures query/DOM state at factory construction, assigns `window.onload`, preserves width/listener order, and owns the public status request and error branches. |

The six import specifiers in `photo-registration/main.js` and
`course-content/main.js` now match both source and deployment structure:
`../modules/photo-registration.js` and
`../modules/course-content/{application,certificate-renderer,dom,downloads,player}.js`.
The current manifest uses one `apps/learning-platform/modules` →
`plataforma/modules` directory mapping to emit all 26 canonical module files.
Together with seven entry mappings and the Face mapping, that is exactly nine
learning-platform mappings. The canonical outputs preserve every relative
source suffix, so both source and generated previews resolve the imports without
learning-platform-specific aliases. Historically, phase A used 13 module
mappings and 21 learning-platform mappings to emit these canonical files plus
the 15 temporary compatibility copies.

The generic manifest-aware alias mechanism remains part of the repository
preview server because other applications still have intentionally different
source and deployment layouts. In particular, the flattened marketing entry
maps source files under `apps/marketing-site/` to root and `landing-page/`
outputs; its focused comparison coverage remains in
[`frontend-deployment.test.mjs`](../scripts/frontend-deployment.test.mjs).

Study is coordinated by `modules/course-content/application.js`. Its
responsibilities are split without changing their ordering:

| Study module | Current responsibility |
| --- | --- |
| `dom.js`, `state.js` | Evaluation-time DOM collection and the explicit cross-responsibility state: open module, verified handle, identity fields, access/login fields, completed count, ten grades, accumulated grade, and certificate ID. |
| `navigation.js`, `session-timer.js` | 171-node/module navigation and metrics; client deadline display, warning thresholds, expiry flag change, and navigation. |
| `content.js`, `downloads.js`, `player.js` | Content selection, exact download assignments, injected Shaka lifecycle, protected/bypass selection, retained player/UI, and local completion handlers. Sensitive media and license policy remains only in the production study edge. |
| `progress.js`, `assessment.js`, `feedback.js` | Optimistic updates, rollback, assessment calculation/global mutations, feedback request ordering, and all documented duplicate/partial-success behavior. |
| `performance.js`, `certificate.js`, `certificate-renderer.js` | Combined-view opening and grade-chart rendering; certificate eligibility/status and download binding; and the injected jsPDF renderer with the three local certificate inputs. |

Cross-function mutable state is application-owned rather than implicit
browser-global state. Login and registration retain captured controls and
session adapters in factory closures; study uses an explicit state object, a
retained Shaka player/UI closure, and a narrow production-edge controller bridge
while preserving the legacy session-seconds read; status report retains its
query snapshot and chart arrays in its factory closure. DOM live collections,
`onclick`/`onended` replacement, and other documented legacy coupling remain
observable compatibility behavior.

### Application-owned internal language boundary

Application-owned learning-platform identifiers and comments use US English
and ASCII. The approved behavior-neutral rename map is deliberately narrow:

| Source | Legacy internal | Current internal |
| --- | --- | --- |
| `modules/course-content/downloads.js` | `MóduloAberto`, `NomeVídeo` | existing inputs `moduleName`, `videoName` |
| `modules/course-content/downloads.js` | `ContainerDownloadArquivo1` through `ContainerDownloadArquivo4` | `downloadContainer1` through `downloadContainer4` |
| `modules/course-content/downloads.js` | `NomeArquivo1` through `NomeArquivo4` | `downloadName1` through `downloadName4` |
| `modules/course-content/downloads.js` | `BotãoDownload1` through `BotãoDownload4` | `downloadButton1` through `downloadButton4` |
| `modules/course-content/certificate-renderer.js` | `Usuário_NomeCompleto`, `Usuário_Formação_NotaAcumulado`, `Usuário_Formação_CertificadoID` | `fullName`, `accumulatedGrade`, `certificateId` |

This does not rename any `Usuário_*` API member, DOM/CSS identifier, query
field, route, remaining raw storage value, module/video label, filename,
download/media/certificate path, Face
interface, or Brazilian-Portuguese presentation. The frozen legacy status-report
note about `consolidado` and `individual` also remains documentary evidence.
Focused static tests enforce this lexical boundary without scanning
compatibility strings as application-owned internals.

Node.js tests import these exact `.js` modules through a realpath-confined
native-module loader. A deny-all host guard is installed before import, and the
factories receive only invented DOM, storage, clock, Face, Shaka, jsPDF, and
request fixtures. Production entries and the vendored Face bundle are never
executed by behavior tests.

### Browser, viewport, resize, and back-navigation gates

`LP-GATE-EDGE` applies on login, initial notices, registration, and study. A
browser passes when either `navigator.userAgentData?.brands` contains a brand
whose value is exactly `Microsoft Edge`, or the legacy user-agent string
contains `Edg`. Failure navigates to the slashless browser-warning path. This is
a string gate, not a capability check. Status report and both warning entries do
not apply it. The browser-warning diagnostic script directly reads
`navigator.userAgentData.brands` without optional chaining; where that API is
absent the script throws after the warning HTML is already present.

`LP-GATE-WIDTH` redirects active entries when `window.innerWidth <= 1024`:
`1024` is rejected and `1025` is allowed. Login, notices, and registration
install a resize listener before their `load` handler. Study installs its
listener only after its Edge and logged-state gates and performs an immediate
width check before refreshing data. Status report parses query parameters at
module evaluation, then applies width first inside its `load` handler and
installs the listener only when initially wider than the boundary. The device
warning reverses the condition and goes back only at `> 1024`.

Gate order is stable:

| Entry | Current order |
| --- | --- |
| Login | Edge → existing logged flag → registration/history rule → width |
| Initial notices | reset device origin → Edge → registration authorization → width |
| Registration | reset device origin → Edge → registration authorization → width |
| Study | reset device origin → Edge → logged flag → width → refresh |
| Status report | query parse during module evaluation → width in `load` → render/API; no Edge/session gate |
| Device/browser warning | no incoming gate |

Login, notices, registration, and status report retain async module scripts.
Study's ordered classic jsPDF/Shaka dependencies are followed by its non-async
native-module entry. Every application factory is installed immediately when
its entry module evaluates, with no `readyState` or `DOMContentLoaded`
fallback. No page handles `pageshow`, BFCache restoration, `pagehide`,
`beforeunload`, or `popstate`.

Current anchors: [login factory](../apps/learning-platform/modules/login.js),
[notices factory](../apps/learning-platform/modules/initial-notices.js),
[registration factory](../apps/learning-platform/modules/photo-registration.js),
[study coordinator](../apps/learning-platform/modules/course-content/application.js),
[status-report coordinator](../apps/learning-platform/modules/status-report/application.js),
shared [lifecycle seam](../apps/learning-platform/modules/lifecycle.js), warning
[`main.js` lines 1-3](../apps/learning-platform/device-warning/main.js#L1-L3), and
browser diagnostic [`main.js` lines 1-2](../apps/learning-platform/browser-warning/main.js#L1-L2).

### Session-storage contract

There are exactly seven `sessionStorage` key spellings. Accents, hyphens,
underscores, and capitalization are compatibility data. Values are strings
because they pass through Web Storage. No platform source calls `removeItem()`
or `clear()`.

| Exact key | Writers and value convention | Readers and transition use | Lifetime and security implication |
| --- | --- | --- | --- |
| `IndexVerificado` | Login unconditionally stores the response value. Active login receives an opaque signed row handle; inactive login has no value and storage receives string `undefined`. | Registration sends it in multipart; study sends it in protected JSON calls. | Backend handle is reusable for exactly four hours, is not rotated by refresh, and is not revoked/removed by logout. Same-origin script or DOM injection can read it until expiry. |
| `Usuário_Foto_Cadastrada` | Login stores backend `Sim`/`Não`. | No current reader. | Dead mirrored state; registration does not update it and logout leaves it. |
| `Horário-Encerramento-Sessão` | Active credential login stores `Date.now() + 14,400,000` as decimal epoch milliseconds before registration/Face work. | Study coerces with `Number()` and drives its one-second countdown. | Persists across reload/history/logout. Missing becomes `0` and immediately expires; tampered nonnumeric text becomes `NaN`, breaks the display, and prevents expiry comparisons. Uses mutable browser clock/state. |
| `Usuário_Logado` | `Sim` after Face-disabled login or successful Face verification/registration; `Não` on explicit logout or timer expiry. | Login redirects exact `Sim` to study; study rejects anything other than exact `Sim`. | UI-only gate and forgeable. Signed handle remains backend authority. Refresh failure does not clear it. |
| `Usuário_Autorização_Cadastro` | `Sim` after active Face-enabled login reports photo `Não`; `Não` immediately after registration endpoint success, before local liveness completes. | Gates notices/registration and controls login's history-back rule. | UI-only. Initial registration failure leaves `Sim`; later liveness failure leaves `Não`. Forging opens pages but does not create a valid row handle. |
| `Origem_Aviso_Dispositivo` | Device warning writes `Sim`; notices, registration, and study overwrite `Não` on load; login's history branch writes `Não`. | Login history-back rule. | Persistent tab navigation sentinel that can become stale. |
| `TempoSessão_Segundos` | No writer exists. | Study reads it once into an unused variable. | Dead legacy key; old values have no current effect. |

The client countdown turns red at ten minutes, adds the final-five-minute class
at five minutes, and at zero writes logged `Não` and navigates to login. The
backend handle has its own four-hour clock. Refresh neither rotates nor returns
a handle, and it does not recheck workbook login status as an authorization
condition. Explicit logout only changes the UI flag.

Current anchors: exact key spellings and raw access in the shared
[`session.js`](../apps/learning-platform/modules/session.js); shared production
origin in [`backend-origin.js`](../apps/shared/backend-origin.js); explicit
platform-base injection in Login, Study, Registration, and Status Report entry
modules; transitions in the [login factory](../apps/learning-platform/modules/login.js);
and the [registration factory](../apps/learning-platform/modules/photo-registration.js).
Study and Registration therefore support direct startup without a stored
backend base. Study evaluation reads in
[`main.js`](../apps/learning-platform/course-content/main.js),
refresh/logout in the [study coordinator](../apps/learning-platform/modules/course-content/application.js),
and expiry in [`session-timer.js`](../apps/learning-platform/modules/course-content/session-timer.js); warning
[`main.js` lines 1-3](../apps/learning-platform/device-warning/main.js#L1-L3); backend
handle contract at the pinned companion
[`api-contracts.md` lines 211-248](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L211-L248).

### Backend-call contract

The browser has no cookie-based platform session and sends no platform
`Authorization` header. Five operations carry `IndexVerificado` in the exact
JSON/multipart body field. The companion backend verifies that signed row
handle before handler calls and returns `401 {}` for invalid handle classes;
registration is the exception where Multer buffers the upload before
authorization. Login, Face-result lookup, and status report are public.

All seven non-multipart client requests set the exact header
`Content-Type: application/json`, including the bodyless Face-result GET.
Registration sets no explicit content type so the browser supplies its
multipart boundary.

Every browser consumer parses JSON before checking `response.ok`. There is no
client timeout, abort signal, retry, or idempotency key. The backend application
retry helper makes five total attempts with waits of 500, 1,000, 1,500, and
2,000 ms, without filtering, jitter, timeout, or cancellation. Graph/Face SDKs
can retry inside an application attempt. “Retry” below means the backend
application layer unless stated otherwise.

| ID and operation | Exact client request | Success contract | Backend order, authorization, and failures | Current frontend mapping |
| --- | --- | --- | --- | --- |
| `LP-API-LOGIN` `POST /plataforma_v2/login-FaceID` | JSON header; body `Usuário_Login`, `Usuário_Senha`, untrimmed | Matched response: `Usuário_Status_FaceID`, `Usuário_Foto_Cadastrada`, `Usuário_PrazoAcesso`, `Usuário_Status_Login`; active exact `Ativo` also gets `IndexVerificado` | Public. Retry full platform-workbook read, scan in returned order, strict login match and password string match. No match: `401 credenciais_inválidas`; read exhaustion: `learning_platform.read_platform_data_failed`. Repeats mint time-derived active handles. | `401` shows invalid credentials; the named read failure shows `Erro_001`; unknown/parser/network is `Erro_000`. |
| `LP-API-REGISTER` `POST /plataforma_v2/CadastroFoto_e_FaceID` | Browser multipart, append `IndexVerificado` then single `file`; browser supplies boundary | `Azure_Face_API_LivenessSession_authToken`, `Azure_Face_API_LivenessSession_sessionID` | Multer memory-buffer first, signed authorization second. Retry reference-photo upload (`learning_platform.upload_reference_photo_failed`) → retry 22-cell row update with photo flag `Sim` at index 5 (`learning_platform.update_reference_photo_registration_failed`) → retry passive Face session with uploaded bytes and new correlation UUID (`learning_platform.create_face_liveness_session_failed`). Photo/flag can persist before later failure; retries can create multiple Face sessions. | The three named failures retain visible `Erro_002` through `Erro_004`; `401 {}`/unknown is `Erro_000`. After HTTP success client clears registration authorization before local liveness. |
| `LP-API-FACE-START` `POST /plataforma_v2/FaceID` | JSON header; body `IndexVerificado` | Same auth-token and session-ID keys as registration | Signed authorization. Retry reference-photo read (`learning_platform.read_reference_photo_failed`) → retry passive Face-session creation with new correlation UUID (`learning_platform.create_face_liveness_session_failed`). Session creation is non-idempotent. | The named failures show `Erro_005` and `Erro_004`; local SDK rejection remains `Erro_006`; unknown/`401` remains `Erro_000`. |
| `LP-API-FACE-RESULT` `GET /plataforma_v2/FaceID_resultado/:sessionId` | JSON content-type header despite no body; returned ID concatenated without URL encoding | `Azure_Face_API_LivenessSession_LivenessDecision`, `Azure_Face_API_LivenessSession_MatchConfidence`, `Azure_Face_API_LivenessSession_MatchDecision` | Public. Retry one Face result lookup using decoded path slot; use first attempt result; rejection exhaustion `learning_platform.read_face_liveness_result_failed`. Resolved non-success Face HTTP status is not separately checked before projection. | No polling. Exact `realface` plus boolean match `true` passes. The named failure shows `Erro_007`; unknown is `Erro_000`; local SDK failure remains `Erro_006`. |
| `LP-API-REFRESH` `POST /plataforma_v2/refresh` | JSON header; body `IndexVerificado` from storage | 18 exact keys: full/first name, email, access deadline, login status, completed count, module grades 1-10, accumulated grade, certificate ID | Signed authorization. Retry full workbook read and select verified row (`learning_platform.read_platform_data_failed`). Read-only; handle is not returned/rotated. Missing/short row has no explicit error contract. | Consumes every key; parses progress with `parseFloat`. The named failure shows `Erro_001`; returned login status is stored but not enforced. `401` becomes `Erro_000`. |
| `LP-API-UPDATE` `POST /plataforma_v2/updates` | JSON header; exact keys `TipoAtualização`, `IndexVerificado`, `NúmeroTópicosConcluídos`, `NúmeroMódulo`, `NotaTeste` | `200 {}` | Signed authorization. Always trust/write client progress at row index 8. Exact type `NúmeroTópicosConcluídos-e-NotaTeste` also trusts/writes grade at JS index `NúmeroMódulo + 9`; ordinary type sends literal `n/a` module/grade. Retry fixed row update (`learning_platform.update_platform_data_failed`). No type/range/monotonicity/grade validation. | Progress increment precedes request; catch decrements local count/restores action. The named failure shows `Erro_008`; `401`/unknown shows `Erro_000`. |
| `LP-API-FEEDBACK` `POST /plataforma_v2/processa-feedback` | JSON header; exact keys `IndexVerificado`, progress, full name, email, browser-local fill date, module, four ratings, comments | `200 {}` | Signed authorization only. Retry progress update (`learning_platform.update_platform_data_failed`) → retry append nine client fields in order: name, email, date, module, size, content, platform, printed-material, comments (`learning_platform.append_feedback_failed`). Progress can persist before append failure; append has no dedupe and can duplicate under retry/repeat. | Optimistic local increment; catch decrements only local state. The named failures show `Erro_008` and `Erro_009`; `401`/unknown shows `Erro_000`. |
| `LP-API-REPORT` `POST /plataforma_v2/statusreport` | JSON header; body `linha_inicial`, `linha_final` parsed from `li`, `lf` | `Dados_Extraídos_BD_Plataforma`; each row is 14 values: full name, progress, ten grades, accumulated grade, certificate ID | Public and wildcard-CORS accessible. Retry live full workbook read (`learning_platform.read_platform_data_failed`), then exact JS `slice(linha_inicial, linha_final + 1)` and projection. No input validation. Stable numeric end is inclusive; direct nonnumeric API inputs retain JS coercion. | UI consumes indexes 0-12 and ignores certificate ID at 13. The named failure shows `Erro_001`; unknown shows `Erro_000`. |

The refresh response's 18 exact keys are
`Usuário_NomeCompleto`, `Usuário_PrimeiroNome`, `Usuário_Email`,
`Usuário_PrazoAcesso`, `Usuário_Status_Login`,
`Usuário_Formação_NúmeroTópicosConcluídos`,
`Usuário_Formação_NotaMódulo1` through
`Usuário_Formação_NotaMódulo10`, `Usuário_Formação_NotaAcumulado`, and
`Usuário_Formação_CertificadoID`.

The feedback request's exact keys are `IndexVerificado`,
`NúmeroTópicosConcluídos`, `Usuário_NomeCompleto`, `Usuário_Email`,
`Feedback_DataPreenchimento`, `NúmeroMódulo`, `Feedback_TamanhoMódulo`,
`Feedback_QualidadeConteúdo`, `Feedback_QualidadePlataforma`,
`Feedback_QualidadeMateriaisImpressos`, and `Feedback_Comentários`. Missing
radio choices evaluate to `undefined` and are omitted by `JSON.stringify`.

The Face-result backend route's current Express parameter name is longer than
the stable `:sessionId` label above; that internal name is not a public URL
segment. Backend routing is currently case-insensitive and non-strict, but the
canonical method/path spellings in the table and the frontend's exact casing
remain the compatibility target.

#### Error normalization and named-only boundary

The frontend now owns one learning-platform error adapter. Backend machine
strings are inputs to that seam only; login, registration, Face, study,
feedback, progress, assessment, and Status Report branch on semantic `kind`
values. The separate presentation catalog then selects the exact existing
Brazilian-Portuguese outcome. No feature module branches on a raw machine
value.

The backend at the pinned companion commit produces only the exact US-English
ASCII values in the named-value column. The frontend recognizes those values
only for their operation-specific consumers.

| Owner | Semantic kind | Named backend value |
| --- | --- | --- |
| Backend | `platformDataReadFailure` | `learning_platform.read_platform_data_failed` |
| Backend | `referencePhotoUploadFailure` | `learning_platform.upload_reference_photo_failed` |
| Backend | `referencePhotoRegistrationUpdateFailure` | `learning_platform.update_reference_photo_registration_failed` |
| Backend | `faceLivenessSessionCreationFailure` | `learning_platform.create_face_liveness_session_failed` |
| Backend | `referencePhotoReadFailure` | `learning_platform.read_reference_photo_failed` |
| Backend | `faceLivenessResultReadFailure` | `learning_platform.read_face_liveness_result_failed` |
| Backend | `platformDataWriteFailure` | `learning_platform.update_platform_data_failed` |
| Backend | `feedbackAppendFailure` | `learning_platform.append_feedback_failed` |

Frontend-owned `applicationFailure` and `faceComponentFailure` enter through
semantic local normalization. They select visible `Erro_000` and `Erro_006`
presentation outcomes respectively, but neither numbered string is an accepted
machine value. The other normalized kinds are
`transportFailure`, `malformedResponse`, `httpFailure`, `invalidCredentials`,
and `unknownDomainFailure`. Ownership is exact: known domain failures and the
login-only `401` credential branch are `backend`; transport, malformed, HTTP,
application, and Face-component failures are `frontend`; an unrecognized,
retired-numbered, or operation-inapplicable machine value is `unknown`.

Normalization preserves these branch rules in order:

1. An already normalized `{ kind, owner, status }` failure passes through.
2. Numeric login status `401` becomes backend-owned `invalidCredentials` before
   machine-value inspection.
3. A string `error` becomes its backend semantic kind only when the named value
   is recognized and that kind is allowed for the active operation. Every
   other string, including a retired numbered alias, becomes
   `unknownDomainFailure` while preserving its numeric status.
4. A numeric status without a string machine value becomes frontend-owned
   `httpFailure`.
5. A failure with neither becomes frontend-owned `applicationFailure`.
6. Fetch rejection and JSON parsing failure use the distinct frontend-owned
   `transportFailure` and `malformedResponse` entry points. Application-local
   normalization accepts only `applicationFailure` or `faceComponentFailure`.

The operation allowlists prevent a valid learning-platform value from affecting
an unrelated consumer:

| Operation | Allowed backend semantic kinds |
| --- | --- |
| `assessmentUpdate` | `platformDataWriteFailure` |
| `faceResult` | `faceLivenessResultReadFailure` |
| `faceSession` | `faceLivenessSessionCreationFailure`, `referencePhotoReadFailure` |
| `feedback` | `feedbackAppendFailure`, `platformDataWriteFailure` |
| `login` | `platformDataReadFailure` |
| `progressUpdate` | `platformDataWriteFailure` |
| `refresh` | `platformDataReadFailure` |
| `registration` | `faceLivenessSessionCreationFailure`, `referencePhotoRegistrationUpdateFailure`, `referencePhotoUploadFailure` |
| `statusReport` | `platformDataReadFailure` |

`platform-client.js` still parses JSON before status and, after successful JSON
parsing, still throws a non-OK response with exactly
`{ status: response.status, error: data.error }`. The adapter does not change an
HTTP status, request/response envelope, method, route, field, retry, or ordering
contract. Invalid signed handles remain `401 {}` and every protected consumer
still selects its generic `Erro_000` presentation.

The presentation catalog is independent of semantic and machine values. Its 18
keys retain these exact reviewed outcomes (`<br>` represents the existing
newline):

| Presentation key | Exact visible outcome |
| --- | --- |
| `feedbackAppend` | `Erro_009: falha ao atualizar a base de dados de controle da plataforma.`<br>`Tente novamente.` |
| `genericServerRetry` | `Erro_000: falha de comunicação com o servidor.`<br>`Verifique sua conexão com a internet e tente novamente.` |
| `loginFaceComponent` | `Erro_006: falha interna do sistema da Microsoft (Azure Face API).`<br>`Tente novamente.` |
| `loginFaceResult` | `Erro_007: falha interna do sistema da Microsoft (Azure Face API).`<br>`Tente novamente.` |
| `loginFaceSession` | `Erro_004: falha interna do sistema da Microsoft (Azure Face API).`<br>`Tente novamente.` |
| `loginFaceSessionGeneric` | `Erro_000: Verifique sua conexão com a internet.` |
| `loginReferencePhoto` | `Erro_005: falha ao obter sua foto de referência.`<br>`Tente novamente.` |
| `platformDataRetry` | `Erro_001: falha de comunicação com a base de dados de controle da plataforma.`<br>`Tente novamente.` |
| `platformDataWrite` | `Erro_008: falha ao atualizar a base de dados de controle da plataforma.`<br>`Tente novamente.` |
| `registrationFaceComponent` | `Erro_006. Aguarde 2min e tente novamente.` |
| `registrationFaceResult` | `Erro_007. Tente novamente.` |
| `registrationFaceResultGeneric` | `Erro_000. Tente novamente.` |
| `registrationFaceSession` | `Erro_004. Tente novamente.` |
| `registrationPhotoRegistrationUpdate` | `Erro_003. Tente novamente.` |
| `registrationPhotoUpload` | `Erro_002. Tente novamente.` |
| `registrationRequestGeneric` | `Erro_000. Verifique sua conexão com a internet.` |
| `studyRefreshGeneric` | `Erro_000: falha de comunicação com o servidor.`<br>`Verifique sua conexão com a internet e então atualize a página.` |
| `studyRefreshPlatformData` | `Erro_001: falha de comunicação com a base de dados de controle da plataforma.`<br>`Atualize a página.` |

Named backend machine values are confined to `error-adapter.js`; visible
numbered prefixes are confined to `error-presentation.js`. Retired numbered
machine inputs remain only as explicit negative test fixtures and documentary
history. Machine values are never displayed or interpolated into alerts, logs,
or rendered HTML.

#### Current source anchors

- Shared request mechanics: [`platform-client.js`](../apps/learning-platform/modules/platform-client.js).
- Semantic normalization and named backend values:
  [`error-adapter.js`](../apps/learning-platform/modules/error-adapter.js).
- Reviewed visible outcomes:
  [`error-presentation.js`](../apps/learning-platform/modules/error-presentation.js).
- Login client: [`login.js`](../apps/learning-platform/modules/login.js).
- Registration client: [`photo-registration.js`](../apps/learning-platform/modules/photo-registration.js).
- Study refresh coordinator:
  [`application.js`](../apps/learning-platform/modules/course-content/application.js);
  ordinary updates [`progress.js`](../apps/learning-platform/modules/course-content/progress.js),
  assessment updates [`assessment.js`](../apps/learning-platform/modules/course-content/assessment.js),
  and feedback [`feedback.js`](../apps/learning-platform/modules/course-content/feedback.js).
- Status-report query/client:
  [`query.js`](../apps/learning-platform/modules/status-report/query.js) and
  [`application.js`](../apps/learning-platform/modules/status-report/application.js).
- Pinned companion backend route sections:
  [login](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L527-L558),
  [registration](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L559-L611),
  [Face start](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L612-L650),
  [Face result](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L651-L689),
  [refresh](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L690-L721),
  [updates](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L722-L759),
  [feedback](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L760-L796), and
  [status report](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L822-L855).
- Pinned retry semantics:
  [`api-contracts.md` lines 168-210](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L168-L210).
- Pinned global CORS and Express routing semantics:
  [`api-contracts.md` lines 117-147](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L117-L147).

### User and learning-state transitions

#### Login and initial notices

`LP-STATE-LOGIN` begins by writing the production backend role and importing
the Face component. The load gate then applies Edge, existing-login,
registration-history, and width rules in that order. Submission disables and
hides the button, shows the initialization message, and captures the untrimmed
credentials. A matched response is stored before branch selection.

- Inactive login resets the form and displays the backend-projected access
  deadline. It is a successful HTTP response without a row handle.
- Active login starts the client four-hour deadline immediately.
- Exact Face status `Inativo` sets logged `Sim` and opens study.
- Otherwise exact photo status `Não` sets registration authorization `Sim` and
  opens initial notices.
- Otherwise exact photo status `Sim` creates a Face session, mounts a new Face
  element, starts it, reads the result once, and accepts only exact liveness
  `realface` plus boolean match `true`.
- A rejected Face decision resets the form and shows an inline rejection. SDK,
  Face, workbook, and unexpected failures follow the error mapping above.

There is no branch for unexpected Face/photo status strings; the waiting UI can
remain. `resetLogin()` restores controls and clears email/password only. It
does not clear session storage or remove a previously appended Face element.

`LP-STATE-NOTICES` requires the three exact lower-case, untrimmed answers
`credenciais`, `direitos`, and `janela`. Success opens registration. Failure
shows per-field alerts and leaves the submit button hidden until a field emits
`change`. No consent state is stored and no backend call occurs.

Current anchors: [login production edge](../apps/learning-platform/login/main.js),
[login factory](../apps/learning-platform/modules/login.js), and
[initial-notices factory](../apps/learning-platform/modules/initial-notices.js).

#### Face registration and verification

`LP-STATE-REGISTER` receives the production platform base explicitly and reads
the signed row handle during module evaluation. The file control is required
and advertises `.jpg`; visible copy
asks for at least 1920×1080 and no more than 6 MB, but client JavaScript and the
backend do not enforce file type, dimensions, or a source-configured byte limit.

On submission the browser sends the combined registration operation. When that
operation succeeds, the client changes registration authorization to `Não`
**before** it starts local liveness. It creates the Face component with locale
`pt-BR`, starts it with the returned token, and then makes one result request.
Passing sets logged `Sim` and opens study. A failed decision exposes the Face
decision/confidence/match values in an alert and returns to login. SDK or result
failure also returns to login. Failure of the initial combined operation
restores registration controls and stays on the page.

The client cannot roll back already-uploaded photo bytes, the workbook photo
flag, or a created Face session. A failure after the combined operation's
success forces a fresh credential-login path because registration authorization
has already become `Não`.

`LP-STATE-FACE-VERIFY` follows the same local component/result sequence for an
existing reference photo. It ignores the value resolved by the component,
does not poll the result, and uses only the backend result fields. The Face
component's vendored loader waits for its engine, exposes a cancel path after a
long-load delay, and rejects on its own timeout/failure states; those failures
map to frontend `Erro_006`.

Current anchors: registration HTML
[`index.html` lines 32-48](../apps/learning-platform/photo-registration/index.html#L32-L48),
[registration factory](../apps/learning-platform/modules/photo-registration.js),
[login factory](../apps/learning-platform/modules/login.js), shared
[Face startup seam](../apps/learning-platform/modules/face-startup.js), and vendored
loader [`FaceLivenessDetector.js` line 1](../apps/learning-platform/azure-ai-vision-face-ui/FaceLivenessDetector.js#L1).

#### Study initialization and sequential progress

`LP-STATE-STUDY` treats progress as one contiguous sequence of 171 nodes: 151
content/video topics, ten tests, and ten feedback topics. Refresh data is
trusted after `parseFloat` of the completed count. The first `N` nodes become
completed, node `N + 1` becomes the only open node, and only completed/open
nodes receive click handlers. If `N < 171`, the open module/topic is selected;
otherwise the performance/certificate view opens. The returned workbook login
status is assigned but not enforced. Refresh failure alerts without clearing
the logged flag or navigating away.

Malformed progress follows unguarded JavaScript indexing rather than a recovery
contract. A negative integer skips the completion loop and later dereferences a
negative topic slot; a fractional value marks each lower integer slot complete
and later dereferences the fractional slot; both throw. `NaN` skips the loop and
the `< 171` branch, so it opens performance/certificate. A value greater than
171 throws when the completion loop reaches missing index 171. Exact 171 marks
all topics complete and opens performance/certificate.

Module/topic selection changes only DOM state. Module headers toggle their
topic containers; selecting a topic highlights it and selects content, test,
or feedback behavior from the visible topic text.

Current anchors: topic totals/state
[`state.js`](../apps/learning-platform/modules/course-content/state.js), DOM capture
[`dom.js`](../apps/learning-platform/modules/course-content/dom.js), initialization
[`application.js`](../apps/learning-platform/modules/course-content/application.js), and module/topic
selection [`navigation.js`](../apps/learning-platform/modules/course-content/navigation.js).

#### Content/video progress

`LP-STATE-CONTENT` loads the selected DASH manifest and immediately calls
`play()`. An open content node can be completed either by video `ended` or by an
immediately available “Completar e Continuar” control; watching the full video
is not required. An already completed video's `ended` handler opens the next
node without writing progress.

Completion clears the action strip, sets a wait cursor, increments the local
count, then sends `LP-API-UPDATE`. Success updates metrics and topic classes and
opens the next node. Failure restores the control and decrements only local
state. There is no refetch. Manual completion and `ended` share no in-flight
guard and can race into separate increments/writes.

Current anchors: player/completion
[`player.js`](../apps/learning-platform/modules/course-content/player.js), content/manual
control [`content.js`](../apps/learning-platform/modules/course-content/content.js), and
update flow [`progress.js`](../apps/learning-platform/modules/course-content/progress.js).

#### Assessments

`LP-STATE-ASSESSMENT` pauses video and shows the selected module's question
container. For an open test, it resets and enables answer controls **across all
modules**, then presents send → confirm/back. Confirm increments progress before
the request and calculates the fractional grade in the browser:

```text
max(0, (selected correct - selected incorrect) / total correct)
```

Correctness is exposed in DOM `query-id` values. There is no requirement that
every question be answered and no enforced assessment timer; visible guidance
only suggests reserving about 20 minutes within the session. Success writes the
client progress/module/grade, locks and colors answer controls globally, shows
grade and a client-derived percentile, updates the local grade/average, and
offers Continue. Failure restores Send and decrements local progress. Opening a
completed test clears and disables its answers rather than reconstructing the
submitted selection.

Current anchors: visible time guidance
[`index.html` line 1401](../apps/learning-platform/course-content/index.html#L1401), representative
correctness attributes
[`index.html` lines 1477-1519](../apps/learning-platform/course-content/index.html#L1477-L1519),
assessment flow [`assessment.js`](../apps/learning-platform/modules/course-content/assessment.js).

#### Feedback

`LP-STATE-FEEDBACK` pauses video, clears all feedback radios/comments, and
installs a 1000-character counter. No radio group is required. Missing
selections become `undefined` and their JSON properties are omitted. On submit
the client increments progress and supplies browser/workbook-derived identity,
browser-local date/time, DOM-derived module/rating strings, and comments.

Success updates local navigation and opens the next module/topic, or the
certificate view after module 10. Failure restores the button and decrements
only local progress. Because the backend writes progress before appending
feedback, `Erro_009` can leave persisted progress ahead of the restored client.
An ambiguous/repeated append can duplicate feedback.

The four current rating conventions are strings: module size uses `-2` through
`2`; content quality, platform quality, and printed-material quality use `6`
through `10`. Comments have only the browser `maxlength=1000` constraint.

Current anchors: feedback values and comment limit
[`index.html` lines 8745-8909](../apps/learning-platform/course-content/index.html#L8745-L8909), flow
[`feedback.js`](../apps/learning-platform/modules/course-content/feedback.js).

#### Performance, certificate, logout, and expiry

`LP-STATE-CERTIFICATE` is selectable before completion and displays grades from
client state. When progress is exactly 171, accumulated grade `< 0.70` is
ineligible, `0.70..<0.95` is approved, and `>= 0.95` is approved with honor.
The download container is shown at `>= 0.70`. The click handler itself is
assigned regardless of eligibility and builds the PDF entirely in the browser
from client-loaded name/grade/certificate ID and three local images. It embeds
the canonical certificate-validation URL and saves `CERTIFICADO - <name>.pdf`.
No certificate-generation backend call occurs.

Explicit logout and timer expiry both set only `Usuário_Logado = Não` and use
normal navigation to login. They do not remove the row handle, deadline,
registration authorization, photo mirror, or origin marker.

Current anchors: performance view and grade charts
[`performance.js`](../apps/learning-platform/modules/course-content/performance.js), certificate
eligibility/download binding
[`certificate.js`](../apps/learning-platform/modules/course-content/certificate.js), certificate
construction
[`certificate-renderer.js`](../apps/learning-platform/modules/course-content/certificate-renderer.js),
logout [`application.js`](../apps/learning-platform/modules/course-content/application.js), and
timer [`session-timer.js`](../apps/learning-platform/modules/course-content/session-timer.js).

### Status-report contract

The current report is a live workbook-backed view constructed once at page
load. It is not a stored report snapshot. The page has nine query parameters:

| Key | Parsing and display effect |
| --- | --- |
| `ne` | Raw company label; inserted into the title through `innerHTML`; not sent to or bound by the backend. |
| `nt` | Base-10 cohort/turma number; inserted into the title. |
| `li` | Base-10 starting returned-array row index; sent to backend and used in requested count. |
| `lf` | Base-10 inclusive ending row index; sent to backend and used in requested count. |
| `dua` | Raw update-date label; first eight characters display as `DD/MM/YYYY às 09:00`; not derived from workbook. Missing value throws on `.slice()` before fetch. |
| `idsr` | Exact lower-case `final` becomes `Final`; otherwise base-10 integer padded to at least two digits. |
| `mi` | Base-10 first module whose per-module chart remains visible. |
| `mf` | Base-10 last module whose chart remains visible; also chooses targets, titles, and notes. |
| `mrm` | Exact `consolidado` hides every target-label DOM slot except slot `número_linhas - 1`; every other value behaves as individual labels. Target labels are constant values and that retained slot is not semantically bound to a participant. |

For an absent key, `URLSearchParams.get()` supplies `null`. The company slot
then interpolates as `null`; `nt`, `li`, `lf`, `mi`, and `mf` parse to `NaN`;
missing `idsr` displays `NaN`; and `mrm=null` takes individual-label behavior.
Missing `dua` is the only absent-key case that throws before fetch because the
code calls `.slice()` on `null`. When execution reaches fetch with nonnumeric
row bounds, JSON serialization converts their `NaN` values to `null`.

After the width gate, the page inserts caller labels, builds 12 chart blocks
(progress, ten module grades, accumulated grade), hides module charts outside
`mi..mf`, and calls the public report API with the two row bounds. Each metric
sorts participants independently in descending order, so display order changes
between charts. The DOM has 15 value/name slots per chart. Larger ranges are
still fetched and affect scale/width calculations, but only 15 can render.
There is no polling; reloading performs a fresh workbook read.

Participant full name is not required for access. It is projected from every
selected row and used as the chart label; empty/null behavior is unvalidated.
There is no participant-name query parameter, nonempty-name validation, stable
participant identifier, company binding, or viewer-name requirement. The
approved future participant-named bearer link is therefore a new contract, not
a description of current access.

Current access is public. A caller chooses row positions and cosmetic labels;
the backend returns names, progress, ten module grades, accumulated grade, and
certificate IDs. The UI ignores returned certificate IDs, but direct callers
receive them. Wildcard CORS permits cross-origin reads. A forwarded page URL or
repeated direct API request has no secret, expiry, revocation, participant
binding, or company binding.

Current disclosure and integrity surfaces are:

- arbitrary row-range enumeration of live learner data;
- forwarding of indefinite public access through URL parameters;
- caller-supplied company/cohort/report/date/module labels that are never
  reconciled with the selected rows, enabling report spoofing;
- row-position links that can silently retarget after workbook insert/delete or
  reorder;
- `innerHTML` sinks for caller-controlled `ne`/date fragments and
  workbook-controlled participant names/progress values;
- an unrestricted range wider than the 15 rendered slots.

Current anchors: query parsing
[`query.js`](../apps/learning-platform/modules/status-report/query.js), title/chart
construction and sorting/rendering
[`charts.js`](../apps/learning-platform/modules/status-report/charts.js), live request/lifecycle
[`application.js`](../apps/learning-platform/modules/status-report/application.js),
backend projection
[`api-contracts.md` lines 822-855](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L822-L855).

### Runtime assets and resolution rules

The complete current centralized-origin platform set is the union below. Mappings
copy tracked source bytes without a bundle or generated-source layer.

| Source area → output suffix | Files | Complete set description |
| --- | ---: | --- |
| `device-warning/` → `aviso-dispositivo/` | 5 | `index.html`, `main.js`, `style.css`, `img/FAVICON.ico`, `img/LOGO_MACHADO.png` |
| `browser-warning/` → `aviso-navegador/` | 5 | Same five relative names as device warning |
| `initial-notices/` → `avisos-iniciais/` | 4 | `index.html`, `main.js`, `style.css`, `img/LOGO_MACHADO.png` |
| `azure-ai-vision-face-ui/` → `azure-ai-vision-face-ui/` | 85 | Face component, 75 dictionaries, five images, regular/SIMD JS and WASM pairs |
| `photo-registration/` → `cadastro-foto/` | 5 | `index.html`, `main.js`, `style.css`, `img/LOGO_MACHADO.png`, `img/REFERÊNCIAS_FOTOS.png` |
| `course-content/` → `estudo/` | 41 | HTML/JS/CSS, 33 study files, five images |
| `login/` → `login/` | 6 | HTML/JS/CSS, favicon, logo, unused duplicate `Brightness.svg` |
| Canonical `modules/` → matching `modules/` paths | 26 | Nine top-level modules, 14 `course-content/` responsibility modules, and three `status-report/` modules retain their source-relative suffixes |
| `status-report/` → `statusreport/` | 5 | HTML/JS/CSS, favicon, logo |
| **Current total** | **182** | Canonical output root is `dist/plataforma/` |

The historical phase-A set added 15 temporary JavaScript compatibility outputs
to this union, for 197 platform files and 51 JavaScript files. The current set
contains 7 CSS, 7 HTML, 36 JS, 75 JSON, 2 WASM, 11 PNG, 5 ICO, 5 SVG, 1 JPG,
19 XLSM, 11 XLSX, 2 VSDX, and 1 VSSX. The exact tracked source listing is
reproducible with:

```powershell
git -c core.quotepath=false ls-files -- apps/learning-platform
```

All 182 current output paths are NFC. Thirty-four contain non-ASCII characters:
the photo-registration reference image and all 33 course-content download
paths. Exact case, spaces, punctuation,
accents, and normalization form are runtime contracts. The build rejects
case/NFC collisions and verifies the exact generated spelling and bytes.

The retired legacy set is exactly
`/plataforma/modules/registration.js` and
`/plataforma/modules/study/{application,assessment,certificate-renderer,certificate,content,dom,downloads,feedback,navigation,performance,player,progress,session-timer,state}.js`.
Phase A published all 15 as temporary support assets. The current manifest emits
none of them and declares every URL as an explicit `404`; production must verify
the same no-redirect outcome before the deployed-path roadmap step can close.

#### Azure Face UI 1.5.0

The vendored component self-identifies client SDK version `1.5.0`. Its complete
subtree is:

- `FaceLivenessDetector.js` (24,604 bytes);
- 75 `en.json` dictionaries (337,183 bytes): root `i18n/en.json`, plus
  `i18n/<locale>/en.json` for `af-ZA`, `am-ET`, `ar-SA`, `as-IN`, `az-Latn-AZ`,
  `bg-BG`, `bn-IN`, `bs-Latn-BA`, `ca-ES`, `cs-CZ`, `da-DK`, `de-DE`, `el-GR`,
  `en-GB`, `en-US`, `es-ES`, `es-MX`, `et-EE`, `eu-ES`, `fa-IR`, `fi-FI`,
  `fil-PH`, `fr-CA`, `fr-FR`, `ga-IE`, `gl-ES`, `gu-IN`, `he-IL`, `hi-IN`,
  `hr-HR`, `hu-HU`, `id-ID`, `is-IS`, `it-IT`, `ja-JP`, `ka-GE`, `kk-KZ`,
  `km-KH`, `kn-IN`, `ko-KR`, `lo-LA`, `lt-LT`, `lv-LV`, `mk-MK`, `ml-IN`,
  `mr-IN`, `ms-MY`, `nb-NO`, `ne-NP`, `nl-NL`, `nn-NO`, `or-IN`, `pa-IN`,
  `pl-PL`, `pt-BR`, `pt-PT`, `ro-RO`, `ru-RU`, `sk-SK`, `sl-SI`, `sq-AL`,
  `sr-Cyrl-RS`, `sr-Latn-RS`, `sv-SE`, `ta-IN`, `te-IN`, `th-TH`, `tr-TR`,
  `ug-CN`, `uk-UA`, `ur-PK`, `vi-VN`, `zh-CN`, `zh-TW`;
- images `Brightness.svg`, `FaceId.svg`, `Smile.svg`,
  `activeMotionVisualHint.png`, and `logo.svg` (45,068 bytes total);
- regular engine `AzureAIVisionFace.js` (149,366 bytes) and
  `AzureAIVisionFace.wasm` (4,365,378 bytes);
- SIMD engine `AzureAIVisionFace_SIMD.js` (149,873 bytes) and
  `AzureAIVisionFace_SIMD.wasm` (4,455,257 bytes).

The component probes SIMD with `WebAssembly.validate`, chooses the SIMD engine
when supported and the regular engine otherwise, and resolves the corresponding
WASM beside the chosen JS. It loads images and dictionaries with relative
`./facelivenessdetector-assets/...` paths. Login and registration set locale
`pt-BR`, so their current dictionary is `i18n/pt-BR/en.json`.

The Face loading presentation preserves the vendor's existing white loader,
three-dot animation and timing, and exact `pt-BR` `AZAIF_FeedbackStarting` copy
`Iniciando...`. Application-owned login and registration CSS makes that white
loading surface fill the browser viewport and applies the company color
`#4a0816` to the blinking dots. The native brightness-confirmation checkbox is
inside the SDK's Shadow DOM, so the same color is applied as an inherited
`accent-color` on the `azure-ai-vision-face-ui` custom-element host. The SDK's
completion progress circle and final check are SVG strokes hard-coded inside
the same closed Shadow DOM. Before mounting the Face element, the shared startup
seam wraps that instance's first `attachShadow` call, preserves the vendor's
`{ mode: "closed" }` option, and adopts an application-owned constructed
stylesheet that applies `#4a0816` to `#spinnerCheck #circle` and
`#spinnerCheck #tick`. These rules do not replace localized copy or edit any
vendor asset; the complete vendored Face subtree remains byte-identical.

These presentation rules live outside the vendored subtree, so replacing the
SDK cannot overwrite them. Their runtime effect still depends on the SDK
retaining its body-mounted loader and a native checkbox that inherits its accent
from the custom-element host. The completion treatment also depends on the SDK
retaining its single closed-root `attachShadow` call and the current completion
circle/tick selectors. A future SDK that changes those hooks, overrides the
accent inside its Shadow DOM, or defeats an application rule's specificity
requires explicit compatibility review. `FACE-01` freezes those hooks and the
entire vendor digest so that such an update fails tests instead of silently
losing the presentation.

Both entry HTML files set
`<base href="/plataforma/azure-ai-vision-face-ui/">`. Their own CSS, images,
and module scripts are root-relative, while the vendor's relative dynamic
requests resolve through this base. Removing or moving the base without an
equivalent resolution seam breaks engine, WASM, image, and locale loading.

The copy of `login/img/Brightness.svg` is byte-identical to the vendor image and
has no source reference. The device and browser warning subtrees each emit an
own favicon, but both HTML entries deliberately reference the login favicon.

Current anchors: production Face imports in login
[`main.js`](../apps/learning-platform/login/main.js) and registration
[`main.js`](../apps/learning-platform/photo-registration/main.js), shared locale/construction/mount/start
[`face-startup.js`](../apps/learning-platform/modules/face-startup.js), base tags
at login [`index.html` lines 9-11](../apps/learning-platform/login/index.html#L9-L11) and
registration [`index.html` lines 9-11](../apps/learning-platform/photo-registration/index.html#L9-L11),
vendored paths/version/selection
[`FaceLivenessDetector.js` line 1](../apps/learning-platform/azure-ai-vision-face-ui/FaceLivenessDetector.js#L1),
application-owned completion-circle/check seam in
[`face-startup.js`](../apps/learning-platform/modules/face-startup.js), full-viewport
loader, dot-color, and checkbox overrides in login
[`style.css`](../apps/learning-platform/login/style.css) and registration
[`style.css`](../apps/learning-platform/photo-registration/style.css), and the preserved
localized loading copy in
[`facelivenessdetector-assets/i18n/pt-BR/en.json` line 4](../apps/learning-platform/azure-ai-vision-face-ui/facelivenessdetector-assets/i18n/pt-BR/en.json#L4).

#### Study downloads and certificate assets

The course-content source subtree emits 33 download files (9,163,893 bytes). Dynamic source has
34 `href` assignments resolving to 31 unique files, with no missing target. Two
emitted files have no current runtime reference: `Módulo 3/PLANO DE AÇÃO
(CLÁUDIA).xlsm` and `Módulo 4/GRÁFICO CONTROLE DE RESULTADOS - Copia.xlsm`.

The complete exact inventory, relative to
`apps/learning-platform/course-content/files/`, is:

The English rename stops at the `course-content` source directory. Every nested
`Módulo *` directory and downloadable filename remains unchanged because those
names are preservation-critical public content. The explicit `course-content` to
`plataforma/estudo` mapping therefore retains every emitted download path and
byte exactly.

| Directory | Exact filenames |
| --- | --- |
| `Módulo 2/` | `PLANO DE AÇÃO (CLÁUDIA).xlsm`; `PLANO DE AÇÃO (RODRIGO).xlsm`; `PLANO DE AÇÃO.xlsm` |
| `Módulo 3/` | `BD TRATADA.xlsx`; `Boyá-Arquitetura-Campaigns-Jul-01-2035-Jul-31-2035.xlsx`; `PLANO DE AÇÃO (CLÁUDIA).xlsm` (unreferenced) |
| `Módulo 4/` | `AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx`; `AN. FUNCIONAL (VALOR MÉDIO INDENIZADO).xlsx`; `BD DESLIGAMENTOS (2032-10 A 2034-10).xlsx`; `BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx`; `BD INDENIZAÇÕES (2033-01 a 2034-10).xlsx`; `BD INDENIZAÇÕES (2034-06 A 2035-01).xlsx`; `GRÁFICO CONTROLE DE RESULTADOS - Copia.xlsm` (unreferenced); `GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 1.xlsm`; `GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 2.xlsm`; `GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 1.xlsm`; `GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 2.xlsm`; `GRÁFICO CONTROLE DE RESULTADOS.xlsm` |
| `Módulo 5/` | `AN. FENÔMENO (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx`; `BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx`; `GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS) - REVISADO.xlsm`; `GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm`; `GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO) - REVISADO.xlsm`; `GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO).xlsm`; `GRÁFICO CONTROLE DE RESULTADOS 2035-02-17 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm`; `PLANO DE AÇÃO (DAVI).xlsm`; `PLANO DE AÇÃO (SAMARA).xlsm` |
| `Módulo 7/` | `PLANO DE AÇÃO (RAFAEL).xlsm` |
| `Módulo 8/` | `PLANO DE AÇÃO (RAFAEL).xlsm` |
| `Módulo 9/` | `SIMBOLOGIA FOPs (BPMN).vssx`; `TEMPLATE FOP (A2).vsdx`; `TEMPLATE FOP (A3).vsdx`; `TEMPLATE POP (A4).xlsx` |

The exact topic-to-download rules, preserving slot order, are:

- Módulo 2: `8. PRIORIDADE` → `PLANO DE AÇÃO.xlsm`;
  `10. PLANO DE AÇÃO CLÁUDIA` → `PLANO DE AÇÃO (CLÁUDIA).xlsm`;
  `13. RACIOCÍNIO` → `PLANO DE AÇÃO (RODRIGO).xlsm`.
- Módulo 3: `2. ANÁLISE DO FENÔMENO` →
  `Boyá-Arquitetura-Campaigns-Jul-01-2035-Jul-31-2035.xlsx`;
  `4. ANÁLISE DO FENÔMENO` → `BD TRATADA.xlsx`.
- Módulo 4: `7. CÁLCULO DE METAS` →
  `BD INDENIZAÇÕES (2033-01 a 2034-10).xlsx`,
  `AN. FUNCIONAL (VALOR MÉDIO INDENIZADO).xlsx`;
  `9. CÁLCULO DE METAS` →
  `BD DESLIGAMENTOS (2032-10 A 2034-10).xlsx`,
  `AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx`;
  `12. PREPARAR GRÁFICOS DE CONTROLE` →
  `GRÁFICO CONTROLE DE RESULTADOS.xlsm`,
  `AN. FUNCIONAL (VALOR MÉDIO INDENIZADO).xlsx`,
  `BD INDENIZAÇÕES (2034-06 A 2035-01).xlsx`,
  `GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 1.xlsm`;
  `14. PREPARAR GRÁFICOS DE CONTROLE` →
  `GRÁFICO CONTROLE DE RESULTADOS.xlsm`,
  `AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx`,
  `BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx`,
  `GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 1.xlsm`;
  `15. FAZER A REUNIÃO DE NÍVEL` →
  `GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 2.xlsm`,
  `GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 2.xlsm`.
- Módulo 5: `1. ANÁLISE DO FENÔMENO` →
  `BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx`,
  `AN. FENÔMENO (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx`;
  `5. PLANO DE AÇÃO` → `PLANO DE AÇÃO (DAVI).xlsm`,
  `PLANO DE AÇÃO (SAMARA).xlsm`,
  `GRÁFICO CONTROLE DE RESULTADOS 2035-02-17 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm`;
  `8. PREPARAR GRÁFICOS DE CONTROLE` →
  `GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm`,
  `GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO).xlsm`;
  `9. FAZER REUNIÃO DE NÍVEL` →
  `GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS) - REVISADO.xlsm`,
  `GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO) - REVISADO.xlsm`.
- Módulo 7: `10. PADRONIZAÇÃO - CONSTRUIR O PADRÃO` →
  `PLANO DE AÇÃO (RAFAEL).xlsm`.
- Módulo 8: `9. TREINAMENTO - COMO ACONTECE` →
  `PLANO DE AÇÃO (RAFAEL).xlsm`.
- Módulo 9: `5. FOPs - BOAS PRÁTICAS` → `TEMPLATE FOP (A3).vsdx`,
  `TEMPLATE FOP (A2).vsdx`, `SIMBOLOGIA FOPs (BPMN).vssx`;
  `9. POPs - BOAS PRÁTICAS` → `TEMPLATE POP (A4).xlsx`.

Download controls are four placeholder anchors whose root-relative paths under
`/plataforma/estudo/files/<module>/<filename>` and visibility are reassigned for
exact module/video-name pairs. Every other video hides all four controls. The
same `BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx` content occurs under modules 4
and 5 as two distinct public paths.

No certificate PDF/template file is stored. jsPDF builds it in the browser from
`/plataforma/estudo/img/LOGO_MACHADO_CERTIFICADO.jpg`,
`/plataforma/estudo/img/ASSINATURA.png`, and
`/plataforma/estudo/img/ATLAS.png`. The JPG logo is passed to jsPDF with the
legacy format label `PNG`. Study also uses `FAVICON.ico` and
`LOGO_MACHADO.png`.

Current anchors: download placeholders
[`index.html` lines 1353-1377](../apps/learning-platform/course-content/index.html#L1353-L1377),
assignment matrix
[`downloads.js`](../apps/learning-platform/modules/course-content/downloads.js), certificate
library/UI [`index.html` lines 9085-9111](../apps/learning-platform/course-content/index.html#L9085-L9111),
certificate construction
[`certificate-renderer.js`](../apps/learning-platform/modules/course-content/certificate-renderer.js).

### Video and DRM contract

There are exactly ten modules, 151 unique content/video topics, ten tests, and
ten feedback topics: 171 contiguous `data-index` values. Each content topic's
exact HTML `name` is its remote video key. The navigation seam stores the exact
folder `Módulo N` in the explicit study state; the manifest rule is:

```text
<selected namespace>/Módulo N/<exact topic name>_dash.mpd
```

Spaces, periods, uppercase letters, accents, and punctuation in those names are
remote object-name contracts. The source has no separate video map.

| Module | Videos | Total nodes | `data-index` range | Current exhaustive HTML span |
| ---: | ---: | ---: | --- | --- |
| 1 | 11 | 13 | 1-13 | `course-content/index.html:102-162` |
| 2 | 15 | 17 | 14-30 | `course-content/index.html:205-285` |
| 3 | 19 | 21 | 31-51 | `course-content/index.html:328-430` |
| 4 | 18 | 20 | 52-71 | `course-content/index.html:471-568` |
| 5 | 17 | 19 | 72-90 | `course-content/index.html:609-701` |
| 6 | 8 | 10 | 91-100 | `course-content/index.html:742-789` |
| 7 | 12 | 14 | 101-114 | `course-content/index.html:830-897` |
| 8 | 22 | 24 | 115-138 | `course-content/index.html:938-1055` |
| 9 | 17 | 19 | 139-157 | `course-content/index.html:1096-1188` |
| 10 | 12 | 14 | 158-171 | `course-content/index.html:1230-1297` |

The protected media namespace is the remote `videosv3/plataforma_v2/` branch;
the bypass namespace is sibling `videosv3/plataforma_v2_sem_drm/`. Default is
protected. A hard-coded allowlist of five exact participant names selects the
bypass branch. The names are personal data and are intentionally not repeated
here; the source anchor is compatibility evidence. Both branches use DASH.

Shaka Player 4.6.0 supplies playback. On the first content-topic open in a page
lifetime (`playerLoaded === false` in the player seam), the code creates one
retained player and UI overlay, attaches them to the video element, and
configures controls for play/pause, time/duration, mute, volume, quality,
playback rate, and fullscreen with an empty overflow menu. If the protected
branch is active, that first initialization configures PlayReady against a
hard-coded credential-bearing EZDRM preauthorization role. The credential is
not reproduced here. No Widevine, FairPlay, ClearKey, explicit ABR, rendition,
codec, bandwidth, buffer, or error policy appears.

The companion backend also exposes public
`GET /ezdrm-playready-authorization-url`, but no current `sistemas` source calls
it: the platform uses its separate direct third-party PlayReady configuration.
That backend route is therefore an integration boundary outside the eight
observed platform/backend operations above, not a ninth current browser call.
Pinned companion evidence:
[`api-contracts.md` lines 797-821](https://github.com/IvyRoom/backend/blob/65761539b1fc998e66be383248269270ff2c90a9/docs/api-contracts.md#L797-L821).

The same player is retained for every topic. Each open calls `load(manifest)`
then video `play()`. Polyfill installation and browser-support checking run for
every topic. There is no explicit player unload/destroy or error listener.
Tests, feedback, and performance/certificate views pause the video. Media load
and autoplay promise failures are not caught by the caller.

Adaptive-rendition discovery and selection are delegated to Shaka and the
remote MPD. Source exposes the quality control and otherwise leaves Shaka
defaults. This characterization did not fetch manifests or segments, so it
does not assert ladder widths, bitrates, codecs, segment naming, or the number
of renditions.

Current anchors: module folder/topic behavior
[`navigation.js`](../apps/learning-platform/modules/course-content/navigation.js) and
[`content.js`](../apps/learning-platform/modules/course-content/content.js); player
lifecycle/completion [`player.js`](../apps/learning-platform/modules/course-content/player.js);
source-derived protected/bypass policy remains in the production
[`main.js`](../apps/learning-platform/course-content/main.js); external
libraries [`index.html` lines 10-12](../apps/learning-platform/course-content/index.html#L10-L12)
and [`index.html` lines 9109-9113](../apps/learning-platform/course-content/index.html#L9109-L9113).

### Deployment artifact and whole-tree digest

The mapping copies tracked bytes; it performs no bundling, minification, or
transformation. The exact phase-A baseline at commit
`db0cd73d09b4163060594003b9365e7c0e9fda83` mapped 182 unique platform source
files to 197 outputs by copying 15 module sources a second time at their former
paths. That historical compatibility artifact has these identities:

| Historical phase-A scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma/...` | 197 | 20,760,016 | `ad69a58a20b537cd016b813052c5fd07954869b3f44b1d1f92f5f4aa4cb2deec` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 197 | 20,760,016 | `de2b9ca63f5449a4fc0291aca7774d1abf9b475fd17a07adf50733d45812798a` |
| Complete generated `dist/` artifact | 272 | 27,365,051 | `e394735cbde354c093331e95806739dd85951146b23a6973f09fd4a66d158454` |

The completed phase-B manifest removed the 15 compatibility outputs without
changing the then-current canonical source bytes. Its historical identities at
the verified implementation base are:

| Historical phase-B scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma/...` | 182 | 20,693,467 | `25f18cb7306246bb5a4b63efc8046365c50da381c3e10d33e55cf3f1021dd605` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 182 | 20,693,467 | `21ea67296d7fc40555033f4fbe181937b2f3b2a5c869aa38e2b2eab00e67ebcb` |
| Complete generated `dist/` artifact | 257 | 27,298,502 | `166506b93b3477a175851a089360631894b0a67e9fa3fc9bdab4bd8b5b185561` |

The direct phase-A-to-phase-B comparison removed exactly the 15 named legacy
outputs and their 66,549 bytes. It adds no output. All 257 remaining complete
artifact paths—including all 182 platform paths—retain the same canonical
source path and byte-identical content.

The centralized-origin change preserves all 257 application output paths,
changes only the scoped JavaScript and four required classic-script bootstrap
documents, and adds the separately mapped `shared/backend-origin.js` runtime
file. The current identities are:

| Current centralized-origin scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Complete generated `dist/` artifact | 258 | 27,298,025 | `91ee00d6a05618203c27979094b6916386bb15eb4ea85cadad853bb0c53d1e0c` |
| Shared runtime mapping | 1 | 81 | `c38658b6f2c16b3980f1bd8f739a91e873e652e32c74d122fd4c944c129c3f1d` |
| Platform subset, retaining full output paths `plataforma/...` | 182 | 20,693,440 | `6035b003a2c781fc5632eebf4dd02bfdc03559dab1be2715fe15ef04562b2689` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 182 | 20,693,440 | `6a4ac5f79c6e26d5882bb48a3e707e4e7820da7983c47efd3cabadfd9f9a0a26` |
| Platform JavaScript, retaining full output paths | 36 | 440,984 | `dbc04f14f6f88ea7bb3e7c8d81049e4ac6a678d84d588b7721bd1223d724fd4a` |
| Study entry subtree, retaining full output paths | 41 | 9,990,876 | `3b3ac0a4fcea4a82ba6e668fe33ab8f2a8853014f32ae6883c3e8651e0ab9233` |
| Four public API applications, retaining full output paths | 20 | 736,448 | `1a2e16ce19f831ad36c4ffcfa9611122194d956ee70c929ea264cfd632a8aed1` |
| All non-platform applications, retaining full output paths | 75 | 6,604,504 | `12e1bdf1e23f3dbbc7657cefde9a3a69425e7e7241ea023b20e789b4701a0110` |

The compatibility copies are JavaScript only, so phase A and phase B share the
same scoped non-JavaScript identities. The non-JavaScript digest changes from
the pre-alignment baseline because registration HTML bytes and the registration
HTML, CSS, and image output paths change; the binary digest changes because the
two registration image paths move. The path-stable non-JavaScript, binary,
Face, download, and certificate scopes remain unchanged:

| Current aligned scoped identity | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform non-JavaScript files, retaining full output paths | 146 | 20,252,456 | `47fac3283dd961c7e2bffff0d029cc468e2f66c6e80bc4c36088e1916db3cd1f` |
| Platform binary files, retaining full output paths | 52 | 19,319,394 | `afd12f0746dd5463077e8d9a879fb852b1ebfd81686afe7ca0b9f63fdf804563` |
| Vendored Face subtree, paths relative to its root | 85 | 9,526,729 | `56da181049f18302b00fdbf04851d1433adf819341564a326e652c75145576e3` |
| Study downloads, retaining full output paths | 33 | 9,163,893 | `1073822d29815c0d23e984c347b70c468235be47083b7ce5c23b33565a0dece5` |
| Certificate inputs, source-derived `addImage` order | 3 | 148,461 | `82c735c7ac2fa32e09d71c326765db9c52ce63b58144c7c7b100458f8b897591` |

The exact pre-alignment baseline at commit
`19dacfa870d691e5869a022652fb24f2a8ba8e5f` produced these identities:

| Pre-alignment scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma/...` | 182 | 20,693,391 | `bc453ef0a25080d654b2fd8a24eba17224b41049ceacb6df6dd23b049875a050` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 182 | 20,693,391 | `3012efb9be58584876d44e2431b0e19851da71f131daf4e1fa21d4ff0892705a` |
| Complete generated `dist/` artifact | 257 | 27,298,426 | `c9323ac5b7a70283d34a94f26478a99eddb3209e79da19d78985a2bc644c200b` |
| Platform non-JavaScript files, retaining full output paths | 146 | 20,252,436 | `1df6bd6de3e16a58ff8f65500c4aedde241d87237fb4a826c238bdf14b6aa13e` |
| Platform binary files, retaining full output paths | 52 | 19,319,394 | `8703d7811a1d91db3069b55c0d17b87dbda9cfc754613ac6c44d172d668c4394` |

The historical phase-B counts equal that baseline and its aligned URL/import
strings add exactly 76 bytes: 20 HTML bytes and 56 JavaScript bytes. Phase A
then added 15 compatibility files containing 66,549 duplicate bytes, for 15 more
files and 66,625 more bytes than the pre-alignment baseline.

The per-file comparison accounts for the complete phase-A artifact. Exactly
five former `plataforma/cadastro/` outputs are removed and 20 outputs are added:
their five `plataforma/cadastro-foto/` replacements plus the 15 canonical
module paths. Of the 252 paths common to the baseline and phase A, 250 retain
identical bytes; only `plataforma/estudo/main.js` and
`plataforma/modules/initial-notices.js` contain the expected import/navigation
changes. Across the 20 old-to-new path pairs, 18 retain identical bytes; the
registration `index.html` and `main.js` replacements contain their expected
20-byte and 6-byte deltas. All 15 phase-A legacy module outputs were also
byte-identical to their baseline versions.

For dual-reading-adapter comparison, the verified base at commit
`9ff6b61a4bfdcd2cfd511cc406d16b5984577266` produced these identities:

| Dual-reading adapter scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma/...` | 182 | 20,694,259 | `46714330081562637fa6ccb0d226836448cf6997e496f7bee5452625a581db13` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 182 | 20,694,259 | `9228356ddbe9484f12d36a239f27738f6b6dad2dde9c1477fbd0377f3fc591a2` |
| Complete generated `dist/` artifact | 257 | 27,299,294 | `8866fe67fb110e748ba7b0bbd5c9fbd40397f8b437274d069ff321e530bd2750` |

For pre-adapter comparison, the verified post-English-internals baseline at
commit `be8e52fc248d073503b8e71abe5afb9e93a4d5f9` produced these identities:

| Post-English-internals, pre-adapter scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma/...` | 180 | 20,673,868 | `54e1d31293844e22ad8f20ff5fb19bad30d7436bc91e7af1842f51fb1e6da015` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 180 | 20,673,868 | `bac09370ab28b2b105fd6753852f5c606c82812783af36d486f1257f4817816a` |
| Complete generated `dist/` artifact | 255 | 27,278,903 | `27e74781d83b39a8ec7085802cfc5b763f2ea04f941b00cc728f0049e53f20ff` |

For pre-English-internals comparison, the verified base at commit
`48579a49e50f866d462aa05a868654564b4f121c` produced these identities:

| Pre-English-internals scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma/...` | 180 | 20,674,761 | `13fe98c38c172205aafa6a0f0875c701462bdeaf70d562658e2632a0bfe9fd4e` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 180 | 20,674,761 | `19cd19514b1cfa0bf9f5d842886f8a7b31c17f6489b696f7d7787feeac257eb2` |
| Complete generated `dist/` artifact | 255 | 27,279,796 | `fd1b51781d70942451fabd14843ec1cee3b80dbdb30ce81940f58b679fd02ec5` |

For pre-modernization comparison, the verified post-adoption baseline at
commit `52adf0ff6c4646a15a7950f50f9bcb5fecb01490` produced these identities:

| Post-adoption, pre-modernization scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma/...` | 156 | 20,708,799 | `10dee6c96d402149bd3ffe66cff96058ec4ed2de1561998f10e1444c67868b15` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 156 | 20,708,799 | `7accfa3b272fbdf039ea29049858ac351cab245bf5bfc062b938769c7be01dd5` |
| Complete generated `dist/` artifact | 231 | 27,313,834 | `21b0c501fd32ebce8678b8970aa30c3cb173d7119ed527d9e0b47037a1599991` |

For pre-adoption comparison only, commit
`38b8d27f272dc13c549d895df174af8622829827` produced the following historical
artifact identities:

| Pre-adoption scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma_v2/...` | 156 | 20,709,083 | `6b7ae5adbd00b9f5a1319aaf9c86aeaef9e688217ce452b3ce018ebe8770bb4b` |
| Platform subtree rooted at `dist/plataforma_v2` (prefix omitted; diagnostic only) | 156 | 20,709,083 | `6eb7b6d8c46e43d570e4cffff251377cd7496ff17a4c03dfe5ae69d642a3c9ba` |
| Complete generated `dist/` artifact | 231 | 27,314,121 | `cb23b90f85e8d2dbc4d440f1547c42ab4a6164cfd53a0af25bd8b2155e9da81f` |

Within each snapshot, the two platform digests differ only because the digest
includes path bytes. Use the first when comparing a platform subset within the
whole artifact.

The repository digest procedure ordinal-sorts relative output paths. For each
file it updates SHA-256 with UTF-8 bytes in this exact sequence:

```text
<UTF-8 path byte length>:<UTF-8 path bytes>:<content byte length>:<content bytes>
```

The build enumerates tracked files under each mapping, rejects normalized
output collisions, copies bytes, asserts the exact generated file set, then
computes this digest. Artifact checking separately asserts exact case/path set
and byte equality against every mapped source.

The platform has seven manifest `publicEntries` and zero `publicDownloads`.
The current platform artifact therefore has 175 emitted
supporting/runtime files rather than individually enumerated public contracts;
historical phase A had 190. All 33 study downloads, the entire Face subtree,
JS/CSS/images, and certificate inputs remain implicit support files. The 15
temporary compatibility modules are no longer published and instead belong to
the explicit negative-path contract. Across the complete frontend, 12 entry
files plus 3 public downloads and 243 support files make the 258-file artifact.
The separate shared mapping and the nine learning-platform mappings make ten
combined runtime mappings, without classifying shared infrastructure as an
application. Source and generated previews each resolve exactly 77 JavaScript
imports.
Remote CDN libraries and all media manifests/segments remain outside it.

Current anchors: mapping collection
[`frontend-deployment-lib.mjs` lines 309-358](../scripts/frontend-deployment-lib.mjs#L309-L358),
digest framing
[`frontend-deployment-lib.mjs` lines 378-426](../scripts/frontend-deployment-lib.mjs#L378-L426),
build/copy/set checks
[`frontend-deployment-lib.mjs` lines 429-478](../scripts/frontend-deployment-lib.mjs#L429-L478),
platform `publicDownloads`
[`frontend-deployment.json`](../frontend-deployment.json).

## Known risks and unresolved legacy behavior

This section records observed weaknesses and contradictions. It is evidence for
future work, not permission to change compatibility behavior in the baseline.

### Routing, browser, and lifecycle risks

- Canonical deployment entries end in `/`, while every application navigation
  target omits it. Repository tooling accepts both locally but does not prove
  how the production host redirects, preserves, or rejects slashless paths.
- The Edge gate depends on mutable user-agent strings. The browser-warning
  page also dereferences `navigator.userAgentData.brands` without the optional
  guard used elsewhere, so browsers without that API can fail before rendering
  its decision.
- The `<= 1024` boundary is a hard redirect rather than a responsive state.
  Returning relies on one browser-history entry whose viewport is now
  `> 1024`; direct visits and repeated resize transitions have no alternate
  recovery path.
- Several pages perform redirects from asynchronously loaded module scripts.
  Script-load failure, back/forward cache restoration, and closely spaced
  resize/navigation events have no explicit state machine or recovery.
### Session and authorization risks

- User identity, photo state, notice progression, deadline, and navigation
  origin are browser-writable UI flags. They must not be interpreted as
  authorization or authoritative progress evidence.
- `IndexVerificado` is a signed four-hour authorization handle, but logout only
  changes `Usuário_Logado`; it does not clear, revoke, or rotate the handle.
  Refresh neither changes the stored client-session deadline nor returns or
  rotates the handle; it separately returns the workbook access-deadline field
  for display/state.
- No flow calls `sessionStorage.removeItem()` or `.clear()`. Stale identity,
  deadline, URL, and Face flags survive application logout for the rest of the
  tab session and can affect later navigation.
- Deadline enforcement trusts the client clock and a parseable stored value.
  A missing key becomes numeric zero and expires on the first timer tick; only
  malformed nonnumeric text produces `NaN` comparisons, a broken display, and
  no explicit invalid-session transition.
- Protected calls put the handle in request bodies or multipart fields, never
  an `Authorization` header. Logs, parsers, and application instrumentation
  therefore require special care not to disclose it.

### Login, Face, and request-seam risks

- Login handles only its expected status branches; unexpected responses can
  leave the page in an indeterminate loading/error state. Protected consumers
  generally collapse a `401 {}` response into `Erro_000`, hiding expiration or
  authorization loss from the user.
- Fetch transport mechanics use the shared platform-client and semantic error
  seams, and visible copy uses the application catalog. Flows deliberately
  still parse JSON before checking status and retain the raw HTTP
  `{ status, error }` throw at that boundary. They still have no timeout,
  cancellation, centralized operator redaction, or private diagnostic/trace
  correlation layer.
- Face registration trusts client-selected copy and image input. Multipart
  parsing precedes authorization verification in the backend registration
  route, so unauthenticated input can consume upload-processing resources.
- Face registration has multiple durable steps: store photo, set workbook
  registration state, create the Face session, and make one result lookup.
  Failure between them
  can leave a photo or flag committed without a completed client transition.
- Face verification session creation is protected, but its single result lookup
  is public to anyone who knows a session identifier. User repeats plus backend
  application/SDK retries can span non-idempotent external work and expose
  long, retry-visible waits without a user-controlled request cancel operation.
- The Face bundle, locale, engine, WASM, and image resolution depends on the
  current `<base>` contract. A source move that changes that resolution can
  break Face startup without changing import text.

### Study, progress, assessment, feedback, and certificate risks

- Module completion is optimistic. Content can be completed from the always
  available button or from `ended`; closely spaced events can race. Failure
  rolls the local count back but cannot establish whether a remote write
  happened before a transport failure.
- Progress identity, completion count, assessment grade, feedback identity,
  feedback date, and feedback module are client-supplied fields. The current
  seams do not make the browser an authoritative source for any of them.
- Study initialization applies `parseFloat` to progress without requiring a
  finite integer in `0..171`. Negative, fractional, `NaN`, and greater-than-171
  values can produce inconsistent open-node or out-of-bounds behavior.
- Assessment correctness and accumulated score are computed from mutable DOM
  state. Reset, disable, and answer-color selectors mutate controls across all
  modules, while score queries do filter answers to the selected module. No
  server-side answer authority, time limit, dedupe key, or attempt identity is
  visible in the current contract.
- Feedback first updates workbook progress and then appends the feedback row.
  If append fails, progress remains committed. Retrying may append a duplicate
  because there is no client or backend idempotency key.
- The visible Module 3 feedback form is named `FEEDBACK MÓDULO 2`; current
  parsing therefore submits it as module 2. This is an unresolved source bug,
  deliberately preserved as baseline evidence. Current anchors:
  [`index.html` lines 423-430](../apps/learning-platform/course-content/index.html#L423-L430)
  and [`feedback.js`](../apps/learning-platform/modules/course-content/feedback.js).
- The certificate is generated wholly in the browser from workbook-derived and
  client-held values. Eligibility, name, score, and rendered certificate ID can
  be manipulated locally; validation remains a separate external concern. A
  JPG logo is passed to jsPDF with a `PNG` type label.
- Two emitted workbooks are unreachable from the current download assignment
  table. All 33 downloads are published implicitly even though none is listed
  in `publicDownloads`.

### Status-report risks

- The status-report API is public under wildcard CORS and discloses live
  workbook-derived participant names, progress, ten module grades, accumulated
  grade, and certificate identifiers for caller-selected row bounds in the
  fixed platform workbook.
  The UI ignores certificate identifiers, but the API still returns them.
- Links are bearer-like and trivially forwardable. There is no participant-name
  challenge, viewer authentication, expiration, revocation, recipient binding,
  or audit signal in the current client contract.
- The caller controls displayed company label, participant row bounds, report
  identifier, module range, and report mode. Values are not bound
  together by a signed server-side report definition, enabling disclosure and
  report-spoofing combinations.
- Caller-controlled `ne`, workbook-derived names/progress, and selected `dua`
  fragments reach `innerHTML`. Untrusted workbook or URL content can therefore
  become DOM injection. Missing `dua` throws before fetch; malformed present
  values render nonsensical fragments.
- A source comment describes `mrm` with short codes, but behavior tests exact
  `consolidado`; this contradiction is frozen as current runtime truth.
- Row position is the participant selector. Workbook insertion, deletion, or
  reordering can change which participant a saved link reveals. More than 15
  selected rows exceed the page's fixed participant-column assumptions.

### Runtime and media risks

- Shaka, Shaka UI, and jsPDF execute from public CDNs without Subresource
  Integrity metadata. Their availability and bytes are outside the artifact.
- A hard-coded five-name allowlist chooses non-DRM media and embeds participant
  personal data in source. The PlayReady setup also contains a hard-coded
  credential-bearing EZDRM endpoint. Neither literal is reproduced here.
- Player load/autoplay failures are not caught, and the retained player has no
  explicit unload/destroy lifecycle. The remote MPD controls rendition details
  that this repository cannot validate offline.
- The Face SDK and two WASM alternatives are manually vendored. One duplicate
  Face hint image and two study workbooks are emitted but unreferenced, while
  support assets remain outside explicit `publicDownloads` coverage.

## Approved future decisions

These remaining decisions are approved roadmap direction only. The named-only
frontend adapter, named backend producers, and separate presentation catalog
are current behavior above, not future work.
- Use Azure SQL Database Basic as the initial relational target, subject to
  representative load testing.
- Migrate workbook capabilities sequentially, with reconciliation and rollback
  evidence for every capability.
- Replace status reporting with live, participant-named, revocable company
  bearer links. Easy WhatsApp sharing and forwarding remain accepted
  requirements.
- Remove visible `Erro_XXX` prefixes only with explicit copy approval; never
  display a machine value or invent Brazilian-Portuguese copy.
- Use the learning platform as the reference implementation, then adopt the
  pattern in other frontend applications and backend domains one domain at a
  time. Do not globally replace numbered values: unrelated domains can reuse a
  number with a different meaning and retain their current contracts until
  their own coordinated migration.
- Add privacy-safe structured logging, trace correlation, dependency and
  exception signals, sampling, budget alerts, and operational visibility as a
  separate Azure operations milestone. Observability diagnoses failures; it
  neither replaces the client/server error contract nor exposes private
  diagnostic detail through that contract.
- Keep session authority and logout, HTTP-status reclassification, retries,
  idempotency, timeout and cancellation policy, partial-success redesign, and
  versioned response-envelope changes in separately authorized milestones.
- Re-encode the video ladder and evaluate storage redundancy before considering
  a CDN.
- Automate Face SDK and dependency maintenance; remove secret-bearing manual
  files and rotate affected credentials in separately authorized work.

## Questions requiring implementation-time evidence

The source snapshot cannot answer the following safely. The later task that
changes the relevant seam must collect evidence without contacting production:

1. How does the deployed host treat each slashless entry: redirect, rewrite,
   preserve, or reject, and does it retain query strings and fragments?
2. Which user-agent shapes and browser versions must remain supported when the
   Edge gate is replaced, including environments without `userAgentData`?
3. Should the 1024-pixel rule remain inclusive after modernization, and what
   explicit destination replaces `history.back()` when no valid predecessor
   exists?
4. What authoritative expiry, revocation, rotation, and logout semantics will
   replace the current tab-local authorization-handle lifetime?
5. Which backend operations are idempotent today under transport retry, and
   where must request identifiers or reconciliation be introduced?
6. Which partial Face-registration states exist in representative nonproduction
   data, and which one is authoritative when photo, workbook flag, and Face
   session disagree?
7. What are the intended assessment attempt, timing, answer-authority, score,
   dedupe, and resumption rules? Current source supplies no time limit.
8. Should the Module 3 feedback name be corrected or must migrated historical
   records first be reconciled from module 2?
9. Which workbook formulas, row-order assumptions, and update/append outcomes
   must be preserved during sequential migration, including feedback partial
   success?
10. Which server-side report definition binds company, workbook, rows, labels,
    modules, report type, participant name, expiration, and revocation while
    retaining accepted forwarding behavior?
11. What exact codecs, renditions, bitrates, segment templates, and DRM behavior
    do representative nonproduction MPDs expose? No media manifest was fetched
    for this characterization.
12. Which of the 33 downloads, two unreachable copies, Face locales, duplicated
    image, and certificate inputs are intentional long-term public assets?
13. What privacy-preserving replacement should govern the five-person non-DRM
    branch, and when can the credential-bearing PlayReady configuration be
    rotated and removed from source?
14. Which CDN dependency bytes and browser cache/offline behavior must be
    pinned, vendored, or integrity-checked in the transformed target?

## Behavior-baseline acceptance matrix

The compatibility suite implements this matrix and remains the executable guard
for route adoption and later modernization. Stable contract descriptions are
the test intent; current source anchors identify the current oracle.

| ID | Compatibility surface | Required synthetic assertion |
| --- | --- | --- |
| ORIGIN-01 | Shared production origin | Exactly one executable production-origin literal is exported from the separate shared mapping and imported by exactly eight consumers; runtime code contains no executable localhost backend URL, hostname-based selection, backend-base storage key, stored override, or relative `/null/` request path. |
| ROUTE-01 | Seven public entries | The manifest contains exactly the seven canonical `/plataforma/**` trailing-slash entries listed above, including `/plataforma/cadastro-foto/` with exact case, every index is emitted under `dist/plataforma/`, and one directory mapping emits the complete canonical module tree within the exact nine learning-platform mappings. |
| ROUTE-02 | Root, retirement, compatibility, and slash behavior | `/plataforma/` and all three former `/plataforma/cadastro` entry forms are intentional 404s without redirect; the independently retired `/plataforma_v2/` root and seven former entries remain 404s; no entry alias or `dist/plataforma_v2/` subtree exists. All 15 enumerated legacy module URLs are explicit 404s and have no emitted output, alias, or redirect. Internal source navigation remains slashless and published slashless behavior is marked unproven rather than invented. |
| ROUTE-03 | Navigation/history | Login, initial notices, Face registration at `/plataforma/cadastro-foto`, study, warning pages, logout, and back navigation use the exact current targets and history operations. |
| GATE-01 | Edge detection | Login/notices/registration/study accept when either current Edge signal matches and redirect when neither matches; status report does not gate; the browser-warning diagnostic throws when `userAgentData` is absent. |
| GATE-02 | Width and resize | Initial and resize decisions cover 1023, 1024, and 1025 pixels, including each page's current ordering and the warning page's `history.back()` condition. |
| STORE-01 | Key inventory | The exact seven accented/cased keys, all readers/writers, value shapes, and the read-only `TempoSessão_Segundos` observation remain represented; no backend base is stored or read. |
| STORE-02 | Lifetime/reset | No flow clears storage; logout changes only `Usuário_Logado`; refresh leaves both the stored client deadline and `IndexVerificado` unchanged while returning the separate workbook access-deadline field. |
| API-01 | Login and Face registration | Methods, exact paths—including unchanged `POST /plataforma_v2/CadastroFoto_e_FaceID`—JSON/multipart fields, response fields, status branches, and call order remain exact; each allowed named value reaches the same reviewed semantic kind, visible outcome, storage state, and navigation branch. |
| API-02 | Face verification/result | Session creation carries the handle in JSON; exactly one public path-parameter result GET follows component resolution and reproduces success, failed-decision, local-component, named request-error, and backend-retry-visible branches with no client polling. |
| API-03 | Refresh and progress | Both protected POST bodies carry `IndexVerificado`; refresh response/access-deadline display, unchanged stored deadline, named semantic mapping, and optimistic update/rollback behavior match current transitions. |
| API-04 | Assessment and feedback | `/updates` preserves client-supplied grade fields; named write and append failures preserve update-before-append ordering, partial success, retry duplication exposure, rollback, and the Module 3/module 2 mismatch. |
| API-05 | Status report | The public POST carries only exact JSON fields `linha_inicial` and `linha_final`; query/display labels remain client-side. It has no authorization header/body handle, keeps JSON-before-status ordering, and maps the named read failure to its semantic/presentation outcome. |
| ERROR-01 | Normalization and protected unauthorized response | Synthetic transport, malformed, HTTP, unknown, local, and operation-inapplicable failures retain their reviewed owner/kind/status branches; every retired numbered value is unknown across every operation while preserving status; login `401` retains invalid-credential precedence and protected `401 {}` retains each consumer's exact `Erro_000` outcome. |
| FLOW-01 | Login/notices/registration | Credential, first-access, photo-registration, authorization-code, Face startup/single-result lookup, and destination branches preserve their current storage transitions. |
| FLOW-02 | Study navigation | The 171 contiguous indices, 10-module boundaries, module prerequisites, content/test/feedback/performance destinations, and saved progress initialization remain fixed, including malformed negative/fractional/`NaN`/greater-than-171 progress behavior. |
| FLOW-03 | Content completion | Manual and `ended` completion both exercise optimistic increment, protected update, success advance, and local failure rollback. |
| FLOW-04 | Assessment | Synthetic DOM answers reproduce current client score and update behavior, including absence of a source-defined time limit or dedupe identity. |
| FLOW-05 | Feedback | Synthetic submission records current client-controlled fields, update-before-append ordering, failure positions, and duplicate-visible retry behavior. |
| FLOW-06 | Certificate/logout | Eligibility thresholds, client-side PDF inputs/name, validation text, and logout's non-revoking redirect behavior remain observable. |
| REPORT-01 | Nine query keys | Each of `ne`, `nt`, `li`, `lf`, `dua`, `idsr`, `mi`, `mf`, and `mrm` has an isolated display/request effect and exact default/coercion behavior. |
| REPORT-02 | Public disclosure/rendering | Synthetic rows demonstrate all API-returned fields, the UI's ignored certificate IDs, 15-column assumption, forwarding, and the current `innerHTML` sinks without using real participant data. |
| REPORT-03 | Mode contradiction | Only exact `mrm=consolidado` selects consolidated behavior; the contradictory short-code comment remains documentary evidence, not runtime truth. |
| FACE-01 | SDK resolution and presentation hooks | Version 1.5.0, `<base>` resolution, `pt-BR`, 75 dictionaries, five images, regular/SIMD JS+WASM branch paths, the body-mounted loader, Shadow-DOM native brightness checkbox, and application-owned viewport/host-color overrides remain exact without loading production Face. |
| ASSET-01 | File identity and isolation | The exact current 182-file platform set and its JavaScript and Study subscopes match their byte totals and digests; all current paths are NFC, 34 contain non-ASCII, and the non-JavaScript, binary, public-application, Face, download, and certificate scoped digests remain exact. |
| ASSET-02 | Downloads/certificate | All 33 exact download paths emit with their frozen aggregate digest; 31 are reachable, two remain unreferenced, and the three browser-generated certificate inputs retain exact case and bytes. |
| VIDEO-01 | Topic/manifests | Module video counts total 151 unique exact `(Módulo N, name)` keys and derive `_dash.mpd` paths under both current namespaces without requesting them. |
| VIDEO-02 | DRM/player lifecycle | Default protected and five-name bypass selection, PlayReady-only configuration role, one retained player, controls, load/play behavior, and completion handlers match source without exposing credentials or personal names. |
| ARTIFACT-01 | Full frontend artifact | The current artifact has 258 files and matches its recorded identity; the verified 257-file phase-B identity remains historical, all 257 application paths remain, the 15 named compatibility outputs remain absent, and `shared/backend-origin.js` is the sole added output path. |
| ARTIFACT-02 | Manifest coverage | Tests require seven platform `publicEntries`, zero platform `publicDownloads`, 175 platform support files, nine exact platform mappings, and one separate shared mapping; the complete frontend requires 12 entries, 3 public downloads, 243 support files, 58 negative paths, and exactly 77 JavaScript imports in both source and generated previews. |

### Automated traceability

Every coverage-bearing compatibility test title begins with its acceptance ID
in brackets. The coverage is grouped by execution seam rather than by future
source location:

- `.agents/tests/learning-platform-static.test.js` covers declarative route,
  Face asset/presentation, download, video/DRM, and artifact contracts;
- `.agents/tests/learning-platform-errors.test.js` covers the exact frozen named
  vocabulary, operation ownership, retired-alias rejection, local semantic
  normalization, presentation catalog, and source confinement;
- `.agents/tests/learning-platform-entry-api.test.js` covers entry gates,
  navigation, storage, login, Face, named request behavior, ownership,
  operation isolation, malformed JSON, and denied networking;
- `.agents/tests/learning-platform-module-seams.test.js` covers the real module
  loader and host deny-all guard, bootstrap modes, initial-notices seam, and
  status-report query/request/render seams;
- `.agents/tests/learning-platform-study-report.test.js` covers study progress,
  assessment, feedback, named write transitions, certificate,
  logout/expiry, and status-report behavior;
- `.agents/tests/learning-platform-traceability.test.js` derives the acceptance
  IDs from this matrix, requires every ID to remain in a named test, and audits
  the suite for sensitive source literals and complete network URL literals.

Shared helpers under `.agents/tests/helpers/` provide isolated browser seams and
install the deny-all network guard before application code executes. All
behavior fixtures are invented and local; no test uses a production service.

Backend-internal feedback ordering and partial-success boundaries remain
independently executable in `backend/test/app-platform-routes.test.js` at the
verified companion commit `65761539b1fc998e66be383248269270ff2c90a9`. The
frontend harness models only the resulting client-visible retry and rollback
behavior.

## Safe synthetic-dependency strategy

The behavior-baseline suite uses Node.js 24 and makes outbound networking a test
failure before any application script executes.

1. Start with static contract extraction: parse deployment JSON, HTML attributes,
   source literals, tracked paths, and digest framing. This covers routes,
   assets, downloads, topic keys, names, casing, and Unicode without executing
   vendor code.
2. Execute only the two unchanged classic warning scripts in the isolated VM.
   Import real application `.js` modules through the Node.js 24 loader hook
   confined by real path to `apps/learning-platform/modules/`, then call their
   factories with synthetic `window`, `document`, `navigator`, `location`,
   `history`, `sessionStorage`, clock, timers, and `fetch`. Record redirects,
   history calls, storage mutations, DOM states, request order, and rollback.
3. Install the deny-all host network guard before importing any module. Stub
   only fixture origins and fail any request containing the production backend, Graph,
   workbook, Face, EZDRM, CDN, media, email, or storage host. Never submit a
   real form or permit fallback to native `fetch`, XHR, WebSocket, image/script
   loading, or media loading.
4. Model backend results with deterministic synthetic JSON, `401 {}` JSON bodies,
   failure statuses, delayed responses, and multipart inspection. Control the
   single Face-result resolution/rejection with a synthetic promise. Use fake
   timers for the session deadline and documented backend retry schedule; do
   not wait in wall-clock time.
5. Stub the Face custom element, Shaka Player/UI, video element, and jsPDF.
   Assert construction/configuration/path resolution and lifecycle calls.
   Behavior tests never import a production Face entry or execute the vendored
   Face engine or either WASM file.
6. Use invented participant, workbook, company, assessment, and feedback data.
   Exercise HTML-sensitive values in a contained DOM to characterize sinks;
   never copy production names, workbook contents, report links, authorization
   handles, or credential-bearing URLs into fixtures or snapshots.
7. For browser-level route tests, serve only the generated local artifact and
   install request interception before navigation. Fulfil external script,
   media, and Face requests with inert local fixtures or block them. Keep
   slashless production-host behavior explicitly pending until separately
   evidenced.
8. Snapshot the contract-derived route/request/state matrices and the exact
   artifact inventory. When source or deployed paths move, update current
   anchors separately from stable expected behavior so a path-alignment change
   does not silently rewrite the compatibility oracle.

No part of that suite should start a production-backed server, fetch a remote
manifest or segment, initialize Face/EZDRM, call the backend or workbooks, send
email, or use live credentials.

## Reproducing this characterization

Run from the current `sistemas` tree using Node.js 24.x. These commands enumerate
source evidence only; they do not start an application server or call an
external dependency.

```powershell
git -c core.quotepath=false ls-files -- apps/learning-platform
node --test .agents/tests/*.test.js
node --test scripts/frontend-deployment.test.mjs
node scripts/build-frontend.mjs
node scripts/check-frontend.mjs
git diff --check
```

The build/check pair proves the source-derived artifact rather than production
hosting behavior. After building, compare the exact emitted file set and bytes
using the repository helpers and digest framing above. For this module
modernization, 24 new application-owned module files increased the platform and
complete-artifact counts from 156 and 231 to 180 and 255. The error-adapter and
presentation-catalog stage increased those counts to 182 and 257; the named-only
cleanup changed only adapter bytes. The deployed-path phase-A artifact kept the
aligned sources plus 15 temporary compatibility outputs, producing 197 platform
files and 272 complete files. The completed phase-B manifest removed only those
outputs and produced 182 platform files and 257 complete files at the verified
base. The current centralized-origin artifact retains 182 platform files, adds
one shared runtime file, produces 258 complete files, and matches the current
identities above.

Commit `19dacfa870d691e5869a022652fb24f2a8ba8e5f` is the exact pre-alignment
baseline. The final aligned source strings add 76 bytes without changing its
file counts; phase A added a further 15 files and 66,549 duplicate bytes. The
artifact history also retains `9ff6b61a4bfdcd2cfd511cc406d16b5984577266`
as the dual-reading baseline and `be8e52fc248d073503b8e71abe5afb9e93a4d5f9`
as the post-English-internals pre-adapter baseline, with the earlier
pre-modernization and pre-adoption snapshots kept separately.
