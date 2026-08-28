"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const {
  FIXTURE_ORIGIN,
  NetworkGuardError,
  createLearningPlatformHarness,
  readPlatformScript
} = require("./helpers/learning-platform-harness.js");

const SCRIPT_PATHS = {
  deviceBrowser: "apps/learning-platform/device-browser-warning/main.js",
  viewport: "apps/learning-platform/viewport-warning/main.js",
  login: "apps/learning-platform/login/main.js",
  notices: "apps/learning-platform/initial-notices/main.js",
  register: "apps/learning-platform/photo-registration/main.js",
  report: "apps/learning-platform/status-report/main.js",
  study: "apps/learning-platform/course-content/main.js"
};

const MODULE_PATHS = {
  faceStartup: "apps/learning-platform/modules/face-startup.js",
  lifecycle: "apps/learning-platform/modules/lifecycle.js",
  login: "apps/learning-platform/modules/login.js",
  notices: "apps/learning-platform/modules/initial-notices.js",
  platformClient: "apps/learning-platform/modules/platform-client.js",
  register: "apps/learning-platform/modules/photo-registration.js",
  session: "apps/learning-platform/modules/session.js",
  statusReport: "apps/learning-platform/modules/status-report/application.js",
  study: "apps/learning-platform/modules/course-content/application.js",
  studyDom: "apps/learning-platform/modules/course-content/dom.js",
  studyProgress: "apps/learning-platform/modules/course-content/progress.js"
};

function discoverModulePaths(directoryName) {
  const directory = path.join(
    __dirname,
    `../../apps/learning-platform/modules/${directoryName}`
  );
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => `apps/learning-platform/modules/${directoryName}/${entry.name}`)
    .sort();
}

const STATUS_REPORT_MODULE_PATHS = discoverModulePaths("status-report");
const STUDY_MODULE_PATHS = discoverModulePaths("course-content");

const PATHS = {
  deviceBrowser: "/plataforma/aviso-dispositivo-navegador",
  login: "/plataforma/login",
  notices: "/plataforma/avisos-iniciais",
  register: "/plataforma/cadastro-foto",
  report: "/plataforma/statusreport",
  study: "/plataforma/estudo",
  viewport: "/plataforma/aviso-viewport"
};

const ENTRY_PATHS = {
  login: PATHS.login,
  notices: PATHS.notices,
  register: PATHS.register,
  report: PATHS.report,
  study: PATHS.study
};

function viewportWarningTarget(pathname, search = "", hash = "") {
  return `${PATHS.viewport}?returnTo=${encodeURIComponent(`${pathname}${search}${hash}`)}`;
}

function opaqueValue(kind) {
  return ["synthetic", kind, "value"].join(":");
}

const FIXTURE_FACE_SESSION = opaqueValue("face-session");
const FIXTURE_FACE_TOKEN = opaqueValue("face-token");
const FIXTURE_HANDLE = opaqueValue("row-handle");
const FIXTURE_PLATFORM_BASE = FIXTURE_ORIGIN + "/plataforma_v2";
const FIXTURE_RESULT_PATH = `/plataforma_v2/FaceID_resultado/${FIXTURE_FACE_SESSION}`;
const EXPECTED_FACE_SHADOW_STYLES = ":host,\n* {\n    -webkit-user-select: none;\n    user-select: none;\n}\n\n#spinnerCheck #circle,\n#spinnerCheck #tick {\n    stroke: #4a0816 !important;\n}";
const WINDOWS_EDGE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 " +
  "Safari/537.36 Edg/140.0.0.0";
const WINDOWS_CHROME_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

function refreshData(overrides = {}) {
  const data = {
    Usuário_Email: "learner@example.test",
    Usuário_Formação_CertificadoID: "SYNTHETIC-CERTIFICATE",
    Usuário_Formação_NotaAcumulado: 0.8,
    Usuário_Formação_NúmeroTópicosConcluídos: "NaN",
    Usuário_NomeCompleto: "Invented Learner",
    Usuário_PrazoAcesso: "31/12/2099",
    Usuário_PrimeiroNome: "Invented",
    Usuário_Status_Login: "Ativo"
  };
  for (let moduleNumber = 1; moduleNumber <= 10; moduleNumber += 1) {
    data[`Usuário_Formação_NotaMódulo${moduleNumber}`] = 0.8;
  }
  return { ...data, ...overrides };
}

function loginResponse(overrides = {}) {
  return {
    IndexVerificado: FIXTURE_HANDLE,
    Usuário_Foto_Cadastrada: "Não",
    Usuário_PrazoAcesso: "31/12/2099",
    Usuário_Status_FaceID: "Ativo",
    Usuário_Status_Login: "Ativo",
    ...overrides
  };
}

function faceSessionResponse() {
  return {
    Azure_Face_API_LivenessSession_authToken: FIXTURE_FACE_TOKEN,
    Azure_Face_API_LivenessSession_sessionID: FIXTURE_FACE_SESSION
  };
}

function faceResultResponse(overrides = {}) {
  return {
    Azure_Face_API_LivenessSession_LivenessDecision: "realface",
    Azure_Face_API_LivenessSession_MatchConfidence: 0.99,
    Azure_Face_API_LivenessSession_MatchDecision: true,
    ...overrides
  };
}

function submit(element) {
  return element.dispatch("submit", { preventDefault() {} });
}

function assertOnlyErrorCode(alerts, code) {
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].startsWith(code), true);
}

function assertExpectationFlags(harness, expected) {
  const results = Object.assign(
    {},
    ...harness.guard.expectations.map((expectation) => expectation.results)
  );
  assert.deepEqual(results, expected);
}

function assertNoQuery(harness) {
  assert.equal(harness.guard.requestMetadata.length, harness.guard.requests.length);
  assert.equal(
    harness.guard.requestMetadata.every(
      ({ hasQuery, queryKeys }) => hasQuery === false && queryKeys.length === 0
    ),
    true
  );
  harness.hostGuard.assertUnused();
}

function assertFaceShadowPresentation(faceElement) {
  assert.deepEqual(faceElement.faceShadowOptions, { mode: "closed" });
  assert.equal(faceElement.attachShadow, faceElement.faceNativeAttachShadow);
  assert.equal(faceElement.faceShadowRoot.adoptedStyleSheets.length, 1);
  assert.equal(
    faceElement.faceShadowRoot.adoptedStyleSheets[0].cssText,
    EXPECTED_FACE_SHADOW_STYLES
  );
}

function assertMachineValueHidden(harness, machineValue) {
  const renderedText = [harness.document.body, ...harness.elements.values()]
    .map((element) => `${element.innerHTML}\n${element.textContent}`)
    .join("\n");
  assert.equal(harness.alerts.join("\n").includes(machineValue), false);
  assert.deepEqual(harness.consoleCalls, []);
  assert.equal(renderedText.includes(machineValue), false);
}

function moduleDependencies(harness, overrides = {}) {
  const dependencies = harness.dependencies();
  return {
    ...dependencies,
    FormDataConstructor: dependencies.FormData,
    alert(message) {
      harness.alerts.push(String(message));
    },
    clock: dependencies.Date,
    console: {
      log(...args) {
        harness.consoleCalls.push({ level: "log", size: args.length });
      }
    },
    navigate(target) {
      dependencies.window.location.href = target;
    },
    ...overrides
  };
}

async function installLoginApplication(harness, overrides = {}) {
  const { createLoginApplication } = await harness.loadModule(MODULE_PATHS.login);
  createLoginApplication(moduleDependencies(harness, {
    backendBase: FIXTURE_PLATFORM_BASE,
    ...overrides
  }));
  harness.hostGuard.assertUnused();
}

async function installRegistrationApplication(harness, overrides = {}) {
  const { createRegistrationApplication } = await harness.loadModule(MODULE_PATHS.register);
  createRegistrationApplication(moduleDependencies(harness, {
    backendBase: FIXTURE_PLATFORM_BASE,
    ...overrides
  }));
  harness.hostGuard.assertUnused();
}

async function installInitialNoticesApplication(harness) {
  const [noticesModule, sessionModule] = await Promise.all([
    harness.loadModule(MODULE_PATHS.notices),
    harness.loadModule(MODULE_PATHS.session)
  ]);
  const dependencies = harness.dependencies();
  noticesModule.createInitialNoticesApplication({
    ...dependencies,
    requiredAcknowledgements: {
      credentials: "credenciais",
      rights: "direitos",
      window: "janela"
    },
    session: sessionModule.createSessionStore(dependencies.sessionStorage)
  }).install();
  harness.hostGuard.assertUnused();
}

async function installStatusReportApplication(harness) {
  const [applicationModule, lifecycleModule, clientModule] = await Promise.all([
    harness.loadModule(MODULE_PATHS.statusReport),
    harness.loadModule(MODULE_PATHS.lifecycle),
    harness.loadModule(MODULE_PATHS.platformClient)
  ]);
  const dependencies = harness.dependencies();
  const platformClient = clientModule.createPlatformClient({
    baseUrl: FIXTURE_PLATFORM_BASE,
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor
  });
  applicationModule.createStatusReportApplication({
    ...dependencies,
    platformClient,
    replaceWithViewportWarning: lifecycleModule.replaceWithViewportWarning
  }).install();
  harness.hostGuard.assertUnused();
}

async function installStudyApplication(harness, overrides = {}) {
  const [applicationModule, domModule, clientModule, sessionModule] =
    await Promise.all([
      harness.loadModule(MODULE_PATHS.study),
      harness.loadModule(MODULE_PATHS.studyDom),
      harness.loadModule(MODULE_PATHS.platformClient),
      harness.loadModule(MODULE_PATHS.session)
    ]);
  const dependencies = harness.dependencies();
  const session = sessionModule.createSessionStore(dependencies.sessionStorage);
  const dom = domModule.createStudyDom(dependencies.document);
  session.read("legacySessionSeconds");
  const client = clientModule.createPlatformClient({
    baseUrl: FIXTURE_PLATFORM_BASE,
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor
  });
  const controller = applicationModule.createStudyApplication({
    alert: dependencies.alert,
    client,
    clock: {
      createDate: (...argumentsList) => new dependencies.Date(...argumentsList),
      now: dependencies.now
    },
    configureDownloads() {},
    document: dependencies.document,
    dom,
    async loadMedia() {},
    navigate: dependencies.navigate,
    navigator: dependencies.navigator,
    replaceNavigation: dependencies.replaceNavigation,
    renderCertificate() {},
    session,
    timers: {
      clearInterval: dependencies.clearInterval,
      setInterval: dependencies.setInterval
    },
    window: dependencies.window,
    ...overrides
  });
  controller.install();
  harness.hostGuard.assertUnused();
  return controller;
}

async function installEntryApplication(harness, page) {
  if (page === "login") return installLoginApplication(harness);
  if (page === "notices") return installInitialNoticesApplication(harness);
  if (page === "register") return installRegistrationApplication(harness);
  if (page === "report") return installStatusReportApplication(harness);
  if (page === "study") return installStudyApplication(harness);
  return harness.loadScript(SCRIPT_PATHS[page]);
}

function readApplicationSource(page) {
  const sourcePaths = [SCRIPT_PATHS[page]];
  if (page === "login" || page === "register") {
    sourcePaths.push(MODULE_PATHS[page], MODULE_PATHS.lifecycle);
  }
  if (page === "notices") {
    sourcePaths.push(MODULE_PATHS.notices, MODULE_PATHS.lifecycle);
  }
  if (page === "report") {
    sourcePaths.push(...STATUS_REPORT_MODULE_PATHS, MODULE_PATHS.lifecycle);
  }
  if (page === "study") sourcePaths.push(...STUDY_MODULE_PATHS, MODULE_PATHS.lifecycle);
  return sourcePaths.map(readPlatformScript).join("\n");
}

