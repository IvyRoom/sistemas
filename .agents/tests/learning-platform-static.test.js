"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.join(__dirname, "..", "..");
const applicationsRoot = path.join(repositoryRoot, "apps");
const platformRoot = path.join(repositoryRoot, "apps", "learning-platform");
const studyRoot = path.join(platformRoot, "course-content");
const faceRoot = path.join(platformRoot, "azure-ai-vision-face-ui");
const manifest = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, "frontend-deployment.json"), "utf8")
);
const contractSource = fs.readFileSync(
  path.join(repositoryRoot, "docs", "learning-platform-contracts.md"),
  "utf8"
);
const studyHtml = fs.readFileSync(path.join(studyRoot, "index.html"), "utf8");
const faceSource = fs.readFileSync(
  path.join(faceRoot, "FaceLivenessDetector.js"),
  "utf8"
);
const sharedBackendOriginSource = fs.readFileSync(
  path.join(applicationsRoot, "shared", "backend-origin.js"),
  "utf8"
);

function backendOriginFromSharedModule() {
  const declarations = Array.from(
    sharedBackendOriginSource.matchAll(
      /^export const BACKEND_ORIGIN = (["'])([^"'\r\n]+)\1;\r?$/gm
    )
  );
  assert.equal(declarations.length, 1, "The shared module must export one canonical origin");
  return declarations[0][2];
}

const productionBackendOrigin = backendOriginFromSharedModule();

const platformApplication = manifest.applications.find(
  (application) => application.id === "learning-platform"
);
const sharedMappings = [{ source: "apps/shared", output: "shared" }];
const backendConsumerApplicationIds = [
  "quote-request",
  "client-intake",
  "certificate-validation",
  "conecta-referral-form"
];
const backendOriginConsumers = [
  "apps/certificate-validation/main.js",
  "apps/client-intake/main.js",
  "apps/learning-platform/course-content/main.js",
  "apps/learning-platform/login/main.js",
  "apps/learning-platform/photo-registration/main.js",
  "apps/learning-platform/status-report/main.js",
  "apps/quote-request/main.js",
  "apps/referrals-management/referral-form/main.js"
];
const currentPlatformEntries = [
  { sourceDirectory: "viewport-warning", publicSuffix: "aviso-viewport" },
  {
    sourceDirectory: "device-browser-warning",
    publicSuffix: "aviso-dispositivo-navegador"
  },
  { sourceDirectory: "initial-notices", publicSuffix: "avisos-iniciais" },
  { sourceDirectory: "photo-registration", publicSuffix: "cadastro-foto" },
  { sourceDirectory: "course-content", publicSuffix: "estudo" },
  { sourceDirectory: "login", publicSuffix: "login" },
  { sourceDirectory: "status-report", publicSuffix: "statusreport" }
];
const retiredPlatformV2Suffixes = [
  "aviso-dispositivo",
  "aviso-navegador",
  "avisos-iniciais",
  "cadastro",
  "estudo",
  "login",
  "statusreport"
];
const retiredRegistrationPaths = [
  "/plataforma/cadastro",
  "/plataforma/cadastro/",
  "/plataforma/cadastro/index.html"
];
const retiredCurrentWarningPaths = [
  "/plataforma/aviso-navegador",
  "/plataforma/aviso-navegador/",
  "/plataforma/aviso-navegador/index.html",
  "/plataforma/aviso-dispositivo",
  "/plataforma/aviso-dispositivo/",
  "/plataforma/aviso-dispositivo/index.html"
];
const warningRelativeFiles = [
  "img/FAVICON.ico",
  "img/LOGO_MACHADO.png",
  "index.html",
  "main.js",
  "style.css"
];
const retiredWarningOutputs = ["aviso-dispositivo", "aviso-navegador"]
  .flatMap((publicSuffix) =>
    warningRelativeFiles.map((fileName) => `plataforma/${publicSuffix}/${fileName}`)
  )
  .sort(compareText);
const currentWarningOutputs = ["aviso-dispositivo-navegador", "aviso-viewport"]
  .flatMap((publicSuffix) =>
    warningRelativeFiles.map((fileName) => `plataforma/${publicSuffix}/${fileName}`)
  )
  .sort(compareText);
const retiredModuleOutputPairs = [
  {
    canonical: "plataforma/modules/photo-registration.js",
    retired: "plataforma/modules/registration.js",
    source: "apps/learning-platform/modules/photo-registration.js"
  },
  ...[
    "application.js",
    "assessment.js",
    "certificate-renderer.js",
    "certificate.js",
    "content.js",
    "dom.js",
    "downloads.js",
    "feedback.js",
    "navigation.js",
    "performance.js",
    "player.js",
    "progress.js",
    "session-timer.js",
    "state.js"
  ].map((fileName) => ({
    canonical: `plataforma/modules/course-content/${fileName}`,
    retired: `plataforma/modules/study/${fileName}`,
    source: `apps/learning-platform/modules/course-content/${fileName}`
  }))
];
const retiredModulePaths = retiredModuleOutputPairs.map(
  ({ retired }) => `/${retired}`
);
const platformEntryMappings = currentPlatformEntries.map(
  ({ publicSuffix, sourceDirectory }) => ({
    source: `apps/learning-platform/${sourceDirectory}`,
    output: `plataforma/${publicSuffix}`
  })
);
const faceMapping = {
  source: "apps/learning-platform/azure-ai-vision-face-ui",
  output: "plataforma/azure-ai-vision-face-ui"
};
const phaseAPlatformMappings = [
  ...platformEntryMappings,
  {
    source: "apps/learning-platform/modules/error-adapter.js",
    output: "plataforma/modules/error-adapter.js"
  },
  {
    source: "apps/learning-platform/modules/error-presentation.js",
    output: "plataforma/modules/error-presentation.js"
  },
  {
    source: "apps/learning-platform/modules/face-startup.js",
    output: "plataforma/modules/face-startup.js"
  },
  {
    source: "apps/learning-platform/modules/initial-notices.js",
    output: "plataforma/modules/initial-notices.js"
  },
  {
    source: "apps/learning-platform/modules/lifecycle.js",
    output: "plataforma/modules/lifecycle.js"
  },
  {
    source: "apps/learning-platform/modules/login.js",
    output: "plataforma/modules/login.js"
  },
  {
    source: "apps/learning-platform/modules/platform-client.js",
    output: "plataforma/modules/platform-client.js"
  },
  {
    source: "apps/learning-platform/modules/session.js",
    output: "plataforma/modules/session.js"
  },
  {
    source: "apps/learning-platform/modules/photo-registration.js",
    output: "plataforma/modules/photo-registration.js"
  },
  {
    source: "apps/learning-platform/modules/photo-registration.js",
    output: "plataforma/modules/registration.js"
  },
  {
    source: "apps/learning-platform/modules/course-content",
    output: "plataforma/modules/course-content"
  },
  {
    source: "apps/learning-platform/modules/course-content",
    output: "plataforma/modules/study"
  },
  {
    source: "apps/learning-platform/modules/status-report",
    output: "plataforma/modules/status-report"
  },
  faceMapping
];
const finalPlatformMappings = [
  ...platformEntryMappings,
  {
    source: "apps/learning-platform/modules",
    output: "plataforma/modules"
  },
  faceMapping
];
const entrySourcePaths = currentPlatformEntries.map(
  ({ sourceDirectory }) => `${sourceDirectory}/main.js`
);
const platformModuleSourcePaths = regularFilesRecursively(
  path.join(platformRoot, "modules")
)
  .filter((filePath) => path.extname(filePath) === ".js")
  .map((filePath) => path.relative(platformRoot, filePath).split(path.sep).join("/"))
  .sort(compareText);
const pageSourcePaths = [...entrySourcePaths, ...platformModuleSourcePaths];
const pageSources = pageSourcePaths.map((relativePath) => ({
  relativePath,
  source: fs.readFileSync(path.join(platformRoot, ...relativePath.split("/")), "utf8")
}));
const studySourcePaths = [
  "course-content/main.js",
  ...platformModuleSourcePaths.filter((relativePath) =>
    relativePath.startsWith("modules/course-content/")
  )
];
const studySource = studySourcePaths
  .map((relativePath) =>
    fs.readFileSync(path.join(platformRoot, ...relativePath.split("/")), "utf8")
  )
  .join("\n");
const retiredPlatformPaths = [
  "/plataforma_v2/",
  ...retiredPlatformV2Suffixes.map((publicSuffix) => `/plataforma_v2/${publicSuffix}/`)
];

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function gitTrackedFiles(scope) {
  const result = spawnSync(
    "git",
    ["-c", "core.quotepath=false", "ls-files", "-z", "--", scope],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true
    }
  );

  assert.equal(result.status, 0, "Tracked-file enumeration must succeed");
  return result.stdout.split("\0").filter(Boolean).sort(compareText);
}

function localPath(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function regularFilesRecursively(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => compareText(left.name, right.name))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return regularFilesRecursively(entryPath);
      return entry.isFile() ? [entryPath] : [];
    });
}

function mappedFilesFromMappings(mappings) {
  const records = [];

  for (const mapping of mappings) {
    const sourcePath = localPath(mapping.source);
    const sourceStats = fs.statSync(sourcePath);
    const trackedFiles = gitTrackedFiles(mapping.source);

    for (const trackedFile of trackedFiles) {
      const suffix = sourceStats.isFile()
        ? ""
        : trackedFile.slice(mapping.source.length + 1);
      records.push({
        output: sourceStats.isFile()
          ? mapping.output
          : path.posix.join(mapping.output, suffix),
        source: trackedFile
      });
    }
  }

  return records.sort((left, right) => compareText(left.output, right.output));
}

function mappedFiles(applications = manifest.applications) {
  return mappedFilesFromMappings(
    applications.flatMap((application) => application.mappings)
  );
}

function sharedRuntimeRecords() {
  return mappedFilesFromMappings(manifest.sharedMappings);
}

function deploymentRecords() {
  return [...mappedFiles(), ...sharedRuntimeRecords()]
    .sort((left, right) => compareText(left.output, right.output));
}

