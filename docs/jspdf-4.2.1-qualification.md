# jsPDF 4.2.1 qualification evidence

Status: release/security, real-PDF equivalence, and controlled Windows/Edge
source/generated download qualification pass. Pull-request readiness additionally
requires the preview and required GitHub checks recorded on the PR. A ready PR does not
establish merged-main verification or complete the roadmap milestone.

Release and CDN identity were inspected on 2026-09-03. The advisory snapshot was
refreshed on 2026-09-04. The scope is the frozen Learning certificate workflow,
with jsPDF 2.5.1 as the comparison baseline and the real jsPDF 4.2.1 browser UMD
build as the candidate. The only renderer adjustment is the user-authorized
minimal centering-call compatibility change described below; certificate
content/layout, assets, routes, Shaka, and script order remain unchanged.

## Release provenance

The official [v4.2.1 release](https://github.com/parallax/jsPDF/releases/tag/v4.2.1)
was published at `2026-03-17T11:15:45Z`. GitHub's
[release API record](https://api.github.com/repos/parallax/jsPDF/releases/tags/v4.2.1)
reported `draft: false` and `prerelease: false`; the release page identified it
as the latest release at the inspection date.

The [v4.2.1 tag reference](https://api.github.com/repos/parallax/jsPDF/git/ref/tags/v4.2.1)
points directly to commit
[`4562ce8aa35bd5ecd98cd5e262e3da2af96476f6`](https://github.com/parallax/jsPDF/commit/4562ce8aa35bd5ecd98cd5e262e3da2af96476f6).
The commit message is `4.2.1`, its commit time is
`2026-03-17T11:15:15Z`, and GitHub's
[commit API record](https://api.github.com/repos/parallax/jsPDF/commits/4562ce8aa35bd5ecd98cd5e262e3da2af96476f6)
reported signature verification `verified: true`, reason `valid`, verified at
`2026-03-17T11:15:16Z`. The release page displays verified signing-key ID
`B5690EEEBB952194`.

The release notes identify fixes for HTML injection in new-window output paths
and PDF-object injection through FreeText annotation color. The tag's
[official continuous-integration run](https://github.com/parallax/jsPDF/actions/runs/23191528588)
succeeded. These are upstream provenance and validation signals, not evidence
that the frozen certificate integration is compatible.

The project's [security policy](https://github.com/parallax/jsPDF/security)
limits security-update support to the latest major/minor versions. Retaining
an old version because the current renderer reaches only a narrow API surface
does not make that version current or supported.

## CDN build identity

The candidate preserves cdnjs and classic UMD script loading at the exact asset
[https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js](https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js).
The official [cdnjs version listing](https://cdnjs.com/libraries/jspdf/4.2.1)
and [version API](https://api.cdnjs.com/libraries/jspdf/4.2.1?fields=files,sri)
include this file among 12 published files.

Read-only retrieval of the exact CDN URL returned HTTP `200`, final URL unchanged,
content type `application/javascript; charset=utf-8`, and `420,165` bytes.

| Identity field | Value |
| --- | --- |
| SHA-256, independently computed | `e6551fcdc32f09d6853b2c5126d18d01d9447e0da618a41a11ebeee0f6c20d54` |
| SHA-512 SRI, published by cdnjs and independently reproduced | `sha512-plOdviVmws4Y3JAvbnpfKb2hVxKM1lCwsi3vmElYRj+tiDLffZ4FVUj5a8vyKJ9pIgl8JCAHEJ4D1iUKBecswg==` |

The CDN bytes matched the upstream tag's
[`dist/jspdf.umd.min.js`](https://github.com/parallax/jsPDF/blob/v4.2.1/dist/jspdf.umd.min.js)
retrieved from its
[raw tagged URL](https://raw.githubusercontent.com/parallax/jsPDF/v4.2.1/dist/jspdf.umd.min.js):
the byte count, SHA-256, and SHA-512 were identical. The hashes above identify
the inspected build; they are qualification evidence, not a new runtime SRI
requirement or a claim that the application enforces them.

## Advisory snapshot and candidate disposition

The read-only GitHub Advisory Database API was queried on 2026-09-04 using
`ecosystem=npm`, an exact `affects=jspdf@<version>` selector, each advisory type,
and `per_page=100`. The results were:

| Version | GitHub-reviewed records | Unreviewed records | Malware records | Non-withdrawn total |
| --- | --- | --- | --- | --- |
| `2.5.1` | [12](https://api.github.com/advisories?ecosystem=npm&affects=jspdf%402.5.1&type=reviewed&per_page=100) | [0](https://api.github.com/advisories?ecosystem=npm&affects=jspdf%402.5.1&type=unreviewed&per_page=100) | [0](https://api.github.com/advisories?ecosystem=npm&affects=jspdf%402.5.1&type=malware&per_page=100) | 12 |
| `4.2.1` | [0](https://api.github.com/advisories?ecosystem=npm&affects=jspdf%404.2.1&type=reviewed&per_page=100) | [0](https://api.github.com/advisories?ecosystem=npm&affects=jspdf%404.2.1&type=unreviewed&per_page=100) | [0](https://api.github.com/advisories?ecosystem=npm&affects=jspdf%404.2.1&type=malware&per_page=100) | 0 |

All 12 baseline records had `withdrawn_at: null`. Their reviewed severities total
2 critical, 8 high, and 2 medium. The following affected ranges and first-patched
versions reproduce the exact reviewed package metadata, rather than inferring
versions from advisory prose. Version 2.5.1 is inside every listed affected range;
version 4.2.1 is outside every range.

| Advisory and surface | CVE | Reviewed severity | Affected version range | First patched version |
| --- | --- | --- | --- | --- |
| [GHSA-w532-jxjh-hjhj](https://github.com/advisories/GHSA-w532-jxjh-hjhj) — image-data-URL ReDoS | CVE-2025-29907 | High | `< 3.0.1` | `3.0.1` |
| [GHSA-8mvj-3j78-4qmw](https://github.com/advisories/GHSA-8mvj-3j78-4qmw) — PNG denial of service | CVE-2025-57810 | High | `<= 3.0.1` | `3.0.2` |
| [GHSA-f8cm-6447-x5h2](https://github.com/advisories/GHSA-f8cm-6447-x5h2) — Node.js local file inclusion/path traversal | CVE-2025-68428 | Critical | `<= 3.0.4` | `4.0.0` |
| [GHSA-cjw8-79x6-5cj4](https://github.com/advisories/GHSA-cjw8-79x6-5cj4) — `addJS` shared-state race | CVE-2026-24040 | Medium | `<= 4.0.0` | `4.1.0` |
| [GHSA-vm32-vv63-w422](https://github.com/advisories/GHSA-vm32-vv63-w422) — stored XMP metadata injection | CVE-2026-24043 | Medium | `<= 4.0.0` | `4.1.0` |
| [GHSA-95fx-jjr5-f39c](https://github.com/advisories/GHSA-95fx-jjr5-f39c) — BMP-dimension denial of service | CVE-2026-24133 | High | `<= 4.0.0` | `4.1.0` |
| [GHSA-pqxr-3g65-p328](https://github.com/advisories/GHSA-pqxr-3g65-p328) — AcroForm PDF injection | CVE-2026-24737 | High | `<= 4.0.0` | `4.1.0` |
| [GHSA-67pg-wm7f-q7fj](https://github.com/advisories/GHSA-67pg-wm7f-q7fj) — GIF-dimension denial of service | CVE-2026-25535 | High | `< 4.2.0` | `4.2.0` |
| [GHSA-9vjf-qc39-jprp](https://github.com/advisories/GHSA-9vjf-qc39-jprp) — `addJS` PDF-object injection | CVE-2026-25755 | High | `< 4.2.0` | `4.2.0` |
| [GHSA-p5xg-68wr-hm3m](https://github.com/advisories/GHSA-p5xg-68wr-hm3m) — AcroForm radio-child PDF injection | CVE-2026-25940 | High | `< 4.2.0` | `4.2.0` |
| [GHSA-7x6v-j9x4-qf24](https://github.com/advisories/GHSA-7x6v-j9x4-qf24) — FreeText-color PDF-object injection | CVE-2026-31898 | High | `<= 4.2.0` | `4.2.1` |
| [GHSA-wfv2-pwc8-crg5](https://github.com/advisories/GHSA-wfv2-pwc8-crg5) — new-window HTML injection | CVE-2026-31938 | Critical | `<= 4.2.0` | `4.2.1` |

The known-advisory version-range gate therefore passes for 4.2.1 at this dated
snapshot: no returned non-withdrawn advisory remains applicable to the candidate.
This is not a guarantee against undisclosed vulnerabilities or a substitute for
the separate compatibility and browser gates. Release monitoring remains an
ongoing control; monitoring itself is not remediation.

### Source nuances retained

The [publisher advisory for GHSA-9vjf-qc39-jprp](https://github.com/parallax/jsPDF/security/advisories/GHSA-9vjf-qc39-jprp)
labels the `addJS` injection Critical (9.3), whereas the
[GitHub-reviewed record](https://github.com/advisories/GHSA-9vjf-qc39-jprp)
labels it High (8.1). The table and `2/8/2` severity aggregate deliberately use
the reviewed database classification; they do not silently rewrite the
publisher's assessment.

The [publisher advisory for GHSA-cjw8-79x6-5cj4](https://github.com/parallax/jsPDF/security/advisories/GHSA-cjw8-79x6-5cj4)
lists patched versions `>= 4.0.1`, and its prose describes the fix as `4.0.1`.
The [GitHub-reviewed package record](https://github.com/advisories/GHSA-cjw8-79x6-5cj4)
instead records `4.1.0` as the first patched version. The table preserves that
reviewed metadata. Candidate 4.2.1 is above both stated fix versions, so this
source discrepancy does not leave the candidate inside an affected range.

## Real certificate compatibility

The comparison baseline is the untouched renderer at
`6a788bba66095489df337e5a3326cad546ed54da` with the real cdnjs 2.5.1 UMD build
(`364,463` bytes; SHA-256
`98ccf17aa10c20bb1301762618fcc9b6ab3a4e7f26b6071d64d0b41154df3875`).
Both versions ran in the same isolated harness with invented learner
`Ágata Invenção`, certificate ID `CERT-ÁGATA-0421`, and grades `0.70` and `0.95`.
No production API or real learner data was used.

The first 4.2.1 run exposed a real regression: the legacy six-argument
`text(value, x, y, null, null, 'center')` form lost centering and clipped text.
At 144 DPI, the ordinary page differed in `102,496` pixels and the honor page
in `110,065`. Replacing only the eleven centering tails with
`{ align: 'center' }` restores the original output. Text, coordinates,
wrapping width, fonts, colors, image arguments, branch boundary, and save
filename are unchanged. Running that adjusted renderer on 2.5.1 also matches
the untouched baseline.

The durable `[FLOW-06]` tests in
`../.agents/tests/learning-platform-study-report.test.js` now compare complete,
ordered call traces: 50 events for ordinary and 54 for honor, including
`preventDefault()`, constructor lookup, zero-argument construction, and every
renderer method with exact arguments. They lock Portuguese text/accents, the
name and certificate ID, validation URL, filename, three image paths/formats
and geometries, fonts/colors/sizes, the `160` mm wrapping width, returned-array
identity, alignment, and ordinary/honor Y coordinates. The existing honor
branch's inherited bold signer/footer text is deliberately preserved.

### Structural and rendered evidence

Strict parsing and independent rendering passed for both versions, both
fixtures, and source/generated preview inputs. Source previews used the
repository's manifest-mapped server; generated previews used `dist/` as the
web root, never a generic repository-root server.

| Property | Baseline and qualified candidate |
| --- | --- |
| Document | PDF 1.3; one portrait A4 page; `595.28 × 841.89` points; rotation 0; 26 objects |
| Text | Ordinary: 722 characters/19 lines; honor: 741 characters/20 lines |
| Description | Identical five-line wrapping at width 160; Y=150 ordinary, Y=145 honor |
| Fonts | 14 standard font resources; content uses Helvetica and Helvetica-Bold |
| Content | Byte-identical decompressed page operators; exact characters, positions, sizes, colors, and image matrices |
| Images | Three painted resources, two alpha masks; identical decoded image/mask bytes |
| Render | `1191 × 1684` at 144 DPI; **0 of 2,005,644 pixels different**, maximum channel delta 0, for both fixtures |

The ordinary and honor rendered PNG SHA-256 values are respectively
`4f17d4063b73d55be02db9e31303efc4e9757c280471e1e4881d20c6241cec79`
and `0f6d2a6b0d1eaabdf159c3be3df361d80b8d0182ceee15d4c5ed41b2cafc9ab7`.
Manual visual review of source and generated pages confirmed all three images
visible at their original geometry, unclipped/centered text, and honor text
only in the honor fixture. Poppler emitted identical configured display-font
warnings for unused Symbol/ArialUnicode resources, without a rendered defect.

Repeated source/generated outputs demonstrated that only Info `/CreationDate`
and trailer `/ID` varied within a version; only those fields were treated as
volatile. `/Producer` intentionally records the different jsPDF version.
Raw cross-version PDF bytes were not an equivalence oracle, and actual image
encoding changes were not normalized away.

The candidate PDFs are `852,882` bytes ordinary and `853,014` bytes honor,
versus `690,457` and `690,589`: **+162,425 bytes each**. The signature image's
stream changes from 7,169 compressed bytes to 89,352 uncompressed bytes; its
alpha stream changes from 8,940 to 89,352. Small dictionary/serialization
differences account for the remainder. Decoded pixels and masks are identical.
This size increase is an explicit upgrade tradeoff, not changed certificate
content or a comparison exception.

### Fixed images and inactive PDF surfaces

| Input | Bytes | Actual encoding/dimensions | Placement `(x, y, width, height)` in mm |
| --- | --- | --- | --- |
| `LOGO_MACHADO_CERTIFICADO.jpg` | 26,676 | JPEG, 654 × 655 | `(20, 20, 17, 17)` |
| `ASSINATURA.png` | 8,235 | PNG, 584 × 153 | `(20, 203, 55, 8)` |
| `ATLAS.png` | 113,550 | PNG, 400 × 400 | `(140, 187, 50, 50)` |

All three retain their original `/plataforma/estudo/img/` URL-string inputs
and declared `PNG` format. The mislabeled JPG is explicitly proven compatible:
both real builds detect JPEG and retain a `/DCTDecode` stream exactly equal
to the original 26,676-byte file, SHA-256
`390a0267fb5dd7b3b72275203ea790571b2bfab5c4d5963be9ecb0069735bd7b`.
Direct DCT bytes, not a PDF library's JPEG re-encoding helper, provide that
identity evidence. The unchanged three-file/148,461-byte asset aggregate is
`82c735c7ac2fa32e09d71c326765db9c52ce63b58144c7c7b100458f8b897591`.

Inspection found no executable action dictionaries, JavaScript, AcroForm,
annotations, XMP metadata stream, embedded files, URI actions, or `NewWindow`
keys. Inputs are JPEG/PNG/PNG, not GIF/BMP. Both versions retain the benign
catalog `/OpenAction [3 0 R /FitH null]`: an initial first-page view destination,
not an executable action. The renderer uses `save()`, not new-window output.
The harness rejects every unexpected resource; only the three local images
are requested by certificate generation.

## Windows/Edge download smoke

On 2026-09-04, the installed Microsoft Edge **152.0.4191.53** ran on the
Windows 11 25H2 host, exact OS build **10.0.26200.9278**. The test used bundled
Playwright **1.62.1**, a fresh nonpersistent context per case, headless Edge,
and no installation or existing browser profile. The legacy registry
`ProductName` reports Windows 10 Pro; the numerical build is recorded rather
than inferring the OS release from that stale label.

The browser test used a synthetic button harness under each preview origin,
not a logged-in Study session. It imported the actual mapped candidate renderer
and local images; the 2.5.1 comparison injected the untouched baseline renderer.
Classic CDN script requests were fulfilled with the exact previously verified
UMD bytes. Before any scripts executed, routing denied every non-allowlisted
request and all non-GET requests; service workers were blocked. The Study entry
HTML was separately fetched and its real final script order/pin checked.
No player, authentication, production backend, or real learner was exercised.

All eight cases (source/generated × 2.5.1/4.2.1 × ordinary/honor) passed:

- The native `save()` implementation was not mocked: an actual button click
  produced an Edge download with suggested filename
  `CERTIFICADO - Ágata Invenção.pdf` and no download failure.
- `preventDefault()` was observed; the expected UMD version was active.
- Each downloaded file parsed as an openable, one-page PDF and was rendered
  and compared against the accepted structural/pixel baseline.
- There were no page errors, console errors, denied/unexpected requests, or
  certificate backend requests. Image requests were exactly the three inputs.
- Button focus succeeded. Generated candidate PDFs were also accepted by
  Edge's inline PDF embed with HTTP 200 and `application/pdf`; this embed check
  is not used as a substitute for the PDF render/visual comparison.

Both local preview HTML responses were 553,233 bytes with SHA-256
`824f1065ce4fa5929878e39a720dc6ee2297be80dbdc0304ea68d08cb7c7f19a`.
The source/generated candidate renderer was 3,850 bytes with SHA-256
`4f4d400e606f4cf81c3100a7d4d8333fe304f304c5cb947ed3097a6fb5bf7f50`.
All temporary browser contexts, browsers, and preview servers were closed.

## Artifact and verification record

The version pin is equal-length, but the eleven centering substitutions remove
eleven bytes. The measured build is therefore **258 files / 27,363,352 bytes**,
not the pre-qualification estimate of 27,363,363. Its full SHA-256 is
`3a2043dd91ca42aa45ffa5f5f4380dc0947f04e1256efbc25e3223641aba24a0`.
The platform/JavaScript/Study digests are recorded in the updated artifact table
in [the frozen-platform contracts](learning-platform-contracts.md). Relative
to `6a788bba66095489df337e5a3326cad546ed54da`, exactly two deployed outputs
change: the Study entry's jsPDF pin and the renderer's centering argument shape;
the other 256 outputs are byte-identical.

Local verification passed with Node 24.19.0: all 246 agent tests, all 31 frontend
deployment tests, syntax checks for every changed JS/MJS file, deterministic
frontend build/check, and `git diff --check`. Both workflow Bash blocks passed
`bash -n` with Git Bash 5.2.37. `actionlint` was unavailable. A no-network
notifier stub using a future jsPDF 4.3.7 release confirmed dynamically versioned
task wording. Shaka's monitor behavior is unchanged. No package manifest,
lockfile, installed dependency, SRI, downloaded bundle, or generated `dist/`
file is introduced by this change.

PDF tools were the preinstalled Python 3.12.13, pypdf 6.10.0, pdfplumber 0.11.9,
Pillow 12.3.0, and Poppler 26.05.0. Disposable bundles, harnesses, PDF/PNG outputs,
and detailed JSON reports were kept outside the committed artifact. To repeat
qualification: verify the CDN build identities above, use the same two
synthetic fixtures and three allowlisted images in an isolated real-UMD harness,
serve sources through `startSourcePreviewServer()` and generated output through
`startDistServer()`, preserve native `save()` for the browser pass, parse all
PDF objects/content/text/images, and compare 144-DPI renders to the untouched
2.5.1 renderer from the recorded baseline commit. Do not contact production.

Issue #78 must remain open until the upgrade is merged, resulting main checks
and deployment pass, and certificate smoke verification is repeated. After
that gate, dispatch the release monitor once, confirm jsPDF is current and
Shaka issue #77 deduplicates, record the evidence, and perform the prescribed
main synchronization/merged-feature-branch cleanup. Lucas retains the merge
decision; this document does not advance the roadmap.

## Risks not changed by this upgrade

The advisory table is package-level evidence, not a claim that every vulnerable
surface is reachable through the certificate renderer. For example, the
[local-file-inclusion advisory](https://github.com/advisories/GHSA-f8cm-6447-x5h2)
explicitly applies to the Node.js builds, while this integration uses the browser
UMD build. The frozen workflow's narrow methods and fixed images constrain
reachability, but they do not remediate the old library or establish support for
it.

Upgrading jsPDF does not make client-held or client-manipulable certificate inputs
authoritative, tamper-resistant, or server-validated. That separate certificate
trust risk remains unchanged and outside this task.

The CDN-without-SRI supply-chain risk also remains unchanged. The runtime keeps
the existing cdnjs classic-script mechanism without an `integrity` attribute;
recording hashes in this evidence does not make browsers enforce those hashes.
No SRI addition, bundling, package installation, or replacement of the CDN trust
boundary is part of this qualification.
