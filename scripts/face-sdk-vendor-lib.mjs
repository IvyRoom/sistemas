import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const FACE_SDK_SCHEMA_VERSION = 1;
export const FACE_SDK_VENDOR_ROOT = "apps/learning-platform/azure-ai-vision-face-ui";
export const FACE_SDK_MANIFEST_PATH = "scripts/face-sdk-vendor.json";
export const FACE_SDK_TRANSACTION_PREFIX = ".face-sdk-transaction-";
export const FACE_SDK_TREE_FRAMING =
  "<utf8-path-byte-length>:<path>:<content-byte-length>:<content>";

export const FACE_SDK_PACKAGE_LAYOUT = Object.freeze([
  Object.freeze({
    role: "component",
    name: "@azure/ai-vision-face-ui",
    packageRoot: "node_modules/@azure/ai-vision-face-ui",
    copies: Object.freeze([
      Object.freeze({
        source: "FaceLivenessDetector.js",
        destination: "FaceLivenessDetector.js"
      })
    ])
  }),
  Object.freeze({
    role: "assets",
    name: "@azure-ai-vision-face/ui-assets",
    packageRoot: "node_modules/@azure-ai-vision-face/ui-assets",
    copies: Object.freeze([
      Object.freeze({
        source: "facelivenessdetector-assets",
        destination: "facelivenessdetector-assets"
      })
    ])
  })
]);

export const FACE_SDK_OVERRIDES = Object.freeze({
  brightnessSource: "apps/learning-platform/login/img/Brightness.svg",
  brightnessDestination:
    "facelivenessdetector-assets/images/Brightness.svg",
  portugueseDictionary:
    "facelivenessdetector-assets/i18n/pt-BR/en.json",
  strings: Object.freeze({
    AZAIF_IncreaseBrightness:
      "Coloque o brilho da tela no máximo e afaste-se de janelas muito iluminadas.",
    AZAIF_IncreaseBrightnessHighestSetting:
      "A tela piscará algumas vezes para processar o FaceID.",
    AZAIF_IncreaseBrightnessTurnedUp:
      "Coloquei o brilho no máximo e me afastei de janelas muito iluminadas."
  })
});

const REQUIRED_VENDOR_FILES = Object.freeze([
  "FaceLivenessDetector.js",
  "facelivenessdetector-assets/i18n/en.json",
  FACE_SDK_OVERRIDES.portugueseDictionary,
  FACE_SDK_OVERRIDES.brightnessDestination,
  "facelivenessdetector-assets/images/FaceId.svg",
  "facelivenessdetector-assets/images/Smile.svg",
  "facelivenessdetector-assets/images/activeMotionVisualHint.png",
  "facelivenessdetector-assets/images/logo.svg",
  "facelivenessdetector-assets/js/AzureAIVisionFace.js",
  "facelivenessdetector-assets/js/AzureAIVisionFace.wasm",
  "facelivenessdetector-assets/js/AzureAIVisionFace_SIMD.js",
  "facelivenessdetector-assets/js/AzureAIVisionFace_SIMD.wasm"
]);

const FACE_ENTRY_PATHS = Object.freeze([
  "apps/learning-platform/login",
  "apps/learning-platform/photo-registration"
]);

