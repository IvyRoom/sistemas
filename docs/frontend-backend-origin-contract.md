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
| Learning-platform Login | `POST /plataforma_v2/login-FaceID`, `POST /plataforma_v2/FaceID`, and `GET /plataforma_v2/FaceID_resultado/:sessionId` |
| Learning-platform Registration | `POST /plataforma_v2/CadastroFoto_e_FaceID` and `GET /plataforma_v2/FaceID_resultado/:sessionId` |
| Learning-platform Study | `POST /plataforma_v2/refresh`, `POST /plataforma_v2/updates`, and `POST /plataforma_v2/processa-feedback` |
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

## Approved future session topology

This section is the consumer alignment for the backend-owned
[`session-authority.md`](https://github.com/IvyRoom/backend/blob/36f3dd3aec8c198612e7008b25b07dab479ada46/docs/session-authority.md).
It is an approved future topology, not current runtime behavior. This definition
task does not change `BACKEND_ORIGIN`, any import, fetch option, header, route,
cookie, CORS response, DNS record, certificate, App Service binding, deployment
manifest, or infrastructure.

The target API origin is exactly `https://api.machadogestao.com`. Before
adoption, that hostname must be proven under controlled DNS, have valid TLS and
the intended App Service custom-hostname binding, and pass supported-browser
first-party-cookie qualification. Session endpoints neither accept nor set the
target cookie through an Azure default hostname, and credentialed requests do
not redirect between API hosts. If the custom hostname is not ready, session
adoption is blocked; a third-party cookie or Web Storage bearer is not a
fallback.

Adoption replaces the value of the one existing shared `BACKEND_ORIGIN` export
for all eight consumers; it does not create a learning-platform-only origin or
a second runtime configuration source. Quote Request, Client Intake,
Certificate Validation, Conecta, and the public learning-platform Status Report
therefore use the verified custom hostname while continuing to omit credentials
and the session header. Only learning session/protected consumers add the
credentialed options below.

The target session cookie is exactly `__Host-machado-session` with `Path=/`,
`Secure`, `HttpOnly`, and `SameSite=Strict`, and without `Domain`. Its browser
expiry is cleanup only; the durable backend record and server time own
authority. JavaScript never reads or copies the identifier, and no application
session identifier appears in a URL, body, Web Storage, log, fixture, snapshot,
or public diagnostic.

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
- exact production `Origin: https://machadogestao.com` for unsafe requests;
- exact `Access-Control-Allow-Origin: https://machadogestao.com` and
  `Access-Control-Allow-Credentials: true`, never wildcard credentialed CORS;
- only the matching route methods plus `Content-Type` and the session header in
  preflight policy;
- `Vary: Origin, Access-Control-Request-Method,
  Access-Control-Request-Headers` on preflight and `Vary: Origin, Cookie` on
  actual session/protected responses; and
- `Cache-Control: no-store`, no `ETag` or `Last-Modified`, and the ADR's
  no-cache/referrer response rules on session responses.

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
literal, no executable localhost backend URLs, no hostname selection, and no
`URL_Base_Backend` string under `apps/`. Deployment adds one shared support file
and one separate mapping while retaining every public route, download, negative
route, and the nine learning-platform mappings.
