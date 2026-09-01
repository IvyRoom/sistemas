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

## Lean learning-platform request boundary

The learning platform uses the same shared backend origin as the other API
consumers and the browser's ordinary uncredentialed fetch behavior. It has no
cookie-based platform session, custom session header, session-status request,
or logout request. Login sends only the credential payload. Registration and
the five protected learning operations carry the signed `IndexVerificado`
handle in their established multipart or JSON fields.

Excel `PRAZO ACESSO` drives the calculated `STATUS LOGIN`. Only exact `Ativo`
permits the backend to mint a new signed handle, which remains valid for its
absolute four-hour lifetime. Explicit logout, timer expiry, and logged-out
direct or BFCache restoration remove this tab's stored handle and replace to
Login without network work or cross-tab synchronization. A previously copied
handle can remain technically usable until its original expiry.

Public status report, client intake, quote, Conecta, certificate validation,
viewport warning, and device/browser warning remain free of learning-platform
authority. Local, automated, generated-preview, and Azure-preview verification
uses invented origins and synthetic transports with production-network denial
installed before application code.

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
`apps/`. Source and generated previews resolve the same 77 logical JavaScript
imports. Deployment retains one shared support file, one separate shared
mapping, every public route/download/negative route, and the nine
learning-platform mappings.
