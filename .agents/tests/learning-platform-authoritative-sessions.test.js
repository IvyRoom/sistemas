"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  FIXTURE_ORIGIN,
  createLearningPlatformHarness
} = require("./helpers/learning-platform-harness.js");

const MODULE_PATHS = Object.freeze({
  feedback: "apps/learning-platform/modules/course-content/feedback.js",
  initialNotices: "apps/learning-platform/modules/initial-notices.js",
  login: "apps/learning-platform/modules/login.js",
  platformClient: "apps/learning-platform/modules/platform-client.js",
  progress: "apps/learning-platform/modules/course-content/progress.js",
  register: "apps/learning-platform/modules/photo-registration.js",
  session: "apps/learning-platform/modules/session.js",
  study: "apps/learning-platform/modules/course-content/application.js",
  studyDom: "apps/learning-platform/modules/course-content/dom.js"
});

const FIXTURE_PLATFORM_BASE = FIXTURE_ORIGIN + "/plataforma_v2";
const SESSION_HEADER = "X-Machado-Session-Request";
const CANONICAL_INSTANTS = Object.freeze({
  eligibility: "2035-01-01T00:04:00.000Z",
  expiry: "2035-01-01T04:00:00.000Z",
  server: "2035-01-01T00:00:00.000Z"
});

function sessionStatus(authenticationPhase, allowedNextOperations, overrides = {}) {
  return {
    allowedNextOperations,
    authenticationPhase,
    eligibilityRevalidateAt: CANONICAL_INSTANTS.eligibility,
    expiresAt: CANONICAL_INSTANTS.expiry,
    serverTime: CANONICAL_INSTANTS.server,
    ...overrides
  };
}

function assertNoManualAuthorityHeaders(request) {
  const headerNames = Object.keys(request.headers).map((name) => name.toLowerCase());
  assert.equal(headerNames.includes("cookie"), false);
  assert.equal(headerNames.includes("origin"), false);
  assert.equal(headerNames.includes("authorization"), false);
}

function assertTargetRequestOptions(request) {
  assert.equal(request.cache, "no-store");
  assert.equal(request.credentials, "include");
  assert.equal(request.mode, "cors");
  assert.equal(request.redirect, "error");
  assert.equal(request.referrerPolicy, "no-referrer");
  assert.equal(request.headers[SESSION_HEADER], "1");
  assertNoManualAuthorityHeaders(request);
}