test("[SAFETY-NETWORK] deny-all sentinel blocks fallback channels before scripts run", async () => {
  const harness = createLearningPlatformHarness({
    routes: [{ method: "POST", path: "/fixture", response: { data: { ok: true } } }]
  });

  await assert.rejects(
    harness.window.fetch("https:" + "//outside.invalid/private"),
    NetworkGuardError
  );
  harness.context.__blockedTarget = "https:" + "//outside.invalid/vm-fetch";
  await assert.rejects(
    vm.runInContext("fetch(__blockedTarget)", harness.context),
    NetworkGuardError
  );
  await assert.rejects(
    harness.window.fetch(FIXTURE_ORIGIN + "/unregistered"),
    NetworkGuardError
  );
  await assert.rejects(
    harness.window.fetch(Object.create(null)),
    {
      message: "Blocked fetch network access",
      name: "NetworkGuardError"
    }
  );

  const queryHarness = createLearningPlatformHarness({
    routes: [{ method: "POST", path: "/fixture", response: { data: { ok: true } } }]
  });
  await assert.rejects(
    queryHarness.window.fetch(FIXTURE_ORIGIN + "/fixture?invented_key=invented", {
      method: "POST"
    }),
    NetworkGuardError
  );
  assert.deepEqual(queryHarness.guard.requestMetadata, [{
    hasQuery: true,
    method: "POST",
    path: "/fixture",
    queryKeys: ["invented_key"]
  }]);
  assert.equal(queryHarness.guard.requests.length, 0);

  const xhr = new harness.window.XMLHttpRequest();
  xhr.open("GET", "https:" + "//outside.invalid/xhr");
  assert.throws(() => xhr.send(), NetworkGuardError);
  assert.throws(
    () => new harness.window.WebSocket("wss:" + "//outside.invalid/socket"),
    NetworkGuardError
  );
  assert.throws(
    () => new harness.window.EventSource("https:" + "//outside.invalid/events"),
    NetworkGuardError
  );
  assert.throws(() => {
    harness.document.createElement("script").src = "/unexpected-script.js";
  }, NetworkGuardError);
  assert.throws(() => {
    harness.document.createElement("img").src = "/unexpected-image.png";
  }, NetworkGuardError);
  assert.throws(() => {
    const image = new harness.window.Image();
    image.src = "/unexpected-constructor-image.png";
  }, NetworkGuardError);
  assert.throws(() => {
    harness.document.createElement("video").src = "/unexpected-media.mp4";
  }, NetworkGuardError);
  assert.throws(() => {
    harness.document.createElement("link").href = "/unexpected-style.css";
  }, NetworkGuardError);
  assert.throws(() => {
    harness.document.createElement("script").setAttribute("src", "/attribute-script.js");
  }, NetworkGuardError);
  assert.throws(() => {
    harness.document.createElement("img").setAttribute("srcset", "/attribute-image.png 1x");
  }, NetworkGuardError);
  assert.throws(() => {
    harness.document.createElement("form").submit();
  }, NetworkGuardError);
  assert.throws(() => {
    harness.window.navigator.sendBeacon("/unexpected-beacon");
  }, NetworkGuardError);
  assert.throws(() => new harness.window.Worker("/unexpected-worker.js"), NetworkGuardError);
  assert.throws(() => harness.window.open("/unexpected-window"), NetworkGuardError);

  const response = await harness.window.fetch(FIXTURE_ORIGIN + "/fixture", {
    method: "POST"
  });
  assert.equal(response.ok, true);
  assert.deepEqual(harness.guard.requests, [{
    body: undefined,
    formFields: undefined,
    headers: {},
    method: "POST",
    path: "/fixture"
  }]);
  assertNoQuery(harness);
});

test("[ROUTE-03] ordinary destinations stay separate from replacement admission", async () => {
  const sources = Object.fromEntries(
    Object.keys(SCRIPT_PATHS).map((name) => [name, readApplicationSource(name)])
  );
  const expectedWriters = {
    login: [PATHS.study, PATHS.notices],
    notices: [PATHS.login, PATHS.register],
    register: [PATHS.login, PATHS.study],
    study: [PATHS.login]
  };

  for (const [page, destinations] of Object.entries(expectedWriters)) {
    for (const destination of destinations) {
      assert.equal(
        sources[page].includes(`window.location.href = '${destination}'`) ||
          sources[page].includes(`window.location.href = "${destination}"`) ||
          sources[page].includes(`navigate('${destination}')`) ||
          sources[page].includes(`navigate("${destination}")`),
        true,
        `${page} must retain ${destination}`
      );
    }
  }

  const combined = Object.values(sources).join("\n");
  for (const absentRouterSeam of [
    "history.pushState(",
    "history.replaceState(",
    "popstate"
  ]) {
    assert.equal(combined.includes(absentRouterSeam), false, absentRouterSeam);
  }
  for (const page of ["login", "notices", "register", "study"]) {
    assert.ok(sources[page].includes(PATHS.deviceBrowser), `${page}:GATE-01 target`);
    assert.ok(sources[page].includes(PATHS.viewport), `${page}:GATE-02 target`);
  }
  assert.ok(sources.report.includes(PATHS.viewport), "report:GATE-02 target");
  assert.equal(sources.viewport.includes("history.back()"), false);

  const login = createLearningPlatformHarness({
    pathname: PATHS.login,
    storage: {
      Origem_Aviso_Dispositivo: "Não",
      Usuário_Autorização_Cadastro: "Sim",
      Usuário_Logado: "Não"
    }
  });
  await installLoginApplication(login);
  login.dispatchWindow("load");
  assert.equal(login.history.backCalls, 1);
  assert.equal(login.navigation.length, 0);
  assert.equal(login.sessionStorage.getItem("Origem_Aviso_Dispositivo"), "Não");
  assert.equal((login.windowListeners.get("resize") ?? []).length, 1);
  login.window.innerWidth = 1024;
  login.dispatchWindow("resize");
  assert.deepEqual(login.navigation, []);
  assert.deepEqual(login.replacementNavigation, [viewportWarningTarget(PATHS.login)]);
});

test("[GATE-01] centralized admission returns stable candidate, unsupported, and unverified results", async () => {
  const moduleHarness = createLearningPlatformHarness();
  const lifecycle = await moduleHarness.loadModule(MODULE_PATHS.lifecycle);
  assert.deepEqual(lifecycle.browserAdmissionOutcomes, {
    CANDIDATE: "candidate",
    UNSUPPORTED: "unsupported",
    UNVERIFIED: "unverified"
  });

  function classify({
    entry = lifecycle.browserAdmissionEntries.LOGIN,
    mutate,
    userAgent = WINDOWS_EDGE_USER_AGENT,
    userAgentData
  }) {
    const harness = createLearningPlatformHarness({
      userAgent,
      userAgentData: userAgentData ?? {}
    });
    if (userAgentData === null) delete harness.window.navigator.userAgentData;
    if (mutate) mutate(harness);
    const result = lifecycle.classifyBrowserAdmission({
      document: harness.document,
      entry,
      navigator: harness.window.navigator,
      window: harness.window
    });
    harness.hostGuard.assertUnused();
    return result;
  }

  const cases = [
    {
      label: "Edge client hints with ordinary Chromium base brand",
      profile: {
        userAgent: "FixtureBrowser",
        userAgentData: {
          brands: [{ brand: "Chromium" }, { brand: "Microsoft Edge" }],
          mobile: false,
          platform: "Windows"
        }
      },
      expected: ["candidate", "windows-edge-candidate"]
    },
    {
      label: "usable Windows Edge fallback without client hints",
      profile: { userAgentData: null },
      expected: ["candidate", "windows-edge-candidate"]
    },
    {
      label: "partial client hints completed by fallback",
      profile: {
        userAgentData: { brands: [{ brand: "Chromium" }], mobile: false }
      },
      expected: ["candidate", "windows-edge-candidate"]
    },
    {
      label: "missing hints and insufficient fallback",
      profile: { userAgent: "FixtureBrowser", userAgentData: null },
      expected: ["unverified", "insufficient-browser-evidence"]
    },
    {
      label: "conflicting platform evidence",
      profile: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) " +
          "AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
        userAgentData: {
          brands: [{ brand: "Microsoft Edge" }],
          mobile: false,
          platform: "Windows"
        }
      },
      expected: ["unverified", "conflicting-platform-evidence"]
    },
    {
      label: "conflicting browser-family evidence",
      profile: {
        userAgentData: {
          brands: [{ brand: "Google Chrome" }],
          mobile: false,
          platform: "Windows"
        }
      },
      expected: ["unverified", "conflicting-browser-evidence"]
    },
    {
      label: "conflicting browser families within fallback evidence",
      profile: {
        userAgent: WINDOWS_EDGE_USER_AGENT + " OPR/120.0.0.0",
        userAgentData: null
      },
      expected: ["unverified", "conflicting-browser-evidence"]
    },
    {
      label: "conflicting desktop platforms within fallback evidence",
      profile: {
        userAgent: WINDOWS_EDGE_USER_AGENT + " Macintosh",
        userAgentData: null
      },
      expected: ["unverified", "conflicting-platform-evidence"]
    },
    {
      label: "conflicting desktop and mobile fallback evidence",
      profile: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EdgiOS/140.0.0.0",
        userAgentData: null
      },
      expected: ["unverified", "conflicting-platform-evidence"]
    },
    {
      label: "Chrome",
      profile: {
        userAgent: WINDOWS_CHROME_USER_AGENT,
        userAgentData: {
          brands: [{ brand: "Chromium" }, { brand: "Google Chrome" }],
          mobile: false,
          platform: "Windows"
        }
      },
      expected: ["unsupported", "unsupported-browser-family"]
    },
    {
      label: "Firefox",
      profile: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) " +
          "Gecko/20100101 Firefox/140.0",
        userAgentData: null
      },
      expected: ["unsupported", "unsupported-browser-family"]
    },
    {
      label: "Safari on macOS",
      profile: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) " +
          "AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15",
        userAgentData: null
      },
      expected: ["unsupported", "unsupported-platform"]
    },
    {
      label: "another Chromium family",
      profile: {
        userAgent: WINDOWS_CHROME_USER_AGENT + " OPR/120.0.0.0",
        userAgentData: null
      },
      expected: ["unsupported", "unsupported-browser-family"]
    },
    {
      label: "embedded Edge WebView",
      profile: {
        userAgent: WINDOWS_EDGE_USER_AGENT + " WebView/140.0.0.0",
        userAgentData: {
          brands: [{ brand: "Chromium" }, { brand: "Microsoft Edge" }],
          mobile: false,
          platform: "Windows"
        }
      },
      expected: ["unsupported", "unsupported-embedded-browser"]
    },
    {
      label: "embedded Edge WebView API with ordinary Edge identity",
      profile: {
        mutate(harness) {
          harness.window.chrome = {
            webview: {
              postMessage() {
                throw new Error("Synthetic WebView messaging must not run during admission");
              }
            }
          };
        }
      },
      expected: ["unsupported", "unsupported-embedded-browser"]
    },
    {
      label: "mobile Edge",
      profile: {
        userAgent: "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 " +
          "Chrome/140.0.0.0 Mobile Safari/537.36 EdgA/140.0.0.0",
        userAgentData: {
          brands: [{ brand: "Chromium" }, { brand: "Microsoft Edge" }],
          mobile: true,
          platform: "Android"
        }
      },
      expected: ["unsupported", "unsupported-mobile-environment"]
    }
  ];

  for (const { expected, label, profile } of cases) {
    const result = classify(profile);
    assert.deepEqual([result.outcome, result.reasonCode], expected, label);
    assert.equal("supported" in result, false, label);
    assert.equal(Object.isFrozen(result), true, label);
  }

  const missingFace = classify({
    mutate(harness) {
      delete harness.window.navigator.mediaDevices;
    }
  });
  assert.deepEqual(
    [missingFace.outcome, missingFace.reasonCode, missingFace.missingCapabilities],
    ["unsupported", "missing-mandatory-api", ["camera-api"]]
  );

  const missingOrdinaryLearning = classify({
    entry: lifecycle.browserAdmissionEntries.STUDY,
    mutate(harness) {
      delete harness.window.fetch;
    }
  });
  assert.equal(missingOrdinaryLearning.outcome, "unsupported");
  assert.equal(missingOrdinaryLearning.reasonCode, "missing-mandatory-api");
  assert.deepEqual(missingOrdinaryLearning.missingCapabilities, ["fetch"]);
});

test("[GATE-01] four guarded entries give browser rejection precedence over viewport admission", async () => {
  const guardedPages = ["login", "notices", "register", "study"];
  const profiles = [
    {
      label: "unsupported",
      userAgent: WINDOWS_CHROME_USER_AGENT,
      userAgentData: {
        brands: [{ brand: "Google Chrome" }],
        mobile: false,
        platform: "Windows"
      }
    },
    {
      label: "unverified",
      userAgent: "FixtureBrowser",
      userAgentData: {}
    }
  ];

  for (const page of guardedPages) {
    for (const profile of profiles) {
      for (const width of [1023, 1024, 1025]) {
        const harness = createLearningPlatformHarness({
          ...profile,
          innerWidth: width,
          pathname: ENTRY_PATHS[page],
          storage: { Usuário_Autorização_Cadastro: "Sim", Usuário_Logado: "Sim" }
        });
        await installEntryApplication(harness, page);
        await Promise.all(harness.dispatchWindow("load"));
        assert.deepEqual(
          harness.replacementNavigation,
          [PATHS.deviceBrowser],
          `${page}:${profile.label}:${width}`
        );
        assert.deepEqual(harness.navigation, [], `${page}:${profile.label}:${width}:ordinary`);
        assert.equal((harness.windowListeners.get("resize") ?? []).length, 0);
        assert.equal(harness.timeline.some(({ type }) => type === "fetch"), false);
      }
    }

    const candidate = createLearningPlatformHarness({
      pathname: ENTRY_PATHS[page],
      storage: { Usuário_Autorização_Cadastro: "Sim", Usuário_Logado: "Não" }
    });
    await installEntryApplication(candidate, page);
    await Promise.all(candidate.dispatchWindow("load"));
    assert.equal(candidate.replacementNavigation.includes(PATHS.deviceBrowser), false, page);
  }
});

