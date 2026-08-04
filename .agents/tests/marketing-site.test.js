"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const repositoryRoot = path.join(__dirname, "..", "..");
const marketingRoot = path.join(repositoryRoot, "apps", "marketing-site");
const sourcePath = path.join(marketingRoot, "main.js");
const htmlPath = path.join(marketingRoot, "index.html");
const cssPath = path.join(marketingRoot, "style.css");
const source = fs.readFileSync(sourcePath, "utf8");
const html = fs.readFileSync(htmlPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
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

const VIEWPORT_HEIGHT = 800;
const CTA_HEIGHT = 150;
const SECTION_TOPS = [1000, 3000, 5000, 7000];
const FINAL_SPACER_TOP = 9000;
const PRIMARY_VIDEO_TOP = 500;
const PRIMARY_VIDEO_HEIGHT = 300;
const HLS_URL = "https://videospreparatoriosv2.blob.core.windows.net/videosv3/LandingPagePJ/video-principal/master.m3u8";
const POSTER_URL = "./landing-page/img/CAPA_VÍDEO_PRINCIPAL.jpg";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function createHarness({
  reducedMotion = false,
  supportsMatchMedia = true,
  userAgent = "Mozilla/5.0"
} = {}) {
  const elements = new Map();
  const listeners = new Map();
  const observers = [];
  const openCalls = [];
  const scrollCalls = [];
  const focusCalls = [];
  const interactionCalls = [];
  const mediaQueryCalls = [];
  const playerInstances = [];
  const overlayInstances = [];
  let document;
  let reducedMotionPreference = reducedMotion;

  function geometry(id) {
    if (id === "Container-Externo-Vídeo-Principal") {
      return { offsetHeight: PRIMARY_VIDEO_HEIGHT, offsetTop: PRIMARY_VIDEO_TOP };
    }

    const sectionMatch = id.match(/^Seção-([1-4])$/);
    if (sectionMatch) {
      return { offsetHeight: 0, offsetTop: SECTION_TOPS[Number(sectionMatch[1]) - 1] };
    }

    if (id === "Espaço-Final-Container-Botão-Principal") {
      return { offsetHeight: 0, offsetTop: FINAL_SPACER_TOP };
    }

    if (id === "Container-Botão-Principal") {
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
      innerHTML: /^Texto-Tela-Cheia-Vídeo-Depoimento-[1-5]$/.test(id)
        ? "Tela Cheia"
        : "",
      offsetHeight: elementGeometry.offsetHeight,
      offsetTop: elementGeometry.offsetTop,
      paused: true,
      pauseCalls: 0,
      style,
      addEventListener(type, listener) {
        listeners.set(`${id}:${type}`, listener);
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
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
    constructor(video) {
      this.video = video;
      this.loadCalls = [];
      playerInstances.push(this);
    }

    load(url) {
      this.loadCalls.push(url);
    }
  }

  class Overlay {
    constructor(player, container, video) {
      this.player = player;
      this.container = container;
      this.video = video;
      this.configureCalls = [];
      overlayInstances.push(this);
    }

    configure(configuration) {
      this.configureCalls.push(configuration);
    }
  }

  const window = {
    innerHeight: VIEWPORT_HEIGHT,
    location: { href: "https://machadogestao.com/" },
    onscroll: null,
    scrollY: 0,
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

  const context = vm.createContext({
    console,
    document,
    IntersectionObserver: FakeIntersectionObserver,
    navigator: { userAgent },
    shaka: { Player, ui: { Overlay } },
    window
  });

  vm.runInContext(source, context, { filename: sourcePath });
  assert.equal(observers.length, 1);

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

  function scrollTo(scrollY) {
    window.scrollY = scrollY;
    assert.equal(typeof window.onscroll, "function");
    window.onscroll();
  }

  return {
    context,
    dispatch,
    document,
    element,
    focusCalls,
    interactionCalls,
    mediaQueryCalls,
    openCalls,
    overlayInstances,
    playerInstances,
    observer: observers[0],
    get scrollBehavior() {
      return supportsMatchMedia && reducedMotionPreference ? "auto" : "smooth";
    },
    scrollCalls,
    setReducedMotion(value) {
      reducedMotionPreference = value;
    },
    scrollTo,
    window
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
  return harness.element(`Vídeo-Depoimento-${number}`);
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
  assert.match(html, /<script defer src="\.\/landing-page\/main\.js"><\/script>/);

  const shakaScript = "<script defer src=\"https://cdn.jsdelivr.net/npm/shaka-player@4.3.5/dist/shaka-player.ui.js\"></script>";
  const marketingScript = "<script defer src=\"./landing-page/main.js\"></script>";
  assert.ok(html.indexOf(shakaScript) < html.indexOf(marketingScript));
  assert.match(css, /--page-max-width: 430px;/);
  assert.match(
    css,
    /@media \(min-width: 431px\) \{[\s\S]*?--considered-screen-width: var\(--page-max-width\);[\s\S]*?--considered-margin-left: calc\(50vw - \(var\(--considered-screen-width\)\/2\)\);/
  );
  assert.match(css, /animation: Teste 12s ease-in infinite;/);
  assert.match(css, /animation: Pulsos-Botões-Externos-Abertura-Seções 3s ease-out infinite;/);
  assert.doesNotMatch(source, /\b(?:setTimeout|setInterval|requestAnimationFrame)\s*\(/);
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
    /button,\s*\.Botões-Padrão-Download-PDFs,\s*#Botão-Instagram-Direct,\s*#Botão-Principal\{\s*user-select: none;\s*\}/
  );
  assert.match(css, /\.Containers-Externos-Seções\{[^}]*user-select: none;/);
  assert.match(css, /\.Subseções-Fechadas\{[^}]*user-select: none;/);
  assert.doesNotMatch(css, /\.Subseções-Abertas\{[^}]*user-select:/);
  assert.match(css, /\.Textos-Tela-Cheia\{[^}]*user-select: none;/);

  const reducedMotionBlock = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/
  )?.[1];
  assert.ok(reducedMotionBlock);
  assert.match(
    reducedMotionBlock,
    /#Vídeo-Principal,\s*\.Textos-Botões-Externos-Abertura-Seções\{\s*animation: none;\s*\}/
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
    /#Container-Interno-Vídeo-Principal :where\([\s\S]*?\)\{\s*transition: none;\s*\}/
  );
  assert.match(
    reducedMotionBlock,
    /#Container-Interno-Vídeo-Principal :where\(\s*\.shaka-spinner-svg,\s*\.shaka-spinner-path\s*\)\{\s*animation: none;\s*\}/
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
    /if\s*\(\s*TextoTelaCheiaVídeoDepoimento[1-5]\.innerHTML\s*!==\s*['"]Tela Padrão['"]\s*\)/
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

  assertCssRule([".Containers-Externos-Seções.is-hidden"], [/display:\s*none;/]);
  assertCssRule([".Subseções-Fechadas.is-hidden"], [/display:\s*none;/]);
  assertCssRule([".Botões-Tela-Cheia-Depoimentos.is-hidden"], [/display:\s*none;/]);
  assertCssStateForTargets(
    Array.from({ length: 4 }, (_, index) => `#Container-Interno-Seção-${index + 1}`),
    "is-open",
    [/display:\s*block;/]
  );
  assertCssRule([".Subseções-Abertas.is-open"], [/display:\s*block;/]);

  assertCssRule(["#Espaço-Final-Container-Botão-Principal"], [
    /height:\s*var\(--quote-cta-height, auto\);/
  ]);
  assertCssRule(["#Container-Botão-Principal.is-hidden"], [/display:\s*none;/]);
  assertCssRule(["#Container-Botão-Principal.is-fixed"], [
    /position:\s*fixed;/,
    /top:\s*auto;/,
    /bottom:\s*0px;/
  ]);
  assertCssRule(["#Container-Botão-Principal.is-anchored"], [
    /position:\s*absolute;/,
    /top:\s*var\(--quote-cta-top\);/
  ]);
  assertCssRuleOmits(["#Container-Botão-Principal.is-anchored"], /\bbottom\s*:/);
  assert.match(css, /#Container-Botão-Principal\{[^}]*bottom:\s*0px;/);

  const sectionCloseSelectors = Array.from(
    { length: 4 },
    (_, index) => `#Seta-Fechamento-Seção-${index + 1}`
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
  assertCssRule([".Subseções-Cadastro.has-fixed-close-button"], [
    /margin-bottom:\s*var\(--space-md\);/
  ]);
  assertCssRule([".Subseções-Cadastro.has-contained-close-button"], [
    /margin-bottom:\s*15px;/
  ]);

  assertCssRule(["#Botão-Instagram-Direct.is-hidden"], [/display:\s*none;/]);
  assertCssRule(["#Botão-Instagram-Direct.is-fixed"], [
    /display:\s*block;/,
    /position:\s*fixed;/,
    /width:\s*60px;/,
    /bottom:\s*160px;/,
    /margin-bottom:\s*0px;/,
    /margin-left:\s*calc\(\(var\(--considered-screen-width\) \* 0\.95\) - 60px\);/
  ]);
  assertCssRule(["#Botão-Instagram-Direct.is-contained"], [
    /display:\s*flex;/,
    /position:\s*relative;/,
    /width:\s*60px;/,
    /bottom:\s*var\(--space-lg\);/,
    /margin-bottom:\s*calc\(-1 \* var\(--space-2xl\)\);/,
    /margin-left:\s*calc\(\(var\(--considered-screen-width\) \* 0\.95\) - 60px\);/
  ]);
  assertCssRule(["#Botão-Instagram-Direct.has-fixed-position"], [
    /position:\s*fixed;/
  ]);
  assertCssRuleOmits(["#Botão-Instagram-Direct.has-fixed-position"], /\bdisplay\s*:/);

  assertCssRule([".Vídeos-Depoimentos.has-hidden-rotation-control"], [
    /margin-bottom:\s*var\(--space-lg\);/
  ]);
  assertCssRule([".Containers-Vídeos-Depoimentos.is-rotated"], [
    /width:\s*calc\(var\(--considered-screen-width\) \* 0\.80\);/,
    /height:\s*calc\(var\(--considered-screen-width\) \* 1\.42196\);/
  ]);
  assertCssRule([".Containers-Vídeos-Depoimentos.is-rotated > .Vídeos-Depoimentos"], [
    /width:\s*calc\(var\(--considered-screen-width\) \* 1\.42196\);/,
    /height:\s*calc\(var\(--considered-screen-width\) \* 0\.80\);/,
    /transform-origin:\s*top left;/,
    /transform:\s*rotate\(90deg\) translateY\(-100%\);/
  ]);
  assertCssRule([".Containers-Vídeos-Depoimentos.is-restored"], [
    /width:\s*calc\(var\(--considered-screen-width\) \* 0\.90\);/,
    /height:\s*calc\(var\(--considered-screen-width\) \* 0\.50634\);/
  ]);
  assertCssRule([".Containers-Vídeos-Depoimentos.is-restored > .Vídeos-Depoimentos"], [
    /width:\s*calc\(var\(--considered-screen-width\) \* 0\.90\);/,
    /height:\s*calc\(var\(--considered-screen-width\) \* 0\.50634\);/
  ]);
});

test("marketing interactions use native controls with complete relationships and focus styles", () => {
  const sectionOpeners = Array.from(
    { length: 4 },
    (_, index) => `Texto-Botão-Externo-Abertura-Seção-${index + 1}`
  );
  const subsectionOpeners = [
    ...Array.from({ length: 5 }, (_, index) => `Seta-Abertura-Subseção-3.${index + 1}`),
    ...Array.from({ length: 3 }, (_, index) => `Seta-Abertura-Subseção-4.${index + 1}`)
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
        close: `Seta-Fechamento-Seção-${number}`,
        controlled: `Container-Interno-Seção-${number}`,
        label: `Fechar seção ${number}`,
        open: `Texto-Botão-Externo-Abertura-Seção-${number}`
      };
    }),
    ...["3.1", "3.2", "3.3", "3.4", "3.5", "4.1", "4.2", "4.3"].map((number) => ({
      close: `Seta-Fechamento-Subseção-${number}`,
      controlled: `Subseção-Aberta-${number}`,
      label: `Fechar subseção ${number}`,
      open: `Seta-Abertura-Subseção-${number}`
    }))
  ];

  for (const { close, controlled, label, open } of disclosurePairs) {
    assert.equal(openingTag(open).match(/\baria-controls="([^"]+)"/)?.[1], controlled);
    assert.equal(openingTag(close).match(/\baria-controls="([^"]+)"/)?.[1], controlled);
    assert.equal(openingTag(close).match(/\baria-label="([^"]+)"/)?.[1], label);
  }

  for (let number = 1; number <= 5; number += 1) {
    const tag = openingTag(`Botão-Tela-Cheia-Vídeo-Depoimento-${number}`);
    assert.match(tag, /^<button\b/);
    assert.match(tag, /\baria-pressed="false"/);
    assert.match(tag, new RegExp(`aria-controls="Container-Vídeo-Depoimento-${number}"`));
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

  assert.match(css, /\.Containers-Externos-Seções\{[\s\S]*?position: relative;/);
  assert.match(css, /\.Subseções-Fechadas\{[\s\S]*?position: relative;/);
  assert.match(css, /:where\([\s\S]*?button\.Textos-Botões-Externos-Abertura-Seções,[\s\S]*?\)\{/);
  assert.match(css, /\.Textos-Botões-Externos-Abertura-Seções\{[\s\S]*?font-size: 14px;/);
  assert.match(
    css,
    /\.Subseções-Fechadas\{[\s\S]*?border: var\(--border-width-thin\) solid var\(--color-white\);/
  );
  assert.match(
    css,
    /\.Textos-Botões-Externos-Abertura-Seções::after\{[\s\S]*?position: absolute;[\s\S]*?inset: 0;/
  );
  assert.match(
    css,
    /\.Setas-Abertura-Subseções::after\{[\s\S]*?position: absolute;[\s\S]*?inset: calc\(-1 \* var\(--border-width-thin\)\);[\s\S]*?border-radius: var\(--radius-md\);/
  );
  assert.match(
    css,
    /\.Textos-Botões-Externos-Abertura-Seções:focus-visible,[\s\S]*?a\.Texto-Interno-Branco:focus-visible\{\s*outline: var\(--focus-outline-width\) solid var\(--color-white\);\s*outline-offset: var\(--focus-outline-offset\);\s*\}/
  );
  assert.match(
    css,
    /\.Setas-Fechamento-Subseções:focus-visible,[\s\S]*?#Botão-Principal:focus-visible\{\s*outline: var\(--focus-outline-width\) solid var\(--color-official-machado-wine\);\s*outline-offset: var\(--focus-outline-offset\);\s*\}/
  );
  assert.match(css, /\.Focos-Abertura:focus\{[\s\S]*?outline: none;/);
  assert.equal((css.match(/outline:\s*none/g) ?? []).length, 1);

  const decorativeControlSvgs = Array.from(
    html.matchAll(/<svg\b[^>]*\baria-hidden="true"[^>]*\bfocusable="false"[^>]*>/g)
  );
  assert.equal(decorativeControlSvgs.length, 24);
  assert.equal(
    (html.match(/<img class="Imagens-Tela-Cheia"[^>]*\balt=""[^>]*\baria-hidden="true"[^>]*>/g) ?? []).length,
    5
  );
  assert.match(
    html,
    /<a id="Botão-Instagram-Direct"[^>]*> <img src="\.\/landing-page\/img\/INSTAGRAM_DIRECT\.png" alt="" loading="lazy"> <\/a>/
  );
});

test("marketing scrolling responds to live reduced-motion preferences", () => {
  const ordinary = createHarness();
  ordinary.dispatch("Texto-Botão-Externo-Abertura-Seção-1");
  assertScrollThenFocus(
    ordinary,
    "Container-Interno-Seção-1",
    "Texto-Interno-Chamada-Seção-1"
  );
  ordinary.setReducedMotion(true);
  ordinary.dispatch("Seta-Fechamento-Seção-1");
  assertScrollThenFocus(
    ordinary,
    "Container-Externo-Seção-1",
    "Texto-Botão-Externo-Abertura-Seção-1"
  );
  ordinary.setReducedMotion(false);
  ordinary.dispatch("Texto-Botão-Externo-Abertura-Seção-1");
  assertScrollThenFocus(
    ordinary,
    "Container-Interno-Seção-1",
    "Texto-Interno-Chamada-Seção-1"
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
  reduced.dispatch("Texto-Botão-Externo-Abertura-Seção-3");
  assertScrollThenFocus(
    reduced,
    "Container-Interno-Seção-3",
    "Texto-Interno-Chamada-Seção-3"
  );
  reduced.dispatch("Seta-Fechamento-Seção-3");
  assertScrollThenFocus(
    reduced,
    "Container-Externo-Seção-3",
    "Texto-Botão-Externo-Abertura-Seção-3"
  );
  reduced.dispatch("Texto-Botão-Externo-Abertura-Seção-3");

  reduced.dispatch("Seta-Abertura-Subseção-3.1");
  assertScrollThenFocus(
    reduced,
    "Subseção-Aberta-3.1",
    "Manchete-Subseção-Aberta-3.1"
  );
  reduced.dispatch("Seta-Fechamento-Subseção-3.1");
  assertScrollThenFocus(
    reduced,
    "Subseção-Fechada-3.1",
    "Seta-Abertura-Subseção-3.1"
  );

  reduced.dispatch("Texto-Botão-Externo-Abertura-Seção-4");
  reduced.dispatch("Seta-Abertura-Subseção-4.3");
  reduced.dispatch("Botão-Tela-Cheia-Vídeo-Depoimento-1");
  assertLastScroll(reduced, "Vídeo-Depoimento-1");
  reduced.dispatch("Botão-Tela-Cheia-Vídeo-Depoimento-1");
  assertLastScroll(reduced, "Vídeo-Depoimento-1");
  assert.ok(reduced.scrollCalls.every(({ options }) => options.behavior === "auto"));
  assert.ok(reduced.mediaQueryCalls.every((query) => query === REDUCED_MOTION_QUERY));
  assert.equal(reduced.mediaQueryCalls.length, reduced.scrollCalls.length);

  const unsupported = createHarness({ supportsMatchMedia: false });
  unsupported.dispatch("Texto-Botão-Externo-Abertura-Seção-2");
  assertLastScroll(unsupported, "Container-Interno-Seção-2");
  assert.deepEqual(unsupported.mediaQueryCalls, []);
});

test("document language, landmarks, and heading hierarchy describe the current page", () => {
  assert.match(html, /^<!DOCTYPE html>\r?\n<html lang="pt-BR">/);
  assert.equal((html.match(/<header\b/g) ?? []).length, 1);
  assert.equal((html.match(/<main\b/g) ?? []).length, 1);
  assert.equal((html.match(/<aside\b/g) ?? []).length, 1);
  assert.match(html, /<header id="Seção-Inicial">/);
  assert.match(
    html,
    /<aside id="Container-Botão-Principal" aria-labelledby="Explicação-Botão-Principal">/
  );

  const headerStart = html.indexOf("<header id=\"Seção-Inicial\">");
  const headerEnd = html.indexOf("</header>");
  const mainStart = html.indexOf("<main>");
  const mainEnd = html.indexOf("</main>");
  const asideStart = html.indexOf("<aside id=\"Container-Botão-Principal\"");
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
        `<section class="Seções" id="Seção-${number}" aria-labelledby="Texto-Externo-Chamada-Seção-${number}">`
      )
    );
    assert.match(
      html,
      new RegExp(
        `<h2 class="Textos-Externos-Chamadas-Seções" id="Texto-Externo-Chamada-Seção-${number}">`
      )
    );
    assert.match(
      html,
      new RegExp(
        `<h2 id="Texto-Interno-Chamada-Seção-${number}" class="Focos-Abertura" tabindex="-1">`
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
  assert.match(html, /<h1 id="Seção-Inicial-Manchete">/);
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

test("primary video initializes once with the exact poster, HLS source, and Shaka controls", () => {
  const harness = createHarness();
  const outer = harness.element("Container-Externo-Vídeo-Principal");
  const inner = harness.element("Container-Interno-Vídeo-Principal");
  const video = harness.element("Vídeo-Principal");

  assert.deepEqual(harness.observer.observeCalls, [outer]);
  harness.observer.trigger(outer, false);
  assert.equal(harness.playerInstances.length, 0);
  assert.equal(video.getAttribute("poster"), null);

  harness.observer.trigger(outer, true);

  assert.equal(inner.getAttribute("data-shaka-player-container"), "");
  assert.equal(video.getAttribute("data-shaka-player"), "");
  assert.equal(video.getAttribute("poster"), POSTER_URL);
  assert.equal(video.getAttribute("src"), HLS_URL);
  assert.equal(harness.playerInstances.length, 1);
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

test("top-level sections keep one section open and preserve open and close scroll targets", () => {
  for (let selected = 1; selected <= 4; selected += 1) {
    const harness = createHarness();
    const openerId = `Texto-Botão-Externo-Abertura-Seção-${selected}`;
    harness.element(openerId).focus();
    harness.dispatch(openerId);

    for (let number = 1; number <= 4; number += 1) {
      assertClassState(harness.element(`Container-Externo-Seção-${number}`), {
        absent: number === selected ? [] : ["is-hidden"],
        present: number === selected ? ["is-hidden"] : []
      });
      assertClassState(harness.element(`Container-Interno-Seção-${number}`), {
        absent: number === selected ? [] : ["is-open"],
        present: number === selected ? ["is-open"] : []
      });
      assert.equal(
        harness.element(`Texto-Botão-Externo-Abertura-Seção-${number}`).getAttribute("aria-expanded"),
        number === selected ? "true" : "false",
        `section ${selected}, expanded ${number}`
      );
    }

    assertLastScroll(harness, `Container-Interno-Seção-${selected}`);
    assertScrollThenFocus(
      harness,
      `Container-Interno-Seção-${selected}`,
      `Texto-Interno-Chamada-Seção-${selected}`
    );
    assertClassState(harness.element(`Seta-Fechamento-Seção-${selected}`), {
      absent: ["is-hidden", "is-fixed-above-quote", "is-contained"],
      present: ["is-fixed-near-bottom"]
    });

    if (selected === 3) {
      harness.dispatch("Seta-Abertura-Subseção-3.2");
      assert.equal(harness.element("Seta-Abertura-Subseção-3.2").getAttribute("aria-expanded"), "true");
    }
    if (selected === 4) {
      harness.dispatch("Seta-Abertura-Subseção-4.2");
      assert.equal(harness.element("Seta-Abertura-Subseção-4.2").getAttribute("aria-expanded"), "true");
      assertClassState(harness.element("Botão-Instagram-Direct"), {
        absent: ["is-contained", "is-fixed", "is-hidden"],
        present: ["has-fixed-position"]
      });
    }

    harness.dispatch(`Seta-Fechamento-Seção-${selected}`);
    assertClassState(harness.element(`Container-Externo-Seção-${selected}`), {
      absent: ["is-hidden"]
    });
    assertClassState(harness.element(`Container-Interno-Seção-${selected}`), {
      absent: ["is-open"]
    });
    assertLastScroll(harness, `Container-Externo-Seção-${selected}`);
    assert.equal(harness.element(openerId).getAttribute("aria-expanded"), "false");
    assertScrollThenFocus(harness, `Container-Externo-Seção-${selected}`, openerId);

    if (selected === 3) {
      for (let number = 1; number <= 5; number += 1) {
        assertClassState(harness.element(`Subseção-Fechada-3.${number}`), {
          absent: ["is-hidden"]
        });
        assertClassState(harness.element(`Subseção-Aberta-3.${number}`), {
          absent: ["is-open"]
        });
        assert.equal(
          harness.element(`Seta-Abertura-Subseção-3.${number}`).getAttribute("aria-expanded"),
          "false"
        );
      }
    }
    if (selected === 4) {
      for (let number = 1; number <= 3; number += 1) {
        assertClassState(harness.element(`Subseção-Fechada-4.${number}`), {
          absent: ["is-hidden"]
        });
        assertClassState(harness.element(`Subseção-Aberta-4.${number}`), {
          absent: ["is-open"]
        });
        assert.equal(
          harness.element(`Seta-Abertura-Subseção-4.${number}`).getAttribute("aria-expanded"),
          "false"
        );
      }
    }
  }

  const sequential = createHarness();
  sequential.dispatch("Texto-Botão-Externo-Abertura-Seção-1");
  sequential.dispatch("Texto-Botão-Externo-Abertura-Seção-2");
  assert.equal(
    sequential.element("Texto-Botão-Externo-Abertura-Seção-1").getAttribute("aria-expanded"),
    "false"
  );
  assert.equal(
    sequential.element("Texto-Botão-Externo-Abertura-Seção-2").getAttribute("aria-expanded"),
    "true"
  );
  for (let number = 1; number <= 4; number += 1) {
    assertClassState(sequential.element(`Container-Externo-Seção-${number}`), {
      absent: number === 2 ? [] : ["is-hidden"],
      present: number === 2 ? ["is-hidden"] : []
    });
    assertClassState(sequential.element(`Container-Interno-Seção-${number}`), {
      absent: number === 2 ? [] : ["is-open"],
      present: number === 2 ? ["is-open"] : []
    });
  }
});

test("section 3 and 4 subsections keep one panel open and return to the closed header", () => {
  for (const [section, count] of [[3, 5], [4, 3]]) {
    for (let selected = 1; selected <= count; selected += 1) {
      const harness = createHarness();
      const openerId = `Seta-Abertura-Subseção-${section}.${selected}`;
      harness.element(openerId).focus();
      harness.dispatch(openerId);

      for (let number = 1; number <= count; number += 1) {
        assertClassState(harness.element(`Subseção-Fechada-${section}.${number}`), {
          absent: number === selected ? [] : ["is-hidden"],
          present: number === selected ? ["is-hidden"] : []
        });
        assertClassState(harness.element(`Subseção-Aberta-${section}.${number}`), {
          absent: number === selected ? [] : ["is-open"],
          present: number === selected ? ["is-open"] : []
        });
        assert.equal(
          harness.element(`Seta-Abertura-Subseção-${section}.${number}`).getAttribute("aria-expanded"),
          number === selected ? "true" : "false",
          `subsection ${section}.${selected}, expanded ${number}`
        );
      }

      assertLastScroll(harness, `Subseção-Aberta-${section}.${selected}`);
      assertScrollThenFocus(
        harness,
        `Subseção-Aberta-${section}.${selected}`,
        `Manchete-Subseção-Aberta-${section}.${selected}`
      );
      if (section === 4 && selected === 2) {
        assert.match(
          harness.element("Data-Atualização-Estatísticas-Padrão-Vermelho").innerHTML,
          /^Data e hora de atualização: /
        );
      }

      harness.dispatch(`Seta-Fechamento-Subseção-${section}.${selected}`);
      assertClassState(harness.element(`Subseção-Fechada-${section}.${selected}`), {
        absent: ["is-hidden"]
      });
      assertClassState(harness.element(`Subseção-Aberta-${section}.${selected}`), {
        absent: ["is-open"]
      });
      assert.equal(harness.element(openerId).getAttribute("aria-expanded"), "false");
      assertLastScroll(harness, `Subseção-Fechada-${section}.${selected}`);
      assertScrollThenFocus(harness, `Subseção-Fechada-${section}.${selected}`, openerId);
    }
  }

  for (const section of [3, 4]) {
    const sequential = createHarness();
    sequential.dispatch(`Seta-Abertura-Subseção-${section}.1`);
    sequential.dispatch(`Seta-Abertura-Subseção-${section}.2`);
    assert.equal(
      sequential.element(`Seta-Abertura-Subseção-${section}.1`).getAttribute("aria-expanded"),
      "false"
    );
    assert.equal(
      sequential.element(`Seta-Abertura-Subseção-${section}.2`).getAttribute("aria-expanded"),
      "true"
    );
    const count = section === 3 ? 5 : 3;
    for (let number = 1; number <= count; number += 1) {
      assertClassState(sequential.element(`Subseção-Fechada-${section}.${number}`), {
        absent: number === 2 ? [] : ["is-hidden"],
        present: number === 2 ? ["is-hidden"] : []
      });
      assertClassState(sequential.element(`Subseção-Aberta-${section}.${number}`), {
        absent: number === 2 ? [] : ["is-open"],
        present: number === 2 ? ["is-open"] : []
      });
    }
  }
});

test("implicit section switches preserve nested state while explicit closes reset it", () => {
  for (const section of [3, 4]) {
    const harness = createHarness();
    const subsection = `${section}.2`;
    const subsectionOpener = `Seta-Abertura-Subseção-${subsection}`;

    harness.dispatch(`Texto-Botão-Externo-Abertura-Seção-${section}`);
    harness.dispatch(subsectionOpener);
    assert.equal(harness.element(subsectionOpener).getAttribute("aria-expanded"), "true");

    harness.dispatch("Texto-Botão-Externo-Abertura-Seção-1");
    assert.equal(
      harness.element(`Texto-Botão-Externo-Abertura-Seção-${section}`).getAttribute("aria-expanded"),
      "false"
    );
    assert.equal(harness.element(subsectionOpener).getAttribute("aria-expanded"), "true");
    assertClassState(harness.element(`Subseção-Fechada-${subsection}`), {
      present: ["is-hidden"]
    });
    assertClassState(harness.element(`Subseção-Aberta-${subsection}`), {
      present: ["is-open"]
    });

    harness.dispatch(`Texto-Botão-Externo-Abertura-Seção-${section}`);
    assert.equal(harness.element(subsectionOpener).getAttribute("aria-expanded"), "true");
    harness.dispatch(`Seta-Fechamento-Seção-${section}`);
    assert.equal(harness.element(subsectionOpener).getAttribute("aria-expanded"), "false");
    assertClassState(harness.element(`Subseção-Fechada-${subsection}`), {
      absent: ["is-hidden"]
    });
    assertClassState(harness.element(`Subseção-Aberta-${subsection}`), {
      absent: ["is-open"]
    });
  }
});

test("quote CTA preserves visibility thresholds, positioning, and destination", () => {
  const harness = createHarness();
  const cta = harness.element("Container-Botão-Principal");
  const spacer = harness.element("Espaço-Final-Container-Botão-Principal");

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
    absent: ["is-anchored", "is-hidden"],
    present: ["is-fixed"]
  });

  const updatedCtaHeight = CTA_HEIGHT + 25;
  const updatedSectionTop = SECTION_TOPS[0] + 100;
  cta.offsetHeight = updatedCtaHeight;
  harness.element("Seção-1").offsetTop = updatedSectionTop;
  harness.scrollTo(updatedSectionTop - VIEWPORT_HEIGHT);
  assertClassState(cta, {
    absent: ["is-hidden", "is-fixed"],
    present: ["is-anchored"]
  });
  assertCustomProperty(spacer, "--quote-cta-height", `${updatedCtaHeight}px`);
  assertCustomProperty(cta, "--quote-cta-top", `${updatedSectionTop}px`);

  const quoteLink = openingTag("Botão-Principal");
  assert.match(quoteLink, /^<a\b/);
  assert.match(quoteLink, /\bhref="\/solicitacao-orcamento\/"/);
  assert.match(quoteLink, /\baria-describedby="Explicação-Botão-Principal"/);
  assert.doesNotMatch(quoteLink, /\btarget=/);
});

test("section close arrows keep their hidden, fixed, and relative boundaries", () => {
  const nextTops = [...SECTION_TOPS.slice(1), FINAL_SPACER_TOP];

  for (let number = 1; number <= 4; number += 1) {
    const harness = createHarness();
    const arrow = harness.element(`Seta-Fechamento-Seção-${number}`);
    const signup = harness.element(`Subseção-Cadastro-${number}`);
    const start = SECTION_TOPS[number - 1];
    const tail = nextTops[number - 1] - VIEWPORT_HEIGHT + CTA_HEIGHT;
    const otherSection = number === 4 ? 1 : number + 1;

    harness.dispatch(`Texto-Botão-Externo-Abertura-Seção-${number}`);
    assertClassState(arrow, {
      absent: ["is-contained", "is-fixed-above-quote", "is-hidden"],
      present: ["is-fixed-near-bottom"]
    });
    harness.scrollTo(start + 1);
    assertClassState(arrow, {
      absent: ["is-contained", "is-fixed-near-bottom", "is-hidden"],
      present: ["is-fixed-above-quote"]
    });
    assertCustomProperty(arrow, "--section-close-bottom", `${CTA_HEIGHT + 15}px`);

    harness.scrollTo(start);
    assertClassState(arrow, {
      absent: ["is-contained", "is-fixed-near-bottom"],
      present: ["is-fixed-above-quote", "is-hidden"]
    });
    assertClassState(signup, {
      absent: ["has-contained-close-button"],
      present: ["has-fixed-close-button"]
    });

    harness.dispatch(`Texto-Botão-Externo-Abertura-Seção-${otherSection}`);
    harness.dispatch(`Texto-Botão-Externo-Abertura-Seção-${number}`);
    assertClassState(arrow, {
      absent: ["is-contained"],
      present: ["is-fixed-above-quote", "is-fixed-near-bottom", "is-hidden"]
    });
    assertClassState(signup, {
      absent: ["has-contained-close-button"],
      present: ["has-fixed-close-button"]
    });

    harness.scrollTo(start + 1);
    assertClassState(signup, {
      absent: ["has-contained-close-button"],
      present: ["has-fixed-close-button"]
    });
    assertClassState(arrow, {
      absent: ["is-contained", "is-fixed-near-bottom", "is-hidden"],
      present: ["is-fixed-above-quote"]
    });
    assertCustomProperty(arrow, "--section-close-bottom", `${CTA_HEIGHT + 15}px`);

    harness.scrollTo(tail + 1);
    assertClassState(signup, {
      absent: ["has-fixed-close-button"],
      present: ["has-contained-close-button"]
    });
    assertClassState(arrow, {
      absent: ["is-fixed-above-quote", "is-fixed-near-bottom", "is-hidden"],
      present: ["is-contained"]
    });

    harness.scrollTo(start);
    assertClassState(signup, {
      absent: ["has-fixed-close-button"],
      present: ["has-contained-close-button"]
    });
    assertClassState(arrow, {
      absent: ["is-fixed-above-quote", "is-fixed-near-bottom"],
      present: ["is-contained", "is-hidden"]
    });

    harness.dispatch(`Texto-Botão-Externo-Abertura-Seção-${otherSection}`);
    harness.dispatch(`Texto-Botão-Externo-Abertura-Seção-${number}`);
    assertClassState(signup, {
      absent: ["has-fixed-close-button"],
      present: ["has-contained-close-button"]
    });
    assertClassState(arrow, {
      absent: ["is-fixed-above-quote"],
      present: ["is-contained", "is-fixed-near-bottom", "is-hidden"]
    });

    harness.scrollTo(tail);
    assertClassState(signup, {
      absent: ["has-contained-close-button"],
      present: ["has-fixed-close-button"]
    });
    assertClassState(arrow, {
      absent: ["is-contained", "is-fixed-near-bottom", "is-hidden"],
      present: ["is-fixed-above-quote"]
    });

    harness.scrollTo(start);
    assertClassState(signup, {
      absent: ["has-contained-close-button"],
      present: ["has-fixed-close-button"]
    });
    assertClassState(arrow, {
      absent: ["is-contained", "is-fixed-near-bottom"],
      present: ["is-fixed-above-quote", "is-hidden"]
    });

    const updatedCtaHeight = CTA_HEIGHT + 25;
    harness.element("Container-Botão-Principal").offsetHeight = updatedCtaHeight;
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
  before.element("Vídeo-Principal").paused = false;
  before.scrollTo(PRIMARY_VIDEO_TOP - before.window.innerHeight);
  assert.equal(before.element("Vídeo-Principal").pauseCalls, 1);

  const topOverlap = createHarness();
  topOverlap.window.innerHeight = 200;
  topOverlap.element("Vídeo-Principal").paused = false;
  topOverlap.scrollTo(PRIMARY_VIDEO_TOP - topOverlap.window.innerHeight + 1);
  assert.equal(topOverlap.element("Vídeo-Principal").pauseCalls, 0);

  const bottomOverlap = createHarness();
  bottomOverlap.window.innerHeight = 200;
  bottomOverlap.element("Vídeo-Principal").paused = false;
  bottomOverlap.scrollTo(PRIMARY_VIDEO_TOP + PRIMARY_VIDEO_HEIGHT - 1);
  assert.equal(bottomOverlap.element("Vídeo-Principal").pauseCalls, 0);

  const after = createHarness();
  after.window.innerHeight = 200;
  after.element("Vídeo-Principal").paused = false;
  after.scrollTo(PRIMARY_VIDEO_TOP + PRIMARY_VIDEO_HEIGHT);
  assert.equal(after.element("Vídeo-Principal").pauseCalls, 1);

  const alreadyPaused = createHarness();
  alreadyPaused.window.innerHeight = 200;
  alreadyPaused.scrollTo(PRIMARY_VIDEO_TOP + PRIMARY_VIDEO_HEIGHT);
  assert.equal(alreadyPaused.element("Vídeo-Principal").pauseCalls, 0);
});

test("testimonial videos pause on explicit closes and remain playing on implicit hides", () => {
  for (const closeId of ["Seta-Fechamento-Seção-4", "Seta-Fechamento-Subseção-4.3"]) {
    const harness = createHarness();
    for (let number = 1; number <= 5; number += 1) {
      testimonialVideo(harness, number).paused = number % 2 === 0;
    }

    harness.dispatch(closeId);
    for (let number = 1; number <= 5; number += 1) {
      assert.equal(testimonialVideo(harness, number).pauseCalls, number % 2 === 0 ? 0 : 1);
    }
  }

  const sectionHide = createHarness();
  for (let number = 1; number <= 5; number += 1) testimonialVideo(sectionHide, number).paused = false;
  sectionHide.dispatch("Texto-Botão-Externo-Abertura-Seção-1");
  for (let number = 1; number <= 5; number += 1) {
    assert.equal(testimonialVideo(sectionHide, number).pauseCalls, 0);
  }

  const subsectionHide = createHarness();
  for (let number = 1; number <= 5; number += 1) testimonialVideo(subsectionHide, number).paused = false;
  subsectionHide.dispatch("Seta-Abertura-Subseção-4.1");
  for (let number = 1; number <= 5; number += 1) {
    assert.equal(testimonialVideo(subsectionHide, number).pauseCalls, 0);
  }
});

test("Instagram user-agent handling preserves controls and Direct positioning", () => {
  const ordinary = createHarness();
  for (let number = 1; number <= 5; number += 1) {
    assertClassState(ordinary.element(`Botão-Tela-Cheia-Vídeo-Depoimento-${number}`), {
      present: ["is-hidden"]
    });
    assertClassState(testimonialVideo(ordinary, number), {
      present: ["has-hidden-rotation-control"]
    });
  }

  ordinary.scrollTo(SECTION_TOPS[2] + 1);
  const direct = ordinary.element("Botão-Instagram-Direct");
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
    absent: ["has-fixed-position", "is-contained"],
    present: ["is-fixed", "is-hidden"]
  });

  const compositional = createHarness();
  const compositionalDirect = compositional.element("Botão-Instagram-Direct");
  compositional.scrollTo(SECTION_TOPS[2]);
  compositional.dispatch("Texto-Botão-Externo-Abertura-Seção-4");
  assertClassState(compositionalDirect, {
    absent: ["is-contained", "is-fixed"],
    present: ["has-fixed-position", "is-hidden"]
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
  compositional.dispatch("Texto-Botão-Externo-Abertura-Seção-4");
  assertClassState(compositionalDirect, {
    absent: ["is-fixed", "is-hidden"],
    present: ["has-fixed-position", "is-contained"]
  });

  compositional.scrollTo(section3Tail);
  assertClassState(compositionalDirect, {
    absent: ["has-fixed-position", "is-contained", "is-hidden"],
    present: ["is-fixed"]
  });

  const directLink = openingTag("Botão-Instagram-Direct");
  assert.match(directLink, /^<a\b/);
  assert.match(directLink, /\bhref="https:\/\/ig\.me\/m\/machado\.gestao"/);
  assert.match(directLink, /\btarget="_blank"/);
  assert.match(directLink, /\brel="noopener"/);
  assert.match(directLink, /\baria-label="Conversar pelo Instagram Direct"/);

  const instagram = createHarness({ userAgent: "Mozilla/5.0 Instagram 300" });
  for (let number = 1; number <= 5; number += 1) {
    assertClassState(instagram.element(`Botão-Tela-Cheia-Vídeo-Depoimento-${number}`), {
      absent: ["is-hidden"]
    });
    assertClassState(testimonialVideo(instagram, number), {
      absent: ["has-hidden-rotation-control"]
    });
  }
  instagram.scrollTo(SECTION_TOPS[2]);
  instagram.scrollTo(SECTION_TOPS[2] + 1);
  assertClassState(instagram.element("Botão-Instagram-Direct"), {
    absent: ["has-fixed-position", "is-contained", "is-fixed"],
    present: ["is-hidden"]
  });
});

test("download controls preserve all three public PDF destinations", () => {
  const downloads = [
    ["Botão-Download-Ementa-e-Softwares", "/landing-page/pdf/EMENTA E SOFTWARES.pdf"],
    ["Botão-Download-Bibliografias", "/landing-page/pdf/BIBLIOGRAFIA.pdf"],
    ["Botão-Download-Cronograma", "/landing-page/pdf/CRONOGRAMA.pdf"]
  ];

  for (const [id, url] of downloads) {
    const link = openingTag(id);
    assert.match(link, /^<a\b/);
    assert.equal(link.match(/\bhref="([^"]+)"/)?.[1], url);
    assert.match(link, /\btarget="_blank"/);
    assert.match(link, /\brel="noopener"/);
  }
});

test("all five testimonials toggle the exact rotated and standard presentation", () => {
  for (let number = 1; number <= 5; number += 1) {
    const harness = createHarness({ userAgent: "Mozilla/5.0 Instagram 300" });
    const container = harness.element(`Container-Vídeo-Depoimento-${number}`);
    const video = testimonialVideo(harness, number);
    const label = harness.element(`Texto-Tela-Cheia-Vídeo-Depoimento-${number}`);
    const buttonId = `Botão-Tela-Cheia-Vídeo-Depoimento-${number}`;
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
    assertLastScroll(harness, `Vídeo-Depoimento-${number}`);

    video.paused = false;
    harness.dispatch("Seta-Fechamento-Seção-4");
    assert.equal(video.pauseCalls, 1);
    assert.equal(label.innerHTML, "Tela Padrão");
    assertClassState(container, {
      absent: ["is-restored"],
      present: ["is-rotated"]
    });
    assert.equal(button.getAttribute("aria-pressed"), "true");

    harness.dispatch("Texto-Botão-Externo-Abertura-Seção-4");
    harness.dispatch("Seta-Abertura-Subseção-4.3");
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
    assertLastScroll(harness, `Vídeo-Depoimento-${number}`);
  }

  const independent = createHarness({ userAgent: "Mozilla/5.0 Instagram 300" });
  independent.dispatch("Botão-Tela-Cheia-Vídeo-Depoimento-3");
  for (let number = 1; number <= 5; number += 1) {
    assertClassState(independent.element(`Container-Vídeo-Depoimento-${number}`), {
      absent: number === 3 ? ["is-restored"] : ["is-restored", "is-rotated"],
      present: number === 3 ? ["is-rotated"] : []
    });
  }
});
