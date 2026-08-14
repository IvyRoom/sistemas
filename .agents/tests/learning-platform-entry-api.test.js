"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const vm = require("node:vm");

const {
  FIXTURE_ORIGIN,
  NetworkGuardError,
  createLearningPlatformHarness,
  readPlatformScript
} = require("./helpers/learning-platform-harness.js");

const SCRIPT_PATHS = {
  browser: "apps/learning-platform/aviso-navegador/main.js",
  device: "apps/learning-platform/aviso-dispositivo/main.js",
  login: "apps/learning-platform/login/main.js",
  notices: "apps/learning-platform/avisos-iniciais/main.js",
  register: "apps/learning-platform/cadastro/main.js",
  report: "apps/learning-platform/statusreport/main.js",
  study: "apps/learning-platform/estudo/main.js"
};

const PATHS = {
  browser: "/plataforma/aviso-navegador",
  device: "/plataforma/aviso-dispositivo",
  login: "/plataforma/login",
  notices: "/plataforma/avisos-iniciais",
  register: "/plataforma/cadastro",
  study: "/plataforma/estudo"
};

function opaqueValue(kind) {
  return ["synthetic", kind, "value"].join(":");
}

const FIXTURE_FACE_SESSION = opaqueValue("face-session");
const FIXTURE_FACE_TOKEN = opaqueValue("face-token");
const FIXTURE_HANDLE = opaqueValue("row-handle");
const FIXTURE_RESULT_PATH = `/plataforma_v2/FaceID_resultado/${FIXTURE_FACE_SESSION}`;

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

test("[ROUTE-03] exact slashless destinations and direct-history ambiguity remain fixed", () => {
  const sources = Object.fromEntries(
    Object.entries(SCRIPT_PATHS).map(([name, relativePath]) => [name, readPlatformScript(relativePath)])
  );
  const expectedWriters = {
    login: [PATHS.device, PATHS.browser, PATHS.study, PATHS.notices],
    notices: [PATHS.device, PATHS.browser, PATHS.login, PATHS.register],
    register: [PATHS.device, PATHS.browser, PATHS.login, PATHS.study],
    study: [PATHS.browser, PATHS.login, PATHS.device],
    report: [PATHS.device]
  };

  for (const [page, destinations] of Object.entries(expectedWriters)) {
    for (const destination of destinations) {
      assert.equal(
        sources[page].includes(`window.location.href = '${destination}'`) ||
          sources[page].includes(`window.location.href = "${destination}"`),
        true,
        `${page} must retain ${destination}`
      );
    }
  }

  const combined = Object.values(sources).join("\n");
  for (const absentRouterSeam of [
    "location.replace(",
    "history.pushState(",
    "history.replaceState(",
    "popstate"
  ]) {
    assert.equal(combined.includes(absentRouterSeam), false, absentRouterSeam);
  }

  const warning = createLearningPlatformHarness({ innerWidth: 1025 });
  warning.loadScript(SCRIPT_PATHS.device);
  assert.equal(warning.sessionStorage.getItem("Origem_Aviso_Dispositivo"), "Sim");
  warning.dispatchWindow("resize");
  assert.equal(warning.history.backCalls, 1);
  assert.equal(warning.navigation.length, 0);

  const login = createLearningPlatformHarness({
    storage: {
      Origem_Aviso_Dispositivo: "Não",
      Usuário_Autorização_Cadastro: "Sim",
      Usuário_Logado: "Não"
    }
  });
  login.loadScript(SCRIPT_PATHS.login);
  login.dispatchWindow("load");
  assert.equal(login.history.backCalls, 1);
  assert.equal(login.navigation.length, 0);
  assert.equal(login.sessionStorage.getItem("Origem_Aviso_Dispositivo"), "Não");
});

