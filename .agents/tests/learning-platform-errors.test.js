"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  installHostNetworkGuard,
  loadPlatformModule
} = require("./helpers/learning-platform-harness.js");

const repositoryRoot = path.join(__dirname, "..", "..");
const platformRoot = path.join(repositoryRoot, "apps", "learning-platform");
const adapterModulePath = "apps/learning-platform/modules/error-adapter.js";
const presentationModulePath = "apps/learning-platform/modules/error-presentation.js";

const backendErrorDefinitions = [
  {
    kindKey: "PLATFORM_DATA_READ_FAILURE",
    named: "learning_platform.read_platform_data_failed",
    operationKeys: ["LOGIN", "REFRESH", "STATUS_REPORT"],
    retiredAlias: "Erro_001"
  },
  {
    kindKey: "REFERENCE_PHOTO_UPLOAD_FAILURE",
    named: "learning_platform.upload_reference_photo_failed",
    operationKeys: ["REGISTRATION"],
    retiredAlias: "Erro_002"
  },
  {
    kindKey: "REFERENCE_PHOTO_REGISTRATION_UPDATE_FAILURE",
    named: "learning_platform.update_reference_photo_registration_failed",
    operationKeys: ["REGISTRATION"],
    retiredAlias: "Erro_003"
  },
  {
    kindKey: "FACE_LIVENESS_SESSION_CREATION_FAILURE",
    named: "learning_platform.create_face_liveness_session_failed",
    operationKeys: ["FACE_SESSION", "REGISTRATION"],
    retiredAlias: "Erro_004"
  },
  {
    kindKey: "REFERENCE_PHOTO_READ_FAILURE",
    named: "learning_platform.read_reference_photo_failed",
    operationKeys: ["FACE_SESSION"],
    retiredAlias: "Erro_005"
  },
  {
    kindKey: "FACE_LIVENESS_RESULT_READ_FAILURE",
    named: "learning_platform.read_face_liveness_result_failed",
    operationKeys: ["FACE_RESULT"],
    retiredAlias: "Erro_007"
  },
  {
    kindKey: "PLATFORM_DATA_WRITE_FAILURE",
    named: "learning_platform.update_platform_data_failed",
    operationKeys: ["ASSESSMENT_UPDATE", "FEEDBACK", "PROGRESS_UPDATE"],
    retiredAlias: "Erro_008"
  },
  {
    kindKey: "FEEDBACK_APPEND_FAILURE",
    named: "learning_platform.append_feedback_failed",
    operationKeys: ["FEEDBACK"],
    retiredAlias: "Erro_009"
  }
];

const retiredMachineAliases = [
  ...backendErrorDefinitions.map(({ retiredAlias }) => retiredAlias),
  "Erro_000",
  "Erro_006"
];

const expectedKinds = {
  APPLICATION_FAILURE: "applicationFailure",
  FACE_COMPONENT_FAILURE: "faceComponentFailure",
  FACE_LIVENESS_RESULT_READ_FAILURE: "faceLivenessResultReadFailure",
  FACE_LIVENESS_SESSION_CREATION_FAILURE: "faceLivenessSessionCreationFailure",
  FEEDBACK_APPEND_FAILURE: "feedbackAppendFailure",
  HTTP_FAILURE: "httpFailure",
  INVALID_CREDENTIALS: "invalidCredentials",
  MALFORMED_RESPONSE: "malformedResponse",
  PLATFORM_DATA_READ_FAILURE: "platformDataReadFailure",
  PLATFORM_DATA_WRITE_FAILURE: "platformDataWriteFailure",
  REFERENCE_PHOTO_READ_FAILURE: "referencePhotoReadFailure",
  REFERENCE_PHOTO_REGISTRATION_UPDATE_FAILURE: "referencePhotoRegistrationUpdateFailure",
  REFERENCE_PHOTO_UPLOAD_FAILURE: "referencePhotoUploadFailure",
  TRANSPORT_FAILURE: "transportFailure",
  UNKNOWN_DOMAIN_FAILURE: "unknownDomainFailure"
};

const expectedOperations = {
  ASSESSMENT_UPDATE: "assessmentUpdate",
  FACE_RESULT: "faceResult",
  FACE_SESSION: "faceSession",
  FEEDBACK: "feedback",
  LOGIN: "login",
  PROGRESS_UPDATE: "progressUpdate",
  REFRESH: "refresh",
  REGISTRATION: "registration",
  STATUS_REPORT: "statusReport"
};

const expectedOwners = {
  BACKEND: "backend",
  FRONTEND: "frontend",
  UNKNOWN: "unknown"
};

