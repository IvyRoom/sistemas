import { checkFaceSdkVendor } from "./face-sdk-vendor-lib.mjs";

const { manifest, snapshot } = await checkFaceSdkVendor();
console.log(
  `Validated vendored Face SDK ${manifest.version}: ${snapshot.tree.files} files, ${snapshot.tree.bytes} bytes, sha256:${snapshot.tree.digest}`
);
