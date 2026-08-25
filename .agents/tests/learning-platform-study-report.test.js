"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  FIXTURE_ORIGIN,
  createLearningPlatformHarness,
  loadPlatformModule,
  readPlatformScript
} = require("./helpers/learning-platform-harness.js");

const repositoryRoot = path.join(__dirname, "..", "..");
const studyMainSource = readPlatformScript("apps/learning-platform/course-content/main.js");
const studyModulePaths = [
  "application.js",
  "assessment.js",
  "certificate-renderer.js",
  "certificate.js",
  "content.js",
  "dom.js",
  "downloads.js",
  "feedback.js",
  "navigation.js",
  "performance.js",
  "player.js",
  "progress.js",
  "session-timer.js",
  "state.js"
].map((fileName) => `apps/learning-platform/modules/course-content/${fileName}`);
// Source-frozen assertions intentionally compose the public edge and every
// application-owned responsibility module that now implements study behavior.
const studySource = [studyMainSource, ...studyModulePaths.map(readPlatformScript)].join("\n");
const studyHtml = fs.readFileSync(
  path.join(repositoryRoot, "apps", "learning-platform", "course-content", "index.html"),
  "utf8"
);
const reportModulePaths = [
  "apps/learning-platform/modules/status-report/application.js",
  "apps/learning-platform/modules/status-report/charts.js",
  "apps/learning-platform/modules/status-report/query.js"
];
// Report source assertions use the same explicit production source graph.
const reportSource = [
  readPlatformScript("apps/learning-platform/status-report/main.js"),
  ...reportModulePaths.map(readPlatformScript)
].join("\n");

let createCertificateRenderer;
let createDownloadConfigurator;
let createPlatformClient;
let createSessionStore;
let createStatusReportApplication;
let createStudyApplication;
let createStudyDom;
let createStudyPlayer;
let redirectToDeviceWarning;
let studyModuleTopicCounts;

test.before(async () => {
  const [
    sessionModule,
    clientModule,
    lifecycleModule,
    applicationModule,
    domModule,
    downloadsModule,
    playerModule,
    certificateRendererModule,
    stateModule,
    reportApplicationModule
  ] = await Promise.all([
    loadPlatformModule("apps/learning-platform/modules/session.js"),
    loadPlatformModule("apps/learning-platform/modules/platform-client.js"),
    loadPlatformModule("apps/learning-platform/modules/lifecycle.js"),
    loadPlatformModule("apps/learning-platform/modules/course-content/application.js"),
    loadPlatformModule("apps/learning-platform/modules/course-content/dom.js"),
    loadPlatformModule("apps/learning-platform/modules/course-content/downloads.js"),
    loadPlatformModule("apps/learning-platform/modules/course-content/player.js"),
    loadPlatformModule("apps/learning-platform/modules/course-content/certificate-renderer.js"),
    loadPlatformModule("apps/learning-platform/modules/course-content/state.js"),
    loadPlatformModule("apps/learning-platform/modules/status-report/application.js")
  ]);

  ({ createSessionStore } = sessionModule);
  ({ createPlatformClient } = clientModule);
  ({ redirectToDeviceWarning } = lifecycleModule);
  ({ createStudyApplication } = applicationModule);
  ({ createStudyDom } = domModule);
  ({ createDownloadConfigurator } = downloadsModule);
  ({ createStudyPlayer } = playerModule);
  ({ createCertificateRenderer } = certificateRendererModule);
  studyModuleTopicCounts = stateModule.STUDY_MODULE_TOPIC_COUNTS;
  ({ createStatusReportApplication } = reportApplicationModule);
});

const correctAnswerId = "c11aoIurJLm38YTHncm87493KaiowJMca";
const incorrectAnswerId = "Ij73hRG8120Amb85Ff473LCx3Zaor991";
const syntheticHandle = "synthetic-row-capability";

function withProtectedHandleExpectation(route) {
  if (!["/plataforma_v2/refresh", "/plataforma_v2/updates", "/plataforma_v2/processa-feedback"]
    .includes(route.path)) {
    return route;
  }
  const previousExpectation = route.expect;
  return {
    ...route,
    expect(transientRequest) {
      const previousResults = typeof previousExpectation === "function"
        ? previousExpectation(transientRequest)
        : {};
      return {
        ...previousResults,
        storedHandleMatches: transientRequest.jsonBody?.IndexVerificado === syntheticHandle
      };
    }
  };
}

function assertProtectedHandleExpectations(harness, expectedCount) {
  assert.equal(
    harness.guard.expectations.length,
    expectedCount,
    "Every protected request must evaluate its transient handle expectation"
  );
  assert.equal(
    harness.guard.expectations.every(({ results }) => results.storedHandleMatches === true),
    true,
    "Every protected request must carry the exact invented stored handle"
  );
}

function safeNetworkPath(value) {
  try {
    return { pathname: new URL(String(value)).pathname, valid: true };
  } catch {
    return { pathname: "<invalid-network-path>", valid: false };
  }
}

function assertMachineValueHidden(harness, machineValue) {
  const renderedText = [harness.document.body, ...harness.elements.values()]
    .map((element) => `${element.innerHTML}\n${element.textContent}`)
    .join("\n");
  assert.equal(harness.alerts.join("\n").includes(machineValue), false);
  assert.deepEqual(harness.consoleCalls, []);
  assert.equal(renderedText.includes(machineValue), false);
}

function eventFor(controlId) {
  return {
    target: {
      closest(selector) {
        return selector === `#${controlId}` ? this : null;
      }
    }
  };
}

function createTopic(harness, {
  className = "Container-Tópico-Aberto",
  dataIndex = 1,
  module = 1,
  name = "1. CONTEÚDO SINTÉTICO",
  visibleName = "1. Conteúdo sintético - 00:01"
} = {}) {
  const topic = harness.element(`fixture-topic-${dataIndex}`);
  const topicName = harness.element(`fixture-topic-name-${dataIndex}`);
  topic.className = className;
  topic.disabled = className === "Container-Tópico-Fechado";
  topic.setAttribute("data-index", dataIndex);
  topic.setAttribute("name", name);
  topic.parentElement = { id: `Container-Externo-Tópicos-Módulo-${module}` };
  topicName.innerHTML = visibleName;
  topic.setSelectorResult(".Tópico-Nome", topicName);
  const addTopicListener = topic.addEventListener.bind(topic);
  topic.addEventListener = (type, listener) => {
    addTopicListener(type, (event) => listener.call(topic, event));
  };
  return topic;
}

function installStudyDom(harness) {
  const arrows = Array.from({ length: 10 }, (_, index) => harness.element(`fixture-arrow-${index}`));
  const moduleHeaders = Array.from(
    { length: 10 },
    (_, index) => harness.element(`fixture-module-header-${index}`)
  );
  const moduleTopicContainers = Array.from(
    { length: 10 },
    (_, index) => harness.element(`fixture-module-topics-${index}`)
  );
  const questionContainers = Array.from(
    { length: 10 },
    (_, index) => harness.element(`fixture-question-container-${index}`)
  );

  harness.selectorResults.set("[id^='Seta-Auxiliar-Módulo-']", arrows);
  harness.selectorResults.set("[id^='Container-Externo-Tópicos-Módulo-']", moduleTopicContainers);
  harness.selectorResults.set("[id^='Container-Questões-Módulo-']", questionContainers);
  harness.selectorResults.set("[id^='Container-Módulo-']", moduleHeaders);
  harness.element("Container-Externo-Conteúdo").scrollTo = () => {};
  harness.element("Container-Externo-Testes").scrollTo = () => {};
  harness.element("Container-Externo-Feedbacks").scrollTo = () => {};
  return { arrows, moduleHeaders, moduleTopicContainers, questionContainers };
}

function installShaka() {
  const observations = {
    attachCount: 0,
    controls: [],
    drmServerKinds: [],
    loadPaths: [],
    overlayCount: 0,
    playerCount: 0,
    polyfillCount: 0
  };

  class Player {
    constructor() {
      observations.playerCount += 1;
    }

    async attach() {
      observations.attachCount += 1;
    }

    configure(configuration) {
      if (configuration?.drm?.servers) {
        observations.drmServerKinds.push(Object.keys(configuration.drm.servers));
      }
    }

    async load(target) {
      observations.loadPaths.push(safeNetworkPath(target));
    }

    static isBrowserSupported() {
      return true;
    }
  }

  class Overlay {
    constructor() {
      observations.overlayCount += 1;
    }

    configure(configuration) {
      observations.controls.push({
        controlPanelElements: [...configuration.controlPanelElements],
        overflowMenuButtons: [...configuration.overflowMenuButtons]
      });
    }
  }

  const runtime = {
    Player,
    polyfill: {
      installAll() {
        observations.polyfillCount += 1;
      }
    },
    ui: { Overlay }
  };
  return { observations, runtime };
}