test("[GATE-01] rejected and unverified Face entries cannot load Face or submit", async () => {
  for (const install of [installLoginApplication, installRegistrationApplication]) {
    for (const profile of [
      {
        userAgent: WINDOWS_CHROME_USER_AGENT,
        userAgentData: {
          brands: [{ brand: "Google Chrome" }],
          mobile: false,
          platform: "Windows"
        }
      },
      { userAgent: "FixtureBrowser", userAgentData: {} }
    ]) {
      let loaderCalls = 0;
      const harness = createLearningPlatformHarness({
        ...profile,
        storage: { IndexVerificado: FIXTURE_HANDLE }
      });
      await install(harness, {
        async loadFaceRuntime() {
          loaderCalls += 1;
        }
      });
      harness.dispatchWindow("load");
      submit(harness.element(
        install === installLoginApplication ? "Formulário-Login" : "Formulário-Foto-Referência"
      ));
      await harness.flush();
      assert.equal(loaderCalls, 0);
      assert.equal(harness.timeline.some(({ type }) => type === "fetch"), false);
      assert.equal(harness.timeline.some(({ type }) => type === "face-start"), false);
    }
  }
});

test("[GATE-01] public report and warning entries remain available without browser admission", async () => {
  const report = createLearningPlatformHarness({
    pathname: PATHS.report,
    routes: [{
      method: "POST",
      path: "/plataforma_v2/statusreport",
      response: { data: { Dados_Extraídos_BD_Plataforma: [] } }
    }],
    userAgent: WINDOWS_CHROME_USER_AGENT,
    userAgentData: {}
  });
  report.window.location.search =
    "?ne=Invented&nt=1&li=0&lf=0&dua=01012035&idsr=1&mi=1&mf=1&mrm=individual";
  report.selectorResults.set(
    ".Gráficos_Controle_Resultados",
    Array.from({ length: 12 }, (_, index) => report.element(`public-report-${index}`))
  );
  await installStatusReportApplication(report);
  await report.window.onload();
  await report.flush();
  assert.equal(report.guard.requests.length, 1);
  assert.equal(report.replacementNavigation.includes(PATHS.deviceBrowser), false);
  assert.equal(/userAgent(?:Data)?|classifyBrowserAdmission/.test(
    readPlatformScript(SCRIPT_PATHS.report)
  ), false);

  for (const userAgentData of [null, {}, { brands: undefined }]) {
    const deviceBrowserWarning = createLearningPlatformHarness({
      pathname: `${PATHS.deviceBrowser}/`,
      userAgentData: userAgentData ?? {}
    });
    if (userAgentData === null) delete deviceBrowserWarning.window.navigator.userAgentData;
    assert.doesNotThrow(() => deviceBrowserWarning.loadScript(SCRIPT_PATHS.deviceBrowser));
    assert.equal(deviceBrowserWarning.consoleCalls.length, 2);
    assert.deepEqual(deviceBrowserWarning.navigation, []);
    assert.deepEqual(deviceBrowserWarning.replacementNavigation, []);
  }

  const viewportWarning = createLearningPlatformHarness({
    innerWidth: 1024,
    pathname: `${PATHS.viewport}/`,
    userAgent: "FixtureBrowser",
    userAgentData: {}
  });
  assert.doesNotThrow(() => viewportWarning.loadScript(SCRIPT_PATHS.viewport));
  assert.equal(viewportWarning.sessionStorage.getItem("Origem_Aviso_Dispositivo"), "Sim");
  assert.deepEqual(viewportWarning.navigation, []);
  assert.deepEqual(viewportWarning.replacementNavigation, []);
});

test("[GATE-02] admitted login, notices, and registration enforce the inclusive minimum viewport", async () => {
  const pages = ["login", "notices", "register"];
  for (const page of pages) {
    for (const width of [1023, 1024, 1025]) {
      const harness = createLearningPlatformHarness({
        innerWidth: width,
        pathname: ENTRY_PATHS[page],
        storage: {
          Origem_Aviso_Dispositivo: "Sim",
          Usuário_Autorização_Cadastro: "Sim",
          Usuário_Logado: "Não"
        }
      });
      await installEntryApplication(harness, page);
      assert.deepEqual(
        harness.timeline
          .filter(({ type }) => type === "window-listener")
          .map(({ event }) => event),
        ["load"],
        `${page}:${width}`
      );
      assert.equal((harness.windowListeners.get("resize") ?? []).length, 0, `${page}:${width}`);
      assert.equal((harness.windowListeners.get("load") ?? []).length, 1, `${page}:${width}`);
      harness.dispatchWindow("load");
      assert.equal(
        harness.replacementNavigation.filter(
          (target) => target === viewportWarningTarget(ENTRY_PATHS[page])
        ).length,
        width <= 1024 ? 1 : 0,
        `${page}:${width}:load`
      );
      assert.equal(harness.navigation.length, 0, `${page}:${width}:ordinary`);
      assert.equal(
        (harness.windowListeners.get("resize") ?? []).length,
        width <= 1024 ? 0 : 1,
        `${page}:${width}:resize-listener`
      );
    }

    for (const resizeWidth of [1024, 1023]) {
      const harness = createLearningPlatformHarness({
        innerWidth: 1025,
        pathname: ENTRY_PATHS[page],
        storage: {
          Origem_Aviso_Dispositivo: "Sim",
          Usuário_Autorização_Cadastro: "Sim",
          Usuário_Logado: "Não"
        }
      });
      await installEntryApplication(harness, page);
      harness.dispatchWindow("load");
      harness.window.innerWidth = resizeWidth;
      harness.dispatchWindow("resize");
      assert.deepEqual(
        harness.replacementNavigation,
        [viewportWarningTarget(ENTRY_PATHS[page])],
        `${page}:1025->${resizeWidth}`
      );
      assert.deepEqual(harness.navigation, [], `${page}:1025->${resizeWidth}:ordinary`);
    }
  }
});

test("login and registration factories preserve initial capture and listener order", async () => {
  const cases = [
    {
      install: installLoginApplication,
      expected: [
        { id: "Formulário-Login", type: "dom-get" },
        { id: "E-mail", type: "dom-get" },
        { id: "Senha", type: "dom-get" },
        { id: "Entrar", type: "dom-get" },
        { id: "Aviso-Inicializando", type: "dom-get" },
        { id: "Aviso-Email-ou-Senha-Inválidos", type: "dom-get" },
        { id: "Aviso-Login-Expirado", type: "dom-get" },
        { id: "Aviso-FaceID-Reprovado", type: "dom-get" },
        { id: "Container-Auxiliar-FaceID", type: "dom-get" },
        { event: "load", type: "window-listener" },
        { event: "submit", id: "Formulário-Login", type: "element-listener" },
        { event: "input", id: "E-mail", type: "element-listener" },
        { event: "input", id: "Senha", type: "element-listener" }
      ],
      storage: {}
    },
    {
      install: installRegistrationApplication,
      expected: [
        { key: "IndexVerificado", type: "storage-get" },
        { id: "Formulário-Foto-Referência", type: "dom-get" },
        { id: "Botão-Cadastrar-Foto-Referência", type: "dom-get" },
        { id: "Aviso-Cadastrando", type: "dom-get" },
        { id: "Container-Auxiliar-FaceID", type: "dom-get" },
        { event: "load", type: "window-listener" },
        { event: "submit", id: "Formulário-Foto-Referência", type: "element-listener" }
      ],
      storage: {
        IndexVerificado: FIXTURE_HANDLE
      }
    }
  ];

  for (const scenario of cases) {
    const harness = createLearningPlatformHarness({ storage: scenario.storage });
    const dependencies = harness.dependencies();
    const trace = [];
    const wrappedElements = new Set();
    const document = {
      ...dependencies.document,
      getElementById(id) {
        trace.push({ id, type: "dom-get" });
        const element = dependencies.document.getElementById(id);
        if (!wrappedElements.has(element)) {
          wrappedElements.add(element);
          const addEventListener = element.addEventListener;
          element.addEventListener = function(event, listener) {
            trace.push({ event, id, type: "element-listener" });
            return addEventListener.call(this, event, listener);
          };
        }
        return element;
      }
    };
    const sessionStorage = {
      getItem(key) {
        trace.push({ key, type: "storage-get" });
        return dependencies.sessionStorage.getItem(key);
      },
      setItem(key, value) {
        trace.push({ key, type: "storage-set" });
        return dependencies.sessionStorage.setItem(key, value);
      }
    };
    const window = {
      ...dependencies.window,
      addEventListener(event, listener) {
        trace.push({ event, type: "window-listener" });
        return dependencies.window.addEventListener(event, listener);
      },
      document,
      sessionStorage
    };

    await scenario.install(harness, { document, sessionStorage, window });
    assert.deepEqual(trace, scenario.expected);
    harness.hostGuard.assertUnused();
  }
});

test("registration starts directly without stored backend configuration and requests absolutely", async () => {
  const requestTargets = [];
  const harness = createLearningPlatformHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/CadastroFoto_e_FaceID",
      response: { data: {}, status: 401 }
    }],
    storage: { IndexVerificado: FIXTURE_HANDLE }
  });
  harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
  await installRegistrationApplication(harness, {
    fetch(target, options) {
      requestTargets.push(String(target));
      return harness.guard.fetch(target, options);
    }
  });

  submit(harness.element("Formulário-Foto-Referência"));
  await harness.flush(20);

  assert.deepEqual(requestTargets, [
    FIXTURE_PLATFORM_BASE + "/CadastroFoto_e_FaceID"
  ]);
  assert.equal(new URL(requestTargets[0]).origin, FIXTURE_ORIGIN);
  assert.deepEqual(
    harness.timeline.filter(({ type }) => type === "storage-get"),
    [{ key: "IndexVerificado", type: "storage-get" }]
  );
  assert.deepEqual(
    harness.sessionStorage.snapshot({ redact: ["IndexVerificado"] }),
    { IndexVerificado: "<redacted>" }
  );
  assertNoQuery(harness);
});

test("[FACE-01] Face startup themes the closed shadow root without changing startup order", async () => {
  const harness = createLearningPlatformHarness();
  const { createFaceStartup } = await harness.loadModule(MODULE_PATHS.faceStartup);
  const events = [];
  const shadowRoot = { adoptedStyleSheets: [] };
  const faceElement = {
    attachShadow(options) {
      events.push({ options: { ...options }, type: "attach-shadow" });
      return shadowRoot;
    },
    start(token) {
      events.push({ tokenPresent: Boolean(token), type: "start" });
      this.attachShadow({ mode: "closed" });
      return Promise.resolve("synthetic-face-result");
    }
  };
  const nativeAttachShadow = faceElement.attachShadow;
  for (const [property, type] of [
    ["locale", "set-locale"],
    ["fontSize", "set-font-size"],
    ["buttonStyles", "set-button-styles"]
  ]) {
    Object.defineProperty(faceElement, property, {
      set(value) {
        events.push({ type, value });
      }
    });
  }

  const faceStartup = createFaceStartup({
    createElement(tagName) {
      events.push({ tagName, type: "create" });
      return faceElement;
    },
    createStyleSheet() {
      events.push({ type: "create-style-sheet" });
      return {
        replaceSync(cssText) {
          this.cssText = String(cssText);
          events.push({ cssText: this.cssText, type: "replace-style" });
        }
      };
    },
    async loadRuntime() {
      events.push({ type: "load-runtime" });
    },
    mount(element) {
      assert.equal(element, faceElement);
      assert.notEqual(element.attachShadow, nativeAttachShadow);
      events.push({ type: "mount" });
    }
  });

  assert.equal(await faceStartup.start(FIXTURE_FACE_TOKEN), "synthetic-face-result");
  assert.equal(faceElement.attachShadow, nativeAttachShadow);
  assert.equal(shadowRoot.adoptedStyleSheets.length, 1);
  assert.equal(shadowRoot.adoptedStyleSheets[0].cssText, EXPECTED_FACE_SHADOW_STYLES);
  assert.deepEqual(
    events.map(({ type }) => type),
    [
      "load-runtime",
      "create",
      "set-locale",
      "set-font-size",
      "set-button-styles",
      "mount",
      "start",
      "attach-shadow",
      "create-style-sheet",
      "replace-style"
    ]
  );
  assert.deepEqual(events.find(({ type }) => type === "attach-shadow").options, {
    mode: "closed"
  });
  harness.hostGuard.assertUnused();
});

