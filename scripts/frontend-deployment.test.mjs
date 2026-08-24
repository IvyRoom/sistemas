import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { request as httpRequest } from "node:http";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import {
  assertLocalReferences,
  assertReadmeContract,
  assertSourcePreviewReferences,
  compareSourcePreviewReference,
  extractCssReferences,
  extractHtmlReferences,
  extractJavaScriptImportReferences,
  publicDownloads,
  publicEntries,
  readDeploymentManifest,
  repositoryRoot,
  startSourcePreviewServer,
  validateDeploymentManifest
} from "./frontend-deployment-lib.mjs";

const marketingModuleFilenames = [
  "elements.js",
  "scroll-behavior.js",
  "media.js",
  "scroll-state.js",
  "sections.js",
  "testimonials.js"
];

const maintainedNonPlatformApplicationIds = [
  "marketing-site",
  "quote-request",
  "client-intake",
  "certificate-validation",
  "conecta-referral-form"
];
const learningPlatformEntries = [
  { sourceDirectory: "device-warning", publicSuffix: "aviso-dispositivo" },
  { sourceDirectory: "browser-warning", publicSuffix: "aviso-navegador" },
  { sourceDirectory: "initial-notices", publicSuffix: "avisos-iniciais" },
  { sourceDirectory: "photo-registration", publicSuffix: "cadastro" },
  { sourceDirectory: "course-content", publicSuffix: "estudo" },
  { sourceDirectory: "login", publicSuffix: "login" },
  { sourceDirectory: "status-report", publicSuffix: "statusreport" }
];
const retiredLearningPlatformPaths = [
  "/plataforma_v2/",
  ...learningPlatformEntries.map(
    ({ publicSuffix }) => `/plataforma_v2/${publicSuffix}/`
  )
];

const mappedTextExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".svg"
]);

async function readMarketingJavaScript() {
  const [entrySource, ...moduleSources] = await Promise.all([
    readFile(new URL("../apps/marketing-site/main.js", import.meta.url), "utf8"),
    ...marketingModuleFilenames.map((filename) =>
      readFile(
        new URL(`../apps/marketing-site/modules/${filename}`, import.meta.url),
        "utf8"
      )
    )
  ]);

  return {
    entrySource,
    moduleSources: new Map(
      marketingModuleFilenames.map((filename, index) => [filename, moduleSources[index]])
    ),
    source: moduleSources.join("\n")
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readGitAttributes(paths) {
  const output = execFileSync(
    "git",
    ["check-attr", "-z", "text", "eol", "--stdin"],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      input: `${paths.join("\0")}\0`,
      windowsHide: true
    }
  );
  const fields = output.split("\0").filter(Boolean);
  const attributesByPath = new Map(paths.map((path) => [path, {}]));

  assert.equal(fields.length, paths.length * 6);
  for (let index = 0; index < fields.length; index += 3) {
    const [path, attribute, value] = fields.slice(index, index + 3);
    attributesByPath.get(path)[attribute] = value;
  }

  return attributesByPath;
}

function requestPreview(baseUrl, path, method = "GET") {
  const serverUrl = new URL(baseUrl);

  return new Promise((resolveRequest, rejectRequest) => {
    const request = httpRequest(
      {
        hostname: serverUrl.hostname,
        method,
        path,
        port: serverUrl.port
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          resolveRequest({
            body: Buffer.concat(chunks),
            headers: response.headers,
            status: response.statusCode
          });
        });
      }
    );

    request.on("error", rejectRequest);
    request.end();
  });
}

async function readEarlyInlineScript(relativePath) {
  const html = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const inlineScript = html.match(/<script>\s*([\s\S]*?)<\/script>/);

  assert.ok(inlineScript);
  assert.ok(inlineScript.index < html.indexOf("<link"));

  return inlineScript[1];
}

function runLocationNormalizer(inlineScript, { pathname, search = "", hash = "" }) {
  let replacement = null;
  const location = {
    hash,
    pathname,
    replace(value) {
      replacement = value;
    },
    search
  };

  runInNewContext(inlineScript, { window: { location } });

  return replacement;
}

test("deployment inventory exhaustively separates maintained frontends from the learning platform", async () => {
  const manifest = await readDeploymentManifest();

  await validateDeploymentManifest(manifest);

  const nonPlatformApplications = manifest.applications.filter(
    ({ id }) => id !== "learning-platform"
  );
  assert.deepEqual(
    nonPlatformApplications.map(({ id }) => id).sort(),
    [...maintainedNonPlatformApplicationIds].sort()
  );

  for (const application of nonPlatformApplications) {
    for (const mapping of application.mappings) {
      assert.match(
        mapping.source,
        /^apps\/.+/,
        `${application.id} must be sourced only from apps/**`
      );
    }
  }

  const learningPlatformApplications = manifest.applications.filter(
    ({ id }) => id === "learning-platform"
  );
  assert.equal(learningPlatformApplications.length, 1);

  const [learningPlatform] = learningPlatformApplications;
  assert.deepEqual(learningPlatform.mappings, [
    {
      source: "apps/learning-platform/device-warning",
      output: "plataforma/aviso-dispositivo"
    },
    {
      source: "apps/learning-platform/browser-warning",
      output: "plataforma/aviso-navegador"
    },
    {
      source: "apps/learning-platform/initial-notices",
      output: "plataforma/avisos-iniciais"
    },
    {
      source: "apps/learning-platform/photo-registration",
      output: "plataforma/cadastro"
    },
    {
      source: "apps/learning-platform/course-content",
      output: "plataforma/estudo"
    },
    {
      source: "apps/learning-platform/login",
      output: "plataforma/login"
    },
    {
      source: "apps/learning-platform/status-report",
      output: "plataforma/statusreport"
    },
    {
      source: "apps/learning-platform/modules",
      output: "plataforma/modules"
    },
    {
      source: "apps/learning-platform/azure-ai-vision-face-ui",
      output: "plataforma/azure-ai-vision-face-ui"
    }
  ]);
  assert.deepEqual(learningPlatform.publicEntries, [
    {
      path: "/plataforma/aviso-dispositivo/",
      file: "plataforma/aviso-dispositivo/index.html"
    },
    {
      path: "/plataforma/aviso-navegador/",
      file: "plataforma/aviso-navegador/index.html"
    },
    {
      path: "/plataforma/avisos-iniciais/",
      file: "plataforma/avisos-iniciais/index.html"
    },
    {
      path: "/plataforma/cadastro/",
      file: "plataforma/cadastro/index.html"
    },
    {
      path: "/plataforma/estudo/",
      file: "plataforma/estudo/index.html"
    },
    {
      path: "/plataforma/login/",
      file: "plataforma/login/index.html"
    },
    {
      path: "/plataforma/statusreport/",
      file: "plataforma/statusreport/index.html"
    }
  ]);
});

