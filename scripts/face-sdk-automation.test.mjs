import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  FACE_SDK_MANIFEST_PATH,
  FACE_SDK_OVERRIDES,
  FACE_SDK_PACKAGE_LAYOUT,
  FACE_SDK_TRANSACTION_PREFIX,
  FACE_SDK_VENDOR_ROOT,
  assertFaceSdkManifest,
  checkFaceSdkVendor,
  repositoryRoot,
  snapshotFaceSdkTree,
  updateFaceSdkVendor
} from "./face-sdk-vendor-lib.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const updateCli = join(scriptDirectory, "update-face-sdk-vendor.mjs");
const deploymentWorkflowPath = resolve(
  repositoryRoot,
  ".github/workflows/azure-static-web-apps-red-cliff-0b4173b0f.yml"
);
const validationWorkflowPath = resolve(
  repositoryRoot,
  ".github/workflows/face-sdk-validation.yml"
);
const generatedBranchPrefix = "chore/update-face-liveness-sdk-";

async function copyRepositoryFile(sourceRepository, destinationRepository, relativePath) {
  const source = resolve(sourceRepository, ...relativePath.split("/"));
  const destination = resolve(destinationRepository, ...relativePath.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function createFixture(context) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "face-sdk-automation-"));
  context.after(() => rm(fixtureRoot, { force: true, recursive: true }));
  const fixtureRepository = join(fixtureRoot, "sistemas");
  const packageRoot = join(fixtureRoot, "installed");
  await mkdir(fixtureRepository);
  await mkdir(packageRoot);

  for (const relativePath of [
    FACE_SDK_MANIFEST_PATH,
    "apps/learning-platform/login/index.html",
    "apps/learning-platform/login/main.js",
    FACE_SDK_OVERRIDES.brightnessSource,
    "apps/learning-platform/photo-registration/index.html",
    "apps/learning-platform/photo-registration/main.js"
  ]) {
    await copyRepositoryFile(repositoryRoot, fixtureRepository, relativePath);
  }

  const sourceVendorRoot = resolve(repositoryRoot, ...FACE_SDK_VENDOR_ROOT.split("/"));
  const fixtureVendorRoot = resolve(fixtureRepository, ...FACE_SDK_VENDOR_ROOT.split("/"));
  await mkdir(dirname(fixtureVendorRoot), { recursive: true });
  await cp(sourceVendorRoot, fixtureVendorRoot, { recursive: true });

  for (const packageDefinition of FACE_SDK_PACKAGE_LAYOUT) {
    const packageDirectory = resolve(
      packageRoot,
      ...packageDefinition.packageRoot.split("/")
    );
    await mkdir(packageDirectory, { recursive: true });
    await writeFile(
      join(packageDirectory, "package.json"),
      `${JSON.stringify({
        name: packageDefinition.name,
        version: "1.5.0",
        private: true
      }, null, 2)}\n`,
      "utf8"
    );
  }

  const componentRoot = resolve(
    packageRoot,
    ...FACE_SDK_PACKAGE_LAYOUT[0].packageRoot.split("/")
  );
  await copyFile(
    join(sourceVendorRoot, "FaceLivenessDetector.js"),
    join(componentRoot, "FaceLivenessDetector.js")
  );

  const assetsPackageRoot = resolve(
    packageRoot,
    ...FACE_SDK_PACKAGE_LAYOUT[1].packageRoot.split("/")
  );
  await cp(
    join(sourceVendorRoot, "facelivenessdetector-assets"),
    join(assetsPackageRoot, "facelivenessdetector-assets"),
    { recursive: true }
  );

  return {
    fixtureRepository,
    fixtureVendorRoot,
    packageRoot
  };
}

