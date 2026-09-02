import { resolve } from "node:path";
import { updateFaceSdkVendor } from "./face-sdk-vendor-lib.mjs";

function readArguments(argumentsList) {
  const values = new Map();
  for (let index = 0; index < argumentsList.length; index += 2) {
    const flag = argumentsList[index];
    const value = argumentsList[index + 1];
    if (!flag?.startsWith("--") || value === undefined || value.startsWith("--")) {
      throw new Error(
        "Usage: node scripts/update-face-sdk-vendor.mjs --package-root <path> --target-version <version> --repository-root <path>"
      );
    }
    if (values.has(flag)) throw new Error(`Duplicate argument: ${flag}`);
    values.set(flag, value);
  }
  const supported = new Set([
    "--package-root",
    "--target-version",
    "--repository-root"
  ]);
  for (const flag of values.keys()) {
    if (!supported.has(flag)) throw new Error(`Unsupported argument: ${flag}`);
  }
  if (
    !values.has("--package-root")
    || !values.has("--target-version")
    || !values.has("--repository-root")
  ) {
    throw new Error(
      "Usage: node scripts/update-face-sdk-vendor.mjs --package-root <path> --target-version <version> --repository-root <path>"
    );
  }
  return {
    packageRoot: resolve(values.get("--package-root")),
    targetVersion: values.get("--target-version"),
    repository: resolve(values.get("--repository-root"))
  };
}

const options = readArguments(process.argv.slice(2));
const manifest = await updateFaceSdkVendor(options);
console.log(JSON.stringify({
  version: manifest.version,
  files: manifest.tree.files,
  bytes: manifest.tree.bytes,
  sha256: manifest.tree.digest
}));