function treeStats(records) {
  const hash = crypto.createHash("sha256");
  let bytes = 0;

  for (const record of records) {
    const contents = fs.readFileSync(localPath(record.source));
    const pathBytes = Buffer.from(record.output, "utf8");
    hash.update(Buffer.from(`${pathBytes.length}:`, "utf8"));
    hash.update(pathBytes);
    hash.update(Buffer.from(`:${contents.length}:`, "utf8"));
    hash.update(contents);
    bytes += contents.length;
  }

  return {
    bytes,
    digest: hash.digest("hex"),
    files: records.length
  };
}

function digestStrings(values) {
  return crypto
    .createHash("sha256")
    .update([...values].sort(compareText).join("\n"), "utf8")
    .digest("hex");
}

function applicationJavaScriptSources() {
  return regularFilesRecursively(applicationsRoot)
    .filter((filePath) => path.extname(filePath).toLowerCase() === ".js")
    .map((filePath) => ({
      relativePath: path.relative(repositoryRoot, filePath).split(path.sep).join("/"),
      source: fs.readFileSync(filePath, "utf8")
    }))
    .sort((left, right) => compareText(left.relativePath, right.relativePath));
}

function moduleImportEdges(sources) {
  const edges = [];
  const importPattern = /\bimport\s+(?:[^"'();]+?\s+from\s+)?["']([^"']+)["']/g;
  const dynamicImportPattern = /\bimport\s*\(\s*(["'])([^"']+)\1\s*\)/g;

  for (const { relativePath, source } of sources) {
    for (const match of source.matchAll(importPattern)) {
      edges.push(`${relativePath} -> ${match[1]}`);
    }
    for (const match of source.matchAll(dynamicImportPattern)) {
      edges.push(`${relativePath} -> ${match[2]}`);
    }
  }
  return edges.sort(compareText);
}

function countBufferOccurrences(source, target) {
  let count = 0;
  let offset = 0;

  while ((offset = source.indexOf(target, offset)) !== -1) {
    count += 1;
    offset += target.length;
  }

  return count;
}

function inspectUrlRole(value) {
  try {
    const parsed = new URL(value);
    return {
      hostnamePresent: parsed.hostname.length > 0,
      originDigest: crypto.createHash("sha256").update(parsed.origin).digest("hex"),
      pathname: parsed.pathname,
      protocol: parsed.protocol,
      searchPresent: parsed.search.length > 1,
      valid: true
    };
  } catch {
    return {
      hostnamePresent: false,
      originDigest: null,
      pathname: null,
      protocol: null,
      searchPresent: false,
      valid: false
    };
  }
}

function isStructurallyValidUrl(value) {
  return inspectUrlRole(value).valid;
}

function platformRecords() {
  return mappedFiles([platformApplication]);
}

function compatibilityShapeRecords() {
  return mappedFiles(
    manifest.applications.map((application) =>
      application.id === "learning-platform"
        ? { ...application, mappings: phaseAPlatformMappings }
        : application
    )
  );
}
function sourceForOutput(records, output) {
  const record = records.find((candidate) => candidate.output === output);
  assert.ok(record, `Mapped output must resolve to a tracked source: ${output}`);
  return record.source;
}

function htmlDataNodes() {
  return Array.from(
    studyHtml.matchAll(/<button\b([^>]*\bdata-index="(\d+)"[^>]*)>/g),
    ([, attributes, rawIndex]) => ({
      index: Number(rawIndex),
      name: attributes.match(/\bname="([^"]+)"/)?.[1]
    })
  );
}

function downloadReferences() {
  const references = [];
  let currentModule = null;

  for (const line of studySource.split(/\r?\n/)) {
    const condition = line.match(
      /moduleName === "([^"]+)" && videoName === "([^"]+)"/u
    );
    if (condition) currentModule = condition[1];

    const assignment = line.match(
      /downloadButton\d+\.href\s*=\s*"\/plataforma\/estudo\/files\/"\s*\+\s*moduleName\s*\+\s*"\/([^"]+)"/u
    );
    if (!assignment) continue;

    assert.ok(currentModule, "Every download assignment must have a module branch");
    references.push(
      `plataforma/estudo/files/${currentModule}/${assignment[1]}`
    );
  }

  return references;
}

function mediaLoadPrefixes() {
  return Array.from(
    studySource.matchAll(
      /player\.load\('([^']+)'\s*\+\s*moduleName\s*\+\s*'\/'\s*\+\s*videoName\s*\+\s*'_dash\.mpd'\)/g
    ),
    ([, prefix]) => prefix
  );
}

function sourceDerivedSensitiveLiterals() {
  const bypassCondition = studySource.match(
    /function isDrmEnabled\(fullName\) \{[\s\S]*?if \(([\s\S]*?)\) \{ drmEnabled = false \} else \{ drmEnabled = true \};[\s\S]*?\}/
  );
  assert.ok(bypassCondition, "The bypass branch must remain statically discoverable");
  const participantNames = Array.from(
    bypassCondition[1].matchAll(/fullName === '([^']+)'/g),
    ([, value]) => value
  );
  assert.equal(participantNames.length, 5, "The bypass branch must retain five entries");

  const playReady = studySource.match(
    /servers:\s*\{\s*'com\.microsoft\.playready'\s*:\s*'([^']+)'\s*\}/
  );
  assert.ok(playReady, "The PlayReady role must remain statically discoverable");

  return {
    backendBase: productionBackendOrigin,
    participantNames,
    playReadyUrl: playReady[1]
  };
}