const GIT_BINARY_EXTENSIONS = new Set([
  ".gif", ".ico", ".jpeg", ".jpg", ".pdf", ".png", ".webp",
  ".xls", ".xlsm", ".xlsx", ".vsd", ".vsdx", ".vssx",
  ".wasm", ".woff", ".woff2"
]);
const GIT_TEXT_EXTENSIONS = new Set([
  ".css", ".html", ".js", ".json", ".md", ".mjs", ".svg", ".yml", ".yaml"
]);
const WINDOWS_RESERVED_SEGMENT = /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\..*)?$/i;

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = resolve(moduleDirectory, "..");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizedRelativePath(value, label, portablePathIdentities = null) {
  invariant(typeof value === "string" && value.length > 0, `${label} must be a non-empty string`);
  invariant(!value.includes("\\"), `${label} must use forward slashes`);
  invariant(!value.includes("\0"), `${label} contains a null byte`);
  invariant(!value.startsWith("/"), `${label} must be relative`);
  const segments = value.split("/");
  invariant(
    segments.every((segment) => segment && segment !== "." && segment !== ".."),
    `${label} is not a normalized relative path`
  );
  let prefix = "";
  for (const segment of segments) {
    invariant(segment.length <= 255, `${label} contains an overlong path segment`);
    invariant(segment.toLowerCase() !== ".git", `${label} must not contain Git metadata`);
    invariant(!/[<>:"|?*\u0000-\u001F]/.test(segment), `${label} is not portable to Windows`);
    invariant(!/[. ]$/.test(segment), `${label} is not portable to Windows`);
    invariant(!WINDOWS_RESERVED_SEGMENT.test(segment), `${label} is not portable to Windows`);
    prefix = prefix ? `${prefix}/${segment}` : segment;
    if (portablePathIdentities) {
      const foldedPrefix = prefix.toLowerCase();
      const existingPrefix = portablePathIdentities.get(foldedPrefix);
      invariant(
        existingPrefix === undefined || existingPrefix === prefix,
        `${label} collides with ${existingPrefix} on a case-insensitive filesystem`
      );
      portablePathIdentities.set(foldedPrefix, prefix);
    }
  }
  return value;
}

function resolveInside(root, relativePath, label) {
  normalizedRelativePath(relativePath, label);
  const absoluteRoot = resolve(root);
  const absolutePath = resolve(absoluteRoot, ...relativePath.split("/"));
  invariant(
    absolutePath.startsWith(`${absoluteRoot}${sep}`),
    `${label} escapes its expected root`
  );
  return absolutePath;
}

async function requireDirectory(path, label) {
  const stats = await lstat(path);
  invariant(!stats.isSymbolicLink(), `${label} must not be a symbolic link`);
  invariant(stats.isDirectory(), `${label} must be a directory`);
}

async function requireRegularFile(path, label) {
  const stats = await lstat(path);
  invariant(!stats.isSymbolicLink(), `${label} must not be a symbolic link`);
  invariant(stats.isFile(), `${label} must be a regular file`);
  return stats;
}

async function copyRegularTree(sourceRoot, destinationRoot) {
  await requireDirectory(sourceRoot, "Package source directory");
  await mkdir(destinationRoot, { recursive: true });

  const entries = await readdir(sourceRoot, { withFileTypes: true });
  entries.sort((left, right) => compareText(left.name, right.name));
  for (const entry of entries) {
    const source = join(sourceRoot, entry.name);
    const destination = join(destinationRoot, entry.name);
    const stats = await lstat(source);
    invariant(!stats.isSymbolicLink(), `Package source must not contain a symbolic link: ${entry.name}`);
    if (stats.isDirectory()) {
      await copyRegularTree(source, destination);
    } else {
      invariant(stats.isFile(), `Package source must contain only regular files: ${entry.name}`);
      await copyFile(source, destination);
    }
  }
}

async function assertTreeHasNoSymlinks(root, label) {
  await requireDirectory(root, label);
  const entries = await readdir(root, { withFileTypes: true });
  entries.sort((left, right) => compareText(left.name, right.name));
  for (const entry of entries) {
    const entryPath = join(root, entry.name);
    const stats = await lstat(entryPath);
    invariant(!stats.isSymbolicLink(), `${label} must not contain symbolic links`);
    if (stats.isDirectory()) {
      await assertTreeHasNoSymlinks(entryPath, label);
    } else {
      invariant(stats.isFile(), `${label} must contain only regular files`);
    }
  }
}

export async function listRegularTreeFiles(root) {
  await requireDirectory(root, "Face SDK tree");
  const files = [];
  const portablePathIdentities = new Map();

  async function visit(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      normalizedRelativePath(relativePath, "Face SDK path", portablePathIdentities);
      const stats = await lstat(absolutePath);
      invariant(!stats.isSymbolicLink(), `Face SDK tree contains a symbolic link: ${relativePath}`);
      if (stats.isDirectory()) {
        await visit(absolutePath, relativePath);
      } else {
        invariant(stats.isFile(), `Face SDK tree contains a non-file entry: ${relativePath}`);
        files.push(relativePath);
      }
    }
  }

  await visit(root);
  return files.sort(compareText);
}

function shouldNormalizeLineEndings(relativePath, contents) {
  const fileName = relativePath.slice(relativePath.lastIndexOf("/") + 1);
  const extensionIndex = fileName.lastIndexOf(".");
  const extension = extensionIndex === -1 ? "" : fileName.slice(extensionIndex).toLowerCase();
  if (GIT_BINARY_EXTENSIONS.has(extension)) return false;
  if (GIT_TEXT_EXTENSIONS.has(extension)) return true;
  return !contents.subarray(0, Math.min(contents.length, 8000)).includes(0);
}

function normalizeCrLf(contents) {
  let carriageReturns = 0;
  for (let index = 0; index < contents.length; index += 1) {
    if (contents[index] === 0x0d && contents[index + 1] === 0x0a) carriageReturns += 1;
  }
  if (carriageReturns === 0) return contents;
  const normalized = Buffer.allocUnsafe(contents.length - carriageReturns);
  let destinationIndex = 0;
  for (let sourceIndex = 0; sourceIndex < contents.length; sourceIndex += 1) {
    if (contents[sourceIndex] === 0x0d && contents[sourceIndex + 1] === 0x0a) continue;
    normalized[destinationIndex] = contents[sourceIndex];
    destinationIndex += 1;
  }
  return normalized;
}

async function normalizeCandidateLineEndings(candidateRoot) {
  for (const relativePath of await listRegularTreeFiles(candidateRoot)) {
    const absolutePath = resolveInside(candidateRoot, relativePath, "Face SDK candidate file");
    const contents = await readFile(absolutePath);
    if (!shouldNormalizeLineEndings(relativePath, contents)) continue;
    const normalized = normalizeCrLf(contents);
    if (!normalized.equals(contents)) await writeFile(absolutePath, normalized);
  }
}

export async function snapshotFaceSdkTree(root) {
  const paths = await listRegularTreeFiles(root);
  const hash = createHash("sha256");
  const files = [];
  let bytes = 0;

  for (const path of paths) {
    const contents = await readFile(resolveInside(root, path, "Face SDK file"));
    const pathBytes = Buffer.from(path, "utf8");
    const sha256 = createHash("sha256").update(contents).digest("hex");
    hash.update(Buffer.from(`${pathBytes.length}:`, "utf8"));
    hash.update(pathBytes);
    hash.update(Buffer.from(`:${contents.length}:`, "utf8"));
    hash.update(contents);
    bytes += contents.length;
    files.push({ path, bytes: contents.length, sha256 });
  }

  return {
    files,
    tree: {
      algorithm: "sha256",
      framing: FACE_SDK_TREE_FRAMING,
      files: files.length,
      bytes,
      digest: hash.digest("hex")
    }
  };
}

function assertExactSerializable(actual, expected, label) {
  invariant(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} does not match the supported Face SDK layout`
  );
}

function assertSafeVersion(version, label) {
  invariant(
    typeof version === "string"
      && /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(version),
    `${label} must be an exact package version`
  );
}

export function assertFaceSdkManifest(manifest) {
  invariant(isPlainObject(manifest), "Face SDK manifest must be an object");
  invariant(
    manifest.schemaVersion === FACE_SDK_SCHEMA_VERSION,
    `Face SDK manifest schemaVersion must be ${FACE_SDK_SCHEMA_VERSION}`
  );
  invariant(manifest.vendorRoot === FACE_SDK_VENDOR_ROOT, "Face SDK manifest vendorRoot is invalid");
  assertSafeVersion(manifest.version, "Face SDK manifest version");
  invariant(Array.isArray(manifest.packages), "Face SDK manifest packages must be an array");
  invariant(
    manifest.packages.length === FACE_SDK_PACKAGE_LAYOUT.length,
    "Face SDK manifest must describe exactly two packages"
  );

  for (let index = 0; index < FACE_SDK_PACKAGE_LAYOUT.length; index += 1) {
    const actual = manifest.packages[index];
    const expected = FACE_SDK_PACKAGE_LAYOUT[index];
    invariant(isPlainObject(actual), `Face SDK package ${index} must be an object`);
    assertExactSerializable(
      {
        role: actual.role,
        name: actual.name,
        packageRoot: actual.packageRoot,
        copies: actual.copies
      },
      expected,
      `Face SDK package ${index}`
    );
    invariant(actual.version === manifest.version, `Face SDK package ${actual.name} version must match the manifest`);
  }

  assertExactSerializable(manifest.overrides, FACE_SDK_OVERRIDES, "Face SDK overrides");
  invariant(Array.isArray(manifest.files) && manifest.files.length > 0, "Face SDK manifest files must be populated");
  const manifestPaths = new Set();
  const portablePathIdentities = new Map();
  let previousPath = null;
  for (const [index, file] of manifest.files.entries()) {
    invariant(isPlainObject(file), `Face SDK file ${index} must be an object`);
    normalizedRelativePath(
      file.path,
      `Face SDK file ${index}.path`,
      portablePathIdentities
    );
    invariant(previousPath === null || compareText(previousPath, file.path) < 0, "Face SDK manifest files must be uniquely sorted");
    invariant(Number.isSafeInteger(file.bytes) && file.bytes >= 0, `Face SDK file ${file.path} has invalid bytes`);
    invariant(/^[0-9a-f]{64}$/.test(file.sha256), `Face SDK file ${file.path} has invalid SHA-256`);
    previousPath = file.path;
    manifestPaths.add(file.path);
  }

  for (const requiredPath of REQUIRED_VENDOR_FILES) {
    invariant(manifestPaths.has(requiredPath), `Face SDK manifest is missing ${requiredPath}`);
  }
  invariant(isPlainObject(manifest.tree), "Face SDK manifest tree must be an object");
  invariant(manifest.tree.algorithm === "sha256", "Face SDK tree algorithm must be sha256");
  invariant(manifest.tree.framing === FACE_SDK_TREE_FRAMING, "Face SDK tree framing is invalid");
  invariant(manifest.tree.files === manifest.files.length, "Face SDK tree file count is inconsistent");
  invariant(Number.isSafeInteger(manifest.tree.bytes) && manifest.tree.bytes >= 0, "Face SDK tree bytes are invalid");
  invariant(/^[0-9a-f]{64}$/.test(manifest.tree.digest), "Face SDK tree digest is invalid");

  const serialized = JSON.stringify(manifest);
  invariant(
    !/(?:token|secret|password|credential|registry|_auth)/i.test(serialized),
    "Face SDK manifest must not contain credential or registry configuration"
  );
  return manifest;
}

export async function readFaceSdkManifest(manifestPath) {
  await requireRegularFile(manifestPath, "Face SDK manifest");
  const source = await readFile(manifestPath, "utf8");
  let manifest;
  try {
    manifest = JSON.parse(source);
  } catch {
    throw new Error("Face SDK manifest must contain valid JSON");
  }
  return assertFaceSdkManifest(manifest);
}

function embeddedClientVersions(source) {
  return [...source.matchAll(/clientSDKversion\s*:\s*["']([^"']+)["']/g)]
    .map((match) => match[1]);
}

async function assertBrowserContracts(root) {
  const expectedBase = "/plataforma/azure-ai-vision-face-ui/";
  const lazyImport = "../azure-ai-vision-face-ui/FaceLivenessDetector.js";
  for (const entryPath of FACE_ENTRY_PATHS) {
    const entryRoot = resolveInside(root, entryPath, "Face entry");
    const [html, javaScript] = await Promise.all([
      readFile(join(entryRoot, "index.html"), "utf8"),
      readFile(join(entryRoot, "main.js"), "utf8")
    ]);
    invariant(
      new RegExp(`<base\\s+href=["']${expectedBase.replaceAll("/", "\\/")}["']\\s*\\/?>`, "i").test(html),
      `${entryPath} must retain the Face SDK base path`
    );
    const escapedImport = lazyImport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    invariant(
      (javaScript.match(new RegExp(`import\\s*\\(\\s*["']${escapedImport}["']\\s*\\)`, "g")) ?? []).length === 1,
      `${entryPath} must retain one literal lazy Face SDK import`
    );
    invariant(
      (javaScript.match(new RegExp(`["']${escapedImport}["']`, "g")) ?? []).length === 1,
      `${entryPath} must reference the Face SDK loader only through its lazy import`
    );
  }
}

