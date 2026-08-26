"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadBackendOrigin() {
  const moduleSource = fs.readFileSync(
    path.join(__dirname, "..", "..", "apps", "shared", "backend-origin.js"),
    "utf8"
  );
  const executableModuleSource = moduleSource.replace(
    "export const BACKEND_ORIGIN =",
    "globalThis.BACKEND_ORIGIN ="
  );
  assert.notEqual(executableModuleSource, moduleSource, "Missing BACKEND_ORIGIN export");
  const context = vm.createContext({});
  vm.runInContext(executableModuleSource, context, {
    filename: "apps/shared/backend-origin.js"
  });
  assert.equal(typeof context.BACKEND_ORIGIN, "string");
  return context.BACKEND_ORIGIN;
}

const BACKEND_ORIGIN = loadBackendOrigin();
const applicationSource = fs.readFileSync(
  path.join(__dirname, "..", "..", "apps", "quote-request", "main.js"),
  "utf8"
);
const backendOriginImport = "import { BACKEND_ORIGIN } from '../shared/backend-origin.js';";
const source = applicationSource.replace(backendOriginImport, "");
assert.notEqual(source, applicationSource, "Missing exact shared backend-origin import");

const REQUIRED_FIELD_IDS = [
  "full-name",
  "email",
  "email-confirm",
  "phone",
  "role",
  "company-name",
  "company-cnpj",
  "participant-count"
];

function createClassList() {
  const classes = new Set();

  return {
    add(...names) {
      names.forEach((name) => classes.add(name));
    },
    contains(name) {
      return classes.has(name);
    },
    remove(...names) {
      names.forEach((name) => classes.delete(name));
    },
    toggle(name, force) {
      if (force === undefined) {
        if (classes.has(name)) {
          classes.delete(name);
          return false;
        }
        classes.add(name);
        return true;
      }

      if (force) classes.add(name);
      else classes.delete(name);
      return force;
    }
  };
}