function createStudyHarness({
  configureDrm,
  includeDefaultDeadline = true,
  installTopics = false,
  isDrmEnabled = () => true,
  loadSelectedMedia,
  routes = [],
  storage = {}
} = {}) {
  const harness = createLearningPlatformHarness({
    routes: routes.map(withProtectedHandleExpectation),
    storage: {
      ...(includeDefaultDeadline
        ? { "Horário-Encerramento-Sessão": "2000003600000" }
        : {}),
      IndexVerificado: syntheticHandle,
      URL_Base_Backend: `${FIXTURE_ORIGIN}/plataforma_v2`,
      Usuário_Logado: "Sim",
      ...storage
    }
  });
  const domFixtures = installStudyDom(harness);
  const topics = installTopics ? installClosedTopics(harness) : undefined;
  const dependencies = harness.dependencies();
  const session = createSessionStore(dependencies.sessionStorage);
  const client = createPlatformClient({
    baseUrl: session.read("backendBase"),
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor
  });
  const dom = createStudyDom(dependencies.document);
  const shaka = installShaka();
  let PdfConstructor = class {};
  const player = createStudyPlayer({
    alert: dependencies.alert,
    configureDrm: configureDrm ?? ((shakaPlayer) => {
      shakaPlayer.configure({
        drm: { servers: { "com.microsoft.playready": `${FIXTURE_ORIGIN}/fixture-license` } }
      });
    }),
    document: dependencies.document,
    dom,
    getShaka: () => shaka.runtime,
    isDrmEnabled,
    loadSelectedMedia: loadSelectedMedia ?? ((shakaPlayer, media) => {
      const kind = media.drmEnabled ? "protected" : "bypass";
      return shakaPlayer.load(
        `${FIXTURE_ORIGIN}/fixture-media/${kind}/${encodeURIComponent(media.moduleName)}/${encodeURIComponent(media.videoName)}`
      );
    }),
    state: {}
  });
  const clock = {
    createDate: (...args) => new dependencies.Date(...args),
    now: dependencies.now
  };
  const controller = createStudyApplication({
    alert: dependencies.alert,
    client,
    clock,
    configureDownloads: createDownloadConfigurator(dependencies.document),
    document: dependencies.document,
    dom,
    isMicrosoftEdge: () => true,
    loadMedia: player.loadMedia,
    navigate: dependencies.navigate,
    navigator: dependencies.navigator,
    redirectToDeviceWarning,
    renderCertificate: createCertificateRenderer(() => PdfConstructor),
    session,
    timers: {
      clearInterval: dependencies.clearInterval,
      setInterval: dependencies.setInterval
    },
    window: dependencies.window
  });
  player.setState(controller.state);
  controller.install();
  return {
    controller,
    dom: domFixtures,
    harness,
    player,
    setPdfConstructor(value) { PdfConstructor = value; },
    shaka: shaka.observations,
    topics
  };
}

function setStudyState(controller, {
  accumulatedGrade = 0.8,
  certificateId = "CERT-FIXTURE-001",
  completed = 0,
  email = "learner@example.test",
  fullName = "Invented Learner",
  grades = Array(10).fill(0.8)
} = {}) {
  const moduleGrades = [];
  grades.forEach((grade, index) => { moduleGrades[index + 1] = grade; });
  Object.assign(controller.state, {
    accumulatedGrade,
    certificateId,
    completedTopics: completed,
    email,
    fullName,
    moduleGrades,
    verifiedIndex: syntheticHandle
  });
}

function fixtureRefreshData(progress) {
  const result = {
    Usuário_Email: "learner@example.test",
    Usuário_Formação_CertificadoID: "CERT-FIXTURE-001",
    Usuário_Formação_NotaAcumulado: 0.8,
    Usuário_Formação_NúmeroTópicosConcluídos: progress,
    Usuário_NomeCompleto: "Invented Learner",
    Usuário_PrazoAcesso: "31/12/2035",
    Usuário_PrimeiroNome: "Invented",
    Usuário_Status_Login: "Inativo"
  };
  for (let module = 1; module <= 10; module += 1) {
    result[`Usuário_Formação_NotaMódulo${module}`] = 0.8;
  }
  return result;
}

function liveTopicCollection(topics, className) {
  const matchingTopics = () => topics.filter((topic) => topic.className === className);
  const collection = {
    get length() { return matchingTopics().length; },
    *[Symbol.iterator]() { yield* matchingTopics(); }
  };
  for (let index = 0; index < topics.length; index += 1) {
    Object.defineProperty(collection, index, {
      get() { return matchingTopics()[index]; }
    });
  }
  return collection;
}

function installClosedTopics(harness) {
  const moduleEnds = [13, 30, 51, 71, 90, 100, 114, 138, 157, 171];
  const topics = Array.from({ length: 171 }, (_, offset) => {
    const index = offset + 1;
    const module = moduleEnds.findIndex((end) => index <= end) + 1;
    return createTopic(harness, {
      className: "Container-Tópico-Fechado",
      dataIndex: index,
      module
    });
  });
  for (const className of [
    "Container-Tópico-Fechado",
    "Container-Tópico-Concluído",
    "Container-Tópico-Aberto"
  ]) {
    harness.classResults.set(className, liveTopicCollection(topics, className));
  }
  return topics;
}

async function runRefresh(
  progress,
  { omitDeadline = false, responseStatus = 200, storage = {} } = {}
) {
  const routes = [{
    method: "POST",
    path: "/plataforma_v2/refresh",
    response: {
      data: responseStatus === 200 ? fixtureRefreshData(progress) : {},
      status: responseStatus
    }
  }];
  const initialStorage = {
    "Horário-Encerramento-Sessão": "2000003600000",
    IndexVerificado: syntheticHandle,
    URL_Base_Backend: `${FIXTURE_ORIGIN}/plataforma_v2`,
    Usuário_Logado: "Sim",
    ...storage
  };
  if (omitDeadline) delete initialStorage["Horário-Encerramento-Sessão"];
  const result = createStudyHarness({
    includeDefaultDeadline: !omitDeadline,
    installTopics: true,
    routes,
    storage: initialStorage
  });
  result.harness.dispatchWindow("load");
  await result.harness.flush(20);
  return result;
}

test("[FLOW-02] study keeps 171 contiguous nodes and the ten frozen module boundaries", () => {
  const topicRecords = Array.from(
    studyHtml.matchAll(/<button\b([^>]*\bdata-index="(\d+)"[^>]*)>/g),
    ([, attributes, index]) => ({
      index: Number(index),
      name: attributes.match(/\bname="([^"]+)"/)?.[1]
    })
  );
  const topics = topicRecords.map(({ index }) => index);

  assert.deepEqual(topics, Array.from({ length: 171 }, (_, index) => index + 1));
  assert.deepEqual([...studyModuleTopicCounts], [13, 17, 21, 20, 19, 10, 14, 24, 19, 14]);

  const moduleEnds = [13, 30, 51, 71, 90, 100, 114, 138, 157, 171];
  for (const [moduleOffset, moduleEnd] of moduleEnds.entries()) {
    const moduleNumber = moduleOffset + 1;
    assert.equal(topicRecords[moduleEnd - 2].name, `TESTE MÓDULO ${moduleNumber}`);
    assert.equal(
      topicRecords[moduleEnd - 1].name,
      moduleNumber === 3 ? "FEEDBACK MÓDULO 2" : `FEEDBACK MÓDULO ${moduleNumber}`
    );
  }
});

test("[FLOW-02] saved progress opens the exact next module boundary and keeps performance selectable early", async () => {
  const boundaries = [0, 13, 30, 51, 71, 90, 100, 114, 138, 157];
  for (const [moduleIndex, completed] of boundaries.entries()) {
    const { dom, harness, topics } = await runRefresh(String(completed));
    assert.equal(topics.filter((topic) => topic.className === "Container-Tópico-Concluído").length, completed);
    assert.equal(topics[completed].className, "Container-Tópico-Aberto");
    assert.equal(topics.slice(0, completed).every((topic) => topic.disabled === false), true);
    assert.equal(topics[completed].disabled, false);
    assert.equal(topics[completed + 1].disabled, true);
    assert.equal(dom.moduleTopicContainers[moduleIndex].style.display, "block");
    assert.equal(dom.moduleHeaders[moduleIndex].getAttribute("aria-expanded"), "true");
    assert.equal(harness.document.activeElement, null);
    assert.equal(harness.alerts.length, 0);
  }

  const early = await runRefresh("0");
  early.harness.element("Formação-Botão-Desempenho-e-Certificado").dispatch("click");
  assert.equal(
    early.harness.element("Container-Externo-Desempenho-e-Certificado").style.display,
    "block"
  );
  assert.equal(early.topics[0].getAttribute("aria-current"), "false");
  assert.equal(early.harness.document.activeElement.id, "Nome-Tópico");

  const completed = await runRefresh("13");
  assert.equal(completed.harness.document.activeElement, null);
  completed.topics[0].dispatch("click");
  assert.equal(completed.harness.document.activeElement.id, "Nome-Tópico");
  assert.equal(completed.topics[0].style.backgroundColor, "#4a0816");
  assert.equal(completed.topics[0].querySelector(".Tópico-Nome").style.fontWeight, "500");
  completed.harness.element("Formação-Botão-Desempenho-e-Certificado").dispatch("click");
  assert.equal(completed.topics[0].style.backgroundColor, "#4a0816");
  assert.equal(completed.topics[0].querySelector(".Tópico-Nome").style.fontWeight, "500");
  assert.equal(completed.topics[0].getAttribute("aria-current"), "false");
});

