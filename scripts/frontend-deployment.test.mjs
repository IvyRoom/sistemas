import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import {
  assertReadmeContract,
  assertSourcePreviewReferences,
  compareSourcePreviewReference,
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

test("real deployment manifest defines the reviewed route contract", async () => {
  const manifest = await readDeploymentManifest();
  const validation = await validateDeploymentManifest(manifest);

  assert.equal(publicEntries(manifest).length, 13);
  assert.equal(publicDownloads(manifest).length, 3);
  assert.equal(validation.files.length, 227);
  assert.deepEqual(
    validation.mappings.filter(
      (mapping) => [
        "quote-request",
        "quote-request-confirmation"
      ].includes(mapping.applicationId)
    ),
    [
      {
        applicationId: "quote-request",
        source: "apps/quote-request",
        output: "solicitação",
        sourceType: "directory"
      },
      {
        applicationId: "quote-request-confirmation",
        source: "apps/quote-request-confirmation",
        output: "confirmação",
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
      source: "apps/conecta/referral-form/index.html",
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
  assert.ok(manifest.notFoundPaths.includes("/formulario"));
  assert.ok(manifest.notFoundPaths.includes("/formulario/"));
  assert.ok(manifest.notFoundPaths.includes("/formulario/index.html"));
  assert.ok(manifest.notFoundPaths.includes("/validacao"));
  assert.ok(manifest.notFoundPaths.includes("/validacao/"));
  assert.ok(manifest.notFoundPaths.includes("/validacao/index.html"));
  assert.deepEqual(
    await assertReadmeContract(manifest),
    { entries: 13, downloads: 3 }
  );
  const sourcePreviewReferences = await assertSourcePreviewReferences(manifest);
  assert.ok(sourcePreviewReferences.htmlReferences > 0);

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

test("source preview and deployment references resolve to the same mapped asset", () => {
  const mappedFiles = [
    {
      source: "apps/conecta/referral-form/style.css",
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
      "apps/conecta/referral-form/index.html",
      mappedFiles
    ),
    {
      expectedSource: "apps/conecta/referral-form/style.css",
      matches: true,
      output: "conecta/cadastro-recomendacoes/style.css",
      sourceCandidates: [
        "apps/conecta/referral-form/style.css",
        "apps/conecta/referral-form/style.css/index.html"
      ]
    }
  );

  assert.equal(
    compareSourcePreviewReference(
      "/conecta/cadastro-recomendacoes/style.css",
      "conecta/cadastro-recomendacoes/index.html",
      "apps/conecta/referral-form/index.html",
      mappedFiles
    ).matches,
    false
  );

  assert.equal(
    compareSourcePreviewReference(
      "/shared/logo.png",
      "conecta/cadastro-recomendacoes/index.html",
      "apps/conecta/referral-form/index.html",
      mappedFiles
    ).matches,
    true
  );
  assert.equal(
    compareSourcePreviewReference(
      "data:image/svg+xml;base64,abc",
      "conecta/cadastro-recomendacoes/style.css",
      "apps/conecta/referral-form/style.css",
      mappedFiles
    ),
    null
  );
  assert.equal(
    compareSourcePreviewReference(
      "#filter",
      "conecta/cadastro-recomendacoes/style.css",
      "apps/conecta/referral-form/style.css",
      mappedFiles
    ),
    null
  );
});

for (const page of [
  {
    label: "quote request",
    publicPath: "/solicitação",
    sourcePath: "../apps/quote-request/index.html",
    sourcePreviewPath: "/apps/quote-request/index.html"
  },
  {
    label: "quote-request confirmation",
    publicPath: "/confirmação",
    sourcePath: "../apps/quote-request-confirmation/index.html",
    sourcePreviewPath: "/apps/quote-request-confirmation/index.html"
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
        label: "slashless accented route",
        pathname: page.publicPath,
        expected: `${page.publicPath}/`
      },
      {
        label: "slashless percent-encoded route",
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

test("successful quote submission navigates to the public confirmation route", async () => {
  const source = await readFile(
    new URL("../apps/quote-request/main.js", import.meta.url),
    "utf8"
  );
  const elements = new Map();
  const listeners = new Map();
  const document = {
    body: { style: {} },
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, {
          addEventListener(type, listener) {
            listeners.set(`${id}:${type}`, listener);
          },
          disabled: false,
          style: {},
          value: ""
        });
      }

      return elements.get(id);
    }
  };
  let destination = null;
  let fetchCalls = 0;
  const location = {};

  Object.defineProperty(location, "href", {
    set(value) {
      destination = value;
    }
  });

  runInNewContext(source, {
    alert() {
      assert.fail("The successful submission path must not show an error");
    },
    document,
    fetch: async () => {
      fetchCalls += 1;
      return {
        json: async () => ({}),
        ok: true
      };
    },
    window: { location }
  });

  const submit = listeners.get("Formulário-de-Solicitação:submit");
  let defaultPrevented = false;

  assert.ok(submit);
  submit({
    preventDefault() {
      defaultPrevented = true;
    }
  });
  await new Promise(setImmediate);

  assert.equal(defaultPrevented, true);
  assert.equal(fetchCalls, 1);
  assert.equal(destination, "/confirmação/");
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
    new URL("../apps/conecta/referral-form/index.html", import.meta.url),
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
      pathname: "/apps/conecta/referral-form/index.html",
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
  const platformSource = await readFile(
    new URL("../plataforma_v2/estudo/main.js", import.meta.url),
    "utf8"
  );
  const validationUrls = platformSource.match(
    /https:\/\/machadogestao\.com\/validacao[^'"]*/g
  );

  assert.deepEqual(validationUrls, [
    "https://machadogestao.com/validacao-certificados/"
  ]);
});
