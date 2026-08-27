import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import {
  dirname,
  isAbsolute,
  posix,
  relative,
  resolve,
  sep
} from "node:path";
import { fileURLToPath } from "node:url";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm
} from "node:fs/promises";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const localOrigin = "https://frontend-artifact.invalid";

export const repositoryRoot = resolve(scriptDirectory, "..");
export const distRoot = resolve(repositoryRoot, "dist");
export const manifestPath = resolve(repositoryRoot, "frontend-deployment.json");

function comparePaths(left, right) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toLocalPath(relativePath) {
  return resolve(repositoryRoot, ...relativePath.split("/"));
}

function isInside(root, candidate) {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot === ""
    || (!pathFromRoot.startsWith(`..${sep}`)
      && pathFromRoot !== ".."
      && !isAbsolute(pathFromRoot));
}

function assertSafeRelativePath(value, label) {
  invariant(typeof value === "string" && value.length > 0, `${label} must be a non-empty string.`);
  invariant(!value.includes("\\"), `${label} must use forward slashes: ${value}`);
  invariant(!value.startsWith("/"), `${label} must be repository-relative: ${value}`);
  invariant(!value.endsWith("/"), `${label} must not end with a slash: ${value}`);
  invariant(posix.normalize(value) === value, `${label} is not normalized: ${value}`);

  const segments = value.split("/");
  invariant(
    segments.every((segment) => segment !== "" && segment !== "." && segment !== ".."),
    `${label} contains an unsafe segment: ${value}`
  );

  invariant(
    isInside(repositoryRoot, toLocalPath(value)),
    `${label} escapes the repository: ${value}`
  );
}

function normalizedCollisionKey(value) {
  return value.normalize("NFC").toLowerCase();
}

function normalizePublicPath(value, label, canonicalOrigin) {
  invariant(typeof value === "string" && value.startsWith("/"), `${label} must start with "/": ${value}`);
  invariant(!value.includes("\\"), `${label} must use URL separators: ${value}`);
  invariant(!value.includes("?") && !value.includes("#"), `${label} must not contain a query or fragment: ${value}`);

  const parsed = new URL(value, canonicalOrigin);
  const normalizedOrigin = new URL(canonicalOrigin).origin;
  invariant(parsed.origin === normalizedOrigin, `${label} must stay on the canonical origin: ${value}`);

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(parsed.pathname).normalize("NFC");
  } catch {
    throw new Error(`${label} contains malformed URL encoding: ${value}`);
  }

  invariant(
    decodedPath === value.normalize("NFC"),
    `${label} must be a decoded, normalized public path: ${value}`
  );
  invariant(posix.normalize(decodedPath) === decodedPath, `${label} is not normalized: ${value}`);
  return decodedPath;
}

function isCoveredByMapping(file, mapping) {
  if (mapping.sourceType === "file") {
    return file === mapping.output;
  }

  return file.startsWith(`${mapping.output}/`);
}

function gitTrackedFiles(source) {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "-z", "--", source],
    {
      cwd: repositoryRoot,
      encoding: "buffer",
      windowsHide: true
    }
  );

  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

async function inspectMapping(applicationId, mapping, label) {
  invariant(isPlainObject(mapping), `${label} must be an object.`);
  assertSafeRelativePath(mapping.source, `${label}.source`);
  assertSafeRelativePath(mapping.output, `${label}.output`);

  const sourcePath = toLocalPath(mapping.source);
  let sourceStats;
  try {
    sourceStats = await lstat(sourcePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`${label}.source does not exist: ${mapping.source}`);
    }
    throw error;
  }

  invariant(!sourceStats.isSymbolicLink(), `${label}.source must not be a symbolic link: ${mapping.source}`);
  invariant(
    sourceStats.isFile() || sourceStats.isDirectory(),
    `${label}.source must be a regular file or directory: ${mapping.source}`
  );

  return {
    applicationId,
    source: mapping.source,
    output: mapping.output,
    sourceType: sourceStats.isFile() ? "file" : "directory"
  };
}

export async function readDeploymentManifest() {
  const contents = await readFile(manifestPath, "utf8");
  let manifest;

  try {
    manifest = JSON.parse(contents);
  } catch (error) {
    throw new Error(`frontend-deployment.json is not valid JSON: ${error.message}`);
  }

  return manifest;
}

export function publicEntries(manifest) {
  return manifest.applications.flatMap((application) => application.publicEntries);
}

export function publicDownloads(manifest) {
  return manifest.applications.flatMap((application) => application.publicDownloads);
}

