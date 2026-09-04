# Actions and Node lifecycle

Reviewed 2026-09-04. Owner: Lucas (`IvyRoom`). Review monthly (next:
2026-10-01), on action-update PRs, security advisories, runner warnings, and
Azure lifecycle notices. This record does not change cloud configuration.

## Separate runtime layers

| Layer | Reviewed baseline and evidence |
| --- | --- |
| Frontend application | Static browser files; no application Node server or package installation. |
| Repository test/build/check | Explicit `24.x` in deployment, bot validation, and browser-monitor checking. `setup-node` caching is disabled; no manifest or lockfile is introduced. |
| JavaScript actions | Checkout 7.0.1, setup-node 7.0.0, and upload-artifact 7.0.1 declare `node24` internally. `node-version` does not control this runtime. |
| GitHub runner | GitHub-hosted `ubuntu-latest`; record the actual image/runner from each run's **Set up job** log, not from the label alone. |
| Azure | SWA publishes prebuilt `dist/` with `skip_app_build: true`; repository Node choices do not prove Azure host/runtime settings. |
| Retired Node 22 Function | The owner-authorized retirement completed on 2026-09-04. Identity, evidence, deletion scope, retained resources, and recovery limits are recorded [below](#retired-node-22-function). |

Node 24 actions require runner **2.327.1+**. Checkout's **2.329.0+** Docker
authenticated-Git requirement is separate; this repository disables persisted
checkout credentials. See the pinned [checkout requirements](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/README.md)
and [GitHub-hosted runner policy](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners).
Future self-hosted runners must also follow [runner update enforcement](https://github.blog/changelog/2026-06-12-github-actions-minimum-version-enforcement-timeline-for-self-hosted-runners/),
not merely meet an old compatibility minimum.

## Reviewed action provenance

Full upstream commit pins and readable release comments live in
[the workflows](../.github/workflows/). On the review date, each existing major
tag resolved to the corresponding release commit below; no major was upgraded.

| Action | Reviewed release | Verified commit |
| --- | --- | --- |
| `actions/checkout` | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | [v7.0.0](https://github.com/actions/setup-node/releases/tag/v7.0.0) | `820762786026740c76f36085b0efc47a31fe5020` |
| `actions/upload-artifact` | [v7.0.1](https://github.com/actions/upload-artifact/releases/tag/v7.0.1) | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |
| `Azure/static-web-apps-deploy` | [v1](https://github.com/Azure/static-web-apps-deploy/releases/tag/v1) | `1a947af9992250f3bc2e68ad0754c0b0c11566c9` |

SWA is a Docker action, not a Node action. Its [pinned Dockerfile](https://github.com/Azure/static-web-apps-deploy/blob/1a947af9992250f3bc2e68ad0754c0b0c11566c9/Dockerfile)
still uses `mcr.microsoft.com/appsvc/staticappsclient:stable`. The wrapper pin
does **not** make that container immutable. Hosted images and Node `24.x`
patch selection also move; this is not a fully reproducible CI environment.

Weekly [Dependabot](../.github/dependabot.yml) continues to propose
[SHA-pin version updates with release comments](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories#github-actions).
GitHub separately documents [Actions vulnerability alerts](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/find-and-customize-actions#using-release-management-for-your-custom-actions)
as requiring semantic-version references; SHA pinning does not promise equivalent
alert coverage. Review upstream advisories as well as update PRs.

## Lifecycle and upgrade triggers

Dates from the live official [Node release schedule](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json),
verified 2026-09-04; future dates can change.

| Node | Status at review | Active LTS starts | Maintenance starts | End of life |
| --- | --- | --- | --- | --- |
| 22 | Maintenance LTS | 2024-10-29 | 2025-10-21 | 2027-04-30 |
| 24 | Active LTS | 2025-10-28 | 2026-10-20 | 2028-04-30 |
| 26 | Current | 2026-10-28 | 2027-10-20 | 2029-04-30 |

Keep **24.x**. Reassess Node 26 after its LTS promotion and explicit
compatibility qualification, not because it is newer. Start replacement-major
qualification by 2027-10-30 (six months before Node 24 EOL), earlier if an
advisory, dependency, action, or hosting deadline requires it.

GitHub's [Node 20 removal notice](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)
now dates the Node 24 default rollout to 2026-06-16 and Node 20 removal to
2026-09-23. These actions already declare Node 24; no forced-runtime or
insecure-runtime escape-hatch environment variable is needed.

## Workflow controls and acceptance

- Root permissions are empty. Deployment has only repository read and PR-write
  authority for the existing preview comment; closure has only PR-read authority
  for its current-state guard. Azure deployment-token usage is unchanged.
- Upload and close events share a non-cancelling PR-number concurrency key;
  production uses a separate ref key. Bot validation cancels obsolete work only
  within its own PR. Jobs have explicit timeouts; checkouts retain no credentials.
- SWA uses GitHub's [`queue: max`](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
  to retain up to 100 pending runs instead of replacing a pending cleanup.
  Dispatch order is still not guaranteed. Read-only live PR-state guards run
  inside the shared group before Azure operations:
  upload only while open, close only while closed, fail on lookup errors or
  unexpected states. Verify final preview removal after a close or merge.
- The browser monitor's schedule, main-only guards, metadata-only check,
  notifier-only issue authority, exact-title deduplication, and bot isolation
  are unchanged. Do not dispatch the notifier merely to validate SHA pins.
- Run the [complete local suite](../AGENTS.md#preview-and-verification),
  JS/MJS syntax checks, embedded Bash `bash -n`, and `actionlint` when available.
  Verify the human-PR preview and required **Build and Deploy Job**. Before
  cleanup after merge, verify resulting `main` deployment and preview closure.
- This hardening must preserve the exact artifact: **258 files / 27,363,352
  bytes**, SHA-256 `3a2043dd91ca42aa45ffa5f5f4380dc0947f04e1256efbc25e3223641aba24a0`.
  Application, CDN pins (including jsPDF 4.2.1), and certificate bytes are unchanged.

## Retired Node 22 Function

The audit uniquely resolved the Function App in tenant
`49342d16-0605-4267-b540-d1fe7756dbac` as `/subscriptions/1a2f6756-eaa5-4654-bc88-a69e5e588846/resourceGroups/Plataforma_v2/providers/Microsoft.Web/sites/Plataforma-Function-v2`.
It was a Brazil South Linux Consumption (`Y1`) app with live stack `node|22`;
repository Node 24 declarations were not used to infer this cloud state.

The live app exposed one disabled timer function, `function01`, from
`function01.js`, scheduled every ten minutes (`0 */10 * * * *`). `function02`
was already absent live; source and deployment history plus its stale disable
marker identified a former daily timer job with a 2026-04-03 removal trace.
Neither function exposed an HTTP, queue, event, or webhook trigger live.

Dormancy was supported by independent evidence rather than request counts alone:

- Lucas confirmed ownership and that neither function retained a business,
  recovery, security, or operational purpose.
- Sistemas, Backend, workflow, DNS, and API Management searches found no caller.
  Deployment ownership traced to Lucas and retained `IvyRoom/functions`; Backend
  history showed legacy Meta endpoints removed on 2026-04-03 and 2026-05-01.
- The retained 93-day interval from 2026-06-03 through 2026-09-04 showed zero
  Function executions and zero Application Insights requests, errors, or
  dependencies. The dedicated storage account showed eight metadata reads,
  with no queue activity or payload reads.
- Private source remains in `IvyRoom/functions` at
  `75b0abb308f3bd5f8b175b03ba85a6788d17df09`; the last deployment run was
  `23959179347` on 2026-04-03. The source has no tests and recovery was untested.

Upstream Node 22 EOL and Azure Functions Node 22 support are separate policies,
although both currently date 2027-04-30; Azure calls its date an **expected**
end of support. Node 22 is also the last Node version supported on Linux
Consumption; its plan retirement is separately dated 2028-09-30. Recheck the
[Node schedule](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json), [Azure Functions runtime table](https://learn.microsoft.com/en-us/azure/azure-functions/functions-versions),
and [Linux Consumption policy](https://learn.microsoft.com/en-us/azure/azure-functions/consumption-plan).

After the recovery and shared-resource limits were presented, Lucas explicitly
requested direct final deletion of the obsolete functions and their exclusive
resources. No observation window was selected and no tested rollback existed.
Deletion completed at 2026-09-04 19:30 UTC. Each suffix below follows `/subscriptions/1a2f6756-eaa5-4654-bc88-a69e5e588846/resourceGroups/Plataforma_v2/providers/`:

| Deleted resource type and name | Disposition |
| --- | --- |
| `Microsoft.Web/sites/Plataforma-Function-v2` | Function App, `function01`, and stale `function02` configuration removed. |
| `Microsoft.Web/serverfarms/ASP-Plataformav2-8bd1` | Exclusive Consumption plan removed. |
| `Microsoft.Storage/storageAccounts/auxiliarfunctionv2` | Exclusive storage account removed. |
| `Microsoft.Insights/components/Plataforma-Function-v2` | Exclusive telemetry component removed. |
| `Microsoft.ManagedIdentity/userAssignedIdentities/Plataforma-Funct-id-a8c1` | Exclusive identity and child credential `erpoxhbb4prlw` removed. |
| `Microsoft.AlertsManagement/smartDetectorAlertRules/Failure Anomalies - Plataforma-Function-v2` | Function-specific alert removed. |
| `Microsoft.AlertsManagement/smartDetectorAlertRules/Failure Anomalies - Plataforma-Function-v1` | Orphan removed after its referenced component scope was confirmed absent. |

Exclusivity checks found no other app on the plan. The storage account shared
the Function's creation provenance and held only Function infrastructure
objects, with no queues. The identity held only the Function deployment role
and trust.

Subscription inventory moved from 26 to 19 resources: exactly those seven
top-level IDs were removed, none was added, and retained sanitized metadata did
not change. The app-scoped role assignment
`40496234-37b3-545f-8ff6-800430f93824` disappeared with its Function scope.
Final verification found no Function Apps, all seven IDs absent, the federated
credential parent missing, and no role assignment for the deleted principal.

The shared workspace
`DefaultWorkspace-1a2f6756-eaa5-4654-bc88-a69e5e588846-CQ` in
`DefaultResourceGroup-CQ` retains historical telemetry. The shared
`Application Insights Smart Detection` action group, Backend alerts and
components, Plataforma-Backend-v3, Sistemas Static Web App, DNS, Face, video,
and DRM resources were retained with unchanged inspected metadata. Backend and
Sistemas smoke checks and monitoring state were verified separately. Cost
review kept app/plan execution, storage, and telemetry separate; Cost
Management returned HTTP 429, so no savings amount is claimed. The identity is
recorded for authorization scope, not as a cost.

Reconstruction now requires new Azure resources, authorization, deployment, and
qualification. Retained source and workflow are not a tested rollback: the
deleted identity prevents deployment, and its OIDC trust named the former
singular repository `IvyRoom/function`. Neither source nor workflow was changed.

Before and after deletion, the same read-only canonical check validated 12
pages, 3 downloads, 243 supporting files, 1 encoded Conecta query route, 11
slash-compatibility pairs, and 64 expected 404 paths byte-for-byte without a
Backend request. Issues #77 and #80 and application behavior remain unchanged.

This documentation-only pull request creates a Static Web Apps preview; its
merge to `main` is deployment-filtered. The milestone remains open until both
repository records merge, resulting checks and preview cleanup pass, and merged
branch cleanup completes.
