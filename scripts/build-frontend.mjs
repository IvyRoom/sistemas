import {
  buildDist
} from "./frontend-deployment-lib.mjs";

const result = await buildDist();

console.log(
  `Built dist/: ${result.stats.files} files, ${result.stats.bytes} bytes, sha256:${result.stats.digest}`
);
