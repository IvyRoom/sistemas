# Learning-platform compatibility contracts

Status: authoritative current-state compatibility specification. Its frozen
behavior baseline was characterized from `sistemas` commit
`c68f361de054a936b7a6871d82d75a1cdb457c97`; source-layout, public-route, and
artifact sections are maintained against the current repository tree. Companion
`backend` signed-handle evidence is pinned at verified producer commit
`ba286cc0b3d3e67176d46dee84a5ba7d55b7162c`. This document records the completed
entry-markup modernization, warning-navigation repair, lean signed-handle access
model with browser-final Study logout/restoration behavior, and returning-user
Face startup overlap. It does not authorize a production request, data
migration, infrastructure mutation, or an integration exercise.

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

The document keeps six categories separate:

- **Browser support contract** is the selected customer-support target. Runtime
  admission implements only its observable candidate boundary and is not
  qualification evidence.
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

## Browser support contract

Decision date: 2026-08-27. Last evidence review: 2026-08-27. This section
resolves the browser-support question for the learning platform. It selects a
customer environment from the intersection of application requirements and
available vendor evidence; it does not infer that every Chromium browser is
equivalent to Microsoft Edge. The policy is evergreen rather than a fixed
minimum-version promise.

### Content-protection objective

Capture resistance for the company's course videos is the governing business
requirement for protected study playback. Microsoft Edge is not selected as a
browser-brand preference. The product owner reports that prior application-
specific tests with Edge and PlayReady blacked protected video in the
screenshot and screen-recording attempts exercised, while prior Chrome and
Firefox recording tests left the video visible. This documentation-
only task did not reproduce those tests, and the observation is not an
unconditional Microsoft guarantee or a completed formal qualification.

Windows 11 with Edge and PlayReady is therefore the only currently selected
protected-video path, pending the controlled qualification below. A path may
become supported only when its exact operating-system and browser builds, DRM
and CDM, hardware-security mode, GPU/driver and decoder, license and output-
protection policies, display/output path, and capture method pass the maintained
capture-resistance matrix. User-agent admission, generic Shaka support, CDM
availability, license acquisition, successful protected playback, or HDCP
alone is not proof of capture resistance.

For an in-scope capture method, a pass means that capture is blocked or the
captured protected-video region is black, blank, or omitted with no intelligible
protected-video image. Playback refusal is also acceptable for a deliberately
disabled or unavailable negative profile, but not for the intended supported
profile. This policy makes its support decision on protected-video imagery,
which is the stated business requirement. Record audio separately: capturable
program audio does not change that video-image result, but it remains a
disclosed content-exposure result and must not be described as capture-
protected. This is a deliberately bounded software-capture claim, not a
promise against an external camera, external capture hardware, a compromised
client, privileged or untested capture software, or future capture methods.

### Support terms and selected matrix

- **Selected support target** means that the operating system, device class,
  browser family, and release channel match a row below. This documentation-
  only task selects those rows but cannot qualify Face, camera, or DRM.
- **Qualified supported build** means a selected target whose exact browser
  build has a recorded passing row-specific verification. A passing user-agent
  string is never sufficient.
- **Capture-resistant protected-media path** means an exact environment whose
  protected video has passed every in-scope screenshot, software screen-
  recording, and screen-sharing method in the maintained qualification record.
  Working playback or DRM availability without that record is insufficient.
- **Unsupported** means that the environment is explicitly designated outside
  a product boundary below or has a known incompatibility with a mandatory
  capability.
- **Unverified** means that the environment might work but lacks enough
  application evidence for a support claim. Unverified is not a synonym for
  unsupported and must remain distinguishable in diagnostics and test data. A
  combination omitted from the supported rows is unverified unless this
  section explicitly designates it unsupported.

The selected operating system is a physical, locally used, x64 Windows 11
desktop whose Windows release still receives Microsoft servicing. A qualified
supported browser build is the latest fully patched build of its named
channel. The policy does not promise arbitrary older builds, a fixed major-
version floor, or compatibility mode.

| User journey or surface | Selected browser and channel policy | Support decision |
| --- | --- | --- |
| Complete authenticated learning journey | Windows 11 x64 on a physical local device; Microsoft Edge Stable or Microsoft Edge Extended Stable; exact current build must be qualified with Face, capture-resistant protected media, ordinary learning, report, and logout fixtures | Selected support target, pending the row-specific qualification below. Windows/Edge/PlayReady is selected because it is the only path with reported application-specific capture-resistance evidence, not because Edge branding or Microsoft documentation guarantees every capture result. Edge Beta is validation-only; Dev and Canary are unsupported. Chrome, Firefox, Safari, other Chromium derivatives, embedded WebViews, ARM64, macOS, Linux, Windows Server, Windows 10, and mobile operating systems are unsupported for this journey. Remote desktop and virtual machines are unverified. |
| First-time Face registration | Same Windows 11 and Edge Stable or Extended Stable boundary, plus a trusted physical camera and every Face capability below | Selected support target, pending the registration-specific camera, upload, and Face qualification. Camera absence or denial is a recoverable camera failure, not proof of an unsupported browser. |
| Public status report | Serviced Windows 11 x64 desktop; current Microsoft Edge Stable or Extended Stable, Google Chrome Stable, or Mozilla Firefox Release | A deliberately broader selected support target, pending public-row qualification, because this surface does not require session state, Face, Shaka, EME, PlayReady, or camera access. Edge Beta, Chrome Beta, and Firefox Beta are validation-only. |
| Device/browser and viewport warning pages | Same public matrix as the status report | Selected support target pending qualification, so a compatibility explanation remains renderable without Face or DRM. The warning entries remain ungated, and the device/browser diagnostic handles absent or partial `userAgentData` without preventing the document from rendering. |

Safari on macOS with FairPlay is a deferred, unimplemented, and unverified
future candidate, not a selected support target. Safari without a configured
and qualified FairPlay path remains unsupported for the complete journey.
Apple's public FairPlay material does not establish that every macOS Safari
screenshot, screen recorder, or screen-sharing path produces black video, so a
later separately authorized DRM task must implement and qualify the exact path
before this matrix may expand.

The source-observed five-account non-DRM exception is identity-based rather
than an operating-system or browser capability check. For any matching session
that passes the separate entry gate and reaches study playback, it selects
unprotected manifests regardless of the environment. It is an acknowledged
content-protection and capture-exposure risk, not a supported Safari/FairPlay
path. This task preserves the behavior and does not reproduce participant
identities or associate them with device information.

Current macOS and Linux desktop browsers, Chrome Extended Stable, Firefox ESR,
and other Chromium-branded browsers are unverified for the public rows, not
claimed supported. All mobile browsers, end-of-servicing operating-system
releases, Internet Explorer, Edge IE mode, compatibility modes, and browser
Dev, Canary, or Nightly channels are unsupported. Other Chromium-branded
browsers are unsupported for the complete journey. Remote desktop and virtual-
machine execution are unverified because PlayReady availability, hardware
security, output protection, graphics, and camera behavior can differ from a
physical local device.

Extended Stable support applies only while Microsoft services that channel.
Beta builds are exercised to find upcoming regressions but never become a
customer-support promise. When a selected Stable, Extended Stable, or Release
channel advances, the exact patched build replaces the prior build after its
row-specific qualification is recorded; the prior qualified build is retained
for at most the five-business-day qualification window as an operational
fallback, not advertised as a second support floor. A missed window is a
support-policy incident requiring an explicit recorded exception; it does not
silently broaden support to older versions.

### Capability prerequisites

The matrix is a policy boundary; journey readiness and failure handling must
also use capability evidence. A generic browser-family match cannot establish
these entry-specific prerequisites. A transient permission, device, policy,
network, entitlement, or service failure can make a journey unavailable while
the qualified browser build remains supported; the failure boundaries below
govern that distinction.

| Capability group | Required evidence |
| --- | --- |
| Native-module and API-bearing entries | Native JavaScript modules and the repository's untranspiled syntax; promises and async functions; DOM, events, forms, timers, JSON, `URL`, and `URLSearchParams` where used; `fetch` for API-bearing entries; `sessionStorage` where used. The application has no transpilation or polyfill layer. The two warning entries instead retain their classic-script requirements below. |
| Ordinary authenticated learning pages | Baseline capabilities plus working same-tab session state, Fetch responses, downloads, Blob/File behavior where invoked, and application navigation/history behavior. Registration upload additionally requires File input and `FormData`. A backend, download, or session failure remains an application or dependency failure. |
| Face registration and Face login | A secure context; Custom Elements and Shadow DOM; WebAssembly with the vendored non-SIMD fallback accepted when SIMD is unavailable; Web Crypto, BigInt, and a usable graphics path; `mediaDevices.getUserMedia`; an available trusted physical camera; and explicit camera permission. Face-workflow startup also requires the application's constructable stylesheets (`CSSStyleSheet`, `replaceSync`, and `adoptedStyleSheets`). The vendored engine contains WebGL machinery, but Microsoft publishes no Face UI 1.5.0 GPU, WebGL version, resolution, or frame-rate minimum, so the exact physical-device fixture is authoritative. |
| Protected study media | A secure context; Shaka Player 4.6.0 startup; DASH and Media Source Extensions; a positive `MediaSource.isTypeSupported()` result for every actual container and codec; Encrypted Media Extensions; a successful `requestMediaKeySystemAccess()` for the exact PlayReady configuration; an enabled PlayReady CDM; compatible encryption scheme, session type, robustness, and decoder; a reachable authorized EZDRM license service; the content's required PlayReady security level, output-protection level, and HDCP path; and a passing capture-resistance qualification for the exact environment and defined capture methods. The production MPDs were not fetched, so exact codec, profile, level, rendition, encryption, output, and capture requirements remain unverified until controlled nonproduction fixtures provide them. |
| Public status report | Baseline native modules, DOM, Fetch/JSON, and `URLSearchParams`. It does not require camera, Face, Shaka, MSE, EME, PlayReady, or authenticated session storage. |
| Warning pages | DOM rendering and the small entry-specific classic-script capabilities. Active entries apply the inclusive `<= 1024` minimum-viewport admission rule. The viewport warning evaluates its strict `> 1024` recovery boundary on initial execution and resize, validates a bounded relative same-origin return target, and recovers with replacement navigation at most once. A missing browser-identification API must not prevent either warning document from rendering. |
| Fullscreen | Shaka's UI may expose fullscreen when the Fullscreen API and the embedding policy allow it. Fullscreen absence or rejection limits that control but does not by itself make the browser unsupported, invalidate authentication, or prove that protected playback is unavailable. |

Shaka's `isBrowserSupported()` is only a generic API-floor check. It does not
request this application's PlayReady key system, inspect its MPD codecs, obtain
a license, validate a decoder or output-protection path, or exercise Face. The
current configuration uses the legacy `com.microsoft.playready` key-system
string, which Microsoft documents as deprecated. Changing that string, Shaka,
DRM, codecs, licences, or media is outside this task; the controlled protected-
media fixture must therefore exercise the exact current configuration.