export async function validateDeploymentManifest(manifest) {
  invariant(isPlainObject(manifest), "Deployment manifest must be an object.");
  invariant(manifest.schemaVersion === 1, "Deployment manifest schemaVersion must be 1.");
  invariant(
    manifest.canonicalOrigin === "https://machadogestao.com",
    "Deployment manifest canonicalOrigin must remain https://machadogestao.com."
  );
  invariant(Array.isArray(manifest.applications) && manifest.applications.length > 0, "Deployment manifest must contain applications.");

  const applicationIds = new Set();
  const mappings = [];

  invariant(
    Array.isArray(manifest.sharedMappings) && manifest.sharedMappings.length > 0,
    "Deployment manifest sharedMappings must contain at least one source-to-output mapping."
  );
  for (const [mappingIndex, mapping] of manifest.sharedMappings.entries()) {
    mappings.push(await inspectMapping(
      null,
      mapping,
      `sharedMappings[${mappingIndex}]`
    ));
  }

  for (const [applicationIndex, application] of manifest.applications.entries()) {
    const applicationLabel = `applications[${applicationIndex}]`;
    invariant(isPlainObject(application), `${applicationLabel} must be an object.`);
    invariant(
      typeof application.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(application.id),
      `${applicationLabel}.id must be a stable kebab-case identifier.`
    );

    const applicationKey = normalizedCollisionKey(application.id);
    invariant(!applicationIds.has(applicationKey), `Duplicate application id: ${application.id}`);
    applicationIds.add(applicationKey);

    invariant(
      Array.isArray(application.mappings) && application.mappings.length > 0,
      `${applicationLabel}.mappings must contain at least one source-to-output mapping.`
    );

    for (const [mappingIndex, mapping] of application.mappings.entries()) {
      mappings.push(await inspectMapping(
        application.id,
        mapping,
        `${applicationLabel}.mappings[${mappingIndex}]`
      ));
    }

    invariant(Array.isArray(application.publicEntries), `${applicationLabel}.publicEntries must be an array.`);
    invariant(Array.isArray(application.publicDownloads), `${applicationLabel}.publicDownloads must be an array.`);
  }

  for (let leftIndex = 0; leftIndex < mappings.length; leftIndex += 1) {
    const left = normalizedCollisionKey(mappings[leftIndex].output);

    for (let rightIndex = leftIndex + 1; rightIndex < mappings.length; rightIndex += 1) {
      const right = normalizedCollisionKey(mappings[rightIndex].output);
      invariant(
        left !== right && !left.startsWith(`${right}/`) && !right.startsWith(`${left}/`),
        `Overlapping output destinations: ${mappings[leftIndex].output} and ${mappings[rightIndex].output}`
      );
    }
  }

  const publicPathKeys = new Set();
  const entries = [];
  const downloads = [];

  for (const application of manifest.applications) {
    for (const [entryIndex, entry] of application.publicEntries.entries()) {
      const label = `applications.${application.id}.publicEntries[${entryIndex}]`;
      invariant(isPlainObject(entry), `${label} must be an object.`);
      const publicPath = normalizePublicPath(entry.path, `${label}.path`, manifest.canonicalOrigin);
      invariant(publicPath.endsWith("/"), `${label}.path must be a directory entry route: ${entry.path}`);
      assertSafeRelativePath(entry.file, `${label}.file`);
      invariant(
        mappings.some((mapping) => isCoveredByMapping(entry.file, mapping)),
        `${label}.file is not covered by an output mapping: ${entry.file}`
      );

      const pathKey = normalizedCollisionKey(publicPath);
      invariant(!publicPathKeys.has(pathKey), `Duplicate public path: ${entry.path}`);
      publicPathKeys.add(pathKey);
      entries.push({ ...entry, applicationId: application.id });
    }

    for (const [downloadIndex, download] of application.publicDownloads.entries()) {
      const label = `applications.${application.id}.publicDownloads[${downloadIndex}]`;
      invariant(isPlainObject(download), `${label} must be an object.`);
      const publicPath = normalizePublicPath(download.path, `${label}.path`, manifest.canonicalOrigin);
      invariant(!publicPath.endsWith("/"), `${label}.path must identify a file: ${download.path}`);
      assertSafeRelativePath(download.file, `${label}.file`);
      invariant(
        mappings.some((mapping) => isCoveredByMapping(download.file, mapping)),
        `${label}.file is not covered by an output mapping: ${download.file}`
      );

      const pathKey = normalizedCollisionKey(publicPath);
      invariant(!publicPathKeys.has(pathKey), `Duplicate public path: ${download.path}`);
      publicPathKeys.add(pathKey);
      downloads.push({ ...download, applicationId: application.id });
    }
  }

  invariant(Array.isArray(manifest.notFoundPaths), "Deployment manifest notFoundPaths must be an array.");
  invariant(Array.isArray(manifest.repositoryOnlyPaths), "Deployment manifest repositoryOnlyPaths must be an array.");

  const negativePathKeys = new Set();
  for (const [groupName, paths] of [
    ["notFoundPaths", manifest.notFoundPaths],
    ["repositoryOnlyPaths", manifest.repositoryOnlyPaths]
  ]) {
    for (const [pathIndex, publicPath] of paths.entries()) {
      const normalizedPath = normalizePublicPath(
        publicPath,
        `${groupName}[${pathIndex}]`,
        manifest.canonicalOrigin
      );
      const pathKey = normalizedCollisionKey(normalizedPath);
      invariant(!publicPathKeys.has(pathKey), `${groupName} overlaps a public path: ${publicPath}`);
      invariant(!negativePathKeys.has(pathKey), `Duplicate expected 404 path: ${publicPath}`);
      negativePathKeys.add(pathKey);
    }
  }

  const files = await collectMappedFiles(mappings);
  const emittedFiles = new Set(files.map((file) => file.output));
  for (const contract of [...entries, ...downloads]) {
    invariant(
      emittedFiles.has(contract.file),
      `Public contract file is not a tracked emitted file: ${contract.file}`
    );
  }

  return { mappings, files, entries, downloads };
}

export async function collectMappedFiles(mappings) {
  const mappedFiles = [];
  const outputKeys = new Map();

  for (const mapping of mappings) {
    const trackedFiles = gitTrackedFiles(mapping.source);
    invariant(trackedFiles.length > 0, `Mapped source has no tracked files: ${mapping.source}`);

    if (mapping.sourceType === "file") {
      invariant(
        trackedFiles.length === 1 && trackedFiles[0] === mapping.source,
        `Mapped file source does not resolve exactly: ${mapping.source}`
      );
    }

    for (const trackedFile of trackedFiles) {
      invariant(
        mapping.sourceType === "file"
          ? trackedFile === mapping.source
          : trackedFile.startsWith(`${mapping.source}/`),
        `Git returned a file outside mapped source ${mapping.source}: ${trackedFile}`
      );

      const suffix = mapping.sourceType === "file"
        ? ""
        : trackedFile.slice(mapping.source.length + 1);
      const output = mapping.sourceType === "file"
        ? mapping.output
        : posix.join(mapping.output, suffix);
      const outputKey = normalizedCollisionKey(output);

      invariant(
        !outputKeys.has(outputKey),
        `Multiple tracked sources emit the same output: ${outputKeys.get(outputKey)} and ${trackedFile}`
      );
      outputKeys.set(outputKey, trackedFile);

      const sourceStats = await lstat(toLocalPath(trackedFile));
      invariant(!sourceStats.isSymbolicLink(), `Tracked source must not be a symbolic link: ${trackedFile}`);
      invariant(sourceStats.isFile(), `Tracked source must be a regular file: ${trackedFile}`);

      mappedFiles.push({
        applicationId: mapping.applicationId,
        source: trackedFile,
        output
      });
    }
  }

  return mappedFiles.sort((left, right) => comparePaths(left.output, right.output));
}