export async function verifyFaceSdkTree({
  repository = repositoryRoot,
  vendorRoot,
  manifest,
  checkBrowserContracts = true
}) {
  assertFaceSdkManifest(manifest);
  const snapshot = await snapshotFaceSdkTree(vendorRoot);
  assertExactSerializable(snapshot.files, manifest.files, "Vendored Face SDK files");
  assertExactSerializable(snapshot.tree, manifest.tree, "Vendored Face SDK tree identity");

  const loaderPath = resolveInside(vendorRoot, "FaceLivenessDetector.js", "Face SDK loader");
  const loader = await readFile(loaderPath, "utf8");
  const versions = embeddedClientVersions(loader);
  invariant(versions.length === 1, "Face SDK loader must contain exactly one client SDK version marker");
  invariant(versions[0] === manifest.version, "Face SDK loader version must match the manifest");

  const brightnessSource = resolveInside(
    repository,
    manifest.overrides.brightnessSource,
    "Brightness override source"
  );
  const brightnessDestination = resolveInside(
    vendorRoot,
    manifest.overrides.brightnessDestination,
    "Brightness override destination"
  );
  const [sourceBrightness, vendoredBrightness] = await Promise.all([
    readFile(brightnessSource),
    readFile(brightnessDestination)
  ]);
  invariant(sourceBrightness.equals(vendoredBrightness), "Vendored Brightness.svg must match the application override");

  const dictionaryPath = resolveInside(
    vendorRoot,
    manifest.overrides.portugueseDictionary,
    "Portuguese dictionary"
  );
  const dictionary = JSON.parse((await readFile(dictionaryPath, "utf8")).replace(/^\uFEFF/, ""));
  for (const [key, expected] of Object.entries(manifest.overrides.strings)) {
    invariant(dictionary[key] === expected, `Portuguese dictionary must retain ${key}`);
  }

  if (checkBrowserContracts) await assertBrowserContracts(repository);
  return snapshot;
}

