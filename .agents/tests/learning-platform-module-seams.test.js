"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  FIXTURE_ORIGIN,
  NetworkGuardError,
  createLearningPlatformHarness,
  installHostNetworkGuard,
  loadPlatformModule
} = require("./helpers/learning-platform-harness.js");

const MODULE_ROOT = "apps/learning-platform/modules/";
const REPOSITORY_ROOT = path.join(__dirname, "..", "..");

async function loadModules(names) {
  return Promise.all(names.map((name) => loadPlatformModule(MODULE_ROOT + name)));
}

function installReportDom(harness) {
  const graphs = [];
  const realizedContainers = [];
  const targetContainers = [];
  const entityContainers = [];

  for (let graphIndex = 0; graphIndex < 12; graphIndex += 1) {
    const graph = harness.element(`module-report-graph-${graphIndex}`);
    const realized = harness.element(`module-realized-container-${graphIndex}`);
    const targets = harness.element(`module-target-container-${graphIndex}`);
    const entities = harness.element(`module-entity-container-${graphIndex}`);

    realized.setSelectorResult(
      ".Realizados",
      Array.from({ length: 15 }, (_, index) =>
        harness.element(`module-realized-${graphIndex}-${index}`)
      ),
      { all: true }
    );
    targets.setSelectorResult(
      ".Metas",
      Array.from({ length: 15 }, (_, index) =>
        harness.element(`module-target-${graphIndex}-${index}`)
      ),
      { all: true }
    );
    targets.setSelectorResult(
      ".R\u00f3tulos_Metas",
      Array.from({ length: 15 }, (_, index) =>
        harness.element(`module-target-label-${graphIndex}-${index}`)
      ),
      { all: true }
    );
    targets.setSelectorResult(
      ".Linhas_Conectoras_Metas",
      Array.from({ length: 14 }, (_, index) =>
        harness.element(`module-target-line-${graphIndex}-${index}`)
      ),
      { all: true }
    );
    entities.setSelectorResult(
      ".Entidades",
      Array.from({ length: 15 }, (_, index) =>
        harness.element(`module-entity-${graphIndex}-${index}`)
      ),
      { all: true }
    );

    graphs.push(graph);
    realizedContainers.push(realized);
    targetContainers.push(targets);
    entityContainers.push(entities);
  }

  harness.selectorResults.set(".Gr\u00e1ficos_Controle_Resultados", graphs);
  harness.selectorResults.set(".Containers_Realizados", realizedContainers);
  harness.selectorResults.set(".Containers_Metas", targetContainers);
  harness.selectorResults.set(".Containers_Entidades", entityContainers);
  return { entityContainers, graphs, realizedContainers, targetContainers };
}

function reportRow(name, progress, moduleOne, certificateId) {
  return [
    name,
    progress,
    moduleOne,
    0.2,
    0.3,
    0.4,
    0.5,
    0.6,
    0.7,
    0.8,
    0.9,
    1,
    moduleOne,
    certificateId
  ];
}

function assertMachineValueHidden(harness, machineValue) {
  const renderedText = [harness.document.body, ...harness.elements.values()]
    .map((element) => `${element.innerHTML}\n${element.textContent}`)
    .join("\n");
  assert.equal(harness.alerts.join("\n").includes(machineValue), false);
  assert.deepEqual(harness.consoleCalls, []);
  assert.equal(renderedText.includes(machineValue), false);
}

