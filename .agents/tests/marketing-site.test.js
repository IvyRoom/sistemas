"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const repositoryRoot = path.join(__dirname, "..", "..");
const marketingRoot = path.join(repositoryRoot, "apps", "marketing-site");
const sourcePath = path.join(marketingRoot, "main.js");
const modulesRoot = path.join(marketingRoot, "modules");
const htmlPath = path.join(marketingRoot, "index.html");
const cssPath = path.join(marketingRoot, "style.css");
const moduleFilenames = [
  "elements.js",
  "scroll-behavior.js",
  "media.js",
  "scroll-state.js",
  "sections.js",
  "testimonials.js"
];
const expectedEntryImports = moduleFilenames.map(
  (filename) => `./modules/${filename}`
);
const entrySource = fs.readFileSync(sourcePath, "utf8");
const moduleRecords = moduleFilenames.map((filename) => {
  const filePath = path.join(modulesRoot, filename);
  return {
    filename,
    filePath,
    source: fs.readFileSync(filePath, "utf8")
  };
});
const source = moduleRecords.map(({ source: moduleSource }) => moduleSource).join("\n");
const html = fs.readFileSync(htmlPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const htmlIdOccurrences = Array.from(
  html.matchAll(/\bid="([^"]+)"/g),
  ([, id]) => id
);
const htmlElementsById = new Map(
  Array.from(
    html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi),
    ([openingTag, tagName, , id]) => [
      id,
      { openingTag, tagName: tagName.toLowerCase() }
    ]
  )
);
const htmlIds = new Set(htmlElementsById.keys());
const htmlClassTokens = new Set(
  Array.from(
    html.matchAll(/\bclass="([^"]+)"/g),
    ([, classNames]) => classNames.split(/\s+/)
  ).flat()
);
const htmlLinksByHref = new Map(
  Array.from(
    html.matchAll(/<a\b([^>]*\bhref="([^"]+)"[^>]*)>/gi),
    ([openingTag, , href]) => [href, openingTag]
  )
);

const VIEWPORT_HEIGHT = 800;
const CTA_HEIGHT = 150;
const SECTION_TOPS = [1000, 3000, 5000, 7000];
const FINAL_SPACER_TOP = 9000;
const PRIMARY_VIDEO_TOP = 500;
const PRIMARY_VIDEO_HEIGHT = 300;
const HLS_URL = "https://videospreparatoriosv2.blob.core.windows.net/videosv3/LandingPagePJ/video-principal/master.m3u8";
const POSTER_URL = "./landing-page/img/CAPA_VÍDEO_PRINCIPAL.jpg";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const identifierPatternSource = "[$_\\p{L}][$_\\p{L}\\p{N}\\u200C\\u200D]*";

function namedImportPattern() {
  return /^import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/([^"']+)["'];[ \t]*\r?$/gm;
}

function parseAliasedBindings(bindingSource, label) {
  const bindingPattern = new RegExp(
    `^(${identifierPatternSource})(?:\\s+as\\s+(${identifierPatternSource}))?$`,
    "u"
  );

  return bindingSource.split(",").map((binding) => {
    const trimmedBinding = binding.trim();
    const match = trimmedBinding.match(bindingPattern);
    assert.ok(match, `${label} has a supported named binding: ${trimmedBinding}`);
    return {
      localName: match[2] ?? match[1],
      sourceName: match[1]
    };
  });
}

function exportedBindings(record) {
  const bindings = new Map();
  const declarationPattern = new RegExp(
    `^export\\s+(?:(?:async\\s+)?function|class|var|let|const)\\s+(${identifierPatternSource})`,
    "gmu"
  );
  for (const match of record.source.matchAll(declarationPattern)) {
    bindings.set(match[1], match[1]);
  }

  for (const match of record.source.matchAll(/^export\s*\{([\s\S]*?)\}\s*;[ \t]*\r?$/gm)) {
    for (const binding of parseAliasedBindings(match[1], `${record.filename} export`)) {
      bindings.set(binding.localName, binding.sourceName);
    }
  }

  return bindings;
}

function analyzeModuleGraph(records) {
  const filenames = records.map(({ filename }) => filename);
  const exportsByFilename = new Map(
    records.map((record) => [record.filename, exportedBindings(record)])
  );
  const importsByFilename = new Map();

  for (const [moduleIndex, record] of records.entries()) {
    const imports = Array.from(
      record.source.matchAll(namedImportPattern()),
      ([, bindingSource, importedFilename]) => ({
        bindings: parseAliasedBindings(
          bindingSource,
          `${record.filename} import from ${importedFilename}`
        ),
        importedFilename
      })
    );

    for (const importedModule of imports) {
      const importedIndex = filenames.indexOf(importedModule.importedFilename);
      assert.notEqual(
        importedIndex,
        -1,
        `${record.filename} imports known module ${importedModule.importedFilename}`
      );
      assert.ok(
        importedIndex < moduleIndex,
        `${record.filename} imports ${importedModule.importedFilename} topologically`
      );
      const targetExports = exportsByFilename.get(importedModule.importedFilename);
      for (const binding of importedModule.bindings) {
        assert.ok(
          targetExports.has(binding.sourceName),
          `${record.filename} imports exported binding ${binding.sourceName} from ${importedModule.importedFilename}`
        );
      }
    }

    importsByFilename.set(record.filename, imports);
  }

  return { exportsByFilename, importsByFilename };
}

const moduleGraph = analyzeModuleGraph(moduleRecords);

function executableModuleSource({ filename, source: moduleSource }) {
  const strippedImports = moduleSource.replace(namedImportPattern(), "");
  assert.doesNotMatch(strippedImports, /^\s*import\b/m, `${filename} has only known static imports`);
  const strippedExports = strippedImports.replace(/\bexport\s+/g, "");
  assert.doesNotMatch(strippedExports, /\bexport\b/, `${filename} has only export keywords`);
  return strippedExports;
}

const flattenedExecutableSource = [
  '"use strict";',
  ...moduleRecords.map(executableModuleSource)
].join("\n");

function isolatedModuleSource(record, graph) {
  const importDeclarations = graph.importsByFilename.get(record.filename)
    .flatMap(({ bindings, importedFilename }) => bindings.map(
      ({ localName, sourceName }) =>
        `const ${localName} = __moduleNamespaces[${JSON.stringify(importedFilename)}][${JSON.stringify(sourceName)}];`
    ));
  const returnedBindings = Array.from(
    graph.exportsByFilename.get(record.filename),
    ([exportedName, localName]) => `${JSON.stringify(exportedName)}: ${localName}`
  );

  return [
    `__moduleNamespaces[${JSON.stringify(record.filename)}] = (() => {`,
    ...importDeclarations,
    executableModuleSource(record),
    `return { ${returnedBindings.join(", ")} };`,
    "})();"
  ].join("\n");
}

function createIsolatedExecutableSource(records, graph = analyzeModuleGraph(records)) {
  return [
    '"use strict";',
    "const __moduleNamespaces = Object.create(null);",
    ...records.map((record) => isolatedModuleSource(record, graph))
  ].join("\n");
}

const isolatedExecutableSource = createIsolatedExecutableSource(
  moduleRecords,
  moduleGraph
);
const isolatedModuleRun = process.env.MARKETING_TEST_ISOLATED_MODULES === "1";
const executableSource = isolatedModuleRun
  ? isolatedExecutableSource
  : flattenedExecutableSource;

function assertRealModuleSyntax(filename, moduleSource) {
  const result = spawnSync(
    process.execPath,
    ["--check", "--input-type=module"],
    {
      encoding: "utf8",
      input: moduleSource,
      windowsHide: true
    }
  );
  assert.equal(
    result.status,
    0,
    `${filename} parses as a real ES module\n${result.stderr}`
  );
}

function createHarness({
  initialScrollY = 0,
  playerLoadError = null,
  playerLoadPromise = null,
  reducedMotion = false,
  shakaAvailable = true,
  shakaSupported = true,
  supportsIntersectionObserver = true,
  supportsMatchMedia = true,
  userAgent = "Mozilla/5.0",
  viewportHeight = VIEWPORT_HEIGHT
} = {}) {
  const elements = new Map();
  const listeners = new Map();
  const windowListeners = new Map();
  const observers = [];
  const openCalls = [];
  const scrollCalls = [];
  const focusCalls = [];
  const interactionCalls = [];
  const mediaQueryCalls = [];
  const playerInstances = [];
  const overlayInstances = [];
  const consoleErrors = [];
  let document;
  let polyfillInstallCalls = 0;
  let reducedMotionPreference = reducedMotion;

  function geometry(id) {
    if (id === "primary-video-frame") {
      return { offsetHeight: PRIMARY_VIDEO_HEIGHT, offsetTop: PRIMARY_VIDEO_TOP };
    }

    const sectionMatch = id.match(/^section-([1-4])$/);
    if (sectionMatch) {
      return { offsetHeight: 0, offsetTop: SECTION_TOPS[Number(sectionMatch[1]) - 1] };
    }

    if (id === "quote-cta-spacer") {
      return { offsetHeight: 0, offsetTop: FINAL_SPACER_TOP };
    }

    if (id === "quote-cta") {
      return { offsetHeight: CTA_HEIGHT, offsetTop: 0 };
    }

    return { offsetHeight: 0, offsetTop: 0 };
  }

  function createElement(id) {
    assert.ok(htmlIds.has(id), `main.js references missing HTML id: ${id}`);
    const attributes = new Map();
    const elementGeometry = geometry(id);
    const { openingTag, tagName } = htmlElementsById.get(id);

    for (const [, name, value] of openingTag.matchAll(/\b([:\w.-]+)="([^"]*)"/g)) {
      attributes.set(name, value);
    }

    const classNames = new Set(
      (attributes.get("class") ?? "").split(/\s+/).filter(Boolean)
    );

    function syncClassAttribute() {
      if (classNames.size === 0) {
        attributes.delete("class");
        return;
      }
      attributes.set("class", Array.from(classNames).join(" "));
    }

    const classList = {
      add(...tokens) {
        for (const token of tokens) classNames.add(token);
        syncClassAttribute();
      },
      contains(token) {
        return classNames.has(token);
      },
      item(index) {
        return Array.from(classNames)[index] ?? null;
      },
      remove(...tokens) {
        for (const token of tokens) classNames.delete(token);
        syncClassAttribute();
      },
      replace(oldToken, newToken) {
        if (!classNames.has(oldToken)) return false;
        const tokens = Array.from(classNames);
        const index = tokens.indexOf(oldToken);
        tokens[index] = newToken;
        classNames.clear();
        for (const token of tokens) classNames.add(token);
        syncClassAttribute();
        return true;
      },
      toggle(token, force) {
        const shouldAdd = force === undefined ? !classNames.has(token) : Boolean(force);
        if (shouldAdd) classNames.add(token);
        else classNames.delete(token);
        syncClassAttribute();
        return shouldAdd;
      },
      values() {
        return classNames.values();
      },
      get length() {
        return classNames.size;
      },
      get value() {
        return Array.from(classNames).join(" ");
      },
      [Symbol.iterator]() {
        return classNames[Symbol.iterator]();
      }
    };

    const style = {
      getPropertyValue(name) {
        return Object.hasOwn(this, name) ? this[name] : "";
      },
      removeProperty(name) {
        const previousValue = this.getPropertyValue(name);
        delete this[name];
        return previousValue;
      },
      setProperty(name, value) {
        this[name] = String(value);
      }
    };

    return {
      id,
      attributes,
      classList,
      tagName,
      innerHTML: /^testimonial-[1-5]-view-toggle-label$/.test(id)
        ? "Tela Cheia"
        : "",
      offsetHeight: elementGeometry.offsetHeight,
      offsetTop: elementGeometry.offsetTop,
      loadCalls: 0,
      paused: true,
      pauseCalls: 0,
      style,
      addEventListener(type, listener) {
        listeners.set(`${id}:${type}`, listener);
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      getBoundingClientRect() {
        const top = this.offsetTop - window.scrollY;
        return {
          bottom: top + this.offsetHeight,
          height: this.offsetHeight,
          top
        };
      },
      focus(options) {
        const call = {
          id,
          options: { preventScroll: options?.preventScroll }
        };
        focusCalls.push(call);
        interactionCalls.push({ ...call, type: "focus" });
        document.activeElement = this;
      },
      load() {
        this.loadCalls += 1;
      },
      pause() {
        this.pauseCalls += 1;
        this.paused = true;
      },
      scrollIntoView(options) {
        const call = {
          id,
          options: { behavior: options?.behavior }
        };
        scrollCalls.push(call);
        interactionCalls.push({ ...call, type: "scroll" });
      },
      removeAttribute(name) {
        attributes.delete(name);
      },
      setAttribute(name, value) {
        const stringValue = String(value);
        attributes.set(name, stringValue);
        if (name === "class") {
          classNames.clear();
          for (const token of stringValue.split(/\s+/).filter(Boolean)) classNames.add(token);
          syncClassAttribute();
        }
      }
    };
  }

  function element(id) {
    if (!elements.has(id)) elements.set(id, createElement(id));
    return elements.get(id);
  }

  document = {
    activeElement: null,
    getElementById: element
  };

  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.observed = new Set();
      this.observeCalls = [];
      this.unobserveCalls = [];
      observers.push(this);
    }

    observe(target) {
      this.observeCalls.push(target);
      this.observed.add(target);
    }

    trigger(target, isIntersecting) {
      if (!this.observed.has(target)) return;
      this.callback([{ isIntersecting, target }], this);
    }

    unobserve(target) {
      this.unobserveCalls.push(target);
      this.observed.delete(target);
    }
  }

  class Player {
    static isBrowserSupported() {
      return shakaSupported;
    }

    constructor(video) {
      this.destroyCalls = 0;
      this.video = video;
      this.loadCalls = [];
      playerInstances.push(this);
    }

    load(url) {
      this.loadCalls.push(url);
      if (playerLoadError !== null) return Promise.reject(playerLoadError);
      if (playerLoadPromise !== null) return playerLoadPromise;
      return Promise.resolve();
    }

    destroy() {
      this.destroyCalls += 1;
      return Promise.resolve();
    }
  }

  class Overlay {
    constructor(player, container, video) {
      this.player = player;
      this.container = container;
      this.video = video;
      this.configureCalls = [];
      this.destroyCalls = 0;
      overlayInstances.push(this);
    }

    configure(configuration) {
      this.configureCalls.push(configuration);
    }

    destroy() {
      this.destroyCalls += 1;
      return this.player.destroy();
    }
  }

  const window = {
    innerHeight: viewportHeight,
    location: { href: "https://machadogestao.com/" },
    scrollY: initialScrollY,
    addEventListener(type, listener, options) {
      const registrations = windowListeners.get(type) ?? [];
      registrations.push({ listener, options });
      windowListeners.set(type, registrations);
    },
    open(url, target, features) {
      openCalls.push({ features, target, url });
    }
  };

  if (supportsMatchMedia) {
    window.matchMedia = (query) => {
      mediaQueryCalls.push(query);
      return { matches: reducedMotionPreference };
    };
  }

  const contextGlobals = {
    console: Object.assign(Object.create(console), {
      error(...argumentsList) {
        consoleErrors.push(argumentsList);
      }
    }),
    document,
    navigator: { userAgent },
    window
  };
  if (supportsIntersectionObserver) {
    contextGlobals.IntersectionObserver = FakeIntersectionObserver;
  }
  if (shakaAvailable) {
    contextGlobals.shaka = {
      Player,
      polyfill: {
        installAll() {
          polyfillInstallCalls += 1;
        }
      },
      ui: { Overlay }
    };
  }
  const context = vm.createContext(contextGlobals);

  vm.runInContext(executableSource, context, {
    filename: path.join(marketingRoot, "marketing-site.test-bundle.js")
  });
  assert.equal(observers.length, supportsIntersectionObserver ? 1 : 0);

  function dispatch(id, type = "click") {
    const listener = listeners.get(`${id}:${type}`);
    assert.ok(listener, `Missing ${type} listener for #${id}`);
    const target = element(id);
    let defaultPrevented = false;
    const event = {
      currentTarget: target,
      preventDefault() {
        defaultPrevented = true;
      },
      target
    };
    listener.call(target, event);
    return { defaultPrevented };
  }

  function dispatchWindowEvent(type) {
    const registrations = windowListeners.get(type) ?? [];
    assert.ok(registrations.length > 0, `Missing window ${type} listener`);
    for (const { listener } of registrations) listener.call(window, { type });
  }

  function scrollTo(scrollY) {
    window.scrollY = scrollY;
    dispatchWindowEvent("scroll");
  }

  function resizeTo(innerHeight) {
    window.innerHeight = innerHeight;
    dispatchWindowEvent("resize");
  }

  return {
    consoleErrors,
    context,
    dispatch,
    dispatchWindowEvent,
    document,
    element,
    focusCalls,
    interactionCalls,
    mediaQueryCalls,
    openCalls,
    overlayInstances,
    playerInstances,
    observer: observers[0] ?? null,
    get polyfillInstallCalls() {
      return polyfillInstallCalls;
    },
    resizeTo,
    get scrollBehavior() {
      return supportsMatchMedia && reducedMotionPreference ? "auto" : "smooth";
    },
    scrollCalls,
    setReducedMotion(value) {
      reducedMotionPreference = value;
    },
    setPlayerLoadError(error) {
      playerLoadError = error;
    },
    scrollTo,
    window,
    windowListeners
  };
}

