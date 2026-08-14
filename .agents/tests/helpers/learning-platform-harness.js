"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const REPOSITORY_ROOT = path.join(__dirname, "..", "..", "..");
const FIXTURE_ORIGIN = "https:" + "//learning-platform.test";

class NetworkGuardError extends Error {
  constructor(channel) {
    super(`Blocked ${channel} network access`);
    this.name = "NetworkGuardError";
  }
}

function sanitizePathname(pathname) {
  return pathname.replace(
    /(\/FaceID_resultado\/)[^/]+$/,
    "$1:sessionId"
  );
}

function sanitizeNavigationTarget(target) {
  try {
    const url = new URL(String(target), FIXTURE_ORIGIN);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "<non-http-navigation>";
    }
    return sanitizePathname(url.pathname);
  } catch {
    return "<invalid-navigation>";
  }
}

function sanitizeBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  return Object.fromEntries(Object.entries(body).map(([key, value]) => {
    if (/authorization|credential|indexverificado|password|senha|session(?:id)?|token/i.test(key)) {
      return [key, "<redacted>"];
    }
    return [key, value];
  }));
}

function normalizeHeaders(headers = {}) {
  const entries = typeof headers.entries === "function"
    ? [...headers.entries()]
    : Object.entries(headers);
  return Object.fromEntries(entries.map(([key, value]) => [
    key,
    /authorization|cookie|token/i.test(key) ? "<redacted>" : value
  ]));
}

function isSensitiveField(key) {
  return /authorization|credential|indexverificado|password|senha|session(?:id)?|token/i.test(key);
}

function createDenyAllNetworkGuard({ routes = [], timeline = [] } = {}) {
  const expectations = [];
  const requestMetadata = [];
  const requests = [];

  function findRoute(method, pathname) {
    return routes.find((route) => {
      if ((route.method ?? "GET").toUpperCase() !== method) return false;
      if (typeof route.path === "string") return route.path === pathname;
      if (route.path instanceof RegExp) return route.path.test(pathname);
      if (typeof route.path === "function") return route.path(pathname);
      return false;
    });
  }

  function evaluateExpectations(route, transientRequest) {
    if (typeof route.expect !== "function") return;

    let results;
    try {
      results = route.expect(transientRequest);
    } catch {
      throw new Error("Fixture request expectations could not be evaluated");
    }
    if (!results || typeof results !== "object" || Array.isArray(results)) {
      throw new TypeError("Fixture request expectations must return a boolean map");
    }
    for (const [label, value] of Object.entries(results)) {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(label) || typeof value !== "boolean") {
        throw new TypeError("Fixture request expectations must use safe labels and boolean values");
      }
    }

    const expectation = {
      method: transientRequest.method,
      path: sanitizePathname(transientRequest.pathname),
      results: { ...results }
    };
    expectations.push(expectation);
    if (Object.values(expectation.results).some((value) => value === false)) {
      throw new Error("Fixture request expectations were not met");
    }
  }

  async function guardedFetch(target, options = {}) {
    let url;
    try {
      url = new URL(String(target), FIXTURE_ORIGIN);
    } catch {
      throw new NetworkGuardError("fetch");
    }
    const method = String(options.method ?? "GET").toUpperCase();
    if (url.origin !== FIXTURE_ORIGIN) throw new NetworkGuardError("fetch");

    const route = findRoute(method, url.pathname);
    if (!route) throw new NetworkGuardError("fetch");

    const queryKeys = [...new Set(url.searchParams.keys())].sort();
    const path = sanitizePathname(url.pathname);
    requestMetadata.push({
      hasQuery: url.search.length > 0,
      method,
      path,
      queryKeys
    });
    if (url.search.length > 0 && route.allowQuery !== true) {
      throw new NetworkGuardError("fetch");
    }

    let rawBody = options.body;
    let body = rawBody;
    let formFields;
    let jsonBody;
    if (rawBody && rawBody.__fixtureFormData === true) {
      formFields = rawBody.entriesList.map(([key, value]) => [
        key,
        isSensitiveField(key) ? "<redacted>" : describeFormValue(value)
      ]);
      body = undefined;
    } else if (typeof rawBody === "string") {
      try {
        jsonBody = JSON.parse(rawBody);
        body = sanitizeBody(jsonBody);
      } catch {
        body = "<non-json-body>";
      }
    }

    evaluateExpectations(route, {
      formData: rawBody && rawBody.__fixtureFormData === true ? rawBody : undefined,
      jsonBody,
      method,
      pathname: url.pathname,
      queryKeys
    });

    const request = {
      body,
      formFields,
      headers: normalizeHeaders(options.headers),
      method,
      path
    };
    requests.push(request);
    timeline.push({ method, path: request.path, type: "fetch" });

    const fixtureRequest = {
      body,
      formFields,
      headers: request.headers,
      method,
      path: request.path
    };
    const result = typeof route.handler === "function"
      ? await route.handler(fixtureRequest)
      : route.response;
    return toFixtureResponse(result);
  }

  function block(channel, target) {
    void target;
    throw new NetworkGuardError(channel);
  }

  class GuardedXMLHttpRequest {
    open(method, target) {
      this.method = method;
      this.target = target;
    }

    send() {
      block("XMLHttpRequest", this.target);
    }
  }

  class GuardedWebSocket {
    constructor(target) {
      block("WebSocket", target);
    }
  }

  class GuardedEventSource {
    constructor(target) {
      block("EventSource", target);
    }
  }

  return {
    EventSource: GuardedEventSource,
    WebSocket: GuardedWebSocket,
    XMLHttpRequest: GuardedXMLHttpRequest,
    block,
    expectations,
    fetch: guardedFetch,
    requestMetadata,
    requests
  };
}