test("[FLOW-02] saved progress leaves only completed/open topics interactive and module headers toggle", async () => {
  const { controller, dom, harness, topics } = await runRefresh("13");

  assert.equal(topics[0].dispatch("click").length, 1);
  assert.equal(topics[13].dispatch("click").length, 1);
  assert.equal(topics[14].dispatch("click").length, 0);

  assert.equal(dom.moduleHeaders[0].dispatch("click").length, 1);
  assert.equal(dom.moduleTopicContainers[0].style.display, "block");
  assert.equal(dom.moduleTopicContainers[1].style.display, "none");
  assert.equal(dom.moduleHeaders[0].getAttribute("aria-expanded"), "true");
  assert.equal(dom.moduleHeaders[1].getAttribute("aria-expanded"), "false");
  assert.equal(controller.state.openModule, "Módulo 1");

  dom.moduleHeaders[0].dispatch("click");
  assert.equal(dom.moduleTopicContainers[0].style.display, "none");
  assert.equal(dom.moduleHeaders[0].getAttribute("aria-expanded"), "false");
  await harness.flush(20);
});

test("[API-03] refresh carries the protected handle and preserves the separate client deadline", async () => {
  const { controller, harness, topics } = await runRefresh("171");
  const request = harness.guard.requests[0];

  assert.equal(request.path, "/plataforma_v2/refresh");
  assert.equal(request.method, "POST");
  assert.equal(request.headers["Content-Type"], "application/json");
  assert.deepEqual(Object.keys(request.body), ["IndexVerificado"]);
  assert.equal(request.body.IndexVerificado, "<redacted>");
  assertProtectedHandleExpectations(harness, 1);
  assert.equal(harness.element("Formação-Prazo-Acesso").textContent, "Acesso Expira: 31/12/2035");
  assert.equal(
    harness.sessionStorage.snapshot({ redact: ["IndexVerificado"] })["Horário-Encerramento-Sessão"],
    "2000003600000"
  );
  assert.equal(harness.sessionStorage.snapshot({ redact: ["IndexVerificado"] }).IndexVerificado, "<redacted>");
  assert.equal(topics.filter((topic) => topic.className === "Container-Tópico-Concluído").length, 171);
  assert.equal(controller.state.fullName, "Invented Learner");
  assert.equal(controller.state.firstName, "Invented");
  assert.equal(controller.state.email, "learner@example.test");
  assert.equal(controller.state.loginStatus, "Inativo");
  assert.deepEqual(controller.state.moduleGrades.slice(1), Array(10).fill(0.8));
  assert.equal(controller.state.accumulatedGrade, 0.8);
  assert.equal(controller.state.certificateId, "CERT-FIXTURE-001");
});

test("[API-03] refresh retains named platform-data and generic failure mappings", async () => {
  for (const [error, expected] of [
    ["learning_platform.read_platform_data_failed", "Erro_001"],
    [undefined, "Erro_000"]
  ]) {
    const { harness } = createStudyHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/refresh",
        response: { data: error ? { error } : {}, status: 500 }
      }],
      storage: {
        IndexVerificado: "synthetic-row-capability",
        URL_Base_Backend: `${FIXTURE_ORIGIN}/plataforma_v2`,
        Usuário_Logado: "Sim"
      }
    });
    harness.dispatchWindow("load");
    await harness.flush(20);
    assert.equal(harness.alerts.length, 1);
    assert.match(harness.alerts[0], new RegExp(`^${expected}:`));
  }
});

test("[FLOW-02] refresh preserves malformed negative, fractional, NaN, overflow, and exact-complete behavior", async () => {
  for (const malformed of ["-1", "0.5", "172"]) {
    const { harness } = await runRefresh(malformed);
    assert.equal(harness.alerts.length, 1, `malformed class ${malformed}`);
    assert.match(harness.alerts[0], /^Erro_000:/);
  }

  const nanRun = await runRefresh("not-a-number");
  assert.equal(nanRun.harness.alerts.length, 0);
  assert.equal(
    nanRun.harness.element("Container-Externo-Desempenho-e-Certificado").style.display,
    "block"
  );
  assert.equal(nanRun.harness.document.activeElement, null);

  const completeRun = await runRefresh("171");
  assert.equal(completeRun.harness.alerts.length, 0);
  assert.equal(
    completeRun.harness.element("Container-Externo-Desempenho-e-Certificado").style.display,
    "block"
  );
  assert.equal(completeRun.harness.document.activeElement, null);
});

test("[ERROR-01] protected refresh 401 remains the current generic Erro_000 outcome", async () => {
  const { harness } = await runRefresh("0", { responseStatus: 401 });

  assertProtectedHandleExpectations(harness, 1);
  assert.equal(harness.alerts.length, 1);
  assert.match(harness.alerts[0], /^Erro_000:/);
  assert.doesNotMatch(harness.alerts[0], /expir|autoriza/i);
  assert.equal(harness.sessionStorage.snapshot().Usuário_Logado, "Sim");
  assert.equal(harness.navigation.includes("/plataforma/login"), false);
});

test("[FLOW-03] manual and ended completion can race into two optimistic protected updates", async () => {
  const neverSettles = new Promise(() => {});
  const { controller, harness } = createStudyHarness({
    routes: [{
      handler: async () => neverSettles,
      method: "POST",
      path: "/plataforma_v2/updates"
    }]
  });
  setStudyState(controller);
  controller.state.openModule = "Módulo 1";
  const topic = createTopic(harness);
  controller.openTopic.call(topic);

  harness.element("Faixa-Inferior").onclick(eventFor("Botão-Completar-e-Continuar"));
  harness.element("Container-Interno-Shaka-Player").onended();
  await harness.flush();

  assert.equal(harness.guard.requests.length, 2);
  assertProtectedHandleExpectations(harness, 2);
  assert.deepEqual(
    harness.guard.requests.map((request) => request.body.NúmeroTópicosConcluídos),
    [1, 2]
  );
  assert.equal(
    controller.state.completedTopics,
    2
  );
  assert.ok(harness.guard.requests.every((request) => request.body.IndexVerificado === "<redacted>"));
});

test("[API-03] content update keeps exact ordinary fields and rolls back only local state on failure", async () => {
  const { controller, harness } = createStudyHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/updates",
      response: {
        data: { error: "learning_platform.update_platform_data_failed" },
        status: 500
      }
    }]
  });
  setStudyState(controller, { completed: 4 });
  const topic = createTopic(harness, { dataIndex: 5 });
  controller.completeTopic(topic);
  await harness.flush(20);

  const request = harness.guard.requests[0];
  assertProtectedHandleExpectations(harness, 1);
  assert.equal(request.path, "/plataforma_v2/updates");
  assert.equal(request.body.TipoAtualização, "NúmeroTópicosConcluídos");
  assert.equal(request.body.NúmeroTópicosConcluídos, 5);
  assert.equal(request.body.NúmeroMódulo, "n/a");
  assert.equal(request.body.NotaTeste, "n/a");
  assert.equal(controller.state.completedTopics, 4);
  assert.match(harness.element("Faixa-Inferior").innerHTML, /Completar e Continuar/);
  assert.equal(harness.document.activeElement.id, "Botão-Completar-e-Continuar");
  assert.match(harness.alerts[0], /^Erro_008:/);
});

test("[FLOW-03] successful content completion advances and rewires the exact next node", async () => {
  const { controller, harness } = createStudyHarness({
    routes: [{ method: "POST", path: "/plataforma_v2/updates", response: { data: {} } }]
  });
  setStudyState(controller, { completed: 4 });
  const topic = createTopic(harness, { dataIndex: 5 });
  const next = createTopic(harness, {
    className: "Container-Tópico-Fechado",
    dataIndex: 6
  });
  let nextOpenCalls = 0;
  next.addEventListener = (type) => {
    if (type === "click") nextOpenCalls += 1;
  };
  harness.selectorResults.set('[data-index="6"]', next);
  controller.completeTopic(topic);
  await harness.flush(20);

  assertProtectedHandleExpectations(harness, 1);
  assert.equal(topic.className, "Container-Tópico-Concluído");
  assert.equal(next.className, "Container-Tópico-Aberto");
  assert.equal(next.disabled, false);
  assert.equal(next.querySelector(".Tópico-Nome").style.fontWeight, "500");
  assert.match(harness.element("Nome-Tópico").innerHTML, /Conteúdo sintético/);
  assert.equal(harness.document.activeElement.id, "Nome-Tópico");
  assert.equal(nextOpenCalls, 1);
  assert.equal(controller.state.completedTopics, 5);
});