Microsoft documents secure PlayReady paths, security levels, license policy,
output protection, and hardware DRM, but does not promise that every Edge
screenshot or recorder returns black pixels. The current source does not
request a hardware-DRM key-system string or explicit robustness, security-
level, output-protection, or HDCP policy, and it cannot reveal the policies
issued by the remote license service. The runtime Edge/Windows candidate
classifier and PlayReady server mapping are consequently implementation evidence, not proof of capture
resistance; the controlled application qualification is authoritative for the
bounded claim above.

The Azure Face UI package and release notes do not publish a browser-family,
channel, OS, camera-resolution, or GPU support matrix for version 1.5.0.
Microsoft's liveness guidance instead places responsibility on the application
to use a trusted modern browser/device and physical camera. The Windows/Edge
selection above is consequently this application's conservative, evidence-
backed target pending controlled qualification, not a claim made by the
package README.

### Failure boundaries

The centralized browser-admission classifier preserves these distinct outcomes:

1. **Unsupported environment:** a positively identified OS, device class,
   browser family, or channel matches an explicit unsupported designation
   above, or its browser/OS implementation is known to be incapable of exposing
   a mandatory platform API. This is the only category that may be labelled
   unsupported. A transient denial or unavailable device/service is not such
   an implementation-level incompatibility.
2. **Unverified environment:** the combination is absent from the supported
   rows without an explicit unsupported designation, or identification or
   application evidence is insufficient for a support claim. Record it
   separately; do not silently promote it to supported or misreport it as a
   camera, DRM, or dependency failure.
3. **Camera unavailable or permission denied:** the browser can still be a
   supported browser. Camera absence, operating-system privacy settings,
   `NotAllowedError`, device startup failure, capture interruption, and the Face
   component's camera-specific errors belong to a recoverable Face path. The
   Face component documents `EnvironmentNotSupported` as a liveness-mode
   lighting failure and `ClientVersionNotSupported` as a client-version
   failure; neither value is an unsupported-browser verdict.
4. **Protected media unavailable:** an EME/PlayReady denial, disabled CDM,
   codec or decoder mismatch, license rejection, insufficient security/output
   protection, remote-session restriction, or HDCP failure belongs to the
   media path. A positive Shaka generic check does not collapse these cases
   into browser support. Lack of completed capture qualification alone makes a
   selected or otherwise non-excluded candidate unverified for protected study;
   an environment explicitly outside the current product boundary remains
   unsupported. A known intelligible protected-video leak in an in-scope
   capture method makes that environment unsupported for protected study until
   corrected and requalified; a transient license, media, or output failure on
   an otherwise qualified path remains a protected-media failure.
5. **External dependency failure:** Face assets or service, Shaka/jsPDF CDN,
   API, report, download, MPD, media, or EZDRM license endpoints can fail in a
   supported browser. Timeouts, TLS, CORS, authorization, entitlement, and
   server failures remain dependency or application failures.
6. **Other recoverable runtime failure:** session expiry, malformed data,
   storage denial, fullscreen rejection, graphics initialization, and ordinary
   application exceptions retain their own error boundaries. The inclusive
   minimum-viewport rule is a separate admission decision, not evidence of a
   browser, operating system, device class, or runtime failure.

No failure after a capability was admitted may be retrospectively rewritten as
"unsupported browser" merely because a convenient user-agent check exists.

### Environments without `userAgentData`

`navigator.userAgentData` is optional input. Its absence is expected in some
selected public browsers and must never throw, redirect by itself, or be used
as proof that the browser is unsupported. The implementation therefore:

- reads `userAgentData` defensively when present and uses a centralized,
  testable fallback identification path when it is not;
- keeps policy identification separate from capability probes and from the
  recoverable runtime failures above;
- allows the public status report and warning documents to proceed when their
  own capabilities pass, including a synthetic profile with no
  `userAgentData`;
- classifies a full-journey browser whose family cannot be established by either
  identification path as unverified rather than unsupported, without throwing
  or initializing Face, camera, DRM, or production integrations first; and
- avoids exact `userAgentData` brand equality as the sole supported-browser
  condition.

This policy permits the defensive legacy `navigator.userAgent` fallback now
used for family and platform identification; it does not make that string a
capability test or support qualification.

### Runtime admission and qualification boundary

One centralized classifier now governs login, initial notices, photo
registration, and study. It returns a structured `candidate`, `unsupported`, or
`unverified` outcome with a stable reason code. Consistent Windows desktop and
Edge family evidence plus the entry's mandatory API shapes produces only an
eligible candidate. Explicit non-Windows, mobile, embedded, or non-Edge evidence
is unsupported; insufficient or genuinely conflicting evidence is unverified.
Ordinary Chromium base brands and tokens in Edge evidence are neutral. Both
non-candidate outcomes replace the current entry with the slashless
device/browser-warning route and do not proceed to viewport, session, Face, or
study work.

The classifier and its user-agent inputs are spoofable. A candidate result does
not prove Windows servicing state, physical x64 hardware, Edge channel or exact
qualified build, PlayReady or hardware DRM availability, codec/license/output-
protection compatibility, or capture resistance. It neither probes nor starts
camera, Face, WebAssembly, media, DRM, licenses, codecs, or external services.
Those later runtime and controlled-qualification results retain the distinct
failure boundaries above. The identity-based non-DRM exception separately
bypasses protected playback only after candidate entry.

Login and registration provide the vendored Face bundle through a literal lazy
module loader. Unsupported and unverified profiles cannot call that loader;
candidate profiles load it only after an admitted Face flow has also received
an exact active login result. Returning-user Login begins one tokenless,
single-flight preparation after its protected Face-session request starts; that
preparation mounts the component so its unchanged selected engine/WASM path can
load during the request, but it cannot start the component or camera before the
token arrives. Registration retains post-response lazy startup. Each actual
startup is single-flight, while a settled startup failure may still be retried.
Status report and both warning entries remain outside browser admission, and the
device/browser diagnostic reads absent or partial client hints defensively.

### Verification matrix and maintenance

For every qualification, record the date, exact Windows build, browser family,
channel and full build, physical device/graphics details, camera model when
Face is exercised, capability-probe results, fixture version, and outcome. Do
not use production credentials, customer data, production Face sessions,
production licenses, or production media.

| Verification row | Required controlled evidence |
| --- | --- |
| Edge Stable and Extended Stable, complete journey | Synthetic baseline profiles plus a physical Windows 11 smoke covering login Face, first-time registration, notices, ordinary study navigation, exact nonproduction PlayReady media, report, and logout. Install interception before application scripts and stub every production integration. |
| Edge Stable and Extended Stable, Face registration | Allow and deny camera in separate controlled fixtures; exercise non-SIMD WebAssembly fallback and usable graphics; distinguish camera, Face-service, and unsupported outcomes. |
| Edge Stable and Extended Stable, protected media | Probe exact MSE codecs and EME PlayReady configuration, then use a nonproduction MPD/license fixture. Record exact Windows, Edge and CDM builds; GPU, driver, decoder and hardware-acceleration state; license security/output policy; capture tool/API version; and internal or supported HDCP external-display path. Exercise an operating-system screenshot, browser screenshot when available, operating-system screen recording, a representative third-party recorder, and browser/window/screen sharing in inline playback and fullscreen when available. Exercise the intended hardware-accelerated profile and a disabled/unavailable negative profile, which may refuse playback but must not expose an intelligible protected-video image. Pass only when protected playback works on the intended profile and every in-scope capture is blocked or its protected-video region is black, blank, or omitted with no intelligible protected-video image. Record the video and audio results separately and disclose any captured program audio. Generic Shaka support, CDM availability, license acquisition, playback, or HDCP alone is a failure of the qualification. |
| Edge, Chrome, and Firefox public matrix | Load status report and both warning entries with intercepted APIs; exercise valid, empty, malformed, and encoded query strings; include profiles with absent and partial `userAgentData`; prove no Face, camera, Shaka, EME, license, or authenticated-session dependency is initialized. |
| Explicit unsupported and unverified profiles | Cover Windows/browser/channel exclusions, another Chromium brand, missing identification, missing camera permission, missing DRM, dependency timeout, and fullscreen rejection as separate expected categories. |

Run the repository's static capability profiles on every change to the
learning-platform entry or lifecycle seams. Qualify each newly promoted
selected browser build within five business days and run Edge Beta validation
before the next Stable promotion when practical. Review the policy and all
primary sources quarterly, with an out-of-cycle review for a Windows or Edge
servicing change, Face UI or Shaka change, PlayReady/EZDRM policy change,
browser-channel change, capture tool/API change, GPU or graphics-driver change,
security advisory, customer incident, or failed capture smoke.
The **Last evidence review** date at the start of this section must advance
only with that review; the decision date changes only if the selected policy
changes.

Shaka 4.6.0 is no longer a maintained Shaka branch, while Microsoft advises
keeping the Face client current. Those are maintenance risks and review
triggers, not authorization in this task to upgrade either dependency.

### Primary evidence

- Microsoft Edge: [release channels](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-channels),
  [support lifecycle](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-support-lifecycle),
  and [supported operating systems](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-supported-operating-systems).