function describeFormValue(value) {
  if (value && typeof value === "object") {
    return value.name ? `<file:${String(value.name)}>` : "<object>";
  }
  return String(value);
}

function toFixtureResponse(value = {}) {
  if (value && typeof value.json === "function" && "ok" in value) return value;
  const status = value.status ?? 200;
  const data = value.data ?? value.body ?? {};
  return {
    ok: value.ok ?? (status >= 200 && status < 300),
    status,
    async json() {
      return data;
    }
  };
}

function createClassList(initial = []) {
  const classes = new Set(initial);
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
    replace(oldName, newName) {
      if (!classes.delete(oldName)) return false;
      classes.add(newName);
      return true;
    },
    toArray() {
      return [...classes];
    }
  };
}

function createStorage(initial = {}, timeline = []) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  return {
    clear() {
      values.clear();
      timeline.push({ type: "storage-clear" });
    },
    getItem(key) {
      timeline.push({ key, type: "storage-get" });
      return values.has(key) ? values.get(key) : null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    get length() {
      return values.size;
    },
    removeItem(key) {
      values.delete(key);
      timeline.push({ key, type: "storage-remove" });
    },
    setItem(key, value) {
      values.set(key, String(value));
      timeline.push({ key, type: "storage-set" });
    },
    snapshot({ redact = [] } = {}) {
      const hidden = new Set(redact);
      return Object.fromEntries([...values].map(([key, value]) => [
        key,
        hidden.has(key) ? "<redacted>" : value
      ]));
    }
  };
}