async function clearDist() {
  invariant(distRoot === resolve(repositoryRoot, "dist"), "Refusing to clear an unexpected dist path.");

  try {
    const existingStats = await lstat(distRoot);
    invariant(!existingStats.isSymbolicLink(), "Refusing to clear dist because it is a symbolic link.");
    invariant(existingStats.isDirectory(), "Refusing to clear dist because it is not a directory.");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await rm(distRoot, { force: true, recursive: true });
  await mkdir(distRoot);
}

export async function listTreeFiles(root) {
  const files = [];

  async function visit(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => comparePaths(left.name, right.name));

    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? posix.join(relativeDirectory, entry.name)
        : entry.name;
      const absolutePath = resolve(directory, entry.name);

      invariant(!entry.isSymbolicLink(), `Generated tree contains a symbolic link: ${relativePath}`);

      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
      } else {
        invariant(entry.isFile(), `Generated tree contains a non-file entry: ${relativePath}`);
        files.push(relativePath);
      }
    }
  }

  await visit(root);
  return files.sort(comparePaths);
}

export async function treeDigest(root, files = null) {
  const treeFiles = files ?? await listTreeFiles(root);
  const hash = createHash("sha256");
  let bytes = 0;

  for (const file of treeFiles) {
    const contents = await readFile(resolve(root, ...file.split("/")));
    const pathBytes = Buffer.from(file, "utf8");
    hash.update(Buffer.from(`${pathBytes.length}:`, "utf8"));
    hash.update(pathBytes);
    hash.update(Buffer.from(`:${contents.length}:`, "utf8"));
    hash.update(contents);
    bytes += contents.length;
  }

  return {
    algorithm: "sha256",
    digest: hash.digest("hex"),
    files: treeFiles.length,
    bytes
  };
}

export async function buildDist(manifest = null) {
  const deploymentManifest = manifest ?? await readDeploymentManifest();
  const validation = await validateDeploymentManifest(deploymentManifest);
  await clearDist();

  for (const file of validation.files) {
    const outputPath = resolve(distRoot, ...file.output.split("/"));
    invariant(isInside(distRoot, outputPath), `Output path escapes dist: ${file.output}`);
    await mkdir(dirname(outputPath), { recursive: true });
    await copyFile(toLocalPath(file.source), outputPath);
  }

  const generatedFiles = await listTreeFiles(distRoot);
  const expectedFiles = validation.files.map((file) => file.output);
  invariant(
    JSON.stringify(generatedFiles) === JSON.stringify(expectedFiles),
    "Generated dist file set does not match the tracked manifest file set."
  );

  return {
    manifest: deploymentManifest,
    validation,
    stats: await treeDigest(distRoot, generatedFiles)
  };
}

export async function assertArtifactMatchesSources(manifest = null) {
  const deploymentManifest = manifest ?? await readDeploymentManifest();
  const validation = await validateDeploymentManifest(deploymentManifest);
  const actualFiles = await listTreeFiles(distRoot);
  const expectedFiles = validation.files.map((file) => file.output);

  invariant(
    JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
    "dist contains a missing, extra, or differently cased path."
  );

  for (const file of validation.files) {
    const sourceContents = await readFile(toLocalPath(file.source));
    const outputContents = await readFile(resolve(distRoot, ...file.output.split("/")));
    invariant(
      sourceContents.equals(outputContents),
      `Generated file differs from its source: ${file.source} -> dist/${file.output}`
    );
  }

  return {
    validation,
    stats: await treeDigest(distRoot, actualFiles)
  };
}

function markdownSection(markdown, startMarker, endMarker) {
  const start = markdown.indexOf(startMarker);
  invariant(start !== -1, `README is missing section marker: ${startMarker}`);
  const end = markdown.indexOf(endMarker, start + startMarker.length);
  invariant(end !== -1, `README is missing section boundary: ${endMarker}`);
  return markdown.slice(start, end);
}