test("[GATE-01] Edge signals gate four entries while report remains ungated", async () => {
  const guardedPages = ["login", "notices", "register", "study"];
  for (const page of guardedPages) {
    const rejected = createLearningPlatformHarness({
      storage: { Usuário_Autorização_Cadastro: "Sim", Usuário_Logado: "Sim" },
      userAgent: "FixtureBrowser",
      userAgentData: { brands: [{ brand: "Not Edge" }] }
    });
    rejected.loadScript(SCRIPT_PATHS[page]);
    await Promise.all(rejected.dispatchWindow("load"));
    assert.deepEqual(rejected.navigation, [PATHS.browser], page);

    const modernSignal = createLearningPlatformHarness({
      storage: { Usuário_Autorização_Cadastro: "Sim", Usuário_Logado: "Não" },
      userAgent: "FixtureBrowser"
    });
    modernSignal.loadScript(SCRIPT_PATHS[page]);
    await Promise.all(modernSignal.dispatchWindow("load"));
    assert.equal(modernSignal.navigation.includes(PATHS.browser), false, page);

    const legacySignal = createLearningPlatformHarness({
      storage: { Usuário_Autorização_Cadastro: "Sim", Usuário_Logado: "Não" },
      userAgent: "FixtureBrowser Edg/fixture",
      userAgentData: { brands: [{ brand: "Not Edge" }] }
    });
    legacySignal.loadScript(SCRIPT_PATHS[page]);
    await Promise.all(legacySignal.dispatchWindow("load"));
    assert.equal(legacySignal.navigation.includes(PATHS.browser), false, page);

    const absentModernSignal = createLearningPlatformHarness({
      storage: { Usuário_Autorização_Cadastro: "Sim", Usuário_Logado: "Não" },
      userAgent: "FixtureBrowser Edg/fixture"
    });
    delete absentModernSignal.window.navigator.userAgentData;
    absentModernSignal.loadScript(SCRIPT_PATHS[page]);
    await Promise.all(absentModernSignal.dispatchWindow("load"));
    assert.equal(absentModernSignal.navigation.includes(PATHS.browser), false, page);
  }

  const reportSource = readPlatformScript(SCRIPT_PATHS.report);
  assert.equal(/userAgent(?:Data)?/.test(reportSource), false);
});

test("[GATE-01] browser-warning diagnostic preserves missing-userAgentData failure", () => {
  const diagnostic = createLearningPlatformHarness();
  delete diagnostic.window.navigator.userAgentData;
  assert.throws(
    () => diagnostic.loadScript(SCRIPT_PATHS.browser),
    (error) => error && error.name === "TypeError"
  );
});

test("[GATE-02] login, notices, and registration keep inclusive width boundary and listener order", () => {
  const pages = ["login", "notices", "register"];
  for (const page of pages) {
    for (const width of [1023, 1024, 1025]) {
      const harness = createLearningPlatformHarness({
        innerWidth: width,
        storage: {
          Origem_Aviso_Dispositivo: "Sim",
          Usuário_Autorização_Cadastro: "Sim",
          Usuário_Logado: "Não"
        }
      });
      harness.loadScript(SCRIPT_PATHS[page]);
      assert.deepEqual(
        harness.timeline
          .filter(({ type }) => type === "window-listener")
          .map(({ event }) => event),
        ["resize", "load"],
        `${page}:${width}`
      );
      assert.equal((harness.windowListeners.get("resize") ?? []).length, 1, `${page}:${width}`);
      assert.equal((harness.windowListeners.get("load") ?? []).length, 1, `${page}:${width}`);
      harness.dispatchWindow("load");
      assert.equal(
        harness.navigation.filter((path) => path === PATHS.device).length,
        width <= 1024 ? 1 : 0,
        `${page}:${width}:load`
      );
      harness.dispatchWindow("resize");
      assert.equal(
        harness.navigation.filter((path) => path === PATHS.device).length,
        width <= 1024 ? 2 : 0,
        `${page}:${width}:resize`
      );
    }
  }
});