test("[SAFETY-NETWORK] real application modules load behind host deny-all sentinels", async () => {
  const hostGuard = installHostNetworkGuard();
  hostGuard.reset();

  assert.throws(() => globalThis.fetch("fixture-target"), NetworkGuardError);
  const request = new globalThis.XMLHttpRequest();
  request.open("GET", "fixture-target");
  assert.throws(() => request.send(), NetworkGuardError);
  assert.throws(() => new globalThis.WebSocket("fixture-target"), NetworkGuardError);
  assert.throws(() => new globalThis.EventSource("fixture-target"), NetworkGuardError);
  assert.throws(() => new globalThis.Worker("fixture-target"), NetworkGuardError);
  assert.throws(() => new globalThis.SharedWorker("fixture-target"), NetworkGuardError);
  assert.throws(() => new globalThis.Image(), NetworkGuardError);
  assert.throws(() => new globalThis.Audio(), NetworkGuardError);
  assert.throws(() => new globalThis.BroadcastChannel("fixture-channel"), NetworkGuardError);
  assert.throws(() => new globalThis.FormData(), NetworkGuardError);
  assert.throws(() => globalThis.document.createElement("script"), NetworkGuardError);
  assert.throws(() => globalThis.customElements.define("fixture-element", class {}), NetworkGuardError);
  assert.throws(() => globalThis.sessionStorage.getItem("fixture-key"), NetworkGuardError);
  assert.throws(() => globalThis.localStorage.setItem("fixture-key", "fixture-value"), NetworkGuardError);
  assert.throws(() => globalThis.navigator.sendBeacon("fixture-target"), NetworkGuardError);
  assert.throws(() => globalThis.navigator.serviceWorker.register("fixture-target"), NetworkGuardError);
  assert.throws(() => globalThis.location.assign("fixture-target"), NetworkGuardError);
  assert.throws(() => globalThis.history.back(), NetworkGuardError);
  assert.throws(() => globalThis.open("fixture-target"), NetworkGuardError);
  assert.deepEqual(hostGuard.attempts, [
    { channel: "host fetch" },
    { channel: "host XMLHttpRequest" },
    { channel: "host WebSocket" },
    { channel: "host EventSource" },
    { channel: "host Worker" },
    { channel: "host SharedWorker" },
    { channel: "host image" },
    { channel: "host media" },
    { channel: "host BroadcastChannel" },
    { channel: "host FormData" },
    { channel: "host document" },
    { channel: "host Face custom elements" },
    { channel: "host storage" },
    { channel: "host storage" },
    { channel: "host sendBeacon" },
    { channel: "host service worker" },
    { channel: "host navigation" },
    { channel: "host history" },
    { channel: "host window.open" }
  ]);
  hostGuard.reset();

  const queryModule = await loadPlatformModule(
    "apps/learning-platform/modules/status-report/query.js"
  );
  assert.equal(typeof queryModule.parseStatusReportQuery, "function");
  await assert.rejects(
    loadPlatformModule("apps/learning-platform/status-report/main.js"),
    (error) => error?.name === "AssertionError"
  );
  await assert.rejects(
    loadPlatformModule("apps/learning-platform/modules/../status-report/main.js"),
    (error) => error?.name === "AssertionError"
  );
  hostGuard.assertUnused();
});

test("[SAFETY-NETWORK] injected navigation and by-id resources fail closed", () => {
  const harness = createLearningPlatformHarness();
  const dependencies = harness.dependencies();
  const offOrigin = "https:" + "//outside.invalid/fixture";
  const emailTarget = "mailto:" + "fixture-recipient" + "@invalid.test";

  dependencies.navigate("/plataforma/login");
  assert.deepEqual(harness.navigation, ["/plataforma/login"]);

  assert.throws(() => {
    harness.window.location.href = offOrigin;
  }, NetworkGuardError);
  assert.throws(() => dependencies.navigate(offOrigin), NetworkGuardError);
  assert.throws(() => {
    harness.window.location.href = emailTarget;
  }, NetworkGuardError);
  assert.throws(() => dependencies.navigate(emailTarget), NetworkGuardError);
  assert.throws(
    () => dependencies.navigate("/plataforma/login?fixture-query=blocked"),
    NetworkGuardError
  );
  assert.throws(() => {
    harness.window.location.href = "/plataforma/login#fixture-fragment";
  }, NetworkGuardError);
  assert.deepEqual(harness.navigation, ["/plataforma/login"]);

  const byIdElement = harness.element("Fixture-Download-Link");
  const localDownload = "/plataforma/estudo/files/Fixture/fixture-download.pdf";
  byIdElement.href = localDownload;
  assert.equal(byIdElement.href, localDownload);
  assert.throws(() => {
    byIdElement.href = offOrigin;
  }, NetworkGuardError);
  assert.throws(() => {
    byIdElement.href = emailTarget;
  }, NetworkGuardError);
  assert.throws(() => {
    byIdElement.href = "/unexpected-resource";
  }, NetworkGuardError);
  assert.throws(() => {
    byIdElement.src = localDownload;
  }, NetworkGuardError);
  assert.equal(byIdElement.href, localDownload);
  harness.hostGuard.assertUnused();
});

