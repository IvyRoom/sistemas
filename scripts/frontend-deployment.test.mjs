import assert from "node:assert/strict";
import test from "node:test";
import {
  assertReadmeContract,
  extractCssReferences,
  extractHtmlReferences,
  publicDownloads,
  publicEntries,
  readDeploymentManifest,
  validateDeploymentManifest
} from "./frontend-deployment-lib.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("real deployment manifest defines the reviewed route contract", async () => {
  const manifest = await readDeploymentManifest();
  const validation = await validateDeploymentManifest(manifest);

  assert.equal(publicEntries(manifest).length, 13);
  assert.equal(publicDownloads(manifest).length, 3);
  assert.equal(validation.files.length, 227);
  assert.deepEqual(
    validation.files.find((file) => file.output === "conecta/index.html"),
    {
      applicationId: "conecta-referral-form",
      source: "apps/conecta/referral-form/index.html",
      output: "conecta/index.html"
    }
  );
  assert.deepEqual(
    await assertReadmeContract(manifest),
    { entries: 13, downloads: 3 }
  );

  const accentedPaths = publicEntries(manifest)
    .map((entry) => entry.path)
    .filter((path) => /[^\x00-\x7F]/.test(path));
  assert.deepEqual(accentedPaths, ["/solicitação/", "/confirmação/"]);

  for (const path of accentedPaths) {
    const encodedPath = new URL(path, manifest.canonicalOrigin).pathname;
    assert.match(encodedPath, /%[0-9A-F]{2}/i);
    assert.equal(decodeURIComponent(encodedPath), path);
  }
});

test("manifest validation rejects a missing source", async () => {
  const manifest = clone(await readDeploymentManifest());
  manifest.applications[0].mappings[0].source = "missing-source.html";

  await assert.rejects(
    validateDeploymentManifest(manifest),
    /source does not exist: missing-source\.html/
  );
});

test("manifest validation rejects overlapping destinations", async () => {
  const manifest = clone(await readDeploymentManifest());
  manifest.applications[1].mappings[0].output = "principal/quote-request";

  await assert.rejects(
    validateDeploymentManifest(manifest),
    /Overlapping output destinations: principal and principal\/quote-request/
  );
});

test("manifest validation rejects duplicate public routes", async () => {
  const manifest = clone(await readDeploymentManifest());
  manifest.applications[1].publicEntries[0].path = "/";

  await assert.rejects(
    validateDeploymentManifest(manifest),
    /Duplicate public path: \//
  );
});

test("HTML and CSS reference extractors preserve encoded local references", () => {
  assert.deepEqual(
    extractHtmlReferences(
      '<link href="/solicita%C3%A7%C3%A3o/style.css"><img src="../img/LOGO.png"><base href="/ignored/">'
    ),
    [
      {
        tag: "link",
        attribute: "href",
        value: "/solicita%C3%A7%C3%A3o/style.css"
      },
      {
        tag: "img",
        attribute: "src",
        value: "../img/LOGO.png"
      },
      {
        tag: "base",
        attribute: "href",
        value: "/ignored/"
      }
    ]
  );
  assert.deepEqual(
    extractCssReferences(
      'background: url("../img/LOGO.png"); mask: url(data:image/svg+xml;base64,abc);'
    ),
    ["../img/LOGO.png", "data:image/svg+xml;base64,abc"]
  );
});