function createElementFactory({ faceStartImplementation, guard, timeline }) {
  let nextId = 0;
  return function createElement(id = `element-${++nextId}`, tagName = "div") {
    const normalizedTagName = String(tagName).toLowerCase();
    const attributes = new Map();
    const listeners = new Map();
    const selectorResults = new Map();
    const element = {
      attributes,
      children: [],
      classList: createClassList(),
      className: "",
      disabled: false,
      files: [],
      hidden: false,
      id,
      innerHTML: "",
      offsetHeight: 0,
      offsetTop: 0,
      parentElement: null,
      paused: true,
      scrollTop: 0,
      style: {},
      tagName: String(tagName).toUpperCase(),
      textContent: "",
      value: "",
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(listener);
      },
      appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        timeline.push({ tagName: child.tagName, type: "append" });
        return child;
      },
      closest(selector) {
        if (selectorResults.has(`closest:${selector}`)) {
          return selectorResults.get(`closest:${selector}`);
        }
        return null;
      },
      dispatch(type, event = {}) {
        const callbacks = listeners.get(type) ?? [];
        return callbacks.map((callback) => callback({
          preventDefault() {},
          target: element,
          ...event
        }));
      },
      getAttribute(name) {
        if (name === "data-index" && this.dataIndex !== undefined) return String(this.dataIndex);
        return attributes.get(name) ?? null;
      },
      pause() {
        this.pauseCalls = (this.pauseCalls ?? 0) + 1;
        this.paused = true;
      },
      play() {
        this.playCalls = (this.playCalls ?? 0) + 1;
        this.paused = false;
        return Promise.resolve();
      },
      querySelector(selector) {
        if (!selectorResults.has(selector)) {
          selectorResults.set(selector, createElement(`${id}:${selector}`));
        }
        return selectorResults.get(selector);
      },
      querySelectorAll(selector) {
        return selectorResults.get(`all:${selector}`) ?? [];
      },
      setAttribute(name, value) {
        const normalizedName = String(name).toLowerCase();
        const guardedAttributes = new Set([
          "action", "data", "formaction", "href", "poster", "src", "srcdoc", "srcset"
        ]);
        if (guardedAttributes.has(normalizedName)) {
          guard.block(`${normalizedTagName} ${normalizedName} attribute`, value);
        }
        attributes.set(name, String(value));
      },
      setSelectorResult(selector, value, { all = false } = {}) {
        selectorResults.set(`${all ? "all:" : ""}${selector}`, value);
      }
    };

    if (tagName === "azure-ai-vision-face-ui") {
      element.start = async (token) => {
        timeline.push({ tokenPresent: Boolean(token), type: "face-start" });
        if (faceStartImplementation) return faceStartImplementation(token, element);
        return {};
      };
    }

    const resourceTags = new Set(["audio", "embed", "iframe", "img", "object", "script", "source", "track", "video"]);
    if (resourceTags.has(normalizedTagName)) {
      Object.defineProperty(element, "src", {
        get() {
          return "";
        },
        set(target) {
          guard.block(`${normalizedTagName} resource`, target);
        }
      });
      for (const property of ["poster", "srcObject", "srcset"]) {
        Object.defineProperty(element, property, {
          set(target) {
            guard.block(`${normalizedTagName} ${property}`, target);
          }
        });
      }
    }

    if (["a", "link"].includes(normalizedTagName)) {
      Object.defineProperty(element, "href", {
        get() {
          return "";
        },
        set(target) {
          guard.block("link resource", target);
        }
      });
    }

    if (normalizedTagName === "form") {
      for (const method of ["requestSubmit", "submit"]) {
        element[method] = () => guard.block(`form ${method}`, element.getAttribute("action"));
      }
      Object.defineProperty(element, "action", {
        set(target) {
          guard.block("form action", target);
        }
      });
    }

    return element;
  };
}