test("[FACE-01] deferred Face loading and startup are single-flight but allow later retries", async () => {
  const harness = createLearningPlatformHarness();
  const { createFaceStartup } = await harness.loadModule(MODULE_PATHS.faceStartup);
  let resolveRuntime;
  const pendingRuntime = new Promise((resolve) => {
    resolveRuntime = resolve;
  });
  let loaderCalls = 0;
  let createCalls = 0;
  let startCalls = 0;
  const faceStartup = createFaceStartup({
    createElement() {
      createCalls += 1;
      return {
        attachShadow() {
          return { adoptedStyleSheets: [] };
        },
        start() {
          startCalls += 1;
          return Promise.resolve("synthetic-face-result");
        }
      };
    },
    createStyleSheet() {
      return { replaceSync() {} };
    },
    loadRuntime() {
      loaderCalls += 1;
      return pendingRuntime;
    },
    mount() {}
  });

  const firstStart = faceStartup.start("first-token");
  const concurrentStart = faceStartup.start("second-token");
  assert.equal(firstStart, concurrentStart);
  await Promise.resolve();
  assert.deepEqual([loaderCalls, createCalls, startCalls], [1, 0, 0]);

  resolveRuntime();
  assert.equal(await firstStart, "synthetic-face-result");
  assert.deepEqual([loaderCalls, createCalls, startCalls], [1, 1, 1]);

  assert.equal(await faceStartup.start("retry-token"), "synthetic-face-result");
  assert.deepEqual([loaderCalls, createCalls, startCalls], [1, 2, 2]);
  harness.hostGuard.assertUnused();
});

test("[FACE-01] a rejected Face loader resets without creating or starting the component", async () => {
  const harness = createLearningPlatformHarness();
  const { createFaceStartup } = await harness.loadModule(MODULE_PATHS.faceStartup);
  const transientFailure = new Error("synthetic loader failure");
  let rejectFirstLoad;
  const firstLoad = new Promise((_resolve, reject) => {
    rejectFirstLoad = reject;
  });
  let loaderCalls = 0;
  let createCalls = 0;
  let startCalls = 0;
  const faceStartup = createFaceStartup({
    createElement() {
      createCalls += 1;
      return {
        attachShadow() {
          return { adoptedStyleSheets: [] };
        },
        start() {
          startCalls += 1;
          return Promise.resolve("synthetic-face-result");
        }
      };
    },
    createStyleSheet() {
      return { replaceSync() {} };
    },
    loadRuntime() {
      loaderCalls += 1;
      return loaderCalls === 1 ? firstLoad : Promise.resolve();
    },
    mount() {}
  });

  const firstStart = faceStartup.start("first-token");
  assert.equal(faceStartup.start("concurrent-token"), firstStart);
  await Promise.resolve();
  rejectFirstLoad(transientFailure);
  await assert.rejects(firstStart, (error) => error === transientFailure);
  assert.deepEqual([loaderCalls, createCalls, startCalls], [1, 0, 0]);

  assert.equal(await faceStartup.start("retry-token"), "synthetic-face-result");
  assert.deepEqual([loaderCalls, createCalls, startCalls], [2, 1, 1]);
  harness.hostGuard.assertUnused();
});

test("[GATE-02] admitted study enforces viewport admission before refresh", async () => {
  for (const width of [1023, 1024, 1025]) {
    const harness = createLearningPlatformHarness({
      innerWidth: width,
      pathname: PATHS.study,
      routes: [{
        method: "POST",
        path: "/plataforma_v2/refresh",
        response: { data: {}, status: 401 }
      }],
      storage: {
        IndexVerificado: opaqueValue("row-handle"),
        Usuário_Logado: "Sim"
      }
    });
    await installStudyApplication(harness);
    assert.equal((harness.windowListeners.get("resize") ?? []).length, 0);
    harness.dispatchWindow("load");
    await harness.flush();

    if (width <= 1024) {
      assert.deepEqual(
        harness.replacementNavigation,
        [viewportWarningTarget(PATHS.study)],
        String(width)
      );
      assert.deepEqual(harness.navigation, [], `${width}:ordinary`);
      assert.equal((harness.windowListeners.get("resize") ?? []).length, 0);
      assert.equal(harness.guard.requests.length, 0);
    } else {
      assert.equal(harness.replacementNavigation.length, 0, String(width));
      assert.equal((harness.windowListeners.get("resize") ?? []).length, 1);
      assert.equal(harness.guard.requests.length, 1);
    }
  }

  for (const resizeWidth of [1024, 1023]) {
    const harness = createLearningPlatformHarness({
      innerWidth: 1025,
      pathname: PATHS.study,
      routes: [{
        method: "POST",
        path: "/plataforma_v2/refresh",
        response: { data: {}, status: 401 }
      }],
      storage: {
        IndexVerificado: opaqueValue("row-handle"),
        Usuário_Logado: "Sim"
      }
    });
    await installStudyApplication(harness);
    harness.dispatchWindow("load");
    await harness.flush();
    harness.window.innerWidth = resizeWidth;
    harness.dispatchWindow("resize");
    assert.deepEqual(harness.replacementNavigation, [viewportWarningTarget(PATHS.study)]);
    assert.equal(harness.guard.requests.length, 1, `1025->${resizeWidth}`);
  }

  for (const width of [1023, 1024, 1025]) {
    const unauthenticated = createLearningPlatformHarness({
      innerWidth: width,
      pathname: PATHS.study,
      storage: { Usuário_Logado: "Não" }
    });
    await installStudyApplication(unauthenticated);
    unauthenticated.dispatchWindow("load");
    assert.deepEqual(unauthenticated.navigation, width <= 1024 ? [] : [PATHS.login]);
    assert.deepEqual(
      unauthenticated.replacementNavigation,
      width <= 1024 ? [viewportWarningTarget(PATHS.study)] : [],
      `unauthenticated:${width}`
    );
    assert.equal(unauthenticated.guard.requests.length, 0, `unauthenticated:${width}`);

    const rejected = createLearningPlatformHarness({
      innerWidth: width,
      pathname: PATHS.study,
      storage: { Usuário_Logado: "Sim" },
      userAgent: WINDOWS_CHROME_USER_AGENT,
      userAgentData: {
        brands: [{ brand: "Google Chrome" }],
        mobile: false,
        platform: "Windows"
      }
    });
    await installStudyApplication(rejected);
    rejected.dispatchWindow("load");
    assert.deepEqual(rejected.navigation, [], `rejected:${width}:ordinary`);
    assert.deepEqual(
      rejected.replacementNavigation,
      [PATHS.deviceBrowser],
      `rejected:${width}`
    );
    assert.equal(rejected.guard.requests.length, 0, `rejected:${width}`);
  }
});

test("[ROUTE-03] viewport warning recovers once by replacement above the strict boundary", () => {
  const returnTarget = `${PATHS.notices}/?fixture=one%20two#invented-fragment`;
  const harness = createLearningPlatformHarness({
    innerWidth: 1023,
    pathname: `${PATHS.viewport}/`,
    search: `?returnTo=${encodeURIComponent(returnTarget)}`
  });
  harness.loadScript(SCRIPT_PATHS.viewport);
  assert.equal(harness.sessionStorage.getItem("Origem_Aviso_Dispositivo"), "Sim");
  assert.deepEqual(harness.replacementNavigation, []);
  harness.dispatchWindow("resize");
  harness.window.innerWidth = 1024;
  harness.dispatchWindow("resize");
  assert.deepEqual(harness.replacementNavigation, []);

  harness.window.innerWidth = 1025;
  harness.dispatchWindow("resize");
  harness.window.innerWidth = 1440;
  harness.dispatchWindow("resize");
  harness.dispatchWindow("resize");
  assert.deepEqual(harness.replacementNavigation, [returnTarget]);
  assert.deepEqual(harness.navigation, []);
  assert.equal(harness.history.backCalls, 0);

  const directWide = createLearningPlatformHarness({
    innerWidth: 1025,
    pathname: `${PATHS.viewport}/`
  });
  directWide.loadScript(SCRIPT_PATHS.viewport);
  directWide.dispatchWindow("resize");
  assert.deepEqual(directWide.replacementNavigation, [`${PATHS.login}/`]);
  assert.equal(directWide.history.backCalls, 0);
  directWide.hostGuard.assertUnused();
});

test("[ROUTE-03] viewport warning accepts only exact bounded return targets", () => {
  const approvedPathnames = [
    PATHS.login,
    PATHS.notices,
    PATHS.register,
    PATHS.study,
    PATHS.report,
    "/formulario-informacoes-iniciais"
  ].flatMap((pathname) => [pathname, `${pathname}/`]);

  for (const pathname of approvedPathnames) {
    const returnTarget = `${pathname}?fixture=one%20two&repeat=1&repeat=2#fragment%20value`;
    const harness = createLearningPlatformHarness({
      innerWidth: 1025,
      pathname: `${PATHS.viewport}/`,
      search: `?returnTo=${encodeURIComponent(returnTarget)}`
    });
    assert.doesNotThrow(() => harness.loadScript(SCRIPT_PATHS.viewport), pathname);
    assert.deepEqual(harness.replacementNavigation, [returnTarget], pathname);
    assert.equal(harness.history.backCalls, 0, pathname);
  }

  const rejectedTargets = [
    "plataforma/login",
    "../plataforma/login",
    "/plataforma/login/../estudo",
    "/plataforma/%2e%2e/login",
    "/plataforma/login\\outside.invalid",
    "\\\\outside.invalid\\plataforma\\login",
    "//outside.invalid/plataforma/login",
    `${FIXTURE_ORIGIN}/plataforma/login`,
    "https:" + "//outside.invalid/plataforma/login",
    "https:" + "//fixture:password@learning-platform.test/plataforma/login",
    "javascript:alert(1)",
    "/plataforma/unknown",
    "/formulario-informacoes-iniciais/extra",
    `${PATHS.login}?fixture=${"x".repeat(2048)}`
  ];
  for (const returnTarget of rejectedTargets) {
    const harness = createLearningPlatformHarness({
      innerWidth: 1025,
      pathname: PATHS.viewport,
      search: `?returnTo=${encodeURIComponent(returnTarget)}`
    });
    assert.doesNotThrow(() => harness.loadScript(SCRIPT_PATHS.viewport), returnTarget);
    assert.deepEqual(harness.replacementNavigation, [`${PATHS.login}/`], returnTarget);
  }

  for (const search of [
    "",
    "?returnTo",
    "?returnTo=",
    "?returnTo=%",
    "?returnTo=%E0%A4%A",
    "?returnTo=%2fplataforma%2flogin",
    `?returnTo=${encodeURIComponent(PATHS.login)}&returnTo=${encodeURIComponent(PATHS.study)}`
  ]) {
    const harness = createLearningPlatformHarness({
      innerWidth: 1025,
      pathname: PATHS.viewport,
      search
    });
    assert.doesNotThrow(() => harness.loadScript(SCRIPT_PATHS.viewport), search);
    assert.deepEqual(harness.replacementNavigation, [`${PATHS.login}/`], search);
  }
});

test("[GATE-02] status report enforces viewport admission before rendering or requesting", async () => {
  const reportSearch =
    "?ne=Invented%20Company&nt=1&li=0&lf=0&dua=01012035&idsr=1&mi=1&mf=1&mrm=individual";
  const reportHash = "#invented-status-fragment";
  for (const width of [1023, 1024, 1025]) {
    const harness = createLearningPlatformHarness({
      hash: reportHash,
      innerWidth: width,
      pathname: PATHS.report,
      routes: [{
        method: "POST",
        path: "/plataforma_v2/statusreport",
        response: { data: { Dados_Extraídos_BD_Plataforma: [] } }
      }],
      search: reportSearch
    });
    harness.selectorResults.set(
      ".Gráficos_Controle_Resultados",
      Array.from({ length: 12 }, (_, index) => harness.element(`fixture-report-graph-${index}`))
    );
    await installStatusReportApplication(harness);
    await harness.window.onload();
    await harness.flush(10);

    if (width <= 1024) {
      assert.deepEqual(
        harness.replacementNavigation,
        [viewportWarningTarget(PATHS.report, reportSearch, reportHash)],
        String(width)
      );
      assert.deepEqual(harness.navigation, [], `${width}:ordinary`);
      assert.equal((harness.windowListeners.get("resize") ?? []).length, 0);
      assert.equal(harness.guard.requests.length, 0);
      assert.notEqual(harness.element("Container_Externo_Conteúdo").style.display, "block");
    } else {
      assert.equal(harness.replacementNavigation.length, 0, String(width));
      assert.equal((harness.windowListeners.get("resize") ?? []).length, 1);
      assert.equal(harness.guard.requests.length, 1);
      assert.equal(harness.element("Container_Externo_Conteúdo").style.display, "block");
      assert.equal(harness.element("Aviso_Carregando_Informações").style.display, "none");
    }
  }

  for (const resizeWidth of [1024, 1023]) {
    const harness = createLearningPlatformHarness({
      hash: reportHash,
      innerWidth: 1025,
      pathname: PATHS.report,
      routes: [{
        method: "POST",
        path: "/plataforma_v2/statusreport",
        response: { data: { Dados_Extraídos_BD_Plataforma: [] } }
      }],
      search: reportSearch
    });
    harness.selectorResults.set(
      ".Gráficos_Controle_Resultados",
      Array.from({ length: 12 }, (_, index) => harness.element(`resize-report-${index}`))
    );
    await installStatusReportApplication(harness);
    await harness.window.onload();
    await harness.flush(10);
    harness.window.innerWidth = resizeWidth;
    harness.dispatchWindow("resize");
    assert.deepEqual(
      harness.replacementNavigation,
      [viewportWarningTarget(PATHS.report, reportSearch, reportHash)],
      `1025->${resizeWidth}`
    );
    assert.equal(harness.guard.requests.length, 1, `1025->${resizeWidth}`);
  }
});