function assertLastScroll(harness, id) {
  const call = harness.scrollCalls.at(-1);
  assert.equal(call.id, id);
  assert.equal(call.options.behavior, harness.scrollBehavior);
}

function assertScrollThenFocus(harness, scrollId, focusId) {
  assert.deepEqual(harness.interactionCalls.slice(-2), [
    {
      id: scrollId,
      options: { behavior: harness.scrollBehavior },
      type: "scroll"
    },
    {
      id: focusId,
      options: { preventScroll: true },
      type: "focus"
    }
  ]);
}

function assertClassState(element, { absent = [], present = [] }) {
  for (const className of present) {
    assert.equal(element.classList.contains(className), true, `#${element.id} has .${className}`);
  }
  for (const className of absent) {
    assert.equal(element.classList.contains(className), false, `#${element.id} lacks .${className}`);
  }
}

function assertCustomProperty(element, name, value) {
  assert.equal(element.style.getPropertyValue(name), value, `#${element.id} ${name}`);
}

function testimonialVideo(harness, number) {
  return harness.element(`testimonial-${number}-video`);
}

function openingTag(id) {
  return htmlElementsById.get(id)?.openingTag ?? "";
}

function cssRulesContaining(selectorFragments) {
  return Array.from(
    css.matchAll(/([^{}]+)\{([^{}]*)\}/g),
    ([, selector, declarations]) => ({ declarations, selector })
  ).filter(({ selector }) => selectorFragments.every((fragment) => selector.includes(fragment)));
}

function assertCssRule(selectorFragments, declarationPatterns) {
  const rules = cssRulesContaining(selectorFragments);

  assert.ok(rules.length > 0, `Missing CSS rule containing ${selectorFragments.join(", ")}`);
  assert.ok(
    rules.some(({ declarations }) => declarationPatterns.every((pattern) => pattern.test(declarations))),
    `Incomplete CSS state for ${selectorFragments.join(", ")}`
  );
}

function assertCssRuleOmits(selectorFragments, declarationPattern) {
  const rules = cssRulesContaining(selectorFragments);
  assert.ok(rules.length > 0, `Missing CSS rule containing ${selectorFragments.join(", ")}`);
  for (const { declarations } of rules) {
    assert.doesNotMatch(declarations, declarationPattern);
  }
}

function assertCssStateForTargets(targets, stateClass, declarationPatterns) {
  for (const target of targets) {
    assertCssRule([target, `.${stateClass}`], declarationPatterns);
  }
}