test("[FLOW-04] assessment mutates controls globally and submits the client-computed grade without timing or dedupe", async () => {
  const { controller, harness } = createStudyHarness({
    routes: [{ method: "POST", path: "/plataforma_v2/updates", response: { data: {}, status: 200 } }]
  });
  setStudyState(controller, { completed: 11, grades: Array(10).fill(0) });

  const topic = createTopic(harness, {
    dataIndex: 12,
    name: "TESTE MÓDULO 1",
    visibleName: "Teste: Módulo 1"
  });
  const moduleOne = {};
  const moduleTwo = {};
  const correct = Array.from({ length: 4 }, (_, index) => harness.element(`correct-${index}`));
  const incorrect = [harness.element("incorrect-0")];
  const outsideModule = harness.element("outside-module-answer");
  for (const input of [...correct, ...incorrect]) {
    input.parentElement = harness.element(`answer-parent-${input.id}`);
    input.closest = (selector) => selector === "#Container-Questões-Módulo-1" ? moduleOne : null;
  }
  outsideModule.parentElement = harness.element("outside-answer-parent");
  outsideModule.checked = true;
  outsideModule.disabled = true;
  outsideModule.closest = (selector) => selector === "#Container-Questões-Módulo-2" ? moduleTwo : null;
  correct[0].checked = true;
  correct[1].checked = true;
  incorrect[0].checked = true;

  const allAnswers = [...correct, ...incorrect, outsideModule];
  harness.selectorResults.set(
    `input[query-id="${correctAnswerId}"], input[query-id="${incorrectAnswerId}"]`,
    allAnswers
  );
  harness.selectorResults.set(`input[query-id="${correctAnswerId}"]:checked`, correct.slice(0, 2));
  harness.selectorResults.set(`input[query-id="${incorrectAnswerId}"]:checked`, incorrect);
  harness.selectorResults.set(`input[query-id="${correctAnswerId}"]`, correct);
  harness.selectorResults.set(`input[query-id="${correctAnswerId}"]:not(:checked)`, correct.slice(2));
  const nextAssessmentTopic = createTopic(harness, {
    className: "Container-Tópico-Fechado",
    dataIndex: 13,
    name: "FEEDBACK MÓDULO 1",
    visibleName: "Feedback: Módulo 1"
  });
  harness.selectorResults.set('[data-index="13"]', nextAssessmentTopic);

  controller.openTopic.call(topic);
  assert.equal(outsideModule.checked, false);
  assert.equal(outsideModule.disabled, false);

  harness.element("Faixa-Inferior").onclick(eventFor("Botão-Enviar-Respostas"));
  assert.equal(harness.document.activeElement.id, "Botão-Confirmar-Envio-Respostas");
  harness.element("Faixa-Inferior").onclick(eventFor("Botão-Confirmar-Envio-Respostas"));
  await harness.flush(20);

  const request = harness.guard.requests[0];
  const body = request.body;
  assertProtectedHandleExpectations(harness, 1);
  assert.deepEqual(Object.keys(body), [
    "TipoAtualização",
    "IndexVerificado",
    "NúmeroTópicosConcluídos",
    "NúmeroMódulo",
    "NotaTeste"
  ]);
  assert.deepEqual(request.headers, { "Content-Type": "application/json" });
  assert.equal(body.IndexVerificado, "<redacted>");
  assert.equal(body.TipoAtualização, "NúmeroTópicosConcluídos-e-NotaTeste");
  assert.equal(body.NúmeroTópicosConcluídos, 12);
  assert.equal(body.NúmeroMódulo, 1);
  assert.equal(body.NotaTeste, 0.25);
  assert.equal(Object.keys(body).some((key) => /tempo|tentativa|dedupe|idempot/i.test(key)), false);
  assert.ok(allAnswers.every((input) => input.disabled));
  assert.equal(controller.state.moduleGrades[1], 0.25);
  assert.equal(controller.state.accumulatedGrade, 0.025);
  assert.equal(nextAssessmentTopic.disabled, false);
  assert.equal(harness.element("Nota").innerHTML, "25.0%");
  assert.equal(harness.element("Percentil").innerHTML, "0.0%");
  assert.match(harness.element("Faixa-Inferior").innerHTML, /Botão-Continuar/);
  assert.equal(harness.document.activeElement.id, "Container-Externo-Aviso-Revisão");
  assert.equal(correct[0].parentElement.style.backgroundColor, "#94fd7f");
  assert.equal(correct[2].parentElement.style.backgroundColor, "#d3ffcb");
  assert.equal(incorrect[0].parentElement.style.backgroundColor, "#fd7f7f");
});

test("[API-04] assessment and feedback retain named platform-data rollback mapping", async () => {
  const assessmentRun = createStudyHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/updates",
      response: {
        data: { error: "learning_platform.update_platform_data_failed" },
        status: 500
      }
    }]
  });
  const { controller: assessmentController, harness: assessment } = assessmentRun;
  setStudyState(assessmentController, { completed: 11, grades: Array(10).fill(0) });
  const assessmentTopic = createTopic(assessment, {
    dataIndex: 12,
    name: "TESTE MÓDULO 1",
    visibleName: "Teste: Módulo 1"
  });
  const correct = assessment.element("erro-008-correct");
  correct.checked = true;
  correct.parentElement = assessment.element("erro-008-parent");
  correct.closest = (selector) => selector === "#Container-Questões-Módulo-1" ? {} : null;
  assessment.selectorResults.set(
    `input[query-id="${correctAnswerId}"], input[query-id="${incorrectAnswerId}"]`,
    [correct]
  );
  assessment.selectorResults.set(`input[query-id="${correctAnswerId}"]:checked`, [correct]);
  assessment.selectorResults.set(`input[query-id="${incorrectAnswerId}"]:checked`, []);
  assessment.selectorResults.set(`input[query-id="${correctAnswerId}"]`, [correct]);
  assessmentController.openTopic.call(assessmentTopic);
  assessment.element("Faixa-Inferior").onclick(eventFor("Botão-Enviar-Respostas"));
  assessment.element("Faixa-Inferior").onclick(eventFor("Botão-Confirmar-Envio-Respostas"));
  await assessment.flush(20);
  assertProtectedHandleExpectations(assessment, 1);
  assert.match(assessment.alerts[0], /^Erro_008:/);
  assert.equal(assessmentController.state.completedTopics, 11);

  const feedbackRun = createStudyHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/processa-feedback",
      response: {
        data: { error: "learning_platform.update_platform_data_failed" },
        status: 500
      }
    }]
  });
  const { controller: feedbackController, harness: feedback } = feedbackRun;
  setStudyState(feedbackController, { completed: 50 });
  const feedbackTopic = createTopic(feedback, {
    dataIndex: 51,
    module: 3,
    name: "FEEDBACK MÓDULO 2",
    visibleName: "Feedback: Módulo 3"
  });
  feedback.selectorResults.set(".Opções-Feedbacks", []);
  feedbackController.openTopic.call(feedbackTopic);
  feedback.element("Faixa-Inferior").onclick(eventFor("Botão-Enviar-Feedback"));
  await feedback.flush(20);
  assertProtectedHandleExpectations(feedback, 1);
  assert.match(feedback.alerts[0], /^Erro_008:/);
  assert.equal(feedbackController.state.completedTopics, 50);
});

test("[ERROR-02] named study writes preserve rollback and request effects", async () => {
  const redactedStorage = {
    "Horário-Encerramento-Sessão": "2000003600000",
    IndexVerificado: "<redacted>",
    URL_Base_Backend: "<redacted>",
    Usuário_Logado: "Sim"
  };

  function snapshotMutationFailure({ controller, harness, topic }) {
    return {
      alert: [...harness.alerts],
      completedTopics: controller.state.completedTopics,
      consoleCalls: [...harness.consoleCalls],
      cursor: harness.document.body.style.cursor,
      footer: harness.element("Faixa-Inferior").innerHTML,
      navigation: [...harness.navigation],
      requests: harness.guard.requests,
      storage: harness.sessionStorage.snapshot({
        redact: ["IndexVerificado", "URL_Base_Backend"]
      }),
      timeline: harness.timeline.filter(({ type }) => [
        "fetch", "navigate", "storage-set"
      ].includes(type)),
      topicClass: topic.className
    };
  }

  async function runProgressFailure(machineValue) {
    const { controller, harness } = createStudyHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/updates",
        response: { data: { error: machineValue }, status: 500 }
      }]
    });
    setStudyState(controller, { completed: 4 });
    const topic = createTopic(harness, { dataIndex: 5 });
    controller.completeTopic(topic);
    await harness.flush(20);
    assertProtectedHandleExpectations(harness, 1);
    harness.hostGuard.assertUnused();
    return { controller, harness, snapshot: snapshotMutationFailure({ controller, harness, topic }) };
  }

  async function runFeedbackFailure(machineValue) {
    const { controller, harness } = createStudyHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/processa-feedback",
        response: { data: { error: machineValue }, status: 500 }
      }]
    });
    setStudyState(controller, { completed: 50 });
    const topic = createTopic(harness, {
      dataIndex: 51,
      module: 3,
      name: "FEEDBACK MÓDULO 2",
      visibleName: "Feedback: Módulo 3"
    });
    harness.selectorResults.set(".Opções-Feedbacks", []);
    controller.openTopic.call(topic);
    harness.element("Campo-Comentários").value = "Invented transition feedback";
    harness.element("Faixa-Inferior").onclick(eventFor("Botão-Enviar-Feedback"));
    await harness.flush(20);
    assertProtectedHandleExpectations(harness, 1);
    harness.hostGuard.assertUnused();
    return { controller, harness, snapshot: snapshotMutationFailure({ controller, harness, topic }) };
  }

  const transitions = [
    {
      expected: {
        alert: "Erro_008: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.",
        completedTopics: 4,
        footer: '<button type="button" id="Botão-Completar-e-Continuar">Completar e Continuar →</button>',
        path: "/plataforma_v2/updates",
        requestBody: {
          TipoAtualização: "NúmeroTópicosConcluídos",
          IndexVerificado: "<redacted>",
          NúmeroTópicosConcluídos: 5,
          NúmeroMódulo: "n/a",
          NotaTeste: "n/a"
        }
      },
      named: "learning_platform.update_platform_data_failed",
      run: runProgressFailure
    },
    {
      expected: {
        alert: "Erro_009: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.",
        completedTopics: 50,
        footer: '<button type="button" id="Botão-Enviar-Feedback">Enviar Feedback</button>',
        path: "/plataforma_v2/processa-feedback",
        requestBody: {
          IndexVerificado: "<redacted>",
          NúmeroTópicosConcluídos: 51,
          Usuário_NomeCompleto: "Invented Learner",
          Usuário_Email: "learner@example.test",
          Feedback_DataPreenchimento: "<local-date-time>",
          NúmeroMódulo: 2,
          Feedback_Comentários: "Invented transition feedback"
        }
      },
      named: "learning_platform.append_feedback_failed",
      run: runFeedbackFailure
    }
  ];

  for (const { expected, named, run } of transitions) {
    const namedResult = await run(named);
    const [request] = namedResult.snapshot.requests;
    const normalizedRequest = {
      ...request,
      body: { ...request.body }
    };
    if (Object.hasOwn(normalizedRequest.body, "Feedback_DataPreenchimento")) {
      assert.match(
        normalizedRequest.body.Feedback_DataPreenchimento,
        /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/
      );
      normalizedRequest.body.Feedback_DataPreenchimento = "<local-date-time>";
    }

    assert.deepEqual(
      { ...namedResult.snapshot, requests: [normalizedRequest] },
      {
        alert: [expected.alert],
        completedTopics: expected.completedTopics,
        consoleCalls: [],
        cursor: "default",
        footer: expected.footer,
        navigation: [],
        requests: [{
          body: expected.requestBody,
          formFields: undefined,
          headers: { "Content-Type": "application/json" },
          method: "POST",
          path: expected.path
        }],
        storage: redactedStorage,
        timeline: [{ method: "POST", path: expected.path, type: "fetch" }],
        topicClass: "Container-Tópico-Aberto"
      },
      named
    );
    assertMachineValueHidden(namedResult.harness, named);
  }
});