async function transactionDirectories(fixtureRepository) {
  return (await readdir(fixtureRepository, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(FACE_SDK_TRANSACTION_PREFIX))
    .map((entry) => entry.name);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function captureRepositoryState(fixture) {
  return {
    manifest: await readFile(
      resolve(fixture.fixtureRepository, FACE_SDK_MANIFEST_PATH),
      "utf8"
    ),
    vendor: await snapshotFaceSdkTree(fixture.fixtureVendorRoot)
  };
}

async function assertRepositoryStateUnchanged(fixture, originalState) {
  assert.equal(
    await readFile(resolve(fixture.fixtureRepository, FACE_SDK_MANIFEST_PATH), "utf8"),
    originalState.manifest
  );
  assert.deepEqual(
    await snapshotFaceSdkTree(fixture.fixtureVendorRoot),
    originalState.vendor
  );
  assert.deepEqual(await transactionDirectories(fixture.fixtureRepository), []);
}

function yamlMappingBlock(source, indentation, key) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const header = `${" ".repeat(indentation)}${key}:`;
  const start = lines.findIndex((line) => line === header);
  assert.notEqual(start, -1, `${key} must use block mapping syntax`);
  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    const leadingSpaces = line.match(/^ */)[0].length;
    if (line.trim() && leadingSpaces <= indentation) break;
    end += 1;
  }
  return lines.slice(start, end).join("\n");
}

function yamlDirectKeys(block, indentation) {
  const matcher = new RegExp(`^ {${indentation}}([A-Za-z0-9_-]+):(?:\\s|$)`);
  return block
    .split("\n")
    .map((line) => line.match(matcher)?.[1])
    .filter(Boolean);
}

test("current Face SDK manifest records every frozen vendored byte", async () => {
  const { manifest, snapshot } = await checkFaceSdkVendor();
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.version, "1.5.0");
  assert.deepEqual(
    manifest.packages.map(({ name, version }) => ({ name, version })),
    [
      { name: "@azure/ai-vision-face-ui", version: "1.5.0" },
      { name: "@azure-ai-vision-face/ui-assets", version: "1.5.0" }
    ]
  );
  assert.equal(manifest.files.length, 85);
  assert.deepEqual(snapshot.files, manifest.files);
  assert.deepEqual(snapshot.tree, {
    algorithm: "sha256",
    framing: "<utf8-path-byte-length>:<path>:<content-byte-length>:<content>",
    files: 85,
    bytes: 9526729,
    digest: "56da181049f18302b00fdbf04851d1433adf819341564a326e652c75145576e3"
  });
});

test("Face SDK manifests reject Windows-invalid and case-colliding paths", async () => {
  const source = await readFile(resolve(repositoryRoot, FACE_SDK_MANIFEST_PATH), "utf8");
  const currentManifest = JSON.parse(source);
  for (const invalidPath of ["CON.json", "trailing-dot.", "invalid:name.svg", "nested/.git/config"]) {
    const manifest = structuredClone(currentManifest);
    manifest.files[0].path = invalidPath;
    assert.throws(
      () => assertFaceSdkManifest(manifest),
      /(?:not portable to Windows|must not contain Git metadata)/,
      invalidPath
    );
  }

  for (const collidingPaths of [
    ["Foo.svg", "foo.svg"],
    ["Folder/first.svg", "folder/second.svg"]
  ]) {
    const manifest = structuredClone(currentManifest);
    manifest.files[0].path = collidingPaths[0];
    manifest.files[1].path = collidingPaths[1];
    assert.throws(
      () => assertFaceSdkManifest(manifest),
      /case-insensitive filesystem/,
      collidingPaths.join(" and ")
    );
  }
});

