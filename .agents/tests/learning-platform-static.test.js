"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.join(__dirname, "..", "..");
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

const platformApplication = manifest.applications.find(
  (application) => application.id === "learning-platform"
);
const platformEntries = [
  { sourceDirectory: "device-warning", publicSuffix: "aviso-dispositivo" },
  { sourceDirectory: "browser-warning", publicSuffix: "aviso-navegador" },
  { sourceDirectory: "initial-notices", publicSuffix: "avisos-iniciais" },
  { sourceDirectory: "photo-registration", publicSuffix: "cadastro" },
  { sourceDirectory: "course-content", publicSuffix: "estudo" },
  { sourceDirectory: "login", publicSuffix: "login" },
  { sourceDirectory: "status-report", publicSuffix: "statusreport" }
];
const entrySourcePaths = platformEntries.map(
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
    relativePath.startsWith("modules/study/")
  )
];
const studySource = studySourcePaths
  .map((relativePath) =>
    fs.readFileSync(path.join(platformRoot, ...relativePath.split("/")), "utf8")
  )
  .join("\n");
const retiredPlatformPaths = [
  "/plataforma_v2/",
  ...platformEntries.map(
    ({ publicSuffix }) => `/plataforma_v2/${publicSuffix}/`
  )
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

function mappedFiles(applications = manifest.applications) {
  const records = [];

  for (const application of applications) {
    for (const mapping of application.mappings) {
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
  }

  return records.sort((left, right) => compareText(left.output, right.output));
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

function sourceForOutput(records, output) {
  const record = records.find((candidate) => candidate.output === output);
  assert.ok(record, `Mapped output must resolve to a tracked source: ${output}`);
  return record.source;
}

function htmlDataNodes() {
  return Array.from(
    studyHtml.matchAll(/<div\b([^>]*\bdata-index="(\d+)"[^>]*)>/g),
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

  const loginSource = pageSources.find(
    ({ relativePath }) => relativePath === "login/main.js"
  ).source;
  const backendBase = loginSource.match(
    /sessionStorage\.setItem\('URL_Base_Backend',\s*'([^']+)'\)/
  );
  assert.ok(backendBase, "The backend role must remain statically discoverable");

  return {
    backendBase: backendBase[1],
    participantNames,
    playReadyUrl: playReady[1]
  };
}

test("[ROUTE-01] manifest retains exactly seven canonical learning-platform entries", () => {
  assert.ok(platformApplication, "The learning-platform manifest entry must exist");
  assert.deepEqual(platformApplication.mappings, [
    {
      source: "apps/learning-platform/device-warning",
      output: "plataforma/aviso-dispositivo"
    },
    {
      source: "apps/learning-platform/browser-warning",
      output: "plataforma/aviso-navegador"
    },
    {
      source: "apps/learning-platform/initial-notices",
      output: "plataforma/avisos-iniciais"
    },
    {
      source: "apps/learning-platform/photo-registration",
      output: "plataforma/cadastro"
    },
    {
      source: "apps/learning-platform/course-content",
      output: "plataforma/estudo"
    },
    {
      source: "apps/learning-platform/login",
      output: "plataforma/login"
    },
    {
      source: "apps/learning-platform/status-report",
      output: "plataforma/statusreport"
    },
    {
      source: "apps/learning-platform/modules",
      output: "plataforma/modules"
    },
    {
      source: "apps/learning-platform/azure-ai-vision-face-ui",
      output: "plataforma/azure-ai-vision-face-ui"
    }
  ]);
  assert.deepEqual(platformApplication.publicEntries, [
    {
      path: "/plataforma/aviso-dispositivo/",
      file: "plataforma/aviso-dispositivo/index.html"
    },
    {
      path: "/plataforma/aviso-navegador/",
      file: "plataforma/aviso-navegador/index.html"
    },
    {
      path: "/plataforma/avisos-iniciais/",
      file: "plataforma/avisos-iniciais/index.html"
    },
    {
      path: "/plataforma/cadastro/",
      file: "plataforma/cadastro/index.html"
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
});

test("[ROUTE-02] current root and retired routes remain 404 while source navigation stays slashless", () => {
  assert.ok(
    manifest.notFoundPaths.includes("/plataforma/"),
    "The current platform root must remain an explicit not-found contract"
  );
  assert.deepEqual(
    retiredPlatformPaths.filter((retiredPath) => manifest.notFoundPaths.includes(retiredPath)),
    retiredPlatformPaths,
    "The former root and all seven former canonical entries must remain explicit not-found contracts"
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
    "/plataforma/aviso-dispositivo",
    "/plataforma/aviso-navegador",
    "/plataforma/avisos-iniciais",
    "/plataforma/cadastro",
    "/plataforma/estudo",
    "/plataforma/login"
  ]);
  assert.ok(
    [...destinations].every((destination) => !destination.endsWith("/")),
    "Internal document destinations must remain slashless"
  );
  assert.equal(
    /location\.replace|history\.(?:pushState|replaceState)|\bpopstate\b|hashchange/.test(
      combinedPageSource
    ),
    false,
    "The platform must not gain SPA navigation or route normalization"
  );
  assert.ok(
    /production slashless redirect\/status\/history behavior remains\s+an\s+implementation-time evidence question/.test(
      contractSource
    ),
    "Published slashless-host behavior must remain explicitly unproven"
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
      "#spinnerCheck #circle,\\n#spinnerCheck #tick {\\n    stroke: #4a0816 !important;\\n}"
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
      1,
      "Each production Face entry must retain the vendored registration import"
    );
    assert.equal(
      (entrySource.match(/createFaceStyleSheet:\s*\(\)\s*=>\s*new CSSStyleSheet\(\)/g) ?? []).length,
      1,
      "Each production Face entry must construct the application stylesheet in its browser realm"
    );
  }

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

  assert.deepEqual(treeStats(records), {
    files: 182,
    bytes: 20693391,
    digest: "bc453ef0a25080d654b2fd8a24eba17224b41049ceacb6df6dd23b049875a050"
  });
  assert.deepEqual(
    treeStats(records.map((record) => ({
      ...record,
      output: record.output.slice("plataforma/".length)
    }))),
    {
      files: 182,
      bytes: 20693391,
      digest: "3012efb9be58584876d44e2431b0e19851da71f131daf4e1fa21d4ff0892705a"
    },
    "The prefix-omitted platform-root diagnostic digest must remain exact"
  );
  const nonJavaScriptRecords = records.filter(
    ({ output }) => path.posix.extname(output).toLowerCase() !== ".js"
  );
  assert.deepEqual(
    treeStats(nonJavaScriptRecords),
    {
      files: 146,
      bytes: 20252436,
      digest: "1df6bd6de3e16a58ff8f65500c4aedde241d87237fb4a826c238bdf14b6aa13e"
    },
    "The platform non-JavaScript paths and bytes must remain isolated from the adapter migration"
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
      digest: "8703d7811a1d91db3069b55c0d17b87dbda9cfc754613ac6c44d172d668c4394"
    },
    "The complete platform binary set must remain byte-identical"
  );
  const unrelatedRecords = mappedFiles(
    manifest.applications.filter(({ id }) => id !== "learning-platform")
  );
  assert.deepEqual(
    treeStats(unrelatedRecords),
    {
      files: 75,
      bytes: 6605035,
      digest: "c83305484393d44eecbdab18325f582e87fc253ed50a782985256f90f2f651f2"
    },
    "Unrelated frontend applications must remain byte-identical"
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
    3,
    "Assessment, feedback, and certificate views must retain pause calls"
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

test("[ARTIFACT-01] complete source-derived frontend artifact identity remains exact", () => {
  assert.deepEqual(treeStats(mappedFiles()), {
    files: 257,
    bytes: 27298426,
    digest: "c9323ac5b7a70283d34a94f26478a99eddb3209e79da19d78985a2bc644c200b"
  });
});

test("[ARTIFACT-02] manifest exposes seven entries and zero explicit platform downloads", () => {
  const records = platformRecords();
  assert.equal(platformApplication.publicEntries.length, 7);
  assert.deepEqual(platformApplication.publicDownloads, []);
  assert.equal(
    records.length - platformApplication.publicEntries.length,
    175,
    "The platform must retain 175 implicitly emitted runtime/support files"
  );
  assert.equal(
    records.filter(({ output }) => output.startsWith("plataforma/estudo/files/")).length,
    33,
    "All 33 study downloads must remain implicit rather than publicDownloads entries"
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