test("[API-04] assessment preserves client-supplied progress, module, and grade fields", async () => {
  assert.equal(
    /TipoAtualização:\s*'NúmeroTópicosConcluídos-e-NotaTeste'/.test(studySource),
    true,
    "Assessment must retain the grade-bearing update type"
  );
  assert.equal(
    /NotaTeste:\s*score/.test(studySource),
    true,
    "Assessment must submit its browser-computed grade"
  );
  assert.equal(
    /Math\.max\(0, \(selectedCorrect - selectedIncorrect\) \/ totalCorrect\)/.test(studySource),
    true,
    "Assessment must retain the current score formula"
  );
  assert.equal(
    /idempotency|dedupe|attemptId|tempoLimite/i.test(studySource),
    false,
    "Assessment must not gain a time or dedupe seam during baseline locking"
  );
});

test("[FLOW-05] feedback preserves partial-success rollback and duplicate-visible retry exposure", async () => {
  const backendTimeline = [];
  let attempts = 0;
  const { controller, dom, harness } = createStudyHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/processa-feedback",
      handler: async () => {
        attempts += 1;
        backendTimeline.push("progress-write:success");
        if (attempts === 1) {
          backendTimeline.push("feedback-append:failure");
          return {
            data: { error: "learning_platform.append_feedback_failed" },
            status: 500
          };
        }
        backendTimeline.push("feedback-append:success");
        return { data: {}, status: 200 };
      }
    }]
  });
  setStudyState(controller, { completed: 50 });
  const topic = createTopic(harness, {
    dataIndex: 51,
    module: 3,
    name: "FEEDBACK MÓDULO 2",
    visibleName: "Feedback: Módulo 3"
  });
  const next = createTopic(harness, {
    className: "Container-Tópico-Fechado",
    dataIndex: 52,
    module: 4,
    name: "1. CONTEÚDO SINTÉTICO",
    visibleName: "1. Conteúdo sintético - 00:01"
  });
  harness.selectorResults.set('[data-index="52"]', next);
  const ratingFixtures = new Map([
    ['input[name="Tamanho-Módulo"]:checked', "-1"],
    ['input[name="Qualidade-Conteúdo"]:checked', "8"],
    ['input[name="Qualidade-Plataforma"]:checked', "9"],
    ['input[name="Qualidade-Materiais-Impressos"]:checked', "10"]
  ]);
  for (const [selector, value] of ratingFixtures) {
    const input = harness.element(`rating-${value}-${selector.length}`);
    input.setAttribute("query-id", value);
    harness.selectorResults.set(selector, input);
  }
  harness.selectorResults.set(".Opções-Feedbacks", []);
  harness.element("Campo-Comentários").value = "Invented feedback";

  controller.openTopic.call(topic);
  harness.element("Campo-Comentários").value = "Invented feedback";
  harness.element("Faixa-Inferior").onclick(eventFor("Botão-Enviar-Feedback"));
  await harness.flush(20);

  assert.equal(controller.state.completedTopics, 50);
  assert.match(harness.alerts[0], /^Erro_009:/);
  assert.deepEqual(backendTimeline, ["progress-write:success", "feedback-append:failure"]);

  harness.element("Faixa-Inferior").onclick(eventFor("Botão-Enviar-Feedback"));
  await harness.flush(20);

  assertProtectedHandleExpectations(harness, 2);
  assert.deepEqual(backendTimeline, [
    "progress-write:success",
    "feedback-append:failure",
    "progress-write:success",
    "feedback-append:success"
  ]);
  assert.equal(harness.guard.requests.length, 2);
  assert.equal(harness.alerts.length, 1);
  assert.equal(controller.state.completedTopics, 51);
  assert.equal(topic.className, "Container-Tópico-Concluído");
  assert.equal(next.className, "Container-Tópico-Aberto");
  assert.equal(dom.moduleTopicContainers[3].style.display, "block");
  assert.equal(harness.element("Container-Externo-Conteúdo").style.display, "flex");
  for (const request of harness.guard.requests) {
    assert.deepEqual(Object.keys(request.body), [
      "IndexVerificado",
      "NúmeroTópicosConcluídos",
      "Usuário_NomeCompleto",
      "Usuário_Email",
      "Feedback_DataPreenchimento",
      "NúmeroMódulo",
      "Feedback_TamanhoMódulo",
      "Feedback_QualidadeConteúdo",
      "Feedback_QualidadePlataforma",
      "Feedback_QualidadeMateriaisImpressos",
      "Feedback_Comentários"
    ]);
    assert.deepEqual(request.headers, { "Content-Type": "application/json" });
    assert.equal(request.body.IndexVerificado, "<redacted>");
    assert.equal(request.body.NúmeroTópicosConcluídos, 51);
    assert.match(request.body.Feedback_DataPreenchimento, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    assert.equal(request.body.NúmeroMódulo, 2);
    assert.equal(request.body.Usuário_NomeCompleto, "Invented Learner");
    assert.equal(request.body.Usuário_Email, "learner@example.test");
    assert.equal(request.body.Feedback_TamanhoMódulo, "-1");
    assert.equal(request.body.Feedback_QualidadeConteúdo, "8");
    assert.equal(request.body.Feedback_QualidadePlataforma, "9");
    assert.equal(request.body.Feedback_QualidadeMateriaisImpressos, "10");
    assert.equal(request.body.Feedback_Comentários, "Invented feedback");
    assert.equal(Object.keys(request.body).some((key) => /dedupe|idempot/i.test(key)), false);
  }
});

test("[API-04] feedback omits unselected ratings and keeps the Module 3 visible-label/module 2 payload mismatch", async () => {
  const { controller, harness } = createStudyHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/processa-feedback",
      response: { data: {}, status: 200 }
    }]
  });
  setStudyState(controller, { completed: 50 });
  const topic = createTopic(harness, {
    dataIndex: 51,
    module: 3,
    name: "FEEDBACK MÓDULO 2",
    visibleName: "Feedback: Módulo 3"
  });
  const next = createTopic(harness, {
    className: "Container-Tópico-Fechado",
    dataIndex: 52,
    module: 4
  });
  harness.selectorResults.set('[data-index="52"]', next);
  harness.selectorResults.set(".Opções-Feedbacks", []);
  controller.openTopic.call(topic);
  harness.element("Campo-Comentários").value = "No ratings selected";
  harness.element("Faixa-Inferior").onclick(eventFor("Botão-Enviar-Feedback"));
  await harness.flush(20);

  const body = harness.guard.requests[0].body;
  assertProtectedHandleExpectations(harness, 1);
  assert.equal(harness.alerts.length, 0);
  assert.equal(controller.state.completedTopics, 51);
  assert.equal(topic.className, "Container-Tópico-Concluído");
  assert.equal(next.className, "Container-Tópico-Aberto");
  assert.equal(body.NúmeroMódulo, 2);
  for (const key of [
    "Feedback_TamanhoMódulo",
    "Feedback_QualidadeConteúdo",
    "Feedback_QualidadePlataforma",
    "Feedback_QualidadeMateriaisImpressos"
  ]) {
    assert.equal(Object.hasOwn(body, key), false, key);
  }
});