test("[STORE-01] exact seven key spellings, readers, writers, and value conventions remain represented", async () => {
  const harness = createLearningPlatformHarness();
  const { SESSION_KEYS } = await harness.loadModule(MODULE_PATHS.session);
  const sourcesByPage = Object.fromEntries(
    Object.keys(SCRIPT_PATHS).map((page) => [page, readApplicationSource(page)])
  );
  const callsByPage = Object.fromEntries(Object.keys(sourcesByPage).map((page) => [page, []]));
  const directPattern = /sessionStorage\.(getItem|setItem)\(\s*['"]([^'"]+)['"]/g;
  const seamPattern = /\bsession\.(read|write)\(\s*['"]([^'"]+)['"]/g;

  for (const [page, source] of Object.entries(sourcesByPage)) {
    for (const match of source.matchAll(directPattern)) {
      callsByPage[page].push({ key: match[2], method: match[1] });
    }
    for (const match of source.matchAll(seamPattern)) {
      assert.ok(SESSION_KEYS[match[2]], `Unknown session-key alias: ${match[2]}`);
      callsByPage[page].push({
        key: SESSION_KEYS[match[2]],
        method: match[1] === "read" ? "getItem" : "setItem"
      });
    }
  }

  const keyCalls = Object.values(callsByPage).flat();
  assert.equal(Object.values(SESSION_KEYS).length, 7);
  assert.deepEqual(Object.values(SESSION_KEYS).sort(), [
    "Horário-Encerramento-Sessão",
    "IndexVerificado",
    "Origem_Aviso_Dispositivo",
    "TempoSessão_Segundos",
    "Usuário_Autorização_Cadastro",
    "Usuário_Foto_Cadastrada",
    "Usuário_Logado"
  ].sort());
  assert.deepEqual(
    [...new Set(keyCalls.map(({ key }) => key))].sort(),
    Object.values(SESSION_KEYS).sort()
  );

  assert.deepEqual(
    [...new Set(keyCalls.filter(({ key }) => key === "TempoSessão_Segundos").map(({ method }) => method))],
    ["getItem"]
  );
  const combined = [
    ...Object.values(sourcesByPage),
    readPlatformScript(MODULE_PATHS.session)
  ].join("\n");
  assert.equal(/(?:sessionStorage|storage)\.(?:removeItem|clear)\s*\(/.test(combined), false);
  assert.equal(combined.includes("clock.now() + (14400 * 1000)"), true);
  for (const value of ["Sim", "Não"]) assert.equal(combined.includes(`'${value}'`), true);

  const expectedReaders = {
    "Horário-Encerramento-Sessão": ["study"],
    IndexVerificado: ["register", "study"],
    Origem_Aviso_Dispositivo: ["login"],
    TempoSessão_Segundos: ["study"],
    Usuário_Autorização_Cadastro: ["login", "notices", "register"],
    Usuário_Foto_Cadastrada: [],
    Usuário_Logado: ["login", "study"]
  };
  const expectedWriters = {
    "Horário-Encerramento-Sessão": ["login"],
    IndexVerificado: ["login"],
    Origem_Aviso_Dispositivo: ["login", "notices", "register", "study", "viewport"],
    TempoSessão_Segundos: [],
    Usuário_Autorização_Cadastro: ["login", "register"],
    Usuário_Foto_Cadastrada: ["login"],
    Usuário_Logado: ["login", "register", "study"]
  };
  for (const [key, pages] of Object.entries(expectedReaders)) {
    assert.deepEqual(
      Object.entries(callsByPage)
        .filter(([, calls]) => calls.some((call) => call.key === key && call.method === "getItem"))
        .map(([page]) => page)
        .sort(),
      [...pages].sort(),
      `Readers must remain exact for ${key}`
    );
  }
  for (const [key, pages] of Object.entries(expectedWriters)) {
    assert.deepEqual(
      Object.entries(callsByPage)
        .filter(([, calls]) => calls.some((call) => call.key === key && call.method === "setItem"))
        .map(([page]) => page)
        .sort(),
      [...pages].sort(),
      `Writers must remain exact for ${key}`
    );
  }
  harness.hostGuard.assertUnused();
});

test("[STORE-02] refresh preserves stored deadline and handle while logout changes only the login flag", async () => {
  const storedDeadline = "2000003600000";
  const harness = createLearningPlatformHarness({
    routes: [{
      expect: ({ jsonBody }) => ({
        handleExact: jsonBody?.IndexVerificado === FIXTURE_HANDLE
      }),
      method: "POST",
      path: "/plataforma_v2/refresh",
      response: { data: refreshData() }
    }],
    storage: {
      "Horário-Encerramento-Sessão": storedDeadline,
      IndexVerificado: FIXTURE_HANDLE,
      Origem_Aviso_Dispositivo: "Sim",
      TempoSessão_Segundos: "legacy-observation",
      Usuário_Autorização_Cadastro: "Não",
      Usuário_Foto_Cadastrada: "Sim",
      Usuário_Logado: "Sim"
    }
  });
  await installStudyApplication(harness);
  harness.dispatchWindow("load");
  await harness.flush(20);

  assertExpectationFlags(harness, { handleExact: true });
  assertNoQuery(harness);
  assert.equal(harness.sessionStorage.getItem("Horário-Encerramento-Sessão"), storedDeadline);
  assert.equal(harness.sessionStorage.getItem("IndexVerificado") === FIXTURE_HANDLE, true);
  assert.equal(
    harness.element("Formação-Prazo-Acesso").textContent,
    "Acesso Expira: 31/12/2099"
  );

  harness.element("Botão-Sair").dispatch("click");
  const snapshot = harness.sessionStorage.snapshot({ redact: ["IndexVerificado"] });
  assert.deepEqual(snapshot, {
    "Horário-Encerramento-Sessão": storedDeadline,
    IndexVerificado: "<redacted>",
    Origem_Aviso_Dispositivo: "Não",
    TempoSessão_Segundos: "legacy-observation",
    Usuário_Autorização_Cadastro: "Não",
    Usuário_Foto_Cadastrada: "Sim",
    Usuário_Logado: "Não"
  });
  assert.equal(harness.navigation.at(-1), PATHS.login);
});

test("[API-01] login posts untrimmed credentials and preserves active and inactive branches", async () => {
  const expectedLogin = "  learner@example.test  ";
  const expectedPassword = "  fixture password  ";
  const active = createLearningPlatformHarness({
    now: 2_000_000_000_000,
    routes: [{
      expect: ({ jsonBody }) => ({
        loginExact: jsonBody?.Usuário_Login === expectedLogin,
        passwordExact: jsonBody?.Usuário_Senha === expectedPassword
      }),
      method: "POST",
      path: "/plataforma_v2/login-FaceID",
      response: { data: loginResponse({ Usuário_Status_FaceID: "Inativo" }) }
    }]
  });
  await installLoginApplication(active);
  active.element("E-mail").value = expectedLogin;
  active.element("Senha").value = expectedPassword;
  submit(active.element("Formulário-Login"));
  await active.flush(20);

  assert.deepEqual(active.guard.requests, [{
    body: {
      Usuário_Login: "  learner@example.test  ",
      Usuário_Senha: "<redacted>"
    },
    formFields: undefined,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    path: "/plataforma_v2/login-FaceID"
  }]);
  assertExpectationFlags(active, { loginExact: true, passwordExact: true });
  assertNoQuery(active);
  assert.equal(active.sessionStorage.getItem("IndexVerificado") === FIXTURE_HANDLE, true);
  assert.equal(active.sessionStorage.getItem("Usuário_Foto_Cadastrada"), "Não");
  assert.equal(active.sessionStorage.getItem("Usuário_Logado"), "Sim");
  assert.equal(
    active.sessionStorage.getItem("Horário-Encerramento-Sessão"),
    "2000014400000"
  );
  assert.equal(active.navigation.at(-1), PATHS.study);

  const inactive = createLearningPlatformHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/login-FaceID",
      response: {
        data: loginResponse({
          IndexVerificado: undefined,
          Usuário_Foto_Cadastrada: "Não",
          Usuário_PrazoAcesso: "01/01/2000",
          Usuário_Status_Login: "Inativo"
        })
      }
    }]
  });
  await installLoginApplication(inactive);
  submit(inactive.element("Formulário-Login"));
  await inactive.flush(20);
  assert.equal(inactive.sessionStorage.getItem("IndexVerificado"), "undefined");
  assert.equal(inactive.element("Aviso-Login-Expirado").style.display, "block");
  assert.equal(inactive.document.activeElement, inactive.element("E-mail"));
  assert.equal(inactive.element("Formulário-Login").getAttribute("aria-busy"), "false");
  assert.equal(
    inactive.element("Aviso-Login-Expirado").innerHTML.endsWith("01/01/2000"),
    true
  );
});

test("[API-01] login preserves invalid-credential, workbook, generic, and unexpected waiting branches", async () => {
  const failures = [
    { data: {}, expectedAlert: null, expectedInline: true, status: 401 },
    {
      data: { error: "learning_platform.read_platform_data_failed" },
      expectedAlert: "Erro_001",
      status: 500
    },
    { data: { error: "Unexpected" }, expectedAlert: "Erro_000", status: 500 }
  ];
  for (const fixture of failures) {
    const harness = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: fixture.data, status: fixture.status }
      }]
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(20);
    if (fixture.expectedInline) {
      assert.equal(harness.alerts.length, 0);
      assert.equal(harness.element("Aviso-Email-ou-Senha-Inválidos").style.display, "block");
      assert.equal(harness.element("E-mail").getAttribute("aria-invalid"), "true");
      assert.equal(harness.element("Senha").getAttribute("aria-invalid"), "true");
    } else {
      assertOnlyErrorCode(harness.alerts, fixture.expectedAlert);
    }
    assert.equal(harness.element("Entrar").disabled, false);
    assert.equal(harness.document.activeElement, harness.element("E-mail"));
  }

  const networkFailure = createLearningPlatformHarness({
    routes: [{
      handler: async () => { throw new Error("Synthetic fixture failure"); },
      method: "POST",
      path: "/plataforma_v2/login-FaceID"
    }]
  });
  await installLoginApplication(networkFailure);
  submit(networkFailure.element("Formulário-Login"));
  await networkFailure.flush(20);
  assertOnlyErrorCode(networkFailure.alerts, "Erro_000");

  const unexpected = createLearningPlatformHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/login-FaceID",
      response: {
        data: loginResponse({
          Usuário_Foto_Cadastrada: "Unexpected",
          Usuário_Status_FaceID: "Unexpected"
        })
      }
    }]
  });
  await installLoginApplication(unexpected);
  submit(unexpected.element("Formulário-Login"));
  await unexpected.flush(20);
  assert.equal(unexpected.navigation.length, 0);
  assert.equal(unexpected.alerts.length, 0);
  assert.equal(unexpected.element("Entrar").disabled, true);
  assert.equal(unexpected.element("Aviso-Inicializando").style.display, "block");
});