test("[GATE-02] all seven entry assets retain their exact bootstrap loading modes", () => {
  const expectedModes = [
    {
      sourceDirectory: "device-warning",
      publicSuffix: "aviso-dispositivo",
      async: true,
      module: false
    },
    {
      sourceDirectory: "browser-warning",
      publicSuffix: "aviso-navegador",
      async: false,
      module: false
    },
    {
      sourceDirectory: "initial-notices",
      publicSuffix: "avisos-iniciais",
      async: true,
      module: true
    },
    {
      sourceDirectory: "photo-registration",
      publicSuffix: "cadastro-foto",
      async: true,
      module: true
    },
    {
      sourceDirectory: "course-content",
      publicSuffix: "estudo",
      async: false,
      module: true
    },
    {
      sourceDirectory: "login",
      publicSuffix: "login",
      async: true,
      module: true
    },
    {
      sourceDirectory: "status-report",
      publicSuffix: "statusreport",
      async: true,
      module: true
    }
  ];

  for (const expected of expectedModes) {
    const { sourceDirectory, publicSuffix } = expected;
    const html = fs.readFileSync(
      path.join(
        REPOSITORY_ROOT,
        "apps",
        "learning-platform",
        sourceDirectory,
        "index.html"
      ),
      "utf8"
    );
    const scriptTags = Array.from(html.matchAll(/<script\b([^>]*)>/gi), ([, attributes]) =>
      attributes
    );
    const mainIndex = scriptTags.findIndex((attributes) =>
      attributes.includes(`/plataforma/${publicSuffix}/main.js`)
    );
    assert.notEqual(
      mainIndex,
      -1,
      `${sourceDirectory} must retain its Portuguese public main.js asset`
    );
    const mainAttributes = scriptTags[mainIndex];
    assert.equal(
      /\basync\b/i.test(mainAttributes),
      expected.async,
      `${sourceDirectory}:async`
    );
    assert.equal(
      /\btype\s*=\s*["']module["']/i.test(mainAttributes),
      expected.module,
      `${sourceDirectory}:module`
    );

    if (sourceDirectory === "course-content") {
      assert.equal(scriptTags.length, 3);
      assert.equal(mainIndex, 2, "Study dependencies must remain ordered before main.js");
      assert.equal(scriptTags.slice(0, 2).every((attributes) => !/\b(?:async|defer)\b/i.test(attributes)), true);
      assert.equal(scriptTags.slice(0, 2).every((attributes) => !/\btype\s*=\s*["']module["']/i.test(attributes)), true);
    }
  }
});

test("[API-01] Registration accepts an explicit synthetic platform base", async () => {
  const [registrationModule, sessionModule] = await loadModules([
    "photo-registration.js",
    "session.js"
  ]);
  const requestTargets = [];
  const harness = createLearningPlatformHarness({
    routes: [{
      handler: async () => new Promise(() => {}),
      method: "POST",
      path: "/plataforma_v2/CadastroFoto_e_FaceID"
    }],
    storage: {
      [sessionModule.SESSION_KEYS.verifiedIndex]: "fixture-registration-handle"
    }
  });
  const dependencies = harness.dependencies({
    fetch(target, options) {
      requestTargets.push(String(target));
      return harness.guard.fetch(target, options);
    }
  });
  harness.element("Botão-Escolher-Arquivo").files = [{ name: "fixture-photo.jpg" }];

  registrationModule.createRegistrationApplication({
    ...dependencies,
    backendBase: FIXTURE_ORIGIN + "/plataforma_v2"
  });
  harness.element("Formulário-Foto-Referência").dispatch("submit", {
    preventDefault() {}
  });

  assert.deepEqual(requestTargets, [
    FIXTURE_ORIGIN + "/plataforma_v2/CadastroFoto_e_FaceID"
  ]);
  assert.deepEqual(
    harness.timeline
      .filter(({ type }) => type === "storage-get" || type === "fetch")
      .map(({ key, method, path, type }) => ({ key, method, path, type })),
    [
      {
        key: sessionModule.SESSION_KEYS.verifiedIndex,
        method: undefined,
        path: undefined,
        type: "storage-get"
      },
      {
        key: undefined,
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID",
        type: "fetch"
      }
    ]
  );
  assert.deepEqual(harness.guard.requests[0].formFields, [
    ["IndexVerificado", "<redacted>"],
    ["file", "<file:fixture-photo.jpg>"]
  ]);
  harness.hostGuard.assertUnused();
});

test("[FLOW-01] initial-notices module preserves gate, listener, submit, and reset order", async () => {
  const [noticesModule, lifecycleModule, sessionModule] = await loadModules([
    "initial-notices.js",
    "lifecycle.js",
    "session.js"
  ]);
  const requiredAcknowledgements = {
    credentials: "fixture-credentials",
    rights: "fixture-rights",
    window: "fixture-window"
  };

  function installNotices(options = {}) {
    const harness = createLearningPlatformHarness({
      innerWidth: options.innerWidth ?? 1025,
      storage: {
        [sessionModule.SESSION_KEYS.registrationAuthorization]:
          options.authorization ?? "Sim"
      },
      userAgent: options.userAgent ?? "FixtureBrowser",
      userAgentData: options.userAgentData ?? {
        brands: [{ brand: "Microsoft Edge" }]
      }
    });
    const dependencies = harness.dependencies();
    noticesModule.createInitialNoticesApplication({
      ...dependencies,
      isMicrosoftEdge: lifecycleModule.isMicrosoftEdge,
      redirectToDeviceWarning: lifecycleModule.redirectToDeviceWarning,
      requiredAcknowledgements,
      session: sessionModule.createSessionStore(harness.sessionStorage)
    }).install();
    return harness;
  }

  const authorized = installNotices();
  assert.deepEqual(
    authorized.timeline
      .filter(({ type }) => type === "window-listener")
      .map(({ event }) => event),
    ["resize", "load"]
  );
  authorized.dispatchWindow("load");
  assert.deepEqual(
    authorized.timeline
      .filter(({ type }) => ["storage-set", "storage-get", "navigate"].includes(type))
      .map(({ key, path, type }) => ({ key, path, type })),
    [
      {
        key: sessionModule.SESSION_KEYS.deviceWarningOrigin,
        path: undefined,
        type: "storage-set"
      },
      {
        key: sessionModule.SESSION_KEYS.registrationAuthorization,
        path: undefined,
        type: "storage-get"
      }
    ]
  );

  const form = authorized.element("Formul\u00e1rio");
  authorized.element("Palavra-Passe-Credenciais").value = requiredAcknowledgements.credentials;
  authorized.element("Palavra-Passe-Direitos").value = requiredAcknowledgements.rights;
  authorized.element("Palavra-Passe-Janela").value = requiredAcknowledgements.window;
  form.dispatch("submit");
  assert.equal(authorized.navigation.at(-1), "/plataforma/cadastro-foto");
  assert.equal(authorized.document.body.style.cursor, "wait");
  assert.equal(authorized.element("Bot\u00e3o-Li-e-Concordo").style.display, "none");

  const rejected = installNotices();
  rejected.element("Palavra-Passe-Credenciais").value =
    ` ${requiredAcknowledgements.credentials}`;
  rejected.element("Palavra-Passe-Direitos").value = requiredAcknowledgements.rights;
  rejected.element("Palavra-Passe-Janela").value = requiredAcknowledgements.window;
  rejected.element("Formul\u00e1rio").dispatch("submit");
  assert.equal(rejected.navigation.length, 0);
  assert.equal(
    rejected.element("Alerta-Palavra-Passe-Credenciais").style.display,
    "block"
  );
  assert.equal(rejected.document.body.style.cursor, "default");
  rejected.element("Palavra-Passe-Credenciais").dispatch("change");
  for (const id of [
    "Alerta-Palavra-Passe-Credenciais",
    "Alerta-Palavra-Passe-Direitos",
    "Alerta-Palavra-Passe-Janela"
  ]) {
    assert.equal(rejected.element(id).style.display, "none");
  }
  assert.equal(rejected.element("Bot\u00e3o-Li-e-Concordo").style.display, "block");

  const narrow = installNotices({ innerWidth: 1024 });
  narrow.dispatchWindow("load");
  assert.equal(narrow.navigation.at(-1), "/plataforma/aviso-dispositivo");

  const unauthorized = installNotices({ authorization: "N\u00e3o" });
  unauthorized.dispatchWindow("load");
  assert.equal(unauthorized.navigation.at(-1), "/plataforma/login");
  authorized.hostGuard.assertUnused();
});

test("[REPORT-01] report query and chart modules retain parsing, construction, and sorting seams", async () => {
  const [queryModule, chartsModule, applicationModule] = await loadModules([
    "status-report/query.js",
    "status-report/charts.js",
    "status-report/application.js"
  ]);
  const reads = [];
  class TrackingSearchParams extends URLSearchParams {
    get(key) {
      reads.push(key);
      return super.get(key);
    }
  }

  const query = queryModule.parseStatusReportQuery(
    "?ne=Fixture&nt=7suffix&li=2suffix&lf=4.8&dua=01012035&idsr=7suffix&mi=1suffix&mf=4suffix&mrm=consolidado",
    TrackingSearchParams
  );
  assert.deepEqual(reads, ["ne", "nt", "li", "lf", "dua", "idsr", "idsr", "mi", "mf", "mrm"]);
  assert.deepEqual(
    {
      cohortNumber: query.cohortNumber,
      firstModule: query.firstModule,
      firstRow: query.firstRow,
      lastModule: query.lastModule,
      lastRow: query.lastRow,
      reportId: query.reportId,
      rowCount: query.rowCount,
      targetLabelMode: query.targetLabelMode
    },
    {
      cohortNumber: 7,
      firstModule: 1,
      firstRow: 2,
      lastModule: 4,
      lastRow: 4,
      reportId: "07",
      rowCount: 3,
      targetLabelMode: "consolidado"
    }
  );

  const { chartInformation, targets } =
    chartsModule.createStatusReportChartDefinitions(query.lastModule);
  assert.equal(chartInformation.length, 12);
  assert.equal(targets.length, 12);
  const chartMarkup = { innerHTML: "" };
  chartsModule.appendStatusReportCharts(chartMarkup, chartInformation);
  assert.equal((chartMarkup.innerHTML.match(/class="Gr\u00e1ficos_Controle_Resultados"/g) ?? []).length, 12);

  const originalRows = [
    reportRow("Progress Winner", 10, 0.1, "IGNORED-CERT-A"),
    reportRow("Module Winner", 1, 0.9, "IGNORED-CERT-B")
  ];
  const sortedRows = chartsModule.sortStatusReportRows(originalRows);
  assert.equal(sortedRows.length, 12);
  assert.equal(sortedRows[0][0][0], "Progress Winner");
  assert.equal(sortedRows[1][0][0], "Module Winner");
  assert.deepEqual(originalRows.map((row) => row[0]), ["Progress Winner", "Module Winner"]);

  const captureOrder = [];
  class CaptureSearchParams extends URLSearchParams {
    constructor(search) {
      super(search);
      captureOrder.push("query:construct");
    }

    get(key) {
      captureOrder.push(`query:${key}`);
      return super.get(key);
    }
  }
  const captureWindow = {
    location: {
      search: "?ne=Fixture&nt=1&li=0&lf=0&dua=01012035&idsr=1&mi=1&mf=1&mrm=individual"
    }
  };
  const captureDocument = {
    getElementById(id) {
      captureOrder.push(`dom:${id}`);
      return {};
    }
  };
  const capturedApplication = applicationModule.createStatusReportApplication({
    URLSearchParamsConstructor: CaptureSearchParams,
    document: captureDocument,
    navigate() {},
    platformClient: {},
    redirectToDeviceWarning() {},
    showAlert() {},
    window: captureWindow
  });
  assert.deepEqual(captureOrder.slice(0, 11), [
    "query:construct",
    "query:ne",
    "query:nt",
    "query:li",
    "query:lf",
    "query:dua",
    "query:idsr",
    "query:idsr",
    "query:mi",
    "query:mf",
    "query:mrm"
  ]);
  assert.deepEqual(captureOrder.slice(11), [
    "dom:Título_Status_Report",
    "dom:Última_Atualização",
    "dom:Aviso_Carregando_Informações",
    "dom:Container_Externo_Conteúdo",
    "dom:Título_Gráfico_Controle_Resultados_Avanço_Formação",
    "dom:Container_Gráficos_Controle_Resultados",
    "dom:Observação_Gráfico_Controle_Resultados_Avanço_Formação"
  ]);
  assert.equal(captureWindow.onload, undefined);
  capturedApplication.install();
  assert.equal(typeof captureWindow.onload, "function");
  installHostNetworkGuard().assertUnused();
});

test("[API-05] status-report application uses the injected public request seam", async () => {
  const [applicationModule, lifecycleModule, clientModule] = await loadModules([
    "status-report/application.js",
    "lifecycle.js",
    "platform-client.js"
  ]);
  const rows = [
    reportRow("Progress Winner", 10, 0.1, "IGNORED-CERT-A"),
    reportRow("Module Winner", 1, 0.9, "IGNORED-CERT-B")
  ];
  const harness = createLearningPlatformHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/statusreport",
      response: { data: { Dados_Extra\u00eddos_BD_Plataforma: rows } }
    }]
  });
  harness.window.location.search =
    "?ne=Fixture&nt=1&li=0&lf=1&dua=01012035&idsr=1&mi=1&mf=10&mrm=individual";
  const dom = installReportDom(harness);
  const dependencies = harness.dependencies();
  const platformClient = clientModule.createPlatformClient({
    baseUrl: FIXTURE_ORIGIN + "/plataforma_v2",
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor
  });
  applicationModule.createStatusReportApplication({
    ...dependencies,
    platformClient,
    redirectToDeviceWarning: lifecycleModule.redirectToDeviceWarning
  }).install();

  assert.equal(typeof harness.window.onload, "function");
  await harness.window.onload();
  await harness.flush(20);

  assert.deepEqual(harness.guard.requests, [{
    body: { linha_inicial: 0, linha_final: 1 },
    formFields: undefined,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    path: "/plataforma_v2/statusreport"
  }]);
  assert.equal((harness.windowListeners.get("resize") ?? []).length, 1);
  assert.equal(
    dom.entityContainers[0].querySelectorAll(".Entidades")[0].innerHTML,
    "Progress Winner"
  );
  assert.equal(
    dom.entityContainers[1].querySelectorAll(".Entidades")[0].innerHTML,
    "Module Winner"
  );
  assert.equal(harness.element("Container_Externo_Conte\u00fado").style.display, "block");
  assert.equal(harness.element("Aviso_Carregando_Informa\u00e7\u00f5es").style.display, "none");
  assert.equal(harness.document.body.style.cursor, "default");
  const renderedEntities = dom.entityContainers.flatMap((container) =>
    container.querySelectorAll(".Entidades").map((entity) => entity.innerHTML)
  ).join("\n");
  assert.equal(renderedEntities.includes("IGNORED-CERT"), false);
  harness.hostGuard.assertUnused();
});