test("marketing entry imports the complete module graph in topological order", () => {
  const sideEffectImportPattern = /^[ \t]*import[ \t]+["']([^"']+)["'];[ \t]*\r?$/gm;
  const entryImports = Array.from(
    entrySource.matchAll(sideEffectImportPattern),
    ([, specifier]) => specifier
  );

  assert.deepEqual(entryImports, expectedEntryImports);
  assert.equal(entrySource.replace(sideEffectImportPattern, "").trim(), "");
  assert.deepEqual(
    fs.readdirSync(modulesRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
      .map((entry) => entry.name)
      .sort(),
    [...moduleFilenames].sort()
  );

  assertRealModuleSyntax("main.js", entrySource);
  for (const record of moduleRecords) {
    assertRealModuleSyntax(record.filename, record.source);
  }

  assert.match(flattenedExecutableSource, /^"use strict";/);
  assert.doesNotMatch(flattenedExecutableSource, /^\s*(?:import|export)\b/m);
  assert.match(isolatedExecutableSource, /^"use strict";/);
  assert.doesNotMatch(isolatedExecutableSource, /^\s*(?:import|export)\b/m);

  assert.doesNotThrow(() => analyzeModuleGraph([
    { filename: "source.js", source: "export const original = 1;" },
    {
      filename: "consumer.js",
      source: "import { original as local } from './source.js';\nvoid local;"
    }
  ]));
  assert.throws(
    () => analyzeModuleGraph([
      { filename: "source.js", source: "export const original = 1;" },
      {
        filename: "consumer.js",
        source: "import { missing as local } from './source.js';\nvoid local;"
      }
    ]),
    /consumer\.js imports exported binding missing from source\.js/
  );

  const missingImportRecords = [
    { filename: "source.js", source: "export const required = 1;" },
    { filename: "consumer.js", source: "void required;" }
  ];
  assert.doesNotThrow(() => vm.runInNewContext([
    '"use strict";',
    ...missingImportRecords.map(executableModuleSource)
  ].join("\n")));
  assert.throws(
    () => vm.runInNewContext(createIsolatedExecutableSource(missingImportRecords)),
    /required is not defined/
  );
});

test(
  "isolated module scopes preserve the complete behavioral suite",
  { skip: isolatedModuleRun },
  () => {
    const childEnvironment = {
      ...process.env,
      MARKETING_TEST_ISOLATED_MODULES: "1"
    };
    delete childEnvironment.NODE_TEST_CONTEXT;
    const result = spawnSync(
      process.execPath,
      ["--test", __filename],
      {
        encoding: "utf8",
        env: childEnvironment,
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true
      }
    );

    assert.ifError(result.error);
    assert.equal(
      result.status,
      0,
      `isolated ES-module scope run failed\n${result.stdout}\n${result.stderr}`
    );
  }
);

test("marketing selectors, local references, script order, and timing remain exact", () => {
  const referencedIds = Array.from(
    source.matchAll(/getElementById\("([^"]+)"\)/g),
    ([, id]) => id
  );

  assert.ok(referencedIds.length > 0);
  for (const id of referencedIds) {
    assert.ok(htmlIds.has(id), id);
  }

  assert.match(html, /<link rel="icon" href="\.\/landing-page\/img\/FAVICON\.ico">/);
  assert.match(html, /<link async rel="stylesheet" href="\.\/landing-page\/style\.css">/);
  assert.match(html, /<script type="module" src="\.\/landing-page\/main\.js"><\/script>/);

  const shakaScript = "<script defer src=\"https://cdn.jsdelivr.net/npm/shaka-player@4.3.5/dist/shaka-player.ui.js\"></script>";
  const marketingScript = "<script type=\"module\" src=\"./landing-page/main.js\"></script>";
  assert.ok(html.indexOf(shakaScript) < html.indexOf(marketingScript));
  assert.match(css, /--page-max-width: 430px;/);
  assert.match(
    css,
    /@media \(min-width: 431px\) \{[\s\S]*?--considered-screen-width: var\(--page-max-width\);[\s\S]*?--considered-margin-left: calc\(50vw - \(var\(--considered-screen-width\)\/2\)\);/
  );
  assert.match(css, /animation: primary-video-glow 12s ease-in infinite;/);
  assert.match(css, /animation: section-open-button-pulse 3s ease-out infinite;/);
  assert.doesNotMatch(source, /\b(?:setTimeout|setInterval|requestAnimationFrame)\s*\(/);
});

test("marketing identifiers, references, animations, and comments follow one source contract", () => {
  const kebabCase = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
  const lowerCamelCase = /^[a-z][A-Za-z0-9]*$/;
  const allJavaScriptSource = [entrySource, source].join("\n");

  assert.equal(new Set(htmlIdOccurrences).size, htmlIdOccurrences.length, "HTML IDs are unique");
  for (const id of htmlIdOccurrences) assert.match(id, kebabCase, `HTML ID: ${id}`);
  for (const className of htmlClassTokens) assert.match(className, kebabCase, `HTML class: ${className}`);

  const tokenReferenceAttributes = [
    "aria-controls",
    "aria-describedby",
    "aria-details",
    "aria-errormessage",
    "aria-flowto",
    "aria-labelledby",
    "aria-owns",
    "headers"
  ];
  const singleReferenceAttributes = ["aria-activedescendant", "for", "form", "list"];
  for (const attribute of tokenReferenceAttributes) {
    const pattern = new RegExp(`\\b${attribute}="([^"]+)"`, "g");
    for (const [, references] of html.matchAll(pattern)) {
      for (const id of references.split(/\s+/)) assert.ok(htmlIds.has(id), `${attribute}: ${id}`);
    }
  }
  for (const attribute of singleReferenceAttributes) {
    const pattern = new RegExp(`\\b${attribute}="([^"]+)"`, "g");
    for (const [, id] of html.matchAll(pattern)) assert.ok(htmlIds.has(id), `${attribute}: ${id}`);
  }
  for (const [, id] of html.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(htmlIds.has(id), `href fragment: ${id}`);
  }

  const runtimeClassTokens = new Set(
    Array.from(
      allJavaScriptSource.matchAll(/classList\.(?:add|remove|contains)\(([^)]*)\)/g),
      ([, argumentsSource]) => Array.from(
        argumentsSource.matchAll(/["']([^"']+)["']/g),
        ([, className]) => className
      )
    ).flat()
  );
  const shakaClassTokens = new Set([
    "shaka-controls-button-panel",
    "shaka-overflow-menu",
    "shaka-play-button",
    "shaka-scrim-container",
    "shaka-seek-bar-container",
    "shaka-settings-menu",
    "shaka-spinner-path",
    "shaka-spinner-svg",
    "shaka-statistics-container",
    "shaka-text-container"
  ]);
  const selectorPreludes = [];
  let segmentStart = 0;
  let quote = "";
  let escaped = false;
  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") {
      selectorPreludes.push(css.slice(segmentStart, index).trim());
      segmentStart = index + 1;
    } else if (character === "}" || character === ";") {
      segmentStart = index + 1;
    }
  }
  const selectors = selectorPreludes.filter(
    (prelude) => prelude && !prelude.startsWith("@") && !/^(?:from|to|\d+%)$/.test(prelude)
  );
  const cssIdTokens = new Set(
    selectors.flatMap((selector) => Array.from(selector.matchAll(/#([a-z][a-z0-9-]*)/g), ([, id]) => id))
  );
  const cssClassTokens = new Set(
    selectors.flatMap((selector) => Array.from(selector.matchAll(/\.([a-z][a-z0-9-]*)/g), ([, className]) => className))
  );
  for (const id of cssIdTokens) assert.ok(htmlIds.has(id), `CSS ID selector: ${id}`);
  for (const className of cssClassTokens) {
    assert.ok(
      htmlClassTokens.has(className) || runtimeClassTokens.has(className) || shakaClassTokens.has(className),
      `CSS class selector: ${className}`
    );
  }
  for (const className of htmlClassTokens) {
    assert.ok(cssClassTokens.has(className), `HTML class has CSS ownership: ${className}`);
  }

  const keyframeDefinitions = Array.from(
    css.matchAll(/@keyframes\s+([a-z][a-z0-9-]*)/g),
    ([, name]) => name
  );
  const keyframeReferences = Array.from(
    css.matchAll(/\banimation:\s*([a-z][a-z0-9-]*)/g),
    ([, name]) => name
  ).filter((name) => name !== "none");
  assert.deepEqual([...keyframeDefinitions].sort(), [...keyframeReferences].sort());
  for (const name of keyframeDefinitions) assert.match(name, kebabCase, `keyframes: ${name}`);

  const declaredBindings = Array.from(
    allJavaScriptSource.matchAll(
      new RegExp(`\\b(?:const|let|var|function|class)\\s+(${identifierPatternSource})`, "gu")
    ),
    ([, binding]) => binding
  );
  assert.ok(declaredBindings.length > 0);
  for (const binding of declaredBindings) assert.match(binding, lowerCamelCase, `JavaScript binding: ${binding}`);

  assert.deepEqual(
    Array.from(html.matchAll(/<!--([\s\S]*?)-->/g), ([, comment]) => comment.trim()),
    ["Shaka must load before the module entry initializes the primary video player."]
  );
  assert.deepEqual(
    Array.from(allJavaScriptSource.matchAll(/^\s*\/\/.*$/gm), ([comment]) => comment.trim()),
    ["// Rotation controls are only needed in Instagram's in-app browser."]
  );
  assert.doesNotMatch(allJavaScriptSource, /\/\*/);
  assert.doesNotMatch(css, /\/\*/);
});

test("marketing CSS foundations name and consume only shared design values", () => {
  const tokenDeclarations = [
    "--color-official-machado-wine: #4a0816;",
    "--color-black: #000000;",
    "--color-white: #ffffff;",
    "--color-grey-light: #dddddd;",
    "--color-green: #0aa15b;",
    "--gradient-black-to-wine: linear-gradient(165deg, var(--color-black), var(--color-official-machado-wine));",
    "--gradient-white-to-light-grey: linear-gradient(165deg, var(--color-white), var(--color-grey-light));",
    "--page-max-width: 430px;",
    "--section-call-width: calc(var(--considered-screen-width) * 0.85);",
    "--subsection-width: 95%;",
    "--arrow-button-width: 80px;",
    "--section-close-button-height: 30px;",
    "--subsection-arrow-button-height: 26px;",
    "--quote-cta-content-width: 85%;",
    "--section-heading-text-offset: 14px;",
    "--border-width-thin: 1px;",
    "--focus-outline-width: 3px;",
    "--focus-outline-offset: 3px;",
    "--radius-md: 20px;",
    "--radius-lg: 30px;",
    "--radius-subsection-arrow: 13px;",
    "--shadow-section-close-button: 0px 1px 5px var(--color-white);",
    "--space-xs: 5px;",
    "--space-sm: 10px;",
    "--space-md: 20px;",
    "--space-lg: 30px;",
    "--space-xl: 40px;",
    "--space-2xl: 60px;",
    "--space-3xl: 80px;"
  ];

  for (const declaration of tokenDeclarations) {
    assert.ok(css.includes(declaration), declaration);
    const token = declaration.slice(0, declaration.indexOf(":"));
    assert.ok(css.includes(`var(${token})`), token);
  }

  assert.equal((css.match(/#4a0816/gi) ?? []).length, 1);
  assert.equal((css.match(/#000000/gi) ?? []).length, 1);
  assert.equal((css.match(/#ffffff/gi) ?? []).length, 1);
  assert.equal((css.match(/#0aa15b/gi) ?? []).length, 1);
  assert.equal((css.match(/#dddddd/gi) ?? []).length, 1);
  assert.doesNotMatch(css, /#fff(?![0-9a-f])|#000(?![0-9a-f])|#ddd(?![0-9a-f])/i);
});

test("marketing copy selection and reduced motion distinguish content from controls", () => {
  assert.doesNotMatch(css, /\*\{[^}]*user-select:/);
  assert.match(
    css,
    /button,\s*\.pdf-download-link,\s*#instagram-direct-link,\s*#quote-cta-link\{\s*user-select: none;\s*\}/
  );
  assert.match(css, /\.section-summary\{[^}]*user-select: none;/);
  assert.match(css, /\.subsection-summary\{[^}]*user-select: none;/);
  assert.doesNotMatch(css, /\.subsection-details\{[^}]*user-select:/);
  assert.match(css, /\.testimonial-view-toggle-label\{[^}]*user-select: none;/);

  const reducedMotionBlock = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/
  )?.[1];
  assert.ok(reducedMotionBlock);
  assert.match(
    reducedMotionBlock,
    /#primary-video,\s*\.section-open-button\{\s*animation: none;\s*\}/
  );

  const shakaTransitionSelectors = [
    ".shaka-controls-button-panel",
    ".shaka-statistics-container",
    ".shaka-scrim-container",
    ".shaka-text-container",
    ".shaka-play-button",
    ".shaka-seek-bar-container",
    ".shaka-overflow-menu",
    ".shaka-settings-menu"
  ];
  for (const selector of shakaTransitionSelectors) {
    assert.ok(reducedMotionBlock.includes(selector), selector);
  }
  assert.match(
    reducedMotionBlock,
    /#primary-video-player :where\([\s\S]*?\)\{\s*transition: none;\s*\}/
  );
  assert.match(
    reducedMotionBlock,
    /#primary-video-player :where\(\s*\.shaka-spinner-svg,\s*\.shaka-spinner-path\s*\)\{\s*animation: none;\s*\}/
  );
  assert.equal((reducedMotionBlock.match(/animation: none;/g) ?? []).length, 2);
  assert.equal((reducedMotionBlock.match(/transition: none;/g) ?? []).length, 1);
  assert.equal((css.match(/\banimation:/g) ?? []).length, 4);

  assert.match(
    source,
    /function preferredScrollBehavior\(\) \{\s*if \(typeof window\.matchMedia !== 'function'\) return 'smooth';\s*return window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches \? 'auto' : 'smooth';\s*\}/
  );
  assert.equal((source.match(/\.scrollIntoView\(/g) ?? []).length, 34);
  assert.equal(
    (source.match(/\.scrollIntoView\(\{behavior: preferredScrollBehavior\(\)\}\)/g) ?? []).length,
    34
  );
  assert.doesNotMatch(source, /\.scrollIntoView\(\{behavior: ['"]smooth['"]\}\)/);
});

test("marketing presentation state is expressed through accurate CSS classes", () => {
  const stateClasses = [
    "has-contained-close-button",
    "has-fixed-position",
    "has-fixed-close-button",
    "has-hidden-rotation-control",
    "is-anchored",
    "is-contained",
    "is-fixed",
    "is-fixed-above-quote",
    "is-fixed-near-bottom",
    "is-hidden",
    "is-open",
    "is-restored",
    "is-rotated"
  ];

  for (const className of stateClasses) {
    assert.match(source, new RegExp(`["']${className}["']`), className);
    assert.match(css, new RegExp(`\\.${className}(?![a-z-])`), className);
    assert.match(className, /^(?:has|is)-[a-z]+(?:-[a-z]+)*$/);
  }

  assert.doesNotMatch(
    source,
    /\.style\.(?:display|position|top|bottom|marginBottom|marginLeft|width|height|transform|transformOrigin)\s*=/
  );
  assert.doesNotMatch(
    source,
    /if\s*\(\s*testimonial[1-5]ViewToggleLabel\.innerHTML\s*!==\s*['"]Tela Padrão['"]\s*\)/
  );
  assert.match(source, /classList\.contains\(['"]is-rotated['"]\)/);

  const customPropertyWrites = Array.from(
    source.matchAll(/\.style\.setProperty\(\s*['"]([^'"]+)['"]/g),
    ([, property]) => property
  );
  const allowedCustomProperties = new Set([
    "--quote-cta-height",
    "--quote-cta-top",
    "--section-close-bottom"
  ]);
  assert.deepEqual(new Set(customPropertyWrites), allowedCustomProperties);
  for (const property of customPropertyWrites) {
    assert.ok(allowedCustomProperties.has(property), property);
  }

  assertCssRule([".section-summary.is-hidden"], [/display:\s*none;/]);
  assertCssRule([".subsection-summary.is-hidden"], [/display:\s*none;/]);
  assertCssRule([".testimonial-view-toggle.is-hidden"], [/display:\s*none;/]);
  assertCssStateForTargets(
    Array.from({ length: 4 }, (_, index) => `#section-${index + 1}-details`),
    "is-open",
    [/display:\s*block;/]
  );
  assertCssRule([".subsection-details.is-open"], [/display:\s*block;/]);

  assertCssRule(["#quote-cta-spacer"], [
    /height:\s*var\(--quote-cta-height, auto\);/
  ]);
  assertCssRule(["#quote-cta.is-hidden"], [/display:\s*none;/]);
  assertCssRule(["#quote-cta.is-fixed"], [
    /position:\s*fixed;/,
    /top:\s*auto;/,
    /bottom:\s*0px;/
  ]);
  assertCssRule(["#quote-cta.is-anchored"], [
    /position:\s*absolute;/,
    /top:\s*var\(--quote-cta-top\);/
  ]);
  assertCssRuleOmits(["#quote-cta.is-anchored"], /\bbottom\s*:/);
  assert.match(css, /#quote-cta\{[^}]*bottom:\s*0px;/);

  const sectionCloseSelectors = Array.from(
    { length: 4 },
    (_, index) => `#section-${index + 1}-close-button`
  );
  assertCssStateForTargets(sectionCloseSelectors, "is-hidden", [/display:\s*none;/]);
  assertCssStateForTargets(sectionCloseSelectors, "is-fixed-near-bottom", [
    /position:\s*fixed;/,
    /bottom:\s*25px;/
  ]);
  for (const selector of sectionCloseSelectors) {
    assertCssRuleOmits([selector, ".is-fixed-near-bottom"], /\bdisplay\s*:/);
  }
  assertCssStateForTargets(sectionCloseSelectors, "is-fixed-above-quote", [
    /display:\s*flex;/,
    /position:\s*fixed;/,
    /bottom:\s*var\(--section-close-bottom\);/,
    /margin-bottom:\s*0px;/,
    /margin-left:\s*calc\(\(var\(--considered-screen-width\) \* 0\.50\) - 40px\);/
  ]);
  assertCssStateForTargets(sectionCloseSelectors, "is-contained", [
    /display:\s*flex;/,
    /position:\s*relative;/,
    /bottom:\s*0px;/,
    /margin-bottom:\s*-25px;/,
    /margin-left:\s*calc\(\(var\(--considered-screen-width\) \* 0\.50\) - 40px\);/
  ]);
  assertCssRule([".section-quote-prompt.has-fixed-close-button"], [
    /margin-bottom:\s*var\(--space-md\);/
  ]);
  assertCssRule([".section-quote-prompt.has-contained-close-button"], [
    /margin-bottom:\s*15px;/
  ]);

  assertCssRule(["#instagram-direct-link.is-hidden"], [/display:\s*none;/]);
  assertCssRule(["#instagram-direct-link.is-fixed"], [
    /display:\s*block;/,
    /position:\s*fixed;/,
    /width:\s*60px;/,
    /bottom:\s*160px;/,
    /margin-bottom:\s*0px;/,
    /margin-left:\s*calc\(\(var\(--considered-screen-width\) \* 0\.95\) - 60px\);/
  ]);
  assertCssRule(["#instagram-direct-link.is-contained"], [
    /display:\s*flex;/,
    /position:\s*relative;/,
    /width:\s*60px;/,
    /bottom:\s*var\(--space-lg\);/,
    /margin-bottom:\s*calc\(-1 \* var\(--space-2xl\)\);/,
    /margin-left:\s*calc\(\(var\(--considered-screen-width\) \* 0\.95\) - 60px\);/
  ]);
  assertCssRule(["#instagram-direct-link.has-fixed-position"], [
    /position:\s*fixed;/
  ]);
  assertCssRuleOmits(["#instagram-direct-link.has-fixed-position"], /\bdisplay\s*:/);

  assertCssRule([".testimonial-video.has-hidden-rotation-control"], [
    /margin-bottom:\s*var\(--space-lg\);/
  ]);
  assertCssRule([".testimonial-video-container.is-rotated"], [
    /width:\s*calc\(var\(--considered-screen-width\) \* 0\.80\);/,
    /height:\s*calc\(var\(--considered-screen-width\) \* 1\.42196\);/
  ]);
  assertCssRule([".testimonial-video-container.is-rotated > .testimonial-video"], [
    /width:\s*calc\(var\(--considered-screen-width\) \* 1\.42196\);/,
    /height:\s*calc\(var\(--considered-screen-width\) \* 0\.80\);/,
    /transform-origin:\s*top left;/,
    /transform:\s*rotate\(90deg\) translateY\(-100%\);/
  ]);
  assertCssRule([".testimonial-video-container.is-restored"], [
    /width:\s*calc\(var\(--considered-screen-width\) \* 0\.90\);/,
    /height:\s*calc\(var\(--considered-screen-width\) \* 0\.50634\);/
  ]);
  assertCssRule([".testimonial-video-container.is-restored > .testimonial-video"], [
    /width:\s*calc\(var\(--considered-screen-width\) \* 0\.90\);/,
    /height:\s*calc\(var\(--considered-screen-width\) \* 0\.50634\);/
  ]);
});

test("marketing interactions use native controls with complete relationships and focus styles", () => {
  const sectionOpeners = Array.from(
    { length: 4 },
    (_, index) => `section-${index + 1}-open-button`
  );
  const subsectionOpeners = [
    ...Array.from({ length: 5 }, (_, index) => `section-3-subsection-${index + 1}-open-button`),
    ...Array.from({ length: 3 }, (_, index) => `section-4-subsection-${index + 1}-open-button`)
  ];
  const disclosureOpeners = [...sectionOpeners, ...subsectionOpeners];
  const buttons = Array.from(html.matchAll(/<button\b[^>]*>/g), ([tag]) => tag);

  assert.equal(buttons.length, 29);
  for (const button of buttons) {
    assert.match(button, /\btype="button"/);
    const controlledId = button.match(/\baria-controls="([^"]+)"/)?.[1];
    assert.ok(controlledId, button);
    assert.ok(htmlIds.has(controlledId), controlledId);
  }

  assert.equal(disclosureOpeners.length, 12);
  for (const id of disclosureOpeners) {
    const tag = openingTag(id);
    assert.match(tag, /^<button\b/);
    assert.match(tag, /\baria-expanded="false"/);
    const labelledBy = tag.match(/\baria-labelledby="([^"]+)"/)?.[1];
    assert.ok(labelledBy, id);
    for (const labelId of labelledBy.split(/\s+/)) assert.ok(htmlIds.has(labelId), labelId);
  }

  const disclosurePairs = [
    ...Array.from({ length: 4 }, (_, index) => {
      const number = index + 1;
      return {
        close: `section-${number}-close-button`,
        controlled: `section-${number}-details`,
        label: `Fechar seção ${number}`,
        open: `section-${number}-open-button`
      };
    }),
    ...[[3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [4, 1], [4, 2], [4, 3]].map(([section, subsection]) => ({
      close: `section-${section}-subsection-${subsection}-close-button`,
      controlled: `section-${section}-subsection-${subsection}-details`,
      label: `Fechar subseção ${section}.${subsection}`,
      open: `section-${section}-subsection-${subsection}-open-button`
    }))
  ];

  for (const { close, controlled, label, open } of disclosurePairs) {
    assert.equal(openingTag(open).match(/\baria-controls="([^"]+)"/)?.[1], controlled);
    assert.equal(openingTag(close).match(/\baria-controls="([^"]+)"/)?.[1], controlled);
    assert.equal(openingTag(close).match(/\baria-label="([^"]+)"/)?.[1], label);
  }

  for (const [section, count] of [[3, 5], [4, 3]]) {
    for (let subsection = 1; subsection <= count; subsection += 1) {
      assert.match(
        openingTag(`section-${section}-subsection-${subsection}-summary-heading`),
        /\bclass="subsection-summary-heading"/
      );
      assert.match(
        openingTag(`section-${section}-subsection-${subsection}-details-heading`),
        /\bclass="subsection-details-heading programmatic-focus-target"/
      );
    }
  }

  for (let number = 1; number <= 5; number += 1) {
    const tag = openingTag(`testimonial-${number}-view-toggle`);
    assert.match(tag, /^<button\b/);
    assert.match(tag, /\baria-pressed="false"/);
    assert.match(tag, new RegExp(`aria-controls="testimonial-${number}-video-container"`));
    assert.match(
      tag,
      new RegExp(`aria-label="Modo Tela Cheia do vídeo de depoimento ${number}; alternar entre Tela Cheia e Tela Padrão"`)
    );
  }

  const variableIds = new Map(
    Array.from(
      source.matchAll(/var\s+([\p{L}\p{N}_]+)\s*=\s*document\.\s*getElementById\("([^"]+)"\)/gu),
      ([, variable, id]) => [variable, id]
    )
  );
  const clickListenerIds = Array.from(
    source.matchAll(/([\p{L}\p{N}_]+)\.addEventListener\("click"/gu),
    ([, variable]) => variableIds.get(variable)
  );

  assert.equal(clickListenerIds.length, 29);
  assert.ok(clickListenerIds.every(Boolean));
  for (const id of clickListenerIds) assert.match(openingTag(id), /^<button\b/);

  assert.equal((html.match(/\btabindex="-1"/g) ?? []).length, 12);
  assert.doesNotMatch(html, /\btabindex="[1-9][0-9]*"/);
  assert.doesNotMatch(html, /\brole="button"|\bonclick=/);
  assert.doesNotMatch(source, /\b(?:keydown|keypress|keyup)\b|window\.open\(|window\.location\.href\s*=/);

  assert.match(css, /\.section-summary\{[\s\S]*?position: relative;/);
  assert.match(css, /\.subsection-summary\{[\s\S]*?position: relative;/);
  assert.match(css, /:where\([\s\S]*?button\.section-open-button,[\s\S]*?\)\{/);
  assert.match(css, /\.section-open-button\{[\s\S]*?font-size: 14px;/);
  assert.match(
    css,
    /\.subsection-summary\{[\s\S]*?border: var\(--border-width-thin\) solid var\(--color-white\);/
  );
  assert.match(
    css,
    /\.section-open-button::after\{[\s\S]*?position: absolute;[\s\S]*?inset: 0;/
  );
  assert.match(
    css,
    /\.subsection-open-button::after\{[\s\S]*?position: absolute;[\s\S]*?inset: calc\(-1 \* var\(--border-width-thin\)\);[\s\S]*?border-radius: var\(--radius-md\);/
  );
  assert.match(
    css,
    /\.section-open-button:focus-visible,[\s\S]*?a\.content-link-white:focus-visible\{\s*outline: var\(--focus-outline-width\) solid var\(--color-white\);\s*outline-offset: var\(--focus-outline-offset\);\s*\}/
  );
  assert.match(
    css,
    /\.subsection-close-button:focus-visible,[\s\S]*?#quote-cta-link:focus-visible\{\s*outline: var\(--focus-outline-width\) solid var\(--color-official-machado-wine\);\s*outline-offset: var\(--focus-outline-offset\);\s*\}/
  );
  assert.match(css, /\.programmatic-focus-target:focus\{[\s\S]*?outline: none;/);
  assert.equal((css.match(/outline:\s*none/g) ?? []).length, 1);

  const decorativeControlSvgs = Array.from(
    html.matchAll(/<svg\b[^>]*\baria-hidden="true"[^>]*\bfocusable="false"[^>]*>/g)
  );
  assert.equal(decorativeControlSvgs.length, 24);
  assert.equal(
    (html.match(/<img class="testimonial-view-toggle-icon"[^>]*\balt=""[^>]*\baria-hidden="true"[^>]*>/g) ?? []).length,
    5
  );
  assert.match(
    html,
    /<a id="instagram-direct-link"[^>]*> <img src="\.\/landing-page\/img\/INSTAGRAM_DIRECT\.png" alt="" loading="lazy"> <\/a>/
  );
});

test("marketing scrolling responds to live reduced-motion preferences", () => {
  const ordinary = createHarness();
  ordinary.dispatch("section-1-open-button");
  assertScrollThenFocus(
    ordinary,
    "section-1-details",
    "section-1-details-heading"
  );
  ordinary.setReducedMotion(true);
  ordinary.dispatch("section-1-close-button");
  assertScrollThenFocus(
    ordinary,
    "section-1-summary",
    "section-1-open-button"
  );
  ordinary.setReducedMotion(false);
  ordinary.dispatch("section-1-open-button");
  assertScrollThenFocus(
    ordinary,
    "section-1-details",
    "section-1-details-heading"
  );
  assert.deepEqual(
    ordinary.scrollCalls.map(({ options }) => options.behavior),
    ["smooth", "auto", "smooth"]
  );
  assert.deepEqual(
    ordinary.mediaQueryCalls,
    Array(ordinary.scrollCalls.length).fill(REDUCED_MOTION_QUERY)
  );

  const reduced = createHarness({ reducedMotion: true });
  reduced.dispatch("section-3-open-button");
  assertScrollThenFocus(
    reduced,
    "section-3-details",
    "section-3-details-heading"
  );
  reduced.dispatch("section-3-close-button");
  assertScrollThenFocus(
    reduced,
    "section-3-summary",
    "section-3-open-button"
  );
  reduced.dispatch("section-3-open-button");

  reduced.dispatch("section-3-subsection-1-open-button");
  assertScrollThenFocus(
    reduced,
    "section-3-subsection-1-details",
    "section-3-subsection-1-details-heading"
  );
  reduced.dispatch("section-3-subsection-1-close-button");
  assertScrollThenFocus(
    reduced,
    "section-3-subsection-1-summary",
    "section-3-subsection-1-open-button"
  );

  reduced.dispatch("section-4-open-button");
  reduced.dispatch("section-4-subsection-3-open-button");
  reduced.dispatch("testimonial-1-view-toggle");
  assertLastScroll(reduced, "testimonial-1-video");
  reduced.dispatch("testimonial-1-view-toggle");
  assertLastScroll(reduced, "testimonial-1-video");
  assert.ok(reduced.scrollCalls.every(({ options }) => options.behavior === "auto"));
  assert.ok(reduced.mediaQueryCalls.every((query) => query === REDUCED_MOTION_QUERY));
  assert.equal(reduced.mediaQueryCalls.length, reduced.scrollCalls.length);

  const unsupported = createHarness({ supportsMatchMedia: false });
  unsupported.dispatch("section-2-open-button");
  assertLastScroll(unsupported, "section-2-details");
  assert.deepEqual(unsupported.mediaQueryCalls, []);
});

test("document language, landmarks, and heading hierarchy describe the current page", () => {
  assert.match(html, /^<!DOCTYPE html>\r?\n<html lang="pt-BR">/);
  assert.equal((html.match(/<header\b/g) ?? []).length, 1);
  assert.equal((html.match(/<main\b/g) ?? []).length, 1);
  assert.equal((html.match(/<aside\b/g) ?? []).length, 1);
  assert.match(html, /<header id="hero">/);
  assert.match(
    html,
    /<aside id="quote-cta" aria-labelledby="quote-cta-context">/
  );

  const headerStart = html.indexOf("<header id=\"hero\">");
  const headerEnd = html.indexOf("</header>");
  const mainStart = html.indexOf("<main>");
  const mainEnd = html.indexOf("</main>");
  const asideStart = html.indexOf("<aside id=\"quote-cta\"");
  const asideEnd = html.indexOf("</aside>");
  assert.ok(headerStart < headerEnd);
  assert.ok(headerEnd < mainStart);
  assert.ok(mainStart < mainEnd);
  assert.ok(mainEnd < asideStart);
  assert.ok(asideStart < asideEnd);

  for (let number = 1; number <= 4; number += 1) {
    assert.match(
      html,
      new RegExp(
        `<section class="program-section" id="section-${number}" aria-labelledby="section-${number}-summary-heading">`
      )
    );
    assert.match(
      html,
      new RegExp(
        `<h2 class="section-summary-heading" id="section-${number}-summary-heading">`
      )
    );
    assert.match(
      html,
      new RegExp(
        `<h2 id="section-${number}-details-heading" class="programmatic-focus-target" tabindex="-1">`
      )
    );
  }

  const headingLevels = Array.from(
    html.matchAll(/<h([1-6])\b/g),
    ([, level]) => Number(level)
  );
  assert.deepEqual(
    headingLevels.reduce((counts, level) => {
      counts[level] += 1;
      return counts;
    }, [0, 0, 0, 0, 0, 0, 0]),
    [0, 1, 8, 18, 16, 0, 0]
  );
  assert.match(html, /<h1 id="hero-heading">/);
  assert.doesNotMatch(html, /<h[5-6]\b/);
  for (let index = 1; index < headingLevels.length; index += 1) {
    assert.ok(
      headingLevels[index] <= headingLevels[index - 1] + 1,
      `heading level jumps from h${headingLevels[index - 1]} to h${headingLevels[index]}`
    );
  }
  assert.match(css, /h1, h2, h3, h4\{\s*font-weight: inherit;\s*\}/);
});

test("every new-tab navigation prevents opener access without changing its destination", () => {
  const links = Array.from(
    html.matchAll(/<a\b[^>]*\btarget="_blank"[^>]*>/g),
    ([tag]) => ({
      href: tag.match(/\bhref="([^"]+)"/)?.[1],
      rel: tag.match(/\brel="([^"]+)"/)?.[1],
      tag
    })
  );

  assert.deepEqual(
    links.map(({ href }) => href),
    [
      "https://online.hbs.edu/blog/post/from-core-to-connext-2019",
      "/landing-page/pdf/EMENTA E SOFTWARES.pdf",
      "/landing-page/pdf/BIBLIOGRAFIA.pdf",
      "/landing-page/pdf/CRONOGRAMA.pdf",
      "https://ig.me/m/machado.gestao"
    ]
  );
  for (const link of links) assert.ok(link.rel.split(/\s+/).includes("noopener"), link.tag);
  assert.equal((html.match(/<a\b/g) ?? []).length, 6);
  assert.doesNotMatch(source, /window\.open\(/);
});

test("external article, media, Instagram, and Shaka URLs remain exact", () => {
  const testimonialSuffix = "?sp=r&st=2024-11-01T11:00:00Z&se=2050-01-01T03:00:00Z&spr=https&sv=2022-11-02&sr=c&sig=o%2FEOtQQlRp4%2F0Iu4Pbn4EghosVs6DoYgIkr4kUfclIc%3D";
  const htmlUrls = Array.from(
    html.matchAll(/\b(?:href|src)="(https:\/\/[^\"]+)"/g),
    ([, url]) => url
  );

  assert.deepEqual(htmlUrls, [
    "https://online.hbs.edu/blog/post/from-core-to-connext-2019",
    "https://ig.me/m/machado.gestao",
    ...Array.from(
      { length: 5 },
      (_, index) => `https://videospreparatoriosv2.blob.core.windows.net/videosv3/LandingPagePJ/Depoimento-${index + 1}.mp4${testimonialSuffix}`
    ),
    "https://cdn.jsdelivr.net/npm/shaka-player@4.3.5/dist/controls.css",
    "https://cdn.jsdelivr.net/npm/shaka-player@4.3.5/dist/shaka-player.ui.js"
  ]);

  assert.deepEqual(
    Array.from(source.matchAll(/"(https:\/\/[^\"]+)"/g), ([, url]) => url),
    [HLS_URL]
  );
});

test("marketing favicon is byte-identical to the login favicon", () => {
  const loginFavicon = fs.readFileSync(
    path.join(repositoryRoot, "plataforma_v2", "login", "img", "FAVICON.ico")
  );
  const marketingFavicon = fs.readFileSync(
    path.join(marketingRoot, "img", "FAVICON.ico")
  );

  assert.equal(marketingFavicon.length, 23837);
  assert.equal(Buffer.compare(marketingFavicon, loginFavicon), 0);
  assert.equal(
    crypto.createHash("sha256").update(marketingFavicon).digest("hex"),
    "83cc9715e1338aea9741ce926dd1afee88353242ff8d6bce7ecdb9507f3b1407"
  );
});

test("primary video initializes once with the exact poster, HLS source, and Shaka controls", async () => {
  let resolvePlayerLoad;
  const playerLoadPromise = new Promise((resolve) => {
    resolvePlayerLoad = resolve;
  });
  const harness = createHarness({ playerLoadPromise });
  const outer = harness.element("primary-video-frame");
  const inner = harness.element("primary-video-player");
  const video = harness.element("primary-video");

  assert.deepEqual(harness.observer.observeCalls, [outer]);
  harness.observer.trigger(outer, false);
  assert.equal(harness.playerInstances.length, 0);
  assert.equal(video.getAttribute("poster"), null);

  harness.observer.trigger(outer, true);
  harness.observer.trigger(outer, true);
  assert.equal(harness.playerInstances.length, 1);
  assert.equal(harness.overlayInstances.length, 1);
  assert.deepEqual(harness.playerInstances[0].loadCalls, [HLS_URL]);

  resolvePlayerLoad();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(inner.getAttribute("data-shaka-player-container"), "");
  assert.equal(video.getAttribute("data-shaka-player"), "");
  assert.equal(video.getAttribute("poster"), POSTER_URL);
  assert.equal(video.getAttribute("src"), HLS_URL);
  assert.equal(video.getAttribute("controls"), null);
  assert.deepEqual(harness.consoleErrors, []);
  assert.equal(harness.playerInstances.length, 1);
  assert.equal(harness.polyfillInstallCalls, 1);
  assert.equal(harness.playerInstances[0].video, video);
  assert.deepEqual(harness.playerInstances[0].loadCalls, [HLS_URL]);
  assert.equal(harness.overlayInstances.length, 1);
  assert.equal(harness.overlayInstances[0].player, harness.playerInstances[0]);
  assert.equal(harness.overlayInstances[0].container, inner);
  assert.equal(harness.overlayInstances[0].video, video);
  assert.deepEqual(
    Array.from(harness.overlayInstances[0].configureCalls[0].overflowMenuButtons),
    ["quality", "playback_rate"]
  );
  assert.deepEqual(harness.observer.unobserveCalls, [outer]);

  harness.observer.trigger(outer, true);
  assert.equal(harness.playerInstances.length, 1);
  assert.equal(harness.overlayInstances.length, 1);
});

test("primary video contains missing-runtime and rejected-load failures", async () => {
  const noObserver = createHarness({ supportsIntersectionObserver: false });
  assert.equal(noObserver.observer, null);
  assert.equal(noObserver.playerInstances.length, 1);
  assert.equal(noObserver.polyfillInstallCalls, 1);
  assert.equal(noObserver.element("primary-video").getAttribute("controls"), null);

  const noShaka = createHarness({ shakaAvailable: false });
  noShaka.observer.trigger(noShaka.element("primary-video-frame"), true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(noShaka.playerInstances.length, 0);
  assert.equal(noShaka.element("primary-video").getAttribute("poster"), POSTER_URL);
  assert.equal(noShaka.element("primary-video").getAttribute("src"), HLS_URL);
  assert.equal(noShaka.element("primary-video").getAttribute("controls"), "");
  assert.equal(noShaka.element("primary-video").getAttribute("data-shaka-player"), null);
  assert.doesNotThrow(() => noShaka.dispatch("section-1-open-button"));

  const unsupported = createHarness({ shakaSupported: false });
  unsupported.observer.trigger(unsupported.element("primary-video-frame"), true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(unsupported.polyfillInstallCalls, 1);
  assert.equal(unsupported.playerInstances.length, 0);
  assert.equal(unsupported.element("primary-video").getAttribute("controls"), "");

  const loadError = new Error("manifest unavailable");
  const rejected = createHarness({ playerLoadError: loadError });
  rejected.observer.trigger(rejected.element("primary-video-frame"), true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rejected.playerInstances.length, 1);
  assert.equal(rejected.element("primary-video").getAttribute("controls"), "");
  assert.equal(rejected.element("primary-video").loadCalls, 1);
  assert.equal(rejected.playerInstances[0].destroyCalls, 1);
  assert.equal(rejected.overlayInstances[0].destroyCalls, 1);
  assert.equal(rejected.consoleErrors.length, 1);
  assert.deepEqual(rejected.consoleErrors[0], [loadError]);
  assert.deepEqual(rejected.observer.unobserveCalls, []);

  rejected.setPlayerLoadError(null);
  rejected.observer.trigger(rejected.element("primary-video-frame"), false);
  rejected.observer.trigger(rejected.element("primary-video-frame"), true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rejected.playerInstances.length, 2);
  assert.equal(rejected.overlayInstances.length, 2);
  assert.equal(rejected.playerInstances[1].destroyCalls, 0);
  assert.equal(rejected.overlayInstances[1].destroyCalls, 0);
  assert.equal(rejected.element("primary-video").getAttribute("controls"), null);
  assert.equal(rejected.element("primary-video").getAttribute("data-shaka-player"), "");
  assert.deepEqual(rejected.observer.unobserveCalls, [rejected.element("primary-video-frame")]);
});

test("top-level sections keep one section open and preserve open and close scroll targets", () => {
  for (let selected = 1; selected <= 4; selected += 1) {
    const harness = createHarness();
    const openerId = `section-${selected}-open-button`;
    harness.element(openerId).focus();
    harness.dispatch(openerId);

    for (let number = 1; number <= 4; number += 1) {
      assertClassState(harness.element(`section-${number}-summary`), {
        absent: number === selected ? [] : ["is-hidden"],
        present: number === selected ? ["is-hidden"] : []
      });
      assertClassState(harness.element(`section-${number}-details`), {
        absent: number === selected ? [] : ["is-open"],
        present: number === selected ? ["is-open"] : []
      });
      assert.equal(
        harness.element(`section-${number}-open-button`).getAttribute("aria-expanded"),
        number === selected ? "true" : "false",
        `section ${selected}, expanded ${number}`
      );
    }

    assertLastScroll(harness, `section-${selected}-details`);
    assertScrollThenFocus(
      harness,
      `section-${selected}-details`,
      `section-${selected}-details-heading`
    );
    assertClassState(harness.element(`section-${selected}-close-button`), {
      absent: ["is-hidden", "is-fixed-above-quote", "is-contained"],
      present: ["is-fixed-near-bottom"]
    });

    if (selected === 3) {
      harness.dispatch("section-3-subsection-2-open-button");
      assert.equal(harness.element("section-3-subsection-2-open-button").getAttribute("aria-expanded"), "true");
    }
    if (selected === 4) {
      harness.dispatch("section-4-subsection-2-open-button");
      assert.equal(harness.element("section-4-subsection-2-open-button").getAttribute("aria-expanded"), "true");
      assertClassState(harness.element("instagram-direct-link"), {
        absent: ["is-contained", "is-fixed", "is-hidden"],
        present: ["has-fixed-position"]
      });
    }

    harness.dispatch(`section-${selected}-close-button`);
    assertClassState(harness.element(`section-${selected}-summary`), {
      absent: ["is-hidden"]
    });
    assertClassState(harness.element(`section-${selected}-details`), {
      absent: ["is-open"]
    });
    assertLastScroll(harness, `section-${selected}-summary`);
    assert.equal(harness.element(openerId).getAttribute("aria-expanded"), "false");
    assertScrollThenFocus(harness, `section-${selected}-summary`, openerId);

    if (selected === 3) {
      for (let number = 1; number <= 5; number += 1) {
        assertClassState(harness.element(`section-3-subsection-${number}-summary`), {
          absent: ["is-hidden"]
        });
        assertClassState(harness.element(`section-3-subsection-${number}-details`), {
          absent: ["is-open"]
        });
        assert.equal(
          harness.element(`section-3-subsection-${number}-open-button`).getAttribute("aria-expanded"),
          "false"
        );
      }
    }
    if (selected === 4) {
      for (let number = 1; number <= 3; number += 1) {
        assertClassState(harness.element(`section-4-subsection-${number}-summary`), {
          absent: ["is-hidden"]
        });
        assertClassState(harness.element(`section-4-subsection-${number}-details`), {
          absent: ["is-open"]
        });
        assert.equal(
          harness.element(`section-4-subsection-${number}-open-button`).getAttribute("aria-expanded"),
          "false"
        );
      }
    }
  }

  const sequential = createHarness();
  sequential.dispatch("section-1-open-button");
  sequential.dispatch("section-2-open-button");
  assert.equal(
    sequential.element("section-1-open-button").getAttribute("aria-expanded"),
    "false"
  );
  assert.equal(
    sequential.element("section-2-open-button").getAttribute("aria-expanded"),
    "true"
  );
  for (let number = 1; number <= 4; number += 1) {
    assertClassState(sequential.element(`section-${number}-summary`), {
      absent: number === 2 ? [] : ["is-hidden"],
      present: number === 2 ? ["is-hidden"] : []
    });
    assertClassState(sequential.element(`section-${number}-details`), {
      absent: number === 2 ? [] : ["is-open"],
      present: number === 2 ? ["is-open"] : []
    });
  }
});

test("section 3 and 4 subsections keep one panel open and return to the closed header", () => {
  for (const [section, count] of [[3, 5], [4, 3]]) {
    for (let selected = 1; selected <= count; selected += 1) {
      const harness = createHarness();
      const openerId = `section-${section}-subsection-${selected}-open-button`;
      harness.element(openerId).focus();
      harness.dispatch(openerId);

      for (let number = 1; number <= count; number += 1) {
        assertClassState(harness.element(`section-${section}-subsection-${number}-summary`), {
          absent: number === selected ? [] : ["is-hidden"],
          present: number === selected ? ["is-hidden"] : []
        });
        assertClassState(harness.element(`section-${section}-subsection-${number}-details`), {
          absent: number === selected ? [] : ["is-open"],
          present: number === selected ? ["is-open"] : []
        });
        assert.equal(
          harness.element(`section-${section}-subsection-${number}-open-button`).getAttribute("aria-expanded"),
          number === selected ? "true" : "false",
          `subsection ${section}.${selected}, expanded ${number}`
        );
      }

      assertLastScroll(harness, `section-${section}-subsection-${selected}-details`);
      assertScrollThenFocus(
        harness,
        `section-${section}-subsection-${selected}-details`,
        `section-${section}-subsection-${selected}-details-heading`
      );
      if (section === 4 && selected === 2) {
        assert.match(
          harness.element("client-statistics-updated-at").innerHTML,
          /^Data e hora de atualização: /
        );
      }

      harness.dispatch(`section-${section}-subsection-${selected}-close-button`);
      assertClassState(harness.element(`section-${section}-subsection-${selected}-summary`), {
        absent: ["is-hidden"]
      });
      assertClassState(harness.element(`section-${section}-subsection-${selected}-details`), {
        absent: ["is-open"]
      });
      assert.equal(harness.element(openerId).getAttribute("aria-expanded"), "false");
      assertLastScroll(harness, `section-${section}-subsection-${selected}-summary`);
      assertScrollThenFocus(harness, `section-${section}-subsection-${selected}-summary`, openerId);
    }
  }

  for (const section of [3, 4]) {
    const sequential = createHarness();
    sequential.dispatch(`section-${section}-subsection-1-open-button`);
    sequential.dispatch(`section-${section}-subsection-2-open-button`);
    assert.equal(
      sequential.element(`section-${section}-subsection-1-open-button`).getAttribute("aria-expanded"),
      "false"
    );
    assert.equal(
      sequential.element(`section-${section}-subsection-2-open-button`).getAttribute("aria-expanded"),
      "true"
    );
    const count = section === 3 ? 5 : 3;
    for (let number = 1; number <= count; number += 1) {
      assertClassState(sequential.element(`section-${section}-subsection-${number}-summary`), {
        absent: number === 2 ? [] : ["is-hidden"],
        present: number === 2 ? ["is-hidden"] : []
      });
      assertClassState(sequential.element(`section-${section}-subsection-${number}-details`), {
        absent: number === 2 ? [] : ["is-open"],
        present: number === 2 ? ["is-open"] : []
      });
    }
  }
});

test("implicit section switches preserve nested state while explicit closes reset it", () => {
  for (const section of [3, 4]) {
    const harness = createHarness();
    const subsection = 2;
    const subsectionOpener = `section-${section}-subsection-${subsection}-open-button`;

    harness.dispatch(`section-${section}-open-button`);
    harness.dispatch(subsectionOpener);
    assert.equal(harness.element(subsectionOpener).getAttribute("aria-expanded"), "true");

    harness.dispatch("section-1-open-button");
    assert.equal(
      harness.element(`section-${section}-open-button`).getAttribute("aria-expanded"),
      "false"
    );
    assert.equal(harness.element(subsectionOpener).getAttribute("aria-expanded"), "true");
    assertClassState(harness.element(`section-${section}-subsection-${subsection}-summary`), {
      present: ["is-hidden"]
    });
    assertClassState(harness.element(`section-${section}-subsection-${subsection}-details`), {
      present: ["is-open"]
    });

    harness.dispatch(`section-${section}-open-button`);
    assert.equal(harness.element(subsectionOpener).getAttribute("aria-expanded"), "true");
    harness.dispatch(`section-${section}-close-button`);
    assert.equal(harness.element(subsectionOpener).getAttribute("aria-expanded"), "false");
    assertClassState(harness.element(`section-${section}-subsection-${subsection}-summary`), {
      absent: ["is-hidden"]
    });
    assertClassState(harness.element(`section-${section}-subsection-${subsection}-details`), {
      absent: ["is-open"]
    });
  }
});

test("scroll state initializes and refreshes from viewport and page lifecycle events", () => {
  const restored = createHarness({ initialScrollY: SECTION_TOPS[2] + 1 });
  for (const eventType of ["scroll", "resize", "load", "pageshow"]) {
    assert.equal(restored.windowListeners.get(eventType)?.length, 1, eventType);
  }
  assert.equal(restored.windowListeners.get("scroll")[0].options.passive, true);
  assertClassState(restored.element("quote-cta"), {
    absent: ["is-anchored", "is-hidden"],
    present: ["is-fixed"]
  });
  assertClassState(restored.element("section-3-close-button"), {
    absent: ["is-contained", "is-fixed-near-bottom", "is-hidden"],
    present: ["is-fixed-above-quote"]
  });
  assertClassState(restored.element("instagram-direct-link"), {
    absent: ["has-fixed-position", "is-contained", "is-hidden"],
    present: ["is-fixed"]
  });

  const fractionalLanding = createHarness({
    initialScrollY: SECTION_TOPS[0] - 0.25
  });
  assertClassState(fractionalLanding.element("section-1-close-button"), {
    absent: ["is-contained", "is-fixed-near-bottom", "is-hidden"],
    present: ["is-fixed-above-quote"]
  });

  const resized = createHarness({ initialScrollY: 2400 });
  const section1CloseButton = resized.element("section-1-close-button");
  assertClassState(section1CloseButton, {
    absent: ["is-fixed-above-quote", "is-fixed-near-bottom", "is-hidden"],
    present: ["is-contained"]
  });
  resized.resizeTo(600);
  assertClassState(section1CloseButton, {
    absent: ["is-contained", "is-fixed-near-bottom", "is-hidden"],
    present: ["is-fixed-above-quote"]
  });
  resized.element("section-2").offsetTop = 2800;
  resized.dispatchWindowEvent("pageshow");
  assertClassState(section1CloseButton, {
    absent: ["is-fixed-above-quote", "is-fixed-near-bottom", "is-hidden"],
    present: ["is-contained"]
  });

  const loaded = createHarness();
  loaded.element("section-1").offsetTop = 700;
  loaded.dispatchWindowEvent("load");
  assertClassState(loaded.element("quote-cta"), {
    absent: ["is-fixed", "is-hidden"],
    present: ["is-anchored"]
  });
});

test("quote CTA preserves visibility thresholds, positioning, and destination", () => {
  const harness = createHarness();
  const cta = harness.element("quote-cta");
  const spacer = harness.element("quote-cta-spacer");

  assertClassState(cta, {
    absent: ["is-anchored"],
    present: ["is-fixed", "is-hidden"]
  });
  harness.scrollTo(SECTION_TOPS[0] - VIEWPORT_HEIGHT - 1);
  assertClassState(cta, {
    absent: ["is-anchored"],
    present: ["is-fixed", "is-hidden"]
  });

  harness.scrollTo(SECTION_TOPS[0] - VIEWPORT_HEIGHT);
  assertClassState(cta, {
    absent: ["is-hidden", "is-fixed"],
    present: ["is-anchored"]
  });
  assertCustomProperty(spacer, "--quote-cta-height", `${CTA_HEIGHT}px`);
  assertCustomProperty(cta, "--quote-cta-top", `${SECTION_TOPS[0]}px`);

  const fixedThreshold = SECTION_TOPS[0] + CTA_HEIGHT - VIEWPORT_HEIGHT;
  harness.scrollTo(fixedThreshold - 1);
  assertClassState(cta, {
    absent: ["is-hidden", "is-fixed"],
    present: ["is-anchored"]
  });
  harness.scrollTo(fixedThreshold);
  assertClassState(cta, {
    absent: ["is-anchored", "is-hidden"],
    present: ["is-fixed"]
  });

  harness.scrollTo(fixedThreshold - 1);
  assertClassState(cta, {
    absent: ["is-hidden", "is-fixed"],
    present: ["is-anchored"]
  });
  harness.scrollTo(fixedThreshold);
  assertClassState(cta, {
    absent: ["is-anchored", "is-hidden"],
    present: ["is-fixed"]
  });

  harness.scrollTo(0);
  assertClassState(cta, {
    absent: ["is-anchored"],
    present: ["is-fixed", "is-hidden"]
  });

  const updatedCtaHeight = CTA_HEIGHT + 25;
  const updatedSectionTop = SECTION_TOPS[0] + 100;
  cta.offsetHeight = updatedCtaHeight;
  harness.element("section-1").offsetTop = updatedSectionTop;
  harness.scrollTo(updatedSectionTop - VIEWPORT_HEIGHT);
  assertClassState(cta, {
    absent: ["is-hidden", "is-fixed"],
    present: ["is-anchored"]
  });
  assertCustomProperty(spacer, "--quote-cta-height", `${updatedCtaHeight}px`);
  assertCustomProperty(cta, "--quote-cta-top", `${updatedSectionTop}px`);

  const quoteLink = openingTag("quote-cta-link");
  assert.match(quoteLink, /^<a\b/);
  assert.match(quoteLink, /\bhref="\/solicitacao-orcamento\/"/);
  assert.match(quoteLink, /\baria-describedby="quote-cta-context"/);
  assert.doesNotMatch(quoteLink, /\btarget=/);
});

test("quote CTA stays above the closed summary click surfaces", () => {
  assert.match(css, /\.section-open-button::after\{[^}]*z-index:\s*1;/);
  assert.match(css, /\.subsection-open-button::after\{[^}]*z-index:\s*1;/);
  assert.match(css, /#quote-cta\{[^}]*z-index:\s*2;/);
});

test("section close arrows keep their hidden, fixed, and relative boundaries", () => {
  const nextTops = [...SECTION_TOPS.slice(1), FINAL_SPACER_TOP];
  const arrowStates = [
    "is-contained",
    "is-fixed-above-quote",
    "is-fixed-near-bottom",
    "is-hidden"
  ];
  const promptStates = [
    "has-contained-close-button",
    "has-fixed-close-button"
  ];

  for (let number = 1; number <= 4; number += 1) {
    const harness = createHarness();
    const arrow = harness.element(`section-${number}-close-button`);
    const signup = harness.element(`section-${number}-quote-prompt`);
    const start = SECTION_TOPS[number - 1];
    const tail = nextTops[number - 1] - VIEWPORT_HEIGHT + CTA_HEIGHT;
    const otherSection = number === 4 ? 1 : number + 1;

    assertClassState(arrow, {
      absent: arrowStates.filter((state) => state !== "is-hidden"),
      present: ["is-hidden"]
    });
    assertClassState(signup, { absent: promptStates });

    harness.dispatch(`section-${number}-open-button`);
    assertClassState(arrow, {
      absent: arrowStates.filter((state) => state !== "is-fixed-near-bottom"),
      present: ["is-fixed-near-bottom"]
    });
    assertClassState(signup, { absent: promptStates });

    harness.scrollTo(start + 1);
    assertClassState(arrow, {
      absent: arrowStates.filter((state) => state !== "is-fixed-above-quote"),
      present: ["is-fixed-above-quote"]
    });
    assertClassState(signup, {
      absent: ["has-contained-close-button"],
      present: ["has-fixed-close-button"]
    });
    assertCustomProperty(arrow, "--section-close-bottom", `${CTA_HEIGHT + 15}px`);

    harness.scrollTo(start);
    assertClassState(arrow, {
      absent: arrowStates.filter((state) => state !== "is-fixed-above-quote"),
      present: ["is-fixed-above-quote"]
    });
    assertClassState(signup, {
      absent: ["has-contained-close-button"],
      present: ["has-fixed-close-button"]
    });

    harness.dispatch(`section-${otherSection}-open-button`);
    harness.dispatch(`section-${number}-open-button`);
    assertClassState(arrow, {
      absent: arrowStates.filter((state) => state !== "is-fixed-near-bottom"),
      present: ["is-fixed-near-bottom"]
    });
    assertClassState(signup, { absent: promptStates });

    harness.scrollTo(tail);
    assertClassState(signup, {
      absent: ["has-contained-close-button"],
      present: ["has-fixed-close-button"]
    });
    assertClassState(arrow, {
      absent: arrowStates.filter((state) => state !== "is-fixed-above-quote"),
      present: ["is-fixed-above-quote"]
    });

    harness.scrollTo(tail + 1);
    assertClassState(signup, {
      absent: ["has-fixed-close-button"],
      present: ["has-contained-close-button"]
    });
    assertClassState(arrow, {
      absent: arrowStates.filter((state) => state !== "is-contained"),
      present: ["is-contained"]
    });

    harness.scrollTo(start);
    assertClassState(arrow, {
      absent: arrowStates.filter((state) => state !== "is-fixed-above-quote"),
      present: ["is-fixed-above-quote"]
    });
    assertClassState(signup, {
      absent: ["has-contained-close-button"],
      present: ["has-fixed-close-button"]
    });

    const updatedCtaHeight = CTA_HEIGHT + 25;
    harness.element("quote-cta").offsetHeight = updatedCtaHeight;
    harness.scrollTo(start + 1);
    assertClassState(arrow, {
      absent: ["is-contained", "is-fixed-near-bottom", "is-hidden"],
      present: ["is-fixed-above-quote"]
    });
    assertCustomProperty(arrow, "--section-close-bottom", `${updatedCtaHeight + 15}px`);
  }
});

test("primary video pauses only at the exact outside viewport boundaries", () => {
  const before = createHarness();
  before.window.innerHeight = 200;
  before.element("primary-video").paused = false;
  before.scrollTo(PRIMARY_VIDEO_TOP - before.window.innerHeight);
  assert.equal(before.element("primary-video").pauseCalls, 1);

  const topOverlap = createHarness();
  topOverlap.window.innerHeight = 200;
  topOverlap.element("primary-video").paused = false;
  topOverlap.scrollTo(PRIMARY_VIDEO_TOP - topOverlap.window.innerHeight + 1);
  assert.equal(topOverlap.element("primary-video").pauseCalls, 0);

  const bottomOverlap = createHarness();
  bottomOverlap.window.innerHeight = 200;
  bottomOverlap.element("primary-video").paused = false;
  bottomOverlap.scrollTo(PRIMARY_VIDEO_TOP + PRIMARY_VIDEO_HEIGHT - 1);
  assert.equal(bottomOverlap.element("primary-video").pauseCalls, 0);

  const after = createHarness();
  after.window.innerHeight = 200;
  after.element("primary-video").paused = false;
  after.scrollTo(PRIMARY_VIDEO_TOP + PRIMARY_VIDEO_HEIGHT);
  assert.equal(after.element("primary-video").pauseCalls, 1);

  const alreadyPaused = createHarness();
  alreadyPaused.window.innerHeight = 200;
  alreadyPaused.scrollTo(PRIMARY_VIDEO_TOP + PRIMARY_VIDEO_HEIGHT);
  assert.equal(alreadyPaused.element("primary-video").pauseCalls, 0);

  const resized = createHarness();
  resized.element("primary-video").paused = false;
  resized.resizeTo(PRIMARY_VIDEO_TOP);
  assert.equal(resized.element("primary-video").pauseCalls, 1);
});

test("testimonial videos pause whenever their content is hidden", () => {
  const testimonialHideActions = [
    { actionId: "section-1-open-button", hiddenDetailsId: "section-4-details" },
    { actionId: "section-2-open-button", hiddenDetailsId: "section-4-details" },
    { actionId: "section-3-open-button", hiddenDetailsId: "section-4-details" },
    { actionId: "section-4-close-button", hiddenDetailsId: "section-4-details" },
    {
      actionId: "section-4-subsection-1-open-button",
      hiddenDetailsId: "section-4-subsection-3-details"
    },
    {
      actionId: "section-4-subsection-2-open-button",
      hiddenDetailsId: "section-4-subsection-3-details"
    },
    {
      actionId: "section-4-subsection-3-close-button",
      hiddenDetailsId: "section-4-subsection-3-details"
    }
  ];

  for (const { actionId, hiddenDetailsId } of testimonialHideActions) {
    const harness = createHarness();
    harness.dispatch("section-4-open-button");
    harness.dispatch("section-4-subsection-3-open-button");
    assert.equal(harness.element("section-4-details").classList.contains("is-open"), true);
    assert.equal(
      harness.element("section-4-subsection-3-details").classList.contains("is-open"),
      true
    );

    for (let number = 1; number <= 5; number += 1) {
      testimonialVideo(harness, number).paused = number % 2 === 0;
    }

    harness.dispatch(actionId);
    assert.equal(
      harness.element(hiddenDetailsId).classList.contains("is-open"),
      false,
      actionId
    );
    for (let number = 1; number <= 5; number += 1) {
      assert.equal(testimonialVideo(harness, number).pauseCalls, number % 2 === 0 ? 0 : 1);
    }
  }
});

test("testimonial rotation refreshes sticky boundaries without a scroll event", () => {
  const originalTail = FINAL_SPACER_TOP - VIEWPORT_HEIGHT + CTA_HEIGHT;

  for (let number = 1; number <= 5; number += 1) {
    const harness = createHarness({ userAgent: "Instagram" });
    const section4CloseButton = harness.element("section-4-close-button");
    const quoteCtaSpacer = harness.element("quote-cta-spacer");
    const toggle = harness.element(`testimonial-${number}-view-toggle`);

    harness.dispatch("section-4-open-button");
    harness.dispatch("section-4-subsection-3-open-button");
    assert.equal(harness.element("section-4-details").classList.contains("is-open"), true);
    assert.equal(
      harness.element("section-4-subsection-3-details").classList.contains("is-open"),
      true
    );
    assert.equal(toggle.classList.contains("is-hidden"), false);
    harness.scrollTo(originalTail + 1);
    assertClassState(section4CloseButton, {
      absent: ["is-fixed-above-quote", "is-fixed-near-bottom", "is-hidden"],
      present: ["is-contained"]
    });

    quoteCtaSpacer.offsetTop += 500;
    harness.dispatch(`testimonial-${number}-view-toggle`);
    assertClassState(section4CloseButton, {
      absent: ["is-contained", "is-fixed-near-bottom", "is-hidden"],
      present: ["is-fixed-above-quote"]
    });

    quoteCtaSpacer.offsetTop -= 500;
    harness.dispatch(`testimonial-${number}-view-toggle`);
    assertClassState(section4CloseButton, {
      absent: ["is-fixed-above-quote", "is-fixed-near-bottom", "is-hidden"],
      present: ["is-contained"]
    });
  }
});

test("Instagram user-agent handling preserves controls and Direct positioning", () => {
  const ordinary = createHarness();
  for (let number = 1; number <= 5; number += 1) {
    assertClassState(ordinary.element(`testimonial-${number}-view-toggle`), {
      present: ["is-hidden"]
    });
    assertClassState(testimonialVideo(ordinary, number), {
      present: ["has-hidden-rotation-control"]
    });
  }

  ordinary.scrollTo(SECTION_TOPS[2] + 1);
  const direct = ordinary.element("instagram-direct-link");
  assertClassState(direct, {
    absent: ["has-fixed-position", "is-contained", "is-hidden"],
    present: ["is-fixed"]
  });

  const section3Tail = SECTION_TOPS[3] - VIEWPORT_HEIGHT + CTA_HEIGHT;
  ordinary.scrollTo(section3Tail + 1);
  assertClassState(direct, {
    absent: ["has-fixed-position", "is-fixed", "is-hidden"],
    present: ["is-contained"]
  });

  ordinary.scrollTo(section3Tail);
  assertClassState(direct, {
    absent: ["has-fixed-position", "is-contained", "is-hidden"],
    present: ["is-fixed"]
  });

  ordinary.scrollTo(SECTION_TOPS[2]);
  assertClassState(direct, {
    absent: ["has-fixed-position", "is-contained", "is-hidden"],
    present: ["is-fixed"]
  });

  const compositional = createHarness();
  const compositionalDirect = compositional.element("instagram-direct-link");
  compositional.scrollTo(SECTION_TOPS[2]);
  compositional.dispatch("section-4-open-button");
  assertClassState(compositionalDirect, {
    absent: ["is-contained", "is-fixed", "is-hidden"],
    present: ["has-fixed-position"]
  });

  compositional.scrollTo(SECTION_TOPS[2] + 1);
  assertClassState(compositionalDirect, {
    absent: ["has-fixed-position", "is-contained", "is-hidden"],
    present: ["is-fixed"]
  });

  compositional.scrollTo(section3Tail + 1);
  assertClassState(compositionalDirect, {
    absent: ["has-fixed-position", "is-fixed", "is-hidden"],
    present: ["is-contained"]
  });
  compositional.dispatch("section-4-open-button");
  assertClassState(compositionalDirect, {
    absent: ["is-contained", "is-fixed", "is-hidden"],
    present: ["has-fixed-position"]
  });

  compositional.scrollTo(section3Tail);
  assertClassState(compositionalDirect, {
    absent: ["has-fixed-position", "is-contained", "is-hidden"],
    present: ["is-fixed"]
  });

  const directLink = openingTag("instagram-direct-link");
  assert.match(directLink, /^<a\b/);
  assert.match(directLink, /\bhref="https:\/\/ig\.me\/m\/machado\.gestao"/);
  assert.match(directLink, /\btarget="_blank"/);
  assert.match(directLink, /\brel="noopener"/);
  assert.match(directLink, /\baria-label="Conversar pelo Instagram Direct"/);

  const instagram = createHarness({ userAgent: "Mozilla/5.0 Instagram 300" });
  for (let number = 1; number <= 5; number += 1) {
    assertClassState(instagram.element(`testimonial-${number}-view-toggle`), {
      absent: ["is-hidden"]
    });
    assertClassState(testimonialVideo(instagram, number), {
      absent: ["has-hidden-rotation-control"]
    });
  }
  instagram.scrollTo(SECTION_TOPS[2]);
  instagram.scrollTo(SECTION_TOPS[2] + 1);
  assertClassState(instagram.element("instagram-direct-link"), {
    absent: ["has-fixed-position", "is-contained", "is-fixed"],
    present: ["is-hidden"]
  });
});

test("download controls preserve all three public PDF destinations", () => {
  const downloads = [
    "/landing-page/pdf/EMENTA E SOFTWARES.pdf",
    "/landing-page/pdf/BIBLIOGRAFIA.pdf",
    "/landing-page/pdf/CRONOGRAMA.pdf"
  ];

  for (const url of downloads) {
    const link = htmlLinksByHref.get(url) ?? "";
    assert.match(link, /^<a\b/);
    assert.equal(link.match(/\bhref="([^"]+)"/)?.[1], url);
    assert.match(link, /\btarget="_blank"/);
    assert.match(link, /\brel="noopener"/);
  }
});

test("all five testimonials toggle the exact rotated and standard presentation", () => {
  for (let number = 1; number <= 5; number += 1) {
    const harness = createHarness({ userAgent: "Mozilla/5.0 Instagram 300" });
    const container = harness.element(`testimonial-${number}-video-container`);
    const video = testimonialVideo(harness, number);
    const label = harness.element(`testimonial-${number}-view-toggle-label`);
    const buttonId = `testimonial-${number}-view-toggle`;
    const button = harness.element(buttonId);
    const accessibleName = `Modo Tela Cheia do vídeo de depoimento ${number}; alternar entre Tela Cheia e Tela Padrão`;

    assert.equal(button.getAttribute("aria-pressed"), "false");
    assert.equal(button.getAttribute("aria-label"), accessibleName);
    button.focus();
    harness.dispatch(buttonId);
    assertClassState(container, {
      absent: ["is-restored"],
      present: ["is-rotated"]
    });
    assert.equal(label.innerHTML, "Tela Padrão");
    assert.equal(button.getAttribute("aria-pressed"), "true");
    assert.equal(button.getAttribute("aria-label"), accessibleName);
    assert.equal(harness.document.activeElement, button);
    assertLastScroll(harness, `testimonial-${number}-video`);

    video.paused = false;
    harness.dispatch("section-4-close-button");
    assert.equal(video.pauseCalls, 1);
    assert.equal(label.innerHTML, "Tela Padrão");
    assertClassState(container, {
      absent: ["is-restored"],
      present: ["is-rotated"]
    });
    assert.equal(button.getAttribute("aria-pressed"), "true");

    harness.dispatch("section-4-open-button");
    harness.dispatch("section-4-subsection-3-open-button");
    button.focus();
    harness.dispatch(buttonId);
    assertClassState(container, {
      absent: ["is-rotated"],
      present: ["is-restored"]
    });
    assert.equal(label.innerHTML, "Tela Cheia");
    assert.equal(button.getAttribute("aria-pressed"), "false");
    assert.equal(button.getAttribute("aria-label"), accessibleName);
    assert.equal(harness.document.activeElement, button);
    assertLastScroll(harness, `testimonial-${number}-video`);
  }

  const independent = createHarness({ userAgent: "Mozilla/5.0 Instagram 300" });
  independent.dispatch("testimonial-3-view-toggle");
  for (let number = 1; number <= 5; number += 1) {
    assertClassState(independent.element(`testimonial-${number}-video-container`), {
      absent: number === 3 ? ["is-restored"] : ["is-restored", "is-rotated"],
      present: number === 3 ? ["is-rotated"] : []
    });
  }
});