test("mapped text uses LF and binary assets opt out of text normalization", async () => {
  const manifest = await readDeploymentManifest();
  const validation = await validateDeploymentManifest(manifest);
  const sources = validation.files.map(({ source }) => source);
  const attributesByPath = readGitAttributes(sources);

  for (const source of sources) {
    const attributes = attributesByPath.get(source);

    if (!mappedTextExtensions.has(extname(source).toLowerCase())) {
      assert.equal(
        attributes.text,
        "unset",
        `${source} must be explicitly classified as binary`
      );
      continue;
    }

    assert.notEqual(
      attributes.text,
      "unset",
      `${source} must be classified as text`
    );
    assert.equal(attributes.eol, "lf", `${source} must be checked out with LF`);

    const contents = await readFile(join(repositoryRoot, ...source.split("/")));
    assert.equal(
      contents.includes(13),
      false,
      `${source} must not contain CRLF or mixed line endings`
    );
  }
});

test("real deployment manifest defines the reviewed route contract", async () => {
  const manifest = await readDeploymentManifest();
  const validation = await validateDeploymentManifest(manifest);

  assert.equal(publicEntries(manifest).length, 12);
  assert.equal(publicDownloads(manifest).length, 3);
  assert.deepEqual(
    publicDownloads(manifest),
    [
      {
        path: "/landing-page/pdf/EMENTA E SOFTWARES.pdf",
        file: "landing-page/pdf/EMENTA E SOFTWARES.pdf"
      },
      {
        path: "/landing-page/pdf/BIBLIOGRAFIA.pdf",
        file: "landing-page/pdf/BIBLIOGRAFIA.pdf"
      },
      {
        path: "/landing-page/pdf/CRONOGRAMA.pdf",
        file: "landing-page/pdf/CRONOGRAMA.pdf"
      }
    ]
  );
  assert.equal(validation.files.length, 257);
  assert.deepEqual(
    validation.mappings.filter(
      (mapping) => mapping.applicationId === "marketing-site"
    ),
    [
      {
        applicationId: "marketing-site",
        source: "apps/marketing-site/index.html",
        output: "index.html",
        sourceType: "file"
      },
      {
        applicationId: "marketing-site",
        source: "apps/marketing-site/style.css",
        output: "landing-page/style.css",
        sourceType: "file"
      },
      {
        applicationId: "marketing-site",
        source: "apps/marketing-site/main.js",
        output: "landing-page/main.js",
        sourceType: "file"
      },
      {
        applicationId: "marketing-site",
        source: "apps/marketing-site/modules",
        output: "landing-page/modules",
        sourceType: "directory"
      },
      {
        applicationId: "marketing-site",
        source: "apps/marketing-site/img",
        output: "landing-page/img",
        sourceType: "directory"
      },
      {
        applicationId: "marketing-site",
        source: "apps/marketing-site/pdf",
        output: "landing-page/pdf",
        sourceType: "directory"
      }
    ]
  );
  assert.deepEqual(
    validation.mappings.filter(
      (mapping) => mapping.applicationId === "quote-request"
    ),
    [
      {
        applicationId: "quote-request",
        source: "apps/quote-request",
        output: "solicitacao-orcamento",
        sourceType: "directory"
      }
    ]
  );
  assert.deepEqual(
    validation.mappings.find(
      (mapping) => mapping.applicationId === "client-intake"
    ),
    {
      applicationId: "client-intake",
      source: "apps/client-intake",
      output: "formulario-informacoes-iniciais",
      sourceType: "directory"
    }
  );
  assert.deepEqual(
    validation.files.find(
      (file) => file.output === "formulario-informacoes-iniciais/index.html"
    ),
    {
      applicationId: "client-intake",
      source: "apps/client-intake/index.html",
      output: "formulario-informacoes-iniciais/index.html"
    }
  );
  assert.deepEqual(
    validation.entries.find(
      (entry) => entry.applicationId === "client-intake"
    ),
    {
      applicationId: "client-intake",
      path: "/formulario-informacoes-iniciais/",
      file: "formulario-informacoes-iniciais/index.html"
    }
  );
  assert.deepEqual(
    validation.files.find(
      (file) => file.output === "conecta/cadastro-recomendacoes/index.html"
    ),
    {
      applicationId: "conecta-referral-form",
      source: "apps/referrals-management/referral-form/index.html",
      output: "conecta/cadastro-recomendacoes/index.html"
    }
  );
  assert.deepEqual(
    validation.entries.find(
      (entry) => entry.applicationId === "conecta-referral-form"
    ),
    {
      applicationId: "conecta-referral-form",
      path: "/conecta/cadastro-recomendacoes/",
      file: "conecta/cadastro-recomendacoes/index.html"
    }
  );
  assert.ok(
    manifest.notFoundPaths.includes("/plataforma/"),
    "The current learning-platform root must remain an explicit 404"
  );
  for (const retiredPath of retiredLearningPlatformPaths) {
    assert.ok(
      manifest.notFoundPaths.includes(retiredPath),
      `${retiredPath} must remain an explicit retired-route 404`
    );
  }
  assert.equal(
    validation.entries.some(({ path }) => path.startsWith("/plataforma_v2/")),
    false,
    "Former learning-platform entries must not remain published"
  );
  assert.equal(
    validation.files.some(({ output }) => output.startsWith("plataforma_v2/")),
    false,
    "dist/plataforma_v2 must not be emitted"
  );
  assert.deepEqual(
    validation.files.find(
      (file) => file.output === "validacao-certificados/index.html"
    ),
    {
      applicationId: "certificate-validation",
      source: "apps/certificate-validation/index.html",
      output: "validacao-certificados/index.html"
    }
  );
  assert.deepEqual(
    validation.entries.find(
      (entry) => entry.applicationId === "certificate-validation"
    ),
    {
      applicationId: "certificate-validation",
      path: "/validacao-certificados/",
      file: "validacao-certificados/index.html"
    }
  );
  assert.ok(manifest.notFoundPaths.includes("/conecta/"));
  assert.ok(manifest.notFoundPaths.includes("/solicitação"));
  assert.ok(manifest.notFoundPaths.includes("/solicitação/"));
  assert.ok(manifest.notFoundPaths.includes("/solicitação/index.html"));
  assert.ok(manifest.notFoundPaths.includes("/confirmação"));
  assert.ok(manifest.notFoundPaths.includes("/confirmação/"));
  assert.ok(manifest.notFoundPaths.includes("/confirmação/index.html"));
  assert.ok(manifest.notFoundPaths.includes("/formulario"));
  assert.ok(manifest.notFoundPaths.includes("/formulario/"));
  assert.ok(manifest.notFoundPaths.includes("/formulario/index.html"));
  for (const retiredMarketingPath of [
    "/principal/",
    "/principal/style.css",
    "/principal/main.js",
    "/principal/img/LOGO_MACHADO.png",
    "/principal/img/CAPA_VÍDEO_PRINCIPAL.jpg",
    "/principal/pdf/EMENTA E SOFTWARES.pdf",
    "/principal/pdf/BIBLIOGRAFIA.pdf",
    "/principal/pdf/CRONOGRAMA.pdf"
  ]) {
    assert.ok(manifest.notFoundPaths.includes(retiredMarketingPath));
  }
  assert.ok(manifest.notFoundPaths.includes("/landing-page/"));
  assert.ok(manifest.notFoundPaths.includes("/validacao"));
  assert.ok(manifest.notFoundPaths.includes("/validacao/"));
  assert.ok(manifest.notFoundPaths.includes("/validacao/index.html"));
  assert.deepEqual(
    await assertReadmeContract(manifest),
    { entries: 12, downloads: 3 }
  );
  const sourcePreviewReferences = await assertSourcePreviewReferences(manifest);
  assert.ok(sourcePreviewReferences.htmlReferences > 0);
  assert.equal(sourcePreviewReferences.javascriptReferences, 69);

  const accentedPaths = publicEntries(manifest)
    .map((entry) => entry.path)
    .filter((path) => /[^\x00-\x7F]/.test(path));
  assert.deepEqual(accentedPaths, []);

  for (const path of accentedPaths) {
    const encodedPath = new URL(path, manifest.canonicalOrigin).pathname;
    assert.match(encodedPath, /%[0-9A-F]{2}/i);
    assert.equal(decodeURIComponent(encodedPath), path);
  }
});