test("[API-01] Face registration sends ordered multipart fields and maps known failures", async () => {
  let faceTokenExact = false;
  const success = createLearningPlatformHarness({
    faceStartImplementation: async (token) => {
      faceTokenExact = token === FIXTURE_FACE_TOKEN;
      return {};
    },
    routes: [
      {
        expect: ({ formData }) => ({
          handleExact: formData?.get("IndexVerificado") === FIXTURE_HANDLE
        }),
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID",
        response: { data: faceSessionResponse() }
      },
      {
        method: "GET",
        path: FIXTURE_RESULT_PATH,
        response: { data: faceResultResponse() }
      }
    ],
    storage: {
      IndexVerificado: FIXTURE_HANDLE,
      Usuário_Autorização_Cadastro: "Sim"
    }
  });
  success.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
  await installRegistrationApplication(success);
  submit(success.element("Formulário-Foto-Referência"));
  await success.flush(30);

  assert.deepEqual(
    success.timeline.filter(({ type }) => [
      "storage-get", "fetch", "storage-set", "append", "face-start", "navigate"
    ].includes(type)),
    [
      { key: "IndexVerificado", type: "storage-get" },
      { method: "POST", path: "/plataforma_v2/CadastroFoto_e_FaceID", type: "fetch" },
      { key: "Usuário_Autorização_Cadastro", type: "storage-set" },
      { tagName: "AZURE-AI-VISION-FACE-UI", type: "append" },
      { tokenPresent: true, type: "face-start" },
      { method: "GET", path: "/plataforma_v2/FaceID_resultado/:sessionId", type: "fetch" },
      { key: "Usuário_Logado", type: "storage-set" },
      { path: PATHS.study, type: "navigate" }
    ]
  );
  const registrationFaceElement = success.element("Container-Auxiliar-FaceID").children[0];
  assert.equal(registrationFaceElement.locale, "pt-BR");
  assert.equal(registrationFaceElement.fontSize, "18px");
  assertFaceShadowPresentation(registrationFaceElement);
  assert.equal(
    registrationFaceElement.buttonStyles,
    "margin-top: 10px; height: 40px; width: 110px; font-size: 16px; border-radius: 20px; box-shadow: 0px 0px 8px #4a0816; border: 0px; cursor: pointer;"
  );
  assert.deepEqual(success.guard.requests[0], {
    body: undefined,
    formFields: [
      ["IndexVerificado", "<redacted>"],
      ["file", "<file:invented-reference.jpg>"]
    ],
    headers: {},
    method: "POST",
    path: "/plataforma_v2/CadastroFoto_e_FaceID"
  });
  assertExpectationFlags(success, { handleExact: true });
  assertNoQuery(success);
  assert.equal(faceTokenExact, true);
  assert.equal(success.sessionStorage.getItem("Usuário_Autorização_Cadastro"), "Não");
  assert.equal(success.sessionStorage.getItem("Usuário_Logado"), "Sim");
  assert.equal(success.navigation.at(-1), PATHS.study);

  for (const { expectedAlert, machineValue } of [
    {
      expectedAlert: "Erro_002",
      machineValue: "learning_platform.upload_reference_photo_failed"
    },
    {
      expectedAlert: "Erro_003",
      machineValue: "learning_platform.update_reference_photo_registration_failed"
    },
    {
      expectedAlert: "Erro_004",
      machineValue: "learning_platform.create_face_liveness_session_failed"
    }
  ]) {
    const failure = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID",
        response: { data: { error: machineValue }, status: 500 }
      }],
      storage: {
        IndexVerificado: opaqueValue("row-handle"),
        Usuário_Autorização_Cadastro: "Sim"
      }
    });
    failure.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
    await installRegistrationApplication(failure);
    submit(failure.element("Formulário-Foto-Referência"));
    await failure.flush(20);
    assertOnlyErrorCode(failure.alerts, expectedAlert);
    assertMachineValueHidden(failure, machineValue);
    assert.equal(failure.element("Botão-Cadastrar-Foto-Referência").disabled, false);
    assert.equal(
      failure.document.activeElement,
      failure.element("Botão-Escolher-Arquivo")
    );
    assert.equal(
      failure.element("Formulário-Foto-Referência").getAttribute("aria-busy"),
      "false"
    );
  }
});

test("[FLOW-01] registration post-success Face failures keep authorization cleared and return to login", async () => {
  const scenarios = [
    {
      expectedAlert: "Erro_006",
      expectedRequests: [
        { method: "POST", path: "/plataforma_v2/CadastroFoto_e_FaceID" }
      ],
      faceRejects: true
    },
    {
      expectedAlert: "Erro_007",
      expectedRequests: [
        { method: "POST", path: "/plataforma_v2/CadastroFoto_e_FaceID" },
        { method: "GET", path: "/plataforma_v2/FaceID_resultado/:sessionId" }
      ],
      resultResponse: {
        data: { error: "learning_platform.read_face_liveness_result_failed" },
        status: 500
      }
    }
  ];

  for (const scenario of scenarios) {
    let faceTokenExact = false;
    const harness = createLearningPlatformHarness({
      faceStartImplementation: async (token) => {
        faceTokenExact = token === FIXTURE_FACE_TOKEN;
        if (scenario.faceRejects) throw new Error("Synthetic Face component rejection");
        return {};
      },
      routes: [
        {
          expect: ({ formData }) => ({
            handleExact: formData?.get("IndexVerificado") === FIXTURE_HANDLE
          }),
          method: "POST",
          path: "/plataforma_v2/CadastroFoto_e_FaceID",
          response: { data: faceSessionResponse() }
        },
        {
          method: "GET",
          path: FIXTURE_RESULT_PATH,
          response: scenario.resultResponse ?? { data: faceResultResponse() }
        }
      ],
      storage: {
        IndexVerificado: FIXTURE_HANDLE,
        Usuário_Autorização_Cadastro: "Sim"
      }
    });
    harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
    await installRegistrationApplication(harness);
    submit(harness.element("Formulário-Foto-Referência"));
    await harness.flush(30);

    assert.deepEqual(
      harness.guard.requests.map(({ method, path }) => ({ method, path })),
      scenario.expectedRequests
    );
    assertExpectationFlags(harness, { handleExact: true });
    assertNoQuery(harness);
    assert.equal(faceTokenExact, true);
    assertOnlyErrorCode(harness.alerts, scenario.expectedAlert);
    assert.equal(harness.sessionStorage.getItem("Usuário_Autorização_Cadastro"), "Não");
    assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), null);
    assert.deepEqual(harness.navigation, [PATHS.login]);
  }
});

test("[API-01] registration result consumer keeps decision, generic, header, and session behavior", async () => {
  const scenarios = [
    {
      decision: true,
      response: {
        data: faceResultResponse({
          Azure_Face_API_LivenessSession_LivenessDecision: "spoof",
          Azure_Face_API_LivenessSession_MatchConfidence: 0.12,
          Azure_Face_API_LivenessSession_MatchDecision: false
        })
      }
    },
    { expectedAlert: "Erro_000", response: { data: {}, status: 401 } },
    {
      expectedAlert: "Erro_000",
      response: { data: { error: "Unexpected" }, status: 500 }
    }
  ];

  for (const scenario of scenarios) {
    let faceTokenExact = false;
    const harness = createLearningPlatformHarness({
      faceStartImplementation: async (token) => {
        faceTokenExact = token === FIXTURE_FACE_TOKEN;
        return {};
      },
      routes: [
        {
          expect: ({ formData }) => ({
            handleExact: formData?.get("IndexVerificado") === FIXTURE_HANDLE
          }),
          method: "POST",
          path: "/plataforma_v2/CadastroFoto_e_FaceID",
          response: { data: faceSessionResponse() }
        },
        {
          method: "GET",
          path: FIXTURE_RESULT_PATH,
          response: scenario.response
        }
      ],
      storage: {
        IndexVerificado: FIXTURE_HANDLE,
        Usuário_Autorização_Cadastro: "Sim"
      }
    });
    harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
    await installRegistrationApplication(harness);
    submit(harness.element("Formulário-Foto-Referência"));
    await harness.flush(30);

    assert.deepEqual(harness.guard.requests.map(({ method, path }) => ({ method, path })), [
      { method: "POST", path: "/plataforma_v2/CadastroFoto_e_FaceID" },
      { method: "GET", path: "/plataforma_v2/FaceID_resultado/:sessionId" }
    ]);
    assert.deepEqual(harness.guard.requests[1].headers, {
      "Content-Type": "application/json"
    });
    assertExpectationFlags(harness, { handleExact: true });
    assertNoQuery(harness);
    assert.equal(faceTokenExact, true);
    assert.equal(harness.sessionStorage.getItem("Usuário_Autorização_Cadastro"), "Não");
    assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), null);
    assert.deepEqual(harness.navigation, [PATHS.login]);
    if (scenario.decision) {
      assert.equal(harness.alerts.length, 1);
      assert.equal(harness.alerts[0].includes("spoof"), true);
      assert.equal(harness.alerts[0].includes("0.12"), true);
      assert.equal(harness.alerts[0].includes("false"), true);
    } else {
      assertOnlyErrorCode(harness.alerts, scenario.expectedAlert);
    }
  }
});

test("[API-02] Face verification creates a protected session then performs exactly one public result GET", async () => {
  let faceTokenExact = false;
  const harness = createLearningPlatformHarness({
    faceStartImplementation: async (token) => {
      faceTokenExact = token === FIXTURE_FACE_TOKEN;
      return {};
    },
    routes: [
      {
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: loginResponse({ Usuário_Foto_Cadastrada: "Sim" }) }
      },
      {
        expect: ({ jsonBody }) => ({
          handleExact: jsonBody?.IndexVerificado === FIXTURE_HANDLE
        }),
        method: "POST",
        path: "/plataforma_v2/FaceID",
        response: { data: faceSessionResponse() }
      },
      {
        method: "GET",
        path: FIXTURE_RESULT_PATH,
        response: { data: faceResultResponse() }
      }
    ]
  });
  await installLoginApplication(harness);
  submit(harness.element("Formulário-Login"));
  await harness.flush(30);

  assert.deepEqual(
    harness.timeline.filter(({ type }) => [
      "fetch", "storage-set", "append", "face-start", "navigate"
    ].includes(type)),
    [
      { method: "POST", path: "/plataforma_v2/login-FaceID", type: "fetch" },
      { key: "IndexVerificado", type: "storage-set" },
      { key: "Usuário_Foto_Cadastrada", type: "storage-set" },
      { key: "Horário-Encerramento-Sessão", type: "storage-set" },
      { method: "POST", path: "/plataforma_v2/FaceID", type: "fetch" },
      { tagName: "AZURE-AI-VISION-FACE-UI", type: "append" },
      { tokenPresent: true, type: "face-start" },
      { method: "GET", path: "/plataforma_v2/FaceID_resultado/:sessionId", type: "fetch" },
      { key: "Usuário_Logado", type: "storage-set" },
      { path: PATHS.study, type: "navigate" }
    ]
  );
  const loginFaceElement = harness.element("Container-Auxiliar-FaceID").children[0];
  assert.equal(loginFaceElement.locale, "pt-BR");
  assert.equal(loginFaceElement.fontSize, "18px");
  assertFaceShadowPresentation(loginFaceElement);
  assert.deepEqual(harness.guard.requests.map(({ method, path }) => ({ method, path })), [
    { method: "POST", path: "/plataforma_v2/login-FaceID" },
    { method: "POST", path: "/plataforma_v2/FaceID" },
    { method: "GET", path: "/plataforma_v2/FaceID_resultado/:sessionId" }
  ]);
  assert.deepEqual(harness.guard.requests[1].body, { IndexVerificado: "<redacted>" });
  assert.deepEqual(harness.guard.requests[1].headers, { "Content-Type": "application/json" });
  assert.deepEqual(harness.guard.requests[2].headers, { "Content-Type": "application/json" });
  assertExpectationFlags(harness, { handleExact: true });
  assertNoQuery(harness);
  assert.equal(faceTokenExact, true);
  assert.equal(harness.timeline.filter(({ type }) => type === "face-start").length, 1);
  assert.equal(harness.sessionStorage.getItem("IndexVerificado") === FIXTURE_HANDLE, true);
  assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Sim");
  assert.equal(harness.navigation.at(-1), PATHS.study);
});

test("[API-02] Face decision, SDK rejection, and result error branches remain single-shot", async () => {
  const cases = [
    {
      expectedAlert: null,
      faceResult: faceResultResponse({
        Azure_Face_API_LivenessSession_LivenessDecision: "spoof",
        Azure_Face_API_LivenessSession_MatchDecision: false
      }),
      label: "decision"
    },
    {
      expectedAlert: "Erro_006",
      faceRejects: true,
      label: "sdk"
    },
    {
      expectedAlert: "Erro_007",
      label: "result-error",
      resultError: true
    }
  ];

  for (const scenario of cases) {
    let faceTokenExact = false;
    const harness = createLearningPlatformHarness({
      faceStartImplementation: async (token) => {
        faceTokenExact = token === FIXTURE_FACE_TOKEN;
        if (scenario.faceRejects) throw new Error("Synthetic Face component rejection");
        return {};
      },
      routes: [
        {
          method: "POST",
          path: "/plataforma_v2/login-FaceID",
          response: { data: loginResponse({ Usuário_Foto_Cadastrada: "Sim" }) }
        },
        {
          method: "POST",
          path: "/plataforma_v2/FaceID",
          response: { data: faceSessionResponse() }
        },
        {
          method: "GET",
          path: FIXTURE_RESULT_PATH,
          response: scenario.resultError
            ? {
                data: { error: "learning_platform.read_face_liveness_result_failed" },
                status: 500
              }
            : { data: scenario.faceResult ?? faceResultResponse() }
        }
      ]
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(30);

    const resultRequests = harness.guard.requests.filter(({ path }) =>
      path === "/plataforma_v2/FaceID_resultado/:sessionId"
    );
    assertNoQuery(harness);
    assert.equal(faceTokenExact, true, scenario.label);
    assert.equal(resultRequests.length, scenario.faceRejects ? 0 : 1, scenario.label);
    if (scenario.label === "decision") {
      assert.equal(harness.element("Aviso-FaceID-Reprovado").style.display, "block");
      assert.equal(harness.document.activeElement, harness.element("E-mail"));
      assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), null);
    } else {
      assertOnlyErrorCode(harness.alerts, scenario.expectedAlert);
    }
  }
});