test("[GATE-02] study installs resize after gates and refreshes after its immediate width decision", async () => {
  for (const width of [1023, 1024, 1025]) {
    const harness = createLearningPlatformHarness({
      innerWidth: width,
      routes: [{
        method: "POST",
        path: "/plataforma_v2/refresh",
        response: { data: {}, status: 401 }
      }],
      storage: {
        IndexVerificado: opaqueValue("row-handle"),
        URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2",
        Usuário_Logado: "Sim"
      }
    });
    harness.loadScript(SCRIPT_PATHS.study, { rewriteBackend: false });
    assert.equal((harness.windowListeners.get("resize") ?? []).length, 0);
    harness.dispatchWindow("load");
    await harness.flush();

    assert.equal((harness.windowListeners.get("resize") ?? []).length, 1);
    assert.equal(harness.navigation.includes(PATHS.device), width <= 1024, String(width));
    assert.equal(harness.guard.requests.length, 1);
    const relevant = harness.timeline.filter((entry) =>
      entry.type === "navigate" ||
      (entry.type === "window-listener" && entry.event === "resize") ||
      entry.type === "fetch"
    );
    if (width <= 1024) {
      assert.deepEqual(relevant.map((entry) => entry.type), [
        "navigate",
        "window-listener",
        "fetch"
      ]);
    } else {
      assert.deepEqual(relevant.map((entry) => entry.type), ["window-listener", "fetch"]);
    }
    harness.dispatchWindow("resize");
    assert.equal(
      harness.navigation.filter((path) => path === PATHS.device).length,
      width <= 1024 ? 2 : 0,
      String(width)
    );
  }
});

test("[GATE-02] device warning goes back only when resize becomes wider than 1024", () => {
  const harness = createLearningPlatformHarness({ innerWidth: 1023 });
  harness.loadScript(SCRIPT_PATHS.device);
  harness.dispatchWindow("resize");
  assert.equal(harness.history.backCalls, 0);
  harness.window.innerWidth = 1024;
  harness.dispatchWindow("resize");
  assert.equal(harness.history.backCalls, 0);
  harness.window.innerWidth = 1025;
  harness.dispatchWindow("resize");
  assert.equal(harness.history.backCalls, 1);
});

test("[GATE-02] status report checks width before installing its resize listener", async () => {
  for (const width of [1023, 1024, 1025]) {
    const harness = createLearningPlatformHarness({
      innerWidth: width,
      routes: [{
        method: "POST",
        path: "/plataforma_v2/statusreport",
        response: { data: { Dados_Extraídos_BD_Plataforma: [] } }
      }]
    });
    harness.window.location.search =
      "?ne=Invented&nt=1&li=0&lf=0&dua=01012035&idsr=1&mi=1&mf=1&mrm=individual";
    harness.selectorResults.set(
      ".Gráficos_Controle_Resultados",
      Array.from({ length: 12 }, (_, index) => harness.element(`fixture-report-graph-${index}`))
    );
    const reportSource = readPlatformScript(SCRIPT_PATHS.report).replace(
      /const URL_Base_Backend = "[^"]+";/,
      `const URL_Base_Backend = "${FIXTURE_ORIGIN}/plataforma_v2";`
    );
    vm.runInContext(reportSource, harness.context, { filename: SCRIPT_PATHS.report });
    await harness.window.onload();
    await harness.flush(10);

    assert.equal(harness.navigation.includes(PATHS.device), width <= 1024, String(width));
    assert.equal((harness.windowListeners.get("resize") ?? []).length, width > 1024 ? 1 : 0);
    assert.equal(harness.guard.requests.length, width > 1024 ? 1 : 0);
    if (width > 1024) {
      for (const resizeWidth of [1023, 1024, 1025]) {
        const priorWarnings = harness.navigation.filter((path) => path === PATHS.device).length;
        harness.window.innerWidth = resizeWidth;
        harness.dispatchWindow("resize");
        assert.equal(
          harness.navigation.filter((path) => path === PATHS.device).length,
          priorWarnings + (resizeWidth <= 1024 ? 1 : 0),
          String(resizeWidth)
        );
      }
    } else {
      const priorWarnings = harness.navigation.filter((path) => path === PATHS.device).length;
      harness.window.innerWidth = 1025;
      harness.dispatchWindow("resize");
      assert.equal(
        harness.navigation.filter((path) => path === PATHS.device).length,
        priorWarnings
      );
    }
  }
});