async function runProtectedStudy401(kind) {
  const path = kind === "feedback" ? "/plataforma_v2/processa-feedback" : "/plataforma_v2/updates";
  const { controller, harness } = createStudyHarness({
    routes: [{ method: "POST", path, response: { data: {}, status: 401 } }]
  });
  const completed = kind === "feedback" ? 50 : kind === "assessment" ? 11 : 4;
  setStudyState(controller, { completed, grades: Array(10).fill(0) });

  if (kind === "content") {
    const topic = createTopic(harness, { dataIndex: 5 });
    controller.completeTopic(topic);
  } else if (kind === "assessment") {
    const topic = createTopic(harness, {
      dataIndex: 12,
      name: "TESTE MÓDULO 1",
      visibleName: "Teste: Módulo 1"
    });
    const correct = harness.element("401-correct-answer");
    correct.checked = true;
    correct.parentElement = harness.element("401-correct-parent");
    correct.closest = (selector) => selector === "#Container-Questões-Módulo-1" ? {} : null;
    harness.selectorResults.set(
      `input[query-id="${correctAnswerId}"], input[query-id="${incorrectAnswerId}"]`,
      [correct]
    );
    harness.selectorResults.set(`input[query-id="${correctAnswerId}"]:checked`, [correct]);
    harness.selectorResults.set(`input[query-id="${incorrectAnswerId}"]:checked`, []);
    harness.selectorResults.set(`input[query-id="${correctAnswerId}"]`, [correct]);
    controller.openTopic.call(topic);
    harness.element("Faixa-Inferior").onclick(eventFor("Botão-Enviar-Respostas"));
    harness.element("Faixa-Inferior").onclick(eventFor("Botão-Confirmar-Envio-Respostas"));
  } else {
    const topic = createTopic(harness, {
      dataIndex: 51,
      module: 3,
      name: "FEEDBACK MÓDULO 2",
      visibleName: "Feedback: Módulo 3"
    });
    harness.selectorResults.set(".Opções-Feedbacks", []);
    controller.openTopic.call(topic);
    harness.element("Faixa-Inferior").onclick(eventFor("Botão-Enviar-Feedback"));
  }
  await harness.flush(20);
  return { completed, controller, harness };
}

test("[ERROR-01] every protected study mutation maps synthetic 401 to generic Erro_000", async () => {
  for (const kind of ["content", "assessment", "feedback"]) {
    const { completed, controller, harness } = await runProtectedStudy401(kind);
    assertProtectedHandleExpectations(harness, 1);
    assert.equal(harness.alerts.length, 1, kind);
    assert.match(harness.alerts[0], /^Erro_000:/, kind);
    assert.doesNotMatch(harness.alerts[0], /expir|autoriza/i, kind);
    assert.equal(
      controller.state.completedTopics,
      completed,
      kind
    );
    assert.equal(harness.sessionStorage.snapshot().Usuário_Logado, "Sim", kind);
    assert.equal(harness.navigation.includes("/plataforma/login"), false, kind);
  }
});

function createPdfRecorder() {
  const calls = [];
  class Pdf {
    addImage(target, format) {
      calls.push({ format, path: String(target) });
    }
    save(filename) { calls.push({ filename, type: "save" }); }
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    splitTextToSize(value) { return value; }
    text(value) {
      const rendered = String(value);
      if (rendered.startsWith("Validação via: ")) {
        calls.push({
          ...safeNetworkPath(rendered.slice("Validação via: ".length)),
          type: "external-text"
        });
      } else {
        calls.push({ text: rendered, type: "text" });
      }
    }
  }
  return { calls, Pdf };
}

function certificateRun({ completed = 171, grade }) {
  const { controller, harness, setPdfConstructor } = createStudyHarness();
  setStudyState(controller, { accumulatedGrade: grade, completed });
  const recorder = createPdfRecorder();
  setPdfConstructor(recorder.Pdf);
  controller.openPerformance();
  return { harness, recorder };
}

test("[FLOW-06] performance view keeps exact chart scale, colors, percentages, and layout changes", () => {
  const { controller, harness } = createStudyHarness();
  const grades = [0, 0.35, 0.7, 0.85, 1, 0.8, 0.8, 0.8, 0.8, 0.8];
  setStudyState(controller, { accumulatedGrade: 0.95, grades });

  controller.openPerformance();

  assert.equal(harness.element("Container-Interno-Shaka-Player").pauseCalls, 1);
  assert.equal(harness.element("Seção-Navegação").scrollTop, 0);
  assert.equal(harness.element("Nome-Tópico").innerHTML, "<b>Desempenho e Certificado</b>");
  assert.equal(harness.element("Container-Externo-Conteúdo").style.display, "none");
  assert.equal(harness.element("Container-Externo-Testes").style.display, "none");
  assert.equal(harness.element("Container-Externo-Feedbacks").style.display, "none");
  assert.equal(
    harness.element("Container-Externo-Desempenho-e-Certificado").style.display,
    "block"
  );
  assert.equal(harness.element("Faixa-Inferior").style.display, "none");
  assert.equal(harness.document.activeElement.id, "Nome-Tópico");

  const expected = [
    ["0px", "rgb(164,16,52)", "0.0%"],
    ["140px", "rgb(188,102,40)", "35.0%"],
    ["280px", "rgb(212,187,28)", "70.0%"],
    ["340px", "rgb(111,170,45)", "85.0%"],
    ["400px", "rgb(10,152,62)", "100.0%"]
  ];
  expected.forEach(([height, color, percentage], offset) => {
    const moduleNumber = offset + 1;
    assert.equal(harness.element(`Barra-Nota-Teste-Módulo-${moduleNumber}`).style.height, height);
    assert.equal(
      harness.element(`Barra-Nota-Teste-Módulo-${moduleNumber}`).style.backgroundColor,
      color
    );
    assert.equal(
      harness.element(`Percentual-Nota-Teste-Módulo-${moduleNumber}`).innerHTML,
      percentage
    );
  });
  assert.equal(harness.element("Barra-Nota-Testes-Acumulado").style.height, "380px");
  assert.equal(
    harness.element("Barra-Nota-Testes-Acumulado").style.backgroundColor,
    "rgb(44,158,56)"
  );
  assert.equal(harness.element("Percentual-Nota-Testes-Acumulado").innerHTML, "95.0%");
});

test("[FLOW-06] certificate eligibility keeps exact completion and grade thresholds", () => {
  const cases = [
    { expected: "Inelegível", grade: 0.69, visible: false },
    { expected: "Aprovado", grade: 0.7, visible: true },
    { expected: "Aprovado", grade: 0.949, visible: true },
    { expected: "Aprovado com Honra", grade: 0.95, visible: true }
  ];
  for (const fixture of cases) {
    const { harness } = certificateRun(fixture);
    assert.match(harness.element("Status-Certificado").innerHTML, new RegExp(fixture.expected));
    assert.equal(
      harness.element("Container-Interno-Orientações-Certificado").style.display === "block",
      fixture.visible
    );
  }

  const incomplete = certificateRun({ completed: 170, grade: 0.95 }).harness;
  assert.equal(incomplete.element("Status-Certificado").innerHTML, "");
  assert.notEqual(incomplete.element("Container-Interno-Orientações-Certificado").style.display, "block");
});

test("[FLOW-06] certificate PDF uses client-held identity, grade branch, ID, validation path, and three local images", () => {
  const { harness, recorder } = certificateRun({ grade: 0.95 });
  const ordinary = certificateRun({ grade: 0.7 });
  let prevented = false;
  harness.element("Botão-Download-Certificado-Impresso").onclick({
    preventDefault() { prevented = true; }
  });
  ordinary.harness.element("Botão-Download-Certificado-Impresso").onclick({
    preventDefault() {}
  });

  assert.equal(prevented, true);
  assert.equal(
    recorder.calls.some((call) => call.text === "Aprovação com Honra"),
    true
  );
  assert.equal(
    ordinary.recorder.calls.some((call) => call.text === "Aprovação com Honra"),
    false
  );
  const images = recorder.calls.filter((call) => call.format);
  assert.deepEqual(images, [
    { format: "PNG", path: "/plataforma/estudo/img/LOGO_MACHADO_CERTIFICADO.jpg" },
    { format: "PNG", path: "/plataforma/estudo/img/ASSINATURA.png" },
    { format: "PNG", path: "/plataforma/estudo/img/ATLAS.png" }
  ]);
  assert.ok(recorder.calls.some((call) => call.text === "Invented Learner"));
  assert.ok(recorder.calls.some((call) => call.text === "Certificado ID#: CERT-FIXTURE-001"));
  assert.ok(recorder.calls.some((call) =>
    call.type === "external-text" &&
    call.valid === true &&
    call.pathname === "/validacao-certificados/"
  ));
  assert.ok(recorder.calls.some((call) => call.filename === "CERTIFICADO - Invented Learner.pdf"));
});

test("[FLOW-06] logout and timer expiry only flip the logged flag and navigate without revoking stored state", async () => {
  const { harness } = await runRefresh("171");
  const preservedBefore = harness.sessionStorage.snapshot({ redact: ["IndexVerificado"] });

  harness.element("Botão-Sair").dispatch("click");
  const afterLogout = harness.sessionStorage.snapshot({ redact: ["IndexVerificado"] });
  assert.equal(afterLogout.Usuário_Logado, "Não");
  for (const key of ["IndexVerificado", "Horário-Encerramento-Sessão", "URL_Base_Backend"]) {
    assert.equal(afterLogout[key], preservedBefore[key]);
  }
  assert.equal(harness.navigation.at(-1), "/plataforma/login");

  const expiryRun = await runRefresh("171", {
    storage: { "Horário-Encerramento-Sessão": "1999999999999" }
  });
  const preservedBeforeExpiry = expiryRun.harness.sessionStorage.snapshot({
    redact: ["IndexVerificado"]
  });
  const interval = [...expiryRun.harness.timers.values()].find((timer) => timer.interval);
  assert.ok(interval);
  interval.callback();
  const afterExpiry = expiryRun.harness.sessionStorage.snapshot({ redact: ["IndexVerificado"] });
  assert.equal(afterExpiry.Usuário_Logado, "Não");
  for (const key of ["IndexVerificado", "Horário-Encerramento-Sessão", "URL_Base_Backend"]) {
    assert.equal(afterExpiry[key], preservedBeforeExpiry[key]);
  }
  assert.equal(expiryRun.harness.navigation.at(-1), "/plataforma/login");
});