test("[API-02] Face start and result retain exact specific and generic mappings", async () => {
  for (const { expectedAlert, machineValue } of [
    {
      expectedAlert: "Erro_004",
      machineValue: "learning_platform.create_face_liveness_session_failed"
    },
    {
      expectedAlert: "Erro_005",
      machineValue: "learning_platform.read_reference_photo_failed"
    }
  ]) {
    const harness = createLearningPlatformHarness({
      routes: [
        {
          method: "POST",
          path: "/plataforma_v2/login-FaceID",
          response: { data: loginResponse({ Usuário_Foto_Cadastrada: "Sim" }) }
        },
        {
          method: "POST",
          path: "/plataforma_v2/FaceID",
          response: { data: { error: machineValue }, status: 500 }
        }
      ]
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(20);
    assertOnlyErrorCode(harness.alerts, expectedAlert);
    assertMachineValueHidden(harness, machineValue);
    assert.equal(harness.guard.requests.length, 2);
    assertNoQuery(harness);
  }

  const result401 = createLearningPlatformHarness({
    routes: [
      {
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: loginResponse({ Usuário_Foto_Cadastrada: "Sim" }) }
      },
      { method: "POST", path: "/plataforma_v2/FaceID", response: { data: faceSessionResponse() } },
      {
        method: "GET",
        path: FIXTURE_RESULT_PATH,
        response: { data: {}, status: 401 }
      }
    ]
  });
  await installLoginApplication(result401);
  submit(result401.element("Formulário-Login"));
  await result401.flush(30);
  assertOnlyErrorCode(result401.alerts, "Erro_000");
  assertNoQuery(result401);
  assert.equal(
    result401.guard.requests.filter(({ path }) => path.endsWith(":sessionId")).length,
    1
  );
});

test("[ERROR-02] named backend values preserve exact entry failure effects", async () => {
  function snapshotEntryFailure(harness, controls) {
    return {
      alerts: [...harness.alerts],
      consoleCalls: [...harness.consoleCalls],
      controls,
      navigation: [...harness.navigation],
      requests: harness.guard.requests,
      storage: harness.sessionStorage.snapshot({
        redact: ["IndexVerificado"]
      }),
      timeline: harness.timeline.filter(({ type }) => [
        "append", "face-start", "fetch", "navigate", "storage-set"
      ].includes(type))
    };
  }

  async function runLoginFailure(machineValue) {
    const harness = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: { error: machineValue }, status: 500 }
      }]
    });
    await installLoginApplication(harness);
    harness.element("E-mail").value = "invented@example.test";
    harness.element("Senha").value = "invented password";
    submit(harness.element("Formulário-Login"));
    await harness.flush(20);
    assertNoQuery(harness);
    return {
      harness,
      snapshot: snapshotEntryFailure(harness, {
        cursor: harness.document.body.style.cursor,
        initializing: harness.element("Aviso-Inicializando").style.display,
        invalidCredentials: harness.element("Aviso-Email-ou-Senha-Inválidos").style.display,
        password: harness.element("Senha").value,
        submitDisabled: harness.element("Entrar").disabled,
        submitDisplay: harness.element("Entrar").style.display,
        user: harness.element("E-mail").value
      })
    };
  }

  async function runRegistrationFailure(machineValue) {
    const harness = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID",
        response: { data: { error: machineValue }, status: 500 }
      }],
      storage: {
        IndexVerificado: FIXTURE_HANDLE,
        Usuário_Autorização_Cadastro: "Sim"
      }
    });
    harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
    await installRegistrationApplication(harness);
    submit(harness.element("Formulário-Foto-Referência"));
    await harness.flush(20);
    assertNoQuery(harness);
    return {
      harness,
      snapshot: snapshotEntryFailure(harness, {
        cursor: harness.document.body.style.cursor,
        registering: harness.element("Aviso-Cadastrando").style.display,
        submitDisabled: harness.element("Botão-Cadastrar-Foto-Referência").disabled,
        submitDisplay: harness.element("Botão-Cadastrar-Foto-Referência").style.display
      })
    };
  }

  async function runFaceSessionFailure(machineValue) {
    const harness = createLearningPlatformHarness({
      routes: [
        {
          method: "POST",
          path: "/plataforma_v2/login-FaceID",
          response: { data: loginResponse({ Usuário_Foto_Cadastrada: "Sim" }) }
        },
        {
          method: "POST",
          path: "/plataforma_v2/FaceID",
          response: { data: { error: machineValue }, status: 500 }
        }
      ]
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(20);
    assertNoQuery(harness);
    return {
      harness,
      snapshot: snapshotEntryFailure(harness, {
        cursor: harness.document.body.style.cursor,
        initializing: harness.element("Aviso-Inicializando").style.display,
        rejectedFace: harness.element("Aviso-FaceID-Reprovado").style.display,
        submitDisabled: harness.element("Entrar").disabled,
        submitDisplay: harness.element("Entrar").style.display
      })
    };
  }

  async function runFaceResultFailure(machineValue) {
    const harness = createLearningPlatformHarness({
      faceStartImplementation: async () => ({}),
      routes: [
        {
          method: "POST",
          path: "/plataforma_v2/login-FaceID",
          response: { data: loginResponse({ Usuário_Foto_Cadastrada: "Sim" }) }
        },
        {
          method: "POST",
          path: "/plataforma_v2/FaceID",
          response: { data: faceSessionResponse() }
        },
        {
          method: "GET",
          path: FIXTURE_RESULT_PATH,
          response: { data: { error: machineValue }, status: 500 }
        }
      ]
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(30);
    assertNoQuery(harness);
    return {
      harness,
      snapshot: snapshotEntryFailure(harness, {
        cursor: harness.document.body.style.cursor,
        faceChildren: harness.element("Container-Auxiliar-FaceID").children.length,
        initializing: harness.element("Aviso-Inicializando").style.display,
        submitDisabled: harness.element("Entrar").disabled,
        submitDisplay: harness.element("Entrar").style.display
      })
    };
  }

  const expectedEffectsByRun = new Map([
    [runLoginFailure, {
      consoleCalls: [],
      controls: {
        cursor: "default",
        initializing: "none",
        invalidCredentials: undefined,
        password: "",
        submitDisabled: false,
        submitDisplay: "block",
        user: ""
      },
      navigation: [],
      requests: [{
        body: {
          Usuário_Login: "invented@example.test",
          Usuário_Senha: "<redacted>"
        },
        formFields: undefined,
        headers: { "Content-Type": "application/json" },
        method: "POST",
        path: "/plataforma_v2/login-FaceID"
      }],
      storage: {},
      timeline: [
        { method: "POST", path: "/plataforma_v2/login-FaceID", type: "fetch" }
      ]
    }],
    [runRegistrationFailure, {
      consoleCalls: [],
      controls: {
        cursor: "default",
        registering: "none",
        submitDisabled: false,
        submitDisplay: "block"
      },
      navigation: [],
      requests: [{
        body: undefined,
        formFields: [
          ["IndexVerificado", "<redacted>"],
          ["file", "<file:invented-reference.jpg>"]
        ],
        headers: {},
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID"
      }],
      storage: {
        IndexVerificado: "<redacted>",
        Usuário_Autorização_Cadastro: "Sim"
      },
      timeline: [
        {
          method: "POST",
          path: "/plataforma_v2/CadastroFoto_e_FaceID",
          type: "fetch"
        }
      ]
    }],
    [runFaceSessionFailure, {
      consoleCalls: [],
      controls: {
        cursor: "default",
        initializing: "none",
        rejectedFace: undefined,
        submitDisabled: false,
        submitDisplay: "block"
      },
      navigation: [],
      requests: [
        {
          body: { Usuário_Login: "", Usuário_Senha: "<redacted>" },
          formFields: undefined,
          headers: { "Content-Type": "application/json" },
          method: "POST",
          path: "/plataforma_v2/login-FaceID"
        },
        {
          body: { IndexVerificado: "<redacted>" },
          formFields: undefined,
          headers: { "Content-Type": "application/json" },
          method: "POST",
          path: "/plataforma_v2/FaceID"
        }
      ],
      storage: {
        "Horário-Encerramento-Sessão": "2000014400000",
        IndexVerificado: "<redacted>",
        Usuário_Foto_Cadastrada: "Sim"
      },
      timeline: [
        { method: "POST", path: "/plataforma_v2/login-FaceID", type: "fetch" },
        { key: "IndexVerificado", type: "storage-set" },
        { key: "Usuário_Foto_Cadastrada", type: "storage-set" },
        { key: "Horário-Encerramento-Sessão", type: "storage-set" },
        { method: "POST", path: "/plataforma_v2/FaceID", type: "fetch" }
      ]
    }],
    [runFaceResultFailure, {
      consoleCalls: [],
      controls: {
        cursor: "default",
        faceChildren: 1,
        initializing: "none",
        submitDisabled: false,
        submitDisplay: "block"
      },
      navigation: [],
      requests: [
        {
          body: { Usuário_Login: "", Usuário_Senha: "<redacted>" },
          formFields: undefined,
          headers: { "Content-Type": "application/json" },
          method: "POST",
          path: "/plataforma_v2/login-FaceID"
        },
        {
          body: { IndexVerificado: "<redacted>" },
          formFields: undefined,
          headers: { "Content-Type": "application/json" },
          method: "POST",
          path: "/plataforma_v2/FaceID"
        },
        {
          body: undefined,
          formFields: undefined,
          headers: { "Content-Type": "application/json" },
          method: "GET",
          path: "/plataforma_v2/FaceID_resultado/:sessionId"
        }
      ],
      storage: {
        "Horário-Encerramento-Sessão": "2000014400000",
        IndexVerificado: "<redacted>",
        Usuário_Foto_Cadastrada: "Sim"
      },
      timeline: [
        { method: "POST", path: "/plataforma_v2/login-FaceID", type: "fetch" },
        { key: "IndexVerificado", type: "storage-set" },
        { key: "Usuário_Foto_Cadastrada", type: "storage-set" },
        { key: "Horário-Encerramento-Sessão", type: "storage-set" },
        { method: "POST", path: "/plataforma_v2/FaceID", type: "fetch" },
        { tagName: "AZURE-AI-VISION-FACE-UI", type: "append" },
        { tokenPresent: true, type: "face-start" },
        { method: "GET", path: "/plataforma_v2/FaceID_resultado/:sessionId", type: "fetch" }
      ]
    }]
  ]);

  const namedFailures = [
    {
      expectedAlert: "Erro_001",
      named: "learning_platform.read_platform_data_failed",
      run: runLoginFailure
    },
    {
      expectedAlert: "Erro_002",
      named: "learning_platform.upload_reference_photo_failed",
      run: runRegistrationFailure
    },
    {
      expectedAlert: "Erro_003",
      named: "learning_platform.update_reference_photo_registration_failed",
      run: runRegistrationFailure
    },
    {
      expectedAlert: "Erro_004",
      named: "learning_platform.create_face_liveness_session_failed",
      run: runRegistrationFailure
    },
    {
      expectedAlert: "Erro_005",
      named: "learning_platform.read_reference_photo_failed",
      run: runFaceSessionFailure
    },
    {
      expectedAlert: "Erro_007",
      named: "learning_platform.read_face_liveness_result_failed",
      run: runFaceResultFailure
    }
  ];

  for (const { expectedAlert, named, run } of namedFailures) {
    const result = await run(named);
    const { alerts, ...effects } = result.snapshot;
    assert.equal(alerts.length, 1, named);
    assert.deepEqual(effects, expectedEffectsByRun.get(run), named);
    assertOnlyErrorCode(result.harness.alerts, expectedAlert);
    assertMachineValueHidden(result.harness, named);
  }

  const generic = await runLoginFailure("unrecognized_learning_platform_failure");
  for (const machineValue of [
    "learning_platform.append_feedback_failed",
    "client_intake.read_platform_data_failed"
  ]) {
    const isolated = await runLoginFailure(machineValue);
    assert.deepEqual(isolated.snapshot, generic.snapshot, machineValue);
    assertOnlyErrorCode(isolated.harness.alerts, "Erro_000");
    assertMachineValueHidden(isolated.harness, machineValue);
  }
});

test("[ERROR-02] malformed, denied-network, and local thrown failures keep their branches", async () => {
  const responseOrder = [];
  const malformed = createLearningPlatformHarness({
    routes: [{
      method: "POST",
      path: "/plataforma_v2/login-FaceID",
      response: {
        get ok() {
          responseOrder.push("ok");
          return true;
        },
        get status() {
          responseOrder.push("status");
          return 200;
        },
        async json() {
          responseOrder.push("json");
          throw new SyntaxError("Synthetic malformed JSON");
        }
      }
    }]
  });
  await installLoginApplication(malformed);
  submit(malformed.element("Formulário-Login"));
  await malformed.flush(20);
  assert.deepEqual(responseOrder, ["json"]);
  assertOnlyErrorCode(malformed.alerts, "Erro_000");
  assert.equal(malformed.element("Entrar").disabled, false);
  assertNoQuery(malformed);

  const deniedNetwork = createLearningPlatformHarness();
  await installLoginApplication(deniedNetwork);
  submit(deniedNetwork.element("Formulário-Login"));
  await deniedNetwork.flush(20);
  assertOnlyErrorCode(deniedNetwork.alerts, "Erro_000");
  assert.equal(deniedNetwork.guard.requests.length, 0);
  assert.equal(deniedNetwork.element("Entrar").disabled, false);
  deniedNetwork.hostGuard.assertUnused();

  const applicationThrown = createLearningPlatformHarness({
    faceStartImplementation: async () => {
      throw new Error("Synthetic application-local Face failure");
    },
    routes: [
      {
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: loginResponse({ Usuário_Foto_Cadastrada: "Sim" }) }
      },
      {
        method: "POST",
        path: "/plataforma_v2/FaceID",
        response: { data: faceSessionResponse() }
      }
    ]
  });
  await installLoginApplication(applicationThrown);
  submit(applicationThrown.element("Formulário-Login"));
  await applicationThrown.flush(30);
  assert.deepEqual(
    applicationThrown.guard.requests.map(({ method, path }) => ({ method, path })),
    [
      { method: "POST", path: "/plataforma_v2/login-FaceID" },
      { method: "POST", path: "/plataforma_v2/FaceID" }
    ]
  );
  assertOnlyErrorCode(applicationThrown.alerts, "Erro_006");
  assert.deepEqual(applicationThrown.consoleCalls, [{ level: "log", size: 1 }]);
  assert.equal(applicationThrown.element("Entrar").disabled, false);
  assert.equal(applicationThrown.sessionStorage.getItem("Usuário_Logado"), null);
  assert.equal(applicationThrown.navigation.length, 0);
  assertNoQuery(applicationThrown);
});

test("[API-02] a backend-retry-visible Face result delay remains one client GET with no polling", async () => {
  let resolveResult;
  const delayedResult = new Promise((resolve) => { resolveResult = resolve; });
  const harness = createLearningPlatformHarness({
    routes: [
      {
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: loginResponse({ Usuário_Foto_Cadastrada: "Sim" }) }
      },
      { method: "POST", path: "/plataforma_v2/FaceID", response: { data: faceSessionResponse() } },
      {
        handler: async () => delayedResult,
        method: "GET",
        path: FIXTURE_RESULT_PATH
      }
    ]
  });
  await installLoginApplication(harness);
  submit(harness.element("Formulário-Login"));
  await harness.flush(20);
  assert.equal(harness.guard.requests.filter(({ path }) => path.endsWith(":sessionId")).length, 1);
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.navigation.length, 0);

  resolveResult({ data: faceResultResponse() });
  await harness.flush(20);
  assert.equal(harness.guard.requests.filter(({ path }) => path.endsWith(":sessionId")).length, 1);
  assert.equal(harness.navigation.at(-1), PATHS.study);
});