test("[STORE-01] exact eight key spellings, readers, writers, and value conventions remain represented", () => {
  const sourcesByPage = Object.fromEntries(
    Object.entries(SCRIPT_PATHS).map(([page, scriptPath]) => [page, readPlatformScript(scriptPath)])
  );
  const sources = Object.values(sourcesByPage);
  const keyCalls = [];
  const pattern = /sessionStorage\.(getItem|setItem)\(\s*['"]([^'"]+)['"]/g;
  for (const source of sources) {
    for (const match of source.matchAll(pattern)) {
      keyCalls.push({ key: match[2], method: match[1] });
    }
  }

  const inventory = [...new Set(keyCalls.map(({ key }) => key))].sort();
  assert.deepEqual(inventory, [
    "Horário-Encerramento-Sessão",
    "IndexVerificado",
    "Origem_Aviso_Dispositivo",
    "TempoSessão_Segundos",
    "URL_Base_Backend",
    "Usuário_Autorização_Cadastro",
    "Usuário_Foto_Cadastrada",
    "Usuário_Logado"
  ].sort());

  assert.deepEqual(
    [...new Set(keyCalls.filter(({ key }) => key === "TempoSessão_Segundos").map(({ method }) => method))],
    ["getItem"]
  );
  const combined = sources.join("\n");
  assert.equal(/sessionStorage\.(?:removeItem|clear)\s*\(/.test(combined), false);
  assert.equal(combined.includes("Date.now() + (14400 * 1000)"), true);
  for (const value of ["Sim", "Não"]) assert.equal(combined.includes(`'${value}'`), true);

  const expectedReaders = {
    "Horário-Encerramento-Sessão": ["study"],
    IndexVerificado: ["register", "study"],
    Origem_Aviso_Dispositivo: ["login"],
    TempoSessão_Segundos: ["study"],
    URL_Base_Backend: ["login", "register", "study"],
    Usuário_Autorização_Cadastro: ["login", "notices", "register"],
    Usuário_Foto_Cadastrada: [],
    Usuário_Logado: ["login", "study"]
  };
  const expectedWriters = {
    "Horário-Encerramento-Sessão": ["login"],
    IndexVerificado: ["login"],
    Origem_Aviso_Dispositivo: ["device", "login", "notices", "register", "study"],
    TempoSessão_Segundos: [],
    URL_Base_Backend: ["login"],
    Usuário_Autorização_Cadastro: ["login", "register"],
    Usuário_Foto_Cadastrada: ["login"],
    Usuário_Logado: ["login", "register", "study"]
  };
  for (const [key, pages] of Object.entries(expectedReaders)) {
    assert.deepEqual(
      Object.entries(sourcesByPage)
        .filter(([, source]) => source.includes(`getItem('${key}')`))
        .map(([page]) => page)
        .sort(),
      [...pages].sort(),
      `Readers must remain exact for ${key}`
    );
  }
  for (const [key, pages] of Object.entries(expectedWriters)) {
    assert.deepEqual(
      Object.entries(sourcesByPage)
        .filter(([, source]) => source.includes(`setItem('${key}'`))
        .map(([page]) => page)
        .sort(),
      [...pages].sort(),
      `Writers must remain exact for ${key}`
    );
  }
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
      URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2",
      Usuário_Autorização_Cadastro: "Não",
      Usuário_Foto_Cadastrada: "Sim",
      Usuário_Logado: "Sim"
    }
  });
  harness.loadScript(SCRIPT_PATHS.study, { rewriteBackend: false });
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
  const snapshot = harness.sessionStorage.snapshot({ redact: ["IndexVerificado", "URL_Base_Backend"] });
  assert.deepEqual(snapshot, {
    "Horário-Encerramento-Sessão": storedDeadline,
    IndexVerificado: "<redacted>",
    Origem_Aviso_Dispositivo: "Não",
    TempoSessão_Segundos: "legacy-observation",
    URL_Base_Backend: "<redacted>",
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
  active.loadScript(SCRIPT_PATHS.login);
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
  inactive.loadScript(SCRIPT_PATHS.login);
  submit(inactive.element("Formulário-Login"));
  await inactive.flush(20);
  assert.equal(inactive.sessionStorage.getItem("IndexVerificado"), "undefined");
  assert.equal(inactive.element("Aviso-Login-Expirado").style.display, "block");
  assert.equal(
    inactive.element("Aviso-Login-Expirado").innerHTML.endsWith("01/01/2000"),
    true
  );
});

test("[API-01] login preserves invalid-credential, workbook, generic, and unexpected waiting branches", async () => {
  const failures = [
    { data: {}, expectedAlert: null, expectedInline: true, status: 401 },
    { data: { error: "Erro_001" }, expectedAlert: "Erro_001", status: 500 },
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
    harness.loadScript(SCRIPT_PATHS.login);
    submit(harness.element("Formulário-Login"));
    await harness.flush(20);
    if (fixture.expectedInline) {
      assert.equal(harness.alerts.length, 0);
      assert.equal(harness.element("Aviso-Email-ou-Senha-Inválidos").style.display, "block");
    } else {
      assertOnlyErrorCode(harness.alerts, fixture.expectedAlert);
    }
    assert.equal(harness.element("Entrar").disabled, false);
  }

  const networkFailure = createLearningPlatformHarness({
    routes: [{
      handler: async () => { throw new Error("Synthetic fixture failure"); },
      method: "POST",
      path: "/plataforma_v2/login-FaceID"
    }]
  });
  networkFailure.loadScript(SCRIPT_PATHS.login);
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
  unexpected.loadScript(SCRIPT_PATHS.login);
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
      URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2",
      Usuário_Autorização_Cadastro: "Sim"
    }
  });
  success.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
  success.loadScript(SCRIPT_PATHS.register, { rewriteBackend: false });
  submit(success.element("Formulário-Foto-Referência"));
  await success.flush(30);

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

  for (const code of ["Erro_002", "Erro_003", "Erro_004"]) {
    const failure = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID",
        response: { data: { error: code }, status: 500 }
      }],
      storage: {
        IndexVerificado: opaqueValue("row-handle"),
        URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2",
        Usuário_Autorização_Cadastro: "Sim"
      }
    });
    failure.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
    failure.loadScript(SCRIPT_PATHS.register, { rewriteBackend: false });
    submit(failure.element("Formulário-Foto-Referência"));
    await failure.flush(20);
    assertOnlyErrorCode(failure.alerts, code);
    assert.equal(failure.element("Botão-Cadastrar-Foto-Referência").disabled, false);
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
      resultResponse: { data: { error: "Erro_007" }, status: 500 }
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
        URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2",
        Usuário_Autorização_Cadastro: "Sim"
      }
    });
    harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
    harness.loadScript(SCRIPT_PATHS.register, { rewriteBackend: false });
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
        URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2",
        Usuário_Autorização_Cadastro: "Sim"
      }
    });
    harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
    harness.loadScript(SCRIPT_PATHS.register, { rewriteBackend: false });
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
  harness.loadScript(SCRIPT_PATHS.login);
  submit(harness.element("Formulário-Login"));
  await harness.flush(30);

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
            ? { data: { error: "Erro_007" }, status: 500 }
            : { data: scenario.faceResult ?? faceResultResponse() }
        }
      ]
    });
    harness.loadScript(SCRIPT_PATHS.login);
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
      assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), null);
    } else {
      assertOnlyErrorCode(harness.alerts, scenario.expectedAlert);
    }
  }
});