function parseReadmeContracts(section, canonicalOrigin) {
  const contracts = [];

  for (const line of section.split(/\r?\n/)) {
    if (!line.startsWith("|")) {
      continue;
    }

    const targets = [...line.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
    const canonicalIndex = targets.findIndex((target) => target.startsWith(canonicalOrigin));
    if (canonicalIndex < 1) {
      continue;
    }

    const sourceTarget = targets[canonicalIndex - 1];
    const publicUrl = new URL(targets[canonicalIndex]);
    invariant(publicUrl.origin === canonicalOrigin, `README uses an unexpected public origin: ${publicUrl.origin}`);

    contracts.push({
      file: decodeURIComponent(sourceTarget).normalize("NFC"),
      path: decodeURIComponent(publicUrl.pathname).normalize("NFC")
    });
  }

  return contracts;
}

function contractMap(contracts) {
  return new Map(
    contracts
      .map((contract) => [contract.path, contract.file])
      .sort(([left], [right]) => comparePaths(left, right))
  );
}

function sourceContracts(contracts, mappedFiles) {
  const sourceByOutput = new Map(
    mappedFiles.map((file) => [file.output, file.source])
  );

  return contracts.map((contract) => {
    const source = sourceByOutput.get(contract.file);
    invariant(source, `Public contract has no mapped source file: ${contract.file}`);
    return { ...contract, file: source };
  });
}

function assertContractMapsEqual(actual, expected, label) {
  invariant(actual.size === expected.size, `${label} count differs between README and manifest.`);

  for (const [publicPath, file] of expected) {
    invariant(actual.has(publicPath), `${label} is missing from README: ${publicPath}`);
    invariant(
      actual.get(publicPath) === file,
      `${label} file differs for ${publicPath}: ${actual.get(publicPath)} !== ${file}`
    );
  }
}

export async function assertReadmeContract(manifest) {
  const readme = await readFile(resolve(repositoryRoot, "README.md"), "utf8");
  const entrySection = markdownSection(
    readme,
    "## Frontend structure and public routes",
    "These are URL entry points"
  );
  const downloadSection = markdownSection(
    readme,
    "The main site also exposes these public downloads:",
    "Other files under project directories"
  );

  const readmeEntries = parseReadmeContracts(entrySection, manifest.canonicalOrigin);
  const readmeDownloads = parseReadmeContracts(downloadSection, manifest.canonicalOrigin);
  const validation = await validateDeploymentManifest(manifest);
  const manifestEntries = sourceContracts(validation.entries, validation.files);
  const manifestDownloads = sourceContracts(validation.downloads, validation.files);

  invariant(readmeEntries.length === 12, `README must document exactly 12 page routes, found ${readmeEntries.length}.`);
  invariant(readmeDownloads.length === 3, `README must document exactly 3 downloads, found ${readmeDownloads.length}.`);
  invariant(manifestEntries.length === 12, `Manifest must define exactly 12 page routes, found ${manifestEntries.length}.`);
  invariant(manifestDownloads.length === 3, `Manifest must define exactly 3 downloads, found ${manifestDownloads.length}.`);

  assertContractMapsEqual(
    contractMap(readmeEntries),
    contractMap(manifestEntries),
    "Page route contract"
  );
  assertContractMapsEqual(
    contractMap(readmeDownloads),
    contractMap(manifestDownloads),
    "Download contract"
  );

  return {
    entries: manifestEntries.length,
    downloads: manifestDownloads.length
  };
}

export function extractHtmlReferences(html) {
  const references = [];
  const tagPattern = /<([A-Za-z][A-Za-z0-9:-]*)(?:\s[^<>]*?)?>/gs;

  for (const tagMatch of html.matchAll(tagPattern)) {
    const tag = tagMatch[1].toLowerCase();
    const attributePattern = /\b(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

    for (const attributeMatch of tagMatch[0].matchAll(attributePattern)) {
      references.push({
        tag,
        attribute: attributeMatch[1].toLowerCase(),
        value: attributeMatch[2] ?? attributeMatch[3] ?? attributeMatch[4]
      });
    }
  }

  return references;
}

export function extractCssReferences(css) {
  const references = [];
  const urlPattern = /url\(\s*(?:(["'])(.*?)\1|([^)]*?))\s*\)/gis;

  for (const match of css.matchAll(urlPattern)) {
    references.push((match[2] ?? match[3]).trim());
  }

  return references;
}

function parseJavaScriptModuleRequests() {
  const { readFileSync } = require("node:fs");
  const { SourceTextModule } = require("node:vm");
  const source = readFileSync(0, "utf8");
  const sourceModule = new SourceTextModule(source);
  const dynamicDependencySpecifiers = [];

  function canParse(candidate) {
    try {
      new SourceTextModule(candidate);
      return true;
    } catch {
      return false;
    }
  }

  function skipTrivia(start) {
    let index = start;
    while (index < source.length) {
      if (/\s/u.test(source[index])) {
        index += 1;
      } else if (source.startsWith("//", index)) {
        const lineEnd = source.indexOf("\n", index + 2);
        index = lineEnd === -1 ? source.length : lineEnd + 1;
      } else if (source.startsWith("/*", index)) {
        const commentEnd = source.indexOf("*/", index + 2);
        index = commentEnd === -1 ? source.length : commentEnd + 2;
      } else {
        return index;
      }
    }
    return index;
  }

  function readStringEnd(start) {
    const quote = source[start];
    let index = start + 1;
    while (index < source.length) {
      if (source[index] === "\\") {
        index += 2;
      } else if (source[index] === quote) {
        return index + 1;
      } else {
        index += 1;
      }
    }
    return index;
  }

  for (const importMatch of source.matchAll(/\bimport\b/gu)) {
    const importStart = importMatch.index;
    const openingParenthesis = skipTrivia(importStart + importMatch[0].length);
    if (source[openingParenthesis] !== "(") {
      continue;
    }

    const argumentStart = skipTrivia(openingParenthesis + 1);
    if (source[argumentStart] !== "'" && source[argumentStart] !== '"') {
      continue;
    }

    const argumentEnd = readStringEnd(argumentStart);
    const literalSource = source.slice(argumentStart, argumentEnd);
    const afterLiteral = skipTrivia(argumentEnd);
    if (source[afterLiteral] !== ")" && source[afterLiteral] !== ",") {
      continue;
    }

    const invalidCodeToken = [
      source.slice(0, importStart),
      "@",
      source.slice(importStart + 1)
    ].join("");
    if (canParse(invalidCodeToken)) {
      continue;
    }

    const identifierReplacement = "0".padEnd(importMatch[0].length, " ");
    const replacedImport = [
      source.slice(0, importStart),
      identifierReplacement,
      source.slice(importStart + importMatch[0].length)
    ].join("");
    if (!canParse(replacedImport)) {
      continue;
    }

    // Both native parses constrain this evaluation to one real string-literal import.
    const specifier = Function(`"use strict"; return (${literalSource});`)();
    if (/^\.{1,2}\//.test(specifier)) dynamicDependencySpecifiers.push(specifier);
  }

  process.stdout.write(JSON.stringify({
    dependencySpecifiers: sourceModule.dependencySpecifiers,
    dynamicDependencySpecifiers
  }));
}

const javaScriptModuleRequestParser = `(${parseJavaScriptModuleRequests.toString()})();`;

export function extractJavaScriptImportReferences(javaScript) {
  let serializedModuleRequests;
  try {
    serializedModuleRequests = execFileSync(
      process.execPath,
      [
        "--no-warnings",
        "--experimental-vm-modules",
        "-e",
        javaScriptModuleRequestParser
      ],
      {
        encoding: "utf8",
        input: javaScript,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true
      }
    );
  } catch (cause) {
    throw new Error("Unable to parse JavaScript module dependencies.", { cause });
  }

  let moduleRequests;
  try {
    moduleRequests = JSON.parse(serializedModuleRequests);
  } catch (cause) {
    throw new Error("Unable to read parsed JavaScript module dependencies.", { cause });
  }

  invariant(
    isPlainObject(moduleRequests)
      && Array.isArray(moduleRequests.dependencySpecifiers)
      && Array.isArray(moduleRequests.dynamicDependencySpecifiers)
      && [...moduleRequests.dependencySpecifiers, ...moduleRequests.dynamicDependencySpecifiers]
        .every((specifier) => typeof specifier === "string"),
    "Parsed JavaScript module dependencies are invalid."
  );

  return [
    ...moduleRequests.dependencySpecifiers,
    ...moduleRequests.dynamicDependencySpecifiers
  ].filter((specifier) => /^\.{1,2}\//.test(specifier));
}

function localReferenceCandidates(value, baseUrl, { allowIndexFallback = true } = {}) {
  const trimmedValue = value.trim();
  if (trimmedValue.startsWith("#") || trimmedValue.startsWith("//")) {
    return [];
  }

  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(trimmedValue)) {
    return [];
  }

  const resolvedUrl = new URL(trimmedValue, baseUrl);
  if (resolvedUrl.origin !== localOrigin) {
    return [];
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(resolvedUrl.pathname).normalize("NFC");
  } catch {
    throw new Error(`Local reference contains malformed URL encoding: ${value}`);
  }

  const normalizedPath = posix.normalize(decodedPath);
  invariant(
    normalizedPath === decodedPath,
    `Local reference path is not normalized: ${value}`
  );

  const relativePath = decodedPath.replace(/^\/+/, "");
  if (!allowIndexFallback) {
    return relativePath === "" ? [] : [relativePath];
  }
  if (relativePath === "") {
    return ["index.html"];
  }

  if (decodedPath.endsWith("/")) {
    return [posix.join(relativePath, "index.html")];
  }

  return [relativePath, posix.join(relativePath, "index.html")];
}

function sourcePreviewAliases(outputFile, sourceFile, mappedFiles) {
  const baseFile = mappedFiles.find(
    (file) => file.output === outputFile && file.source === sourceFile
  );
  const applicationFiles = baseFile?.applicationId
    ? mappedFiles.filter(
      (file) => file.applicationId === baseFile.applicationId
    )
    : mappedFiles;
  const outputDirectory = posix.dirname(outputFile);
  const sourceDirectory = posix.dirname(sourceFile);
  const aliases = new Map();

  for (const file of applicationFiles) {
    const outputFromEntry = posix.relative(outputDirectory, file.output);
    const sourcePreviewRoute = posix.join(sourceDirectory, outputFromEntry);
    addSourcePreviewRoute(aliases, sourcePreviewRoute, file.source);
  }

  return aliases;
}

function sourcePreviewRouteSources(mappedFiles, outputFile = null, sourceFile = null) {
  const sourceByRoute = new Map();

  for (const file of mappedFiles) {
    addSourcePreviewRoute(sourceByRoute, file.source, file.source);
  }

  if (outputFile !== null && sourceFile !== null) {
    for (const [route, source] of sourcePreviewAliases(
      outputFile,
      sourceFile,
      mappedFiles
    )) {
      addSourcePreviewRoute(sourceByRoute, route, source);
    }
  }

  return sourceByRoute;
}

function compareResolvedSourcePreviewReference(
  value,
  outputBaseUrl,
  sourceBaseUrl,
  sourceByOutput,
  sourceByPreviewRoute,
  { allowIndexFallback = true } = {}
) {
  const outputCandidates = localReferenceCandidates(
    value,
    outputBaseUrl,
    { allowIndexFallback }
  );
  if (outputCandidates.length === 0) {
    return null;
  }

  const output = outputCandidates.find((candidate) => sourceByOutput.has(candidate)) ?? null;
  const expectedSource = output === null ? null : sourceByOutput.get(output);
  const sourceCandidates = localReferenceCandidates(
    value,
    sourceBaseUrl,
    { allowIndexFallback }
  );

  return {
    expectedSource,
    matches: expectedSource !== null && sourceCandidates.some(
      (candidate) => sourceByPreviewRoute.get(candidate) === expectedSource
    ),
    output,
    sourceCandidates
  };
}

export function compareSourcePreviewReference(value, outputFile, sourceFile, mappedFiles) {
  const sourceByOutput = new Map(
    mappedFiles.map((file) => [file.output, file.source])
  );
  const sourceByPreviewRoute = sourcePreviewRouteSources(
    mappedFiles,
    outputFile,
    sourceFile
  );

  return compareResolvedSourcePreviewReference(
    value,
    new URL(`/${outputFile}`, localOrigin),
    new URL(`/${sourceFile}`, localOrigin),
    sourceByOutput,
    sourceByPreviewRoute
  );
}

function assertSourcePreviewReference(result, label, value) {
  if (result === null) {
    return false;
  }

  invariant(
    result.output !== null,
    `Broken mapped asset ${label}: ${value}`
  );
  invariant(
    result.matches,
    [
      `Broken source-preview asset ${label}: ${value}.`,
      `dist/${result.output} maps to ${result.expectedSource},`,
      `but source preview resolves to ${result.sourceCandidates.join(" or ")}.`
    ].join(" ")
  );

  return true;
}

function isHtmlAssetReference(reference) {
  return reference.attribute === "src"
    || (reference.tag === "link" && reference.attribute === "href");
}

export async function assertSourcePreviewReferences(manifest) {
  const validation = await validateDeploymentManifest(manifest);
  const sourceByOutput = new Map(
    validation.files.map((file) => [file.output, file.source])
  );
  const referenceRoutes = (outputFile = null, sourceFile = null) => {
    const routes = sourcePreviewRouteSources(
      validation.files,
      outputFile,
      sourceFile
    );

    for (const [output, source] of sourceByOutput) {
      addSourcePreviewRoute(routes, output, source);
    }

    return routes;
  };
  let htmlReferences = 0;
  let cssReferences = 0;
  let javascriptReferences = 0;

  for (const file of validation.files.filter(
    (mappedFile) => mappedFile.source.toLowerCase().endsWith(".html")
  )) {
    const html = await readFile(toLocalPath(file.source), "utf8");
    const references = extractHtmlReferences(html);
    const outputDocumentUrl = new URL(`/${file.output}`, localOrigin);
    const sourceDocumentUrl = new URL(`/${file.source}`, localOrigin);
    const baseReference = references.find(
      (reference) => reference.tag === "base" && reference.attribute === "href"
    );
    const outputBaseUrl = baseReference
      ? new URL(baseReference.value, outputDocumentUrl)
      : outputDocumentUrl;
    const sourceBaseUrl = baseReference
      ? new URL(baseReference.value, sourceDocumentUrl)
      : sourceDocumentUrl;
    const entry = validation.entries.find(
      (candidate) => candidate.file === file.output
    );
    const sourceByPreviewRoute = entry
      ? referenceRoutes(file.output, file.source)
      : referenceRoutes();

    for (const reference of references.filter(isHtmlAssetReference)) {
      const result = compareResolvedSourcePreviewReference(
        reference.value,
        outputBaseUrl,
        sourceBaseUrl,
        sourceByOutput,
        sourceByPreviewRoute
      );
      if (assertSourcePreviewReference(
        result,
        `HTML ${reference.attribute} in ${file.source}`,
        reference.value
      )) {
        htmlReferences += 1;
      }
    }
  }

  for (const file of validation.files.filter(
    (mappedFile) => mappedFile.source.toLowerCase().endsWith(".css")
  )) {
    const css = await readFile(toLocalPath(file.source), "utf8");
    const outputStylesheetUrl = new URL(`/${file.output}`, localOrigin);
    const sourceStylesheetUrl = new URL(`/${file.source}`, localOrigin);
    const sourceByPreviewRoute = referenceRoutes(file.output, file.source);

    for (const reference of extractCssReferences(css)) {
      const result = compareResolvedSourcePreviewReference(
        reference,
        outputStylesheetUrl,
        sourceStylesheetUrl,
        sourceByOutput,
        sourceByPreviewRoute
      );
      if (assertSourcePreviewReference(
        result,
        `CSS url() in ${file.source}`,
        reference
      )) {
        cssReferences += 1;
      }
    }
  }

  for (const file of validation.files.filter(
    (mappedFile) => mappedFile.source.toLowerCase().endsWith(".js")
  )) {
    const javaScript = await readFile(toLocalPath(file.source), "utf8");
    const outputScriptUrl = new URL(`/${file.output}`, localOrigin);
    const sourceScriptUrl = new URL(`/${file.source}`, localOrigin);
    const sourceByPreviewRoute = referenceRoutes(file.output, file.source);

    for (const reference of extractJavaScriptImportReferences(javaScript)) {
      const result = compareResolvedSourcePreviewReference(
        reference,
        outputScriptUrl,
        sourceScriptUrl,
        sourceByOutput,
        sourceByPreviewRoute,
        { allowIndexFallback: false }
      );
      if (assertSourcePreviewReference(
        result,
        `JavaScript import in ${file.source}`,
        reference
      )) {
        javascriptReferences += 1;
      }
    }
  }

  return { htmlReferences, cssReferences, javascriptReferences };
}

export async function assertLocalReferences(artifactRoot = distRoot) {
  const artifactFiles = await listTreeFiles(artifactRoot);
  const artifactFileSet = new Set(artifactFiles);
  let htmlReferences = 0;
  let cssReferences = 0;
  let javascriptReferences = 0;

  for (const file of artifactFiles.filter((filePath) => filePath.toLowerCase().endsWith(".html"))) {
    const html = await readFile(resolve(artifactRoot, ...file.split("/")), "utf8");
    const references = extractHtmlReferences(html);
    const documentUrl = new URL(`/${file}`, localOrigin);
    const baseReference = references.find(
      (reference) => reference.tag === "base" && reference.attribute === "href"
    );
    const baseUrl = baseReference
      ? new URL(baseReference.value, documentUrl)
      : documentUrl;

    for (const reference of references) {
      if (reference.tag === "base") {
        continue;
      }

      const candidates = localReferenceCandidates(reference.value, baseUrl);
      if (candidates.length === 0) {
        continue;
      }

      htmlReferences += 1;
      invariant(
        candidates.some((candidate) => artifactFileSet.has(candidate)),
        `Broken local HTML ${reference.attribute} in dist/${file}: ${reference.value}`
      );
    }
  }

  for (const file of artifactFiles.filter((filePath) => filePath.toLowerCase().endsWith(".css"))) {
    const css = await readFile(resolve(artifactRoot, ...file.split("/")), "utf8");
    const stylesheetUrl = new URL(`/${file}`, localOrigin);

    for (const reference of extractCssReferences(css)) {
      const candidates = localReferenceCandidates(reference, stylesheetUrl);
      if (candidates.length === 0) {
        continue;
      }

      cssReferences += 1;
      invariant(
        candidates.some((candidate) => artifactFileSet.has(candidate)),
        `Broken local CSS url() in dist/${file}: ${reference}`
      );
    }
  }

  for (const file of artifactFiles.filter((filePath) => filePath.toLowerCase().endsWith(".js"))) {
    const javaScript = await readFile(resolve(artifactRoot, ...file.split("/")), "utf8");
    const scriptUrl = new URL(`/${file}`, localOrigin);

    for (const reference of extractJavaScriptImportReferences(javaScript)) {
      const candidates = localReferenceCandidates(
        reference,
        scriptUrl,
        { allowIndexFallback: false }
      );

      javascriptReferences += 1;
      invariant(
        candidates.some((candidate) => artifactFileSet.has(candidate)),
        `Broken local JavaScript import in dist/${file}: ${reference}`
      );
    }
  }

  return { htmlReferences, cssReferences, javascriptReferences };
}

function contentType(file) {
  const extension = posix.extname(file).toLowerCase();
  return new Map([
    [".css", "text/css; charset=utf-8"],
    [".html", "text/html; charset=utf-8"],
    [".ico", "image/x-icon"],
    [".jpeg", "image/jpeg"],
    [".jpg", "image/jpeg"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".pdf", "application/pdf"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".webp", "image/webp"]
  ]).get(extension) ?? "application/octet-stream";
}

function safeRequestPath(requestUrl) {
  if (typeof requestUrl !== "string" || !requestUrl.startsWith("/")) {
    return null;
  }

  const queryIndex = requestUrl.indexOf("?");
  const encodedPath = queryIndex === -1
    ? requestUrl
    : requestUrl.slice(0, queryIndex);
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(encodedPath).normalize("NFC");
  } catch {
    return null;
  }

  if (
    decodedPath.includes("\\")
    || /[\u0000-\u001F\u007F]/.test(decodedPath)
    || posix.normalize(decodedPath) !== decodedPath
  ) {
    return null;
  }

  return decodedPath;
}

function sendResponse(request, response, status, headers, body) {
  const contents = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");

  response.writeHead(status, {
    "content-length": contents.length,
    ...headers
  });
  response.end(request.method === "HEAD" ? undefined : contents);
}

function sendStatus(request, response, status, message, headers = {}) {
  sendResponse(
    request,
    response,
    status,
    {
      "content-type": "text/plain; charset=utf-8",
      ...headers
    },
    message
  );
}

function addSourcePreviewRoute(routes, route, source) {
  const existingSource = routes.get(route);

  invariant(
    existingSource === undefined || existingSource === source,
    `Source preview route maps multiple files: ${route}`
  );
  routes.set(route, source);
}

function sourcePreviewRoutes(validation) {
  const routes = new Map();
  const sourceByOutput = new Map(
    validation.files.map((file) => [file.output, file.source])
  );

  for (const file of validation.files) {
    addSourcePreviewRoute(routes, `/${file.output}`, file.source);
    addSourcePreviewRoute(routes, `/${file.source}`, file.source);
  }

  for (const entry of validation.entries) {
    const sourceFile = sourceByOutput.get(entry.file);

    for (const [route, source] of sourcePreviewAliases(
      entry.file,
      sourceFile,
      validation.files
    )) {
      addSourcePreviewRoute(routes, `/${route}`, source);
    }
  }

  for (const contract of [...validation.entries, ...validation.downloads]) {
    addSourcePreviewRoute(routes, contract.path, sourceByOutput.get(contract.file));
  }

  for (const entry of validation.entries) {
    if (entry.path !== "/") {
      addSourcePreviewRoute(
        routes,
        entry.path.slice(0, -1),
        sourceByOutput.get(entry.file)
      );
    }
  }

  return routes;
}

function listen(server, port) {
  return new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
}

function runningServer(server, label) {
  const address = server.address();
  invariant(address && typeof address === "object", `${label} did not expose an address.`);

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close((error) => error ? rejectClose(error) : resolveClose());
    })
  };
}

export async function startSourcePreviewServer({ manifest = null, port = 0 } = {}) {
  invariant(
    Number.isInteger(port) && port >= 0 && port <= 65535,
    `Source preview port must be an integer from 0 through 65535: ${port}`
  );

  const deploymentManifest = manifest ?? await readDeploymentManifest();
  const validation = await validateDeploymentManifest(deploymentManifest);
  const routes = sourcePreviewRoutes(validation);

  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        sendStatus(request, response, 405, "Method Not Allowed", {
          allow: "GET, HEAD"
        });
        return;
      }

      const requestPath = safeRequestPath(request.url);
      if (requestPath === null) {
        sendStatus(request, response, 400, "Bad Request");
        return;
      }

      const source = routes.get(requestPath);
      if (!source) {
        sendStatus(request, response, 404, "Not Found");
        return;
      }

      const contents = await readFile(toLocalPath(source));
      sendResponse(
        request,
        response,
        200,
        { "content-type": contentType(source) },
        contents
      );
    } catch {
      sendStatus(request, response, 500, "Internal Server Error");
    }
  });

  await listen(server, port);
  return runningServer(server, "Local source preview server");
}

