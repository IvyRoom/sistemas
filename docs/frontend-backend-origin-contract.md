# Frontend backend-origin contract

## Runtime invariant

Frontend runtime code defines the Machado backend production origin once, in
`apps/shared/backend-origin.js`, and imports its `BACKEND_ORIGIN` export at each
production edge. The shared module contains the only executable production-origin
literal under `apps/`. Application modules continue to own their method, path,
payload, timeout, presentation, and navigation contracts.

The deployment manifest maps `apps/shared` to `shared` as runtime infrastructure,
separately from maintained application identities. Imports therefore resolve to
the same tracked module in source previews and to `/shared/backend-origin.js` in
generated and Azure deployments.

## Consumers and owned API paths

| Consumer | Owned method and path |
| --- | --- |
| Quote Request | `POST /landingpage/solicitacaoorcamento` |
| Client Intake | `POST /clientes/processa-formulario` |
| Certificate Validation | `GET /validacaocertificados/:encodedCertificateId` |
| Conecta referral form | `POST /conecta/processa-recomendacao` |
| Learning-platform Login | Legacy and target `POST /plataforma_v2/login-FaceID` and `POST /plataforma_v2/FaceID`; legacy compatibility `GET /plataforma_v2/FaceID_resultado/:sessionId`; dormant target `POST /plataforma_v2/sessions/current/registration-enrollment`, `POST /plataforma_v2/sessions/current/face-completion`, and `GET /plataforma_v2/sessions/current` |
| Learning-platform Registration | Legacy and target `POST /plataforma_v2/CadastroFoto_e_FaceID`; legacy compatibility `GET /plataforma_v2/FaceID_resultado/:sessionId`; dormant target `GET /plataforma_v2/sessions/current` and `POST /plataforma_v2/sessions/current/face-completion` |
| Learning-platform Study | Legacy and target `POST /plataforma_v2/refresh`, `POST /plataforma_v2/updates`, and `POST /plataforma_v2/processa-feedback`; dormant target `GET /plataforma_v2/sessions/current` |
| Learning-platform Status Report | `POST /plataforma_v2/statusreport` |

The Marketing Site is excluded because it does not contact the Machado backend.
`modules/platform-client.js` remains generic: entries inject the platform base,
transport, and multipart constructor rather than letting the client discover
configuration.

## Removed runtime configuration

Runtime hostname inspection no longer changes backend addressing. Executable
localhost backend URLs, localhost-backend comments, and the
`URL_Base_Backend` storage key are retired. Login does not write a backend base;
Study and Registration can start directly without reading one. There is no stored
override, fallback base, or path that can concatenate a relative `/null/` request.

## Dormant authoritative-session topology

