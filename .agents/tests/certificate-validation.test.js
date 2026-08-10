"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "..", "apps", "certificate-validation", "main.js"),
  "utf8"
);

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
  fetchImplementation = async () => ({
    json: async () => ({ Certificado_Válido: false }),
    ok: true
  }),
  hostname = "machadogestao.com"
} = {}) {
  const listeners = new Map();
  const fetchCalls = [];
  const alerts = [];
  const timeoutCalls = [];
  const clearedTimeouts = [];
  const innerHtmlWrites = [];
  let nextTimeoutId = 1;

  function createElement(label) {
    const attributes = new Map();
    let children = [];
    let innerHtml = "";
    const element = {
      classList: createClassList(),
      className: "",
      disabled: false,
      hidden: label === "validation-result",
      textContent: "",
      value: "",
      addEventListener(type, listener) {
        listeners.set(`${label}:${type}`, listener);
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      replaceChildren(...newChildren) {
        children = newChildren;
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
      }
    };

    Object.defineProperties(element, {
      children: {
        get() {
          return [...children];
        }
      },
      innerHTML: {
        get() {
          return innerHtml;
        },
        set(value) {
          innerHtml = String(value);
          innerHtmlWrites.push({ label, value: innerHtml });
        }
      }
    });

    return element;
  }

  const body = createElement("body");
  const form = createElement("validator-form");
  const input = createElement("certificate-id");
  const button = createElement("validate-button");
  const result = createElement("validation-result");

  const sandbox = {
    AbortController,
    alert(message) {
      alerts.push(message);
    },
    clearTimeout(timeoutId) {
      clearedTimeouts.push(timeoutId);
    },
    document: {
      body,
      createElement(tagName) {
        return createElement(tagName);
      },
      getElementById(id) {
        if (id === "certificate-id") return input;
        if (id === "validation-result") return result;
        assert.fail(`Unexpected element ID: ${id}`);
      },
      querySelector(selector) {
        if (selector === ".validator-form") return form;
        if (selector === ".validate-button") return button;
        assert.fail(`Unexpected selector: ${selector}`);
      }
    },
    fetch(url, options) {
      fetchCalls.push({ options, url });
      return fetchImplementation(url, options);
    },
    location: { hostname },
    setTimeout(callback, delay) {
      const timeoutId = nextTimeoutId;
      nextTimeoutId += 1;
      timeoutCalls.push({ callback, delay, timeoutId });
      return timeoutId;
    }
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(source, context);

  function dispatch(label, type, event = {}) {
    const listener = listeners.get(`${label}:${type}`);
    assert.ok(listener, `Missing ${type} listener for ${label}`);
    return listener(event);
  }

  function submit() {
    let defaultPrevented = false;
    dispatch("validator-form", "submit", {
      preventDefault() {
        defaultPrevented = true;
      }
    });
    return defaultPrevented;
  }

  return {
    alerts,
    body,
    button,
    clearedTimeouts,
    context,
    dispatch,
    fetchCalls,
    form,
    innerHtmlWrites,
    input,
    result,
    submit,
    timeoutCalls
  };
}

function flushAsyncWork() {
  return new Promise((resolve) => setImmediate(resolve));
}

test("local previews use the isolated endpoint and URL-encode certificate IDs", async () => {
  for (const hostname of ["localhost", "127.0.0.1"]) {
    const harness = createHarness({ hostname });
    harness.input.value = "  fmg/2026 ?á#1  ";

    harness.dispatch("certificate-id", "input", { target: harness.input });
    assert.equal(harness.input.value, "FMG/2026 ?Á#1");
    assert.equal(harness.submit(), true);
    await flushAsyncWork();

    assert.equal(harness.fetchCalls.length, 1, hostname);
    const [{ options, url }] = harness.fetchCalls;
    assert.equal(
      url,
      "http://localhost:3000/validacaocertificados/FMG%2F2026%20%3F%C3%81%231",
      hostname
    );
    assert.equal(options.method, "GET", hostname);
    assert.equal(options.signal.aborted, false, hostname);
    assert.equal(url.includes("plataforma-backend-v3.azurewebsites.net"), false, hostname);
  }
});

test("production requests keep the exact endpoint while fetch remains stubbed", async () => {
  const harness = createHarness({ hostname: "machadogestao.com" });
  harness.input.value = " fmg-1234/ab ";

  assert.equal(harness.submit(), true);
  await flushAsyncWork();

  assert.equal(harness.input.value, " fmg-1234/ab ");
  assert.equal(harness.fetchCalls.length, 1);
  assert.equal(
    harness.fetchCalls[0].url,
    "https://plataforma-backend-v3.azurewebsites.net/validacaocertificados/FMG-1234%2FAB"
  );
});

test("valid certificates render only public-safe values as text", async () => {
  const holderName = '<img src=x onerror="globalThis.compromised=true">';
  const privateValues = [
    "private@example.com",
    "529.982.247-25",
    "Rua Privada, 100",
    "+55 11 99999-9999",
    "Empresa Privada Ltda."
  ];
  const harness = createHarness({
    hostname: "localhost",
    fetchImplementation: async () => ({
      json: async () => ({
        Acumulado_Percentual: 97.5,
        Certificado_Válido: true,
        Solicitante_CertificadoID: "FMG-2026-0001",
        Titular_CPF: privateValues[1],
        Titular_Email: privateValues[0],
        Titular_Endereço: privateValues[2],
        Titular_Empresa: privateValues[4],
        Titular_NomeCompleto: holderName,
        Titular_Telefone: privateValues[3]
      }),
      ok: true
    })
  });
  harness.input.value = "fmg-2026-0001";

  assert.equal(harness.submit(), true);
  await flushAsyncWork();

  assert.equal(harness.result.hidden, false);
  assert.equal(
    harness.result.className,
    "validation-result validation-result--valid"
  );
  assert.deepEqual(
    harness.result.children.map(({ className, textContent }) => ({ className, textContent })),
    [
      { className: "result-headline", textContent: "✓ Certificado Válido" },
      { className: "result-name", textContent: holderName },
      { className: "result-detail", textContent: "Nota Acumulada: 97.5%" }
    ]
  );
  assert.deepEqual(harness.innerHtmlWrites, []);
  assert.equal(vm.runInContext("globalThis.compromised", harness.context), undefined);

  const publicSurface = [
    harness.input.value.trim().toUpperCase(),
    ...harness.result.children.map((line) => line.textContent)
  ].join("\n");
  assert.match(publicSurface, /FMG-2026-0001/);
  assert.match(publicSurface, /97\.5%/);
  assert.match(publicSurface, /<img src=x/);
  for (const privateValue of privateValues) {
    assert.equal(publicSurface.includes(privateValue), false, privateValue);
  }
});

test("invalid certificates show the public verdict without response details", async () => {
  const harness = createHarness({
    fetchImplementation: async () => ({
      json: async () => ({
        Certificado_Válido: false,
        Titular_CPF: "529.982.247-25",
        Titular_Email: "private@example.com",
        Titular_Endereço: "Rua Privada, 100",
        Titular_NomeCompleto: "Nome que não deve aparecer"
      }),
      ok: true
    })
  });
  harness.input.value = "FMG-INEXISTENTE";

  harness.submit();
  await flushAsyncWork();

  assert.equal(harness.result.hidden, false);
  assert.equal(
    harness.result.className,
    "validation-result validation-result--invalid"
  );
  assert.deepEqual(
    harness.result.children.map((line) => line.textContent),
    [
      "✗ Certificado não encontrado",
      "Confira o Certificado ID# digitado e tente novamente."
    ]
  );
  const resultText = harness.result.children.map((line) => line.textContent).join("\n");
  assert.equal(resultText.includes("private@example.com"), false);
  assert.equal(resultText.includes("529.982.247-25"), false);
  assert.equal(resultText.includes("Rua Privada, 100"), false);
  assert.equal(resultText.includes("Nome que não deve aparecer"), false);
});

test("loading state is applied synchronously and cleaned up after success", async () => {
  let resolveFetch;
  const pendingFetch = new Promise((resolve) => {
    resolveFetch = resolve;
  });
  const harness = createHarness({
    fetchImplementation: () => pendingFetch
  });
  harness.input.value = "FMG-LOADING";

  harness.submit();

  assert.equal(harness.button.disabled, true);
  assert.equal(harness.button.getAttribute("aria-busy"), "true");
  assert.equal(harness.button.textContent, "Validando…");
  assert.equal(harness.body.classList.contains("is-loading"), true);
  assert.equal(harness.result.hidden, true);
  assert.equal(harness.timeoutCalls.length, 1);
  assert.equal(harness.timeoutCalls[0].delay, 15000);

  resolveFetch({
    json: async () => ({ Certificado_Válido: false }),
    ok: true
  });
  await flushAsyncWork();

  assert.equal(harness.button.disabled, false);
  assert.equal(harness.button.getAttribute("aria-busy"), "false");
  assert.equal(harness.button.textContent, "Validar Certificado");
  assert.equal(harness.body.classList.contains("is-loading"), false);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test("Erro_001 is mapped exactly and restores the validator", async () => {
  const harness = createHarness({
    fetchImplementation: async () => ({
      json: async () => ({ error: "Erro_001" }),
      ok: false
    })
  });
  harness.input.value = "FMG-DATABASE";

  harness.submit();
  await flushAsyncWork();

  assert.deepEqual(harness.alerts, [
    "Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nTente novamente."
  ]);
  assert.equal(harness.button.disabled, false);
  assert.equal(harness.button.getAttribute("aria-busy"), "false");
  assert.equal(harness.button.textContent, "Validar Certificado");
  assert.equal(harness.body.classList.contains("is-loading"), false);
  assert.equal(harness.result.hidden, true);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test("network failures map to Erro_000 and restore the validator", async () => {
  const harness = createHarness({
    fetchImplementation: async () => {
      throw new Error("Network unavailable");
    }
  });
  harness.input.value = "FMG-NETWORK";

  harness.submit();
  await flushAsyncWork();

  assert.deepEqual(harness.alerts, [
    "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."
  ]);
  assert.equal(harness.button.disabled, false);
  assert.equal(harness.button.getAttribute("aria-busy"), "false");
  assert.equal(harness.button.textContent, "Validar Certificado");
  assert.equal(harness.body.classList.contains("is-loading"), false);
  assert.equal(harness.result.hidden, true);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test("the 15-second timeout aborts fetch and still cleans up loading", async () => {
  const harness = createHarness({
    fetchImplementation: async (_url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("Aborted")));
    })
  });
  harness.input.value = "FMG-TIMEOUT";

  harness.submit();
  assert.equal(harness.timeoutCalls.length, 1);
  assert.equal(harness.timeoutCalls[0].delay, 15000);
  assert.equal(harness.fetchCalls[0].options.signal.aborted, false);

  harness.timeoutCalls[0].callback();
  await flushAsyncWork();

  assert.equal(harness.fetchCalls[0].options.signal.aborted, true);
  assert.deepEqual(harness.alerts, [
    "Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."
  ]);
  assert.equal(harness.button.disabled, false);
  assert.equal(harness.button.getAttribute("aria-busy"), "false");
  assert.equal(harness.button.textContent, "Validar Certificado");
  assert.equal(harness.body.classList.contains("is-loading"), false);
  assert.equal(harness.result.hidden, true);
  assert.deepEqual(harness.clearedTimeouts, [harness.timeoutCalls[0].timeoutId]);
});

test("blank certificate IDs are prevented without issuing a request", async () => {
  const harness = createHarness();
  harness.input.value = "   ";

  assert.equal(harness.submit(), true);
  await flushAsyncWork();

  assert.equal(harness.fetchCalls.length, 0);
  assert.equal(harness.timeoutCalls.length, 0);
  assert.equal(harness.button.disabled, false);
  assert.equal(harness.result.hidden, true);
});