export async function checkFaceSdkVendor({
  repository = repositoryRoot,
  manifestPath = resolve(repository, FACE_SDK_MANIFEST_PATH),
  vendorRoot
} = {}) {
  const manifest = await readFaceSdkManifest(manifestPath);
  const resolvedVendorRoot = vendorRoot ?? resolveInside(
    repository,
    manifest.vendorRoot,
    "Face SDK vendor root"
  );
  const snapshot = await verifyFaceSdkTree({
    repository,
    vendorRoot: resolvedVendorRoot,
    manifest
  });
  return { manifest, snapshot };
}

async function readInstalledPackage(packageRoot, packageDefinition, targetVersion) {
  const packageDirectory = resolveInside(
    packageRoot,
    packageDefinition.packageRoot,
    `${packageDefinition.name} package root`
  );
  await assertTreeHasNoSymlinks(packageDirectory, `${packageDefinition.name} package`);
  const packageJsonPath = join(packageDirectory, "package.json");
  await requireRegularFile(packageJsonPath, `${packageDefinition.name} package.json`);
  let packageJson;
  try {
    packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  } catch {
    throw new Error(`${packageDefinition.name} package.json must contain valid JSON`);
  }
  invariant(packageJson.name === packageDefinition.name, `Installed package identity must be ${packageDefinition.name}`);
  invariant(packageJson.version === targetVersion, `${packageDefinition.name} must match target version ${targetVersion}`);
  return packageDirectory;
}