- Microsoft Windows: [Windows 11 lifecycle](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro).
- Azure Face: [Face UI 1.5.0 package README](https://github.com/Azure-Samples/azure-ai-vision-sdk/blob/1.5.0/samples/web/README.md),
  [1.5.0 release](https://github.com/Azure-Samples/azure-ai-vision-sdk/releases/tag/1.5.0),
  [liveness tutorial](https://learn.microsoft.com/en-us/azure/ai-services/face/tutorials/liveness),
  [shared responsibility](https://learn.microsoft.com/en-us/azure/ai-services/face/liveness-detection-shared-responsibility),
  [SDK version policy](https://learn.microsoft.com/en-us/azure/ai-services/face/sdk/understand-the-liveness-sdk-versions),
  and [liveness error categories](https://orange-forest-0ea70d510.5.azurestaticapps.net/enums/LivenessError.html).
- Camera security and permission: [Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/#dom-mediadevices-getusermedia)
  and [Microsoft Windows and Edge camera privacy](https://support.microsoft.com/en-us/windows/privacy-windows-camera-microphone-and-privacy).
- Shaka Player 4.6.0: [platform and DRM matrix](https://github.com/shaka-project/shaka-player/blob/v4.6.0/README.md#L168-L211),
  [`isBrowserSupported()` implementation](https://github.com/shaka-project/shaka-player/blob/v4.6.0/lib/player.js#L896-L939),
  [PlayReady configuration guidance](https://github.com/shaka-project/shaka-player/blob/v4.6.0/docs/tutorials/drm-config.md#L172-L204),
  and [maintained branches](https://github.com/shaka-project/shaka-player/blob/main/maintained-branches.md).
- Microsoft Edge and PlayReady: [Edge DRM scope](https://learn.microsoft.com/en-us/legal/microsoft-edge/privacy#digital-rights-management-and-media-licenses),
  [key-system strings](https://learn.microsoft.com/en-us/playready/overview/key-system-strings),
  [security levels](https://learn.microsoft.com/en-us/playready/overview/security-level),
  [hardware DRM](https://learn.microsoft.com/en-us/windows/uwp/audio-video-camera/hardware-drm),
  [license policies](https://learn.microsoft.com/en-us/playready/overview/license-and-policies),
  [output-protection levels](https://learn.microsoft.com/en-us/playready/overview/output-protection-levels),
  and [Edge screenshot-policy limitations](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/disablescreenshots).
- EZDRM: [PlayReady browser/platform scope](https://www.ezdrm.com/product-playready)
  and [controlled playback testing requirements](https://www.ezdrm.com/hubfs/Documentation/EZDRM-Testing-Playback-v2.2.pdf).
- Deferred DRM candidates: Apple [FairPlay Streaming](https://developer.apple.com/streaming/fps/)
  and [`UIScreen.isCaptured`](https://developer.apple.com/documentation/uikit/uiscreen/iscaptured),
  whose explicit black-video statement is scoped to UIKit capture rather than
  every macOS Safari path; Google [Widevine overview](https://developers.google.com/widevine/drm/overview),
  which establishes browser playback availability rather than capture
  suppression; and [Mozilla bug 1991580](https://bugzilla.mozilla.org/show_bug.cgi?id=1991580),
  which is implementation evidence of visible Widevine video in a Firefox
  recording rather than a normative support contract.
- Public-browser evidence: [Chrome release channels](https://developer.chrome.com/docs/web-platform/chrome-release-channels/),
  [Chrome system requirements](https://support.google.com/chrome/a/answer/7100626?hl=en),
  [Firefox release calendar](https://wiki.mozilla.org/Release_Management/Calendar),
  and [Firefox system requirements](https://www.mozilla.org/en-US/firefox/system-requirements/).
- Web standards: [Encrypted Media Extensions](https://www.w3.org/TR/encrypted-media/)
  and [Media Source Extensions](https://www.w3.org/TR/media-source-2/).

## Source-observed current behavior

### Public entries and navigation

`frontend-deployment.json` maps tracked source areas under
`apps/learning-platform/` to their reviewed locations under
`dist/plataforma/`. The seven entry directories include the renamed
`viewport-warning/` → `aviso-viewport/` and
`device-browser-warning/` → `aviso-dispositivo-navegador/` mappings plus the
aligned `photo-registration/` → `cadastro-foto/` mapping;
`azure-ai-vision-face-ui/` retains its matching suffix; and the canonical module
tree preserves matching relative names under `modules/`.
The separate `apps/shared/` → `dist/shared/` infrastructure mapping publishes
the backend-origin module imported by the four API-bearing platform entries.
The phase-B manifest emits only that canonical module tree and declares all 15
former compatibility module URLs described below as explicit not-found paths.
The manifest declares exactly seven public entries. Each canonical entry
includes a trailing slash and must return its listed `index.html` with HTTP
`200` and no redirect.

| Stable entry | Canonical public path | Current entry file | Direct dependencies |
| --- | --- | --- | --- |
| `LP-ENTRY-VIEWPORT` | `/plataforma/aviso-viewport/` | `apps/learning-platform/viewport-warning/index.html` | Login favicon; own CSS, logo, and async classic script |
| `LP-ENTRY-DEVICE-BROWSER` | `/plataforma/aviso-dispositivo-navegador/` | `apps/learning-platform/device-browser-warning/index.html` | Login favicon; own CSS, logo, and synchronous classic script |
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
| Viewport warning | `/plataforma/login/img/FAVICON.ico`; `/plataforma/aviso-viewport/style.css`; `/plataforma/aviso-viewport/img/LOGO_MACHADO.png`; `/plataforma/aviso-viewport/main.js` |
| Device/browser warning | `/plataforma/login/img/FAVICON.ico`; `/plataforma/aviso-dispositivo-navegador/style.css`; `/plataforma/aviso-dispositivo-navegador/img/LOGO_MACHADO.png`; `/plataforma/aviso-dispositivo-navegador/main.js` |
| Initial notices | `/plataforma/login/img/FAVICON.ico`; `/plataforma/avisos-iniciais/style.css`; `/plataforma/avisos-iniciais/img/LOGO_MACHADO.png`; `/plataforma/avisos-iniciais/main.js` |
| Registration | `/plataforma/login/img/FAVICON.ico`; `/plataforma/cadastro-foto/style.css`; `/plataforma/azure-ai-vision-face-ui/` as `<base>`; `/plataforma/cadastro-foto/img/LOGO_MACHADO.png`; `/plataforma/cadastro-foto/img/REFERÊNCIAS_FOTOS.png`; `/plataforma/cadastro-foto/main.js`; user-invoked `https://www.resizepixel.com/` and `https://cloudconvert.com/` links |
| Study | `/plataforma/estudo/img/FAVICON.ico`; `https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.6.0/controls.css`; `/plataforma/estudo/style.css`; `/plataforma/estudo/img/LOGO_MACHADO.png`; `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`; `https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.6.0/shaka-player.ui.js`; `/plataforma/estudo/main.js` |
| Login | `/plataforma/login/img/FAVICON.ico`; `/plataforma/login/style.css`; `/plataforma/azure-ai-vision-face-ui/` as `<base>`; `/plataforma/login/img/LOGO_MACHADO.png`; `/plataforma/login/main.js` |
| Status report | `/plataforma/statusreport/img/FAVICON.ico`; `/plataforma/statusreport/style.css`; `/plataforma/statusreport/img/LOGO_MACHADO.png`; `/plataforma/statusreport/main.js` |

The device/browser warning renders the exact visible copy "Acesse a plataforma
em um computador com Windows, usando o Microsoft Edge." The viewport warning
renders the exact visible copy "Maximize a janela do navegador ou use uma tela
maior para continuar." The latter describes only the inclusive viewport rule;
it does not claim detection of a device class, physical screen, or literal
browser full-screen state.

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

The warning-navigation repair replaces the former current-namespace warning
entries without compatibility aliases. These six forms are explicit `404`
contracts with no `Location` header:

- `/plataforma/aviso-navegador`
- `/plataforma/aviso-navegador/`
- `/plataforma/aviso-navegador/index.html`
- `/plataforma/aviso-dispositivo`
- `/plataforma/aviso-dispositivo/`
- `/plataforma/aviso-dispositivo/index.html`

No redirect, duplicate output, forwarding document, or former warning asset
subtree is emitted. This current-namespace replacement does not rename or
revive the independently retired historical
`/plataforma_v2/aviso-dispositivo/` and
`/plataforma_v2/aviso-navegador/` routes above. The manifest now contains 56
`notFoundPaths`; together with eight `repositoryOnlyPaths`, verification expects
64 explicit negative paths.

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
leaving only the aligned module paths. At that historical phase-B snapshot, the
manifest contained 50 `notFoundPaths`; with the eight `repositoryOnlyPaths`,
source and published verification expected 58 negative paths. The later warning
retirements account for the current 64-path total above. The deployed-path
phase-B gate is complete: its merge, exact production artifact, production
routes, and preview cleanup were verified before the centralized-origin work
began.

#### Entry-markup modernization

The seven entry documents now use `pt-BR` document language, semantic page
landmarks and headings, native forms and controls, explicit labels and
accessible names, unique IDs, and valid status, alert, and ARIA relationships.
The study entry retains its 171-topic state machine while representing module
and topic actions as native buttons, assessment and feedback choices as labeled
controls grouped by `fieldset`/`legend`, progress as an ARIA progress bar, and
generated continuation actions as native buttons. Runtime state keeps
`disabled`, `aria-expanded`, `aria-current`, and `aria-valuenow` synchronized.

The modernization preserves the exact Brazilian-Portuguese visible copy outside
the two approved warning messages above and preserves
the application-owned IDs, classes, selector relationships, event targets,
navigation, storage, request, Face, media, and timing seams. All copy in the
seven entries is deliberately non-selectable, including dynamically inserted
content and application-styled copy inside the Face component's closed Shadow
DOM. Keyboard focus has visible `:focus-visible` treatment, invalid fields and
content presented by user-initiated in-page study transitions receive deliberate
focus, while initial study hydration retains the browser's natural document
focus and does not paint the topic-heading focus indicator. Animated or
transitioned entries honor `prefers-reduced-motion`. Feedback cards retain
20-pixel separation and keep each five-choice scale on one row; the certificate
download control remains horizontally centered. Existing visual identity and
all source/deployed path relationships remain unchanged.

Browser verification covers the source and generated previews with production
networking blocked before application scripts execute and with local inert
fixtures for otherwise remote dependencies. It does not submit forms or contact
the backend, Graph, Face, workbook, mail, media, license, or download paths. The
inclusive `<= 1024` minimum-viewport gate remains a replacement transition, so active-
entry mobile-width and 200%-zoom reflow cannot be observed below that boundary
without changing behavior. Verification covers the warning destination at
those widths and active entries above the gate; this is an explicit limitation,
not evidence of responsive behavior below the gate.

Ordinary internal navigation remains normal document navigation through
`window.location.href`. Admission navigation is deliberately separate: GATE-01
and GATE-02 transitions replace the current document so a warning loop is not
added to history. Platform-owned destinations retain the following
**slashless**, lower-case, root-relative strings:

| Destination | Exact internal path | Writers |
| --- | --- | --- |
| Device/browser warning | `/plataforma/aviso-dispositivo-navegador` | Login, initial notices, registration, study at GATE-01 |
| Viewport warning | `/plataforma/aviso-viewport` | Login, initial notices, registration, study, status report at GATE-02 |
| Login | `/plataforma/login` | Registration failure/rejection, unauthenticated study, logout, session expiry |
| Initial notices | `/plataforma/avisos-iniciais` | Active login with Face enabled and no registered photo |
| Registration | `/plataforma/cadastro-foto` | Successful initial-notices acknowledgement |
| Study | `/plataforma/estudo` | Existing logged flag, Face-disabled login, successful Face verification/registration |

The maintained client-intake application separately targets the canonical
`/plataforma/aviso-viewport/` entry, including its trailing slash, as an
explicit cross-application minimum-viewport destination. It is not part of the
platform's slashless internal-navigation table.

There is no History API state, hash router, `popstate`, or client-side route
normalizer in the platform. Module and topic changes are DOM-only state.
Admission, viewport-warning recovery, and browser-final Study finalization use
`location.replace`. Explicit legacy logout, legacy timer expiry, and a logged-
out direct or `pageshow`-restored Study page therefore do not leave Study as an
ordinary Back destination. Other login, study, registration, and content
navigation remains normal document navigation. The canonical destination for
every current platform entry is the exact trailing-slash path declared by the
manifest and README.

Production serves each current slashless platform entry with the same entry
bytes and HTTP `200`, without a `Location` header or HTTP redirect. On direct
slashless entry, the browser keeps the exact path, query string, and fragment
through refresh when existing page-lifecycle logic does not navigate away; the
route layer adds no normalization history entry. The source-preview and
generated-artifact local servers have the same no-redirect directory lookup.
Slashless entry is compatibility behavior for current routes, not an authoring
destination or an alias for a retired path. The README owns the
cross-application canonical-navigation and browser-history expectations.

Login's separate registration/history rule remains the only scoped
`history.back()` flow: it runs when registration authorization is `Sim` and the
legacy `Origem_Aviso_Dispositivo` marker is not `Sim`. The viewport warning
still writes that exact legacy marker for compatibility, but it does not use
browser history for recovery.

Each GATE-02 replacement carries one percent-encoded `returnTo` value limited
to 2,048 encoded characters and containing the originating pathname, query
string, and fragment. The viewport warning accepts only a relative same-origin
value whose normalized pathname is
one of the following; the exact accepted slashless or trailing-slash spelling,
query string, and fragment are preserved:

- `/plataforma/login[/]`
- `/plataforma/avisos-iniciais[/]`
- `/plataforma/cadastro-foto[/]`
- `/plataforma/estudo[/]`
- `/plataforma/statusreport[/]`
- `/formulario-informacoes-iniciais[/]`

Absolute, protocol-relative, cross-origin, malformed, traversal, backslash-host,
`javascript:` scheme, credential-bearing, oversized, and otherwise unapproved
values are rejected without throwing or navigating externally. The viewport
warning evaluates recovery on initial script execution and resize, remains in
place while `window.innerWidth <= 1024`, and at `> 1024` replaces itself with
the validated origin at most once. A missing or invalid origin falls back to
canonical `/plataforma/login/`. A direct narrow warning entry therefore renders
normally, while a direct wide entry deterministically replaces to login rather
than consulting browser history.

#### Current source anchors

- Deployment mapping, entries, current root 404, and former-route retirement:
  [`frontend-deployment.json`](../frontend-deployment.json).
- Exhaustive entry and retirement test:
  [`scripts/frontend-deployment.test.mjs`](../scripts/frontend-deployment.test.mjs).
- README route/404 contract: [`README.md` lines 32-78](../README.md#L32-L78).
- Client-intake cross-application warning destination:
  [`main.js`](../apps/client-intake/main.js).
- Published page, support-file, and `404`/no-redirect checks:
  [`scripts/frontend-deployment-lib.mjs` lines 1281-1370](../scripts/frontend-deployment-lib.mjs#L1281-L1370).
- Slashless local behavior: manifest-aware source-preview aliases and routes
  [`scripts/frontend-deployment-lib.mjs` lines 708-747](../scripts/frontend-deployment-lib.mjs#L708-L747)
  and [`scripts/frontend-deployment-lib.mjs` lines 1103-1140](../scripts/frontend-deployment-lib.mjs#L1103-L1140),
  plus generated-artifact index fallback
  [`scripts/frontend-deployment-lib.mjs` lines 1213-1259](../scripts/frontend-deployment-lib.mjs#L1213-L1259).
- Exact HTML dependencies: viewport
  [`index.html` lines 8-26](../apps/learning-platform/viewport-warning/index.html#L8-L26),
  device/browser [`index.html` lines 8-26](../apps/learning-platform/device-browser-warning/index.html#L8-L26),
  notices [`index.html` lines 8-16](../apps/learning-platform/initial-notices/index.html#L8-L16)
  and [`index.html` line 72](../apps/learning-platform/initial-notices/index.html#L72),
  registration [`index.html` lines 8-17](../apps/learning-platform/photo-registration/index.html#L8-L17),
  [`index.html` lines 39-49](../apps/learning-platform/photo-registration/index.html#L39-L49),
  and [`index.html` line 71](../apps/learning-platform/photo-registration/index.html#L71),
  login [`index.html` lines 8-17](../apps/learning-platform/login/index.html#L8-L17)
  and [`index.html` line 57](../apps/learning-platform/login/index.html#L57),
  study [`index.html` lines 9-32](../apps/learning-platform/course-content/index.html#L9-L32) and
  [`index.html` lines 9108-9112](../apps/learning-platform/course-content/index.html#L9108-L9112),
  report [`index.html` lines 8-44](../apps/learning-platform/status-report/index.html#L8-L44).
- Slashless admission destinations and deterministic warning recovery: viewport
  [`main.js`](../apps/learning-platform/viewport-warning/main.js), shared
  [lifecycle seam](../apps/learning-platform/modules/lifecycle.js),
  [notices factory](../apps/learning-platform/modules/initial-notices.js),
  [registration factory](../apps/learning-platform/modules/photo-registration.js),
  [login factory](../apps/learning-platform/modules/login.js),
  [study coordinator](../apps/learning-platform/modules/course-content/application.js),
  [status-report coordinator](../apps/learning-platform/modules/status-report/application.js),
  and client-intake [`main.js`](../apps/client-intake/main.js).

### Application modules and production-edge seams

Every `main.js` remains the stable public entry asset within its current route.
The two warning entries retain classic scripts: synchronous for the
device/browser warning and async for the viewport warning. Login, initial notices,
registration, and status report retain their existing async native-module
bootstrap. Study now loads its existing ordered classic jsPDF and Shaka
dependencies followed by a non-async native-module `main.js`; this HTML
bootstrap change is the only script-mode delta.

The production entries own browser-global access and construct application
factories immediately during module evaluation. Application modules do not read
browser globals at top level. They receive explicit production edges at
construction; depending on the entry these include `window`, `document`,
`navigator`, ordinary and replacement navigation callbacks, `history`,
`sessionStorage`, `fetch`,
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
| `modules/session.js` | Centralizes the seven exact legacy key constants and raw `getItem`/`setItem` access plus the one scoped `removeItem` operation used for the stored row handle. The viewport-warning script retains direct raw storage access to the legacy origin marker. The seam adds no validation, normalization, authority, expiry, or revocation semantics. |
| `modules/platform-client.js` | Owns injected JSON GET/POST and ordered multipart POST mechanics. It normalizes fetch rejection and malformed JSON through the application error seam, still parses JSON before checking `ok`, and for parsed non-OK responses still throws exactly `{ status: response.status, error: data.error }`. It adds no retry, timeout, abort, dedupe, idempotency, or authorization header. |
| `modules/error-adapter.js` | Owns learning-platform semantic kinds, owner labels, operation allowlists, the exact named backend values, and transport/malformed/HTTP/unknown/application-local normalization. Feature modules branch only on its semantic kinds. |
| `modules/error-presentation.js` | Owns the reviewed Brazilian-Portuguese presentation catalog. It is the only production source containing visible `Erro_XXX` prefixes; machine values are never interpolated into alerts, logs, or rendered HTML. |
| `modules/lifecycle.js` | Owns the structured browser-admission outcomes, normalized Windows/Edge evidence, side-effect-free entry API-shape checks, and the exact inclusive `<= 1024` minimum-viewport admission decision. Entry factories retain replacement-navigation injection, listener installation, and gate order. |
| `modules/face-startup.js` | Owns one tokenless preparation attempt at a time: it loads the injected Face runtime lazily, constructs one custom element, applies the frozen `pt-BR`, font, and button properties, and mounts it once so the unchanged vendor engine path can begin. The captured attempt starts once when its caller later supplies a token; concurrent preparation/start calls remain single-flight, a settled actual start is not reused, and result lookup remains the caller's single backend GET. |
| `modules/login.js`, `modules/photo-registration.js`, `modules/initial-notices.js` | Own their existing credential, upload, Face, notice, form-reset, gate, storage, request, and navigation branches. Production configuration stays at the existing entry edge and is injected without being copied into tests or documentation. |
| `modules/status-report/query.js` | Parses the nine legacy query keys, including all current coercion and missing-value behavior. |
| `modules/status-report/charts.js` | Constructs chart markup/targets, applies the module range, independently sorts each metric, and renders the existing 15-slot layout and label quirks. |
| `modules/status-report/application.js` | Captures query/DOM state at factory construction, assigns `window.onload`, applies minimum-viewport admission before rendering/requesting, and owns the public request and error branches. |

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

### Browser, viewport, resize, and navigation gates

`GATE-01` applies one classifier on login, initial notices, registration, and
study. Defensive client hints and the legacy user-agent fallback identify only
a Windows/Edge candidate; per-entry mandatory API shapes are inspected without
calling them. Stable reason codes distinguish explicit unsupported evidence,
insufficient or conflicting unverified evidence, and the admitted candidate.
Both non-candidate outcomes replace the current document with slashless
`/plataforma/aviso-dispositivo-navegador`. Status report, client intake, and
both warning entries do not apply this gate. The device/browser-warning
diagnostic reads both absent and partial client hints defensively and never
prevents that ungated warning from rendering.

`GATE-02` is an inclusive minimum-viewport admission rule. Active entries
replace themselves with the viewport warning when
`window.innerWidth <= 1024`; `1024` is rejected and `1025` is admitted. The four
protected learning entries and the public status report use slashless
`/plataforma/aviso-viewport`; public client intake retains the canonical
trailing-slash `/plataforma/aviso-viewport/` destination. Every transition
includes the bounded encoded `returnTo` contract above. On protected entries,
`GATE-01` runs first, so unsupported and unverified profiles reach only the
device/browser warning without installing a viewport-gate resize listener or
beginning session, Face, or study work. An admitted profile then applies width
before session/history checks, Face work, or study refresh. Status report remains
outside `GATE-01`, but applies width first during `load` and does not render or
request while replacing itself. Client intake independently applies the same
inclusive decision without acquiring a browser gate. Wider active pages install
one resize listener so crossing down to the boundary performs the same
replacement transition. The rule uses no screen, touch, pointer, hover,
hardware, orientation, resize-history, or additional user-agent classifier.

The directly loaded viewport warning is also public and browser-ungated. Its
async classic script records the unchanged legacy
`Origem_Aviso_Dispositivo=Sim` marker, validates `returnTo`, and evaluates the
strict recovery boundary both initially and on resize. It remains at widths
through `1024`; above `1024` it replaces itself exactly once with the validated
origin or canonical `/plataforma/login/` fallback. It never calls
`history.back()`.

Gate order is stable:

| Entry | Current order |
| --- | --- |
| Login | browser candidate → minimum viewport → install resize gate → existing logged flag → registration/history rule → remain on login |
| Initial notices | reset device origin → browser candidate → minimum viewport → registration authorization → remain on notices and install resize gate |
| Registration | reset device origin → browser candidate → minimum viewport → registration authorization → remain on registration and install resize gate |
| Study | reset device origin → browser candidate → minimum viewport → logged flag → install resize gate → refresh |
| Status report | query parse during factory construction → minimum viewport during `load` → install resize gate → render/API; no browser/session gate |
| Client intake | existing initialization → minimum viewport decision → existing validation, participant, inert-interaction, and submit ordering; no browser/session gate |
| Viewport warning | write legacy marker → validate origin → initial width decision → remain/install resize recovery or replace once; no browser/session gate |
| Device/browser warning | render and diagnostic only; no browser, viewport, or session gate |

Login, notices, registration, and status report retain async module scripts.
Study's ordered classic jsPDF/Shaka dependencies are followed by its non-async
native-module entry. The viewport warning remains an async classic script and
the device/browser warning remains synchronous classic. Every application factory is installed immediately when
its entry module evaluates, with no `readyState` or `DOMContentLoaded`
fallback. After Study passes GATE-01, GATE-02, and its logged flag,
it installs one `pageshow` listener before refresh. A restored page whose flag
is no longer exact `Sim` stays inert and hidden, receives the same local
cleanup, and replace-navigates to Login without protected work. No other page
handles `pageshow` or BFCache restoration, and no page handles `pagehide`,
`beforeunload`, or `popstate`.

Current anchors: [login factory](../apps/learning-platform/modules/login.js),
[notices factory](../apps/learning-platform/modules/initial-notices.js),
[registration factory](../apps/learning-platform/modules/photo-registration.js),
[study coordinator](../apps/learning-platform/modules/course-content/application.js),
[status-report coordinator](../apps/learning-platform/modules/status-report/application.js),
shared [lifecycle seam](../apps/learning-platform/modules/lifecycle.js), viewport
warning [`main.js`](../apps/learning-platform/viewport-warning/main.js), and
device/browser diagnostic
[`main.js`](../apps/learning-platform/device-browser-warning/main.js).

### Session-storage contract

There are exactly seven `sessionStorage` key spellings. Accents, hyphens,
underscores, and capitalization are compatibility data. Values are strings
because they pass through Web Storage. Study has one exact `removeItem()` path
for `IndexVerificado`; no flow calls `clear()`, adds a key, or removes any of
the other six keys.

| Exact key | Writers and value convention | Readers and transition use | Lifetime and security implication |
| --- | --- | --- | --- |
| `IndexVerificado` | Login unconditionally stores the response value. Active login receives an opaque signed row handle; inactive login has no value and storage receives string `undefined`. | Registration sends it in multipart; study sends it in protected JSON calls. Study removes the stored value during explicit legacy logout, timer expiry, and logged-out direct/BFCache restoration. | Backend handle is reusable for exactly four hours and is not rotated or server-revoked by refresh/logout. Removing this tab's stored copy prevents ordinary reuse from that tab; a previously copied handle can remain technically usable until its original expiry. |
| `Usuário_Foto_Cadastrada` | Login stores backend `Sim`/`Não`. | No current reader. | Dead mirrored state; registration does not update it and logout leaves it. |
| `Horário-Encerramento-Sessão` | Active credential login stores `Date.now() + 14,400,000` as decimal epoch milliseconds before registration/Face work. | Study coerces with `Number()` and drives its one-second countdown. | Persists across reload/history/logout. Missing becomes `0` and immediately expires; tampered nonnumeric text becomes `NaN`, breaks the display, and prevents expiry comparisons. Uses mutable browser clock/state. |
| `Usuário_Logado` | `Sim` after Face-disabled login or successful Face verification/registration; `Não` on explicit logout or timer expiry. | Login redirects exact `Sim` to study; study rejects anything other than exact `Sim`. | UI-only gate and forgeable. Signed handle remains backend authority. Refresh failure does not clear it. |
| `Usuário_Autorização_Cadastro` | `Sim` after active Face-enabled login reports photo `Não`; `Não` immediately after registration endpoint success, before local liveness completes. | Gates notices/registration and controls login's history-back rule. | UI-only. Initial registration failure leaves `Sim`; later liveness failure leaves `Não`. Forging opens pages but does not create a valid row handle. |
| `Origem_Aviso_Dispositivo` | Viewport warning writes `Sim`; notices, registration, and study overwrite `Não` on load; login's history branch writes `Não`. | Login history-back rule. | Documented legacy compatibility key and persistent tab navigation sentinel that can become stale; it is not a return-target store. |
| `TempoSessão_Segundos` | No writer exists. | Study reads it once into an unused variable. | Dead legacy key; old values have no current effect. |

The client countdown turns red at ten minutes and adds the final-five-minute
class at five minutes. At zero it applies the same browser-local finalization
as explicit logout: make protected presentation inert and hidden, stop the
timer, pause media, write logged `Não`, remove the stored handle, and replace-
navigate to Login. The backend handle has its own four-hour clock. Refresh
neither rotates nor returns a handle, and it does not recheck workbook login
status as an authorization condition. Neither logout path sends a request,
calls a session DELETE endpoint, or revokes a copied handle.

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
and expiry in [`session-timer.js`](../apps/learning-platform/modules/course-content/session-timer.js); viewport warning
[`main.js`](../apps/learning-platform/viewport-warning/main.js); backend
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

`LP-STATE-LOGIN` begins by selecting the production backend role and computing
the centralized browser-admission result without loading Face. The load gate
then applies candidate admission, minimum viewport, existing-login, and
registration-history rules in that order. Non-candidate submission is inert.
Candidate
submission disables and hides the button, shows the initialization message,
and captures the untrimmed credentials. A matched response is stored before
branch selection. The lazy Face runtime remains absent for invalid, inactive,
Face-disabled, and photo-registration branches.

- Inactive login resets the form and displays the backend-projected access
  deadline. It is a successful HTTP response without a row handle.
- Active login starts the client four-hour deadline immediately.
- Exact Face status `Inativo` sets logged `Sim` and opens study.
- Otherwise exact photo status `Não` sets registration authorization `Sim` and
  opens initial notices.
- Otherwise exact photo status `Sim` starts the protected Face-session request,
  then prepares and mounts one tokenless Face element while that request is
  pending. The returned token starts that captured element exactly once; the
  result is read once and only exact liveness `realface` plus boolean match
  `true` is accepted.
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

`LP-STATE-FACE-VERIFY` overlaps only tokenless local preparation with the
already-required protected session request for an existing reference photo.
The request still starts first. Preparation uses the same literal wrapper,
mount, base resolution, engine selection, and assets; it performs no backend
request, accepts no token, and cannot start the camera. After the token-bearing
response, the flow keeps the same component/result sequence. It ignores the
value resolved by the component, does not poll the result, and uses only the
backend result fields. The Face component's vendored loader waits for its
engine, exposes a cancel path after a long-load delay, and rejects on its own
timeout/failure states; those failures map to frontend `Erro_006`. A protected
session failure keeps its existing error precedence even if concurrent
preparation also fails.

#### Returning-user Face startup timing evidence

The production-network-denied entry harness now records the returning-user
critical path with deterministic virtual delays. The fixed profile assigns 120
virtual milliseconds to Login, 600 to the protected Face-session request, 100
to the wrapper import, 900 from element mount to synthetic engine readiness,
and 80 to the single result request. At test-only baseline commit `c51f979`,
whose production sources still match `ff83ea0`, the serialized path reaches
Study at 1,800 virtual milliseconds. The current overlap reaches the same
navigation at 1,200: a 600-unit or 33.3% synthetic critical-path reduction.

These are logical fixture milliseconds, not measured production latency. The
evidence proves the removed dependency edge and exact makespan under one
repeatable profile. It makes no claim about real network throughput, WASM
compilation contention, camera/liveness duration, or Study document/refresh
time. The successful flow retains three exact browser API requests, one selected
engine path, one component start, one result GET, and no polling. Relative to
the serialized baseline, successful asset count and bytes are unchanged; a
valid returning-user attempt whose protected session later fails may now spend
bandwidth on the same public Face assets speculatively.

Current anchors: registration HTML
[`index.html` lines 25-59](../apps/learning-platform/photo-registration/index.html#L25-L59),
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
[`index.html` line 1400](../apps/learning-platform/course-content/index.html#L1400), representative
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

Explicit logout and timer expiry make the protected Study presentation inert
and hidden, disable logout, stop the timer, pause active media, set
`Usuário_Logado = Não`, remove only `IndexVerificado`, and replace-navigate to
Login. A logged-out direct or `pageshow`/BFCache-restored Study page applies the
same local cleanup before refresh or protected work. The deadline,
registration authorization, photo mirror, origin marker, and dead legacy
seconds value remain unchanged. No logout request, session DELETE, storage key,
cross-tab signal, or backend revocation is added, and a later valid login writes
a fresh handle/deadline/logged state normally.

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

After minimum-viewport admission, the page inserts caller labels, builds 12 chart blocks
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

The complete current platform set is the 182-path union below. Phase B
established the count; entry-markup modernization changed reviewed source bytes,
and warning-navigation repair later replaced ten former warning outputs with ten
renamed outputs without changing the count. Mappings copy tracked source bytes
without a bundle or generated-source layer.

| Source area → output suffix | Files | Complete set description |
| --- | ---: | --- |
| `viewport-warning/` → `aviso-viewport/` | 5 | `index.html`, `main.js`, `style.css`, `img/FAVICON.ico`, `img/LOGO_MACHADO.png` |
| `device-browser-warning/` → `aviso-dispositivo-navegador/` | 5 | Same five relative names as viewport warning |
| `initial-notices/` → `avisos-iniciais/` | 4 | `index.html`, `main.js`, `style.css`, `img/LOGO_MACHADO.png` |
| `azure-ai-vision-face-ui/` → `azure-ai-vision-face-ui/` | 85 | Face component, 75 dictionaries, five images, regular/SIMD JS and WASM pairs |
| `photo-registration/` → `cadastro-foto/` | 5 | `index.html`, `main.js`, `style.css`, `img/LOGO_MACHADO.png`, `img/REFERÊNCIAS_FOTOS.png` |
| `course-content/` → `estudo/` | 41 | HTML/JS/CSS, 33 study files, five images |
| `login/` → `login/` | 6 | HTML/JS/CSS, favicon, logo, unused duplicate `Brightness.svg` |
| Canonical `modules/` → matching `modules/` paths | 26 | Nine top-level modules, 14 `course-content/` responsibility modules, and three `status-report/` modules retain their source-relative suffixes |
| `status-report/` → `statusreport/` | 5 | HTML/JS/CSS, favicon, logo |
| **Current emitted total** | **182** | Canonical output root is `dist/plataforma/` |

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
none of them and declares every URL as an explicit `404`; the phase-B production
verification confirmed every no-redirect outcome before that deployed-path step
closed.

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
stylesheet that makes the host and its internal copy non-selectable and applies
`#4a0816` to `#spinnerCheck #circle` and `#spinnerCheck #tick`. These rules do
not replace localized copy or edit any vendor asset; the complete vendored Face
subtree remains byte-identical.

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
has no source reference. The viewport and device/browser warning subtrees each
emit an own favicon, but both HTML entries deliberately reference the login
favicon.

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
[`index.html` lines 1348-1378](../apps/learning-platform/course-content/index.html#L1348-L1378),
assignment matrix
[`downloads.js`](../apps/learning-platform/modules/course-content/downloads.js), certificate
library/UI [`index.html` lines 9084-9112](../apps/learning-platform/course-content/index.html#L9084-L9112),
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
and [`index.html` lines 9108-9112](../apps/learning-platform/course-content/index.html#L9108-L9112).

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

The exact phase-B/pre-markup baseline at `sistemas` commit
`6afd8435f1c5c80aaca777ec7c6c9938b87733f6` removed the 15 compatibility
outputs without changing canonical source bytes. Its merge, production artifact,
routes, and preview cleanup were verified before the centralized-origin work
began. Its historical identities are:

| Phase-B/pre-markup baseline scope and digest framing | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform subset, retaining full output paths `plataforma/...` | 182 | 20,693,467 | `25f18cb7306246bb5a4b63efc8046365c50da381c3e10d33e55cf3f1021dd605` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 182 | 20,693,467 | `21ea67296d7fc40555033f4fbe181937b2f3b2a5c869aa38e2b2eab00e67ebcb` |
| Complete generated `dist/` artifact | 257 | 27,298,502 | `166506b93b3477a175851a089360631894b0a67e9fa3fc9bdab4bd8b5b185561` |

The historical direct phase-A-to-phase-B comparison removed exactly the 15
named legacy outputs and their 66,549 bytes. It added no output. At that
baseline, all 257 remaining complete-artifact paths—including all 182 platform
paths—retained the same canonical source path and byte-identical content.

The compatibility copies were JavaScript only, so phase A and the phase-B
baseline shared the same scoped non-JavaScript identities. The historical
non-JavaScript digest changed from the pre-alignment baseline because
registration HTML bytes and the registration HTML, CSS, and image output paths
changed; the binary digest changed because the two registration image paths
moved. These were the aligned phase-B/pre-markup scoped identities:

| Phase-B/pre-markup aligned scoped identity | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform non-JavaScript files, retaining full output paths | 146 | 20,252,456 | `47fac3283dd961c7e2bffff0d029cc468e2f66c6e80bc4c36088e1916db3cd1f` |
| Platform binary files, retaining full output paths | 52 | 19,319,394 | `afd12f0746dd5463077e8d9a879fb852b1ebfd81686afe7ca0b9f63fdf804563` |
| Vendored Face subtree, paths relative to its root | 85 | 9,526,729 | `56da181049f18302b00fdbf04851d1433adf819341564a326e652c75145576e3` |
| Study downloads, retaining full output paths | 33 | 9,163,893 | `1073822d29815c0d23e984c347b70c468235be47083b7ce5c23b33565a0dece5` |
| Certificate inputs, source-derived `addImage` order | 3 | 148,461 | `82c735c7ac2fa32e09d71c326765db9c52ce63b58144c7c7b100458f8b897591` |

The centralized-origin change preserved all 257 application output paths and
added only the separately mapped `shared/backend-origin.js` runtime file. The
seven-entry markup modernization then retained that 258-file graph while
changing reviewed HTML, CSS, and application JavaScript bytes. Clarifying
minimum-viewport admission order and retaining evidence-backed client-intake
reflow corrections again preserve the same 258 paths while changing scoped
JavaScript and CSS bytes. Warning-navigation repair retains the 258-file count
while replacing exactly ten former warning paths with ten renamed paths and
changing the approved warning HTML, lifecycle, entry, and client-intake bytes.
Retiring the production-disabled session-authority consumer preserved every
generated output path while simplifying exactly 15 mapped platform JavaScript
files. The returning-user Face startup overlap then retained the same paths and
imports while changing only `plataforma/modules/face-startup.js` by +623 bytes
and `plataforma/modules/login.js` by +175 bytes relative to `ff83ea0`. That base
artifact was 258 files, 27,362,565 bytes, and
`sha256:a0be995c6701c76a1c134db2a623622c2f102b23255bb0f2438702419fb757c6`;
the current identities are:

| Current lean signed-handle scope | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Complete generated `dist/` artifact | 258 | 27,363,363 | `31f0e0641c40e51c8a6bb30b43e532176f821b894a2bd372b203dcb7c8276bb8` |
| Shared runtime mapping | 1 | 81 | `c38658b6f2c16b3980f1bd8f739a91e873e652e32c74d122fd4c944c129c3f1d` |
| Platform subset, retaining full output paths `plataforma/...` | 182 | 20,758,017 | `bb071712d59e1d49d13615fe6e4aa2482bbddf2667843bc39394b37e788aa88e` |
| Platform subtree rooted at `dist/plataforma` (prefix omitted; diagnostic only) | 182 | 20,758,017 | `2f7ddc5ab3b6a71acb0cd5568ab3d03f23ed01198b303c29ca824afa1e0e4236` |
| Platform JavaScript, retaining full output paths | 36 | 470,879 | `0198ae883811b585120290f1d4596e91ec79280aa5f889c189cdf9242cb79178` |
| Platform non-JavaScript files, retaining full output paths | 146 | 20,287,138 | `f184c686c13dd24a98c07219446a4fa02cfa7a7b9a477b75606ac4e153d53357` |
| Study entry subtree, retaining full output paths | 41 | 10,022,029 | `19cbf0067226f54e1ea521d606762ad9f1acc0b8acd2ff7d5129a1c9e413a44c` |
| Four public API applications, retaining full output paths | 20 | 737,209 | `a270d13916c0ffb350dfe0c777e07776ec9c9ea9e8baeb9724c2bb72f6f17b1b` |
| All non-platform applications, retaining full output paths | 75 | 6,605,265 | `b14bae0503870a00f9f013999131070b78552fbf0e76c69e1643d96d843cc091` |

Before the current overlap, the dormant-session cleanup's 33,067-byte reduction
was exactly the sum of these 15 mapped-output deltas:

| Changed mapped output | Byte delta | Intentional simplification |
| --- | ---: | --- |
| `plataforma/avisos-iniciais/main.js` | -267 | Remove the target toggle and cross-tab channel bootstrap arguments. |
| `plataforma/cadastro-foto/main.js` | -303 | Remove the target toggle and cross-tab channel bootstrap arguments. |
| `plataforma/estudo/main.js` | -489 | Remove target session requests, server-time injection, and logout-presentation wiring. |
| `plataforma/login/main.js` | -303 | Remove the target toggle and cross-tab channel bootstrap arguments. |
| `plataforma/modules/course-content/application.js` | -5,181 | Collapse startup, refresh, expiry, direct entry, BFCache restoration, and logout onto the retained signed-handle path. |
| `plataforma/modules/course-content/assessment.js` | -87 | Always send the signed handle in the established request body. |
| `plataforma/modules/course-content/feedback.js` | -87 | Always send the signed handle in the established request body. |
| `plataforma/modules/course-content/progress.js` | -87 | Always send the signed handle in the established request body. |
| `plataforma/modules/course-content/session-timer.js` | -1,828 | Remove server-authoritative expiry inputs while retaining client deadline teardown. |
| `plataforma/modules/course-content/state.js` | -47 | Remove unused target status state. |
| `plataforma/modules/initial-notices.js` | -725 | Remove target session adoption and status transitions. |
| `plataforma/modules/login.js` | -7,998 | Retain only the active login, Face, storage, and signed-handle transitions. |
| `plataforma/modules/photo-registration.js` | -7,017 | Retain only the active multipart handle and Face result flow. |
| `plataforma/modules/platform-client.js` | -1,444 | Remove cookie, custom-header, bodyless session, DELETE, and `204` target machinery. |
| `plataforma/modules/session.js` | -7,204 | Retain only the exact seven-key storage seam and Study handle removal. |

The inventory remains exactly 12 public pages, 3 downloads, and 243 supporting
files across all 258 paths, with all 20 mappings and all 64 explicit negative
paths unchanged. Removing the three now-unused `session.js` imports changes
the source and generated module graphs from 80 to exactly 77 logical JavaScript
imports; their new graph SHA-256 is
`672f0f5205c1e70be7aa918986ad36e47b69511abb0ec422249a1f792e029149`.
The removed edges are Login entry to `modules/session.js`, Registration entry
to `modules/session.js`, and Study application to `../session.js`.
The current Face overlap adds no import edge, request path, or output path, so
that 77-edge graph and digest remain exact. Relative to `ff83ea0`, exactly the
two mapped JavaScript outputs named above add 798 bytes in total; the other 256
generated outputs are byte-identical.
Warning assets retain their source bytes, but moving four warning binary output
paths changes the binary path-framed digest. The Face, study-download, and
certificate-input scopes retain both their paths and bytes:

| Frozen current scoped identity | Files | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Platform binary files, retaining full output paths | 52 | 19,319,394 | `4fe456a88c86adc5804aedb90927ea8c52122dd198dce3452f8b780aab538d1a` |
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

The phase-B/pre-markup counts equaled that pre-alignment baseline, and its
aligned URL/import strings added exactly 76 bytes: 20 HTML bytes and 56
JavaScript bytes. Phase A then added 15 compatibility files containing 66,549
duplicate bytes, for 15 more files and 66,625 more bytes than the pre-alignment
baseline.

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
imports. Removing the abandoned consumer removes the former Login,
Registration, and Study-application imports of `session.js`; no active import
edge is replaced. The ordered logical source-edge aggregate has SHA-256
`672f0f5205c1e70be7aa918986ad36e47b69511abb0ec422249a1f792e029149`.
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
  target omits it. Production serves both spellings with the same entry bytes
  and no HTTP redirect; because the platform has no normalizer, its slashless
  links leave noncanonical paths in bookmarks, refreshes, and browser history.
- Browser admission still depends on spoofable client hints and user-agent
  strings. Capability shapes improve failure classification but cannot prove
  Windows servicing or architecture, the Edge channel/build, physical-device
  status, PlayReady qualification, or capture resistance.
- The `<= 1024` minimum-viewport boundary remains an admission transition rather
  than a responsive state. Active-entry reflow below that boundary therefore
  remains intentionally unavailable even though warning recovery is now
  deterministic.
- Several pages perform redirects from asynchronously loaded module scripts.
  Study now reduces a logged-out `pageshow`/BFCache restoration before
  protected work, but script-load failure, restoration on the other entries,
  and closely spaced navigation events have no broader state machine.
### Session and authorization risks

- User identity, photo state, notice progression, deadline, and navigation
  origin are browser-writable UI flags. They must not be interpreted as
  authorization or authoritative progress evidence.
- `IndexVerificado` is a signed four-hour authorization handle. Browser-final
  logout removes this tab's stored copy but does not revoke or rotate the
  backend handle; a previously copied value can remain usable until its
  original expiry. Refresh neither changes the stored client-session deadline
  nor returns or rotates the handle; it separately returns the workbook
  access-deadline field for display/state.
- Only `IndexVerificado` has a scoped `sessionStorage.removeItem()` call; no
  flow calls `clear()`. Stale identity mirror, deadline, registration, URL, and
  Face flags survive application logout for the rest of the tab session and
  can affect later navigation.
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
- Returning-user tokenless preparation starts only after exact active login and
  after the protected Face-session request begins. A later session-request
  failure keeps its established visible error but may spend bandwidth loading
  the same public engine/WASM assets that a successful attempt would use.
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
  personal data in source. For a matching session that passes the separate
  entry gate and reaches study, the identity rule chooses unprotected media
  regardless of environment and creates an acknowledged capture/content-
  exposure risk. The PlayReady setup also contains a hard-coded credential-
  bearing EZDRM endpoint. Neither literal is reproduced here, and the accounts
  are not associated here with device information.
- Player load/autoplay failures are not caught, and the retained player has no
  explicit unload/destroy lifecycle. The remote MPD controls rendition details
  that this repository cannot validate offline.
- The Face SDK and two WASM alternatives are manually vendored. One duplicate
  Face hint image and two study workbooks are emitted but unreferenced, while
  support assets remain outside explicit `publicDownloads` coverage.

## Lean access and browser-final logout

Excel `PRAZO ACESSO` drives the calculated `STATUS LOGIN` using the
workbook formula:

`=SE([@[PRAZO ACESSO]]="-";"Inativo";SE([@[PRAZO ACESSO]]>=HOJE();"Ativo";"Inativo"))`

The displayed deadline is inclusive. `-` and past dates produce exact
`Inativo`. Onboarding writes `PRAZO ACESSO` and leaves `STATUS LOGIN`
null for the calculated column. Only exact `Ativo` permits the backend to
mint a new signed `IndexVerificado` handle; exact `Inativo` remains a
visible inactive-login outcome.

The handle is the retained browser authority. Login stores it in this tab's
`sessionStorage`, Registration sends it in the established multipart field,
and the five protected Study operations send it in their established JSON
fields. The signed handle has an absolute four-hour lifetime and is neither
rotated nor server-revoked by refresh or logout. The exact seven storage keys
remain unchanged, and no replacement credential or eighth key exists.

Explicit logout and timer expiry perform the same browser-local teardown: make
Study inert and hidden, stop its timer, pause media, set
`Usuário_Logado=Não`, remove only `IndexVerificado`, and replace-navigate
to Login. A logged-out direct entry or `pageshow`/BFCache restoration applies
that teardown before protected work. These paths issue no logout request and
perform no cross-tab synchronization. Removing this tab's stored copy prevents
ordinary reuse from that tab, but a previously copied or already issued handle
can remain technically usable until its original expiry.

`GATE-01` retains precedence over `GATE-02`, and both precede every
learning-platform request. They are browser-admission checks, not authority.
The current implementation has no cookie-based platform session, custom
session header, session-status endpoint, authoritative-session runtime flag,
server-side logout call, SQL session integration, or rollout control.

## Approved future decisions

These remaining decisions are approved roadmap direction only. The named-only
frontend adapter, named backend producers, and separate presentation catalog
are current behavior above, not future work.
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
- Keep broader HTTP-status reclassification, retries, idempotency,
  timeout/cancellation, partial-success redesign, and versioned response-envelope
  changes in their separately authorized milestones.
- Re-encode the video ladder and evaluate storage redundancy before considering
  a CDN.
- Automate Face SDK and dependency maintenance; remove secret-bearing manual
  files and rotate affected credentials in separately authorized work.

## Questions requiring implementation-time evidence

The source snapshot cannot answer the remaining unrelated questions safely.
They retain their original numbers, and the later task that changes each
relevant seam must collect evidence without contacting production:

2. Which backend operations are idempotent today under transport retry, and
   where must request identifiers or reconciliation be introduced?
3. Which partial Face-registration states exist in representative nonproduction
   data, and which one is authoritative when photo, workbook flag, and Face
   session disagree?
4. What are the intended assessment attempt, timing, answer-authority, score,
   dedupe, and resumption rules? Current source supplies no time limit.
5. Should the Module 3 feedback name be corrected or must migrated historical
   records first be reconciled from module 2?
6. Which workbook formulas, row-order assumptions, and update/append outcomes
   must be preserved during sequential migration, including feedback partial
   success?
7. Which server-side report definition binds company, workbook, rows, labels,
    modules, report type, participant name, expiration, and revocation while
    retaining accepted forwarding behavior?
8. What exact codecs, renditions, bitrates, segment templates, and DRM behavior
    do representative nonproduction MPDs expose? No media manifest was fetched
    for this characterization.
9. Which of the 33 downloads, two unreachable copies, Face locales, duplicated
    image, and certificate inputs are intentional long-term public assets?
10. What privacy-preserving replacement should govern the five-person non-DRM
    branch, and when can the credential-bearing PlayReady configuration be
    rotated and removed from source?
11. Which CDN dependency bytes and browser cache/offline behavior must be
    pinned, vendored, or integrity-checked in the transformed target?

## Behavior-baseline acceptance matrix

The compatibility suite implements this matrix and remains the executable guard
for route adoption, the completed entry-markup modernization, and later work.
Stable contract descriptions are the test intent; current source anchors
identify the current oracle.

| ID | Compatibility surface | Required synthetic assertion |
| --- | --- | --- |
| ORIGIN-01 | Shared production origin | Exactly one executable production-origin literal is exported from the separate shared mapping and imported by exactly eight consumers; runtime code contains no executable localhost backend URL, hostname-based selection, backend-base storage key, stored override, or relative `/null/` request path. |
| ROUTE-01 | Seven public entries | The manifest contains exactly the seven canonical `/plataforma/**` trailing-slash entries listed above, including `/plataforma/aviso-viewport/`, `/plataforma/aviso-dispositivo-navegador/`, and `/plataforma/cadastro-foto/` with exact case; every index is emitted under `dist/plataforma/`, and one directory mapping emits the complete canonical module tree within the exact nine learning-platform mappings. |
| ROUTE-02 | Root, retirement, compatibility, and slash behavior | `/plataforma/`, all three former `/plataforma/cadastro` forms, and all six former current warning forms are intentional 404s without redirect; the independently retired `/plataforma_v2/` root and seven former entries remain 404s; no entry alias or old warning or `dist/plataforma_v2/` subtree exists. All 15 enumerated legacy module URLs are explicit 404s and have no emitted output, alias, or redirect. Internal source navigation remains slashless; production serves each current slashless entry with the same bytes and no HTTP redirect, while the manifest's trailing-slash spellings remain canonical. The complete negative-path contract is exactly 64. |
| ROUTE-03 | Navigation/history | GATE-01, GATE-02, browser-final explicit logout, timer expiry, and the logged-out Study direct/`pageshow` guard use replacement navigation; other ordinary login, registration, study, and content navigation retains its existing history-adding behavior. Each viewport transition carries the exact originating path/query/fragment in a bounded encoded `returnTo`; the warning accepts only the six approved relative same-origin path families, preserves accepted slash spelling and suffixes, rejects unsafe input without external navigation, and replaces at most once above 1024 with canonical login as fallback. Login's separate registration `history.back()` rule and the exact legacy origin marker remain unchanged. |
| GATE-01 | Device/browser admission | One centralized classifier gives login/notices/registration/study stable candidate, unsupported, or unverified results from consistent browser/platform evidence and side-effect-free entry API shapes. Usable Windows/Edge hints or fallback can produce only a candidate; missing or conflicting evidence stays unverified; explicit excluded families/platforms and missing mandatory APIs stay unsupported. Rejected and unverified profiles replace to `/plataforma/aviso-dispositivo-navegador` before GATE-02 and never load Face. Status report, client intake, and both warning entries remain ungated, and the device/browser diagnostic handles absent or partial `userAgentData`. |
| GATE-02 | Minimum-viewport admission | After GATE-01 precedence on protected entries, qualifying login, notices, registration, study, public status report, and public client intake replace to the viewport warning at 1023 and the inclusive 1024 boundary, admit 1025, and replace on a later resize down without starting protected work or narrow report requests. Platform entries use slashless `/plataforma/aviso-viewport`; client intake uses trailing-slash `/plataforma/aviso-viewport/`. No alternate device classifier is introduced. Direct narrow warning entry remains; direct wide entry uses the canonical login fallback. |
| STORE-01 | Key inventory | The exact seven accented/cased keys, all readers/writers, the Study-only `IndexVerificado` remover, value shapes, and the read-only `TempoSessão_Segundos` observation remain represented; no backend base or new key is stored or read. |
| STORE-02 | Lifetime/reset | No flow clears storage. Refresh leaves both the stored client deadline and `IndexVerificado` unchanged while returning the separate workbook access-deadline field. Browser-final explicit logout, timer expiry, and logged-out direct/BFCache restoration set `Usuário_Logado=Não`, remove only `IndexVerificado`, and leave the other five legacy values unchanged; a later valid login writes fresh state. |
| API-01 | Login and Face registration | Methods, exact paths—including unchanged `POST /plataforma_v2/CadastroFoto_e_FaceID`—JSON/multipart fields, response fields, status branches, and call order remain exact; each allowed named value reaches the same reviewed semantic kind, visible outcome, storage state, and navigation branch. |
| API-02 | Face verification/result | Session creation carries the handle in JSON and begins before one tokenless preparation attempt. That attempt can load and mount only after exact active login and both gates; it cannot start before the token-bearing response. Exactly one public path-parameter result GET follows component resolution and reproduces success, failed-decision, local-component, named request-error, concurrent-preparation/request-error precedence, and backend-retry-visible branches with no client polling. |
| API-03 | Refresh and progress | Both protected POST bodies carry `IndexVerificado`; refresh response/access-deadline display, unchanged stored deadline, named semantic mapping, and optimistic update/rollback behavior match current transitions. |
| API-04 | Assessment and feedback | `/updates` preserves client-supplied grade fields; named write and append failures preserve update-before-append ordering, partial success, retry duplication exposure, rollback, and the Module 3/module 2 mismatch. |
| API-05 | Status report | The public POST carries only exact JSON fields `linha_inicial` and `linha_final`; query/display labels remain client-side. It has no authorization header/body handle, keeps JSON-before-status ordering, and maps the named read failure to its semantic/presentation outcome. |
| ERROR-01 | Normalization and protected unauthorized response | Synthetic transport, malformed, HTTP, unknown, local, and operation-inapplicable failures retain their reviewed owner/kind/status branches; every retired numbered value is unknown across every operation while preserving status; login `401` retains invalid-credential precedence and protected `401 {}` retains each consumer's exact `Erro_000` outcome. |
| FLOW-01 | Login/notices/registration | Credential, first-access, photo-registration, authorization-code, Face startup/single-result lookup, and destination branches preserve their current storage transitions. |
| FLOW-02 | Study navigation | The 171 contiguous indices, 10-module boundaries, module prerequisites, content/test/feedback/performance destinations, and saved progress initialization remain fixed, including malformed negative/fractional/`NaN`/greater-than-171 progress behavior. |
| FLOW-03 | Content completion | Manual and `ended` completion both exercise optimistic increment, protected update, success advance, and local failure rollback. |
| FLOW-04 | Assessment | Synthetic DOM answers reproduce current client score and update behavior, including absence of a source-defined time limit or dedupe identity. |
| FLOW-05 | Feedback | Synthetic submission records current client-controlled fields, update-before-append ordering, failure positions, and duplicate-visible retry behavior. |
| FLOW-06 | Certificate/logout | Eligibility thresholds, client-side PDF inputs/name, and validation text remain exact. Browser-final explicit logout and timer expiry make Study inert/hidden, stop its timer, pause media, update/remove only the scoped storage values, and replace to Login without DELETE or cross-tab signaling; logged-out direct/BFCache restoration does the same before protected work, and fresh login restores new browser state. The copied-handle limitation remains. |
| REPORT-01 | Nine query keys | Each of `ne`, `nt`, `li`, `lf`, `dua`, `idsr`, `mi`, `mf`, and `mrm` has an isolated display/request effect and exact default/coercion behavior. |
| REPORT-02 | Public disclosure/rendering | Synthetic rows demonstrate all API-returned fields, the UI's ignored certificate IDs, 15-column assumption, forwarding, and the current `innerHTML` sinks without using real participant data. |
| REPORT-03 | Mode contradiction | Only exact `mrm=consolidado` selects consolidated behavior; the contradictory short-code comment remains documentary evidence, not runtime truth. |
| FACE-01 | SDK resolution and presentation hooks | Version 1.5.0, `<base>` resolution, `pt-BR`, 75 dictionaries, five images, regular/SIMD JS+WASM branch paths, the body-mounted loader, Shadow-DOM native brightness checkbox, and application-owned viewport, host-color, and closed-root non-selection overrides remain exact without loading production Face. Tokenless preparation and actual startup are independently single-flight; preparation mounts once without a token, and a settled actual startup receives a fresh element on retry. |
| ASSET-01 | File identity and isolation | The exact current 182-file platform set and its JavaScript and Study subscopes match their recalculated byte totals and digests; all current paths are NFC, 34 contain non-ASCII, and the non-JavaScript, binary, public-application, Face, download, and certificate scoped digests remain exact. The two five-file warning subtrees move ten-for-ten without duplicate outputs. Historical phase-A and phase-B/pre-markup identities remain documentation-only comparisons. |
| ASSET-02 | Downloads/certificate | All 33 exact download paths emit with their frozen aggregate digest; 31 are reachable, two remain unreferenced, and the three browser-generated certificate inputs retain exact case and bytes. |
| VIDEO-01 | Topic/manifests | Module video counts total 151 unique exact `(Módulo N, name)` keys and derive `_dash.mpd` paths under both current namespaces without requesting them. |
| VIDEO-02 | DRM/player lifecycle | Default protected and five-name bypass selection, PlayReady-only configuration role, one retained player, controls, load/play behavior, and completion handlers match source without exposing credentials or personal names. |
| ARTIFACT-01 | Full frontend artifact | The Face-warmed lean signed-handle artifact has 258 files and matches its recalculated 27,363,363-byte identity. Relative to `ff83ea0`, exactly `modules/face-startup.js` and `modules/login.js` add 798 bytes while the other 256 outputs, every path, the 15 absent compatibility outputs, and the separate `shared/backend-origin.js` mapping remain fixed. |
| ARTIFACT-02 | Manifest coverage | Tests require seven platform `publicEntries`, zero platform `publicDownloads`, 175 platform support files, nine exact platform mappings, and one separate shared mapping; the complete frontend requires 12 entries, 3 public downloads, 243 support files, 64 negative paths, and exactly 77 JavaScript imports in both source and generated previews. |

### Automated traceability

The behavior matrix retains its 30 stable acceptance IDs. Every matrix-coverage test
title begins with one of those IDs in brackets; focused markup tests use their
own guard labels without expanding the acceptance matrix. Coverage is grouped
by execution seam rather than by future source location:

- `.agents/tests/learning-platform-static.test.js` covers declarative route,
  Face asset/presentation, download, video/DRM, and artifact contracts;
- `.agents/tests/learning-platform-markup.test.js` locks the seven documents'
  visible copy, unique IDs, selector and event-target inventory, native-control
  relationships, accessible labels/status, focus movement, the application-wide
  non-selectable-copy policy, feedback layout, centered certificate control,
  and reduced-motion seams;
- `.agents/tests/learning-platform-errors.test.js` covers the exact frozen named
  vocabulary, operation ownership, retired-alias rejection, local semantic
  normalization, presentation catalog, and source confinement;
- `.agents/tests/learning-platform-entry-api.test.js` covers entry gates,
  navigation, storage, login, Face, named request behavior, ownership,
  operation isolation, malformed JSON, denied networking, exact logout storage
  removal, and fresh-login state replacement;
- `.agents/tests/learning-platform-module-seams.test.js` covers the real module
  loader and host deny-all guard, bootstrap modes, initial-notices seam, and
  status-report query/request/render seams;
- `.agents/tests/learning-platform-study-report.test.js` covers study progress,
  assessment, feedback, named write transitions, certificate,
  browser-final logout/expiry teardown, direct and BFCache restoration, absence
  of logout DELETE requests, and status-report behavior;
- `.agents/tests/learning-platform-traceability.test.js` derives the acceptance
  IDs from this matrix, requires every ID to remain in a named test, and audits
  the suite for sensitive source literals and complete network URL literals.

Shared helpers under `.agents/tests/helpers/` provide isolated browser seams and
install the deny-all network guard before application code executes. All
behavior fixtures are invented and local; no test uses a production service.
The deployment suite resolves all 77 imports in a temporary generated preview,
and build checking proves every generated byte equals its mapped source. That
byte identity carries the source-executed network-denial boundary into the
generated artifact without contacting a hosted preview.

Backend-internal feedback ordering and partial-success boundaries remain
independently executable in `backend/test/app-platform-routes.test.js` at the
verified companion commit `ba286cc0b3d3e67176d46dee84a5ba7d55b7162c`.
The frontend harness models only client-visible behavior.

## Safe synthetic-dependency strategy

The behavior-baseline suite uses Node.js 24 and makes outbound networking a test
failure before any application script executes.

1. Start with static contract extraction: parse deployment JSON, HTML attributes,
   source literals, tracked paths, and digest framing. This covers routes,
   assets, downloads, topic keys, names, casing, and Unicode without executing
   vendor code.
2. Execute only the two classic warning scripts in the isolated VM.
   Import real application `.js` modules through the Node.js 24 loader hook
   confined by real path to `apps/learning-platform/modules/`, then call their
   factories with synthetic `window`, `document`, `navigator`, `location`,
   `history`, `sessionStorage`, clock, timers, and `fetch`. Record redirects,
   replacement calls, encoded return targets, history calls, storage mutations,
   DOM states, request order, and rollback.
3. Install the deny-all host network guard before importing any module. Stub
   only fixture origins and fail any request containing the production backend, Graph,
   workbook, Face, EZDRM, CDN, media, email, or storage host. Never submit a
   real form or permit fallback to native `fetch`, XHR, WebSocket, image/script
   loading, or media loading.
4. Model backend results with deterministic synthetic JSON, `401 {}` JSON bodies,
   failure statuses, delayed responses, and multipart inspection. Control the
   single Face-result resolution/rejection with a synthetic promise. Use fake
   timers for the session deadline and documented backend retry schedule; do
   not wait in wall-clock time. The returning-user performance oracle assigns
   fixed virtual durations to Login, Face-session, wrapper, mounted-engine, and
   result phases, drains them in due-time order, and asserts both dependency
   edges and the exact synthetic makespan.
5. Stub the injected lazy Face loader, Face custom element, Shaka Player/UI,
   video element, and jsPDF. Assert loading, construction, configuration, path
   resolution, tokenless preparation, single-flight behavior, and lifecycle
   calls. Behavior tests
   never import a production Face entry or execute the vendored Face engine or
   either WASM file.
6. Use invented participant, workbook, company, assessment, and feedback data.
   Exercise HTML-sensitive values in a contained DOM to characterize sinks;
   never copy production names, workbook contents, report links, authorization
   handles, or credential-bearing URLs into fixtures or snapshots.
7. For browser-level route tests, serve only the generated local artifact and
   install request interception before navigation. Fulfil external script,
   media, and Face requests with inert local fixtures or block them. Keep
   trailing-slash canonical destinations and measured slashless compatibility
   behavior distinct in assertions; exercise warning recovery, invalid-target
   fallback, responsive widths, zoom, overflow, and console output without
   allowing production network access.
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
using the repository helpers and digest framing above. The earlier module
modernization added 24 application-owned module files, increasing the platform
and complete-artifact counts from 156 and 231 to 180 and 255. The error-adapter
and presentation-catalog stage increased those counts to 182 and 257; the
named-only cleanup changed only adapter bytes. The deployed-path phase-A
artifact kept the aligned sources plus 15 temporary compatibility outputs,
producing 197 platform files and 272 complete files. Phase B removed only those
outputs and established the 182-platform-file, 257-complete-file baseline at
commit `6afd8435f1c5c80aaca777ec7c6c9938b87733f6`. The entry-markup
modernization kept those 182 platform files and application paths while changing
reviewed HTML, CSS, and application JavaScript bytes. The centralized-origin
mapping then added only `shared/backend-origin.js`. Warning-navigation repair
replaces ten warning paths with ten renamed paths and retains the 258-file
count. Dormant-session retirement retained that graph, and the Face startup
overlap changes only the two mapped JavaScript bytes recorded above. The current
executable tests assert the resulting identities and reproduce the deterministic
1,800 → 1,200 virtual-millisecond critical-path evidence without production
network access.
Historical phase-A and phase-B identities remain documentation-only comparisons.

Commit `19dacfa870d691e5869a022652fb24f2a8ba8e5f` is the exact pre-alignment
baseline. The final aligned source strings add 76 bytes without changing its
file counts; phase A added a further 15 files and 66,549 duplicate bytes. The
artifact history also retains `9ff6b61a4bfdcd2cfd511cc406d16b5984577266`
as the dual-reading baseline and `be8e52fc248d073503b8e71abe5afb9e93a4d5f9`
as the post-English-internals pre-adapter baseline, with the earlier
pre-modernization and pre-adoption snapshots kept separately.