function createLearningPlatformHarness({
  faceStartImplementation,
  innerWidth = 1025,
  now = 2_000_000_000_000,
  routes = [],
  storage = {},
  userAgent = "FixtureBrowser",
  userAgentData = { brands: [{ brand: "Microsoft Edge" }] }
} = {}) {
  const timeline = [];
  const alerts = [];
  const consoleCalls = [];
  const windowListeners = new Map();
  const elements = new Map();
  const selectorResults = new Map();
  const classResults = new Map();
  const timers = new Map();
  let nextTimerId = 1;
  let currentNow = now;

  const guard = createDenyAllNetworkGuard({ routes, timeline });
  const sessionStorage = createStorage(storage, timeline);
  const createElement = createElementFactory({ faceStartImplementation, guard, timeline });
  const body = createElement("body", "body");

  function element(id) {
    if (!elements.has(id)) elements.set(id, createElement(id));
    return elements.get(id);
  }

  const document = {
    body,
    createElement(tagName) {
      return createElement(undefined, tagName);
    },
    getElementById: element,
    getElementsByClassName(className) {
      return classResults.get(className) ?? [];
    },
    querySelector(selector) {
      return selectorResults.get(selector) ?? null;
    },
    querySelectorAll(selector) {
      return selectorResults.get(selector) ?? [];
    }
  };

  const navigation = [];
  let href = FIXTURE_ORIGIN + "/current/";
  const location = {};
  Object.defineProperty(location, "href", {
    get() {
      return href;
    },
    set(value) {
      href = String(value);
      const recordedTarget = sanitizeNavigationTarget(value);
      navigation.push(recordedTarget);
      timeline.push({ path: recordedTarget, type: "navigate" });
    }
  });

  const history = {
    backCalls: 0,
    back() {
      this.backCalls += 1;
      timeline.push({ type: "history-back" });
    }
  };

  function addWindowListener(type, listener) {
    if (!windowListeners.has(type)) windowListeners.set(type, []);
    windowListeners.get(type).push(listener);
    timeline.push({ event: type, type: "window-listener" });
  }

  const window = {
    addEventListener: addWindowListener,
    clearInterval(id) {
      timers.delete(id);
      timeline.push({ id, type: "timer-clear" });
    },
    clearTimeout(id) {
      timers.delete(id);
      timeline.push({ id, type: "timer-clear" });
    },
    document,
    history,
    innerWidth,
    location,
    navigator: { userAgent, ...(userAgentData === undefined ? {} : { userAgentData }) },
    open(target) {
      guard.block("window.open", target);
    },
    sessionStorage,
    setInterval(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay, interval: true });
      timeline.push({ delay, interval: true, type: "timer-set" });
      return id;
    },
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay, interval: false });
      timeline.push({ delay, interval: false, type: "timer-set" });
      return id;
    }
  };
  window.navigator.sendBeacon = (target) => guard.block("sendBeacon", target);

  class GuardedWorker {
    constructor(target) {
      guard.block("Worker", target);
    }
  }

  class FixtureDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [currentNow]));
    }

    static now() {
      return currentNow;
    }
  }

  class FixtureFormData {
    constructor() {
      this.__fixtureFormData = true;
      this.entriesList = [];
    }

    append(key, value) {
      this.entriesList.push([String(key), value]);
    }

    get(key) {
      return this.entriesList.find(([entryKey]) => entryKey === key)?.[1] ?? null;
    }

    *entries() {
      yield* this.entriesList;
    }
  }

  class GuardedImage {
    set src(target) {
      guard.block("image resource", target);
    }
  }

  const sandbox = {
    Date: FixtureDate,
    EventSource: guard.EventSource,
    FormData: FixtureFormData,
    Image: GuardedImage,
    Promise,
    URL,
    URLSearchParams,
    WebSocket: guard.WebSocket,
    Worker: GuardedWorker,
    XMLHttpRequest: guard.XMLHttpRequest,
    alert(message) {
      alerts.push(String(message));
    },
    clearInterval: window.clearInterval,
    clearTimeout: window.clearTimeout,
    console: {
      error(...args) {
        consoleCalls.push({ level: "error", size: args.length });
      },
      log(...args) {
        consoleCalls.push({ level: "log", size: args.length });
      },
      warn(...args) {
        consoleCalls.push({ level: "warn", size: args.length });
      }
    },
    document,
    fetch: guard.fetch,
    history,
    location,
    navigator: window.navigator,
    sessionStorage,
    setInterval: window.setInterval,
    setTimeout: window.setTimeout,
    window
  };
  window.fetch = guard.fetch;
  window.XMLHttpRequest = guard.XMLHttpRequest;
  window.WebSocket = guard.WebSocket;
  window.EventSource = guard.EventSource;
  window.Worker = GuardedWorker;
  window.Image = GuardedImage;
  window.FormData = FixtureFormData;
  window.Date = FixtureDate;

  const context = vm.createContext(sandbox);

  function loadScript(relativePath, { rewriteBackend = true, stripImports = true } = {}) {
    let source = fs.readFileSync(path.join(REPOSITORY_ROOT, relativePath), "utf8");
    if (stripImports) source = source.replace(/^\s*import\s+["'][^"']+["'];?\s*$/gm, "");
    if (rewriteBackend) {
      source = source.replace(
        /sessionStorage\.setItem\('URL_Base_Backend',\s*'[^']+'\)/,
        `sessionStorage.setItem('URL_Base_Backend', '${FIXTURE_ORIGIN}/plataforma_v2')`
      );
    }
    vm.runInContext(source, context, { filename: relativePath });
    return source;
  }

  function dispatchWindow(type, event = {}) {
    timeline.push({ event: type, type: "window-dispatch" });
    const callbacks = windowListeners.get(type) ?? [];
    return callbacks.map((callback) => callback.call(window, { type, ...event }));
  }

  async function flush(turns = 8) {
    for (let index = 0; index < turns; index += 1) await Promise.resolve();
  }

  return {
    advanceClock(milliseconds) {
      currentNow += milliseconds;
      return currentNow;
    },
    alerts,
    classResults,
    consoleCalls,
    context,
    dispatchWindow,
    document,
    element,
    elements,
    flush,
    guard,
    history,
    loadScript,
    navigation,
    now,
    runTimer(timerId) {
      const timer = timers.get(timerId);
      assert.ok(timer, "The requested fixture timer must exist");
      return timer.callback();
    },
    setClock(value) {
      currentNow = Number(value);
      return currentNow;
    },
    selectorResults,
    sessionStorage,
    timeline,
    timers,
    window,
    windowListeners
  };
}

function readPlatformScript(relativePath) {
  assert.match(relativePath, /^apps[\\/]learning-platform[\\/]/);
  return fs.readFileSync(path.join(REPOSITORY_ROOT, relativePath), "utf8");
}

module.exports = {
  FIXTURE_ORIGIN,
  NetworkGuardError,
  createDenyAllNetworkGuard,
  createLearningPlatformHarness,
  readPlatformScript,
  sanitizePathname
};
