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
const htmlIds = new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g), ([, id]) => id));

const VIEWPORT_HEIGHT = 800;
const CTA_HEIGHT = 150;
const SECTION_TOPS = [1000, 3000, 5000, 7000];
const FINAL_SPACER_TOP = 9000;
const PRIMARY_VIDEO_TOP = 500;
const PRIMARY_VIDEO_HEIGHT = 300;
const HLS_URL = "https://videospreparatoriosv2.blob.core.windows.net/videosv3/LandingPagePJ/video-principal/master.m3u8";
const POSTER_URL = "./landing-page/img/CAPA_VÍDEO_PRINCIPAL.jpg";

function createHarness({ userAgent = "Mozilla/5.0" } = {}) {
  const elements = new Map();
  const listeners = new Map();
  const observers = [];
  const openCalls = [];
  const scrollCalls = [];
  const playerInstances = [];
  const overlayInstances = [];

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

    return {
      id,
      attributes,
      innerHTML: /^Texto-Tela-Cheia-Vídeo-Depoimento-[1-5]$/.test(id)
        ? "Tela Cheia"
        : "",
      offsetHeight: elementGeometry.offsetHeight,
      offsetTop: elementGeometry.offsetTop,
      paused: true,
      pauseCalls: 0,
      style: {},
      addEventListener(type, listener) {
        listeners.set(`${id}:${type}`, listener);
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      pause() {
        this.pauseCalls += 1;
        this.paused = true;
      },
      scrollIntoView(options) {
        scrollCalls.push({
          id,
          options: { behavior: options?.behavior }
        });
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
      }
    };
  }

  function element(id) {
    if (!elements.has(id)) elements.set(id, createElement(id));
    return elements.get(id);
  }

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

  const context = vm.createContext({
    console,
    document: { getElementById: element },
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
    let defaultPrevented = false;
    const event = {
      preventDefault() {
        defaultPrevented = true;
      }
    };
    listener(event);
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
    element,
    openCalls,
    overlayInstances,
    playerInstances,
    observer: observers[0],
    scrollCalls,
    scrollTo,
    window
  };
}

function assertLastScroll(harness, id) {
  const call = harness.scrollCalls.at(-1);
  assert.equal(call.id, id);
  assert.equal(call.options.behavior, "smooth");
}

function testimonialVideo(harness, number) {
  return harness.element(`Vídeo-Depoimento-${number}`);
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
  assert.match(css, /\*\{[\s\S]*?user-select: none;[\s\S]*?\}/);
  assert.match(
    css,
    /@media \(min-width: 431px\) \{[\s\S]*?--considered-screen-width: 430px;[\s\S]*?--considered-margin-left: calc\(50vw - \(var\(--considered-screen-width\)\/2\)\);/
  );
  assert.match(css, /animation: Teste 12s ease-in infinite;/);
  assert.match(css, /animation: Pulsos-Botões-Externos-Abertura-Seções 3s ease-out infinite;/);
  assert.doesNotMatch(source, /\b(?:setTimeout|setInterval|requestAnimationFrame)\s*\(/);
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
    assert.match(html, new RegExp(`<h2 id="Texto-Interno-Chamada-Seção-${number}">`));
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
  assert.deepEqual(
    Array.from(html.matchAll(/<a\b[^>]*\btarget="_blank"[^>]*>/g), ([tag]) => tag),
    [
      "<a href=\"https://online.hbs.edu/blog/post/from-core-to-connext-2019\" class=\"Texto-Interno-Branco\" target=\"_blank\" rel=\"noopener\">"
    ]
  );
  assert.deepEqual(
    Array.from(source.matchAll(/window\.open\(([^;]+)\);/g), ([, argumentsList]) => argumentsList),
    [
      "\"https://ig.me/m/machado.gestao\",\"_blank\",\"noopener\"",
      "\"/landing-page/pdf/EMENTA E SOFTWARES.pdf\",\"_blank\",\"noopener\"",
      "\"/landing-page/pdf/BIBLIOGRAFIA.pdf\",\"_blank\",\"noopener\"",
      "\"/landing-page/pdf/CRONOGRAMA.pdf\",\"_blank\",\"noopener\""
    ]
  );
});

test("external article, media, Instagram, and Shaka URLs remain exact", () => {
  const testimonialSuffix = "?sp=r&st=2024-11-01T11:00:00Z&se=2050-01-01T03:00:00Z&spr=https&sv=2022-11-02&sr=c&sig=o%2FEOtQQlRp4%2F0Iu4Pbn4EghosVs6DoYgIkr4kUfclIc%3D";
  const htmlUrls = Array.from(
    html.matchAll(/\b(?:href|src)="(https:\/\/[^\"]+)"/g),
    ([, url]) => url
  );

  assert.deepEqual(htmlUrls, [
    "https://online.hbs.edu/blog/post/from-core-to-connext-2019",
    ...Array.from(
      { length: 5 },
      (_, index) => `https://videospreparatoriosv2.blob.core.windows.net/videosv3/LandingPagePJ/Depoimento-${index + 1}.mp4${testimonialSuffix}`
    ),
    "https://cdn.jsdelivr.net/npm/shaka-player@4.3.5/dist/controls.css",
    "https://cdn.jsdelivr.net/npm/shaka-player@4.3.5/dist/shaka-player.ui.js"
  ]);

  assert.deepEqual(
    Array.from(source.matchAll(/"(https:\/\/[^\"]+)"/g), ([, url]) => url),
    [HLS_URL, "https://ig.me/m/machado.gestao"]
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
    harness.dispatch(`Container-Externo-Seção-${selected}`);

    for (let number = 1; number <= 4; number += 1) {
      assert.equal(
        harness.element(`Container-Externo-Seção-${number}`).style.display,
        number === selected ? "none" : "block",
        `section ${selected}, external ${number}`
      );
      assert.equal(
        harness.element(`Container-Interno-Seção-${number}`).style.display,
        number === selected ? "block" : "none",
        `section ${selected}, internal ${number}`
      );
    }

    assertLastScroll(harness, `Container-Interno-Seção-${selected}`);
    assert.equal(harness.element(`Seta-Fechamento-Seção-${selected}`).style.position, "fixed");
    assert.equal(harness.element(`Seta-Fechamento-Seção-${selected}`).style.bottom, "25px");

    if (selected === 3) {
      harness.element("Subseção-Fechada-3.2").style.display = "none";
      harness.element("Subseção-Aberta-3.2").style.display = "block";
    }
    if (selected === 4) {
      harness.element("Subseção-Fechada-4.2").style.display = "none";
      harness.element("Subseção-Aberta-4.2").style.display = "block";
      assert.equal(harness.element("Botão-Instagram-Direct").style.position, "fixed");
    }

    harness.dispatch(`Seta-Fechamento-Seção-${selected}`);
    assert.equal(harness.element(`Container-Externo-Seção-${selected}`).style.display, "block");
    assert.equal(harness.element(`Container-Interno-Seção-${selected}`).style.display, "none");
    assertLastScroll(harness, `Container-Externo-Seção-${selected}`);

    if (selected === 3) {
      for (let number = 1; number <= 5; number += 1) {
        assert.equal(harness.element(`Subseção-Fechada-3.${number}`).style.display, "block");
        assert.equal(harness.element(`Subseção-Aberta-3.${number}`).style.display, "none");
      }
    }
    if (selected === 4) {
      for (let number = 1; number <= 3; number += 1) {
        assert.equal(harness.element(`Subseção-Fechada-4.${number}`).style.display, "block");
        assert.equal(harness.element(`Subseção-Aberta-4.${number}`).style.display, "none");
      }
    }
  }
});

test("section 3 and 4 subsections keep one panel open and return to the closed header", () => {
  for (const [section, count] of [[3, 5], [4, 3]]) {
    for (let selected = 1; selected <= count; selected += 1) {
      const harness = createHarness();
      harness.dispatch(`Subseção-Fechada-${section}.${selected}`);

      for (let number = 1; number <= count; number += 1) {
        assert.equal(
          harness.element(`Subseção-Fechada-${section}.${number}`).style.display,
          number === selected ? "none" : "block",
          `subsection ${section}.${selected}, closed ${number}`
        );
        assert.equal(
          harness.element(`Subseção-Aberta-${section}.${number}`).style.display,
          number === selected ? "block" : "none",
          `subsection ${section}.${selected}, open ${number}`
        );
      }

      assertLastScroll(harness, `Subseção-Aberta-${section}.${selected}`);
      if (section === 4 && selected === 2) {
        assert.match(
          harness.element("Data-Atualização-Estatísticas-Padrão-Vermelho").innerHTML,
          /^Data e hora de atualização: /
        );
      }

      harness.dispatch(`Seta-Fechamento-Subseção-${section}.${selected}`);
      assert.equal(harness.element(`Subseção-Fechada-${section}.${selected}`).style.display, "block");
      assert.equal(harness.element(`Subseção-Aberta-${section}.${selected}`).style.display, "none");
      assertLastScroll(harness, `Subseção-Fechada-${section}.${selected}`);
    }
  }
});

test("quote CTA preserves visibility thresholds, positioning, and destination", () => {
  const harness = createHarness();
  const cta = harness.element("Container-Botão-Principal");
  const spacer = harness.element("Espaço-Final-Container-Botão-Principal");

  assert.equal(cta.style.display, "none");
  harness.scrollTo(SECTION_TOPS[0] - VIEWPORT_HEIGHT - 1);
  assert.equal(cta.style.display, "none");

  harness.scrollTo(SECTION_TOPS[0] - VIEWPORT_HEIGHT);
  assert.equal(cta.style.display, "block");
  assert.equal(spacer.style.height, `${CTA_HEIGHT}px`);
  assert.equal(cta.style.position, "absolute");
  assert.equal(cta.style.top, `${SECTION_TOPS[0]}px`);
  assert.equal(cta.style.bottom, "");

  harness.scrollTo(SECTION_TOPS[0] + CTA_HEIGHT - VIEWPORT_HEIGHT - 1);
  assert.equal(cta.style.position, "absolute");
  harness.scrollTo(SECTION_TOPS[0] + CTA_HEIGHT - VIEWPORT_HEIGHT);
  assert.equal(cta.style.position, "fixed");
  assert.equal(cta.style.top, "");
  assert.equal(cta.style.bottom, "0px");

  harness.scrollTo(0);
  assert.equal(cta.style.display, "block");
  assert.equal(cta.style.position, "fixed");

  const event = harness.dispatch("Botão-Principal");
  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.window.location.href, "/solicitacao-orcamento/");
});

test("section close arrows keep their hidden, fixed, and relative boundaries", () => {
  const nextTops = [...SECTION_TOPS.slice(1), FINAL_SPACER_TOP];
  const fixedMargin = "calc((var(--considered-screen-width) * 0.50) - 40px)";

  for (let number = 1; number <= 4; number += 1) {
    const harness = createHarness();
    const arrow = harness.element(`Seta-Fechamento-Seção-${number}`);
    const signup = harness.element(`Subseção-Cadastro-${number}`);
    const start = SECTION_TOPS[number - 1];
    const tail = nextTops[number - 1] - VIEWPORT_HEIGHT + CTA_HEIGHT;

    harness.scrollTo(start);
    assert.equal(arrow.style.display, "none");

    harness.scrollTo(start + 1);
    assert.equal(signup.style.marginBottom, "20px");
    assert.equal(arrow.style.display, "flex");
    assert.equal(arrow.style.position, "fixed");
    assert.equal(arrow.style.bottom, `${CTA_HEIGHT + 15}px`);
    assert.equal(arrow.style.marginBottom, "0px");
    assert.equal(arrow.style.marginLeft, fixedMargin);

    harness.scrollTo(tail);
    assert.equal(arrow.style.position, "fixed");
    harness.scrollTo(tail + 1);
    assert.equal(signup.style.marginBottom, "15px");
    assert.equal(arrow.style.display, "flex");
    assert.equal(arrow.style.position, "relative");
    assert.equal(arrow.style.bottom, "0px");
    assert.equal(arrow.style.marginBottom, "-25px");
    assert.equal(arrow.style.marginLeft, fixedMargin);
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
  sectionHide.dispatch("Container-Externo-Seção-1");
  for (let number = 1; number <= 5; number += 1) {
    assert.equal(testimonialVideo(sectionHide, number).pauseCalls, 0);
  }

  const subsectionHide = createHarness();
  for (let number = 1; number <= 5; number += 1) testimonialVideo(subsectionHide, number).paused = false;
  subsectionHide.dispatch("Subseção-Fechada-4.1");
  for (let number = 1; number <= 5; number += 1) {
    assert.equal(testimonialVideo(subsectionHide, number).pauseCalls, 0);
  }
});

test("Instagram user-agent handling preserves controls and Direct positioning", () => {
  const ordinary = createHarness();
  for (let number = 1; number <= 5; number += 1) {
    assert.equal(ordinary.element(`Botão-Tela-Cheia-Vídeo-Depoimento-${number}`).style.display, "none");
    assert.equal(testimonialVideo(ordinary, number).style.marginBottom, "30px");
  }

  ordinary.scrollTo(SECTION_TOPS[2] + 1);
  const direct = ordinary.element("Botão-Instagram-Direct");
  assert.equal(direct.style.display, "block");
  assert.equal(direct.style.position, "fixed");
  assert.equal(direct.style.width, "60px");
  assert.equal(direct.style.bottom, "160px");
  assert.equal(direct.style.marginBottom, "0px");
  assert.equal(direct.style.marginLeft, "calc((var(--considered-screen-width) * 0.95) - 60px)");

  const section3Tail = SECTION_TOPS[3] - VIEWPORT_HEIGHT + CTA_HEIGHT;
  ordinary.scrollTo(section3Tail + 1);
  assert.equal(direct.style.display, "flex");
  assert.equal(direct.style.position, "relative");
  assert.equal(direct.style.bottom, "30px");
  assert.equal(direct.style.marginBottom, "-60px");

  const directEvent = ordinary.dispatch("Botão-Instagram-Direct");
  assert.equal(directEvent.defaultPrevented, true);
  assert.deepEqual(ordinary.openCalls.at(-1), {
    features: "noopener",
    target: "_blank",
    url: "https://ig.me/m/machado.gestao"
  });

  const instagram = createHarness({ userAgent: "Mozilla/5.0 Instagram 300" });
  for (let number = 1; number <= 5; number += 1) {
    assert.equal(instagram.element(`Botão-Tela-Cheia-Vídeo-Depoimento-${number}`).style.display, undefined);
    assert.equal(testimonialVideo(instagram, number).style.marginBottom, undefined);
  }
  instagram.scrollTo(SECTION_TOPS[2]);
  instagram.scrollTo(SECTION_TOPS[2] + 1);
  assert.equal(instagram.element("Botão-Instagram-Direct").style.display, "none");
});

test("download controls preserve all three public PDF destinations", () => {
  const harness = createHarness();
  const downloads = [
    ["Botão-Download-Ementa-e-Softwares", "/landing-page/pdf/EMENTA E SOFTWARES.pdf"],
    ["Botão-Download-Bibliografias", "/landing-page/pdf/BIBLIOGRAFIA.pdf"],
    ["Botão-Download-Cronograma", "/landing-page/pdf/CRONOGRAMA.pdf"]
  ];

  for (const [id, url] of downloads) {
    const event = harness.dispatch(id);
    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(harness.openCalls.at(-1), { features: "noopener", target: "_blank", url });
  }
});

test("all five testimonials toggle the exact rotated and standard presentation", () => {
  for (let number = 1; number <= 5; number += 1) {
    const harness = createHarness();
    const container = harness.element(`Container-Vídeo-Depoimento-${number}`);
    const video = testimonialVideo(harness, number);
    const label = harness.element(`Texto-Tela-Cheia-Vídeo-Depoimento-${number}`);
    const button = `Botão-Tela-Cheia-Vídeo-Depoimento-${number}`;

    harness.dispatch(button);
    assert.equal(container.style.width, "calc(var(--considered-screen-width) * 0.80)");
    assert.equal(container.style.height, "calc(var(--considered-screen-width) * 1.42196)");
    assert.equal(video.style.width, "calc(var(--considered-screen-width) * 1.42196)");
    assert.equal(video.style.height, "calc(var(--considered-screen-width) * 0.80)");
    assert.equal(video.style.transformOrigin, "top left");
    assert.equal(video.style.transform, "rotate(90deg) translateY(-100%)");
    assert.equal(label.innerHTML, "Tela Padrão");
    assertLastScroll(harness, `Vídeo-Depoimento-${number}`);

    video.paused = false;
    harness.dispatch("Seta-Fechamento-Seção-4");
    assert.equal(video.pauseCalls, 1);
    assert.equal(label.innerHTML, "Tela Padrão");
    assert.equal(video.style.transform, "rotate(90deg) translateY(-100%)");

    harness.dispatch(button);
    assert.equal(container.style.width, "calc(var(--considered-screen-width) * 0.90)");
    assert.equal(container.style.height, "calc(var(--considered-screen-width) * 0.50634)");
    assert.equal(video.style.width, "calc(var(--considered-screen-width) * 0.90)");
    assert.equal(video.style.height, "calc(var(--considered-screen-width) * 0.50634)");
    assert.equal(video.style.transformOrigin, "");
    assert.equal(video.style.transform, "");
    assert.equal(label.innerHTML, "Tela Cheia");
    assertLastScroll(harness, `Vídeo-Depoimento-${number}`);
  }
});