const expectedPresentationExports = {
  FEEDBACK_APPEND: "feedbackAppend",
  GENERIC_SERVER_RETRY: "genericServerRetry",
  LOGIN_FACE_COMPONENT: "loginFaceComponent",
  LOGIN_FACE_RESULT: "loginFaceResult",
  LOGIN_FACE_SESSION: "loginFaceSession",
  LOGIN_FACE_SESSION_GENERIC: "loginFaceSessionGeneric",
  LOGIN_REFERENCE_PHOTO: "loginReferencePhoto",
  PLATFORM_DATA_RETRY: "platformDataRetry",
  PLATFORM_DATA_WRITE: "platformDataWrite",
  REGISTRATION_FACE_COMPONENT: "registrationFaceComponent",
  REGISTRATION_FACE_RESULT: "registrationFaceResult",
  REGISTRATION_FACE_RESULT_GENERIC: "registrationFaceResultGeneric",
  REGISTRATION_FACE_SESSION: "registrationFaceSession",
  REGISTRATION_PHOTO_REGISTRATION_UPDATE: "registrationPhotoRegistrationUpdate",
  REGISTRATION_PHOTO_UPLOAD: "registrationPhotoUpload",
  REGISTRATION_REQUEST_GENERIC: "registrationRequestGeneric",
  STUDY_REFRESH_GENERIC: "studyRefreshGeneric",
  STUDY_REFRESH_PLATFORM_DATA: "studyRefreshPlatformData"
};

const expectedMessages = {
  feedbackAppend: "Erro_009: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.",
  genericServerRetry: "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.",
  loginFaceComponent: "Erro_006: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.",
  loginFaceResult: "Erro_007: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.",
  loginFaceSession: "Erro_004: falha interna do sistema da Microsoft (Azure Face API).\nTente novamente.",
  loginFaceSessionGeneric: "Erro_000: Verifique sua conexão com a internet.",
  loginReferencePhoto: "Erro_005: falha ao obter sua foto de referência.\nTente novamente.",
  platformDataRetry: "Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nTente novamente.",
  platformDataWrite: "Erro_008: falha ao atualizar a base de dados de controle da plataforma.\nTente novamente.",
  registrationFaceComponent: "Erro_006. Aguarde 2min e tente novamente.",
  registrationFaceResult: "Erro_007. Tente novamente.",
  registrationFaceResultGeneric: "Erro_000. Tente novamente.",
  registrationFaceSession: "Erro_004. Tente novamente.",
  registrationPhotoRegistrationUpdate: "Erro_003. Tente novamente.",
  registrationPhotoUpload: "Erro_002. Tente novamente.",
  registrationRequestGeneric: "Erro_000. Verifique sua conexão com a internet.",
  studyRefreshGeneric: "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e então atualize a página.",
  studyRefreshPlatformData: "Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nAtualize a página."
};

let adapter;
let presentation;

test.before(async () => {
  [adapter, presentation] = await Promise.all([
    loadPlatformModule(adapterModulePath),
    loadPlatformModule(presentationModulePath)
  ]);
});

test.after(() => {
  installHostNetworkGuard().assertUnused();
});

function assertNormalized(actual, { kind, owner, status }) {
  assert.deepEqual(actual, { kind, owner, status });
  assert.equal(Object.isFrozen(actual), true);
  assert.deepEqual(Object.keys(actual), ["kind", "owner", "status"]);
  assert.equal(Object.hasOwn(actual, "error"), false);
}

function regularJavaScriptFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return regularJavaScriptFiles(entryPath);
      return entry.isFile() && path.extname(entry.name) === ".js" ? [entryPath] : [];
    });
}

function productionSources() {
  return regularJavaScriptFiles(platformRoot).map((filePath) => ({
    relativePath: path.relative(platformRoot, filePath).split(path.sep).join("/"),
    source: fs.readFileSync(filePath, "utf8")
  }));
}

test("[ERROR-01] error vocabulary exports remain exact, stable, and frozen", () => {
  assert.deepEqual(adapter.learningPlatformErrorKinds, expectedKinds);
  assert.deepEqual(adapter.learningPlatformErrorOperations, expectedOperations);
  assert.deepEqual(adapter.learningPlatformErrorOwners, expectedOwners);
  assert.deepEqual(
    adapter.learningPlatformBackendErrorValues,
    Object.fromEntries(
      backendErrorDefinitions.map(({ kindKey, named }) => [kindKey, named])
    )
  );
  for (const value of [
    adapter.learningPlatformErrorKinds,
    adapter.learningPlatformErrorOperations,
    adapter.learningPlatformErrorOwners,
    adapter.learningPlatformBackendErrorValues
  ]) {
    assert.equal(Object.isFrozen(value), true);
  }
});