This section records the implemented consumer alignment for the backend-owned
[`session-authority.md`](https://github.com/IvyRoom/backend/blob/515a683484ea47586b2858ca0fff79acd64814d2/docs/session-authority.md).
The target request branches exist in source and generated output, but the
source-controlled `AUTHORITATIVE_SESSIONS_ENABLED` latch is exactly `false`.
Browser-controlled URL/query input, Web Storage, cookies, hostname state, and
window globals cannot enable it. The deployment therefore keeps the current
`BACKEND_ORIGIN`, public/legacy fetches, routes, and observable client behavior;
it does not create a target cookie, change deployed CORS, or modify DNS, TLS,
App Service, secrets, SQL, the manifest, or other infrastructure.

The target API origin remains exactly the existing shared
`https://plataforma-backend-v3.azurewebsites.net` origin. Before adoption, the
default-TLS endpoint and host-only partitioned cookie must pass the supported
Edge matrix: Stable, Extended Stable, InPrivate, and the supported tracking-
prevention configuration with ordinary third-party cookies blocked. The cookie
must remain scoped by the browser to top-level `https://machadogestao.com` and
must not be available under an unrelated top-level site. Credentialed requests
do not redirect or mirror the cookie between hosts. Any failed profile blocks
adoption; an unpartitioned cross-site cookie or Web Storage bearer is not a
fallback. This design requires no new custom domain, DNS record, TLS certificate,
or App Service hostname binding and adds no hosting resource; the existing F1
plan's capacity limits and lack of SLA remain operational constraints.

Coordinated adoption keeps the value of the one existing `BACKEND_ORIGIN`
export unchanged for all eight consumers; it does not create a learning-
platform-only origin or a second runtime configuration source. Quote Request,
Client Intake, Certificate Validation, Conecta, and the public learning-
platform Status Report continue to omit credentials and the session header.
Only learning session/protected consumers add the credentialed options below.
The frontend source latch, backend
`SESSION_AUTHORITY_PARTITIONED_COOKIE_TOPOLOGY_QUALIFIED` evidence latch, and
matching backend rollout gates may change only as one reviewed release pair
after every topology, store, browser, CORS, ledger, privacy, rollback, and
authoritative-logout prerequisite passes; no latch changes here.

The target session cookie is exactly `__Host-machado-session` with `Path=/`,
`Secure`, `HttpOnly`, `SameSite=None`, and `Partitioned`, and without `Domain`.
Its browser expiry is cleanup only; the durable backend record and server time
own authority. JavaScript never reads or copies the identifier, and no
application session identifier appears in a URL, body, Web Storage, log,
fixture, snapshot, or public diagnostic.

Only successful login/rotation emits `Set-Cookie`. Logout, revoke-all,
definitive Face failure, ineligibility, invalid/terminal/stale credentials,
repeated requests, store failures, and compare-and-replace losers never mutate
or delete it. A revoked browser value stays inert until its original browser
expiry or the next successful credential login overwrites it, so no delayed
non-issuance response can erase a newer shared-profile cookie.

Target session and protected consumers use this exact browser boundary:

- `credentials: "include"`;
- `X-Machado-Session-Request: 1` on target-mode credential login and every
  cookie-authenticated request;
- browser-supplied exact production `Origin: https://machadogestao.com` for
  unsafe requests; frontend JavaScript never sets `Origin` or `Cookie` manually;
- exact `Access-Control-Allow-Origin: https://machadogestao.com` and
  `Access-Control-Allow-Credentials: true`, never wildcard credentialed CORS;
- only the matching route methods plus `Content-Type` and the session header in
  preflight policy;
- `Vary: Origin, Access-Control-Request-Method,
  Access-Control-Request-Headers` on preflight and `Vary: Origin, Cookie` on
  actual session/protected responses; and
- `Cache-Control: no-store`, no `ETag` or `Last-Modified`, and the ADR's
  no-cache/referrer response rules on session responses.

The dormant `platform-client.js` branch adds `credentials: "include"`, the
session header, `cache: "no-store"`, `mode: "cors"`, `redirect: "error"`, and
`referrerPolicy: "no-referrer"` only when an entry injects the immutable false
release latch. Login, Registration, and Study inject that same source value;
all public clients continue to use the default uncredentialed request boundary.
Registration validates exact `registration-pending` and
`registration-challenge` status before upload. No target branch calls the
public Face-result lookup, reads the cookie, sends `IndexVerificado`, or adds a
browser DELETE. Logout and direct/pageshow/BFCache guarding remain unchanged for
their next named tasks.

Public status report, client intake, quote, Conecta, certificate validation,
viewport warning, and device/browser warning remain session-free. Their target
classification does not imply a change to the current public payload or
presentation contract. The current public Face-result lookup remains a
compatibility route and cannot promote a target session; protecting or retiring
it belongs to the later Face-result-security milestone.

Local, automated, generated-preview, and Azure-preview verification uses only
invented origins and synthetic transports. Production-network denial remains
installed before application code. A preview never sends credentials to the
production API origin.

## Verification policy

Tests may use invented origins only as fixtures passed through application seams.
They stub or inject transports and must not establish another runtime
configuration source. Browser verification installs production-network denial
before application scripts execute, then intercepts the preserved startup and
form requests synthetically. It must not submit forms or contact the backend,
Graph, workbooks, mail, Face, DRM, media, licensing, or other side-effecting
integrations.

Acceptance requires source and generated previews to resolve the shared import,
all API-bearing entries to select the same production origin on local, preview,
and production hosts, and static checks to prove one executable production
literal across exactly eight API-bearing consumers, no executable localhost
backend URLs, no hostname selection, and no `URL_Base_Backend` string under
`apps/`. Source and generated previews resolve the same 80 logical JavaScript
imports. Deployment retains one shared support file, one separate shared
mapping, every public route/download/negative route, and the nine
learning-platform mappings.