function createIsolatedLogoutPresentation() {
  let closed = false;
  let listener;
  let published = false;
  return {
    close() {
      closed = true;
      listener = undefined;
    },
    listen(nextListener) {
      if (closed) return false;
      listener ??= nextListener;
      return true;
    },
    publish() {
      if (closed) return false;
      published = true;
      return true;
    },
    snapshot() {
      return {
        available: !closed,
        closed,
        failed: false,
        published,
        received: false
      };
    }
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function createBroadcastChannelHub({ failCreate = false, failPost = false } = {}) {
  const channels = [];
  const messages = [];

  function deliver(data, sender) {
    for (const channel of channels) {
      if (channel === sender || channel.closed) continue;
      for (const listener of channel.listeners) {
        listener({ data: structuredClone(data) });
      }
    }
  }

  function createChannel(name) {
    if (failCreate) throw new Error("Invented BroadcastChannel creation failure");
    const channel = {
      closed: false,
      listeners: new Set(),
      name,
      addEventListener(type, listener) {
        if (type !== "message" || this.closed) {
          throw new Error("Invented BroadcastChannel listener failure");
        }
        this.listeners.add(listener);
      },
      close() {
        this.closed = true;
        this.listeners.clear();
      },
      postMessage(message) {
        if (this.closed || failPost) {
          throw new Error("Invented BroadcastChannel publish failure");
        }
        const cloned = structuredClone(message);
        messages.push(cloned);
        deliver(cloned, this);
      },
      removeEventListener(type, listener) {
        if (type === "message") this.listeners.delete(listener);
      }
    };
    channels.push(channel);
    return channel;
  }

  return {
    channels,
    createChannel,
    inject(message) {
      deliver(message);
    },
    messages
  };
}

async function createBroadcastPresentation(harness, hub) {
  const sessionModule = await harness.loadModule(MODULE_PATHS.session);
  return sessionModule.createLogoutPresentationChannel({
    createChannel: hub.createChannel
  });
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
    logoutPresentation: createIsolatedLogoutPresentation(),
    ...overrides
  };
}

async function installLoginApplication(harness, overrides = {}) {
  const { createLoginApplication } = await harness.loadModule(MODULE_PATHS.login);
  createLoginApplication(moduleDependencies(harness, {
    authoritativeSessions: true,
    backendBase: FIXTURE_PLATFORM_BASE,
    ...overrides
  }));
  harness.hostGuard.assertUnused();
}

async function installRegistrationApplication(harness, overrides = {}) {
  const { createRegistrationApplication } = await harness.loadModule(MODULE_PATHS.register);
  createRegistrationApplication(moduleDependencies(harness, {
    authoritativeSessions: true,
    backendBase: FIXTURE_PLATFORM_BASE,
    ...overrides
  }));
  harness.hostGuard.assertUnused();
}

async function installInitialNoticesApplication(harness, overrides = {}) {
  const [applicationModule, sessionModule] = await Promise.all([
    harness.loadModule(MODULE_PATHS.initialNotices),
    harness.loadModule(MODULE_PATHS.session)
  ]);
  const dependencies = harness.dependencies();
  applicationModule.createInitialNoticesApplication({
    ...dependencies,
    authoritativeSessions: true,
    requiredAcknowledgements: {
      credentials: "credenciais",
      rights: "direitos",
      window: "janela"
    },
    logoutPresentation: createIsolatedLogoutPresentation(),
    session: sessionModule.createSessionStore(dependencies.sessionStorage),
    ...overrides
  }).install();
  harness.hostGuard.assertUnused();
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

function installStudyDomFixtures(harness) {
  const arrows = Array.from({ length: 10 }, (_, index) =>
    harness.element(`authoritative-arrow-${index}`)
  );
  const moduleHeaders = Array.from({ length: 10 }, (_, index) =>
    harness.element(`authoritative-module-header-${index}`)
  );
  const moduleTopicContainers = Array.from({ length: 10 }, (_, index) =>
    harness.element(`authoritative-module-topics-${index}`)
  );
  const questionContainers = Array.from({ length: 10 }, (_, index) =>
    harness.element(`authoritative-question-container-${index}`)
  );
  harness.selectorResults.set("[id^='Seta-Auxiliar-Módulo-']", arrows);
  harness.selectorResults.set("[id^='Container-Externo-Tópicos-Módulo-']", moduleTopicContainers);
  harness.selectorResults.set("[id^='Container-Questões-Módulo-']", questionContainers);
  harness.selectorResults.set("[id^='Container-Módulo-']", moduleHeaders);
  harness.element("Container-Externo-Conteúdo").scrollTo = () => {};
  harness.element("Container-Externo-Testes").scrollTo = () => {};
  harness.element("Container-Externo-Feedbacks").scrollTo = () => {};

  const moduleEnds = [13, 30, 51, 71, 90, 100, 114, 138, 157, 171];
  const topics = Array.from({ length: 171 }, (_, offset) => {
    const dataIndex = offset + 1;
    const module = moduleEnds.findIndex((end) => dataIndex <= end) + 1;
    const topic = harness.element(`authoritative-topic-${dataIndex}`);
    const topicName = harness.element(`authoritative-topic-name-${dataIndex}`);
    topic.className = "Container-Tópico-Fechado";
    topic.disabled = true;
    topic.dataIndex = dataIndex;
    topic.setAttribute("name", `${module}. CONTEÚDO INVENTADO`);
    topic.parentElement = { id: `Container-Externo-Tópicos-Módulo-${module}` };
    topicName.innerHTML = `${dataIndex}. Conteúdo inventado - 00:01`;
    topic.setSelectorResult(".Tópico-Nome", topicName);
    const addTopicListener = topic.addEventListener.bind(topic);
    topic.addEventListener = (type, listener) => {
      addTopicListener(type, (event) => listener.call(topic, event));
    };
    harness.selectorResults.set(`[data-index="${dataIndex}"]`, topic);
    return topic;
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

async function installStudyApplication(harness, overrides = {}) {
  const topics = installStudyDomFixtures(harness);
  const [applicationModule, clientModule, domModule, sessionModule] = await Promise.all([
    harness.loadModule(MODULE_PATHS.study),
    harness.loadModule(MODULE_PATHS.platformClient),
    harness.loadModule(MODULE_PATHS.studyDom),
    harness.loadModule(MODULE_PATHS.session)
  ]);
  const dependencies = harness.dependencies();
  const session = sessionModule.createSessionStore(dependencies.sessionStorage);
  const client = clientModule.createPlatformClient({
    baseUrl: FIXTURE_PLATFORM_BASE,
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor,
    sessionRequest: true
  });
  const dom = domModule.createStudyDom(dependencies.document);
  let monotonicTime = 50_000;
  const controller = applicationModule.createStudyApplication({
    alert: dependencies.alert,
    authoritativeSessionsEnabled: true,
    client,
    clock: {
      createDate: (...argumentsList) => new dependencies.Date(...argumentsList),
      monotonicNow: () => monotonicTime,
      now: dependencies.now
    },
    configureDownloads() {},
    document: dependencies.document,
    dom,
    async loadMedia() {},
    logoutPresentation: createIsolatedLogoutPresentation(),
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
  return {
    advanceMonotonic(milliseconds) {
      monotonicTime += milliseconds;
      return monotonicTime;
    },
    controller,
    dom,
    topics
  };
}

function submit(element) {
  return element.dispatch("submit", { preventDefault() {} });
}

function storageTimeline(harness) {
  return harness.timeline.filter(({ type }) => type.startsWith("storage-"));
}

function assertOnlyTargetRequests(harness) {
  assert.ok(harness.guard.requests.length > 0);
  harness.guard.requests.forEach(assertTargetRequestOptions);
  assert.equal(
    harness.guard.requestMetadata.every(
      ({ hasQuery, queryKeys }) => hasQuery === false && queryKeys.length === 0
    ),
    true
  );
  harness.hostGuard.assertUnused();
}

function refreshData(overrides = {}) {
  const data = {
    Usuário_Email: "invented@example.test",
    Usuário_Formação_CertificadoID: "INVENTED-CERTIFICATE",
    Usuário_Formação_NotaAcumulado: 0.8,
    Usuário_Formação_NúmeroTópicosConcluídos: "0",
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

test("[SESSION-ADOPT-01] release latch stays false under hostile browser-controlled inputs", async () => {
  const harness = createLearningPlatformHarness({
    hash: "#authoritative-sessions=enabled",
    search: "?authoritativeSessions=1&sessionRequest=1",
    storage: {
      "Horário-Encerramento-Sessão": "9999999999999",
      IndexVerificado: "invented-legacy-presentation-value",
      Origem_Aviso_Dispositivo: "Sim",
      TempoSessão_Segundos: "999999",
      Usuário_Autorização_Cadastro: "Sim",
      Usuário_Foto_Cadastrada: "Sim",
      Usuário_Logado: "Sim",
      authoritativeSessions: "true"
    }
  });
  Object.defineProperty(harness.document, "cookie", {
    configurable: true,
    value: "authoritative_sessions=enabled"
  });
  harness.window.authoritativeSessions = true;
  harness.window.sessionRequest = true;

  const sessionModule = await harness.loadModule(MODULE_PATHS.session);

  assert.equal(sessionModule.AUTHORITATIVE_SESSIONS_ENABLED, false);
  assert.equal(harness.guard.requests.length, 0);
  assert.equal(harness.navigation.length, 0);
  assert.equal(harness.replacementNavigation.length, 0);
  harness.hostGuard.assertUnused();
});

test("[SESSION-ADOPT-02] status parser accepts only exact phases roles and canonical server instants", async () => {
  const harness = createLearningPlatformHarness();
  const sessionModule = await harness.loadModule(MODULE_PATHS.session);
  const { AUTHENTICATION_PHASES, SESSION_NEXT_OPERATIONS } = sessionModule;
  const validTransitions = [
    [
      AUTHENTICATION_PHASES.CREDENTIAL_VERIFIED,
      [SESSION_NEXT_OPERATIONS.REGISTRATION_ENROLLMENT]
    ],
    [
      AUTHENTICATION_PHASES.CREDENTIAL_VERIFIED,
      [SESSION_NEXT_OPERATIONS.FACE_CHALLENGE]
    ],
    [
      AUTHENTICATION_PHASES.REGISTRATION_PENDING,
      [SESSION_NEXT_OPERATIONS.REGISTRATION_CHALLENGE]
    ],
    [
      AUTHENTICATION_PHASES.FACE_PENDING,
      [SESSION_NEXT_OPERATIONS.FACE_COMPLETION]
    ],
    [
      AUTHENTICATION_PHASES.AUTHENTICATED,
      [SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING, SESSION_NEXT_OPERATIONS.REVOKE_ALL]
    ]
  ];

  for (const [phase, operations] of validTransitions) {
    const input = sessionStatus(phase, operations);
    const parsed = sessionModule.readAuthoritativeSessionStatus(input);
    assert.deepEqual(Object.keys(parsed).sort(), [
      "allowedNextOperations",
      "authenticationPhase",
      "eligibilityRevalidateAt",
      "expiresAt",
      "serverTime"
    ].sort());
    assert.deepEqual(parsed, input);
    assert.equal(Object.isFrozen(parsed), true);
    assert.equal(Object.isFrozen(parsed.allowedNextOperations), true);
    for (const operation of operations) {
      assert.equal(sessionModule.hasSessionNextOperation(parsed, operation), true);
    }
  }

  const authenticated = sessionStatus(AUTHENTICATION_PHASES.AUTHENTICATED, [
    SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING,
    SESSION_NEXT_OPERATIONS.REVOKE_ALL
  ]);
  const unexpectedAuthorityKey = ["session", "Id"].join("");
  const invalidStatuses = [
    null,
    [],
    { ...authenticated, [unexpectedAuthorityKey]: Object.freeze({}) },
    { ...authenticated, serverTime: "2035-01-01T00:00:00Z" },
    { ...authenticated, expiresAt: "not-an-instant" },
    { ...authenticated, eligibilityRevalidateAt: 2_000_000_000_000 },
    sessionStatus("unknown", [SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING]),
    sessionStatus(AUTHENTICATION_PHASES.AUTHENTICATED, [
      SESSION_NEXT_OPERATIONS.REVOKE_ALL,
      SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING
    ]),
    sessionStatus(AUTHENTICATION_PHASES.FACE_PENDING, [
      SESSION_NEXT_OPERATIONS.FACE_COMPLETION,
      SESSION_NEXT_OPERATIONS.PROTECTED_LEARNING
    ])
  ];
  for (const invalid of invalidStatuses) {
    assert.throws(
      () => sessionModule.readAuthoritativeSessionStatus(invalid),
      TypeError
    );
  }
  harness.hostGuard.assertUnused();
});

test("[SESSION-ADOPT-03] platform client separates public and target request boundaries", async () => {
  const harness = createLearningPlatformHarness({
    routes: [
      {
        expect: ({ jsonBody }) => ({
          publicBodyExact: jsonBody?.lowerBound === 2 && jsonBody?.upperBound === 4
        }),
        method: "POST",
        path: "/plataforma_v2/statusreport",
        response: { data: { rows: [] } }
      },
      {
        method: "GET",
        path: "/plataforma_v2/sessions/current",
        response: { data: { state: "synthetic-current" } }
      },
      {
        expect: ({ jsonBody }) => ({
          loginExact:
            jsonBody?.Usuário_Login === "  invented@example.test  " &&
            jsonBody?.Usuário_Senha === "  invented passphrase  " &&
            Object.keys(jsonBody).length === 2
        }),
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: { state: "synthetic-login" } }
      },
      {
        method: "POST",
        path: "/plataforma_v2/sessions/current/registration-enrollment",
        response: { status: 204 }
      },
      {
        expect: ({ formData }) => ({
          fileOnly:
            formData?.get("file")?.name === "invented-reference.png" &&
            [...formData.entries()].length === 1
        }),
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID",
        response: { data: { state: "synthetic-registration-face" } }
      },
      {
        expect: ({ jsonBody }) => ({
          ordinaryProtectedBody:
            jsonBody?.TipoAtualização === "NúmeroTópicosConcluídos" &&
            jsonBody?.NúmeroTópicosConcluídos === 5 &&
            !("IndexVerificado" in jsonBody)
        }),
        method: "POST",
        path: "/plataforma_v2/updates",
        response: { data: {} }
      }
    ]
  });
  const clientModule = await harness.loadModule(MODULE_PATHS.platformClient);
  const dependencies = harness.dependencies();
  const publicClient = clientModule.createPlatformClient({
    baseUrl: FIXTURE_PLATFORM_BASE,
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor
  });
  const targetClient = clientModule.createPlatformClient({
    baseUrl: FIXTURE_PLATFORM_BASE,
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor,
    sessionRequest: true
  });

  await publicClient.postJson("/statusreport", { lowerBound: 2, upperBound: 4 });
  await targetClient.getJson("/sessions/current");
  await targetClient.postJson("/login-FaceID", {
    Usuário_Login: "  invented@example.test  ",
    Usuário_Senha: "  invented passphrase  "
  });
  assert.equal(
    await targetClient.post("/sessions/current/registration-enrollment"),
    undefined
  );
  await targetClient.postMultipart("/CadastroFoto_e_FaceID", [
    ["file", { name: "invented-reference.png" }]
  ]);
  await targetClient.postJson("/updates", {
    NúmeroTópicosConcluídos: 5,
    TipoAtualização: "NúmeroTópicosConcluídos"
  });

  const [publicRequest, ...targetRequests] = harness.guard.requests;
  assert.deepEqual(publicRequest, {
    body: { lowerBound: 2, upperBound: 4 },
    formFields: undefined,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    path: "/plataforma_v2/statusreport"
  });
  assertNoManualAuthorityHeaders(publicRequest);
  assert.equal(SESSION_HEADER in publicRequest.headers, false);
  for (const option of ["cache", "credentials", "mode", "redirect", "referrerPolicy"]) {
    assert.equal(option in publicRequest, false);
  }

  assert.deepEqual(
    targetRequests.map(({ method, path }) => ({ method, path })),
    [
      { method: "GET", path: "/plataforma_v2/sessions/current" },
      { method: "POST", path: "/plataforma_v2/login-FaceID" },
      {
        method: "POST",
        path: "/plataforma_v2/sessions/current/registration-enrollment"
      },
      { method: "POST", path: "/plataforma_v2/CadastroFoto_e_FaceID" },
      { method: "POST", path: "/plataforma_v2/updates" }
    ]
  );
  targetRequests.forEach(assertTargetRequestOptions);
  assert.deepEqual(targetRequests[2].headers, { [SESSION_HEADER]: "1" });
  assert.deepEqual(targetRequests[3].formFields, [["file", "<file:invented-reference.png>"]]);
  assert.deepEqual(targetRequests[4].body, {
    NúmeroTópicosConcluídos: 5,
    TipoAtualização: "NúmeroTópicosConcluídos"
  });
  assert.equal(targetRequests.some(({ body }) => body?.IndexVerificado), false);
  assert.deepEqual(
    harness.guard.requestMetadata.map((metadata) => ({
      cache: metadata.cache,
      credentials: metadata.credentials,
      headers: metadata.headers,
      mode: metadata.mode,
      redirect: metadata.redirect,
      referrerPolicy: metadata.referrerPolicy
    })),
    [
      {
        cache: undefined,
        credentials: undefined,
        headers: { "Content-Type": "application/json" },
        mode: undefined,
        redirect: undefined,
        referrerPolicy: undefined
      },
      ...targetRequests.map((request) => ({
        cache: request.cache,
        credentials: request.credentials,
        headers: request.headers,
        mode: request.mode,
        redirect: request.redirect,
        referrerPolicy: request.referrerPolicy
      }))
    ]
  );
  assert.deepEqual(
    Object.assign({}, ...harness.guard.expectations.map(({ results }) => results)),
    {
      fileOnly: true,
      loginExact: true,
      ordinaryProtectedBody: true,
      publicBodyExact: true
    }
  );
  assert.throws(
    () => clientModule.createPlatformClient({
      baseUrl: FIXTURE_PLATFORM_BASE,
      fetch: dependencies.fetch,
      sessionRequest: "true"
    }),
    TypeError
  );
  harness.hostGuard.assertUnused();
});

test("[SESSION-ADOPT-04] target login follows only backend phase and next-operation roles", async (context) => {
  await context.test("authenticated login proceeds without legacy authority", async () => {
    const harness = createLearningPlatformHarness({
      routes: [{
        expect: ({ jsonBody }) => ({
          exactCredentialBody:
            jsonBody?.Usuário_Login === "  invented@example.test  " &&
            jsonBody?.Usuário_Senha === "  invented passphrase  " &&
            Object.keys(jsonBody).length === 2
        }),
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: {
          data: sessionStatus("authenticated", ["protected-learning", "revoke-all"])
        }
      }],
      storage: {
        "Horário-Encerramento-Sessão": "9999999999999",
        IndexVerificado: "invented-legacy-presentation-value",
        Usuário_Autorização_Cadastro: "Sim",
        Usuário_Foto_Cadastrada: "Não",
        Usuário_Logado: "Não"
      }
    });
    await installLoginApplication(harness);
    harness.element("E-mail").value = "  invented@example.test  ";
    harness.element("Senha").value = "  invented passphrase  ";
    submit(harness.element("Formulário-Login"));
    await harness.flush(30);

    assert.deepEqual(
      harness.guard.requests.map(({ body, method, path }) => ({ body, method, path })),
      [{
        body: {
          Usuário_Login: "  invented@example.test  ",
          Usuário_Senha: "<redacted>"
        },
        method: "POST",
        path: "/plataforma_v2/login-FaceID"
      }]
    );
    assert.deepEqual(storageTimeline(harness), [
      { key: "Usuário_Logado", type: "storage-set" }
    ]);
    assert.equal(harness.navigation.at(-1), "/plataforma/estudo");
    assert.deepEqual(harness.guard.expectations[0].results, { exactCredentialBody: true });
    assertOnlyTargetRequests(harness);
  });

  await context.test("registration enrollment is bodyless and server-confirmed", async () => {
    const harness = createLearningPlatformHarness({
      routes: [
        {
          method: "POST",
          path: "/plataforma_v2/login-FaceID",
          response: {
            data: sessionStatus("credential-verified", ["registration-enrollment"])
          }
        },
        {
          method: "POST",
          path: "/plataforma_v2/sessions/current/registration-enrollment",
          response: { status: 204 }
        },
        {
          method: "GET",
          path: "/plataforma_v2/sessions/current",
          response: {
            data: sessionStatus("registration-pending", ["registration-challenge"])
          }
        }
      ],
      storage: {
        IndexVerificado: "invented-legacy-presentation-value",
        Usuário_Autorização_Cadastro: "Não"
      }
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(40);

    assert.deepEqual(
      harness.guard.requests.map(({ body, method, path }) => ({ body, method, path })),
      [
        {
          body: { Usuário_Login: "", Usuário_Senha: "<redacted>" },
          method: "POST",
          path: "/plataforma_v2/login-FaceID"
        },
        {
          body: undefined,
          method: "POST",
          path: "/plataforma_v2/sessions/current/registration-enrollment"
        },
        {
          body: undefined,
          method: "GET",
          path: "/plataforma_v2/sessions/current"
        }
      ]
    );
    assert.deepEqual(storageTimeline(harness), []);
    assert.equal(harness.navigation.at(-1), "/plataforma/avisos-iniciais");
    assertOnlyTargetRequests(harness);
  });

  await context.test("Face completion is backend-bound and never uses the public result lookup", async () => {
    const faceRuntimeGrant = ["invented", "face", "runtime", "grant"].join("-");
    let faceGrantExact = false;
    const harness = createLearningPlatformHarness({
      faceStartImplementation: async (grant) => {
        faceGrantExact = grant === faceRuntimeGrant;
        return Object.freeze({});
      },
      routes: [
        {
          method: "POST",
          path: "/plataforma_v2/login-FaceID",
          response: { data: sessionStatus("credential-verified", ["face-challenge"]) }
        },
        {
          method: "POST",
          path: "/plataforma_v2/FaceID",
          response: {
            data: { Azure_Face_API_LivenessSession_authToken: faceRuntimeGrant }
          }
        },
        {
          method: "POST",
          path: "/plataforma_v2/sessions/current/face-completion",
          response: {
            data: sessionStatus("authenticated", ["protected-learning", "revoke-all"])
          }
        }
      ],
      storage: {
        IndexVerificado: "invented-legacy-presentation-value",
        Usuário_Foto_Cadastrada: "Sim",
        Usuário_Logado: "Não"
      }
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(50);

    assert.equal(faceGrantExact, true);
    assert.deepEqual(
      harness.guard.requests.map(({ body, method, path }) => ({ body, method, path })),
      [
        {
          body: { Usuário_Login: "", Usuário_Senha: "<redacted>" },
          method: "POST",
          path: "/plataforma_v2/login-FaceID"
        },
        { body: undefined, method: "POST", path: "/plataforma_v2/FaceID" },
        {
          body: undefined,
          method: "POST",
          path: "/plataforma_v2/sessions/current/face-completion"
        }
      ]
    );
    assert.equal(
      harness.guard.requests.some(({ path }) => path.includes("FaceID_resultado")),
      false
    );
    assert.deepEqual(storageTimeline(harness), [
      { key: "Usuário_Logado", type: "storage-set" }
    ]);
    assert.equal(harness.navigation.at(-1), "/plataforma/estudo");
    assertOnlyTargetRequests(harness);
  });
});

test("[SESSION-ADOPT-05] target registration uploads only the photo and binds Face completion", async () => {
  const faceRuntimeGrant = ["invented", "face", "runtime", "grant"].join("-");
  let faceGrantExact = false;
  const harness = createLearningPlatformHarness({
    faceStartImplementation: async (grant) => {
      faceGrantExact = grant === faceRuntimeGrant;
      return Object.freeze({});
    },
    routes: [
      {
        method: "GET",
        path: "/plataforma_v2/sessions/current",
        response: {
          data: sessionStatus("registration-pending", ["registration-challenge"])
        }
      },
      {
        expect: ({ formData }) => ({
          fileOnly:
            formData?.get("file")?.name === "invented-reference.png" &&
            [...formData.entries()].length === 1 &&
            formData.get("IndexVerificado") === null
        }),
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID",
        response: {
          data: { Azure_Face_API_LivenessSession_authToken: faceRuntimeGrant }
        }
      },
      {
        method: "POST",
        path: "/plataforma_v2/sessions/current/face-completion",
        response: {
          data: sessionStatus("authenticated", ["protected-learning", "revoke-all"])
        }
      }
    ],
    storage: {
      "Horário-Encerramento-Sessão": "9999999999999",
      IndexVerificado: "invented-legacy-presentation-value",
      Origem_Aviso_Dispositivo: "Sim",
      TempoSessão_Segundos: "999999",
      Usuário_Autorização_Cadastro: "Não",
      Usuário_Foto_Cadastrada: "Não",
      Usuário_Logado: "Não"
    }
  });
  harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.png" }];
  await installRegistrationApplication(harness);
  harness.dispatchWindow("load");
  await harness.flush(20);
  submit(harness.element("Formulário-Foto-Referência"));
  await harness.flush(50);

  assert.equal(faceGrantExact, true);
  assert.deepEqual(
    harness.guard.requests.map(({ body, formFields, method, path }) => ({
      body,
      formFields,
      method,
      path
    })),
    [
      {
        body: undefined,
        formFields: undefined,
        method: "GET",
        path: "/plataforma_v2/sessions/current"
      },
      {
        body: undefined,
        formFields: [["file", "<file:invented-reference.png>"]],
        method: "POST",
        path: "/plataforma_v2/CadastroFoto_e_FaceID"
      },
      {
        body: undefined,
        formFields: undefined,
        method: "POST",
        path: "/plataforma_v2/sessions/current/face-completion"
      }
    ]
  );
  assert.deepEqual(storageTimeline(harness), [
    { key: "Origem_Aviso_Dispositivo", type: "storage-set" },
    { key: "Usuário_Logado", type: "storage-set" }
  ]);
  assert.equal(harness.navigation.at(-1), "/plataforma/estudo");
  assert.equal(harness.guard.expectations[0].results.fileOnly, true);
  assert.equal(
    harness.guard.requests.some(({ path }) => path.includes("FaceID_resultado")),
    false
  );
  assertOnlyTargetRequests(harness);
});

test("[SESSION-ADOPT-06] target Study uses cookie-protected calls and server-time presentation only", async () => {
  const harness = createLearningPlatformHarness({
    now: 2_000_000_000_000,
    routes: [
      {
        expect: ({ jsonBody }) => ({
          emptyRefreshBody:
            jsonBody && Object.keys(jsonBody).length === 0 &&
            !("IndexVerificado" in jsonBody)
        }),
        method: "POST",
        path: "/plataforma_v2/refresh",
        response: { data: refreshData() }
      },
      {
        method: "GET",
        path: "/plataforma_v2/sessions/current",
        response: {
          data: sessionStatus("authenticated", ["protected-learning", "revoke-all"])
        }
      },
      {
        expect: ({ jsonBody }) => ({
          protectedUpdate:
            jsonBody?.TipoAtualização === "NúmeroTópicosConcluídos" &&
            jsonBody?.NúmeroTópicosConcluídos === 1 &&
            !("IndexVerificado" in jsonBody)
        }),
        method: "POST",
        path: "/plataforma_v2/updates",
        response: { data: {} }
      }
    ],
    storage: {
      "Horário-Encerramento-Sessão": "1",
      IndexVerificado: "invented-legacy-presentation-value",
      Origem_Aviso_Dispositivo: "Sim",
      TempoSessão_Segundos: "1",
      Usuário_Autorização_Cadastro: "Sim",
      Usuário_Foto_Cadastrada: "Não",
      Usuário_Logado: "Não"
    }
  });
  const study = await installStudyApplication(harness);
  harness.dispatchWindow("load");
  await harness.flush(40);

  assert.deepEqual(
    harness.guard.requests.map(({ body, method, path }) => ({ body, method, path })),
    [
      { body: {}, method: "POST", path: "/plataforma_v2/refresh" },
      { body: undefined, method: "GET", path: "/plataforma_v2/sessions/current" }
    ]
  );
  assert.deepEqual(storageTimeline(harness), [
    { key: "Origem_Aviso_Dispositivo", type: "storage-set" },
    { key: "Usuário_Logado", type: "storage-set" }
  ]);
  assert.equal(harness.element("Container-Seções").style.display, "flex");
  assertOnlyTargetRequests(harness);

  const current = harness.element("invented-current-topic");
  current.dataIndex = 1;
  current.querySelector(".Símbolo-Check-Aberto");
  const next = harness.element("invented-next-topic");
  next.dataIndex = 2;
  next.querySelector(".Símbolo-Check-Fechado");
  harness.selectorResults.set('[data-index="2"]', next);
  study.controller.completeTopic(current);
  await harness.flush(30);
  assert.equal(harness.guard.requests.length, 3);
  assert.deepEqual(harness.guard.requests[2].body, {
    NotaTeste: "n/a",
    NúmeroMódulo: "n/a",
    NúmeroTópicosConcluídos: 1,
    TipoAtualização: "NúmeroTópicosConcluídos"
  });
  assertTargetRequestOptions(harness.guard.requests[2]);

  const [timerId] = harness.timers.keys();
  assert.ok(timerId);
  harness.runTimer(timerId);
  assert.equal(harness.element("Usuário-Tempo-Sessão").textContent, "Tempo Sessão: 04:00:00");
  harness.setClock(9_000_000_000_000);
  harness.runTimer(timerId);
  assert.equal(
    harness.element("Usuário-Tempo-Sessão").textContent,
    "Tempo Sessão: 04:00:00",
    "Changing the browser wall clock must not change target session presentation"
  );
  study.advanceMonotonic((4 * 60 * 60 * 1000) - 1000);
  harness.runTimer(timerId);
  assert.equal(harness.element("Usuário-Tempo-Sessão").textContent, "Tempo Sessão: 00:00:01");
  assert.equal(harness.navigation.length, 0);
  study.advanceMonotonic(1000);
  harness.runTimer(timerId);
  assert.equal(harness.element("Usuário-Tempo-Sessão").textContent, "Tempo Sessão: 00:00:00");
  assert.equal(harness.navigation.at(-1), "/plataforma/login");
  assert.equal(harness.guard.requests.some(({ method }) => method === "DELETE"), false);
  assert.deepEqual(
    Object.assign({}, ...harness.guard.expectations.map(({ results }) => results)),
    { emptyRefreshBody: true, protectedUpdate: true }
  );
});

test("[SESSION-ADOPT-07] current-session failures distinguish invalidity from availability", async (context) => {
  const cases = [
    {
      expectedAlert: false,
      expectedLoginWrite: true,
      expectedNavigation: "/plataforma/login",
      label: "invalid-401",
      statusResponse: { data: {}, status: 401 }
    },
    {
      expectedAlert: true,
      expectedLoginWrite: false,
      expectedNavigation: undefined,
      label: "availability-503",
      statusResponse: { data: {}, status: 503 }
    },
    {
      expectedAlert: true,
      expectedLoginWrite: false,
      expectedNavigation: undefined,
      label: "wrong-phase",
      statusResponse: {
        data: sessionStatus("credential-verified", ["face-challenge"])
      }
    },
    {
      expectedAlert: true,
      expectedLoginWrite: false,
      expectedNavigation: undefined,
      label: "malformed-shape",
      statusResponse: {
        data: {
          ...sessionStatus("authenticated", ["protected-learning", "revoke-all"]),
          unexpectedAuthority: true
        }
      }
    }
  ];

  for (const scenario of cases) {
    await context.test(scenario.label, async () => {
      const harness = createLearningPlatformHarness({
        routes: [
          {
            method: "POST",
            path: "/plataforma_v2/refresh",
            response: { data: refreshData() }
          },
          {
            method: "GET",
            path: "/plataforma_v2/sessions/current",
            response: scenario.statusResponse
          }
        ],
        storage: {
          "Horário-Encerramento-Sessão": "9999999999999",
          IndexVerificado: "invented-legacy-presentation-value",
          Usuário_Logado: "Sim"
        }
      });
      await installStudyApplication(harness);
      harness.dispatchWindow("load");
      await harness.flush(40);

      assert.deepEqual(
        harness.guard.requests.map(({ method, path }) => ({ method, path })),
        [
          { method: "POST", path: "/plataforma_v2/refresh" },
          { method: "GET", path: "/plataforma_v2/sessions/current" }
        ]
      );
      assert.equal(harness.element("Container-Seções").style.display, undefined);
      assert.equal(harness.alerts.length > 0, scenario.expectedAlert);
      assert.equal(harness.navigation.at(-1), scenario.expectedNavigation);
      assert.equal(
        storageTimeline(harness).some(
          ({ key, type }) => key === "Usuário_Logado" && type === "storage-set"
        ),
        scenario.expectedLoginWrite
      );
      assert.equal(harness.timers.size, 0);
      assertOnlyTargetRequests(harness);
    });
  }
});

test("[SESSION-ADOPT-08] target notices and Study preserve the exact seven-key disposition", async () => {
  const seededStorage = {
    "Horário-Encerramento-Sessão": "1",
    IndexVerificado: "invented-legacy-presentation-value",
    Origem_Aviso_Dispositivo: "Sim",
    TempoSessão_Segundos: "1",
    Usuário_Autorização_Cadastro: "Não",
    Usuário_Foto_Cadastrada: "Não",
    Usuário_Logado: "Não"
  };
  const harness = createLearningPlatformHarness({
    pathname: "/plataforma/avisos-iniciais",
    storage: seededStorage
  });
  const sessionModule = await harness.loadModule(MODULE_PATHS.session);
  await installInitialNoticesApplication(harness);
  harness.dispatchWindow("load");

  assert.deepEqual(Object.values(sessionModule.SESSION_KEYS).sort(), Object.keys(seededStorage).sort());
  assert.deepEqual(storageTimeline(harness), [
    { key: "Origem_Aviso_Dispositivo", type: "storage-set" }
  ]);
  assert.deepEqual(Object.keys(harness.sessionStorage.snapshot()).sort(), Object.keys(seededStorage).sort());
  assert.equal(harness.navigation.length, 0);
  assert.equal(harness.guard.requests.length, 0);

  harness.element("Palavra-Passe-Credenciais").value = "credenciais";
  harness.element("Palavra-Passe-Direitos").value = "direitos";
  harness.element("Palavra-Passe-Janela").value = "janela";
  submit(harness.element("Formulário"));
  assert.equal(harness.navigation.at(-1), "/plataforma/cadastro-foto");
  assert.deepEqual(storageTimeline(harness), [
    { key: "Origem_Aviso_Dispositivo", type: "storage-set" }
  ]);
  harness.hostGuard.assertUnused();
});

test("[SESSION-ADOPT-09] target transition failures never replay or fall back to legacy", async (context) => {
  const faceRuntimeGrant = ["invented", "face", "runtime", "grant"].join("-");

  await context.test("credential 401 is invalid credentials only", async () => {
    const harness = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: {}, status: 401 }
      }],
      storage: { IndexVerificado: "invented-legacy-presentation-value" }
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(30);

    assert.equal(harness.element("Aviso-Email-ou-Senha-Inválidos").style.display, "block");
    assert.equal(harness.element("E-mail").getAttribute("aria-invalid"), "true");
    assert.equal(harness.element("Senha").getAttribute("aria-invalid"), "true");
    assert.equal(harness.alerts.length, 0);
    assert.equal(harness.navigation.length, 0);
    assert.deepEqual(storageTimeline(harness), []);
    assertOnlyTargetRequests(harness);
  });

  await context.test("invalid backend Face policy is an availability failure", async () => {
    const harness = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: { data: {}, status: 503 }
      }]
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(30);

    assert.equal(harness.alerts.length, 1);
    assert.equal(harness.navigation.length, 0);
    assert.equal(harness.element("Aviso-Email-ou-Senha-Inválidos").style.display, undefined);
    assert.deepEqual(storageTimeline(harness), []);
    assertOnlyTargetRequests(harness);
  });

  await context.test("Face completion 403 reconciles a surviving wrong phase", async () => {
    const harness = createLearningPlatformHarness({
      faceStartImplementation: async () => Object.freeze({}),
      routes: [
        {
          method: "POST",
          path: "/plataforma_v2/login-FaceID",
          response: { data: sessionStatus("credential-verified", ["face-challenge"]) }
        },
        {
          method: "POST",
          path: "/plataforma_v2/FaceID",
          response: {
            data: { Azure_Face_API_LivenessSession_authToken: faceRuntimeGrant }
          }
        },
        {
          method: "POST",
          path: "/plataforma_v2/sessions/current/face-completion",
          response: { data: {}, status: 403 }
        },
        {
          method: "GET",
          path: "/plataforma_v2/sessions/current",
          response: {
            data: sessionStatus("authenticated", ["protected-learning", "revoke-all"])
          }
        }
      ]
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(50);

    assert.equal(harness.element("Aviso-FaceID-Reprovado").style.display, undefined);
    assert.equal(harness.alerts.length, 0);
    assert.equal(harness.navigation.at(-1), "/plataforma/estudo");
    assert.deepEqual(storageTimeline(harness), [
      { key: "Usuário_Logado", type: "storage-set" }
    ]);
    assertOnlyTargetRequests(harness);
  });

  for (const status of [403, 409, 503]) {
    await context.test(`Face completion ${status} never replays or falls back`, async () => {
      const harness = createLearningPlatformHarness({
        faceStartImplementation: async () => Object.freeze({}),
        routes: [
          {
            method: "POST",
            path: "/plataforma_v2/login-FaceID",
            response: { data: sessionStatus("credential-verified", ["face-challenge"]) }
          },
          {
            method: "POST",
            path: "/plataforma_v2/FaceID",
            response: {
              data: { Azure_Face_API_LivenessSession_authToken: faceRuntimeGrant }
            }
          },
          {
            method: "POST",
            path: "/plataforma_v2/sessions/current/face-completion",
            response: { data: {}, status }
          },
          ...(status === 403 ? [{
            method: "GET",
            path: "/plataforma_v2/sessions/current",
            response: { data: {}, status: 401 }
          }] : [])
        ],
        storage: { IndexVerificado: "invented-legacy-presentation-value" }
      });
      await installLoginApplication(harness);
      submit(harness.element("Formulário-Login"));
      await harness.flush(50);

      assert.deepEqual(
        harness.guard.requests.map(({ method, path }) => ({ method, path })),
        [
          { method: "POST", path: "/plataforma_v2/login-FaceID" },
          { method: "POST", path: "/plataforma_v2/FaceID" },
          { method: "POST", path: "/plataforma_v2/sessions/current/face-completion" },
          ...(status === 403 ? [{
            method: "GET",
            path: "/plataforma_v2/sessions/current"
          }] : [])
        ]
      );
      assert.equal(harness.navigation.length, 0);
      assert.deepEqual(storageTimeline(harness), []);
      if (status === 403) {
        assert.equal(harness.element("Aviso-FaceID-Reprovado").style.display, "block");
        assert.equal(harness.alerts.length, 0);
      } else {
        assert.equal(harness.alerts.length, 1);
      }
      assertOnlyTargetRequests(harness);
    });
  }

  for (const challenge of [
    { Azure_Face_API_LivenessSession_authToken: "" },
    {
      Azure_Face_API_LivenessSession_authToken: faceRuntimeGrant,
      [["Azure_Face_API_LivenessSession_", "session", "ID"].join("")]: true
    }
  ]) {
    await context.test("empty or expanded Face challenge is an availability failure", async () => {
      const harness = createLearningPlatformHarness({
        routes: [
          {
            method: "POST",
            path: "/plataforma_v2/login-FaceID",
            response: { data: sessionStatus("credential-verified", ["face-challenge"]) }
          },
          {
            method: "POST",
            path: "/plataforma_v2/FaceID",
            response: { data: challenge }
          }
        ]
      });
      await installLoginApplication(harness);
      submit(harness.element("Formulário-Login"));
      await harness.flush(40);

      assert.equal(harness.guard.requests.length, 2);
      assert.equal(harness.timeline.some(({ type }) => type === "face-start"), false);
      assert.equal(harness.alerts.length, 1);
      assert.equal(harness.navigation.length, 0);
      assert.deepEqual(storageTimeline(harness), []);
      assertOnlyTargetRequests(harness);
    });
  }

  await context.test("lost login response is not replayed or downgraded", async () => {
    const harness = createLearningPlatformHarness({
      routes: [{
        async handler() {
          throw new Error("invented transport interruption");
        },
        method: "POST",
        path: "/plataforma_v2/login-FaceID"
      }],
      storage: { IndexVerificado: "invented-legacy-presentation-value" }
    });
    await installLoginApplication(harness);
    submit(harness.element("Formulário-Login"));
    await harness.flush(30);

    assert.equal(harness.guard.requests.length, 1);
    assert.equal(harness.alerts.length, 1);
    assert.equal(harness.navigation.length, 0);
    assert.deepEqual(storageTimeline(harness), []);
    assertOnlyTargetRequests(harness);
  });
});

test("[SESSION-ADOPT-10] GATE-01 keeps precedence over GATE-02 and target networking", async () => {
  const unsupportedHarness = createLearningPlatformHarness({
    innerWidth: 1024,
    pathname: "/plataforma/estudo",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/140.0",
    userAgentData: {
      brands: [{ brand: "Firefox" }],
      mobile: false,
      platform: "Windows"
    }
  });
  await installStudyApplication(unsupportedHarness);
  unsupportedHarness.dispatchWindow("load");
  await unsupportedHarness.flush(20);
  assert.deepEqual(unsupportedHarness.replacementNavigation, [
    "/plataforma/aviso-dispositivo-navegador"
  ]);
  assert.equal(unsupportedHarness.guard.requests.length, 0);

  const viewportHarness = createLearningPlatformHarness({
    innerWidth: 1024,
    pathname: "/plataforma/estudo"
  });
  await installStudyApplication(viewportHarness);
  viewportHarness.dispatchWindow("load");
  await viewportHarness.flush(20);
  assert.equal(
    viewportHarness.replacementNavigation[0].startsWith("/plataforma/aviso-viewport"),
    true
  );
  assert.equal(viewportHarness.guard.requests.length, 0);
  unsupportedHarness.hostGuard.assertUnused();
  viewportHarness.hostGuard.assertUnused();
});

test("[SESSION-ADOPT-11] protected feedback omits browser authority and keeps target metadata", async () => {
  const harness = createLearningPlatformHarness({
    routes: [{
      expect: ({ jsonBody }) => ({
        exactFeedback:
          jsonBody?.NúmeroMódulo === 10 &&
          jsonBody?.NúmeroTópicosConcluídos === 1 &&
          jsonBody?.Feedback_Comentários === "Comentário inventado" &&
          !("IndexVerificado" in jsonBody)
      }),
      method: "POST",
      path: "/plataforma_v2/processa-feedback",
      response: { data: {} }
    }]
  });
  const [clientModule, feedbackModule] = await Promise.all([
    harness.loadModule(MODULE_PATHS.platformClient),
    harness.loadModule(MODULE_PATHS.feedback)
  ]);
  const dependencies = harness.dependencies();
  const client = clientModule.createPlatformClient({
    baseUrl: FIXTURE_PLATFORM_BASE,
    fetch: dependencies.fetch,
    sessionRequest: true
  });
  const topic = harness.element("authoritative-feedback-topic");
  topic.className = "Container-Tópico-Aberto";
  topic.dataIndex = 171;
  topic.setAttribute("name", "FEEDBACK MÓDULO 10");
  const topicName = harness.element("authoritative-feedback-name");
  topicName.innerHTML = "Feedback: Módulo 10";
  topic.setSelectorResult(".Tópico-Nome", topicName);
  const dom = {
    assessments: harness.element("authoritative-feedback-assessments"),
    content: harness.element("authoritative-feedback-content"),
    feedback: harness.element("authoritative-feedback-panel"),
    footer: harness.element("authoritative-feedback-footer"),
    performance: harness.element("authoritative-feedback-performance"),
    playerElement: harness.element("authoritative-feedback-player")
  };
  dom.feedback.scrollTo = () => {};
  let performanceOpened = false;
  const feedback = feedbackModule.createStudyFeedback({
    alert: dependencies.alert,
    authoritativeSessionsEnabled: true,
    client,
    clock: { createDate: (...argumentsList) => new dependencies.Date(...argumentsList) },
    document: dependencies.document,
    dom,
    navigation: { updateMetrics() {} },
    openPerformance() { performanceOpened = true; },
    openTopic() {},
    state: {
      completedTopics: 0,
      email: "invented@example.test",
      fullName: "Invented Learner",
      verifiedIndex: "invented-legacy-presentation-value"
    }
  });
  feedback.open(topic);
  harness.element("Campo-Comentários").value = "Comentário inventado";
  dom.footer.onclick({
    target: {
      closest(selector) {
        return selector === "#Botão-Enviar-Feedback" ? this : null;
      }
    }
  });
  await harness.flush(30);

  assert.equal(performanceOpened, true);
  assert.equal(harness.guard.requests.length, 1);
  assert.equal("IndexVerificado" in harness.guard.requests[0].body, false);
  assertTargetRequestOptions(harness.guard.requests[0]);
  assert.deepEqual(harness.guard.expectations[0].results, { exactFeedback: true });
  harness.hostGuard.assertUnused();
});

test("[SESSION-ADOPT-12] registration validates its provisional backend role before upload", async (context) => {
  const cases = [
    {
      alert: false,
      label: "invalid session",
      navigation: "/plataforma/login",
      response: { data: {}, status: 401 }
    },
    {
      alert: true,
      label: "authority unavailable",
      navigation: undefined,
      response: { data: {}, status: 503 }
    },
    {
      alert: true,
      label: "wrong phase",
      navigation: undefined,
      response: {
        data: sessionStatus("authenticated", ["protected-learning", "revoke-all"])
      }
    },
    {
      alert: true,
      label: "malformed status",
      navigation: undefined,
      response: {
        data: {
          ...sessionStatus("registration-pending", ["registration-challenge"]),
          unexpectedAuthority: true
        }
      }
    }
  ];

  for (const scenario of cases) {
    await context.test(scenario.label, async () => {
      const harness = createLearningPlatformHarness({
        routes: [{
          method: "GET",
          path: "/plataforma_v2/sessions/current",
          response: scenario.response
        }],
        storage: {
          IndexVerificado: "invented-legacy-presentation-value",
          Usuário_Autorizção_Cadastro: "Sim",
          Usuário_Foto_Cadastrada: "Sim"
        }
      });
      harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.png" }];
      await installRegistrationApplication(harness);
      harness.dispatchWindow("load");
      await harness.flush(30);

      assert.equal(harness.element("Botão-Cadastrar-Foto-Referência").disabled, true);
      assert.equal(harness.alerts.length > 0, scenario.alert);
      assert.equal(harness.navigation.at(-1), scenario.navigation);
      assert.deepEqual(
        harness.guard.requests.map(({ method, path }) => ({ method, path })),
        [{ method: "GET", path: "/plataforma_v2/sessions/current" }]
      );
      submit(harness.element("Formulário-Foto-Referência"));
      await harness.flush(10);
      assert.equal(harness.guard.requests.length, 1);
      assert.deepEqual(storageTimeline(harness), [
        { key: "Origem_Aviso_Dispositivo", type: "storage-set" }
      ]);
      assertOnlyTargetRequests(harness);
    });
  }
});

test("[SESSION-ADOPT-13] ambiguous registration transitions lock replay and require login", async (context) => {
  const faceRuntimeGrant = ["invented", "face", "runtime", "grant"].join("-");
  const scenarios = [
    { label: "lost registration upload", stage: "upload", outcome: "transport" },
    { label: "registration reconciliation conflict", stage: "upload", outcome: 409 },
    { label: "lost Face completion", stage: "completion", outcome: "transport" },
    { label: "pending Face completion", stage: "completion", outcome: 409 },
    { label: "unavailable Face completion", stage: "completion", outcome: 503 },
    { label: "definitive Face failure", stage: "completion", outcome: 403 }
  ];

  for (const scenario of scenarios) {
    await context.test(scenario.label, async () => {
      const transitionRoute = {
        method: "POST",
        path: scenario.stage === "upload"
          ? "/plataforma_v2/CadastroFoto_e_FaceID"
          : "/plataforma_v2/sessions/current/face-completion"
      };
      if (scenario.outcome === "transport") {
        transitionRoute.handler = async () => {
          throw new Error("invented transport interruption");
        };
      } else {
        transitionRoute.response = { data: {}, status: scenario.outcome };
      }

      const routes = [{
        method: "GET",
        path: "/plataforma_v2/sessions/current",
        response: {
          data: sessionStatus("registration-pending", ["registration-challenge"])
        }
      }];
      if (scenario.stage === "completion") {
        routes.push({
          method: "POST",
          path: "/plataforma_v2/CadastroFoto_e_FaceID",
          response: {
            data: { Azure_Face_API_LivenessSession_authToken: faceRuntimeGrant }
          }
        });
      }
      routes.push(transitionRoute);
      if (scenario.outcome === 403) {
        routes.push({
          method: "GET",
          path: "/plataforma_v2/sessions/current",
          response: { data: {}, status: 401 }
        });
      }

      const harness = createLearningPlatformHarness({
        faceStartImplementation: async () => Object.freeze({}),
        routes,
        storage: {
          IndexVerificado: "invented-legacy-presentation-value",
          Usuário_Autorizção_Cadastro: "Sim"
        }
      });
      harness.element("Botão-Escolher-Arquivo").files = [{ name: "invented-reference.png" }];
      await installRegistrationApplication(harness);
      harness.dispatchWindow("load");
      await harness.flush(20);
      submit(harness.element("Formulário-Foto-Referência"));
      await harness.flush(60);

      const requestCount = harness.guard.requests.length;
      assert.equal(harness.navigation.at(-1), "/plataforma/login");
      assert.equal(harness.alerts.length, 1);
      assert.equal(harness.element("Botão-Cadastrar-Foto-Referência").disabled, true);
      assert.equal(harness.element("Botão-Cadastrar-Foto-Referência").style.display, "none");
      submit(harness.element("Formulário-Foto-Referência"));
      await harness.flush(10);
      assert.equal(harness.guard.requests.length, requestCount);
      assert.equal(
        harness.guard.requests.some(({ path }) => path.includes("FaceID_resultado")),
        false
      );
      assert.deepEqual(storageTimeline(harness), [
        { key: "Origem_Aviso_Dispositivo", type: "storage-set" }
      ]);
      assertOnlyTargetRequests(harness);
    });
  }
});

function authoritativeStudyRoutes(deleteRoute) {
  return [
    {
      method: "POST",
      path: "/plataforma_v2/refresh",
      response: { data: refreshData() }
    },
    {
      method: "GET",
      path: "/plataforma_v2/sessions/current",
      response: {
        data: sessionStatus("authenticated", ["protected-learning", "revoke-all"])
      }
    },
    ...(deleteRoute ? [{
      method: "DELETE",
      path: "/plataforma_v2/sessions/current",
      ...deleteRoute
    }] : [])
  ];
}

async function launchAuthoritativeStudy({ deleteRoute, hub = createBroadcastChannelHub() } = {}) {
  const harness = createLearningPlatformHarness({
    routes: authoritativeStudyRoutes(deleteRoute),
    storage: {
      "Horário-Encerramento-Sessão": "1",
      IndexVerificado: "invented-legacy-presentation-value",
      Origem_Aviso_Dispositivo: "Sim",
      TempoSessão_Segundos: "1",
      Usuário_Autorização_Cadastro: "Sim",
      Usuário_Foto_Cadastrada: "Não",
      Usuário_Logado: "Não"
    }
  });
  const logoutPresentation = await createBroadcastPresentation(harness, hub);
  const study = await installStudyApplication(harness, { logoutPresentation });
  harness.dispatchWindow("load");
  await harness.flush(40);
  return { harness, hub, logoutPresentation, study };
}

test("[SESSION-LOGOUT-01] target client sends only the exact bodyless current-session DELETE", async () => {
  const harness = createLearningPlatformHarness({
    routes: [{
      method: "DELETE",
      path: "/plataforma_v2/sessions/current",
      response: { status: 204 }
    }]
  });
  const { createPlatformClient } = await harness.loadModule(MODULE_PATHS.platformClient);
  const dependencies = harness.dependencies();
  const client = createPlatformClient({
    baseUrl: FIXTURE_PLATFORM_BASE,
    fetch: dependencies.fetch,
    FormDataConstructor: dependencies.FormDataConstructor,
    sessionRequest: true
  });

  for (const syntheticOutcome of ["active", "missing", "invalid", "repeated"]) {
    assert.equal(await client.delete("/sessions/current"), undefined, syntheticOutcome);
  }

  assert.equal(harness.guard.requests.length, 4);
  for (const request of harness.guard.requests) {
    assert.deepEqual(request, {
      body: undefined,
      formFields: undefined,
      headers: { [SESSION_HEADER]: "1" },
      method: "DELETE",
      path: "/plataforma_v2/sessions/current",
      cache: "no-store",
      credentials: "include",
      mode: "cors",
      redirect: "error",
      referrerPolicy: "no-referrer"
    });
    assertTargetRequestOptions(request);
  }
  assert.equal(harness.sessionStorage.length, 0);
  harness.hostGuard.assertUnused();
});

test("[SESSION-LOGOUT-02] exact 204 alone commits local presentation cleanup and one signal", async () => {
  const releaseDelete = deferred();
  const run = await launchAuthoritativeStudy({
    deleteRoute: {
      handler: async () => {
        await releaseDelete.promise;
        return { status: 204 };
      }
    }
  });
  const { harness, hub, logoutPresentation } = run;
  const storageEventsBeforeLogout = storageTimeline(harness).length;
  const timerIdsBeforeLogout = [...harness.timers.keys()];

  harness.element("Botão-Sair").dispatch("click");
  harness.element("Botão-Sair").dispatch("click");

  assert.equal(
    harness.guard.requests.filter(({ method }) => method === "DELETE").length,
    1
  );
  assert.equal(harness.element("Botão-Sair").disabled, true);
  assert.equal(harness.element("Container-Seções").inert, true);
  assert.equal(harness.element("Container-Seções").getAttribute("aria-busy"), "true");
  assert.equal(storageTimeline(harness).length, storageEventsBeforeLogout);
  assert.deepEqual([...harness.timers.keys()], timerIdsBeforeLogout);
  assert.deepEqual(harness.navigation, []);
  assert.deepEqual(hub.messages, []);

  releaseDelete.resolve();
  await harness.flush(30);

  assert.equal(harness.element("Container-Seções").style.display, "none");
  assert.equal(harness.element("Container-Seções").inert, true);
  assert.equal(harness.element("Container-Seções").getAttribute("aria-busy"), "false");
  assert.equal(harness.element("Container-Interno-Shaka-Player").pauseCalls, 1);
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Não");
  assert.equal(harness.navigation.at(-1), "/plataforma/login");
  assert.deepEqual(hub.messages, [{ type: "logout", version: 1 }]);
  assert.deepEqual(logoutPresentation.snapshot(), {
    available: false,
    closed: true,
    failed: false,
    published: true,
    received: false
  });
  assertOnlyTargetRequests(harness);
});

test("[SESSION-LOGOUT-03] unavailable or ambiguous logout stays retryable without automatic replay", async (context) => {
  const failures = [
    ["availability-503", { response: { data: {}, status: 503 } }],
    ["network-loss", { handler: async () => { throw new Error("Invented network loss"); } }],
    ["malformed-response", {
      handler: async () => ({
        json: async () => ({}),
        ok: true,
        status: undefined
      })
    }],
    ["unexpected-status", { response: { data: {}, status: 200 } }],
    ["ambiguous-response", {
      handler: async () => Promise.reject(new Error("Invented ambiguous response"))
    }]
  ];

  for (const [name, deleteRoute] of failures) {
    await context.test(name, async () => {
      const run = await launchAuthoritativeStudy({ deleteRoute });
      const { harness, hub } = run;
      const storageEventsBeforeLogout = storageTimeline(harness).length;

      harness.element("Botão-Sair").dispatch("click");
      await harness.flush(30);
      await harness.flush(30);

      assert.equal(
        harness.guard.requests.filter(({ method }) => method === "DELETE").length,
        1
      );
      assert.equal(harness.element("Botão-Sair").disabled, false);
      assert.equal(harness.element("Container-Seções").inert, false);
      assert.equal(harness.element("Container-Seções").style.display, "flex");
      assert.equal(harness.element("Container-Seções").getAttribute("aria-busy"), "false");
      assert.equal(harness.timers.size, 1);
      assert.equal(storageTimeline(harness).length, storageEventsBeforeLogout);
      assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Sim");
      assert.deepEqual(harness.navigation, []);
      assert.deepEqual(hub.messages, []);
      assert.equal(harness.alerts.length, 1);
      assertOnlyTargetRequests(harness);
    });
  }

  await context.test("explicit retry after availability failure", async () => {
    let deleteCalls = 0;
    const run = await launchAuthoritativeStudy({
      deleteRoute: {
        handler: async () => {
          deleteCalls += 1;
          return deleteCalls === 1 ? { data: {}, status: 503 } : { status: 204 };
        }
      }
    });
    const { harness, hub } = run;

    harness.element("Botão-Sair").dispatch("click");
    await harness.flush(30);
    assert.equal(deleteCalls, 1);
    assert.equal(harness.element("Botão-Sair").disabled, false);
    assert.deepEqual(harness.navigation, []);
    assert.deepEqual(hub.messages, []);

    await harness.flush(30);
    assert.equal(deleteCalls, 1, "The client must not retry without user activation");

    harness.element("Botão-Sair").dispatch("click");
    await harness.flush(30);
    assert.equal(deleteCalls, 2);
    assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Não");
    assert.equal(harness.navigation.at(-1), "/plataforma/login");
    assert.deepEqual(hub.messages, [{ type: "logout", version: 1 }]);
  });
});

test("[SESSION-LOGOUT-04] one 204 signal reduces Login Notices Registration and Study presentation", async () => {
  const hub = createBroadcastChannelHub();

  const loginHarness = createLearningPlatformHarness({
    storage: { Usuário_Logado: "Sim" }
  });
  const loginPresentation = await createBroadcastPresentation(loginHarness, hub);
  await installLoginApplication(loginHarness, { logoutPresentation: loginPresentation });
  loginHarness.dispatchWindow("load");

  const noticesHarness = createLearningPlatformHarness({
    storage: { Usuário_Logado: "Sim" }
  });
  const noticesPresentation = await createBroadcastPresentation(noticesHarness, hub);
  await installInitialNoticesApplication(noticesHarness, {
    logoutPresentation: noticesPresentation
  });
  noticesHarness.dispatchWindow("load");

  const registrationHarness = createLearningPlatformHarness({
    routes: [{
      method: "GET",
      path: "/plataforma_v2/sessions/current",
      response: {
        data: sessionStatus("registration-pending", ["registration-challenge"])
      }
    }],
    storage: { Usuário_Logado: "Sim" }
  });
  const registrationPresentation = await createBroadcastPresentation(
    registrationHarness,
    hub
  );
  await installRegistrationApplication(registrationHarness, {
    logoutPresentation: registrationPresentation
  });
  registrationHarness.dispatchWindow("load");
  await registrationHarness.flush(30);

  const studyRun = await launchAuthoritativeStudy({ hub });
  const publisher = await createBroadcastPresentation(loginHarness, hub);
  publisher.listen(() => {});
  assert.equal(publisher.publish(), true);

  assert.equal(loginHarness.sessionStorage.getItem("Usuário_Logado"), "Não");
  assert.deepEqual(loginHarness.navigation, []);
  for (const harness of [noticesHarness, registrationHarness, studyRun.harness]) {
    assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Não");
    assert.equal(harness.navigation.at(-1), "/plataforma/login");
    assert.equal(
      harness.guard.requests.some(({ method }) => method === "DELETE"),
      false
    );
  }
  assert.equal(studyRun.harness.timers.size, 0);
  assert.equal(studyRun.harness.element("Container-Seções").style.display, "none");
  assert.deepEqual(hub.messages, [{ type: "logout", version: 1 }]);
  assert.equal(loginPresentation.snapshot().received, true);
  assert.equal(noticesPresentation.snapshot().received, true);
  assert.equal(registrationPresentation.snapshot().received, true);
  assert.equal(studyRun.logoutPresentation.snapshot().received, true);
  assert.equal(
    hub.messages.length,
    1,
    "Receiving tabs must neither issue DELETE nor rebroadcast the outcome"
  );
});

test("[SESSION-LOGOUT-05] malformed duplicate replayed and forged messages stay presentation-only", async () => {
  const harness = createLearningPlatformHarness({
    storage: { Usuário_Logado: "Sim" }
  });
  const hub = createBroadcastChannelHub();
  const presentation = await createBroadcastPresentation(harness, hub);
  let outcomes = 0;
  presentation.listen(() => {
    outcomes += 1;
    harness.sessionStorage.setItem("Usuário_Logado", "Não");
  });

  for (const malformed of [
    undefined,
    null,
    [],
    {},
    { type: "logout" },
    { type: "logout", version: 2 },
    { type: "login", version: 1 },
    { extra: true, type: "logout", version: 1 }
  ]) {
    hub.inject(malformed);
  }
  assert.equal(outcomes, 0);
  assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Sim");

  const forgedLogoutOnlyOutcome = { type: "logout", version: 1 };
  hub.inject(forgedLogoutOnlyOutcome);
  hub.inject(forgedLogoutOnlyOutcome);
  hub.inject(forgedLogoutOnlyOutcome);

  assert.equal(outcomes, 1);
  assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Não");
  assert.deepEqual(hub.messages, []);
  assert.deepEqual(presentation.snapshot(), {
    available: false,
    closed: true,
    failed: false,
    published: false,
    received: true
  });
  assert.deepEqual(harness.guard.requests, []);
});

test("[SESSION-LOGOUT-06] BroadcastChannel failure cannot undo a committed local 204", async (context) => {
  for (const [name, hub] of [
    ["unavailable", createBroadcastChannelHub({ failCreate: true })],
    ["publish-failure", createBroadcastChannelHub({ failPost: true })]
  ]) {
    await context.test(name, async () => {
      const run = await launchAuthoritativeStudy({
        deleteRoute: { response: { status: 204 } },
        hub
      });
      const { harness, logoutPresentation } = run;

      harness.element("Botão-Sair").dispatch("click");
      await harness.flush(30);

      assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Não");
      assert.equal(harness.navigation.at(-1), "/plataforma/login");
      assert.equal(harness.timers.size, 0);
      assert.deepEqual(hub.messages, []);
      assert.deepEqual(logoutPresentation.snapshot(), {
        available: false,
        closed: true,
        failed: true,
        published: false,
        received: false
      });
    });
  }
});

test("[SESSION-LOGOUT-07] independent credential responses remain authoritative across logout orders", async (context) => {
  await context.test("logout presentation precedes the independent login response", async () => {
    const loginResponse = deferred();
    const hub = createBroadcastChannelHub();
    const harness = createLearningPlatformHarness({
      routes: [{
        handler: async () => {
          await loginResponse.promise;
          return {
            data: sessionStatus("authenticated", ["protected-learning", "revoke-all"])
          };
        },
        method: "POST",
        path: "/plataforma_v2/login-FaceID"
      }],
      storage: { Usuário_Logado: "Sim" }
    });
    const presentation = await createBroadcastPresentation(harness, hub);
    await installLoginApplication(harness, { logoutPresentation: presentation });
    harness.dispatchWindow("load");
    harness.element("E-mail").value = "invented@example.test";
    harness.element("Senha").value = "invented-password";
    submit(harness.element("Formulário-Login"));
    await harness.flush(10);

    const publisher = await createBroadcastPresentation(harness, hub);
    publisher.listen(() => {});
    publisher.publish();
    assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Não");

    loginResponse.resolve();
    await harness.flush(40);
    assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Sim");
    assert.equal(harness.navigation.at(-1), "/plataforma/estudo");
    assert.equal(harness.guard.requests.length, 1);
    assert.equal(harness.guard.requests[0].method, "POST");
    assert.equal(harness.guard.requests.some(({ method }) => method === "DELETE"), false);
  });

  await context.test("logout presentation follows the independent login response", async () => {
    const hub = createBroadcastChannelHub();
    const harness = createLearningPlatformHarness({
      routes: [{
        method: "POST",
        path: "/plataforma_v2/login-FaceID",
        response: {
          data: sessionStatus("authenticated", ["protected-learning", "revoke-all"])
        }
      }],
      storage: { Usuário_Logado: "Não" }
    });
    const presentation = await createBroadcastPresentation(harness, hub);
    await installLoginApplication(harness, { logoutPresentation: presentation });
    harness.dispatchWindow("load");
    harness.element("E-mail").value = "invented@example.test";
    harness.element("Senha").value = "invented-password";
    submit(harness.element("Formulário-Login"));
    await harness.flush(40);
    assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Sim");
    assert.equal(harness.navigation.at(-1), "/plataforma/estudo");

    const publisher = await createBroadcastPresentation(harness, hub);
    publisher.listen(() => {});
    publisher.publish();
    assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Não");
    assert.deepEqual(harness.navigation, ["/plataforma/estudo"]);
    assert.equal(harness.guard.requests.some(({ method }) => method === "DELETE"), false);
    assert.deepEqual(hub.messages, [{ type: "logout", version: 1 }]);
  });
});

test("[SESSION-LOGOUT-08] authoritative expiry ends presentation without manufacturing DELETE or 204", async () => {
  const run = await launchAuthoritativeStudy();
  const { harness, hub, study } = run;
  const [timerId] = harness.timers.keys();
  assert.ok(timerId);

  study.advanceMonotonic(4 * 60 * 60 * 1000);
  harness.runTimer(timerId);

  assert.equal(harness.sessionStorage.getItem("Usuário_Logado"), "Não");
  assert.equal(harness.navigation.at(-1), "/plataforma/login");
  assert.equal(harness.guard.requests.some(({ method }) => method === "DELETE"), false);
  assert.deepEqual(hub.messages, []);
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.element("Container-Seções").style.display, "none");
});

test("[SESSION-LOGOUT-09] session gates storage and route scope keep authoritative logout non-active", async () => {
  for (const harness of [
    createLearningPlatformHarness({
      userAgent: "Invented unsupported browser",
      userAgentData: { brands: [{ brand: "Invented" }], mobile: false, platform: "Linux" }
    }),
    createLearningPlatformHarness({ innerWidth: 1024 })
  ]) {
    const hub = createBroadcastChannelHub();
    const presentation = await createBroadcastPresentation(harness, hub);
    await installStudyApplication(harness, { logoutPresentation: presentation });
    harness.dispatchWindow("load");
    await harness.flush(20);
    assert.equal(hub.channels.length, 0);
    assert.deepEqual(harness.guard.requests, []);
  }

  const repositoryRoot = path.join(__dirname, "..", "..");
  const sessionSource = fs.readFileSync(
    path.join(repositoryRoot, "apps", "learning-platform", "modules", "session.js"),
    "utf8"
  );
  const applicationSource = fs.readFileSync(
    path.join(
      repositoryRoot,
      "apps",
      "learning-platform",
      "modules",
      "course-content",
      "application.js"
    ),
    "utf8"
  );
  const clientSource = fs.readFileSync(
    path.join(repositoryRoot, "apps", "learning-platform", "modules", "platform-client.js"),
    "utf8"
  );
  const runtimeSources = [sessionSource, applicationSource, clientSource].join("\n");

  assert.match(sessionSource, /AUTHORITATIVE_SESSIONS_ENABLED = false/);
  assert.match(applicationSource, /client\.delete\('\/sessions\/current'\)/);
  assert.doesNotMatch(applicationSource, /client\.delete\('\/sessions'\)/);
  assert.doesNotMatch(runtimeSources, /document\.cookie/);
  assert.doesNotMatch(runtimeSources, /localStorage/);
  assert.doesNotMatch(runtimeSources, /addEventListener\(['"]storage['"]/);
  assert.match(applicationSource, /window\.addEventListener\('pageshow', guardLoggedOutLegacyStudy\)/);
  assert.match(applicationSource, /logoutControl\.addEventListener\("click", endLegacyPresentation\)/);
  assert.match(applicationSource, /session\.remove\('verifiedIndex'\)/);
  assert.match(applicationSource, /replaceNavigation\('\/plataforma\/login'\)/);

  const sessionModule = await createLearningPlatformHarness().loadModule(MODULE_PATHS.session);
  assert.equal(Object.values(sessionModule.SESSION_KEYS).length, 7);
  assert.deepEqual(Object.keys(sessionModule.LOGOUT_PRESENTATION_MESSAGE), ["type", "version"]);
  assert.deepEqual(sessionModule.LOGOUT_PRESENTATION_MESSAGE, {
    type: "logout",
    version: 1
  });
});
