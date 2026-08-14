# Learning-platform compatibility contracts

Status: authoritative current-state characterization for the behavior-baseline
task. This document describes the frozen `sistemas` source at
`c68f361de054a936b7a6871d82d75a1cdb457c97` and companion `backend` evidence at
`7151f134c2cc1b57097bade5557ef6e422204303`. It does not authorize a behavior
change, production request, data migration, or integration exercise.

## How to use this specification

The stable descriptions and acceptance IDs in this document are the contracts
to carry across the source move. Links under **Current source anchors** identify
where the behavior happens in the frozen tree; they are evidence, not future
directory requirements. When sources move, update those anchors without
silently changing the stable description.

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

The document keeps four categories separate:

- **Source-observed current behavior** is the compatibility baseline.
- **Known risks and unresolved legacy behavior** must be preserved by a pure
  move/baseline unless a later task explicitly changes them.
- **Approved future decisions** are direction already chosen, but not
  implemented here.
- **Questions requiring implementation-time evidence** must not be converted
  into assertions without a safe synthetic or local observation.

## Source-observed current behavior

### Public entries and navigation

`frontend-deployment.json` maps the entire tracked `plataforma_v2/` directory to
`dist/plataforma_v2/` without renaming paths. It declares exactly seven public
entries. Each canonical entry includes a trailing slash and must return its
listed `index.html` with HTTP `200` and no redirect.

| Stable entry | Canonical public path | Current entry file | Direct dependencies |
| --- | --- | --- | --- |
| `LP-ENTRY-DEVICE` | `/plataforma_v2/aviso-dispositivo/` | `plataforma_v2/aviso-dispositivo/index.html` | Login favicon; own CSS, logo, and async classic script |
| `LP-ENTRY-BROWSER` | `/plataforma_v2/aviso-navegador/` | `plataforma_v2/aviso-navegador/index.html` | Login favicon; own CSS, logo, and synchronous classic script |
| `LP-ENTRY-NOTICES` | `/plataforma_v2/avisos-iniciais/` | `plataforma_v2/avisos-iniciais/index.html` | Login favicon; own CSS/logo; async module; registration storage state |
| `LP-ENTRY-REGISTER` | `/plataforma_v2/cadastro/` | `plataforma_v2/cadastro/index.html` | Login favicon; own CSS/logo/reference image; Face `<base>`; async module; vendored Face component; stored backend base and row handle |
| `LP-ENTRY-STUDY` | `/plataforma_v2/estudo/` | `plataforma_v2/estudo/index.html` | Own favicon/CSS/logo; Shaka Player 4.6.0 CSS/JS; jsPDF 2.5.1; synchronous monolithic JS; stored session state; remote DASH media |
| `LP-ENTRY-LOGIN` | `/plataforma_v2/login/` | `plataforma_v2/login/index.html` | Own favicon/CSS/logo; Face `<base>`; async module; vendored Face component; production backend role |
| `LP-ENTRY-REPORT` | `/plataforma_v2/statusreport/` | `plataforma_v2/statusreport/index.html` | Own favicon/CSS/logo; async module; query string; independently coupled production backend role |

The entry documents use these exact initial URL literals; later dynamic Face,
download, certificate, and video paths are specified in their dedicated
sections below:

| Entry | Root-relative and external initial dependencies |
| --- | --- |
| Device warning | `/plataforma_v2/login/img/FAVICON.ico`; `/plataforma_v2/aviso-dispositivo/style.css`; `/plataforma_v2/aviso-dispositivo/img/LOGO_MACHADO.png`; `/plataforma_v2/aviso-dispositivo/main.js` |
| Browser warning | `/plataforma_v2/login/img/FAVICON.ico`; `/plataforma_v2/aviso-navegador/style.css`; `/plataforma_v2/aviso-navegador/img/LOGO_MACHADO.png`; `/plataforma_v2/aviso-navegador/main.js` |
| Initial notices | `/plataforma_v2/login/img/FAVICON.ico`; `/plataforma_v2/avisos-iniciais/style.css`; `/plataforma_v2/avisos-iniciais/img/LOGO_MACHADO.png`; `/plataforma_v2/avisos-iniciais/main.js` |
| Registration | `/plataforma_v2/login/img/FAVICON.ico`; `/plataforma_v2/cadastro/style.css`; `/plataforma_v2/azure-ai-vision-face-ui/` as `<base>`; `/plataforma_v2/cadastro/img/LOGO_MACHADO.png`; `/plataforma_v2/cadastro/img/REFERÊNCIAS_FOTOS.png`; `/plataforma_v2/cadastro/main.js`; user-invoked `https://www.resizepixel.com/` and `https://cloudconvert.com/` links |
| Study | `/plataforma_v2/estudo/img/FAVICON.ico`; `https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.6.0/controls.css`; `/plataforma_v2/estudo/style.css`; `/plataforma_v2/estudo/img/LOGO_MACHADO.png`; `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`; `https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.6.0/shaka-player.ui.js`; `/plataforma_v2/estudo/main.js` |
| Login | `/plataforma_v2/login/img/FAVICON.ico`; `/plataforma_v2/login/style.css`; `/plataforma_v2/azure-ai-vision-face-ui/` as `<base>`; `/plataforma_v2/login/img/LOGO_MACHADO.png`; `/plataforma_v2/login/main.js` |
| Status report | `/plataforma_v2/statusreport/img/FAVICON.ico`; `/plataforma_v2/statusreport/style.css`; `/plataforma_v2/statusreport/img/LOGO_MACHADO.png`; `/plataforma_v2/statusreport/main.js` |