test("[FLOW-06] timer preserves formatting, warning thresholds, missing expiry, and malformed non-expiry", async () => {
  const boundaryRun = await runRefresh("171", {
    storage: { "Horário-Encerramento-Sessão": "2000000601000" }
  });
  const boundaryIntervalId = [...boundaryRun.harness.timers.entries()]
    .find(([, timer]) => timer.interval)[0];
  boundaryRun.harness.runTimer(boundaryIntervalId);
  assert.equal(boundaryRun.harness.element("Usuário-Tempo-Sessão").textContent, "Tempo Sessão: 00:10:01");
  assert.notEqual(boundaryRun.harness.element("Usuário-Tempo-Sessão").style.color, "red");

  boundaryRun.harness.advanceClock(1000);
  boundaryRun.harness.runTimer(boundaryIntervalId);
  assert.equal(boundaryRun.harness.element("Usuário-Tempo-Sessão").textContent, "Tempo Sessão: 00:10:00");
  assert.equal(boundaryRun.harness.element("Usuário-Tempo-Sessão").style.color, "red");

  boundaryRun.harness.advanceClock(299000);
  boundaryRun.harness.runTimer(boundaryIntervalId);
  assert.equal(
    boundaryRun.harness.element("Usuário-Tempo-Sessão").classList.contains("Tempo-Sessão-Últimos-5min"),
    false
  );

  boundaryRun.harness.advanceClock(1000);
  boundaryRun.harness.runTimer(boundaryIntervalId);
  assert.equal(
    boundaryRun.harness.element("Usuário-Tempo-Sessão").classList.contains("Tempo-Sessão-Últimos-5min"),
    true
  );

  const missingAtLoad = await runRefresh("171", { omitDeadline: true });
  const missingTimer = [...missingAtLoad.harness.timers.entries()].find(([, timer]) => timer.interval)[0];
  missingAtLoad.harness.runTimer(missingTimer);
  assert.equal(missingAtLoad.harness.sessionStorage.snapshot().Usuário_Logado, "Não");

  const malformedRun = await runRefresh("171", {
    storage: { "Horário-Encerramento-Sessão": "not-a-number" }
  });
  const malformedTimer = [...malformedRun.harness.timers.entries()].find(([, timer]) => timer.interval)[0];
  malformedRun.harness.runTimer(malformedTimer);
  assert.equal(malformedRun.harness.element("Usuário-Tempo-Sessão").textContent, "Tempo Sessão: 00:00:NaN");
  assert.equal(malformedRun.harness.sessionStorage.snapshot().Usuário_Logado, "Sim");
  assert.notEqual(malformedRun.harness.navigation.at(-1), "/plataforma/login");
});

test("[VIDEO-02] Shaka keeps one player, exact controls, protected default, source-derived bypass, and local completion handlers", async () => {
  const bypassCondition = studyMainSource.match(
    /function isDrmEnabled\(fullName\) \{([\s\S]*?)return drmEnabled;\s*\}/
  );
  assert.ok(bypassCondition);
  const sourceDerivedNames = Array.from(
    bypassCondition[1].matchAll(/fullName === '([^']+)'/g),
    ([, value]) => value
  );
  assert.equal(sourceDerivedNames.length, 5);

  const { controller, harness, shaka } = createStudyHarness({
    isDrmEnabled: (fullName) => !sourceDerivedNames.includes(fullName),
    routes: [{
      method: "POST",
      path: "/plataforma_v2/updates",
      handler: async () => new Promise(() => {})
    }]
  });
  setStudyState(controller);
  controller.state.openModule = "Módulo 1";
  const first = createTopic(harness, { dataIndex: 1, name: "1. FIXTURE" });
  controller.openTopic.call(first);
  await harness.flush(20);

  controller.state.fullName = sourceDerivedNames[0];

  const second = createTopic(harness, { dataIndex: 2, name: "2. FIXTURE" });
  controller.openTopic.call(second);
  controller.state.fullName = "Invented Learner";
  sourceDerivedNames.fill("");
  await harness.flush(20);

  assert.equal(shaka.playerCount, 1);
  assert.equal(shaka.overlayCount, 1);
  assert.equal(shaka.attachCount, 1);
  assert.equal(shaka.polyfillCount, 2);
  assert.deepEqual(shaka.controls, [{
    controlPanelElements: [
      "play_pause", "time_and_duration", "spacer", "mute", "volume",
      "quality", "playback_rate", "fullscreen"
    ],
    overflowMenuButtons: []
  }]);
  assert.deepEqual(shaka.drmServerKinds, [["com.microsoft.playready"]]);
  assert.equal(shaka.loadPaths.every(({ valid }) => valid), true);
  assert.match(
    decodeURIComponent(shaka.loadPaths[0].pathname),
    /\/fixture-media\/protected\/Módulo 1\/1\. FIXTURE$/
  );
  assert.match(
    decodeURIComponent(shaka.loadPaths[1].pathname),
    /\/fixture-media\/bypass\/Módulo 1\/2\. FIXTURE$/
  );
  assert.equal((studyMainSource.match(/await player\.load\(/g) ?? []).length, 2);
  assert.equal(harness.element("Container-Interno-Shaka-Player").playCalls, 2);
  assert.equal(typeof harness.element("Container-Interno-Shaka-Player").onended, "function");
  assert.equal(typeof harness.element("Faixa-Inferior").onclick, "function");
});