test("[API-05] status-report application preserves JSON/status and failure ordering", async () => {
  const [applicationModule, lifecycleModule, clientModule] = await loadModules([
    "status-report/application.js",
    "lifecycle.js",
    "platform-client.js"
  ]);
  const cases = [
    {
      backendError: "learning_platform.read_platform_data_failed",
      message: "Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nTente novamente."
    },
    {
      backendError: "learning_platform.append_feedback_failed",
      message: "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."
    },
    {
      backendError: "client_intake.read_platform_data_failed",
      message: "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."
    }
  ];

  for (const { backendError, message } of cases) {
    const responseOrder = [];
    const response = {
      get ok() {
        responseOrder.push("ok");
        return false;
      },
      get status() {
        responseOrder.push("status");
        return 503;
      },
      async json() {
        responseOrder.push("json");
        return { error: backendError };
      }
    };
    const harness = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/statusreport",
        response
      }]
    });
    harness.window.location.search =
      "?ne=Fixture&nt=1&li=0&lf=0&dua=01012035&idsr=1&mi=1&mf=1&mrm=individual";
    installReportDom(harness);
    const dependencies = harness.dependencies();
    const platformClient = clientModule.createPlatformClient({
      baseUrl: FIXTURE_ORIGIN + "/plataforma_v2",
      fetch: dependencies.fetch,
      FormDataConstructor: dependencies.FormDataConstructor
    });
    applicationModule.createStatusReportApplication({
      ...dependencies,
      platformClient,
      redirectToDeviceWarning: lifecycleModule.redirectToDeviceWarning
    }).install();

    await harness.window.onload();
    await harness.flush(20);

    assert.deepEqual(responseOrder, ["json", "ok", "status"]);
    assert.deepEqual(harness.alerts, [message]);
    assert.equal(harness.document.body.style.cursor, "default");
    if (backendError.includes(".")) assertMachineValueHidden(harness, backendError);
    harness.hostGuard.assertUnused();
  }

  const malformedOrder = [];
  const malformed = createLearningPlatformHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/statusreport",
      response: {
        get ok() {
          malformedOrder.push("ok");
          return false;
        },
        get status() {
          malformedOrder.push("status");
          return 503;
        },
        async json() {
          malformedOrder.push("json");
          throw new SyntaxError("Synthetic malformed status-report JSON");
        }
      }
    }]
  });
  malformed.window.location.search =
    "?ne=Fixture&nt=1&li=0&lf=0&dua=01012035&idsr=1&mi=1&mf=1&mrm=individual";
  installReportDom(malformed);
  const malformedDependencies = malformed.dependencies();
  const malformedClient = clientModule.createPlatformClient({
    baseUrl: FIXTURE_ORIGIN + "/plataforma_v2",
    fetch: malformedDependencies.fetch,
    FormDataConstructor: malformedDependencies.FormDataConstructor
  });
  applicationModule.createStatusReportApplication({
    ...malformedDependencies,
    platformClient: malformedClient,
    redirectToDeviceWarning: lifecycleModule.redirectToDeviceWarning
  }).install();

  await malformed.window.onload();
  await malformed.flush(20);

  assert.deepEqual(malformedOrder, ["json"]);
  assert.deepEqual(malformed.alerts, [
    "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."
  ]);
  assert.equal(malformed.document.body.style.cursor, "default");
  malformed.hostGuard.assertUnused();
});