export async function startDistServer() {
  const artifactFiles = new Set(await listTreeFiles(distRoot));

  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        sendStatus(request, response, 405, "Method Not Allowed", {
          allow: "GET, HEAD"
        });
        return;
      }

      const requestPath = safeRequestPath(request.url);
      if (requestPath === null) {
        sendStatus(request, response, 400, "Bad Request");
        return;
      }

      const relativePath = requestPath.replace(/^\/+/, "");
      const candidates = relativePath === ""
        ? ["index.html"]
        : requestPath.endsWith("/")
          ? [posix.join(relativePath, "index.html")]
          : [relativePath, posix.join(relativePath, "index.html")];
      const file = candidates.find((candidate) => artifactFiles.has(candidate));

      if (!file) {
        sendStatus(request, response, 404, "Not Found");
        return;
      }

      const contents = await readFile(resolve(distRoot, ...file.split("/")));
      sendResponse(
        request,
        response,
        200,
        { "content-type": contentType(file) },
        contents
      );
    } catch {
      sendStatus(request, response, 500, "Internal Server Error");
    }
  });

  await listen(server, 0);
  return runningServer(server, "Local dist server");
}

async function fetchWithoutRedirect(url) {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 20000);

  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: abortController.signal
    });

    return {
      bytes: Buffer.from(await response.arrayBuffer()),
      location: response.headers.get("location"),
      status: response.status
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function assertPublishedFile(baseUrl, contract, outputRoot, search = "") {
  const requestUrl = new URL(contract.path, `${baseUrl}/`);
  requestUrl.search = search;
  const expectedPath = contract.path.normalize("NFC");
  const requestedPath = decodeURIComponent(requestUrl.pathname).normalize("NFC");
  invariant(requestedPath === expectedPath, `Public path changed while constructing request: ${contract.path}`);

  const response = await fetchWithoutRedirect(requestUrl);
  invariant(
    response.status === 200,
    `Expected HTTP 200 for ${requestUrl.href}, received ${response.status}${response.location ? ` -> ${response.location}` : ""}.`
  );
  invariant(!response.location, `Unexpected redirect for ${requestUrl.href}: ${response.location}`);

  const expectedBytes = await readFile(resolve(outputRoot, ...contract.file.split("/")));
  invariant(
    response.bytes.equals(expectedBytes),
    `Published bytes differ from dist/${contract.file} at ${requestUrl.href}.`
  );

  return requestUrl;
}

export async function verifyPublishedTree(baseUrl, manifest, outputRoot = distRoot) {
  const normalizedBaseUrl = new URL(baseUrl).origin;
  const contracts = [...publicEntries(manifest), ...publicDownloads(manifest)];
  const validation = await validateDeploymentManifest(manifest);
  const contractFiles = new Set(contracts.map(({ file }) => file));
  const supportingFiles = validation.files.filter(
    ({ output }) => !contractFiles.has(output)
  );
  let encodedAccentedPaths = 0;

  for (const contract of contracts) {
    const requestUrl = await assertPublishedFile(normalizedBaseUrl, contract, outputRoot);
    if (/[^\x00-\x7F]/.test(contract.path)) {
      invariant(
        /%[0-9A-F]{2}/i.test(requestUrl.pathname),
        `Accented public path was not URL-encoded: ${contract.path}`
      );
      encodedAccentedPaths += 1;
    }
  }

  const slashCompatibilityEntries = publicEntries(manifest).filter(
    ({ path: publicPath }) => publicPath !== "/"
  );
  for (const entry of slashCompatibilityEntries) {
    const search = "?navigation_probe=slash_compatibility";
    await assertPublishedFile(normalizedBaseUrl, entry, outputRoot, search);
    await assertPublishedFile(
      normalizedBaseUrl,
      { ...entry, path: entry.path.slice(0, -1) },
      outputRoot,
      search
    );
  }

  const conectaEntry = publicEntries(manifest).find(
    (entry) => entry.path === "/conecta/cadastro-recomendacoes/"
  );
  invariant(conectaEntry, "Manifest is missing the Machado Conecta entry route.");
  const conectaUrl = new URL(conectaEntry.path, `${normalizedBaseUrl}/`);
  conectaUrl.searchParams.set("ncr", "Lucas Machado");
  conectaUrl.searchParams.set("eb", "Empresa Beneficiária");
  const conectaResponse = await fetchWithoutRedirect(conectaUrl);
  invariant(
    conectaResponse.status === 200,
    `Expected HTTP 200 for encoded Conecta query URL, received ${conectaResponse.status}.`
  );
  invariant(!conectaResponse.location, `Unexpected redirect for encoded Conecta query URL: ${conectaResponse.location}`);
  const conectaBytes = await readFile(resolve(outputRoot, ...conectaEntry.file.split("/")));
  invariant(
    conectaResponse.bytes.equals(conectaBytes),
    "Published Conecta query route differs from its dist entry file."
  );

  for (const file of supportingFiles) {
    await assertPublishedFile(
      normalizedBaseUrl,
      { path: `/${file.output}`, file: file.output },
      outputRoot
    );
  }

  const expectedNotFound = [...manifest.notFoundPaths, ...manifest.repositoryOnlyPaths];
  for (const publicPath of expectedNotFound) {
    const requestUrl = new URL(publicPath, `${normalizedBaseUrl}/`);
    const response = await fetchWithoutRedirect(requestUrl);
    invariant(
      response.status === 404,
      `Expected HTTP 404 for ${requestUrl.href}, received ${response.status}${response.location ? ` -> ${response.location}` : ""}.`
    );
    invariant(!response.location, `Unexpected redirect for expected 404 ${requestUrl.href}: ${response.location}`);
  }

  return {
    publicFiles: contracts.length,
    pageRoutes: publicEntries(manifest).length,
    downloads: publicDownloads(manifest).length,
    encodedAccentedPaths,
    conectaQueryRoutes: 1,
    slashCompatibilityPairs: slashCompatibilityEntries.length,
    notFoundPaths: expectedNotFound.length,
    supportingFiles: supportingFiles.length
  };
}
