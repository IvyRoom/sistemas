import { lstat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  assertArtifactMatchesSources,
  assertLocalReferences,
  assertReadmeContract,
  assertSourcePreviewReferences,
  buildDist,
  distRoot,
  readDeploymentManifest,
  startDistServer,
  treeDigest,
  verifyPublishedTree
} from "./frontend-deployment-lib.mjs";

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

const manifest = await readDeploymentManifest();
const firstArtifact = await assertArtifactMatchesSources(manifest);
const firstDigest = await treeDigest(distRoot);
const stalePath = resolve(distRoot, "stale-artifact-check.txt");
await writeFile(stalePath, "This file must not survive a rebuild.\n");

const repeatedBuild = await buildDist(manifest);
if (await pathExists(stalePath)) {
  throw new Error("Repeated build did not remove stale dist output.");
}

if (firstDigest.digest !== repeatedBuild.stats.digest) {
  throw new Error(
    `Repeated build was not deterministic: ${firstDigest.digest} !== ${repeatedBuild.stats.digest}`
  );
}

const finalArtifact = await assertArtifactMatchesSources(manifest);
const readmeContract = await assertReadmeContract(manifest);
const sourcePreviewReferences = await assertSourcePreviewReferences(manifest);
const localReferences = await assertLocalReferences();
const server = await startDistServer();
let localRoutes;

try {
  localRoutes = await verifyPublishedTree(server.baseUrl, manifest);
} finally {
  await server.close();
}

console.log(
  [
    `Validated dist/: ${finalArtifact.stats.files} tracked files`,
    `${finalArtifact.stats.bytes} bytes`,
    `sha256:${finalArtifact.stats.digest}`,
    `${readmeContract.entries} page routes`,
    `${readmeContract.downloads} downloads`,
    `${sourcePreviewReferences.htmlReferences} source-preview HTML assets`,
    `${sourcePreviewReferences.cssReferences} source-preview CSS assets`,
    `${localReferences.htmlReferences} local HTML references`,
    `${localReferences.cssReferences} local CSS references`,
    `${localRoutes.encodedAccentedPaths} URL-encoded accented paths`,
    `${localRoutes.redirects} canonical redirects`,
    `${localRoutes.notFoundPaths} expected 404 paths`,
    `deterministic rebuild from sha256:${firstArtifact.stats.digest}`
  ].join(", ")
);