test("source preview serves only manifest-mapped routes and files", async () => {
  const server = await startSourcePreviewServer();

  try {
    const marketingHtml = await readFile(
      new URL("../apps/marketing-site/index.html", import.meta.url)
    );
    const quoteHtml = await readFile(
      new URL("../apps/quote-request/index.html", import.meta.url)
    );
    const quoteCss = await readFile(
      new URL("../apps/quote-request/style.css", import.meta.url)
    );
    const conectaHtml = await readFile(
      new URL("../apps/referrals-management/referral-form/index.html", import.meta.url)
    );

    for (const path of [
      "/solicitacao-orcamento/",
      "/solicitacao-orcamento/?origem=site&cliente=Lucas%20Machado",
      "/solicitacao-orcamento?origem=site&cliente=Lucas%20Machado",
      "/solicitacao-orcamento/index.html",
      "/apps/quote-request/index.html?preview=source"
    ]) {
      const response = await requestPreview(server.baseUrl, path);

      assert.equal(response.status, 200, path);
      assert.equal(response.headers["content-type"], "text/html; charset=utf-8", path);
      assert.deepEqual(response.body, quoteHtml, path);
    }

    for (const path of [
      "/",
      "/index.html",
      "/apps/marketing-site/index.html"
    ]) {
      const response = await requestPreview(server.baseUrl, path);

      assert.equal(response.status, 200, path);
      assert.equal(response.headers["content-type"], "text/html; charset=utf-8", path);
      assert.deepEqual(response.body, marketingHtml, path);
    }

    for (const { sourceDirectory, publicSuffix } of learningPlatformEntries) {
      const path = `/plataforma/${publicSuffix}/`;
      const response = await requestPreview(server.baseUrl, path);
      const source = await readFile(
        new URL(
          `../apps/learning-platform/${sourceDirectory}/index.html`,
          import.meta.url
        )
      );

      assert.equal(response.status, 200, path);
      assert.equal(response.headers.location, undefined, path);
      assert.equal(response.headers["content-type"], "text/html; charset=utf-8", path);
      assert.deepEqual(response.body, source, path);
    }

    const conectaResponse = await requestPreview(
      server.baseUrl,
      "/conecta/cadastro-recomendacoes/"
    );
    assert.equal(conectaResponse.status, 200);
    assert.equal(conectaResponse.headers.location, undefined);
    assert.equal(conectaResponse.headers["content-type"], "text/html; charset=utf-8");
    assert.deepEqual(conectaResponse.body, conectaHtml);

    for (const path of ["/plataforma/", ...retiredLearningPlatformPaths]) {
      const response = await requestPreview(server.baseUrl, path);

      assert.equal(response.status, 404, path);
      assert.equal(response.headers.location, undefined, `${path} must not redirect`);
    }

    for (const asset of [
      {
        contentType: "text/css; charset=utf-8",
        paths: [
          "/landing-page/style.css",
          "/apps/marketing-site/style.css",
          "/apps/marketing-site/landing-page/style.css"
        ],
        source: "../apps/marketing-site/style.css"
      },
      {
        contentType: "text/javascript; charset=utf-8",
        paths: [
          "/landing-page/main.js",
          "/apps/marketing-site/main.js",
          "/apps/marketing-site/landing-page/main.js"
        ],
        source: "../apps/marketing-site/main.js"
      },
      ...marketingModuleFilenames.map((filename) => ({
        contentType: "text/javascript; charset=utf-8",
        paths: [
          `/landing-page/modules/${filename}`,
          `/apps/marketing-site/modules/${filename}`,
          `/apps/marketing-site/landing-page/modules/${filename}`
        ],
        source: `../apps/marketing-site/modules/${filename}`
      })),
      {
        contentType: "image/png",
        paths: [
          "/landing-page/img/LOGO_MACHADO.png",
          "/apps/marketing-site/img/LOGO_MACHADO.png",
          "/apps/marketing-site/landing-page/img/LOGO_MACHADO.png"
        ],
        source: "../apps/marketing-site/img/LOGO_MACHADO.png"
      },
      {
        contentType: "image/jpeg",
        paths: [
          "/landing-page/img/CAPA_V%C3%8DDEO_PRINCIPAL.jpg",
          "/apps/marketing-site/img/CAPA_V%C3%8DDEO_PRINCIPAL.jpg",
          "/apps/marketing-site/landing-page/img/CAPA_V%C3%8DDEO_PRINCIPAL.jpg"
        ],
        source: "../apps/marketing-site/img/CAPA_VÍDEO_PRINCIPAL.jpg"
      },
      {
        contentType: "image/x-icon",
        paths: [
          "/landing-page/img/FAVICON.ico",
          "/apps/marketing-site/img/FAVICON.ico",
          "/apps/marketing-site/landing-page/img/FAVICON.ico"
        ],
        source: "../apps/marketing-site/img/FAVICON.ico"
      },
      {
        contentType: "application/pdf",
        paths: [
          "/landing-page/pdf/EMENTA%20E%20SOFTWARES.pdf",
          "/apps/marketing-site/pdf/EMENTA%20E%20SOFTWARES.pdf",
          "/apps/marketing-site/landing-page/pdf/EMENTA%20E%20SOFTWARES.pdf"
        ],
        source: "../apps/marketing-site/pdf/EMENTA E SOFTWARES.pdf"
      },
      {
        contentType: "application/pdf",
        paths: [
          "/landing-page/pdf/BIBLIOGRAFIA.pdf",
          "/apps/marketing-site/pdf/BIBLIOGRAFIA.pdf",
          "/apps/marketing-site/landing-page/pdf/BIBLIOGRAFIA.pdf"
        ],
        source: "../apps/marketing-site/pdf/BIBLIOGRAFIA.pdf"
      },
      {
        contentType: "application/pdf",
        paths: [
          "/landing-page/pdf/CRONOGRAMA.pdf",
          "/apps/marketing-site/pdf/CRONOGRAMA.pdf",
          "/apps/marketing-site/landing-page/pdf/CRONOGRAMA.pdf"
        ],
        source: "../apps/marketing-site/pdf/CRONOGRAMA.pdf"
      }
    ]) {
      const expected = await readFile(new URL(asset.source, import.meta.url));

      for (const path of asset.paths) {
        const response = await requestPreview(server.baseUrl, path);

        assert.equal(response.status, 200, path);
        assert.equal(response.headers["content-type"], asset.contentType, path);
        assert.deepEqual(response.body, expected, path);
      }
    }

    for (const path of [
      "/solicitacao-orcamento/style.css?v=4",
      "/apps/quote-request/style.css"
    ]) {
      const response = await requestPreview(server.baseUrl, path);

      assert.equal(response.status, 200, path);
      assert.equal(response.headers["content-type"], "text/css; charset=utf-8", path);
      assert.deepEqual(response.body, quoteCss, path);
    }

    const headResponse = await requestPreview(
      server.baseUrl,
      "/solicitacao-orcamento/style.css?head=1",
      "HEAD"
    );
    assert.equal(headResponse.status, 200);
    assert.equal(headResponse.headers["content-type"], "text/css; charset=utf-8");
    assert.equal(headResponse.headers["content-length"], String(quoteCss.length));
    assert.equal(headResponse.body.length, 0);

    for (const path of [
      "/unknown/",
      "/README.md",
      "/frontend-deployment.json",
      "/scripts/serve-frontend.mjs",
      "/landing-page/",
      "/principal/",
      "/principal/style.css",
      "/principal/main.js",
      "/principal/img/LOGO_MACHADO.png",
      "/principal/img/CAPA_V%C3%8DDEO_PRINCIPAL.jpg",
      "/principal/pdf/EMENTA%20E%20SOFTWARES.pdf",
      "/principal/pdf/BIBLIOGRAFIA.pdf",
      "/principal/pdf/CRONOGRAMA.pdf",
      "/apps/marketing-site/principal/style.css",
      "/apps/marketing-site/landing-page/not-mapped.txt",
      "/landing-page/modules/not-mapped.js",
      "/apps/marketing-site/modules/not-mapped.js",
      "/apps/quote-request/not-mapped.txt"
    ]) {
      const response = await requestPreview(server.baseUrl, path);

      assert.equal(response.status, 404, path);
    }

    for (const path of [
      "/%E0%A4%A",
      "/apps/quote-request/../../README.md",
      "/apps/quote-request/%2e%2e/%2e%2e/README.md",
      "/apps/quote-request/%2e%2e%5cREADME.md"
    ]) {
      const response = await requestPreview(server.baseUrl, path);

      assert.equal(response.status, 400, path);
    }

    const postResponse = await requestPreview(
      server.baseUrl,
      "/solicitacao-orcamento/",
      "POST"
    );
    assert.equal(postResponse.status, 405);
    assert.equal(postResponse.headers.allow, "GET, HEAD");
  } finally {
    await server.close();
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
  manifest.applications[1].mappings[0].output = "landing-page/img/quote-request";

  await assert.rejects(
    validateDeploymentManifest(manifest),
    /Overlapping output destinations: landing-page\/img and landing-page\/img\/quote-request/
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

test("HTML, CSS, and JavaScript reference extractors preserve local references", () => {
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
  assert.deepEqual(
    extractJavaScriptImportReferences(`
      import'./modules/elements.js';
      import/* dependency */{
        preferredScrollBehavior
      }from"../shared/scroll-behavior.js?version=1#current";
      export{ element }from'./named.js';
      export*from"./all.js";
      export*as namespace from"../namespace.js";
      const localElement = null;
      export { localElement };
      export { bareElement } from "bare-package";
      import packageName from "package-name";
      import("./dynamic-module.js");
      import.meta.url;
      const text = "import './string-module.js'";
      const pattern = /import\\s+['\"]/;
    `),
    [
      "./modules/elements.js",
      "../shared/scroll-behavior.js?version=1#current",
      "./named.js",
      "./all.js",
      "../namespace.js"
    ]
  );
});

test("JavaScript dependency extraction ignores non-declaration property names", () => {
  assert.deepEqual(
    extractJavaScriptImportReferences(`
      const value = { import: './property.js', export: './property.js' };
      const importer = value.import;
      const exporter = value.export;
    `),
    []
  );
});

test("JavaScript dependency extraction fails closed on native parser errors", () => {
  assert.throws(
    () => extractJavaScriptImportReferences("import { element } './broken.js';"),
    /Unable to parse JavaScript module dependencies/
  );
  assert.throws(
    () => extractJavaScriptImportReferences("export * './broken.js';"),
    /Unable to parse JavaScript module dependencies/
  );
  assert.throws(
    () => extractJavaScriptImportReferences("export { element } from;"),
    /Unable to parse JavaScript module dependencies/
  );
});

test("source preview validation rejects broken mapped JavaScript imports", async () => {
  const manifest = clone(await readDeploymentManifest());
  const marketingApplication = manifest.applications.find(
    (application) => application.id === "marketing-site"
  );
  const moduleMapping = marketingApplication.mappings.find(
    (mapping) => mapping.source === "apps/marketing-site/modules"
  );
  moduleMapping.output = "landing-page/components";

  await assert.rejects(
    assertSourcePreviewReferences(manifest),
    /Broken mapped asset JavaScript import in apps\/marketing-site\/main\.js: \.\/modules\/elements\.js/
  );
});

test("generated JavaScript imports require exact files without index fallback", async (context) => {
  const artifactRoot = await mkdtemp(join(tmpdir(), "frontend-reference-test-"));
  context.after(() => rm(artifactRoot, { force: true, recursive: true }));
  const moduleRoot = join(artifactRoot, "landing-page", "modules");
  await mkdir(moduleRoot, { recursive: true });
  await Promise.all([
    writeFile(
      join(artifactRoot, "landing-page", "main.js"),
      "import './modules/elements.js';\n"
    ),
    writeFile(join(moduleRoot, "elements.js"), "export const element = {};\n"),
    writeFile(
      join(moduleRoot, "sections.js"),
      "import { element } from './elements.js';\n"
    )
  ]);

  assert.deepEqual(
    await assertLocalReferences(artifactRoot),
    { htmlReferences: 0, cssReferences: 0, javascriptReferences: 2 }
  );

  await writeFile(
    join(artifactRoot, "landing-page", "main.js"),
    "import './modules/missing.js';\n"
  );
  await mkdir(join(moduleRoot, "missing.js"));
  await writeFile(join(moduleRoot, "missing.js", "index.html"), "not a module\n");
  await assert.rejects(
    assertLocalReferences(artifactRoot),
    /Broken local JavaScript import in dist\/landing-page\/main\.js: \.\/modules\/missing\.js/
  );
});

test("source preview and deployment references resolve to the same mapped asset", () => {
  const mappedFiles = [
    {
      source: "apps/referrals-management/referral-form/style.css",
      output: "conecta/cadastro-recomendacoes/style.css"
    },
    {
      source: "shared/logo.png",
      output: "shared/logo.png"
    }
  ];

  assert.deepEqual(
    compareSourcePreviewReference(
      "./style.css?v=1#theme",
      "conecta/cadastro-recomendacoes/index.html",
      "apps/referrals-management/referral-form/index.html",
      mappedFiles
    ),
    {
      expectedSource: "apps/referrals-management/referral-form/style.css",
      matches: true,
      output: "conecta/cadastro-recomendacoes/style.css",
      sourceCandidates: [
        "apps/referrals-management/referral-form/style.css",
        "apps/referrals-management/referral-form/style.css/index.html"
      ]
    }
  );

  const flattenedMarketingFiles = [
    {
      applicationId: "marketing-site",
      source: "apps/marketing-site/index.html",
      output: "index.html"
    },
    {
      applicationId: "marketing-site",
      source: "apps/marketing-site/style.css",
      output: "landing-page/style.css"
    },
    {
      applicationId: "marketing-site",
      source: "apps/marketing-site/main.js",
      output: "landing-page/main.js"
    },
    {
      applicationId: "marketing-site",
      source: "apps/marketing-site/modules/elements.js",
      output: "landing-page/modules/elements.js"
    }
  ];
  assert.deepEqual(
    compareSourcePreviewReference(
      "./landing-page/style.css",
      "index.html",
      "apps/marketing-site/index.html",
      flattenedMarketingFiles
    ),
    {
      expectedSource: "apps/marketing-site/style.css",
      matches: true,
      output: "landing-page/style.css",
      sourceCandidates: [
        "apps/marketing-site/landing-page/style.css",
        "apps/marketing-site/landing-page/style.css/index.html"
      ]
    }
  );
  assert.equal(
    compareSourcePreviewReference(
      "/landing-page/style.css",
      "index.html",
      "apps/marketing-site/index.html",
      flattenedMarketingFiles
    ).matches,
    false
  );
  assert.deepEqual(
    compareSourcePreviewReference(
      "./modules/elements.js",
      "landing-page/main.js",
      "apps/marketing-site/main.js",
      flattenedMarketingFiles
    ),
    {
      expectedSource: "apps/marketing-site/modules/elements.js",
      matches: true,
      output: "landing-page/modules/elements.js",
      sourceCandidates: [
        "apps/marketing-site/modules/elements.js",
        "apps/marketing-site/modules/elements.js/index.html"
      ]
    }
  );

  assert.equal(
    compareSourcePreviewReference(
      "/conecta/cadastro-recomendacoes/style.css",
      "conecta/cadastro-recomendacoes/index.html",
      "apps/referrals-management/referral-form/index.html",
      mappedFiles
    ).matches,
    false
  );

  assert.equal(
    compareSourcePreviewReference(
      "/shared/logo.png",
      "conecta/cadastro-recomendacoes/index.html",
      "apps/referrals-management/referral-form/index.html",
      mappedFiles
    ).matches,
    true
  );
  assert.equal(
    compareSourcePreviewReference(
      "data:image/svg+xml;base64,abc",
      "conecta/cadastro-recomendacoes/style.css",
      "apps/referrals-management/referral-form/style.css",
      mappedFiles
    ),
    null
  );
  assert.equal(
    compareSourcePreviewReference(
      "#filter",
      "conecta/cadastro-recomendacoes/style.css",
      "apps/referrals-management/referral-form/style.css",
      mappedFiles
    ),
    null
  );
});

for (const page of [
  {
    label: "quote request",
    publicPath: "/solicitacao-orcamento",
    sourcePath: "../apps/quote-request/index.html",
    sourcePreviewPath: "/apps/quote-request/index.html"
  }
]) {
  test(`${page.label} normalizes only its slashless public route before assets load`, async () => {
    const inlineScript = await readEarlyInlineScript(page.sourcePath);
    const encodedPublicPath = new URL(
      page.publicPath,
      "https://example.com"
    ).pathname;

    for (const testCase of [
      {
        label: "slashless route",
        pathname: page.publicPath,
        expected: `${page.publicPath}/`
      },
      {
        label: "slashless URL path",
        pathname: encodedPublicPath,
        expected: `${page.publicPath}/`
      },
      {
        label: "query preservation",
        pathname: encodedPublicPath,
        search: "?origem=site&cliente=Lucas%20Machado",
        expected: `${page.publicPath}/?origem=site&cliente=Lucas%20Machado`
      },
      {
        label: "fragment preservation",
        pathname: page.publicPath,
        hash: "#detalhes",
        expected: `${page.publicPath}/#detalhes`
      },
      {
        label: "canonical route",
        pathname: `${page.publicPath}/`,
        search: "?origem=site",
        hash: "#detalhes",
        expected: null
      },
      {
        label: "percent-encoded canonical route",
        pathname: `${encodedPublicPath}/`,
        expected: null
      },
      {
        label: "explicit index",
        pathname: `${page.publicPath}/index.html`,
        expected: null
      },
      {
        label: "repository source preview",
        pathname: page.sourcePreviewPath,
        search: "?preview=source",
        hash: "#detalhes",
        expected: null
      }
    ]) {
      assert.equal(
        runLocationNormalizer(inlineScript, testCase),
        testCase.expected,
        testCase.label
      );
    }
  });
}

test("marketing internal assets are document-relative", async () => {
  const [html, marketingJavaScript] = await Promise.all([
    readFile(new URL("../apps/marketing-site/index.html", import.meta.url), "utf8"),
    readMarketingJavaScript()
  ]);
  const source = marketingJavaScript.moduleSources.get("media.js");
  const marketingAssetReferences = extractHtmlReferences(html).filter(
    ({ tag, value }) => tag !== "a" && (
      value.startsWith("/landing-page/")
      || value.startsWith("./landing-page/")
    )
  );
  const posterReference = source.match(
    /const primaryVideoPoster = '([^']+)'/
  )?.[1];

  assert.equal(marketingAssetReferences.length, 48);
  for (const reference of marketingAssetReferences) {
    assert.match(
      reference.value,
      /^\.\/landing-page\//,
      `${reference.tag} ${reference.attribute} ${reference.value}`
    );
  }
  assert.match(
    source,
    /primaryVideo\.setAttribute\('poster', primaryVideoPoster\);/
  );
  assert.doesNotMatch(
    source,
    /const primaryVideoPoster = '\/landing-page\//
  );

  assert.equal(
    posterReference,
    "./landing-page/img/CAPA_VÍDEO_PRINCIPAL.jpg"
  );
  const validation = await validateDeploymentManifest(
    await readDeploymentManifest()
  );
  const posterMapping = compareSourcePreviewReference(
    posterReference,
    "index.html",
    "apps/marketing-site/index.html",
    validation.files
  );
  assert.equal(posterMapping.output, "landing-page/img/CAPA_VÍDEO_PRINCIPAL.jpg");
  assert.equal(
    posterMapping.expectedSource,
    "apps/marketing-site/img/CAPA_VÍDEO_PRINCIPAL.jpg"
  );
  assert.equal(posterMapping.matches, true);
});

test("marketing quote CTA targets the canonical quote route", async () => {
  const [html, marketingJavaScript] = await Promise.all([
    readFile(new URL("../apps/marketing-site/index.html", import.meta.url), "utf8"),
    readMarketingJavaScript()
  ]);
  const { entrySource, source } = marketingJavaScript;

  assert.match(
    html,
    /<a id="quote-cta-link" href="\/solicitacao-orcamento\/" aria-describedby="quote-cta-context">SOLICITAR ORÇAMENTO<\/a>/
  );
  assert.doesNotMatch(entrySource, /window\.location\.href\s*=/);
  assert.doesNotMatch(source, /window\.location\.href\s*=/);
});

test("marketing PDF actions target the public download routes", async () => {
  const html = await readFile(
    new URL("../apps/marketing-site/index.html", import.meta.url),
    "utf8"
  );
  const downloadLinks = Array.from(
    html.matchAll(/<a class="pdf-download-link"[^>]+>/g),
    ([tag]) => ({
      path: tag.match(/\bhref="([^"]+)"/)?.[1],
      rel: tag.match(/\brel="([^"]+)"/)?.[1],
      target: tag.match(/\btarget="([^"]+)"/)?.[1]
    })
  );

  assert.deepEqual(
    downloadLinks.map(({ path }) => path),
    [
      "/landing-page/pdf/EMENTA E SOFTWARES.pdf",
      "/landing-page/pdf/BIBLIOGRAFIA.pdf",
      "/landing-page/pdf/CRONOGRAMA.pdf"
    ]
  );
  for (const link of downloadLinks) {
    assert.equal(link.target, "_blank");
    assert.ok(link.rel.split(/\s+/).includes("noopener"));
  }
});