function createHarness({
  fetchImplementation = async () => ({ ok: true, status: 200 }),
  hostname = "machadogestao.com",
  presentationError = null,
  reducedMotion = false
} = {}) {
  const elements = new Map();
  const listeners = new Map();
  const fetchCalls = [];
  const alerts = [];
  const consoleErrors = [];
  const timeoutCalls = [];
  const clearedTimeouts = [];
  let focusOptions = null;
  let scrollOptions = null;

  function createElement(id) {
    const attributes = new Map();
    const element = {
      classList: createClassList(),
      disabled: false,
      hidden: id === "email-mismatch-warning",
      textContent: "",
      validationMessage: "",
      value: "",
      addEventListener(type, listener) {
        listeners.set(`${id}:${type}`, listener);
      },
      focus(options) {
        if (id !== "form-success") return;
        if (presentationError === "focus") throw new Error("Focus unavailable");
        focusOptions = options;
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      setCustomValidity(message) {
        this.validationMessage = message;
      }
    };

    return element;
  }

  function element(id) {
    if (!elements.has(id)) elements.set(id, createElement(id));
    return elements.get(id);
  }

  const body = createElement("body");
  const form = element("quote-form");
  form.reportValidity = () => REQUIRED_FIELD_IDS.every((id) => {
    const field = element(id);
    return field.value.trim() !== "" && field.validationMessage === "";
  });

  let nextTimeoutId = 1;
  const initialHref = `https://${hostname}/solicitacao-orcamento/?origem=teste#detalhes`;
  const window = {
    location: {
      hash: "#detalhes",
      hostname,
      href: initialHref,
      pathname: "/solicitacao-orcamento/",
      search: "?origem=teste"
    },
    clearTimeout(timeoutId) {
      clearedTimeouts.push(timeoutId);
    },
    matchMedia(query) {
      assert.equal(query, "(prefers-reduced-motion: reduce)");
      return { matches: reducedMotion };
    },
    scrollTo(options) {
      if (presentationError === "scroll") throw new Error("Scroll unavailable");
      scrollOptions = options;
    },
    setTimeout(callback, delay) {
      const timeoutId = nextTimeoutId;
      nextTimeoutId += 1;
      timeoutCalls.push({ callback, delay, timeoutId });
      return timeoutId;
    }
  };

  const sandbox = {
    AbortController,
    BACKEND_ORIGIN,
    alert(message) {
      alerts.push(message);
    },
    console: {
      error(...args) {
        consoleErrors.push(args);
      }
    },
    document: {
      body,
      getElementById: element
    },
    fetch: async (url, options) => {
      fetchCalls.push({ options, url });
      return fetchImplementation(url, options);
    },
    window
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(source, context);

  function fillValidForm() {
    element("full-name").value = "Lucas Machado";
    element("email").value = "lucas@example.com";
    element("email-confirm").value = "lucas@example.com";
    element("phone").value = "(11) 98765-4321";
    element("role").value = "Diretor";
    element("company-name").value = "Empresa Exemplo";
    element("company-cnpj").value = "11.222.333/0001-81";
    element("participant-count").value = "5";
    element("notes").value = "";
  }

  function submitEvent() {
    let defaultPrevented = false;

    return {
      event: {
        preventDefault() {
          defaultPrevented = true;
        }
      },
      get defaultPrevented() {
        return defaultPrevented;
      }
    };
  }

  function dispatch(id, type) {
    const listener = listeners.get(`${id}:${type}`);
    assert.ok(listener, `Missing ${type} listener for #${id}`);
    return listener({ target: element(id) });
  }

  return {
    alerts,
    body,
    clearedTimeouts,
    consoleErrors,
    context,
    dispatch,
    element,
    fetchCalls,
    fillValidForm,
    form,
    get focusOptions() {
      return focusOptions;
    },
    initialHref,
    listeners,
    get scrollOptions() {
      return scrollOptions;
    },
    submit: listeners.get("quote-form:submit"),
    submitEvent,
    timeoutCalls,
    window
  };
}

test("pure masks and validators cover mobile input and current CNPJ formats", () => {
  const harness = createHarness();
  const {
    collapseSpaces,
    isCompletePhone,
    isValidCnpj,
    maskCnpj,
    maskPhone,
    normalizeEmail,
    toTitleCase
  } = vm.runInContext(
    "({ collapseSpaces, isCompletePhone, isValidCnpj, maskCnpj, maskPhone, normalizeEmail, toTitleCase })",
    harness.context
  );

  assert.equal(maskPhone(""), "");
  assert.equal(maskPhone("11"), "(11");
  assert.equal(maskPhone("1134567890"), "(11) 3456-7890");
  assert.equal(maskPhone("11987654321"), "(11) 98765-4321");
  assert.equal(maskPhone("(11) 98765-4321"), "(11) 98765-4321");
  assert.equal(maskPhone("11 98765-4321 extra 999"), "(11) 98765-4321");
  assert.equal(isCompletePhone("(11) 3456-7890"), true);
  assert.equal(isCompletePhone("(11) 98765-4321"), true);
  assert.equal(isCompletePhone("(11) 9876-543"), false);
  assert.equal(isCompletePhone("119876543210"), false);

  assert.equal(maskCnpj("11222333000181"), "11.222.333/0001-81");
  assert.equal(maskCnpj("12abc34501de35"), "12.ABC.345/01DE-35");
  assert.equal(maskCnpj("11222"), "11.222");
  assert.equal(maskCnpj("12abc34501de35overflow"), "12.ABC.345/01DE-35");
  assert.equal(isValidCnpj("11.222.333/0001-81"), true);
  assert.equal(isValidCnpj("33.000.167/0001-01"), true);
  assert.equal(isValidCnpj("12.ABC.345/01DE-35"), true);
  assert.equal(isValidCnpj("11.222.333/0001-82"), false);
  assert.equal(isValidCnpj("00.000.000/0000-00"), false);
  assert.equal(isValidCnpj("12.ABC.345/01DE-AB"), false);

  assert.equal(collapseSpaces("  Lucas   de   Machado  "), "Lucas de Machado");
  assert.equal(toTitleCase("  joão   da   silva  "), "João da Silva");
  assert.equal(
    toTitleCase("  CEO   de vendas ", { preserveAcronyms: true }),
    "CEO de Vendas"
  );
  assert.equal(
    toTitleCase("diretor de P&D", { preserveAcronyms: true }),
    "Diretor de P&D"
  );
  assert.equal(
    toTitleCase("CEO/CFO", { preserveAcronyms: true }),
    "CEO/CFO"
  );
  assert.equal(
    toTitleCase("head B2B", { preserveAcronyms: true }),
    "Head B2B"
  );
  assert.equal(toTitleCase("mariana McDonald"), "Mariana McDonald");
  assert.equal(normalizeEmail(" LUCAS@EXAMPLE.COM "), "lucas@example.com");
  assert.equal(normalizeEmail(" LUCAS @EXAMPLE.COM "), "lucas @example.com");
});

test("valid production submission sends the exact normalized payload and presents success", async () => {
  const harness = createHarness();
  harness.fillValidForm();
  harness.element("full-name").value = "  lucas   de   machado  ";
  harness.element("email").value = " LUCAS@EXAMPLE.COM ";
  harness.element("email-confirm").value = " LUCAS@example.com ";
  harness.element("phone").value = "11987654321";
  harness.element("role").value = "  CEO   de vendas ";
  harness.element("company-name").value = "  iFood   LTDA ";
  harness.element("company-cnpj").value = "11222333000181";
  harness.element("participant-count").value = ">20";
  harness.element("notes").value = "  Linha  1\n\nLinha 2  ";
  const event = harness.submitEvent();

  await harness.submit(event.event);

  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.fetchCalls.length, 1);
  const [{ options, url }] = harness.fetchCalls;
  assert.equal(
    url,
    `${BACKEND_ORIGIN}/landingpage/solicitacaoorcamento`
  );
  assert.equal(options.method, "POST");
  assert.deepEqual({ ...options.headers }, { "Content-Type": "application/json" });
  assert.equal(typeof options.signal.aborted, "boolean");
  assert.deepEqual(JSON.parse(options.body), {
    Solicitante_NomeCompleto: "Lucas de Machado",
    Solicitante_Email: "lucas@example.com",
    Solicitante_Telefone: "(11) 98765-4321",
    Solicitante_Cargo: "CEO de Vendas",
    Solicitante_NomeEmpresa: "iFood LTDA",
    Solicitante_CNPJ: "11.222.333/0001-81",
    Solicitante_NúmerodeParticipantes: ">20",
    Solicitante_Observações: "Linha  1\n\nLinha 2"
  });
  assert.equal(harness.alerts.length, 0);
  assert.equal(harness.body.classList.contains("is-submitting"), false);
  assert.equal(harness.form.getAttribute("aria-busy"), "false");
  assert.equal(harness.element("submit-button").disabled, false);
  assert.equal(harness.element("submit-label").textContent, "SOLICITAR ORÇAMENTO");
  assert.equal(harness.form.classList.contains("quote-form--submitted"), true);
  assert.equal(harness.focusOptions.preventScroll, true);
  assert.equal(harness.scrollOptions.top, 0);
  assert.equal(harness.scrollOptions.behavior, "smooth");
  assert.equal(harness.window.location.href, harness.initialHref);
  assert.equal(harness.timeoutCalls[0].delay, 60000);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test("localhost, loopback, preview, and production pages use the same production endpoint", async () => {
  for (const hostname of [
    "localhost",
    "127.0.0.1",
    "[::1]",
    "feature-preview.azurestaticapps.net",
    "machadogestao.com"
  ]) {
    const harness = createHarness({ hostname });
    harness.fillValidForm();
    const event = harness.submitEvent();

    await harness.submit(event.event);

    assert.equal(event.defaultPrevented, true, hostname);
    assert.equal(harness.fetchCalls.length, 1, hostname);
    assert.equal(
      harness.fetchCalls[0].url,
      `${BACKEND_ORIGIN}/landingpage/solicitacaoorcamento`,
      hostname
    );
  }
});

test("text fields normalize only after editing finishes", () => {
  const harness = createHarness();
  harness.element("full-name").value = "  joão   da   silva  ";
  harness.element("email").value = " LUCAS@EXAMPLE.COM ";
  harness.element("email-confirm").value = " lucas@example.com ";
  harness.element("role").value = "  CEO   de vendas ";
  harness.element("company-name").value = "  iFood   LTDA ";
  harness.element("notes").value = "  Linha  1\n\nLinha 2  ";

  for (const id of ["full-name", "role", "company-name", "notes"]) {
    assert.equal(harness.listeners.has(`${id}:input`), false, id);
  }
  assert.equal(harness.element("full-name").value, "  joão   da   silva  ");
  harness.dispatch("email", "input");
  harness.dispatch("email-confirm", "input");
  assert.equal(harness.element("email").value, " LUCAS@EXAMPLE.COM ");
  assert.equal(harness.element("email-confirm").value, " lucas@example.com ");

  harness.dispatch("full-name", "blur");
  harness.dispatch("email", "blur");
  harness.dispatch("role", "blur");
  harness.dispatch("company-name", "blur");
  harness.dispatch("notes", "blur");

  assert.equal(harness.element("full-name").value, "João da Silva");
  assert.equal(harness.element("email").value, "lucas@example.com");
  assert.equal(harness.element("email-confirm").value, "lucas@example.com");
  assert.equal(harness.element("role").value, "CEO de Vendas");
  assert.equal(harness.element("company-name").value, "iFood LTDA");
  assert.equal(harness.element("notes").value, "Linha  1\n\nLinha 2");
});

test("email mismatch warning waits for blur and clears on the next edit", () => {
  const harness = createHarness();
  harness.element("email").value = "lucas@example.com";
  harness.element("email-confirm").value = "outro@example.com";

  harness.dispatch("email-confirm", "input");

  assert.equal(harness.element("email-mismatch-warning").hidden, true);
  assert.equal(harness.element("email-confirm").validationMessage, "");
  assert.equal(harness.element("email-confirm").getAttribute("aria-invalid"), "false");

  harness.dispatch("email-confirm", "blur");

  assert.equal(harness.element("email-mismatch-warning").hidden, false);
  assert.equal(harness.element("email-confirm").validationMessage, "E-mails divergentes.");
  assert.equal(harness.element("email-confirm").getAttribute("aria-invalid"), "true");

  harness.element("email-confirm").value = "lucas@";
  harness.dispatch("email-confirm", "input");

  assert.equal(harness.element("email-mismatch-warning").hidden, true);
  assert.equal(harness.element("email-confirm").validationMessage, "");
  assert.equal(harness.element("email-confirm").getAttribute("aria-invalid"), "false");
});

test("phone and CNPJ masks stay live while validation waits for blur", () => {
  const harness = createHarness();
  harness.element("phone").value = "1198";
  harness.element("company-cnpj").value = "11222";

  harness.dispatch("phone", "input");
  harness.dispatch("company-cnpj", "input");

  assert.equal(harness.element("phone").value, "(11) 98");
  assert.equal(harness.element("company-cnpj").value, "11.222");
  assert.equal(harness.element("phone").validationMessage, "");
  assert.equal(harness.element("company-cnpj").validationMessage, "");

  harness.dispatch("phone", "blur");
  harness.dispatch("company-cnpj", "blur");

  assert.equal(harness.element("phone").validationMessage, "Informe um telefone com DDD válido.");
  assert.equal(harness.element("company-cnpj").validationMessage, "Informe um CNPJ válido.");

  harness.element("phone").value = "11987654321";
  harness.element("company-cnpj").value = "11222333000181";
  harness.dispatch("phone", "input");
  harness.dispatch("company-cnpj", "input");

  assert.equal(harness.element("phone").validationMessage, "");
  assert.equal(harness.element("company-cnpj").validationMessage, "");
});

test("mismatched emails block submission and expose an accessible warning", async () => {
  const harness = createHarness();
  harness.fillValidForm();
  harness.element("email-confirm").value = "outro@example.com";
  const event = harness.submitEvent();

  await harness.submit(event.event);

  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.fetchCalls.length, 0);
  assert.equal(harness.element("email-mismatch-warning").hidden, false);
  assert.equal(harness.element("email-confirm").validationMessage, "E-mails divergentes.");
  assert.equal(harness.element("email-confirm").getAttribute("aria-invalid"), "true");
  assert.equal(harness.body.classList.contains("is-submitting"), false);
  assert.equal(harness.element("submit-button").disabled, false);
});

test("duplicate submits are prevented while the first request is pending", async () => {
  let resolveResponse;
  const pendingResponse = new Promise((resolve) => {
    resolveResponse = resolve;
  });
  const harness = createHarness({
    fetchImplementation: () => pendingResponse
  });
  harness.fillValidForm();
  const firstEvent = harness.submitEvent();
  const secondEvent = harness.submitEvent();

  const firstSubmission = harness.submit(firstEvent.event);
  const secondSubmission = harness.submit(secondEvent.event);

  assert.equal(firstEvent.defaultPrevented, true);
  assert.equal(secondEvent.defaultPrevented, true);
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.body.classList.contains("is-submitting"), true);
  assert.equal(harness.form.getAttribute("aria-busy"), "true");
  assert.equal(harness.element("submit-button").disabled, true);
  assert.equal(harness.element("submit-button").getAttribute("aria-busy"), "true");
  assert.equal(harness.element("submit-label").textContent, "Processando informações...");
  assert.equal(harness.element("submission-status").textContent, "Processando informações...");

  resolveResponse({ ok: true, status: 200 });
  await Promise.all([firstSubmission, secondSubmission]);

  assert.equal(harness.body.classList.contains("is-submitting"), false);
  assert.equal(harness.element("submission-status").textContent, "");
  assert.equal(harness.form.classList.contains("quote-form--submitted"), true);
});

test("failed submission restores controls and preserves the completed form", async () => {
  const harness = createHarness({
    fetchImplementation: async () => ({ ok: false, status: 500 })
  });
  harness.fillValidForm();
  harness.element("notes").value = "  Não apagar estes dados.  ";
  const event = harness.submitEvent();

  await harness.submit(event.event);

  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.body.classList.contains("is-submitting"), false);
  assert.equal(harness.form.getAttribute("aria-busy"), "false");
  assert.equal(harness.element("submit-button").disabled, false);
  assert.equal(harness.element("submit-button").getAttribute("aria-busy"), "false");
  assert.equal(harness.element("submit-label").textContent, "SOLICITAR ORÇAMENTO");
  assert.equal(harness.element("submission-status").textContent, "");
  assert.equal(harness.form.classList.contains("quote-form--submitted"), false);
  assert.equal(harness.element("notes").value, "Não apagar estes dados.");
  assert.equal(harness.focusOptions, null);
  assert.equal(harness.scrollOptions, null);
  assert.equal(harness.consoleErrors.length, 1);
  assert.deepEqual(harness.alerts, [
    "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."
  ]);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test("timed-out submission aborts the request and restores controls", async () => {
  const harness = createHarness({
    fetchImplementation: async (_url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("Aborted")));
    })
  });
  harness.fillValidForm();
  const event = harness.submitEvent();
  const submission = harness.submit(event.event);

  assert.equal(harness.timeoutCalls.length, 1);
  assert.equal(harness.timeoutCalls[0].delay, 60000);
  harness.timeoutCalls[0].callback();
  await submission;

  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(harness.body.classList.contains("is-submitting"), false);
  assert.equal(harness.form.getAttribute("aria-busy"), "false");
  assert.equal(harness.element("submit-button").disabled, false);
  assert.equal(harness.element("submit-label").textContent, "SOLICITAR ORÇAMENTO");
  assert.equal(harness.element("submission-status").textContent, "");
  assert.equal(harness.form.classList.contains("quote-form--submitted"), false);
  assert.equal(harness.consoleErrors.length, 1);
  assert.deepEqual(harness.alerts, [
    "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."
  ]);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});