`/plataforma_v2/` is intentionally an HTTP `404` with no redirect. There is no
root `index.html` and no SPA fallback. The seven entries are URL entry points,
not claims that every entry is anonymous: client JavaScript applies the gates
described below after HTML loads. The status-report entry is the exception that
has no Edge, login, session, or participant gate.

Current internal navigation is normal document navigation through
`window.location.href`, always using the following **slashless**, lower-case,
root-relative strings:

| Destination | Exact internal path | Writers |
| --- | --- | --- |
| Device warning | `/plataforma_v2/aviso-dispositivo` | Login, initial notices, registration, study, status report |
| Browser warning | `/plataforma_v2/aviso-navegador` | Login, initial notices, registration, study |
| Login | `/plataforma_v2/login` | Registration failure/rejection, unauthenticated study, logout, session expiry |
| Initial notices | `/plataforma_v2/avisos-iniciais` | Active login with Face enabled and no registered photo |
| Registration | `/plataforma_v2/cadastro` | Successful initial-notices acknowledgement |
| Study | `/plataforma_v2/estudo` | Existing logged flag, Face-disabled login, successful Face verification/registration |

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

- Deployment mapping, entries, and root 404:
  [`frontend-deployment.json` lines 119-180](../frontend-deployment.json#L119-L180).
- Exhaustive entry test:
  [`scripts/frontend-deployment.test.mjs` lines 153-219](../scripts/frontend-deployment.test.mjs#L153-L219).
- README route/404 contract: [`README.md` lines 26-59](../README.md#L26-L59).
- Published `200`/no-redirect and `404`/no-redirect checks:
  [`scripts/frontend-deployment-lib.mjs` lines 1268-1334](../scripts/frontend-deployment-lib.mjs#L1268-L1334).
- Slashless local behavior: source-preview aliases
  [`scripts/frontend-deployment-lib.mjs` lines 1090-1125](../scripts/frontend-deployment-lib.mjs#L1090-L1125)
  and generated-artifact index fallback
  [`scripts/frontend-deployment-lib.mjs` lines 1200-1224](../scripts/frontend-deployment-lib.mjs#L1200-L1224).
- Exact HTML dependencies: device
  [`index.html` lines 9-28](../plataforma_v2/aviso-dispositivo/index.html#L9-L28),
  browser [`index.html` lines 9-28](../plataforma_v2/aviso-navegador/index.html#L9-L28),
  notices [`index.html` lines 9-18](../plataforma_v2/avisos-iniciais/index.html#L9-L18),
  registration [`index.html` lines 9-62](../plataforma_v2/cadastro/index.html#L9-L62),
  login [`index.html` lines 9-59](../plataforma_v2/login/index.html#L9-L59),
  study [`index.html` lines 9-32](../plataforma_v2/estudo/index.html#L9-L32) and
  [`index.html` lines 9109-9113](../plataforma_v2/estudo/index.html#L9109-L9113),
  report [`index.html` lines 9-45](../plataforma_v2/statusreport/index.html#L9-L45).
- Slashless destinations and history: device
  [`main.js` lines 1-3](../plataforma_v2/aviso-dispositivo/main.js#L1-L3), notices
  [`main.js` lines 7-57](../plataforma_v2/avisos-iniciais/main.js#L7-L57), registration
  [`main.js` lines 28-48](../plataforma_v2/cadastro/main.js#L28-L48), login
  [`main.js` lines 47-69](../plataforma_v2/login/main.js#L47-L69), study
  [`main.js` lines 78-103](../plataforma_v2/estudo/main.js#L78-L103), and report
  [`main.js` lines 51-63](../plataforma_v2/statusreport/main.js#L51-L63).

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

Login, notices, registration, and status report load async modules which then
register or assign `load` handlers. The source therefore contains a timing risk
if module evaluation occurs after `load`; study's classic script registers its
handler synchronously at the end of the document. No page handles `pageshow`,
BFCache restoration, `pagehide`, `beforeunload`, or `popstate`.

Current anchors: login [`main.js` lines 47-73](../plataforma_v2/login/main.js#L47-L73),
notices [`main.js` lines 7-31](../plataforma_v2/avisos-iniciais/main.js#L7-L31),
registration [`main.js` lines 28-52](../plataforma_v2/cadastro/main.js#L28-L52),
study [`main.js` lines 66-103](../plataforma_v2/estudo/main.js#L66-L103), report
[`main.js` lines 51-65](../plataforma_v2/statusreport/main.js#L51-L65), warning
[`main.js` lines 1-3](../plataforma_v2/aviso-dispositivo/main.js#L1-L3), and
browser diagnostic [`main.js` lines 1-2](../plataforma_v2/aviso-navegador/main.js#L1-L2).

### Session-storage contract

There are exactly eight `sessionStorage` key spellings. Accents, hyphens,
underscores, and capitalization are compatibility data. Values are strings
because they pass through Web Storage. No platform source calls `removeItem()`
or `clear()`.

| Exact key | Writers and value convention | Readers and transition use | Lifetime and security implication |
| --- | --- | --- | --- |
| `URL_Base_Backend` | Login overwrites it with the production backend role on each module evaluation. | Login rereads immediately; registration and study read during module evaluation. Report ignores it. | Tab-scoped configuration, not authority. Logout leaves it. Same-origin script can alter it; hard-coded production coupling makes an unguarded local preview unsafe. |
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

Current anchors: all storage reads/writes in login
[`main.js` lines 9-11](../plataforma_v2/login/main.js#L9-L11),
[`main.js` lines 65-67](../plataforma_v2/login/main.js#L65-L67), and
[`main.js` lines 113-145](../plataforma_v2/login/main.js#L113-L145); registration
[`main.js` lines 15-16](../plataforma_v2/cadastro/main.js#L15-L16) and
[`main.js` lines 90-127](../plataforma_v2/cadastro/main.js#L90-L127); study
[`main.js` lines 11-34](../plataforma_v2/estudo/main.js#L11-L34),
[`main.js` lines 113-157](../plataforma_v2/estudo/main.js#L113-L157), and
[`main.js` lines 220-232](../plataforma_v2/estudo/main.js#L220-L232); warning
[`main.js` lines 1-3](../plataforma_v2/aviso-dispositivo/main.js#L1-L3); backend
handle contract at the pinned companion
[`api-contracts.md` lines 209-242](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L209-L242).

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
| `LP-API-LOGIN` `POST /plataforma_v2/login-FaceID` | JSON header; body `Usuário_Login`, `Usuário_Senha`, untrimmed | Matched response: `Usuário_Status_FaceID`, `Usuário_Foto_Cadastrada`, `Usuário_PrazoAcesso`, `Usuário_Status_Login`; active exact `Ativo` also gets `IndexVerificado` | Public. Retry full platform-workbook read, scan in returned order, strict login match and password string match. No match: `401 credenciais_inválidas`; read exhaustion: `Erro_001`. Repeats mint time-derived active handles. | `401` shows invalid credentials; `Erro_001` shows database copy; unknown/parser/network is `Erro_000`. |
| `LP-API-REGISTER` `POST /plataforma_v2/CadastroFoto_e_FaceID` | Browser multipart, append `IndexVerificado` then single `file`; browser supplies boundary | `Azure_Face_API_LivenessSession_authToken`, `Azure_Face_API_LivenessSession_sessionID` | Multer memory-buffer first, signed authorization second. Retry reference-photo upload (`Erro_002`) → retry 22-cell row update with photo flag `Sim` at index 5 (`Erro_003`) → retry passive Face session with uploaded bytes and new correlation UUID (`Erro_004`). Photo/flag can persist before later failure; retries can create multiple Face sessions. | Known `002`-`004` retain code; `401 {}`/unknown is `Erro_000`. After HTTP success client clears registration authorization before local liveness. |
| `LP-API-FACE-START` `POST /plataforma_v2/FaceID` | JSON header; body `IndexVerificado` | Same auth-token and session-ID keys as registration | Signed authorization. Retry reference-photo read (`Erro_005`) → retry passive Face-session creation with new correlation UUID (`Erro_004`). Session creation is non-idempotent. | `004` Face creation, `005` photo read, local SDK rejection `Erro_006`, unknown/`401` `Erro_000`. |
| `LP-API-FACE-RESULT` `GET /plataforma_v2/FaceID_resultado/:sessionId` | JSON content-type header despite no body; returned ID concatenated without URL encoding | `Azure_Face_API_LivenessSession_LivenessDecision`, `Azure_Face_API_LivenessSession_MatchConfidence`, `Azure_Face_API_LivenessSession_MatchDecision` | Public. Retry one Face result lookup using decoded path slot; use first attempt result; rejection exhaustion `Erro_007`. Resolved non-success Face HTTP status is not separately checked before projection. | No polling. Exact `realface` plus boolean match `true` passes. Unknown is `Erro_000`; local SDK failure remains `Erro_006`. |
| `LP-API-REFRESH` `POST /plataforma_v2/refresh` | JSON header; body `IndexVerificado` from storage | 18 exact keys: full/first name, email, access deadline, login status, completed count, module grades 1-10, accumulated grade, certificate ID | Signed authorization. Retry full workbook read and select verified row (`Erro_001`). Read-only; handle is not returned/rotated. Missing/short row has no explicit error contract. | Consumes every key; parses progress with `parseFloat`. Returned login status is stored but not enforced. `401` becomes `Erro_000`. |
| `LP-API-UPDATE` `POST /plataforma_v2/updates` | JSON header; exact keys `TipoAtualização`, `IndexVerificado`, `NúmeroTópicosConcluídos`, `NúmeroMódulo`, `NotaTeste` | `200 {}` | Signed authorization. Always trust/write client progress at row index 8. Exact type `NúmeroTópicosConcluídos-e-NotaTeste` also trusts/writes grade at JS index `NúmeroMódulo + 9`; ordinary type sends literal `n/a` module/grade. Retry fixed row update (`Erro_008`). No type/range/monotonicity/grade validation. | Progress increment precedes request; catch decrements local count/restores action. `Erro_008` specific; `401`/unknown `Erro_000`. |
| `LP-API-FEEDBACK` `POST /plataforma_v2/processa-feedback` | JSON header; exact keys `IndexVerificado`, progress, full name, email, browser-local fill date, module, four ratings, comments | `200 {}` | Signed authorization only. Retry progress update (`Erro_008`) → retry append nine client fields in order: name, email, date, module, size, content, platform, printed-material, comments (`Erro_009`). Progress can persist before append failure; append has no dedupe and can duplicate under retry/repeat. | Optimistic local increment; catch decrements only local state. `008`/`009` specific; `401`/unknown `Erro_000`. |
| `LP-API-REPORT` `POST /plataforma_v2/statusreport` | JSON header; body `linha_inicial`, `linha_final` parsed from `li`, `lf` | `Dados_Extraídos_BD_Plataforma`; each row is 14 values: full name, progress, ten grades, accumulated grade, certificate ID | Public and wildcard-CORS accessible. Retry live full workbook read (`Erro_001`), then exact JS `slice(linha_inicial, linha_final + 1)` and projection. No input validation. Stable numeric end is inclusive; direct nonnumeric API inputs retain JS coercion. | UI consumes indexes 0-12 and ignores certificate ID at 13. Unknown is `Erro_000`. |

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

#### Error crosswalk

| Code | Current role |
| --- | --- |
| `Erro_000` | Frontend-only network, JSON-parser, unexpected response, and generic fallback |
| `Erro_001` | Platform workbook read |
| `Erro_002` | Reference-photo upload |
| `Erro_003` | Mark reference photo registered in platform workbook |
| `Erro_004` | Create Face liveness session |
| `Erro_005` | Read reference photo |
| `Erro_006` | Frontend-only Face component failure |
| `Erro_007` | Read Face liveness result |
| `Erro_008` | Write platform workbook |
| `Erro_009` | Append feedback workbook |

Invalid signed handles are `401 {}`, not an `Erro_XXX`. Every current protected
consumer renders that response as generic `Erro_000` behavior.

#### Current source anchors

- Login client [`main.js` lines 83-294](../plataforma_v2/login/main.js#L83-L294).
- Registration client [`main.js` lines 60-178](../plataforma_v2/cadastro/main.js#L60-L178).
- Study refresh [`main.js` lines 113-137](../plataforma_v2/estudo/main.js#L113-L137),
  updates [`main.js` lines 777-884](../plataforma_v2/estudo/main.js#L777-L884) and
  [`main.js` lines 1061-1118](../plataforma_v2/estudo/main.js#L1061-L1118), feedback
  [`main.js` lines 958-1031](../plataforma_v2/estudo/main.js#L958-L1031).
- Status-report client [`main.js` lines 5-17](../plataforma_v2/statusreport/main.js#L5-L17)
  and [`main.js` lines 168-303](../plataforma_v2/statusreport/main.js#L168-L303).
- Pinned companion backend route sections:
  [login](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L497-L526),
  [registration](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L528-L573),
  [Face start](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L575-L607),
  [Face result](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L609-L643),
  [refresh](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L645-L673),
  [updates](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L675-L709),
  [feedback](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L711-L743), and
  [status report](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L770-L801).
- Pinned retry semantics:
  [`api-contracts.md` lines 168-207](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L168-L207).
- Pinned global CORS and Express routing semantics:
  [`api-contracts.md` lines 117-147](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L117-L147).

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
remain. `resetarLogin()` restores controls and clears email/password only. It
does not clear session storage or remove a previously appended Face element.

`LP-STATE-NOTICES` requires the three exact lower-case, untrimmed answers
`credenciais`, `direitos`, and `janela`. Success opens registration. Failure
shows per-field alerts and leaves the submit button hidden until a field emits
`change`. No consent state is stored and no backend call occurs.

Current anchors: login
[`main.js` lines 59-145](../plataforma_v2/login/main.js#L59-L145),
[`main.js` lines 152-294](../plataforma_v2/login/main.js#L152-L294), and reset
[`main.js` lines 304-325](../plataforma_v2/login/main.js#L304-L325); notices
[`main.js` lines 17-70](../plataforma_v2/avisos-iniciais/main.js#L17-L70).

#### Face registration and verification

`LP-STATE-REGISTER` reads the backend base and signed row handle during module
evaluation. The file control is required and advertises `.jpg`; visible copy
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
[`index.html` lines 32-48](../plataforma_v2/cadastro/index.html#L32-L48) and flow
[`main.js` lines 60-178](../plataforma_v2/cadastro/main.js#L60-L178); login Face
flow [`main.js` lines 152-263](../plataforma_v2/login/main.js#L152-L263); vendored
loader [`FaceLivenessDetector.js` line 1](../plataforma_v2/azure-ai-vision-face-ui/FaceLivenessDetector.js#L1).

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

Current anchors: topic totals and state variables
[`main.js` lines 11-54](../plataforma_v2/estudo/main.js#L11-L54), initialization
[`main.js` lines 66-266](../plataforma_v2/estudo/main.js#L66-L266), module/topic
selection [`main.js` lines 337-435](../plataforma_v2/estudo/main.js#L337-L435).

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

Current anchors: video completion
[`main.js` lines 447-468](../plataforma_v2/estudo/main.js#L447-L468), manual
control [`main.js` lines 707-725](../plataforma_v2/estudo/main.js#L707-L725),
update flow [`main.js` lines 1061-1118](../plataforma_v2/estudo/main.js#L1061-L1118).

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
[`index.html` line 1401](../plataforma_v2/estudo/index.html#L1401), representative
correctness attributes
[`index.html` lines 1477-1519](../plataforma_v2/estudo/index.html#L1477-L1519),
assessment flow [`main.js` lines 735-915](../plataforma_v2/estudo/main.js#L735-L915).

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
[`index.html` lines 8745-8909](../plataforma_v2/estudo/index.html#L8745-L8909), flow
[`main.js` lines 925-1045](../plataforma_v2/estudo/main.js#L925-L1045).

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
registration authorization, backend base, photo mirror, or origin marker.

Current anchors: performance/certificate
[`main.js` lines 1126-1301](../plataforma_v2/estudo/main.js#L1126-L1301), logout
[`main.js` line 157](../plataforma_v2/estudo/main.js#L157), timer
[`main.js` lines 220-232](../plataforma_v2/estudo/main.js#L220-L232).

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
[`main.js` lines 5-17](../plataforma_v2/statusreport/main.js#L5-L17), title and
chart creation [`main.js` lines 57-162](../plataforma_v2/statusreport/main.js#L57-L162),
live request/sorting/rendering
[`main.js` lines 168-303](../plataforma_v2/statusreport/main.js#L168-L303),
backend projection
[`api-contracts.md` lines 770-801](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L770-L801).

### Runtime assets and resolution rules

The complete tracked/emitted platform set is the union below. File counts and
bytes are raw file-content totals at the characterized commit.

| Area | Files | Bytes | Complete set description |
| --- | ---: | ---: | --- |
| `aviso-dispositivo/` | 5 | 124,681 | `index.html`, `main.js`, `style.css`, `img/FAVICON.ico`, `img/LOGO_MACHADO.png` |
| `aviso-navegador/` | 5 | 124,504 | Same five relative names as device warning |
| `avisos-iniciais/` | 4 | 110,736 | `index.html`, `main.js`, `style.css`, `img/LOGO_MACHADO.png` |
| `azure-ai-vision-face-ui/` | 85 | 9,526,729 | Face component, 75 dictionaries, five images, regular/SIMD JS and WASM pairs |
| `cadastro/` | 5 | 457,309 | `index.html`, `main.js`, `style.css`, `img/LOGO_MACHADO.png`, `img/REFERÊNCIAS_FOTOS.png` |
| `estudo/` | 41 | 10,073,597 | HTML/JS/CSS, 33 study files, five images |
| `login/` | 6 | 146,875 | HTML/JS/CSS, favicon, logo, unused duplicate `Brightness.svg` |
| `statusreport/` | 5 | 144,652 | HTML/JS/CSS, favicon, logo |
| **Total** | **156** | **20,709,083** | Identity-mapped to `dist/plataforma_v2/` |

By extension, the set is 7 CSS, 7 HTML, 10 JS, 75 JSON, 2 WASM, 11 PNG,
5 ICO, 5 SVG, 1 JPG, 19 XLSM, 11 XLSX, 2 VSDX, and 1 VSSX. The exact complete
path listing is reproducible with:

```powershell
git -c core.quotepath=false ls-files -- plataforma_v2
```

All 156 paths are NFC. Thirty-four contain non-ASCII characters: the
registration reference image and all 33 study-file paths. Exact case, spaces,
punctuation, accents, and normalization form are runtime contracts. The build
rejects case/NFC collisions and verifies the exact generated spelling and
bytes.

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

Both entry HTML files set
`<base href="/plataforma_v2/azure-ai-vision-face-ui/">`. Their own CSS, images,
and module scripts are root-relative, while the vendor's relative dynamic
requests resolve through this base. Removing or moving the base without an
equivalent resolution seam breaks engine, WASM, image, and locale loading.

The copy of `login/img/Brightness.svg` is byte-identical to the vendor image and
has no source reference. The device and browser warning subtrees each emit an
own favicon, but both HTML entries deliberately reference the login favicon.

Current anchors: Face imports and locale at login
[`main.js` lines 15-19](../plataforma_v2/login/main.js#L15-L19) and
[`main.js` lines 170-180](../plataforma_v2/login/main.js#L170-L180), registration
[`main.js` lines 3-7](../plataforma_v2/cadastro/main.js#L3-L7) and
[`main.js` lines 96-102](../plataforma_v2/cadastro/main.js#L96-L102), base tags
at login [`index.html` lines 9-11](../plataforma_v2/login/index.html#L9-L11) and
registration [`index.html` lines 9-11](../plataforma_v2/cadastro/index.html#L9-L11),
vendored paths/version/selection
[`FaceLivenessDetector.js` line 1](../plataforma_v2/azure-ai-vision-face-ui/FaceLivenessDetector.js#L1).

#### Study downloads and certificate assets

The study subtree emits 33 download files (9,163,893 bytes). Dynamic source has
34 `href` assignments resolving to 31 unique files, with no missing target. Two
emitted files have no current runtime reference: `Módulo 3/PLANO DE AÇÃO
(CLÁUDIA).xlsm` and `Módulo 4/GRÁFICO CONTROLE DE RESULTADOS - Copia.xlsm`.

The complete exact inventory, relative to `plataforma_v2/estudo/files/`, is:

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

Download controls are four placeholder anchors whose root-relative paths and
visibility are reassigned for exact module/video-name pairs. Every other video
hides all four controls. The same `BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx`
content occurs under modules 4 and 5 as two distinct public paths.

No certificate PDF/template file is stored. jsPDF builds it in the browser from
`LOGO_MACHADO_CERTIFICADO.jpg`, `ASSINATURA.png`, and `ATLAS.png`. The JPG logo
is passed to jsPDF with the legacy format label `PNG`. Study also uses
`FAVICON.ico` and `LOGO_MACHADO.png`.

Current anchors: download placeholders
[`index.html` lines 1353-1377](../plataforma_v2/estudo/index.html#L1353-L1377),
assignment matrix
[`main.js` lines 470-705](../plataforma_v2/estudo/main.js#L470-L705), certificate
library/UI [`index.html` lines 9085-9111](../plataforma_v2/estudo/index.html#L9085-L9111),
certificate construction
[`main.js` lines 1213-1292](../plataforma_v2/estudo/main.js#L1213-L1292).

### Video and DRM contract

There are exactly ten modules, 151 unique content/video topics, ten tests, and
ten feedback topics: 171 contiguous `data-index` values. Each content topic's
exact HTML `name` is its remote video key. `AbreMódulo` supplies the exact
folder `Módulo N`; the manifest rule is:

```text
<selected namespace>/Módulo N/<exact topic name>_dash.mpd
```

Spaces, periods, uppercase letters, accents, and punctuation in those names are
remote object-name contracts. The source has no separate video map.

| Module | Videos | Total nodes | `data-index` range | Current exhaustive HTML span |
| ---: | ---: | ---: | --- | --- |
| 1 | 11 | 13 | 1-13 | `estudo/index.html:102-162` |
| 2 | 15 | 17 | 14-30 | `estudo/index.html:205-285` |
| 3 | 19 | 21 | 31-51 | `estudo/index.html:328-430` |
| 4 | 18 | 20 | 52-71 | `estudo/index.html:471-568` |
| 5 | 17 | 19 | 72-90 | `estudo/index.html:609-701` |
| 6 | 8 | 10 | 91-100 | `estudo/index.html:742-789` |
| 7 | 12 | 14 | 101-114 | `estudo/index.html:830-897` |
| 8 | 22 | 24 | 115-138 | `estudo/index.html:938-1055` |
| 9 | 17 | 19 | 139-157 | `estudo/index.html:1096-1188` |
| 10 | 12 | 14 | 158-171 | `estudo/index.html:1230-1297` |

The protected media namespace is the remote `videosv3/plataforma_v2/` branch;
the bypass namespace is sibling `videosv3/plataforma_v2_sem_drm/`. Default is
protected. A hard-coded allowlist of five exact participant names selects the
bypass branch. The names are personal data and are intentionally not repeated
here; the source anchor is compatibility evidence. Both branches use DASH.

Shaka Player 4.6.0 supplies playback. On the first content-topic open in a page
lifetime (`AlgumVídeoJáFoiCarregado === false`), the code creates one global
player and UI overlay,
attaches it to the video element, and
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
[`api-contracts.md` lines 745-768](https://github.com/IvyRoom/backend/blob/7151f134c2cc1b57097bade5557ef6e422204303/docs/api-contracts.md#L745-L768).

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

Current anchors: module folder and topic behavior
[`main.js` lines 337-456](../plataforma_v2/estudo/main.js#L337-L456), player
lifecycle/completion
[`main.js` lines 38-42](../plataforma_v2/estudo/main.js#L38-L42) and
[`main.js` lines 447-468](../plataforma_v2/estudo/main.js#L447-L468), external
libraries [`index.html` lines 10-12](../plataforma_v2/estudo/index.html#L10-L12)
and [`index.html` lines 9109-9113](../plataforma_v2/estudo/index.html#L9109-L9113).

### Deployment artifact and whole-tree digest

The mapping copies tracked bytes; it performs no bundling, minification, or
transformation. The characterized platform source and emitted subtree have the
same 156 paths relative to their roots and identical bytes.

| Scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma_v2/...` | 156 | 20,709,083 | `6b7ae5adbd00b9f5a1319aaf9c86aeaef9e688217ce452b3ce018ebe8770bb4b` |
| Platform subtree rooted at `dist/plataforma_v2` (prefix omitted; diagnostic only) | 156 | 20,709,083 | `6eb7b6d8c46e43d570e4cffff251377cd7496ff17a4c03dfe5ae69d642a3c9ba` |
| Complete generated `dist/` artifact | 231 | 27,314,121 | `cb23b90f85e8d2dbc4d440f1547c42ab4a6164cfd53a0af25bd8b2155e9da81f` |

The two platform digests differ only because the digest includes path bytes.
Use the first when comparing a platform subset within the whole artifact.

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
Thus 149 emitted platform files are supporting/runtime files rather than
individually enumerated public contracts. All 33 study downloads, the entire
Face subtree, JS/CSS/images, and certificate inputs are absent from
`publicDownloads` even though the identity mapping publishes them. Remote CDN
libraries and all media manifests/segments are outside the 231-file artifact.

Current anchors: mapping collection
[`frontend-deployment-lib.mjs` lines 309-358](../scripts/frontend-deployment-lib.mjs#L309-L358),
digest framing
[`frontend-deployment-lib.mjs` lines 378-426](../scripts/frontend-deployment-lib.mjs#L378-L426),
build/copy/set checks
[`frontend-deployment-lib.mjs` lines 429-478](../scripts/frontend-deployment-lib.mjs#L429-L478),
platform `publicDownloads`
[`frontend-deployment.json` lines 119-156](../frontend-deployment.json#L119-L156).

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
- The backend base URL is hard-coded into browser source and copied into
  session storage. A local preview that executes application code can therefore
  reach production unless networking is blocked before script execution.

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
- Fetch handling is duplicated. Several flows parse JSON before checking status
  and have no timeout, cancellation, centralized redaction, or shared typed
  error contract.
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
  [`index.html` lines 423-430](../plataforma_v2/estudo/index.html#L423-L430)
  and [`main.js` line 966](../plataforma_v2/estudo/main.js#L966).
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

These decisions are approved roadmap direction only. They do not redefine the
current behavior above and are not implemented by this documentation change.

- Move the `plataforma_v2` source to `apps/learning-platform/`.
- Rename `apps/conecta/` to `apps/referrals-management/` while preserving the
  public `/conecta/cadastro-recomendacoes/` route.
- Replace the learning-platform public namespace with `/plataforma` and retire
  `/plataforma_v2`; Lucas will communicate that change manually.
- Use Azure SQL Database Basic as the initial relational target, subject to
  representative load testing.
- Migrate workbook capabilities sequentially, with reconciliation and rollback
  evidence for every capability.
- Replace status reporting with live, participant-named, revocable company
  bearer links. Easy WhatsApp sharing and forwarding remain accepted
  requirements.
- Modernize platform UI, module structure, fetch/session seams, Face
  initialization, and error handling only after compatibility baselines exist.
- Use a full-white Face viewport with `#4a0816` loading dots and a status
  message.
- Convert comments and internal identifiers to US English while preserving
  user-facing Brazilian Portuguese.
- Replace `Erro_XXX` end to end as a coordinated contract change.
- Add minimal privacy-safe health signals, logging, correlation, budget alerts,
  and operational visibility.
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

The next task should turn this matrix into safe compatibility tests before
moving sources or changing behavior. Stable contract descriptions are the test
intent; current source anchors are only the oracle for this frozen snapshot.

| ID | Compatibility surface | Required synthetic assertion |
| --- | --- | --- |
| ROUTE-01 | Seven public entries | The manifest contains exactly the seven canonical trailing-slash entries listed above, with exact case, and every index is emitted. |
| ROUTE-02 | Root and slash behavior | `/plataforma_v2/` remains an intentional 404; internal source navigation remains slashless and published slashless behavior is marked unproven rather than invented. |
| ROUTE-03 | Navigation/history | Login, initial notices, Face registration, study, warning pages, logout, and back navigation use the exact current targets and history operations. |
| GATE-01 | Edge detection | Login/notices/registration/study accept when either current Edge signal matches and redirect when neither matches; status report does not gate; the browser-warning diagnostic throws when `userAgentData` is absent. |
| GATE-02 | Width and resize | Initial and resize decisions cover 1023, 1024, and 1025 pixels, including each page's current ordering and the warning page's `history.back()` condition. |
| STORE-01 | Key inventory | The exact eight accented/cased keys, all readers/writers, value shapes, and the read-only `TempoSessão_Segundos` observation remain represented. |
| STORE-02 | Lifetime/reset | No flow clears storage; logout changes only `Usuário_Logado`; refresh leaves both the stored client deadline and `IndexVerificado` unchanged while returning the separate workbook access-deadline field. |
| API-01 | Login and Face registration | Methods, exact paths, JSON/multipart fields, response fields, status branches, call order, and `Erro_XXX` mappings match the tables above. |
| API-02 | Face verification/result | Session creation carries the handle in JSON; exactly one public path-parameter result GET follows component resolution and reproduces success, failed-decision, request-error, and backend-retry-visible branches with no client polling. |
| API-03 | Refresh and progress | Both protected POST bodies carry `IndexVerificado`; refresh response/access-deadline display, the unchanged stored session deadline, and optimistic update/rollback behavior match current transitions. |
| API-04 | Assessment and feedback | `/updates` preserves client-supplied grade fields; feedback preserves update-before-append ordering, partial success, retry duplication exposure, and the Module 3/module 2 mismatch. |
| API-05 | Status report | The public POST carries only exact JSON fields `linha_inicial` and `linha_final`; query/display labels remain client-side. It has no authorization header/body handle and reproduces success plus current `Erro_001`/generic mappings. |
| ERROR-01 | Protected unauthorized response | Synthetic `401 {}` becomes each current consumer's observed generic `Erro_000` outcome; tests do not introduce a redesigned expiry message. |
| FLOW-01 | Login/notices/registration | Credential, first-access, photo-registration, authorization-code, Face startup/single-result lookup, and destination branches preserve their current storage transitions. |
| FLOW-02 | Study navigation | The 171 contiguous indices, 10-module boundaries, module prerequisites, content/test/feedback/performance destinations, and saved progress initialization remain fixed, including malformed negative/fractional/`NaN`/greater-than-171 progress behavior. |
| FLOW-03 | Content completion | Manual and `ended` completion both exercise optimistic increment, protected update, success advance, and local failure rollback. |
| FLOW-04 | Assessment | Synthetic DOM answers reproduce current client score and update behavior, including absence of a source-defined time limit or dedupe identity. |
| FLOW-05 | Feedback | Synthetic submission records current client-controlled fields, update-before-append ordering, failure positions, and duplicate-visible retry behavior. |
| FLOW-06 | Certificate/logout | Eligibility thresholds, client-side PDF inputs/name, validation text, and logout's non-revoking redirect behavior remain observable. |
| REPORT-01 | Nine query keys | Each of `ne`, `nt`, `li`, `lf`, `dua`, `idsr`, `mi`, `mf`, and `mrm` has an isolated display/request effect and exact default/coercion behavior. |
| REPORT-02 | Public disclosure/rendering | Synthetic rows demonstrate all API-returned fields, the UI's ignored certificate IDs, 15-column assumption, forwarding, and the current `innerHTML` sinks without using real participant data. |
| REPORT-03 | Mode contradiction | Only exact `mrm=consolidado` selects consolidated behavior; the contradictory short-code comment remains documentary evidence, not runtime truth. |
| FACE-01 | SDK resolution | Version 1.5.0, `<base>` resolution, `pt-BR`, 75 dictionaries, five images, and regular/SIMD JS+WASM branch paths resolve exactly without loading production Face. |
| ASSET-01 | File identity | The exact 156-file, 20,709,083-byte platform set and full-output-path digest match; all paths are NFC and 34 contain non-ASCII. |
| ASSET-02 | Downloads/certificate | All 33 exact download paths emit; 31 are reachable, two remain unreferenced, and all browser-generated certificate inputs resolve with exact case. |
| VIDEO-01 | Topic/manifests | Module video counts total 151 unique exact `(Módulo N, name)` keys and derive `_dash.mpd` paths under both current namespaces without requesting them. |
| VIDEO-02 | DRM/player lifecycle | Default protected and five-name bypass selection, PlayReady-only configuration role, one retained player, controls, load/play behavior, and completion handlers match source without exposing credentials or personal names. |
| ARTIFACT-01 | Full frontend artifact | The complete artifact remains 231 files, 27,314,121 bytes, with digest `cb23b90f85e8d2dbc4d440f1547c42ab4a6164cfd53a0af25bd8b2155e9da81f`. |
| ARTIFACT-02 | Manifest coverage | Tests distinguish seven `publicEntries`, zero platform `publicDownloads`, and the 149 implicitly emitted runtime/support files. |

### Automated traceability

Every coverage-bearing compatibility test title begins with its acceptance ID
in brackets. The coverage is grouped by execution seam rather than by future
source location:

- `.agents/tests/learning-platform-static.test.js` covers declarative route,
  Face asset, download, video/DRM, and artifact contracts;
- `.agents/tests/learning-platform-entry-api.test.js` covers entry gates,
  navigation, storage, login, Face, and request behavior;
- `.agents/tests/learning-platform-study-report.test.js` covers study progress,
  assessment, feedback, certificate, logout/expiry, and status-report behavior;
- `.agents/tests/learning-platform-traceability.test.js` derives the acceptance
  IDs from this matrix, requires every ID to remain in a named test, and audits
  the suite for sensitive source literals and complete network URL literals.

Shared helpers under `.agents/tests/helpers/` provide isolated browser seams and
install the deny-all network guard before application code executes. All
behavior fixtures are invented and local; no test uses a production service.

Backend-internal feedback ordering and partial-success boundaries remain
independently executable in `backend/test/app-platform-routes.test.js` at the
verified companion commit `7151f134c2cc1b57097bade5557ef6e422204303`. The
frontend harness models only the resulting client-visible retry and rollback
behavior.

## Safe synthetic-dependency strategy

The behavior-baseline task should use Node.js 24 and make outbound networking a
test failure before any application script executes.

1. Start with static contract extraction: parse deployment JSON, HTML attributes,
   source literals, tracked paths, and digest framing. This covers routes,
   assets, downloads, topic keys, names, casing, and Unicode without executing
   vendor code.
2. Execute small application seams in an isolated DOM/VM harness with synthetic
   `window`, `document`, `navigator`, `location`, `history`,
   `sessionStorage`, clock, timers, and `fetch`. Record redirects, history calls,
   storage mutations, DOM states, request order, and rollback.
3. Install a deny-all network guard before loading modules. Stub only fixture
   origins and fail any request containing the production backend, Graph,
   workbook, Face, EZDRM, CDN, media, email, or storage host. Never submit a
   real form or permit fallback to native `fetch`, XHR, WebSocket, image/script
   loading, or media loading.
4. Model backend results with deterministic synthetic JSON, `401 {}` JSON bodies,
   failure statuses, delayed responses, and multipart inspection. Control the
   single Face-result resolution/rejection with a synthetic promise. Use fake
   timers for the session deadline and documented backend retry schedule; do
   not wait in wall-clock time.
5. Stub the Face custom element, Shaka Player/UI, video element, and jsPDF.
   Assert construction/configuration/path resolution and lifecycle calls. App
   behavior tests need not execute the vendored Face engine or either WASM file.
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
   artifact inventory. When source moves, update current anchors separately
   from stable expected behavior so a path-only move does not silently rewrite
   the compatibility oracle.

No part of that suite should start a production-backed server, fetch a remote
manifest or segment, initialize Face/EZDRM, call the backend or workbooks, send
email, or use live credentials.

## Reproducing this characterization

Run from the `sistemas` repository at the frozen commit, using Node.js 24.x.
These commands enumerate source evidence only; they do not start an application
server or call an external dependency.

```powershell
git -c core.quotepath=false ls-files -- plataforma_v2
node --test .agents/tests/*.test.js
node --test scripts/frontend-deployment.test.mjs
node scripts/build-frontend.mjs
node scripts/check-frontend.mjs
git diff --check
```

The build/check pair proves the source-derived artifact rather than production
hosting behavior. After building, compare the exact emitted file set and bytes
using the repository helpers and digest framing above. A documentation-only
change passes only when the three characterized digests and all file/byte
counts remain unchanged.