async function runQuoteSubmission({ presentationError = null, responseOk }) {
  const source = await readFile(
    new URL("../apps/quote-request/main.js", import.meta.url),
    "utf8"
  );
  const elements = new Map();
  const listeners = new Map();
  let alertMessage = null;
  const consoleErrors = [];
  let successFocusOptions = null;
  let successScrollOptions = null;

  function createClassList() {
    const classes = new Set();

    return {
      add(...values) {
        values.forEach((value) => classes.add(value));
      },
      contains(value) {
        return classes.has(value);
      },
      remove(...values) {
        values.forEach((value) => classes.delete(value));
      },
      toggle(value, force) {
        if (force) classes.add(value);
        else classes.delete(value);
      }
    };
  }

  function createElement(id) {
    const attributes = new Map();

    return {
      addEventListener(type, listener) {
        listeners.set(`${id}:${type}`, listener);
      },
      classList: createClassList(),
      disabled: false,
      focus(options) {
        if (id === "form-success") {
          if (presentationError === "focus") throw new Error("Focus unavailable");
          successFocusOptions = options;
        }
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      hidden: id === "email-mismatch-warning",
      reportValidity() {
        return true;
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      setCustomValidity() {},
      textContent: "",
      value: ""
    };
  }

  const document = {
    body: { classList: createClassList() },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement(id));

      return elements.get(id);
    }
  };
  let fetchCalls = 0;
  let defaultPrevented = false;
  const initialUrl = "https://example.com/solicitacao-orcamento/?origem=teste#detalhes";
  const window = {
    clearTimeout() {},
    location: {
      hostname: "example.com",
      href: initialUrl
    },
    matchMedia(query) {
      assert.equal(query, "(prefers-reduced-motion: reduce)");
      return { matches: false };
    },
    scrollTo(options) {
      if (presentationError === "scroll") throw new Error("Scroll unavailable");
      successScrollOptions = options;
    },
    setTimeout() {
      return 1;
    }
  };

  runInNewContext(source, {
    AbortController,
    alert(message) {
      alertMessage = message;
    },
    console: {
      error(...args) {
        consoleErrors.push(args);
      }
    },
    document,
    fetch: async () => {
      fetchCalls += 1;
      return {
        ok: responseOk,
        status: responseOk ? 200 : 500
      };
    },
    window
  });

  Object.entries({
    "company-cnpj": "11.222.333/0001-81",
    "company-name": "Empresa Exemplo",
    "email-confirm": "lucas@example.com",
    email: "lucas@example.com",
    "full-name": "Lucas Machado",
    notes: "",
    "participant-count": "5",
    phone: "(11) 98765-4321",
    role: "Diretor"
  }).forEach(([id, value]) => {
    document.getElementById(id).value = value;
  });

  const submit = listeners.get("quote-form:submit");

  assert.ok(submit);
  await submit({
    preventDefault() {
      defaultPrevented = true;
    }
  });

  return {
    alertMessage,
    consoleErrors,
    defaultPrevented,
    document,
    elements,
    fetchCalls,
    initialUrl,
    successFocusOptions,
    successScrollOptions,
    window
  };
}

