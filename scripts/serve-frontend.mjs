import {
  startSourcePreviewServer
} from "./frontend-deployment-lib.mjs";

const portFlag = process.argv.indexOf("--port");
const portValue = portFlag === -1 ? "4173" : process.argv[portFlag + 1];
const port = Number(portValue);

if (
  portValue === undefined
  || !Number.isInteger(port)
  || port < 1
  || port > 65535
) {
  throw new Error("Usage: node scripts/serve-frontend.mjs [--port <1-65535>]");
}

const server = await startSourcePreviewServer({ port });

async function close() {
  await server.close();
  process.exitCode = 0;
}

process.once("SIGINT", close);
process.once("SIGTERM", close);

console.log(`Serving manifest-mapped frontend sources at ${server.baseUrl}`);
