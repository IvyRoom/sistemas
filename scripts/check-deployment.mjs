import {
  assertArtifactMatchesSources,
  readDeploymentManifest,
  validateDeploymentManifest,
  verifyPublishedTree
} from "./frontend-deployment-lib.mjs";

const baseUrlFlag = process.argv.indexOf("--base-url");
if (baseUrlFlag === -1 || !process.argv[baseUrlFlag + 1]) {
  throw new Error("Usage: node scripts/check-deployment.mjs --base-url <https://preview-host>");
}

const manifest = await readDeploymentManifest();
await validateDeploymentManifest(manifest);
await assertArtifactMatchesSources(manifest);
const result = await verifyPublishedTree(process.argv[baseUrlFlag + 1], manifest);

console.log(
  [
    `Validated ${new URL(process.argv[baseUrlFlag + 1]).origin}`,
    `${result.pageRoutes} page routes`,
    `${result.downloads} downloads`,
    `${result.supportingFiles} supporting files`,
    `${result.encodedAccentedPaths} URL-encoded accented paths`,
    `${result.conectaQueryRoutes} encoded Conecta query route`,
    `${result.slashCompatibilityPairs} slashless/trailing-slash query pairs`,
    `${result.notFoundPaths} expected 404 paths`
  ].join(", ")
);