test("[ERROR-01] every named backend value preserves kind, owner, status, and operation scope", () => {
  const allOperations = Object.values(adapter.learningPlatformErrorOperations);

  for (const definition of backendErrorDefinitions) {
    const expectedKind = adapter.learningPlatformErrorKinds[definition.kindKey];
    const allowedOperations = new Set(
      definition.operationKeys.map(
        (operationKey) => adapter.learningPlatformErrorOperations[operationKey]
      )
    );

    for (const operation of allOperations) {
      const failure = adapter.normalizeLearningPlatformError(
        { status: 500, error: definition.named },
        operation
      );

      if (allowedOperations.has(operation)) {
        assertNormalized(failure, {
          kind: expectedKind,
          owner: adapter.learningPlatformErrorOwners.BACKEND,
          status: 500
        });
      } else {
        assertNormalized(failure, {
          kind: adapter.learningPlatformErrorKinds.UNKNOWN_DOMAIN_FAILURE,
          owner: adapter.learningPlatformErrorOwners.UNKNOWN,
          status: 500
        });
      }
    }

    assertNormalized(
      adapter.normalizeLearningPlatformError(
        { status: 500, error: definition.named },
        undefined
      ),
      {
        kind: adapter.learningPlatformErrorKinds.UNKNOWN_DOMAIN_FAILURE,
        owner: adapter.learningPlatformErrorOwners.UNKNOWN,
        status: 500
      }
    );
  }
});

test("[ERROR-01] every retired numbered machine alias is an unknown domain failure", () => {
  const operations = [
    ...Object.values(adapter.learningPlatformErrorOperations),
    undefined
  ];

  for (const machineValue of retiredMachineAliases) {
    for (const operation of operations) {
      assertNormalized(
        adapter.normalizeLearningPlatformError(
          { status: 500, error: machineValue },
          operation
        ),
        {
          kind: adapter.learningPlatformErrorKinds.UNKNOWN_DOMAIN_FAILURE,
          owner: adapter.learningPlatformErrorOwners.UNKNOWN,
          status: 500
        }
      );
    }
  }
});

test("[ERROR-01] login 401 precedence and protected 401 generic treatment remain distinct", () => {
  const backendValues = backendErrorDefinitions.map(({ named }) => named);
  for (const machineValue of [
    ...backendValues,
    ...retiredMachineAliases,
    "learning_platform.application_failed",
    undefined
  ]) {
    const failure = adapter.normalizeLearningPlatformError(
      machineValue === undefined
        ? { status: 401 }
        : { status: 401, error: machineValue },
      adapter.learningPlatformErrorOperations.LOGIN
    );
    assertNormalized(failure, {
      kind: adapter.learningPlatformErrorKinds.INVALID_CREDENTIALS,
      owner: adapter.learningPlatformErrorOwners.BACKEND,
      status: 401
    });
  }

  for (const operation of Object.values(adapter.learningPlatformErrorOperations)) {
    if (operation === adapter.learningPlatformErrorOperations.LOGIN) continue;
    assertNormalized(
      adapter.normalizeLearningPlatformError({ status: 401 }, operation),
      {
        kind: adapter.learningPlatformErrorKinds.HTTP_FAILURE,
        owner: adapter.learningPlatformErrorOwners.FRONTEND,
        status: 401
      }
    );
  }
});

test("[ERROR-01] transport, malformed, HTTP, unknown, application, and local failures normalize idempotently", () => {
  const failures = [
    adapter.normalizeLearningPlatformTransportError(
      new TypeError("Synthetic transport failure")
    ),
    adapter.normalizeLearningPlatformMalformedResponse(
      new SyntaxError("Synthetic malformed response")
    ),
    adapter.normalizeLearningPlatformError(
      { status: 503 },
      adapter.learningPlatformErrorOperations.REFRESH
    ),
    adapter.normalizeLearningPlatformError(
      { status: 500, error: "learning_platform.unrecognized_failure" },
      adapter.learningPlatformErrorOperations.REFRESH
    ),
    adapter.normalizeLearningPlatformError(
      new TypeError("Synthetic application failure"),
      adapter.learningPlatformErrorOperations.REFRESH
    ),
    adapter.normalizeLearningPlatformLocalError(
      new Error("Synthetic explicit local application failure"),
      adapter.learningPlatformErrorKinds.APPLICATION_FAILURE
    ),
    adapter.normalizeLearningPlatformLocalError(
      new Error("Synthetic local Face failure"),
      adapter.learningPlatformErrorKinds.FACE_COMPONENT_FAILURE
    )
  ];
  const expected = [
    {
      kind: adapter.learningPlatformErrorKinds.TRANSPORT_FAILURE,
      owner: adapter.learningPlatformErrorOwners.FRONTEND,
      status: undefined
    },
    {
      kind: adapter.learningPlatformErrorKinds.MALFORMED_RESPONSE,
      owner: adapter.learningPlatformErrorOwners.FRONTEND,
      status: undefined
    },
    {
      kind: adapter.learningPlatformErrorKinds.HTTP_FAILURE,
      owner: adapter.learningPlatformErrorOwners.FRONTEND,
      status: 503
    },
    {
      kind: adapter.learningPlatformErrorKinds.UNKNOWN_DOMAIN_FAILURE,
      owner: adapter.learningPlatformErrorOwners.UNKNOWN,
      status: 500
    },
    {
      kind: adapter.learningPlatformErrorKinds.APPLICATION_FAILURE,
      owner: adapter.learningPlatformErrorOwners.FRONTEND,
      status: undefined
    },
    {
      kind: adapter.learningPlatformErrorKinds.APPLICATION_FAILURE,
      owner: adapter.learningPlatformErrorOwners.FRONTEND,
      status: undefined
    },
    {
      kind: adapter.learningPlatformErrorKinds.FACE_COMPONENT_FAILURE,
      owner: adapter.learningPlatformErrorOwners.FRONTEND,
      status: undefined
    }
  ];

  failures.forEach((failure, index) => {
    assertNormalized(failure, expected[index]);
    assert.strictEqual(
      adapter.normalizeLearningPlatformError(
        failure,
        adapter.learningPlatformErrorOperations.LOGIN
      ),
      failure
    );
  });

  assert.throws(
    () => adapter.normalizeLearningPlatformLocalError(
      new Error("Synthetic unsupported local failure"),
      adapter.learningPlatformErrorKinds.PLATFORM_DATA_READ_FAILURE
    ),
    {
      message: "Unsupported learning-platform local error kind",
      name: "TypeError"
    }
  );
});