function installReportDom(harness) {
  const graphs = [];
  const realizedContainers = [];
  const targetContainers = [];
  const entityContainers = [];
  for (let graphIndex = 0; graphIndex < 12; graphIndex += 1) {
    const graph = harness.element(`fixture-report-graph-${graphIndex}`);
    const realized = harness.element(`fixture-realized-container-${graphIndex}`);
    const targets = harness.element(`fixture-target-container-${graphIndex}`);
    const entities = harness.element(`fixture-entity-container-${graphIndex}`);
    realized.setSelectorResult(
      ".Realizados",
      Array.from({ length: 15 }, (_, index) => harness.element(`realized-${graphIndex}-${index}`)),
      { all: true }
    );
    targets.setSelectorResult(
      ".Metas",
      Array.from({ length: 15 }, (_, index) => harness.element(`target-${graphIndex}-${index}`)),
      { all: true }
    );
    targets.setSelectorResult(
      ".Rótulos_Metas",
      Array.from({ length: 15 }, (_, index) => harness.element(`target-label-${graphIndex}-${index}`)),
      { all: true }
    );
    targets.setSelectorResult(
      ".Linhas_Conectoras_Metas",
      Array.from({ length: 14 }, (_, index) => harness.element(`target-line-${graphIndex}-${index}`)),
      { all: true }
    );
    entities.setSelectorResult(
      ".Entidades",
      Array.from({ length: 15 }, (_, index) => harness.element(`entity-${graphIndex}-${index}`)),
      { all: true }
    );
    graphs.push(graph);
    realizedContainers.push(realized);
    targetContainers.push(targets);
    entityContainers.push(entities);
  }
  harness.selectorResults.set(".Gráficos_Controle_Resultados", graphs);
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

function createReportHarness({ query, response = { data: { Dados_Extraídos_BD_Plataforma: [] }, status: 200 } }) {
  const harness = createLearningPlatformHarness({
    routes: [{ method: "POST", path: "/plataforma_v2/statusreport", response }],
    userAgent: "Non-gated fixture browser",
    userAgentData: undefined
  });
  harness.window.location.search = query;
  const dom = installReportDom(harness);
  const dependencies = harness.dependencies();
  const platformClient = createPlatformClient({
    baseUrl: `${FIXTURE_ORIGIN}/plataforma_v2`,
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor
  });
  createStatusReportApplication({
    URLSearchParamsConstructor: dependencies.URLSearchParamsConstructor,
    document: dependencies.document,
    navigate: dependencies.navigate,
    platformClient,
    redirectToDeviceWarning,
    showAlert: dependencies.showAlert,
    window: dependencies.window
  }).install();
  return { dom, harness };
}

async function loadReport(options) {
  const result = createReportHarness(options);
  await result.harness.window.onload();
  await result.harness.flush(20);
  return result;
}

function reportQuery(overrides = {}) {
  const parameters = new URLSearchParams({
    dua: "13082026",
    idsr: "1",
    lf: "4",
    li: "2",
    mf: "10",
    mi: "1",
    mrm: "individual",
    ne: "Invented",
    nt: "1",
    ...overrides
  });
  return `?${parameters.toString()}`;
}

test("[REPORT-01] all nine query keys retain their isolated title, date, range, module, and mode effects", async () => {
  const company = encodeURIComponent("<mark data-fixture>Invented Co</mark>");
  const { harness, dom } = await loadReport({
    query: `?ne=${company}&nt=7&li=2&lf=4&dua=13082026&idsr=final&mi=2&mf=4&mrm=consolidado`
  });

  assert.equal(
    harness.element("Título_Status_Report").innerHTML,
    "Status Report Final: <mark data-fixture>Invented Co</mark> - Turma 7"
  );
  assert.equal(
    harness.element("Última_Atualização").innerHTML,
    "Última atualização: 13/08/2026 às 09:00"
  );
  assert.deepEqual(harness.guard.requests[0].body, { linha_inicial: 2, linha_final: 4 });
  assert.equal(dom.graphs[1].style.display, "none");
  assert.notEqual(dom.graphs[2].style.display, "none");
  assert.notEqual(dom.graphs[4].style.display, "none");
  assert.equal(dom.graphs[5].style.display, "none");
});

test("[REPORT-01] each query key independently preserves parsing and its own observable effect", async () => {
  const company = await loadReport({ query: reportQuery({ ne: "<b>Invented Co</b>" }) });
  assert.match(company.harness.element("Título_Status_Report").innerHTML, /<b>Invented Co<\/b>/);

  const cohort = await loadReport({ query: reportQuery({ nt: "7suffix" }) });
  assert.match(cohort.harness.element("Título_Status_Report").innerHTML, /Turma 7$/);

  const start = await loadReport({ query: reportQuery({ li: "3suffix" }) });
  assert.deepEqual(start.harness.guard.requests[0].body, { linha_inicial: 3, linha_final: 4 });

  const end = await loadReport({ query: reportQuery({ lf: "6.8" }) });
  assert.deepEqual(end.harness.guard.requests[0].body, { linha_inicial: 2, linha_final: 6 });

  const date = await loadReport({ query: reportQuery({ dua: "31122035trailing" }) });
  assert.equal(
    date.harness.element("Última_Atualização").innerHTML,
    "Última atualização: 31/12/2035 às 09:00"
  );

  const reportId = await loadReport({ query: reportQuery({ idsr: "7suffix" }) });
  assert.match(reportId.harness.element("Título_Status_Report").innerHTML, /^Status Report 07:/);

  const firstModule = await loadReport({ query: reportQuery({ mi: "3suffix" }) });
  assert.equal(firstModule.dom.graphs[1].style.display, "none");
  assert.equal(firstModule.dom.graphs[2].style.display, "none");
  assert.notEqual(firstModule.dom.graphs[3].style.display, "none");

  const lastModule = await loadReport({ query: reportQuery({ mf: "4suffix" }) });
  assert.notEqual(lastModule.dom.graphs[4].style.display, "none");
  assert.equal(lastModule.dom.graphs[5].style.display, "none");
  assert.match(
    lastModule.harness.element("Container_Gráficos_Controle_Resultados").innerHTML,
    /Módulos 1 a 4/
  );

  const consolidated = await loadReport({ query: reportQuery({ mrm: "consolidado" }) });
  const labels = consolidated.dom.targetContainers[0].querySelectorAll(".Rótulos_Metas");
  assert.deepEqual(
    labels.slice(0, 3).map((label) => label.style.display === "none"),
    [true, true, false]
  );
});

test("[REPORT-01] absent keys preserve null, NaN, JSON-null coercion, and missing-date throw behavior", async () => {
  const presentDate = await loadReport({ query: "?dua=x" });
  const request = presentDate.harness.guard.requests[0];
  assert.deepEqual(request.body, { linha_inicial: null, linha_final: null });
  assert.equal(
    presentDate.harness.element("Título_Status_Report").innerHTML,
    "Status Report NaN: null - Turma NaN"
  );
  assert.equal(
    presentDate.harness.element("Última_Atualização").innerHTML,
    "Última atualização: x// às 09:00"
  );

  const missingDate = createReportHarness({ query: "" });
  await assert.rejects(missingDate.harness.window.onload(), (error) => error?.name === "TypeError");
  assert.equal(missingDate.harness.guard.requests.length, 0);
});

test("[API-05] status report sends only its two public JSON bounds with no handle or authorization", async () => {
  const { harness } = await loadReport({
    query: "?ne=Invented&nt=1&li=5&lf=9&dua=01012035&idsr=1&mi=1&mf=10&mrm=individual"
  });
  const request = harness.guard.requests[0];
  assert.equal(request.path, "/plataforma_v2/statusreport");
  assert.equal(request.method, "POST");
  assert.deepEqual(Object.keys(request.body), ["linha_inicial", "linha_final"]);
  assert.equal(request.headers["Content-Type"], "application/json");
  assert.equal(Object.keys(request.headers).some((key) => key.toLowerCase() === "authorization"), false);
  assert.equal(Object.hasOwn(request.body, "IndexVerificado"), false);
});

test("[REPORT-02] public rendering exposes all synthetic row metrics, independently sorts charts, caps at 15 slots, and ignores certificate IDs", async () => {
  const rows = Array.from({ length: 16 }, (_, index) => reportRow(
    index === 0 ? "<span data-fixture>Workbook Name</span>" : `Invented Learner ${index + 1}`,
    100 - index,
    index / 20,
    `CERT-FIXTURE-${index + 1}`
  ));
  const { harness, dom } = await loadReport({
    query: "?ne=Invented&nt=1&li=0&lf=15&dua=01012035&idsr=2&mi=1&mf=10&mrm=individual",
    response: { data: { Dados_Extraídos_BD_Plataforma: rows }, status: 200 }
  });

  const progressEntities = dom.entityContainers[0].querySelectorAll(".Entidades");
  const moduleEntities = dom.entityContainers[1].querySelectorAll(".Entidades");
  assert.equal(progressEntities.length, 15);
  assert.equal(progressEntities[0].innerHTML, "<span data-fixture>Workbook Name</span>");
  assert.equal(moduleEntities[0].innerHTML, "Invented Learner 16");
  assert.notEqual(progressEntities[0].innerHTML, moduleEntities[0].innerHTML);
  assert.equal(dom.realizedContainers[0].style.width, `${64 * 16}px`);

  const rendered = [
    harness.element("Título_Status_Report").innerHTML,
    ...dom.entityContainers.flatMap((container) =>
      container.querySelectorAll(".Entidades").map((entity) => entity.innerHTML)
    )
  ].join("\n");
  for (let index = 1; index <= 16; index += 1) {
    assert.equal(rendered.includes(`CERT-FIXTURE-${index}`), false);
  }
  assert.equal(harness.element("Container_Externo_Conteúdo").style.display, "block");
});

test("[REPORT-02] all twelve metric columns sort and render independently from fourteen-field rows", async () => {
  const rows = Array.from({ length: 12 }, (_, winnerIndex) => {
    const metrics = Array(12).fill(0.01);
    metrics[winnerIndex] = winnerIndex === 0 ? 200 : 0.99;
    return [`Metric Winner ${winnerIndex + 1}`, ...metrics, `IGNORED-CERT-${winnerIndex + 1}`];
  });
  const { dom } = await loadReport({
    query: reportQuery({ lf: "13", li: "2" }),
    response: { data: { Dados_Extraídos_BD_Plataforma: rows }, status: 200 }
  });

  for (let metricIndex = 0; metricIndex < 12; metricIndex += 1) {
    const entities = dom.entityContainers[metricIndex].querySelectorAll(".Entidades");
    const values = dom.realizedContainers[metricIndex].querySelectorAll(".Realizados");
    assert.equal(entities[0].innerHTML, `Metric Winner ${metricIndex + 1}`, String(metricIndex));
    assert.equal(values[0].innerHTML, metricIndex === 0 ? "200" : "99.0%", String(metricIndex));
    assert.equal(entities.some((entity) => entity.innerHTML.includes("IGNORED-CERT")), false);
  }

  assert.equal((reportSource.match(/\.repeat\(15\)/g) ?? []).length, 2);
  assert.equal((reportSource.match(/\.repeat\(14\)/g) ?? []).length, 1);
  assert.equal(
    /for \(let i = 0; i < chartInformation\.length; i\+\+\)/.test(
      reportSource
    ),
    true,
    "Report rendering must remain driven by the complete static graph definition"
  );
});

test("[REPORT-03] only exact consolidado hides all target labels except the range-derived retained slot", async () => {
  for (const [mode, hidden] of [["consolidado", [true, true, false]], ["c", [false, false, false]]]) {
    const { dom } = await loadReport({
      query: `?ne=Invented&nt=1&li=0&lf=2&dua=01012035&idsr=1&mi=1&mf=10&mrm=${mode}`,
      response: {
        data: {
          Dados_Extraídos_BD_Plataforma: [
            reportRow("Invented A", 3, 0.7, "CERT-A"),
            reportRow("Invented B", 2, 0.8, "CERT-B"),
            reportRow("Invented C", 1, 0.9, "CERT-C")
          ]
        },
        status: 200
      }
    });
    for (const targetContainer of dom.targetContainers) {
      const labels = targetContainer.querySelectorAll(".Rótulos_Metas");
      assert.deepEqual(
        labels.slice(0, 3).map((label) => label.style.display === "none"),
        hidden
      );
    }
  }
  assert.equal(
    /"c: consolidado"/.test(reportSource),
    true,
    "The contradictory short-code comment must remain observable"
  );
  assert.equal(
    /targetLabelMode === 'consolidado'/.test(reportSource),
    true,
    "Runtime mode must still require the complete consolidado value"
  );
});

test("[API-05] status report keeps named platform-data failure specific and maps unknown failures to Erro_000", async () => {
  for (const fixture of [
    {
      error: "learning_platform.read_platform_data_failed",
      expected: "Erro_001",
      status: 500
    },
    { error: undefined, expected: "Erro_000", status: 500 },
    { error: undefined, expected: "Erro_000", status: 401 }
  ]) {
    const { harness } = await loadReport({
      query: "?ne=Invented&nt=1&li=0&lf=0&dua=01012035&idsr=1&mi=1&mf=1&mrm=individual",
      response: { data: fixture.error ? { error: fixture.error } : {}, status: fixture.status }
    });
    assert.equal(harness.alerts.length, 1);
    assert.match(harness.alerts[0], new RegExp(`^${fixture.expected}:`));
  }
});