test("credential-free update canonicalizes text and reapplies local overrides", async (context) => {
  const fixture = await createFixture(context);

  const packageAssets = resolve(
    fixture.packageRoot,
    ...FACE_SDK_PACKAGE_LAYOUT[1].packageRoot.split("/"),
    "facelivenessdetector-assets"
  );
  const packageEnglishDictionaryPath = resolve(packageAssets, "i18n/en.json");
  const packageEnglishDictionary = await readFile(packageEnglishDictionaryPath, "utf8");
  assert.doesNotMatch(packageEnglishDictionary, /\r\n/);
  await writeFile(
    packageEnglishDictionaryPath,
    packageEnglishDictionary.replaceAll("\n", "\r\n"),
    "utf8"
  );
  await writeFile(
    resolve(packageAssets, ...FACE_SDK_OVERRIDES.brightnessDestination.split("/").slice(1)),
    "upstream brightness placeholder\n",
    "utf8"
  );
  const packageDictionaryPath = resolve(
    packageAssets,
    ...FACE_SDK_OVERRIDES.portugueseDictionary.split("/").slice(1)
  );
  const packageDictionarySource = await readFile(packageDictionaryPath, "utf8");
  const dictionaryHasByteOrderMark = packageDictionarySource.startsWith("\uFEFF");
  const dictionary = JSON.parse(packageDictionarySource.replace(/^\uFEFF/, ""));
  for (const key of Object.keys(FACE_SDK_OVERRIDES.strings)) dictionary[key] = "upstream placeholder";
  await writeFile(
    packageDictionaryPath,
    `${dictionaryHasByteOrderMark ? "\uFEFF" : ""}${JSON.stringify(dictionary, null, 2)}\n`,
    "utf8"
  );

  const result = spawnSync(
    process.execPath,
    [
      updateCli,
      "--package-root",
      fixture.packageRoot,
      "--target-version",
      "1.5.0",
      "--repository-root",
      fixture.fixtureRepository
    ],
    { encoding: "utf8", windowsHide: true }
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.deepEqual(JSON.parse(result.stdout), {
    version: "1.5.0",
    files: 85,
    bytes: 9526729,
    sha256: "56da181049f18302b00fdbf04851d1433adf819341564a326e652c75145576e3"
  });
  const { manifest } = await checkFaceSdkVendor({ repository: fixture.fixtureRepository });
  assert.doesNotMatch(
    await readFile(
      resolve(fixture.fixtureVendorRoot, "facelivenessdetector-assets/i18n/en.json"),
      "utf8"
    ),
    /\r\n/,
    "Git-tracked Face SDK text must be canonicalized to LF before hashing"
  );
  const [applicationBrightness, vendoredBrightness] = await Promise.all([
    readFile(resolve(fixture.fixtureRepository, ...manifest.overrides.brightnessSource.split("/"))),
    readFile(resolve(fixture.fixtureVendorRoot, ...manifest.overrides.brightnessDestination.split("/")))
  ]);
  assert.deepEqual(
    vendoredBrightness,
    applicationBrightness,
    "Vendored Brightness.svg must be byte-identical to the login-owned source"
  );
  const vendoredDictionary = JSON.parse(
    (await readFile(
      resolve(
        fixture.fixtureVendorRoot,
        ...manifest.overrides.portugueseDictionary.split("/")
      ),
      "utf8"
    )).replace(/^\uFEFF/, "")
  );
  for (const [key, value] of Object.entries(FACE_SDK_OVERRIDES.strings)) {
    assert.equal(vendoredDictionary[key], value);
  }
  assert.deepEqual(await transactionDirectories(fixture.fixtureRepository), []);
});

test("files retired by the installed package are removed from the vendor tree", async (context) => {
  const fixture = await createFixture(context);
  const retiredRelativePath = "facelivenessdetector-assets/i18n/af-ZA/en.json";
  const installedRetiredPath = resolve(
    fixture.packageRoot,
    ...FACE_SDK_PACKAGE_LAYOUT[1].packageRoot.split("/"),
    retiredRelativePath
  );
  const vendoredRetiredPath = resolve(fixture.fixtureVendorRoot, retiredRelativePath);
  assert.equal(await pathExists(installedRetiredPath), true);
  assert.equal(await pathExists(vendoredRetiredPath), true);
  await rm(installedRetiredPath);

  await updateFaceSdkVendor({
    packageRoot: fixture.packageRoot,
    targetVersion: "1.5.0",
    repository: fixture.fixtureRepository
  });

  assert.equal(await pathExists(vendoredRetiredPath), false);
  await checkFaceSdkVendor({ repository: fixture.fixtureRepository });
  assert.deepEqual(await transactionDirectories(fixture.fixtureRepository), []);
});

test("mid-transaction failure restores the vendor and manifest and removes backups", async (context) => {
  const fixture = await createFixture(context);
  const manifestPath = resolve(fixture.fixtureRepository, FACE_SDK_MANIFEST_PATH);
  const originalManifest = await readFile(manifestPath, "utf8");
  const originalSnapshot = await snapshotFaceSdkTree(fixture.fixtureVendorRoot);
  const packageLoader = resolve(
    fixture.packageRoot,
    ...FACE_SDK_PACKAGE_LAYOUT[0].packageRoot.split("/"),
    "FaceLivenessDetector.js"
  );
  await writeFile(
    packageLoader,
    `${await readFile(packageLoader, "utf8")}\n/* synthetic candidate difference */\n`,
    "utf8"
  );

  await assert.rejects(
    updateFaceSdkVendor({
      packageRoot: fixture.packageRoot,
      targetVersion: "1.5.0",
      repository: fixture.fixtureRepository,
      faultAt: "vendor-installed"
    }),
    /Injected Face SDK update failure at vendor-installed/
  );

  assert.equal(await readFile(manifestPath, "utf8"), originalManifest);
  assert.deepEqual(await snapshotFaceSdkTree(fixture.fixtureVendorRoot), originalSnapshot);
  await checkFaceSdkVendor({ repository: fixture.fixtureRepository });
  assert.deepEqual(await transactionDirectories(fixture.fixtureRepository), []);
});

test("package validation failure leaves the repository untouched and cleans staging", async (context) => {
  const fixture = await createFixture(context);
  const manifestPath = resolve(fixture.fixtureRepository, FACE_SDK_MANIFEST_PATH);
  const originalManifest = await readFile(manifestPath, "utf8");
  const originalSnapshot = await snapshotFaceSdkTree(fixture.fixtureVendorRoot);
  const componentPackageJson = resolve(
    fixture.packageRoot,
    ...FACE_SDK_PACKAGE_LAYOUT[0].packageRoot.split("/"),
    "package.json"
  );
  await writeFile(
    componentPackageJson,
    `${JSON.stringify({ name: "unexpected-package", version: "1.5.0" }, null, 2)}\n`,
    "utf8"
  );

  await assert.rejects(
    updateFaceSdkVendor({
      packageRoot: fixture.packageRoot,
      targetVersion: "1.5.0",
      repository: fixture.fixtureRepository
    }),
    /Installed package identity/
  );
  assert.equal(await readFile(manifestPath, "utf8"), originalManifest);
  assert.deepEqual(await snapshotFaceSdkTree(fixture.fixtureVendorRoot), originalSnapshot);
  assert.deepEqual(await transactionDirectories(fixture.fixtureRepository), []);
});

test("pre-existing vendor drift is rejected without losing local bytes", async (context) => {
  const fixture = await createFixture(context);
  const loaderPath = join(fixture.fixtureVendorRoot, "FaceLivenessDetector.js");
  await writeFile(
    loaderPath,
    `${await readFile(loaderPath, "utf8")}\n/* uncommitted local sentinel */\n`,
    "utf8"
  );
  const driftedState = await captureRepositoryState(fixture);

  await assert.rejects(
    updateFaceSdkVendor({
      packageRoot: fixture.packageRoot,
      targetVersion: "1.5.0",
      repository: fixture.fixtureRepository
    }),
    /Vendored Face SDK files does not match/
  );
  await assertRepositoryStateUnchanged(fixture, driftedState);
});

test("all package-layout failures preserve the repository and clean transactions", async (context) => {
  const cases = [
    {
      name: "missing loader",
      expected: /ENOENT/,
      mutate: async (fixture) => {
        await rm(resolve(
          fixture.packageRoot,
          ...FACE_SDK_PACKAGE_LAYOUT[0].packageRoot.split("/"),
          "FaceLivenessDetector.js"
        ));
      }
    },
    {
      name: "mismatched package version",
      expected: /must match target version 1\.5\.0/,
      mutate: async (fixture) => {
        const packageJsonPath = resolve(
          fixture.packageRoot,
          ...FACE_SDK_PACKAGE_LAYOUT[1].packageRoot.split("/"),
          "package.json"
        );
        await writeFile(
          packageJsonPath,
          `${JSON.stringify({
            name: FACE_SDK_PACKAGE_LAYOUT[1].name,
            version: "1.5.1"
          }, null, 2)}\n`,
          "utf8"
        );
      }
    },
    {
      name: "missing required engine asset",
      expected: /Face SDK manifest is missing .*AzureAIVisionFace_SIMD\.wasm/,
      mutate: async (fixture) => {
        await rm(resolve(
          fixture.packageRoot,
          ...FACE_SDK_PACKAGE_LAYOUT[1].packageRoot.split("/"),
          "facelivenessdetector-assets/js/AzureAIVisionFace_SIMD.wasm"
        ));
      }
    },
    {
      name: "missing Portuguese dictionary",
      expected: /ENOENT/,
      mutate: async (fixture) => {
        await rm(resolve(
          fixture.packageRoot,
          ...FACE_SDK_PACKAGE_LAYOUT[1].packageRoot.split("/"),
          FACE_SDK_OVERRIDES.portugueseDictionary
        ));
      }
    },
    {
      name: "package-tree junction",
      expected: /must not contain symbolic links/,
      mutate: async (fixture) => {
        const junctionTarget = join(dirname(fixture.packageRoot), "junction-target");
        await mkdir(junctionTarget);
        await symlink(
          junctionTarget,
          resolve(
            fixture.packageRoot,
            ...FACE_SDK_PACKAGE_LAYOUT[0].packageRoot.split("/"),
            "unexpected-junction"
          ),
          "junction"
        );
      }
    }
  ];

  for (const failureCase of cases) {
    await context.test(failureCase.name, async (subtest) => {
      const fixture = await createFixture(subtest);
      const originalState = await captureRepositoryState(fixture);
      await failureCase.mutate(fixture);
      await assert.rejects(
        updateFaceSdkVendor({
          packageRoot: fixture.packageRoot,
          targetVersion: "1.5.0",
          repository: fixture.fixtureRepository
        }),
        failureCase.expected
      );
      await assertRepositoryStateUnchanged(fixture, originalState);
    });
  }
});

test("Sistemas Face SDK tooling contains no registry, network, or environment credential seam", async () => {
  const manifestSource = await readFile(resolve(repositoryRoot, FACE_SDK_MANIFEST_PATH), "utf8");
  assert.doesNotMatch(
    manifestSource,
    /(?:token|secret|password|credential|registry|_auth)/i
  );

  for (const file of [
    "face-sdk-vendor-lib.mjs",
    "check-face-sdk-vendor.mjs",
    "update-face-sdk-vendor.mjs"
  ]) {
    const source = await readFile(join(scriptDirectory, file), "utf8");
    assert.doesNotMatch(source, /process\.env|node:child_process|https?:\/\/|\.npmrc|\bnpm(?:\.cmd)?\b/);
  }
});

test("Face SDK pull-request validation is secret-free and Azure deployment fails closed", async () => {
  const [validationWorkflow, deploymentWorkflow] = await Promise.all([
    readFile(validationWorkflowPath, "utf8"),
    readFile(deploymentWorkflowPath, "utf8")
  ]);
  const eventBlock = yamlMappingBlock(validationWorkflow, 0, "on");
  const jobsBlock = yamlMappingBlock(validationWorkflow, 0, "jobs");
  const validationJob = yamlMappingBlock(validationWorkflow, 2, "validate");
  assert.deepEqual(yamlDirectKeys(eventBlock, 2), ["pull_request"]);
  assert.deepEqual(yamlDirectKeys(jobsBlock, 2), ["validate"]);
  assert.match(validationWorkflow, /^permissions:\r?\n  contents: read\r?\n\r?\njobs:/m);
  assert.match(
    validationJob,
    new RegExp(
      `^\\s*if: github\\.event\\.pull_request\\.head\\.repo\\.full_name == github\\.repository && startsWith\\(github\\.event\\.pull_request\\.head\\.ref, '${generatedBranchPrefix}'\\)$`,
      "m"
    )
  );
  assert.ok(
    validationJob.split("\n").some((line) => line.trim() === "persist-credentials: false")
  );

  const actions = Array.from(
    validationJob.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)$/gm),
    ([, action]) => action
  );
  assert.deepEqual(
    actions.map((action) => action.slice(0, action.lastIndexOf("@"))),
    ["actions/checkout"]
  );
  assert.match(actions[0], /^actions\/checkout@(?:v\d+(?:\.\d+\.\d+)?|[0-9a-f]{40})$/);

  for (const command of [
    "node scripts/check-face-sdk-vendor.mjs",
    "node --test scripts/face-sdk-automation.test.mjs",
    "node --test .agents/tests/*.test.js",
    "node --test scripts/frontend-deployment.test.mjs",
    "node scripts/build-frontend.mjs",
    "node scripts/check-frontend.mjs",
    "git diff --check"
  ]) {
    assert.ok(
      validationJob.split("\n").some((line) => line.trim() === `run: ${command}`),
      `${command} must run for Face SDK proposals`
    );
  }

  for (const forbidden of [
    /\bsecrets\b/i,
    /\bwrite-all\b/i,
    /\bAzure\//i,
    /actions\/upload-artifact@/i,
    /scripts\/check-deployment\.mjs/,
    /^\s*environment:/m,
    /^\s*id-token:/m,
    /^\s*uses:\s*\.\/\.github\/workflows\//m,
    /^\s*action:\s*["']?(?:upload|close)["']?\s*$/m,
    /\bpull_request_target\b/,
    /\bworkflow_dispatch\b/,
    /\bschedule\b/,
    /\bnpm\b/,
    /\b(?:curl|wget)\b/,
    /\b(?:gh|git)\s+pr\s+merge\b/i,
    /\bauto-merge\b/i
  ]) {
    assert.doesNotMatch(validationWorkflow, forbidden);
  }

  assert.match(deploymentWorkflow, /^permissions:\r?\n  contents: read\r?\n\r?\njobs:/m);
  const buildJob = yamlMappingBlock(deploymentWorkflow, 2, "build_and_deploy_job");
  const closeJob = yamlMappingBlock(deploymentWorkflow, 2, "close_pull_request_job");
  const guardPattern = new RegExp(
    `!startsWith\\(github\\.event\\.pull_request\\.head\\.ref, '${generatedBranchPrefix}'\\)`
  );
  assert.match(buildJob, guardPattern);
  assert.match(closeJob, guardPattern);
  assert.match(buildJob, /^\s*permissions:\r?\n\s+contents: read\r?\n\s+pull-requests: write$/m);
  assert.ok(
    buildJob.split("\n").some(
      (line) => line.trim() === "run: node scripts/check-face-sdk-vendor.mjs"
    ),
    "the ordinary frontend build must validate the vendored Face SDK"
  );
  assert.ok(
    buildJob.indexOf("run: node scripts/check-face-sdk-vendor.mjs")
      < buildJob.indexOf("run: node scripts/build-frontend.mjs"),
    "the vendored Face SDK must be validated before the frontend artifact is built"
  );

  const setupOnlyPaths = [
    ".github/workflows/azure-static-web-apps-red-cliff-0b4173b0f.yml",
    ".github/workflows/face-sdk-validation.yml",
    "scripts/check-face-sdk-vendor.mjs",
    "scripts/face-sdk-automation.test.mjs",
    "scripts/face-sdk-vendor-lib.mjs",
    "scripts/face-sdk-vendor.json",
    "scripts/frontend-deployment.test.mjs",
    "scripts/update-face-sdk-vendor.mjs"
  ];
  for (const path of setupOnlyPaths) {
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.equal(
      (deploymentWorkflow.match(new RegExp(`^\\s+- '${escaped}'$`, "gm")) ?? []).length,
      2,
      `${path} must be ignored for both push and pull_request deployment triggers`
    );
  }
  assert.doesNotMatch(
    deploymentWorkflow,
    /paths-ignore:[\s\S]*apps\/learning-platform\/azure-ai-vision-face-ui/
  );
});