test("[API-03] refresh carries the stored handle and keeps the separate client deadline", async () => {
  const deadline = "2000007200000";
  const harness = createLearningPlatformHarness({
    routes: [{
      expect: ({ jsonBody }) => ({
        handleExact: jsonBody?.IndexVerificado === FIXTURE_HANDLE
      }),
      method: "POST",
      path: "/plataforma_v2/refresh",
      response: { data: refreshData() }
    }],
    storage: {
      "Horário-Encerramento-Sessão": deadline,
      IndexVerificado: FIXTURE_HANDLE,
      Usuário_Logado: "Sim"
    }
  });
  await installStudyApplication(harness);
  harness.dispatchWindow("load");
  await harness.flush(20);

  assert.deepEqual(harness.guard.requests[0], {
    body: { IndexVerificado: "<redacted>" },
    formFields: undefined,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    path: "/plataforma_v2/refresh"
  });
  assertExpectationFlags(harness, { handleExact: true });
  assertNoQuery(harness);
  assert.equal(harness.sessionStorage.getItem("Horário-Encerramento-Sessão"), deadline);
  assert.equal(harness.sessionStorage.getItem("IndexVerificado") === FIXTURE_HANDLE, true);
  assert.equal(harness.element("Formação-Prazo-Acesso").textContent.endsWith("31/12/2099"), true);
});

async function runProgressUpdate(response) {
  const harness = createLearningPlatformHarness({
    routes: [{
      expect: ({ jsonBody }) => ({
        handleExact: jsonBody?.IndexVerificado === FIXTURE_HANDLE
      }),
      method: "POST",
      path: "/plataforma_v2/updates",
      response
    }]
  });
  const [progressModule, clientModule] = await Promise.all([
    harness.loadModule(MODULE_PATHS.studyProgress),
    harness.loadModule(MODULE_PATHS.platformClient)
  ]);
  const dependencies = harness.dependencies();
  const client = clientModule.createPlatformClient({
    baseUrl: FIXTURE_PLATFORM_BASE,
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor
  });
  const state = { completedTopics: 4, verifiedIndex: FIXTURE_HANDLE };
  const progress = progressModule.createStudyProgress({
    alert: dependencies.alert,
    client,
    document: dependencies.document,
    dom: { footer: harness.element("Faixa-Inferior") },
    navigation: { updateMetrics() {} },
    openTopic() {},
    state
  });
  const current = harness.element("synthetic-current-topic");
  current.dataIndex = 1;
  current.querySelector(".Símbolo-Check-Aberto");
  const next = harness.element("synthetic-next-topic");
  next.dataIndex = 2;
  next.querySelector(".Símbolo-Check-Fechado");
  harness.selectorResults.set('[data-index="2"]', next);
  progress.completeTopic(current);
  const optimisticValue = state.completedTopics;
  await harness.flush(20);
  const settledValue = state.completedTopics;
  harness.hostGuard.assertUnused();
  return { harness, optimisticValue, settledValue };
}

test("[API-03] progress update remains optimistic and rolls back only local count on failure", async () => {
  const success = await runProgressUpdate({ data: {} });
  assert.equal(success.optimisticValue, 5);
  assert.equal(success.settledValue, 5);
  assertExpectationFlags(success.harness, { handleExact: true });
  assertNoQuery(success.harness);
  assert.deepEqual(success.harness.guard.requests[0], {
    body: {
      IndexVerificado: "<redacted>",
      NotaTeste: "n/a",
      NúmeroMódulo: "n/a",
      NúmeroTópicosConcluídos: 5,
      TipoAtualização: "NúmeroTópicosConcluídos"
    },
    formFields: undefined,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    path: "/plataforma_v2/updates"
  });

  const unauthorized = await runProgressUpdate({ data: {}, status: 401 });
  assert.equal(unauthorized.optimisticValue, 5);
  assert.equal(unauthorized.settledValue, 4);
  assertExpectationFlags(unauthorized.harness, { handleExact: true });
  assertNoQuery(unauthorized.harness);
  assert.equal(
    unauthorized.harness.element("Faixa-Inferior").innerHTML.includes("Botão-Completar-e-Continuar"),
    true
  );
  assertOnlyErrorCode(unauthorized.harness.alerts, "Erro_000");
});

test("[ERROR-01] protected synthetic 401 responses remain generic Erro_000 outcomes", async () => {
  const faceStart = createLearningPlatformHarness({
    routes: [
      {
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: loginResponse({ Usuário_Foto_Cadastrada: "Sim" }) }
      },
      {
        expect: ({ jsonBody }) => ({
          handleExact: jsonBody?.IndexVerificado === FIXTURE_HANDLE
        }),
        method: "POST",
        path: "/plataforma_v2/FaceID",
        response: { data: {}, status: 401 }
      }
    ]
  });
  await installLoginApplication(faceStart);
  submit(faceStart.element("Formulário-Login"));
  await faceStart.flush(20);
  assertExpectationFlags(faceStart, { handleExact: true });
  assertNoQuery(faceStart);
  assertOnlyErrorCode(faceStart.alerts, "Erro_000");
  assert.equal(faceStart.sessionStorage.getItem("Usuário_Logado"), null);
  assert.equal(faceStart.navigation.includes(PATHS.login), false);

  const registration = createLearningPlatformHarness({
    routes: [{
      expect: ({ formData }) => ({
        handleExact: formData?.get("IndexVerificado") === FIXTURE_HANDLE
      }),
      method: "POST",
      path: "/plataforma_v2/CadastroFoto_e_FaceID",
      response: { data: {}, status: 401 }
    }],
    storage: {
      IndexVerificado: FIXTURE_HANDLE
    }
  });
  registration.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
  await installRegistrationApplication(registration);
  submit(registration.element("Formulário-Foto-Referência"));
  await registration.flush(20);
  assertExpectationFlags(registration, { handleExact: true });
  assertNoQuery(registration);
  assertOnlyErrorCode(registration.alerts, "Erro_000");
  assert.equal(registration.sessionStorage.getItem("Usuário_Logado"), null);
  assert.equal(registration.navigation.includes(PATHS.login), false);

  const refresh = createLearningPlatformHarness({
    routes: [{
      expect: ({ jsonBody }) => ({
        handleExact: jsonBody?.IndexVerificado === FIXTURE_HANDLE
      }),
      method: "POST",
      path: "/plataforma_v2/refresh",
      response: { data: {}, status: 401 }
    }],
    storage: {
      IndexVerificado: FIXTURE_HANDLE,
      Usuário_Logado: "Sim"
    }
  });
  await installStudyApplication(refresh);
  refresh.dispatchWindow("load");
  await refresh.flush(20);
  assertExpectationFlags(refresh, { handleExact: true });
  assertNoQuery(refresh);
  assertOnlyErrorCode(refresh.alerts, "Erro_000");
  assert.equal(refresh.sessionStorage.getItem("Usuário_Logado"), "Sim");
  assert.equal(refresh.navigation.includes(PATHS.login), false);
});

test("[FLOW-01] credential, first-access, notice, and Face branches preserve storage transitions", async () => {
  const scenarios = [
    {
      expectedPath: PATHS.study,
      expectedStorage: { Usuário_Logado: "Sim" },
      response: loginResponse({ Usuário_Status_FaceID: "Inativo" })
    },
    {
      expectedPath: PATHS.notices,
      expectedStorage: { Usuário_Autorização_Cadastro: "Sim" },
      response: loginResponse({ Usuário_Foto_Cadastrada: "Não" })
    }
  ];
  for (const scenario of scenarios) {
    const harness = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: scenario.response }
      }]
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(20);
    assert.equal(harness.navigation.at(-1), scenario.expectedPath);
    for (const [key, value] of Object.entries(scenario.expectedStorage)) {
      assert.equal(harness.sessionStorage.getItem(key), value);
    }
  }

  const notices = createLearningPlatformHarness({
    storage: { Usuário_Autorização_Cadastro: "Sim" }
  });
  await installInitialNoticesApplication(notices);
  notices.element("Palavra-Passe-Credenciais").value = "credenciais";
  notices.element("Palavra-Passe-Direitos").value = "direitos";
  notices.element("Palavra-Passe-Janela").value = "janela";
  submit(notices.element("Formulário"));
  assert.equal(notices.navigation.at(-1), PATHS.register);

  const wrongNotices = createLearningPlatformHarness({
    storage: { Usuário_Autorização_Cadastro: "Sim" }
  });
  await installInitialNoticesApplication(wrongNotices);
  wrongNotices.element("Palavra-Passe-Credenciais").value = " credenciais";
  wrongNotices.element("Palavra-Passe-Direitos").value = "direitos";
  wrongNotices.element("Palavra-Passe-Janela").value = "janela";
  submit(wrongNotices.element("Formulário"));
  assert.equal(wrongNotices.navigation.length, 0);
  assert.equal(wrongNotices.element("Alerta-Palavra-Passe-Credenciais").style.display, "block");

  for (const page of ["notices", "register"]) {
    const unauthorized = createLearningPlatformHarness({
      storage: { Usuário_Autorização_Cadastro: "Não" }
    });
    await installEntryApplication(unauthorized, page);
    unauthorized.dispatchWindow("load");
    assert.equal(unauthorized.navigation.at(-1), PATHS.login);
  }
});

test("[FLOW-01] registration clears authorization before local Face resolution", async () => {
  let resolveFace;
  const pendingFace = new Promise((resolve) => {
    resolveFace = resolve;
  });
  const harness = createLearningPlatformHarness({
    faceStartImplementation: () => pendingFace,
    routes: [
      {
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID",
        response: { data: faceSessionResponse() }
      },
      {
        method: "GET",
        path: FIXTURE_RESULT_PATH,
        response: { data: faceResultResponse() }
      }
    ],
    storage: {
      IndexVerificado: opaqueValue("row-handle"),
      Usuário_Autorização_Cadastro: "Sim"
    }
  });
  harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
  await installRegistrationApplication(harness);
  submit(harness.element("Formulário-Foto-Referência"));
  await harness.flush(20);

  assert.deepEqual(
    harness.timeline.filter(({ type }) => [
      "storage-get", "fetch", "storage-set", "append", "face-start"
    ].includes(type)),
    [
      { key: "IndexVerificado", type: "storage-get" },
      { method: "POST", path: "/plataforma_v2/CadastroFoto_e_FaceID", type: "fetch" },
      { key: "Usuário_Autorização_Cadastro", type: "storage-set" },
      { tagName: "AZURE-AI-VISION-FACE-UI", type: "append" },
      { tokenPresent: true, type: "face-start" }
    ]
  );
  assert.equal(harness.sessionStorage.getItem("Usuário_Autorização_Cadastro"), "Não");
  assert.equal(harness.guard.requests.length, 1);
  assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), null);

  resolveFace({});
  await harness.flush(20);
  assert.equal(harness.guard.requests.length, 2);
  assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Sim");
  assert.equal(harness.navigation.at(-1), PATHS.study);
});