test("[ERROR-01] presentation catalog preserves all eighteen exact visible outcomes", () => {
  assert.deepEqual(
    presentation.learningPlatformErrorPresentations,
    expectedPresentationExports
  );
  assert.equal(Object.isFrozen(presentation.learningPlatformErrorPresentations), true);

  const renderedMessages = Object.values(
    presentation.learningPlatformErrorPresentations
  ).map((presentationName) => {
    const message = presentation.learningPlatformErrorMessage(presentationName);
    assert.equal(message, expectedMessages[presentationName]);
    return message;
  });
  assert.equal(renderedMessages.length, 18);
  assert.equal(new Set(renderedMessages).size, 18);

  for (const backendValue of Object.values(adapter.learningPlatformBackendErrorValues)) {
    assert.equal(renderedMessages.some((message) => message.includes(backendValue)), false);
  }
  assert.throws(
    () => presentation.learningPlatformErrorMessage("unknownPresentation"),
    {
      message: "Unknown learning-platform error presentation",
      name: "TypeError"
    }
  );
});

test("[ERROR-01] numbered machine aliases are absent while visible prefixes and backend values stay quarantined", () => {
  const sources = productionSources();
  const machineAliases = [];
  const visiblePrefixes = [];
  const backendValues = [];

  for (const { relativePath, source } of sources) {
    for (const match of source.matchAll(/Erro_00\d/g)) {
      const nextCharacter = source[match.index + match[0].length];
      const occurrence = { relativePath, value: match[0] };
      if (nextCharacter === ":" || nextCharacter === ".") {
        visiblePrefixes.push(occurrence);
      } else {
        machineAliases.push(occurrence);
      }
    }
    for (const match of source.matchAll(/learning_platform\.[a-z0-9_]+/g)) {
      backendValues.push({ relativePath, value: match[0] });
    }
  }

  assert.deepEqual(machineAliases, []);
  assert.deepEqual(
    [...new Set(visiblePrefixes.map(({ relativePath }) => relativePath))],
    ["modules/error-presentation.js"]
  );
  assert.equal(visiblePrefixes.length, 18);
  assert.deepEqual(
    backendValues.map(({ relativePath }) => relativePath),
    Array(backendErrorDefinitions.length).fill("modules/error-adapter.js")
  );
  assert.deepEqual(
    backendValues.map(({ value }) => value).sort(),
    backendErrorDefinitions.map(({ named }) => named).sort()
  );

  const adapterSource = sources.find(
    ({ relativePath }) => relativePath === "modules/error-adapter.js"
  ).source;
  assert.doesNotMatch(
    adapterSource,
    /\b(?:alert|showAlert)\s*\(|console\.(?:error|log|warn)\s*\(|\.(?:innerHTML|textContent)\s*=/
  );

  const nonAdapterSources = sources.filter(
    ({ relativePath }) => relativePath !== "modules/error-adapter.js"
  );
  for (const { relativePath, source } of nonAdapterSources) {
    assert.equal(
      /learning_platform\.[a-z0-9_]+/.test(source),
      false,
      `${relativePath} must not contain a learning-platform backend error value`
    );
    assert.equal(
      source.includes("learningPlatformBackendErrorValues"),
      false,
      `${relativePath} must not import or render backend error values`
    );
  }
});