test("[REPORT-03] status rendering keeps exact consolidated label behavior and width gate order", async () => {
  const [applicationModule, lifecycleModule, clientModule] = await loadModules([
    "status-report/application.js",
    "lifecycle.js",
    "platform-client.js"
  ]);

  for (const [mode, hidden] of [
    ["consolidado", [true, true, false]],
    ["c", [false, false, false]]
  ]) {
    const harness = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/statusreport",
        response: {
          data: {
            Dados_Extra\u00eddos_BD_Plataforma: [
              reportRow("Fixture A", 3, 0.7, "IGNORED-A"),
              reportRow("Fixture B", 2, 0.8, "IGNORED-B"),
              reportRow("Fixture C", 1, 0.9, "IGNORED-C")
            ]
          }
        }
      }]
    });
    harness.window.location.search =
      `?ne=Fixture&nt=1&li=0&lf=2&dua=01012035&idsr=1&mi=1&mf=10&mrm=${mode}`;
    const dom = installReportDom(harness);
    const dependencies = harness.dependencies();
    const platformClient = clientModule.createPlatformClient({
      baseUrl: FIXTURE_ORIGIN + "/plataforma_v2",
      fetch: dependencies.fetch,
      FormDataConstructor: dependencies.FormDataConstructor
    });
    applicationModule.createStatusReportApplication({
      ...dependencies,
      platformClient,
      redirectToDeviceWarning: lifecycleModule.redirectToDeviceWarning
    }).install();
    await harness.window.onload();
    await harness.flush(20);

    const labels = dom.targetContainers[0].querySelectorAll(".R\u00f3tulos_Metas");
    assert.deepEqual(
      labels.slice(0, 3).map((label) => label.style.display === "none"),
      hidden
    );
  }

  const narrow = createLearningPlatformHarness({ innerWidth: 1024 });
  narrow.window.location.search =
    "?ne=Fixture&nt=1&li=0&lf=0&dua=01012035&idsr=1&mi=1&mf=1&mrm=individual";
  installReportDom(narrow);
  const narrowDependencies = narrow.dependencies();
  const narrowClient = clientModule.createPlatformClient({
    baseUrl: FIXTURE_ORIGIN + "/plataforma_v2",
    fetch: narrowDependencies.fetch,
    FormDataConstructor: narrowDependencies.FormDataConstructor
  });
  applicationModule.createStatusReportApplication({
    ...narrowDependencies,
    platformClient: narrowClient,
    redirectToDeviceWarning: lifecycleModule.redirectToDeviceWarning
  }).install();
  await narrow.window.onload();
  assert.deepEqual(narrow.navigation, ["/plataforma/aviso-dispositivo"]);
  assert.equal(narrow.guard.requests.length, 0);
  assert.equal((narrow.windowListeners.get("resize") ?? []).length, 0);
  narrow.hostGuard.assertUnused();
});