test("[API-02] Face start and result retain exact specific and generic mappings", async () => {
  for (const code of ["Erro_004", "Erro_005"]) {
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
          response: { data: { error: code }, status: 500 }
        }
      ]
    });
    harness.loadScript(SCRIPT_PATHS.login);
    submit(harness.element("Formulário-Login"));
    await harness.flush(20);
    assertOnlyErrorCode(harness.alerts, code);
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
  result401.loadScript(SCRIPT_PATHS.login);
  submit(result401.element("Formulário-Login"));
  await result401.flush(30);
  assertOnlyErrorCode(result401.alerts, "Erro_000");
  assertNoQuery(result401);
  assert.equal(
    result401.guard.requests.filter(({ path }) => path.endsWith(":sessionId")).length,
    1
  );
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
  harness.loadScript(SCRIPT_PATHS.login);
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
      URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2",
      Usuário_Logado: "Sim"
    }
  });
  harness.loadScript(SCRIPT_PATHS.study, { rewriteBackend: false });
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
    }],
    storage: { URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2" }
  });
  harness.loadScript(SCRIPT_PATHS.study, { rewriteBackend: false });
  const current = harness.element("synthetic-current-topic");
  current.dataIndex = 1;
  current.querySelector(".Símbolo-Check-Aberto");
  const next = harness.element("synthetic-next-topic");
  next.dataIndex = 2;
  next.querySelector(".Símbolo-Check-Fechado");
  harness.selectorResults.set('[data-index="2"]', next);
  vm.runInContext(
    `IndexVerificado = ${JSON.stringify(FIXTURE_HANDLE)};\n` +
      "Usuário_Formação_NúmeroTópicosConcluídos = 4;\n" +
      "AtualizaMétricasAvançoFormação = function() {};\n" +
      "AbreTópico = function() {};",
    harness.context
  );
  harness.context.__currentTopic = current;
  vm.runInContext("Completar_e_Continuar_Tópico(__currentTopic)", harness.context);
  const optimisticValue = vm.runInContext(
    "Usuário_Formação_NúmeroTópicosConcluídos",
    harness.context
  );
  await harness.flush(20);
  const settledValue = vm.runInContext(
    "Usuário_Formação_NúmeroTópicosConcluídos",
    harness.context
  );
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
  faceStart.loadScript(SCRIPT_PATHS.login);
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
      IndexVerificado: FIXTURE_HANDLE,
      URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2"
    }
  });
  registration.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
  registration.loadScript(SCRIPT_PATHS.register, { rewriteBackend: false });
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
      URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2",
      Usuário_Logado: "Sim"
    }
  });
  refresh.loadScript(SCRIPT_PATHS.study, { rewriteBackend: false });
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
    harness.loadScript(SCRIPT_PATHS.login);
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
  notices.loadScript(SCRIPT_PATHS.notices);
  notices.element("Palavra-Passe-Credenciais").value = "credenciais";
  notices.element("Palavra-Passe-Direitos").value = "direitos";
  notices.element("Palavra-Passe-Janela").value = "janela";
  submit(notices.element("Formulário"));
  assert.equal(notices.navigation.at(-1), PATHS.register);

  const wrongNotices = createLearningPlatformHarness({
    storage: { Usuário_Autorização_Cadastro: "Sim" }
  });
  wrongNotices.loadScript(SCRIPT_PATHS.notices);
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
    unauthorized.loadScript(SCRIPT_PATHS[page]);
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
      URL_Base_Backend: FIXTURE_ORIGIN + "/plataforma_v2",
      Usuário_Autorização_Cadastro: "Sim"
    }
  });
  harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.jpg" }];
  harness.loadScript(SCRIPT_PATHS.register, { rewriteBackend: false });
  submit(harness.element("Formulário-Foto-Referência"));
  await harness.flush(20);

  assert.equal(harness.sessionStorage.getItem("Usuário_Autorização_Cadastro"), "Não");
  assert.equal(harness.guard.requests.length, 1);
  assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), null);

  resolveFace({});
  await harness.flush(20);
  assert.equal(harness.guard.requests.length, 2);
  assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Sim");
  assert.equal(harness.navigation.at(-1), PATHS.study);
});