test("[BROWSER-SUPPORT] selected policy and runtime admission retain the qualification boundary", () => {
  const supportStart = contractSource.indexOf("## Browser support contract");
  const currentBehaviorStart = contractSource.indexOf(
    "## Source-observed current behavior"
  );
  assert.ok(supportStart >= 0, "The selected browser policy must have one named section");
  assert.ok(
    currentBehaviorStart > supportStart,
    "Selected browser policy must remain separate from current runtime behavior"
  );

  const support = contractSource.slice(supportStart, currentBehaviorStart);
  for (const heading of [
    "### Content-protection objective",
    "### Support terms and selected matrix",
    "### Capability prerequisites",
    "### Failure boundaries",
    "### Environments without `userAgentData`",
    "### Runtime admission and qualification boundary",
    "### Verification matrix and maintenance",
    "### Primary evidence"
  ]) {
    assert.ok(support.includes(heading), `${heading}:required support-policy heading`);
  }

  const protectionStart = support.indexOf("### Content-protection objective");
  const supportTermsStart = support.indexOf("### Support terms and selected matrix");
  assert.ok(
    supportTermsStart > protectionStart,
    "The content-protection objective must remain a distinct policy subsection"
  );
  const protection = support.slice(protectionStart, supportTermsStart);
  const normalizedProtection = protection.replace(/\s+/g, " ");
  for (const protectionTerm of [
    "governing business requirement",
    "not selected as a browser-brand preference",
    "only currently selected protected-video path",
    "exact operating-system and browser builds",
    "DRM and CDM",
    "hardware-security mode",
    "display/output path",
    "capture method",
    "alone is not proof of capture resistance",
    "no intelligible protected-video image",
    "Record audio separately",
    "capturable program audio does not change that video-image result",
    "external camera",
    "external capture hardware",
    "compromised client"
  ]) {
    assert.ok(
      normalizedProtection.includes(protectionTerm),
      `${protectionTerm}:required content-protection boundary`
    );
  }
  assert.match(
    normalizedProtection,
    /reports that prior application-[\s\S]*Edge and PlayReady blacked protected video[\s\S]*Chrome and Firefox recording tests left the video visible[\s\S]*not an unconditional Microsoft guarantee[\s\S]*formal qualification/,
    "Reported Edge evidence must remain qualified rather than becoming a vendor guarantee"
  );

  const policyRows = new Map(
    [
      "Complete authenticated learning journey",
      "First-time Face registration",
      "Public status report",
      "Device/browser and viewport warning pages"
    ].map((label) => [
      label,
      support.split(/\r?\n/).find((line) => line.startsWith(`| ${label} |`))
    ])
  );
  for (const matrixRow of [
    "Complete authenticated learning journey",
    "First-time Face registration",
    "Public status report",
    "Device/browser and viewport warning pages"
  ]) {
    assert.ok(policyRows.get(matrixRow), `${matrixRow}:required policy row`);
  }

  assert.match(
    policyRows.get("Complete authenticated learning journey"),
    /Microsoft Edge Stable or Microsoft Edge Extended Stable[\s\S]*capture-resistant protected media[\s\S]*application-specific capture-resistance evidence[\s\S]*Chrome, Firefox, Safari[\s\S]*unsupported/,
    "The complete journey must retain its current capture-evidenced Edge target and exclusions"
  );
  assert.doesNotMatch(
    policyRows.get("Complete authenticated learning journey"),
    /Google Chrome Stable|Mozilla Firefox Release/,
    "Public browser targets must not leak into the complete-journey matrix"
  );
  assert.match(
    policyRows.get("First-time Face registration"),
    /Windows 11[\s\S]*Edge Stable or Extended Stable[\s\S]*camera, upload, and Face qualification/,
    "First-time registration must retain its Edge, camera, upload, and Face boundary"
  );
  assert.match(
    policyRows.get("Public status report"),
    /Microsoft Edge Stable or Extended Stable[\s\S]*Google Chrome Stable[\s\S]*Mozilla Firefox Release/,
    "The public report must retain its deliberately broader browser matrix"
  );
  assert.match(
    policyRows.get("Device/browser and viewport warning pages"),
    /Same public matrix as the status report/,
    "Warning pages must remain aligned with the public-report matrix"
  );

  const fairPlayPolicySource = support
    .split(/\r?\n\r?\n/)
    .find((paragraph) => paragraph.includes("Safari on macOS with FairPlay"));
  assert.ok(fairPlayPolicySource, "The policy must classify the deferred FairPlay candidate");
  const fairPlayPolicy = fairPlayPolicySource.replace(/\s+/g, " ");
  for (const fairPlayTerm of [
    "deferred",
    "unimplemented",
    "unverified",
    "not a selected support target",
    "does not establish that every macOS Safari",
    "later separately authorized DRM task"
  ]) {
    assert.ok(fairPlayPolicy.includes(fairPlayTerm), `${fairPlayTerm}:FairPlay boundary`);
  }

  const bypassPolicySource = support
    .split(/\r?\n\r?\n/)
    .find((paragraph) => paragraph.includes("five-account non-DRM"));
  assert.ok(bypassPolicySource, "The policy must record the current identity-based exposure");
  const bypassPolicy = bypassPolicySource.replace(/\s+/g, " ");
  for (const bypassTerm of [
    "five-account non-DRM",
    "identity-based",
    "passes the separate entry gate",
    "selects unprotected manifests regardless of the environment",
    "acknowledged content-protection and capture-exposure risk",
    "not a supported Safari/FairPlay path",
    "does not reproduce participant identities or associate them with device information"
  ]) {
    assert.ok(bypassPolicy.includes(bypassTerm), `${bypassTerm}:non-DRM exposure boundary`);
  }

  for (const policyTerm of [
    "Windows 11",
    "Microsoft Edge Stable",
    "Microsoft Edge Extended Stable",
    "Google Chrome Stable",
    "Mozilla Firefox Release",
    "validation-only",
    "Selected support target",
    "Unsupported",
    "Unverified",
    "evergreen"
  ]) {
    assert.ok(support.includes(policyTerm), `${policyTerm}:required policy decision`);
  }

  const capabilityStart = support.indexOf("### Capability prerequisites");
  const capabilityEnd = support.indexOf("### Failure boundaries");
  assert.ok(
    capabilityEnd > capabilityStart,
    "The capability table must remain bounded from the failure taxonomy"
  );
  const capabilitySource = support.slice(capabilityStart, capabilityEnd);
  const capabilityLabels = [
    "Native-module and API-bearing entries",
    "Ordinary authenticated learning pages",
    "Face registration and Face login",
    "Protected study media",
    "Public status report",
    "Warning pages",
    "Fullscreen"
  ];
  const capabilityRows = new Map(
    capabilityLabels.map((label) => [
      label,
      capabilitySource.split(/\r?\n/).find((line) => line.startsWith(`| ${label} |`))
    ])
  );
  const assertCapabilities = (label, capabilities) => {
    const row = capabilityRows.get(label);
    assert.ok(row, `${label}:required capability row`);
    for (const capability of capabilities) {
      assert.ok(row.includes(capability), `${label}:${capability}:required capability`);
    }
  };

  assertCapabilities("Native-module and API-bearing entries", [
    "Native JavaScript modules",
    "`fetch`",
    "`sessionStorage`",
    "`URLSearchParams`"
  ]);
  assertCapabilities("Ordinary authenticated learning pages", [
    "same-tab session state",
    "File input",
    "`FormData`"
  ]);
  assertCapabilities("Face registration and Face login", [
    "secure context",
    "Custom Elements",
    "Shadow DOM",
    "WebAssembly",
    "Web Crypto",
    "BigInt",
    "`mediaDevices.getUserMedia`",
    "trusted physical camera",
    "explicit camera permission",
    "constructable stylesheets",
    "`adoptedStyleSheets`"
  ]);
  assertCapabilities("Protected study media", [
    "secure context",
    "Media Source Extensions",
    "`MediaSource.isTypeSupported()`",
    "Encrypted Media Extensions",
    "`requestMediaKeySystemAccess()`",
    "PlayReady CDM",
    "EZDRM license service",
    "HDCP",
    "capture-resistance qualification"
  ]);
  assertCapabilities("Public status report", [
    "native modules",
    "Fetch/JSON",
    "`URLSearchParams`",
    "does not require camera, Face, Shaka, MSE, EME, PlayReady"
  ]);
  assertCapabilities("Warning pages", [
    "classic-script capabilities",
    "strict `> 1024` recovery boundary",
    "bounded relative same-origin return target",
    "missing browser-identification API"
  ]);
  assertCapabilities("Fullscreen", [
    "Fullscreen API",
    "does not by itself make the browser unsupported"
  ]);

  const policyDates = support.match(
    /Decision date: (\d{4}-\d{2}-\d{2})\. Last evidence review: (\d{4}-\d{2}-\d{2})\./
  );
  assert.ok(policyDates, "Policy decision and evidence review must use separate ISO dates");
  assert.ok(
    Date.parse(`${policyDates[2]}T00:00:00Z`) >= Date.parse(`${policyDates[1]}T00:00:00Z`),
    "The evidence review must not predate the policy decision"
  );

  for (const failureBoundary of [
    "Unsupported environment",
    "Unverified environment",
    "Camera unavailable or permission denied",
    "Protected media unavailable",
    "External dependency failure",
    "Other recoverable runtime failure"
  ]) {
    assert.ok(
      support.includes(`**${failureBoundary}:**`),
      `${failureBoundary}:required distinct failure category`
    );
  }
  assert.match(
    support,
    /`EnvironmentNotSupported`[\s\S]*lighting failure[\s\S]*`ClientVersionNotSupported`[\s\S]*neither value is an unsupported-browser verdict/,
    "Face SDK error names must not be mistaken for browser-support verdicts"
  );
  assert.match(
    support.slice(capabilityEnd, support.indexOf("### Environments without `userAgentData`")).replace(/\s+/g, " "),
    /Lack of completed capture qualification alone[\s\S]*non-excluded candidate unverified for protected study[\s\S]*explicitly outside the current product boundary remains unsupported[\s\S]*known intelligible protected-video leak[\s\S]*unsupported for protected study/,
    "Missing and failed capture qualification must retain distinct support outcomes"
  );

  assert.match(
    support,
    /`navigator\.userAgentData` is optional input[\s\S]*must never throw[\s\S]*synthetic profile with no\s+`userAgentData`/,
    "The selected policy must handle absent userAgentData without treating it as failure"
  );
  const currentGateStart = support.indexOf("### Runtime admission and qualification boundary");
  const verificationStart = support.indexOf("### Verification matrix and maintenance");
  assert.ok(
    verificationStart > currentGateStart,
    "The runtime-admission description must remain bounded from future verification"
  );
  const currentGate = support.slice(currentGateStart, verificationStart);
  const normalizedCurrentGate = currentGate.replace(/\s+/g, " ");
  assert.match(
    currentGate,
    /centralized[\s\S]*candidate[\s\S]*unsupported[\s\S]*unverified/i,
    "Runtime admission must retain three explicit centralized outcomes"
  );
  assert.match(
    normalizedCurrentGate,
    /spoofable[\s\S]*does not prove[\s\S]*Windows servicing[\s\S]*PlayReady[\s\S]*capture resistance/,
    "Runtime admission must not be presented as OS, DRM, or capture qualification"
  );

  const evidenceStart = support.indexOf("### Primary evidence");
  assert.ok(
    evidenceStart > verificationStart,
    "The verification matrix must remain bounded from the evidence list"
  );
  const verification = support.slice(verificationStart, evidenceStart);
  const normalizedVerification = verification.replace(/\s+/g, " ");
  const protectedMediaVerification = verification
    .split(/\r?\n/)
    .find((line) => line.startsWith("| Edge Stable and Extended Stable, protected media |"));
  assert.ok(protectedMediaVerification, "Protected media must retain a verification row");
  for (const verificationTerm of [
    "nonproduction MPD/license fixture",
    "exact Windows, Edge and CDM builds",
    "hardware-acceleration state",
    "internal or supported HDCP external-display path",
    "operating-system screenshot",
    "browser screenshot",
    "screen recording",
    "third-party recorder",
    "browser/window/screen sharing",
    "inline playback and fullscreen when available",
    "blocked or its protected-video region is black, blank, or omitted",
    "no intelligible protected-video image",
    "video and audio results separately",
    "disclose any captured program audio"
  ]) {
    assert.ok(
      protectedMediaVerification.includes(verificationTerm),
      `${verificationTerm}:required capture-resistance verification`
    );
  }
  assert.match(
    normalizedVerification,
    /every change[\s\S]*five business days[\s\S]*quarterly[\s\S]*out-of-cycle review[\s\S]*capture tool\/API change[\s\S]*graphics-driver change/,
    "The policy must define both verification and maintenance cadence"
  );

  for (const evidenceHost of [
    "learn.microsoft.com",
    "developer.apple.com",
    "github.com/Azure-Samples",
    "github.com/shaka-project",
    "ezdrm.com",
    "w3.org"
  ]) {
    assert.ok(support.includes(evidenceHost), `${evidenceHost}:required primary evidence`);
  }

  assert.equal(
    contractSource.includes(
      "Which user-agent shapes and browser versions must remain supported"
    ),
    false,
    "The selected contract must resolve the former browser-support question"
  );

  const lifecycleSource = fs.readFileSync(
    path.join(platformRoot, "modules", "lifecycle.js"),
    "utf8"
  );
  for (const seam of [
    "browserAdmissionEntries",
    "browserAdmissionOutcomes",
    "browserAdmissionReasons",
    "classifyBrowserAdmission",
    "conflicting-browser-evidence",
    "conflicting-platform-evidence",
    "insufficient-browser-evidence",
    "missing-mandatory-api",
    "windows-edge-candidate"
  ]) {
    assert.ok(lifecycleSource.includes(seam), `${seam}:central admission seam`);
  }
  assert.equal(lifecycleSource.includes("isMicrosoftEdge"), false);
  assert.equal(lifecycleSource.includes("userAgent.includes('Edg')"), false);
  assert.equal(
    lifecycleSource.includes("replaceWithViewportWarning"),
    true,
    "The shared minimum-viewport replacement seam must remain centralized"
  );
  assert.match(
    lifecycleSource,
    /window\.innerWidth\s*<=\s*1024[\s\S]*replaceNavigation\(warningTarget\)/,
    "The shared seam must retain the exact inclusive viewport rule and replacement call"
  );
  assert.match(lifecycleSource, /VIEWPORT_WARNING_PATH\s*=\s*['"]\/plataforma\/aviso-viewport['"]/);
  assert.match(lifecycleSource, /MAX_ENCODED_RETURN_TO_LENGTH\s*=\s*2048/);
  assert.doesNotMatch(
    lifecycleSource,
    /getUserMedia\s*\(|requestMediaKeySystemAccess\s*\(|isTypeSupported\s*\(|WebAssembly\.validate\s*\(/,
    "Admission must inspect API shapes without starting camera, EME, codec, or Wasm work"
  );

  const userAgentReaders = pageSources
    .filter(({ source }) => /userAgent(?:Data)?/.test(source))
    .map(({ relativePath }) => relativePath);
  assert.deepEqual(userAgentReaders, ["device-browser-warning/main.js", "modules/lifecycle.js"]);
  const guardedFactories = new Map([
    ["modules/login.js", "LOGIN"],
    ["modules/initial-notices.js", "INITIAL_NOTICES"],
    ["modules/photo-registration.js", "PHOTO_REGISTRATION"],
    ["modules/course-content/application.js", "STUDY"]
  ]);
  for (const [relativePath, entry] of guardedFactories) {
    const source = pageSources.find((candidate) => candidate.relativePath === relativePath).source;
    assert.match(source, /classifyBrowserAdmission\s*\(\s*\{/);
    assert.ok(source.includes(`browserAdmissionEntries.${entry}`));
    assert.match(
      source,
      /browserAdmission\.outcome\s*!==\s*browserAdmissionOutcomes\.CANDIDATE/
    );
  }
  for (const publicEntry of [
    "status-report/main.js",
    "device-browser-warning/main.js",
    "viewport-warning/main.js"
  ]) {
    const source = pageSources.find((candidate) => candidate.relativePath === publicEntry).source;
    assert.equal(source.includes("classifyBrowserAdmission"), false, publicEntry);
  }
  for (const entryMain of ["login/main.js", "photo-registration/main.js"]) {
    const source = pageSources.find((candidate) => candidate.relativePath === entryMain).source;
    assert.match(source, /fetch:\s*window\.fetch/);
    assert.match(source, /sessionStorage:\s*window\.sessionStorage/);
  }
  const studyMain = pageSources.find(
    ({ relativePath }) => relativePath === "course-content/main.js"
  ).source;
  assert.match(studyMain, /fetch:\s*bindWindowFunction\(["']fetch["']\)/);

  const minimumViewportPaths = [
    "login/main.js",
    "initial-notices/main.js",
    "photo-registration/main.js",
    "course-content/main.js",
    "status-report/main.js",
    "modules/login.js",
    "modules/initial-notices.js",
    "modules/photo-registration.js",
    "modules/course-content/application.js",
    "modules/status-report/application.js",
    "modules/lifecycle.js"
  ];
  const minimumViewportSource = minimumViewportPaths.map((relativePath) => {
    const record = pageSources.find((candidate) => candidate.relativePath === relativePath);
    assert.ok(record, `${relativePath}:minimum-viewport source`);
    return record.source;
  }).join("\n");
  assert.match(minimumViewportSource, /\/plataforma\/aviso-viewport/);
  assert.match(minimumViewportSource, /\binnerWidth\b/);
  assert.doesNotMatch(
    minimumViewportSource,
    /\bouterWidth\b|\bscreen\s*\.|\bwindow\s*\.\s*orientation\b|\bdeviceMemory\b|\bhardwareConcurrency\b|\bmaxTouchPoints\b|\bontouchstart\b|\bTouchEvent\b|\bmatchMedia\s*\([^)]*(?:pointer|hover|orientation)/,
    "Minimum-viewport admission must not grow into device classification"
  );
});

test("[ORIGIN-01] one shared origin serves exactly eight runtime consumers", () => {
  const javaScriptSources = applicationJavaScriptSources();
  const combinedJavaScript = javaScriptSources.map(({ source }) => source).join("\n");
  const allApplicationFiles = regularFilesRecursively(applicationsRoot);
  const sharedImportPattern = /^\s*import\s+\{\s*BACKEND_ORIGIN\s*\}\s+from\s+["'][^"']*shared\/backend-origin\.js["'];\s*$/m;
  const consumers = javaScriptSources
    .filter(({ source }) => source.includes("shared/backend-origin.js"))
    .map(({ relativePath }) => relativePath);

  assert.equal(
    digestStrings([productionBackendOrigin]),
    "a61d4b931a2681d219141733c64441ea26ca33d92a51f9eb23710369db6d4c01",
    "Partitioned-cookie adoption must retain the existing shared App Service origin"
  );
  assert.deepEqual(consumers, backendOriginConsumers);
  assert.equal(consumers.length, 8);
  for (const { relativePath, source } of javaScriptSources) {
    if (!consumers.includes(relativePath)) continue;
    assert.match(source, sharedImportPattern, `${relativePath}:exact shared import`);
  }
  assert.equal(
    consumers.some((relativePath) => relativePath.startsWith("apps/marketing-site/")),
    false,
    "The Marketing Site must not import the Machado backend origin"
  );
  assert.equal(
    javaScriptSources.reduce(
      (count, { source }) => count + source.split(productionBackendOrigin).length - 1,
      0
    ),
    1,
    "The production backend origin literal must occur in one executable source"
  );
  assert.doesNotMatch(
    combinedJavaScript,
    /https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?=[:/"'])/i,
    "Executable frontend source must not contain a localhost backend URL"
  );
  assert.doesNotMatch(
    combinedJavaScript,
    /(?:window\.|document\.)?location\.hostname/,
    "Runtime frontend source must not select a backend from its hostname"
  );
  assert.equal(
    allApplicationFiles.reduce(
      (count, filePath) => count + countBufferOccurrences(
        fs.readFileSync(filePath),
        Buffer.from("URL_Base_Backend", "utf8")
      ),
      0
    ),
    0,
    "The retired backend-base storage key must be absent beneath apps"
  );
  assert.equal(combinedJavaScript.includes("/null/"), false);
  assert.doesNotMatch(
    combinedJavaScript,
    /AUTHORITATIVE_SESSIONS_ENABLED|authoritativeSessions|sessionContext|BroadcastChannel|\/sessions(?:\/current)?\b|X-Machado-Session|credentials\s*:\s*["']include["']|document\.cookie/,
    "Retired session-authority flags, state, routes, headers, cookies, and cross-tab channels must be absent from runtime source"
  );

  const importEdges = moduleImportEdges(javaScriptSources);
  assert.deepEqual(
    {
      count: importEdges.length,
      digest: digestStrings(importEdges)
    },
    {
      count: 77,
      digest: "672f0f5205c1e70be7aa918986ad36e47b69511abb0ec422249a1f792e029149"
    },
    "The lean signed-handle source graph must retain its exact import aggregate"
  );
});

test("[ROUTE-01] manifest retains seven entries and a separate shared runtime mapping", () => {
  assert.ok(platformApplication, "The learning-platform manifest entry must exist");
  assert.deepEqual(manifest.sharedMappings, sharedMappings);
  assert.equal(
    manifest.applications.some((application) =>
      application.mappings.some(({ source }) => source === "apps/shared")
    ),
    false,
    "Shared runtime infrastructure must not be classified as an application"
  );
  assert.equal(platformApplication.mappings.length + manifest.sharedMappings.length, 10);
  assert.equal(
    manifest.sharedMappings.length + manifest.applications.reduce(
      (count, application) => count + application.mappings.length,
      0
    ),
    20,
    "The complete deployment graph must contain 20 mappings"
  );
  assert.deepEqual(platformApplication.mappings, finalPlatformMappings);
  assert.deepEqual(platformApplication.publicEntries, [
    {
      path: "/plataforma/aviso-viewport/",
      file: "plataforma/aviso-viewport/index.html"
    },
    {
      path: "/plataforma/aviso-dispositivo-navegador/",
      file: "plataforma/aviso-dispositivo-navegador/index.html"
    },
    {
      path: "/plataforma/avisos-iniciais/",
      file: "plataforma/avisos-iniciais/index.html"
    },
    {
      path: "/plataforma/cadastro-foto/",
      file: "plataforma/cadastro-foto/index.html"
    },
    {
      path: "/plataforma/estudo/",
      file: "plataforma/estudo/index.html"
    },
    {
      path: "/plataforma/login/",
      file: "plataforma/login/index.html"
    },
    {
      path: "/plataforma/statusreport/",
      file: "plataforma/statusreport/index.html"
    }
  ]);

  const records = platformRecords();
  for (const entry of platformApplication.publicEntries) {
    assert.ok(entry.path.endsWith("/"), "Canonical entries must retain trailing slashes");
    assert.ok(
      fs.statSync(localPath(sourceForOutput(records, entry.file))).isFile(),
      "Every canonical entry must emit its index"
    );
  }
  assert.equal(
    platformApplication.publicEntries.some(({ path }) => path.startsWith("/plataforma_v2/")),
    false,
    "Former learning-platform entries must not remain public"
  );
  assert.equal(
    records.some(({ output }) => output.startsWith("plataforma_v2/")),
    false,
    "The former learning-platform output subtree must not be emitted"
  );
  assert.equal(
    retiredModuleOutputPairs.length,
    15,
    "The retirement contract must enumerate exactly 15 legacy module outputs"
  );
  for (const { canonical, retired, source } of retiredModuleOutputPairs) {
    assert.equal(sourceForOutput(records, canonical), source, `${canonical}:canonical source`);
    assert.equal(
      records.some(({ output }) => output === retired),
      false,
      `${retired}:retired output`
    );
  }

  const registrationMainSource = pageSources.find(
    ({ relativePath }) => relativePath === "photo-registration/main.js"
  ).source;
  assert.match(
    registrationMainSource,
    /from ["']\.\.\/modules\/photo-registration\.js["']/,
    "The registration entry must import the module at its matching deployed path"
  );
  assert.doesNotMatch(registrationMainSource, /\.\.\/modules\/registration\.js/);

  const courseContentMainSource = pageSources.find(
    ({ relativePath }) => relativePath === "course-content/main.js"
  ).source;
  assert.deepEqual(
    Array.from(
      courseContentMainSource.matchAll(
        /from ["'](\.\.\/modules\/course-content\/[^"']+)["']/g
      ),
      ([, importPath]) => importPath
    ),
    [
      "../modules/course-content/application.js",
      "../modules/course-content/certificate-renderer.js",
      "../modules/course-content/dom.js",
      "../modules/course-content/downloads.js",
      "../modules/course-content/player.js"
    ],
    "The study entry must import all five modules from their matching deployed directory"
  );
  assert.doesNotMatch(courseContentMainSource, /\.\.\/modules\/study\//);
});

test("[ROUTE-02] current root and retired routes remain 404 while source navigation stays slashless", () => {
  const records = platformRecords();
  const outputPaths = new Set(records.map(({ output }) => output));

  assert.ok(
    manifest.notFoundPaths.includes("/plataforma/"),
    "The current platform root must remain an explicit not-found contract"
  );
  assert.deepEqual(
    retiredPlatformPaths.filter((retiredPath) => manifest.notFoundPaths.includes(retiredPath)),
    retiredPlatformPaths,
    "The former root and all seven former canonical entries must remain explicit not-found contracts"
  );
  assert.deepEqual(
    retiredRegistrationPaths.filter((retiredPath) => manifest.notFoundPaths.includes(retiredPath)),
    retiredRegistrationPaths,
    "All three retired registration entry forms must be explicit not-found contracts"
  );
  assert.deepEqual(
    retiredCurrentWarningPaths.filter((retiredPath) => manifest.notFoundPaths.includes(retiredPath)),
    retiredCurrentWarningPaths,
    "All six former current warning URL forms must be explicit not-found contracts"
  );
  assert.ok(
    retiredWarningOutputs.every((output) => !outputPaths.has(output)),
    "The complete former warning subtrees must not be emitted"
  );
  assert.ok(
    records.every(
      ({ output }) =>
        !output.startsWith("plataforma/aviso-dispositivo/") &&
        !output.startsWith("plataforma/aviso-navegador/")
    ),
    "No former warning subtree may remain in the mapped artifact"
  );
  assert.deepEqual(
    currentWarningOutputs.filter((output) => outputPaths.has(output)),
    currentWarningOutputs,
    "The two renamed warning subtrees must each emit the same exact five relative files"
  );
  assert.ok(
    retiredRegistrationPaths.every(
      (retiredPath) => !outputPaths.has(retiredPath.replace(/^\//, ""))
    ),
    "The retired registration entry must not be emitted"
  );
  assert.ok(
    records.every(({ output }) => !output.startsWith("plataforma/cadastro/")),
    "The retired registration subtree must not be emitted"
  );
  assert.deepEqual(
    retiredModulePaths.filter((modulePath) => manifest.notFoundPaths.includes(modulePath)),
    retiredModulePaths,
    "All 15 retired module URLs must be explicit not-found contracts"
  );
  assert.ok(
    retiredModulePaths.every((modulePath) =>
      !outputPaths.has(modulePath.replace(/^\//, ""))
    ),
    "The retired module URLs must not be emitted"
  );
  assert.equal(
    fs.existsSync(path.join(platformRoot, "index.html")),
    false,
    "The platform root must not gain an index"
  );

  const destinations = new Set();
  const combinedPageSource = pageSources.map(({ source }) => source).join("\n");
  for (const { source } of pageSources) {
    for (const pattern of [
      /window\.location\.href\s*=\s*["']([^"']+)["']/g,
      /\bnavigate\(\s*["']([^"']+)["']\s*\)/g
    ]) {
      for (const match of source.matchAll(pattern)) destinations.add(match[1]);
    }
  }
  assert.deepEqual([...destinations].sort(compareText), [
    "/plataforma/avisos-iniciais",
    "/plataforma/cadastro-foto",
    "/plataforma/estudo",
    "/plataforma/login"
  ]);
  assert.ok(
    [...destinations].every((destination) => !destination.endsWith("/")),
    "Internal document destinations must remain slashless"
  );
  const replacementDestinations = new Set();
  for (const { source } of pageSources) {
    for (const match of source.matchAll(/\breplaceNavigation\(\s*["']([^"']+)["']\s*\)/g)) {
      replacementDestinations.add(match[1]);
    }
  }
  assert.deepEqual([...replacementDestinations].sort(compareText), [
    "/plataforma/aviso-dispositivo-navegador",
    "/plataforma/login"
  ]);
  assert.match(combinedPageSource, /VIEWPORT_WARNING_PATH\s*=\s*["']\/plataforma\/aviso-viewport["']/);
  assert.ok(
    [...replacementDestinations].every((destination) => !destination.endsWith("/")),
    "Learning-platform replacement destinations must remain slashless"
  );
  assert.equal(
    /history\.(?:pushState|replaceState)|\bpopstate\b|hashchange/.test(
      combinedPageSource
    ),
    false,
    "The platform must not gain SPA history manipulation or route normalization"
  );
  assert.ok(
    /Production serves each current slashless platform entry with the same entry\s+bytes and HTTP `200`, without a `Location` header or HTTP redirect/.test(
      contractSource
    ),
    "Measured slashless transport behavior must remain explicit"
  );
  assert.ok(
    /On direct\s+slashless entry, the browser keeps the exact path, query string, and fragment\s+through refresh when existing page-lifecycle logic does not navigate away; the\s+route layer adds no normalization history entry/.test(
      contractSource
    ),
    "Measured slashless browser-history behavior must remain explicit"
  );
});

test("[FACE-01] Face SDK 1.5.0 assets, presentation hooks, and base-relative resolution remain frozen", () => {
  const engineAlternatives = [
    {
      javascript: "facelivenessdetector-assets/js/AzureAIVisionFace.js",
      wasm: "facelivenessdetector-assets/js/AzureAIVisionFace.wasm"
    },
    {
      javascript: "facelivenessdetector-assets/js/AzureAIVisionFace_SIMD.js",
      wasm: "facelivenessdetector-assets/js/AzureAIVisionFace_SIMD.wasm"
    }
  ];
  const expectedEngines = engineAlternatives.flatMap(({ javascript, wasm }) => [
    javascript,
    wasm
  ]);
  const faceFiles = gitTrackedFiles("apps/learning-platform/azure-ai-vision-face-ui");
  const relativeFaceFiles = faceFiles.map((file) =>
    file.slice("apps/learning-platform/azure-ai-vision-face-ui/".length)
  );
  const faceRecords = faceFiles.map((source, index) => ({
    output: relativeFaceFiles[index],
    source
  }));
  const dictionaries = relativeFaceFiles.filter(
    (file) => file.startsWith("facelivenessdetector-assets/i18n/") && file.endsWith("/en.json") ||
      file === "facelivenessdetector-assets/i18n/en.json"
  );
  const images = relativeFaceFiles.filter((file) =>
    file.startsWith("facelivenessdetector-assets/images/")
  );
  const engines = relativeFaceFiles.filter((file) =>
    file.startsWith("facelivenessdetector-assets/js/")
  );

  assert.equal(relativeFaceFiles.length, 85, "The Face subtree must retain 85 files");
  assert.deepEqual(
    treeStats(faceRecords),
    {
      files: 85,
      bytes: 9526729,
      digest: "56da181049f18302b00fdbf04851d1433adf819341564a326e652c75145576e3"
    },
    "The complete vendored Face subtree must remain byte-identical"
  );
  assert.equal(dictionaries.length, 75, "The Face subtree must retain 75 dictionaries");
  assert.deepEqual(images, [
    "facelivenessdetector-assets/images/Brightness.svg",
    "facelivenessdetector-assets/images/FaceId.svg",
    "facelivenessdetector-assets/images/Smile.svg",
    "facelivenessdetector-assets/images/activeMotionVisualHint.png",
    "facelivenessdetector-assets/images/logo.svg"
  ]);
  assert.deepEqual(engines, expectedEngines);
  assert.ok(
    relativeFaceFiles.includes("facelivenessdetector-assets/i18n/pt-BR/en.json"),
    "The pt-BR dictionary must remain emitted"
  );
  assert.ok(/clientSDKversion:"1\.5\.0"/.test(faceSource), "The Face version must remain 1.5.0");
  assert.ok(/WebAssembly\.validate\(/.test(faceSource), "The Face loader must retain its SIMD probe");
  assert.ok(faceSource.includes("AzureAIVisionFace.js"));
  assert.ok(faceSource.includes("AzureAIVisionFace_SIMD.js"));
  assert.ok(faceSource.includes("./facelivenessdetector-assets/i18n/"));
  assert.ok(faceSource.includes("/facelivenessdetector-assets/js/"));
  assert.ok(faceSource.includes(".wasm"));
  assert.match(
    faceSource,
    /\.id="face-liveness-loading"[\s\S]{0,1500}document\.body\.appendChild\(/,
    "The application-owned viewport override requires the vendor loader to remain in document.body"
  );

  const checkboxMarkup = Buffer.from(
    '<input type="checkbox" id="brightnessCheckbox" name="brightnessCheckbox">',
    "utf8"
  );
  const checkboxStyle = Buffer.from("#brightnessCheckbox {", "utf8");
  const shadowRootConstructor = Buffer.from("attachShadow", "utf8");
  const closedShadowMode = Buffer.from("closed", "utf8");
  const activeShadowRoot = Buffer.from("_currentShadowRoot", "utf8");
  const completionSpinner = Buffer.from(
    '<div class="spinnerCheck" id="spinnerCheck">',
    "utf8"
  );
  const completionCircleStyle = Buffer.from(".spinnerCheck #circle {", "utf8");
  const completionTickStyle = Buffer.from(".spinnerCheck #tick {", "utf8");
  const completionGreen = Buffer.from("stroke: #63bc01;", "utf8");
  const vendorAccentColors = ["accent-color", "accentColor"].map((value) =>
    Buffer.from(value, "utf8")
  );
  for (const { wasm } of engineAlternatives) {
    const engineBytes = fs.readFileSync(path.join(faceRoot, ...wasm.split("/")));
    assert.equal(
      countBufferOccurrences(engineBytes, shadowRootConstructor),
      1,
      `${wasm} must retain the Shadow DOM boundary used by the Face controls`
    );
    assert.equal(
      countBufferOccurrences(engineBytes, closedShadowMode),
      1,
      `${wasm} must retain the closed Shadow DOM mode wrapped by the application seam`
    );
    assert.equal(
      countBufferOccurrences(engineBytes, activeShadowRoot),
      1,
      `${wasm} must retain its current Shadow DOM root lifecycle`
    );
    assert.equal(
      countBufferOccurrences(engineBytes, checkboxMarkup),
      1,
      `${wasm} must retain the native brightness checkbox branded through the Face host`
    );
    assert.equal(
      countBufferOccurrences(engineBytes, checkboxStyle),
      1,
      `${wasm} must retain the brightness checkbox style anchor`
    );
    assert.equal(
      countBufferOccurrences(engineBytes, completionSpinner),
      1,
      `${wasm} must retain the completion spinner branded through the shadow-root seam`
    );
    assert.equal(
      countBufferOccurrences(engineBytes, completionCircleStyle),
      1,
      `${wasm} must retain the completion-circle style anchor`
    );
    assert.equal(
      countBufferOccurrences(engineBytes, completionTickStyle),
      1,
      `${wasm} must retain the completion-tick style anchor`
    );
    assert.equal(
      countBufferOccurrences(engineBytes, completionGreen),
      4,
      `${wasm} must retain the four vendor green strokes overridden by the application seam`
    );
    assert.ok(
      vendorAccentColors.every(
        (value) => countBufferOccurrences(engineBytes, value) === 0
      ),
      `${wasm} must continue inheriting the checkbox accent from the Face host`
    );
  }

  const basePath = "/plataforma/azure-ai-vision-face-ui/";
  const inertOrigin = ["https:", "", "platform.invalid"].join("/");
  const faceStartupSource = pageSources.find(
    ({ relativePath }) => relativePath === "modules/face-startup.js"
  ).source;
  assert.ok(
    faceStartupSource.includes(
      ":host,\\n* {\\n    -webkit-user-select: none;\\n    user-select: none;\\n}\\n\\n#spinnerCheck #circle,\\n#spinnerCheck #tick {\\n    stroke: #4a0816 !important;\\n}"
    ),
    "The shared Face startup seam must retain the reviewed completion color"
  );
  assert.match(
    faceStartupSource,
    /shadowRoot\.adoptedStyleSheets\s*=\s*\[\.\.\.shadowRoot\.adoptedStyleSheets,\s*styleSheet\]/,
    "The shared Face startup seam must adopt its stylesheet inside the closed root"
  );
  for (const entryName of ["login", "photo-registration"]) {
    const entryHtml = fs.readFileSync(path.join(platformRoot, entryName, "index.html"), "utf8");
    const entrySource = fs.readFileSync(path.join(platformRoot, entryName, "main.js"), "utf8");
    const entrySourceGraph = `${entrySource}\n${faceStartupSource}`;
    assert.ok(
      /<base\s+href="\/plataforma\/azure-ai-vision-face-ui\/"\s*\/?\s*>/i.test(
        entryHtml
      ),
      "Each Face entry must retain the exact base path"
    );
    assert.equal(
      (entrySourceGraph.match(/\.locale\s*=\s*["']pt-BR["']/g) ?? []).length,
      1,
      "Each Face entry must select pt-BR exactly once"
    );
    assert.equal(
      (entrySource.match(/import\s+["']\.\.\/azure-ai-vision-face-ui\/FaceLivenessDetector\.js["']/g) ?? []).length,
      0,
      "A production Face entry must not execute the vendored bundle eagerly"
    );
    assert.equal(
      (entrySource.match(/import\s*\(\s*["']\.\.\/azure-ai-vision-face-ui\/FaceLivenessDetector\.js["']\s*\)/g) ?? []).length,
      1,
      "Each production Face entry must retain one literal deferred vendored import"
    );
    assert.match(entrySource, /loadFaceRuntime:\s*\(\)\s*=>\s*import\s*\(/);
    assert.equal(
      (entrySource.match(/createFaceStyleSheet:\s*\(\)\s*=>\s*new window\.CSSStyleSheet\(\)/g) ?? []).length,
      1,
      "Each production Face entry must construct the application stylesheet in its browser realm"
    );
  }
  assert.match(faceStartupSource, /ensureRuntime\(\)\.then\(\(\)\s*=>\s*\{/);

  const resolvedBase = new URL(basePath, inertOrigin);
  const resolvedDictionary = new URL(
    "./facelivenessdetector-assets/i18n/pt-BR/en.json",
    resolvedBase
  );
  const resolvedEnginePaths = expectedEngines.map(
    (relativePath) => new URL(`./${relativePath}`, resolvedBase).pathname
  );
  assert.equal(
    resolvedDictionary.pathname,
    `${basePath}facelivenessdetector-assets/i18n/pt-BR/en.json`
  );
  assert.deepEqual(
    resolvedEnginePaths,
    expectedEngines.map((relativePath) => `${basePath}${relativePath}`),
    "Both regular and SIMD JavaScript/WASM alternatives must resolve beneath the Face base"
  );

  const portugueseDictionarySource = fs.readFileSync(
    path.join(faceRoot, "facelivenessdetector-assets", "i18n", "pt-BR", "en.json"),
    "utf8"
  );
  const portugueseDictionary = JSON.parse(
    portugueseDictionarySource.replace(/^\uFEFF/, "")
  );
  assert.equal(
    portugueseDictionary.AZAIF_FeedbackStarting,
    "Iniciando...",
    "The reviewed Face loading copy must remain vendor-owned and unchanged"
  );

  for (const entryName of ["login", "photo-registration"]) {
    const styleSource = fs.readFileSync(
      path.join(platformRoot, entryName, "style.css"),
      "utf8"
    );
    const loaderOverrides = Array.from(
      styleSource.matchAll(/html body #face-liveness-loading\s*\{([^}]*)\}/g),
      (match) => match[1]
    );
    const dotOverrides = Array.from(
      styleSource.matchAll(/#face-liveness-loading\s+\.loading-dot\s*\{([^}]*)\}/g),
      (match) => match[1]
    );
    const checkboxHostOverrides = Array.from(
      styleSource.matchAll(/azure-ai-vision-face-ui\s*\{([^}]*)\}/g),
      (match) => match[1]
    );
    assert.deepEqual(
      loaderOverrides,
      [
        "\n    position: fixed;\n    inset: 0;\n    width: auto;\n    height: auto;\n    margin: 0;\n"
      ],
      `${entryName} must make the Face loading surface fill the viewport`
    );
    assert.deepEqual(
      dotOverrides,
      ["\n    background: #4a0816;\n"],
      `${entryName} must retain the reviewed Face loading-dot color`
    );
    assert.deepEqual(
      checkboxHostOverrides,
      ["\n    accent-color: #4a0816;\n"],
      `${entryName} must inherit the reviewed checkbox color through the Face host`
    );
    assert.equal(
      /html body #brightnessCheckbox\s*\{/.test(styleSource),
      false,
      `${entryName} must not rely on a selector that cannot cross the Face Shadow DOM`
    );
  }
});

test("[ASSET-01] platform tracked bytes, paths, Unicode, and digest remain exact", () => {
  const records = platformRecords();
  const outputPaths = records.map(({ output }) => output);
  const extensionCounts = Object.fromEntries(
    Array.from(
      outputPaths.reduce((counts, file) => {
        const extension = path.posix.extname(file).slice(1).toLowerCase();
        counts.set(extension, (counts.get(extension) ?? 0) + 1);
        return counts;
      }, new Map()).entries()
    ).sort(([left], [right]) => compareText(left, right))
  );

  assert.deepEqual(
    treeStats(records),
    {
      files: 182,
      bytes: 20758006,
      digest: "6b021520980a656a7c89d821c624ab19363e116971b9f1d143a3912401a21c3c"
    },
    "The current manifest must produce the exact platform artifact"
  );
  assert.deepEqual(
    treeStats(records.map((record) => ({
      ...record,
      output: record.output.slice("plataforma/".length)
    }))),
    {
      files: 182,
      bytes: 20758006,
      digest: "5f318212c1d985df7c26274c71ae233aff1cb3b234ca0c756624296885bdea81"
    },
    "The current manifest must produce the exact prefix-omitted platform identity"
  );
  const javaScriptRecords = records.filter(
    ({ output }) => path.posix.extname(output).toLowerCase() === ".js"
  );
  assert.deepEqual(
    treeStats(javaScriptRecords),
    {
      files: 36,
      bytes: 470868,
      digest: "cfa9c8c8404e2af024fe798a0e2472d7e7f0f0848b12c655dae92c7dc21a4869"
    },
    "The platform JavaScript files must retain their exact current identity"
  );
  const nonJavaScriptRecords = records.filter(
    ({ output }) => path.posix.extname(output).toLowerCase() !== ".js"
  );
  assert.deepEqual(
    treeStats(nonJavaScriptRecords),
    {
      files: 146,
      bytes: 20287138,
      digest: "fe6bd4d3b5a0e5deae66c6082a7e66166452a6d2468339b6c3d128442a6bcc72"
    },
    "The platform non-JavaScript paths and bytes must match the current jsPDF pin"
  );
  const binaryExtensions = new Set([
    ".ico",
    ".jpg",
    ".png",
    ".vsdx",
    ".vssx",
    ".wasm",
    ".xlsm",
    ".xlsx"
  ]);
  const binaryRecords = records.filter(({ output }) =>
    binaryExtensions.has(path.posix.extname(output).toLowerCase())
  );
  assert.deepEqual(
    treeStats(binaryRecords),
    {
      files: 52,
      bytes: 19319394,
      digest: "4fe456a88c86adc5804aedb90927ea8c52122dd198dce3452f8b780aab538d1a"
    },
    "The complete platform binary set must retain exact paths and bytes after alignment"
  );
  const studyRecords = records.filter(({ output }) =>
    output.startsWith("plataforma/estudo/")
  );
  assert.deepEqual(
    treeStats(studyRecords),
    {
      files: 41,
      bytes: 10022029,
      digest: "1ab33e83f59f9fdbc27829e50f80e2b347f007b41c0c2ac84ef3e6bc94b2cd60"
    },
    "The Study entry subtree must retain its current mapped identity"
  );
  const backendConsumerApplicationStats = Object.fromEntries(
    backendConsumerApplicationIds.map((applicationId) => [
      applicationId,
      treeStats(mappedFiles(
        manifest.applications.filter(({ id }) => id === applicationId)
      ))
    ])
  );
  assert.deepEqual(backendConsumerApplicationStats, {
    "quote-request": {
      files: 4,
      bytes: 46303,
      digest: "60014497998c75ec8ff4b34286265008d1d8b52f3007b5e1492caad8314d77a9"
    },
    "client-intake": {
      files: 5,
      bytes: 165729,
      digest: "99c1f01b02c5c1d2dd13b5c4b93e3654ff6b7c4970772f7850ecc18c4fb38ad4"
    },
    "certificate-validation": {
      files: 5,
      bytes: 131335,
      digest: "f29860ea813106ddb1c9181aa9dec83414baa1207f3601248a540239d2cf119d"
    },
    "conecta-referral-form": {
      files: 6,
      bytes: 393842,
      digest: "47b7b73c6aa53d9af15b01041f2841588d8404bb015990a59a540863dcf77520"
    }
  });
  const backendConsumerApplicationRecords = mappedFiles(
    manifest.applications.filter(({ id }) =>
      backendConsumerApplicationIds.includes(id)
    )
  );
  assert.deepEqual(
    treeStats(backendConsumerApplicationRecords),
    {
      files: 20,
      bytes: 737209,
      digest: "a270d13916c0ffb350dfe0c777e07776ec9c9ea9e8baeb9724c2bb72f6f17b1b"
    },
    "The four API-bearing public applications must retain their exact aggregate identity"
  );
  const unrelatedRecords = mappedFiles(
    manifest.applications.filter(({ id }) => id !== "learning-platform")
  );
  assert.deepEqual(
    treeStats(unrelatedRecords),
    {
      files: 75,
      bytes: 6605265,
      digest: "b14bae0503870a00f9f013999131070b78552fbf0e76c69e1643d96d843cc091"
    },
    "Non-platform applications must retain their current exact identity"
  );
  assert.ok(
    outputPaths.every((file) => file === file.normalize("NFC")),
    "Every platform path must remain NFC"
  );
  assert.equal(
    outputPaths.filter((file) => /[^\x00-\x7f]/.test(file)).length,
    34,
    "The platform must retain 34 non-ASCII paths"
  );
  assert.deepEqual(extensionCounts, {
    css: 7,
    html: 7,
    ico: 5,
    jpg: 1,
    js: 36,
    json: 75,
    png: 11,
    svg: 5,
    vssx: 1,
    vsdx: 2,
    wasm: 2,
    xlsm: 19,
    xlsx: 11
  });
});

test("[ASSET-02] downloads and certificate inputs retain exact emitted paths and reachability", () => {
  const downloadRecords = platformRecords().filter(({ output }) =>
    output.startsWith("plataforma/estudo/files/")
  );
  const downloadFiles = downloadRecords.map(({ output }) => output);
  const assignments = downloadReferences();
  const reachableFiles = new Set(assignments);
  const emittedFiles = new Set(downloadFiles);

  assert.equal(downloadFiles.length, 33, "The study subtree must retain 33 downloads");
  assert.equal(
    downloadRecords.reduce(
      (total, record) => total + fs.statSync(localPath(record.source)).size,
      0
    ),
    9163893,
    "Download bytes must remain exact"
  );
  assert.deepEqual(
    treeStats(downloadRecords),
    {
      files: 33,
      bytes: 9163893,
      digest: "1073822d29815c0d23e984c347b70c468235be47083b7ce5c23b33565a0dece5"
    },
    "Every emitted download path and content byte must retain its digest"
  );
  assert.equal(
    digestStrings(
      downloadFiles.map((file) => file.slice("plataforma/estudo/files/".length))
    ),
    "e8b215eb672d70fdab52c3085cbfa4cab227869ec841e4eb2d38852ea65837f2",
    "The exact download path set must remain unchanged"
  );
  assert.equal(assignments.length, 34, "The source must retain 34 download assignments");
  assert.equal(reachableFiles.size, 31, "Exactly 31 emitted downloads must remain reachable");
  assert.equal(
    digestStrings(
      [...reachableFiles].map((file) =>
        file.slice("plataforma/estudo/files/".length)
      )
    ),
    "91aa2b77d0eecdf43dcffddce9934f0962e4e4ac33129bbd59ffceb9b92253da",
    "The exact 31 reachable download targets must remain unchanged"
  );
  const unreferencedFiles = downloadFiles.filter((file) => !reachableFiles.has(file));
  assert.equal(
    unreferencedFiles.length,
    2,
    "Exactly two emitted downloads must remain unreferenced"
  );
  assert.equal(
    digestStrings(
      unreferencedFiles.map((file) =>
        file.slice("plataforma/estudo/files/".length)
      )
    ),
    "22500feb327130bae8b091dc51abdecf34ded81aa52a293bc0146649f5c1647b",
    "The exact two unreferenced download files must remain unchanged"
  );
  assert.ok(
    assignments.every((file) => emittedFiles.has(file)),
    "Every root-relative download assignment must resolve with exact case"
  );
  assert.ok(
    downloadFiles.every((file) => file === file.normalize("NFC")),
    "Every download path must remain NFC"
  );

  const certificatePaths = Array.from(
    studySource.matchAll(/doc\.addImage\('([^']+)'\s*,\s*'[^']+'/g),
    ([, publicPath]) => publicPath
  );
  assert.deepEqual(certificatePaths, [
    "/plataforma/estudo/img/LOGO_MACHADO_CERTIFICADO.jpg",
    "/plataforma/estudo/img/ASSINATURA.png",
    "/plataforma/estudo/img/ATLAS.png"
  ]);
  const platformFiles = platformRecords();
  const certificateRecords = certificatePaths.map((publicPath) => {
    const output = publicPath.slice(1);
    return { output, source: sourceForOutput(platformFiles, output) };
  });
  assert.ok(
    certificateRecords.every(({ source }) => fs.statSync(localPath(source)).isFile()),
    "Every browser-generated certificate input must resolve with exact case"
  );
  assert.deepEqual(
    treeStats(certificateRecords),
    {
      files: 3,
      bytes: 148461,
      digest: "82c735c7ac2fa32e09d71c326765db9c52ce63b58144c7c7b100458f8b897591"
    },
    "Every browser-generated certificate input path and content byte must retain its digest"
  );
});

test("[VIDEO-01] 151 exact module-topic keys derive both DASH namespace manifests offline", () => {
  const moduleVideoCounts = [11, 15, 19, 18, 17, 8, 12, 22, 17, 12];
  const moduleNodeCounts = moduleVideoCounts.map((count) => count + 2);
  const nodes = htmlDataNodes();
  const videoKeys = [];
  let offset = 0;

  assert.equal(nodes.length, 171, "The study index must retain 171 nodes");
  assert.deepEqual(
    nodes.map(({ index }) => index),
    Array.from({ length: 171 }, (_, index) => index + 1),
    "Study data-index values must remain contiguous"
  );

  for (let moduleIndex = 0; moduleIndex < moduleVideoCounts.length; moduleIndex += 1) {
    const nodesInModule = nodes.slice(offset, offset + moduleNodeCounts[moduleIndex]);
    assert.equal(
      nodesInModule.length,
      moduleNodeCounts[moduleIndex],
      "Each module must retain its exact node boundary"
    );
    for (const node of nodesInModule.slice(0, moduleVideoCounts[moduleIndex])) {
      assert.equal(typeof node.name, "string", "Every video topic must retain its name key");
      videoKeys.push(`M${String.fromCodePoint(0xf3)}dulo ${moduleIndex + 1}\0${node.name}`);
    }
    offset += moduleNodeCounts[moduleIndex];
  }

  assert.equal(videoKeys.length, 151, "The platform must retain 151 video keys");
  assert.equal(new Set(videoKeys).size, 151, "Module-topic video keys must remain unique");
  assert.equal(
    digestStrings(videoKeys),
    "3605b52cca78a60da97b9992665af20a1cb6cd474cb80e9ced2df4f8fae44c7f",
    "The exact module-topic manifest-key set must remain unchanged"
  );
  assert.ok(
    /state\.openModule\s*=\s*`M.dulo \$\{activeModuleIndex \+ 1\}`/u.test(studySource),
    "Module folders must remain derived from the one-based module number"
  );

  const prefixes = mediaLoadPrefixes();
  assert.equal(prefixes.length, 2, "Protected and bypass load expressions must both remain");
  const namespaceKinds = prefixes.map((prefix) => {
    const parsedPrefix = inspectUrlRole(prefix);
    assert.equal(parsedPrefix.valid, true, "Media namespaces must remain valid URL roles");
    assert.equal(parsedPrefix.protocol, "https:", "Media namespaces must remain absolute HTTPS roles");
    if (parsedPrefix.pathname.endsWith("/videosv3/plataforma_v2/")) return "protected";
    if (parsedPrefix.pathname.endsWith("/videosv3/plataforma_v2_sem_drm/")) return "bypass";
    return "unknown";
  });
  assert.deepEqual(namespaceKinds.sort(compareText), ["bypass", "protected"]);
  assert.equal(
    new Set(prefixes.map((prefix) => inspectUrlRole(prefix).originDigest)).size,
    1,
    "Both media namespaces must retain the same storage origin"
  );

  for (const prefix of prefixes) {
    for (const key of videoKeys) {
      const [moduleName, topicName] = key.split("\0");
      const manifestReference = `${prefix}${moduleName}/${topicName}_dash.mpd`;
      assert.ok(
        manifestReference.endsWith(`/${moduleName}/${topicName}_dash.mpd`),
        "Every exact module-topic key must retain the DASH suffix rule"
      );
      assert.doesNotThrow(
        () => assert.equal(isStructurallyValidUrl(manifestReference), true),
        "Every derived manifest reference must remain structurally valid"
      );
    }
  }
});

test("[VIDEO-02] DRM selection, retained player, controls, and completion wiring remain source-frozen", () => {
  const sensitive = sourceDerivedSensitiveLiterals();
  assert.equal(sensitive.participantNames.length, 5, "The bypass branch must retain five entries");
  assert.equal(
    new Set(sensitive.participantNames).size,
    5,
    "The bypass entries must remain five distinct source-derived values"
  );
  assert.ok(
    /\{ drmEnabled = false \} else \{ drmEnabled = true \}/.test(studySource),
    "The allowlist branch must bypass DRM and default to protected media"
  );

  const playReadyConfiguration = studySource.match(
    /servers:\s*\{\s*'([^']+)'\s*:\s*'([^']+)'\s*\}/
  );
  assert.ok(playReadyConfiguration, "A single DRM server role must remain configured");
  assert.equal(playReadyConfiguration[1], "com.microsoft.playready");
  const playReadyRole = inspectUrlRole(playReadyConfiguration[2]);
  assert.equal(playReadyRole.valid, true, "The PlayReady role must remain a valid URL");
  assert.equal(playReadyRole.protocol, "https:", "The PlayReady role must remain HTTPS");
  assert.ok(playReadyRole.pathname.length > 1, "The PlayReady role must retain its path");
  assert.equal(playReadyRole.searchPresent, true, "The PlayReady role must retain credential parameters");
  assert.equal(
    (studySource.match(/\bplayer\.configure\(/g) ?? []).length,
    1,
    "Only the PlayReady player configuration must remain authored"
  );

  assert.ok(/let player;/.test(studySource), "The retained player variable must remain");
  assert.ok(/let playerUi;/.test(studySource), "The retained UI variable must remain");
  assert.ok(
    /let playerLoaded = false;/.test(studySource),
    "The one-time player initialization flag must remain false initially"
  );
  assert.equal(
    (studySource.match(/new shaka\.Player\(\)/g) ?? []).length,
    1,
    "One retained player must be constructed"
  );
  assert.ok(
    /if \(playerLoaded === false\)[\s\S]*playerLoaded = true;/.test(studySource),
    "Player construction must remain guarded and flip the retained flag"
  );

  const controlsMatch = studySource.match(
    /controlPanelElements:\s*\[([^\]]+)\]\s*,\s*overflowMenuButtons:\s*\[\]/
  );
  assert.ok(controlsMatch, "The Shaka control configuration must remain present");
  const controls = Array.from(controlsMatch[1].matchAll(/'([^']+)'/g), ([, value]) => value);
  assert.deepEqual(controls, [
    "play_pause",
    "time_and_duration",
    "spacer",
    "mute",
    "volume",
    "quality",
    "playback_rate",
    "fullscreen"
  ]);
  assert.equal(mediaLoadPrefixes().length, 2, "Both media load expressions must remain");
  assert.equal(
    (studySource.match(/dom\.playerElement\.play\(\)/g) ?? []).length,
    1,
    "Each topic open must retain the authored autoplay call"
  );
  assert.equal(
    (studySource.match(/(?:ContainerInternoShakaPlayer|dom\.playerElement)\.pause\(\)/g) ?? []).length,
    4,
    "Assessment, feedback, certificate, and browser-final logout must pause presentation"
  );
  assert.equal(
    (studySource.match(/dom\.playerElement\.onended\s*=/g) ?? []).length,
    2,
    "Open and completed topics must retain distinct ended handlers"
  );
  assert.ok(
    /onended = \(\) => \{ completeTopic\(selectedTopic\); \};/.test(studySource),
    "Open topics must complete on ended"
  );
  assert.ok(
    /onended = \(\) => \{[\s\S]*openTopic\.call\(document\.querySelector\(/.test(studySource),
    "Completed topics must advance on ended"
  );
  assert.equal(
    /(?:ShakaPlayer|player)\.(?:unload|destroy)\(|\babr\s*:|streaming\s*:|restrictions\s*:/i.test(
      studySource
    ),
    false,
    "Player teardown and rendition policy must remain delegated to Shaka defaults"
  );

  const shakaReferences = Array.from(
    studyHtml.matchAll(/(?:href|src)="([^"]*\/shaka-player\/4\.6\.0\/[^"]+)"/g),
    ([, value]) => value
  );
  assert.equal(shakaReferences.length, 2, "Study must retain both Shaka 4.6.0 CDN assets");
  assert.ok(
    shakaReferences.every((value) => inspectUrlRole(value).protocol === "https:"),
    "Shaka assets must remain absolute HTTPS references"
  );
});

test("[ARTIFACT-01] current frontend artifact retains the complete output graph", () => {
  const historicalPhaseB = {
    files: 257,
    bytes: 27298502,
    digest: "166506b93b3477a175851a089360631894b0a67e9fa3fc9bdab4bd8b5b185561"
  };
  const applicationRecords = mappedFiles();
  const records = deploymentRecords();
  const compatibilityRecords = compatibilityShapeRecords();
  const applicationStats = treeStats(applicationRecords);
  assert.equal(
    applicationStats.files,
    historicalPhaseB.files,
    "The application mappings must retain the historical phase-B path count"
  );
  assert.notDeepEqual(
    applicationStats,
    historicalPhaseB,
    "The historical phase-B identity must not be presented as the current artifact"
  );
  assert.deepEqual(
    treeStats(records),
    {
      files: 258,
      bytes: 27363352,
      digest: "3a2043dd91ca42aa45ffa5f5f4380dc0947f04e1256efbc25e3223641aba24a0"
    },
    "The current manifest must produce the exact frontend artifact"
  );
  assert.deepEqual(
    treeStats(sharedRuntimeRecords()),
    {
      files: 1,
      bytes: 81,
      digest: "c38658b6f2c16b3980f1bd8f739a91e873e652e32c74d122fd4c944c129c3f1d"
    },
    "The shared runtime mapping must retain its exact separate identity"
  );

  const baselineByOutput = new Map(compatibilityRecords.map((record) => [record.output, record]));
  const currentByOutput = new Map(records.map((record) => [record.output, record]));
  const removedOutputs = [...baselineByOutput.keys()]
    .filter((output) => !currentByOutput.has(output))
    .sort(compareText);
  const addedOutputs = [...currentByOutput.keys()]
    .filter((output) => !baselineByOutput.has(output))
    .sort(compareText);
  assert.deepEqual(
    removedOutputs,
    retiredModuleOutputPairs.map(({ retired }) => retired).sort(compareText),
    "Exactly the 15 named compatibility outputs must disappear"
  );
  assert.deepEqual(
    addedOutputs,
    ["shared/backend-origin.js"],
    "The separate shared origin module must be the sole new output path"
  );

  const commonOutputs = [...currentByOutput.keys()]
    .filter((output) => baselineByOutput.has(output))
    .sort(compareText);
  assert.equal(
    commonOutputs.length,
    257,
    "All historical phase-B application paths must remain in the current graph"
  );
  for (const output of commonOutputs) {
    const baseline = baselineByOutput.get(output);
    const current = currentByOutput.get(output);
    assert.equal(current.source, baseline.source, `${output}:source path`);
    assert.ok(
      fs.readFileSync(localPath(current.source)).equals(
        fs.readFileSync(localPath(baseline.source))
      ),
      `${output}:source bytes`
    );
  }
});

test("[ARTIFACT-02] manifest exposes seven entries and zero explicit platform downloads", () => {
  const records = platformRecords();
  const completeRecords = deploymentRecords();
  const publicEntryCount = manifest.applications.reduce(
    (count, application) => count + application.publicEntries.length,
    0
  );
  const publicDownloadCount = manifest.applications.reduce(
    (count, application) => count + application.publicDownloads.length,
    0
  );
  assert.equal(platformApplication.publicEntries.length, 7);
  assert.deepEqual(platformApplication.publicDownloads, []);
  assert.equal(
    records.length - platformApplication.publicEntries.length,
    175,
    "The platform must contain exactly 175 implicit support files"
  );
  assert.equal(
    records.filter(({ output }) => output.startsWith("plataforma/estudo/files/")).length,
    33,
    "All 33 study downloads must remain implicit rather than publicDownloads entries"
  );
  assert.equal(publicEntryCount, 12);
  assert.equal(publicDownloadCount, 3);
  assert.equal(
    completeRecords.length - publicEntryCount - publicDownloadCount,
    243,
    "The complete lean signed-handle artifact must contain 243 support files"
  );
});

test("[SAFETY-REDACTION] source-derived media and backend literals remain absent from tests, support sources, and docs", () => {
  const sensitive = sourceDerivedSensitiveLiterals();
  const learningTestPaths = fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith("learning-platform") &&
        entry.name.endsWith(".test.js")
    )
    .map((entry) => path.join(__dirname, entry.name));
  const helperPaths = regularFilesRecursively(path.join(__dirname, "helpers"));
  const fixturePaths = regularFilesRecursively(path.join(__dirname, "fixtures"));
  const auditablePaths = [...learningTestPaths, ...helperPaths, ...fixturePaths];
  const auditableSource = [
    ...auditablePaths.map((sourcePath) => fs.readFileSync(sourcePath, "utf8")),
    contractSource
  ].join("\n");

  assert.deepEqual(
    {
      fixtureSources: fixturePaths.length,
      helperSources: helperPaths.length,
      learningTests: learningTestPaths.length,
      supportSourcesCovered: helperPaths.length + fixturePaths.length > 0
    },
    {
      fixtureSources: fixturePaths.length,
      helperSources: helperPaths.length,
      learningTests: learningTestPaths.length,
      supportSourcesCovered: true
    },
    "The redaction audit must cover every learning-platform test and recursive support source"
  );

  const leakCounts = {
    backendRole: Number(auditableSource.includes(sensitive.backendBase)),
    bypassEntries: sensitive.participantNames.filter((value) => auditableSource.includes(value)).length,
    playReadyRole: Number(auditableSource.includes(sensitive.playReadyUrl))
  };
  assert.deepEqual(
    leakCounts,
    { backendRole: 0, bypassEntries: 0, playReadyRole: 0 },
    "Source-derived sensitive categories must remain absent from auditable baseline text"
  );

  for (const value of [sensitive.backendBase, sensitive.playReadyUrl]) {
    const parsed = inspectUrlRole(value);
    assert.ok(
      parsed.valid && parsed.protocol === "https:" && parsed.hostnamePresent,
      "Sensitive network roles must be structurally validated without snapshotting them"
    );
  }
});