test("successful quote submission shows the inline success state without navigating", async () => {
  const html = await readFile(
    new URL("../apps/quote-request/index.html", import.meta.url),
    "utf8"
  );
  const css = await readFile(
    new URL("../apps/quote-request/style.css", import.meta.url),
    "utf8"
  );
  const result = await runQuoteSubmission({ responseOk: true });

  assert.equal(result.alertMessage, null);
  assert.equal(result.consoleErrors.length, 0);
  assert.equal(result.defaultPrevented, true);
  assert.equal(result.fetchCalls, 1);
  assert.equal(result.window.location.href, result.initialUrl);
  assert.equal(
    result.elements.get("quote-form").classList.contains("quote-form--submitted"),
    true
  );
  assert.equal(result.elements.get("submit-button").disabled, false);
  assert.equal(result.elements.get("submit-label").textContent, "SOLICITAR ORÇAMENTO");
  assert.equal(result.elements.get("quote-form").getAttribute("aria-busy"), "false");
  assert.equal(result.document.body.classList.contains("is-submitting"), false);
  assert.equal(result.successFocusOptions.preventScroll, true);
  assert.equal(result.successScrollOptions.top, 0);
  assert.equal(result.successScrollOptions.behavior, "smooth");
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<form class="quote-form" id="quote-form" action="#" method="post" novalidate>/);
  assert.match(html, /id="email" name="email" type="email"/);
  assert.match(html, /id="email-confirm" name="email-confirm" type="email"/);
  assert.match(html, /id="form-success" role="status"/);
  assert.match(html, /id="submission-status" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /tabindex="-1"/);
  assert.match(html, /Solicitação enviada com sucesso!/);
  assert.match(html, /Basta aguardar\. Logo entraremos em contato\./);
  assert.equal((html.match(/<button\b/g) || []).length, 1);
  assert.match(
    css,
    /body\.is-submitting,\s*body\.is-submitting \*\s*{[^}]*cursor:\s*wait !important;/s
  );
  assert.match(css, /--color-input-text:\s*#000000;/);
  assert.match(
    css,
    /\.form-section--company\s*{[^}]*margin-top:\s*var\(--space-lg\);/s
  );
  assert.match(
    css,
    /\.text-input\s*{[^}]*color:\s*var\(--color-input-text\);/s
  );
  assert.match(
    css,
    /\.submit-button:disabled\s*{[^}]*color:\s*var\(--color-text-accent\);[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s
  );
  assert.match(
    css,
    /\.quote-form--submitted\s*{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*display:\s*flex;[^}]*align-items:\s*center;/s
  );
});

test("failed quote submission restores the form controls", async () => {
  const result = await runQuoteSubmission({ responseOk: false });

  assert.equal(result.consoleErrors.length, 1);
  assert.equal(result.defaultPrevented, true);
  assert.equal(result.fetchCalls, 1);
  assert.equal(result.window.location.href, result.initialUrl);
  assert.equal(
    result.elements.get("quote-form").classList.contains("quote-form--submitted"),
    false
  );
  assert.equal(result.elements.get("submit-button").disabled, false);
  assert.equal(result.elements.get("submit-label").textContent, "SOLICITAR ORÇAMENTO");
  assert.equal(result.elements.get("quote-form").getAttribute("aria-busy"), "false");
  assert.equal(result.document.body.classList.contains("is-submitting"), false);
  assert.equal(result.successFocusOptions, null);
  assert.equal(result.successScrollOptions, null);
  assert.equal(
    result.alertMessage,
    "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."
  );
});

test("success presentation errors do not report an accepted quote as a transport failure", async () => {
  const result = await runQuoteSubmission({
    presentationError: "focus",
    responseOk: true
  });

  assert.equal(result.alertMessage, null);
  assert.equal(result.consoleErrors.length, 1);
  assert.equal(
    result.elements.get("quote-form").classList.contains("quote-form--submitted"),
    true
  );
  assert.equal(result.elements.get("submit-button").disabled, false);
  assert.equal(result.elements.get("submit-label").textContent, "SOLICITAR ORÇAMENTO");
  assert.equal(result.document.body.classList.contains("is-submitting"), false);
  assert.equal(result.successFocusOptions, null);
  assert.equal(result.successScrollOptions.top, 0);
  assert.equal(result.successScrollOptions.behavior, "smooth");
});

test("success scroll errors do not report an accepted quote as a transport failure", async () => {
  const result = await runQuoteSubmission({
    presentationError: "scroll",
    responseOk: true
  });

  assert.equal(result.alertMessage, null);
  assert.equal(result.consoleErrors.length, 1);
  assert.equal(
    result.elements.get("quote-form").classList.contains("quote-form--submitted"),
    true
  );
  assert.equal(result.elements.get("submit-button").disabled, false);
  assert.equal(result.elements.get("submit-label").textContent, "SOLICITAR ORÇAMENTO");
  assert.equal(result.document.body.classList.contains("is-submitting"), false);
  assert.equal(result.successFocusOptions.preventScroll, true);
  assert.equal(result.successScrollOptions, null);
});

test("client intake normalizes only its slashless public route before assets load", async () => {
  const html = await readFile(
    new URL("../apps/client-intake/index.html", import.meta.url),
    "utf8"
  );
  const inlineScript = html.match(/<script>\s*([\s\S]*?)<\/script>/);
  assert.ok(inlineScript);
  assert.ok(inlineScript.index < html.indexOf('<link rel="icon"'));

  for (const testCase of [
    {
      label: "slashless route",
      pathname: "/formulario-informacoes-iniciais",
      search: "",
      hash: "",
      expected: "/formulario-informacoes-iniciais/"
    },
    {
      label: "query preservation",
      pathname: "/formulario-informacoes-iniciais",
      search: "?cliente=Lucas%20Machado&origem=convite",
      hash: "",
      expected: "/formulario-informacoes-iniciais/?cliente=Lucas%20Machado&origem=convite"
    },
    {
      label: "fragment preservation",
      pathname: "/formulario-informacoes-iniciais",
      search: "",
      hash: "#participantes",
      expected: "/formulario-informacoes-iniciais/#participantes"
    },
    {
      label: "canonical route",
      pathname: "/formulario-informacoes-iniciais/",
      search: "?cliente=Lucas%20Machado",
      hash: "#participantes",
      expected: null
    },
    {
      label: "explicit index",
      pathname: "/formulario-informacoes-iniciais/index.html",
      search: "",
      hash: "",
      expected: null
    },
    {
      label: "repository source preview",
      pathname: "/apps/client-intake/index.html",
      search: "?preview=source",
      hash: "#formulario",
      expected: null
    },
    {
      label: "retired slashless route",
      pathname: "/formulario",
      search: "?cliente=Lucas%20Machado",
      hash: "#participantes",
      expected: null
    },
    {
      label: "retired directory route",
      pathname: "/formulario/",
      search: "",
      hash: "",
      expected: null
    },
    {
      label: "retired explicit index",
      pathname: "/formulario/index.html",
      search: "",
      hash: "",
      expected: null
    }
  ]) {
    let replacement = null;
    const location = {
      hash: testCase.hash,
      pathname: testCase.pathname,
      replace(value) {
        replacement = value;
      },
      search: testCase.search
    };

    runInNewContext(inlineScript[1], { window: { location } });
    assert.equal(replacement, testCase.expected, testCase.label);
  }
});

test("Conecta normalizes only extensionless entry URLs before assets load", async () => {
  const html = await readFile(
    new URL("../apps/referrals-management/referral-form/index.html", import.meta.url),
    "utf8"
  );
  const inlineScript = html.match(/<script>\s*([\s\S]*?)<\/script>/);
  assert.ok(inlineScript);
  assert.ok(inlineScript.index < html.indexOf('<link rel="icon"'));

  for (const testCase of [
    {
      pathname: "/conecta/cadastro-recomendacoes",
      expected: "/conecta/cadastro-recomendacoes/?ncr=Lucas%20Machado#form"
    },
    {
      pathname: "/conecta/cadastro-recomendacoes/",
      expected: null
    },
    {
      pathname: "/apps/referrals-management/referral-form/index.html",
      expected: null
    }
  ]) {
    let replacement = null;
    const location = {
      hash: "#form",
      pathname: testCase.pathname,
      replace(value) {
        replacement = value;
      },
      search: "?ncr=Lucas%20Machado"
    };

    runInNewContext(inlineScript[1], { window: { location } });
    assert.equal(replacement, testCase.expected);
  }
});

test("certificate validation normalizes only its slashless public route before assets load", async () => {
  const html = await readFile(
    new URL("../apps/certificate-validation/index.html", import.meta.url),
    "utf8"
  );
  const inlineScript = html.match(/<script>\s*([\s\S]*?)<\/script>/);
  assert.ok(inlineScript);
  assert.ok(inlineScript.index < html.indexOf('<link rel="icon"'));

  for (const testCase of [
    {
      pathname: "/validacao-certificados",
      expected: "/validacao-certificados/?certificateId=FMG-1234#validator"
    },
    {
      pathname: "/validacao-certificados/",
      expected: null
    },
    {
      pathname: "/validacao-certificados/index.html",
      expected: null
    },
    {
      pathname: "/apps/certificate-validation/index.html",
      expected: null
    },
    {
      pathname: "/validacao",
      expected: null
    },
    {
      pathname: "/validacao/",
      expected: null
    },
    {
      pathname: "/validacao/index.html",
      expected: null
    }
  ]) {
    let replacement = null;
    const location = {
      hash: "#validator",
      pathname: testCase.pathname,
      replace(value) {
        replacement = value;
      },
      search: "?certificateId=FMG-1234"
    };

    runInNewContext(inlineScript[1], { window: { location } });
    assert.equal(replacement, testCase.expected);
  }
});

test("generated certificates print the canonical validation URL", async () => {
  const [entrySource, certificateRendererSource] = await Promise.all([
    readFile(
      new URL("../apps/learning-platform/course-content/main.js", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL(
        "../apps/learning-platform/modules/study/certificate-renderer.js",
        import.meta.url
      ),
      "utf8"
    )
  ]);
  assert.match(
    entrySource,
    /import \{ createCertificateRenderer \} from '\.\.\/modules\/study\/certificate-renderer\.js';/
  );
  const validationUrls = certificateRendererSource.match(
    /https:\/\/machadogestao\.com\/validacao[^'"]*/g
  );

  assert.deepEqual(validationUrls, [
    "https://machadogestao.com/validacao-certificados/"
  ]);
});