async function copyInstalledPackageFiles({ packageRoot, candidateRoot, targetVersion }) {
  for (const packageDefinition of FACE_SDK_PACKAGE_LAYOUT) {
    const packageDirectory = await readInstalledPackage(
      packageRoot,
      packageDefinition,
      targetVersion
    );
    for (const copy of packageDefinition.copies) {
      const source = resolveInside(packageDirectory, copy.source, `${packageDefinition.name} source`);
      const destination = resolveInside(candidateRoot, copy.destination, "Face SDK candidate destination");
      const stats = await lstat(source);
      invariant(!stats.isSymbolicLink(), `${packageDefinition.name} source must not be a symbolic link`);
      if (stats.isDirectory()) {
        await copyRegularTree(source, destination);
      } else {
        invariant(stats.isFile(), `${packageDefinition.name} source must be a regular file or directory`);
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(source, destination);
      }
    }
  }
}

async function applyFaceSdkOverrides(repository, candidateRoot, manifest) {
  const brightnessSource = resolveInside(
    repository,
    manifest.overrides.brightnessSource,
    "Brightness override source"
  );
  const brightnessDestination = resolveInside(
    candidateRoot,
    manifest.overrides.brightnessDestination,
    "Brightness override destination"
  );
  await requireRegularFile(brightnessSource, "Brightness override source");
  await requireRegularFile(brightnessDestination, "Brightness override destination");
  await copyFile(brightnessSource, brightnessDestination);

  const dictionaryPath = resolveInside(
    candidateRoot,
    manifest.overrides.portugueseDictionary,
    "Portuguese dictionary"
  );
  await requireRegularFile(dictionaryPath, "Portuguese dictionary");
  let dictionary;
  let dictionaryHasByteOrderMark;
  try {
    const dictionarySource = await readFile(dictionaryPath, "utf8");
    dictionaryHasByteOrderMark = dictionarySource.startsWith("\uFEFF");
    dictionary = JSON.parse(dictionarySource.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Portuguese Face SDK dictionary must contain valid JSON");
  }
  for (const [key, value] of Object.entries(manifest.overrides.strings)) {
    invariant(Object.hasOwn(dictionary, key), `Portuguese Face SDK dictionary is missing ${key}`);
    dictionary[key] = value;
  }
  await writeFile(
    dictionaryPath,
    `${dictionaryHasByteOrderMark ? "\uFEFF" : ""}${JSON.stringify(dictionary, null, 2)}\n`,
    "utf8"
  );
}

function updatedManifest(currentManifest, targetVersion, snapshot) {
  return {
    ...currentManifest,
    version: targetVersion,
    packages: currentManifest.packages.map((packageDefinition) => ({
      ...packageDefinition,
      version: targetVersion
    })),
    files: snapshot.files,
    tree: snapshot.tree
  };
}

async function maybeFail(faultAt, step) {
  if (faultAt === step) throw new Error(`Injected Face SDK update failure at ${step}`);
}

async function rollbackTransaction({
  manifestPath,
  vendorRoot,
  backupManifest,
  backupVendor,
  state
}) {
  if (state.manifestInstalled) await rm(manifestPath, { force: true });
  if (state.manifestBackedUp) await rename(backupManifest, manifestPath);
  if (state.vendorInstalled) await rm(vendorRoot, { force: true, recursive: true });
  if (state.vendorBackedUp) await rename(backupVendor, vendorRoot);
}

export async function updateFaceSdkVendor({
  packageRoot,
  targetVersion,
  repository = repositoryRoot,
  manifestPath = resolve(repository, FACE_SDK_MANIFEST_PATH),
  faultAt = null
}) {
  invariant(typeof packageRoot === "string" && packageRoot.length > 0, "packageRoot is required");
  assertSafeVersion(targetVersion, "targetVersion");
  const resolvedPackageRoot = resolve(packageRoot);
  await requireDirectory(resolvedPackageRoot, "Installed package root");
  const currentManifest = await readFaceSdkManifest(manifestPath);
  const vendorRoot = resolveInside(repository, currentManifest.vendorRoot, "Face SDK vendor root");
  await requireDirectory(vendorRoot, "Existing Face SDK vendor root");
  await checkFaceSdkVendor({ repository, manifestPath, vendorRoot });

  const transactionRoot = await mkdtemp(resolve(repository, FACE_SDK_TRANSACTION_PREFIX));
  const candidateRoot = join(transactionRoot, "candidate");
  const backupVendor = join(transactionRoot, "vendor-backup");
  const backupManifest = join(transactionRoot, "manifest-backup.json");
  const nextManifestPath = join(transactionRoot, "next-manifest.json");
  const state = {
    vendorBackedUp: false,
    vendorInstalled: false,
    manifestBackedUp: false,
    manifestInstalled: false
  };
  const failures = [];
  let recoveryBackupsRequired = false;
  let nextManifest;

  try {
    await mkdir(candidateRoot);
    await copyInstalledPackageFiles({
      packageRoot: resolvedPackageRoot,
      candidateRoot,
      targetVersion
    });
    await applyFaceSdkOverrides(repository, candidateRoot, currentManifest);
    await normalizeCandidateLineEndings(candidateRoot);

    const loader = await readFile(join(candidateRoot, "FaceLivenessDetector.js"), "utf8");
    const versions = embeddedClientVersions(loader);
    invariant(versions.length === 1, "Installed Face SDK loader must contain exactly one client SDK version marker");
    invariant(versions[0] === targetVersion, "Installed Face SDK loader version must match targetVersion");

    const snapshot = await snapshotFaceSdkTree(candidateRoot);
    nextManifest = updatedManifest(currentManifest, targetVersion, snapshot);
    assertFaceSdkManifest(nextManifest);
    await verifyFaceSdkTree({
      repository,
      vendorRoot: candidateRoot,
      manifest: nextManifest
    });
    await writeFile(nextManifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, "utf8");
    await maybeFail(faultAt, "candidate-ready");

    await rename(vendorRoot, backupVendor);
    state.vendorBackedUp = true;
    await maybeFail(faultAt, "vendor-backed-up");
    await rename(candidateRoot, vendorRoot);
    state.vendorInstalled = true;
    await maybeFail(faultAt, "vendor-installed");
    await rename(manifestPath, backupManifest);
    state.manifestBackedUp = true;
    await maybeFail(faultAt, "manifest-backed-up");
    await rename(nextManifestPath, manifestPath);
    state.manifestInstalled = true;
    await maybeFail(faultAt, "manifest-installed");

    await checkFaceSdkVendor({ repository, manifestPath, vendorRoot });
    await maybeFail(faultAt, "verified");
  } catch (error) {
    failures.push(error);
    try {
      await rollbackTransaction({
        manifestPath,
        vendorRoot,
        backupManifest,
        backupVendor,
        state
      });
    } catch (rollbackError) {
      failures.push(rollbackError);
      recoveryBackupsRequired = true;
    }
  }

  if (!recoveryBackupsRequired) {
    try {
      await rm(transactionRoot, { force: true, recursive: true });
    } catch (cleanupError) {
      failures.push(cleanupError);
    }
  }

  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(
      failures,
      `Face SDK update and recovery did not complete cleanly; recovery backups remain at ${transactionRoot}`
    );
  }
  return nextManifest;
}
