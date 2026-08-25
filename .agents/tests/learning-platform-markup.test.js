"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.join(__dirname, "..", "..");
const platformRoot = path.join(repositoryRoot, "apps", "learning-platform");

const entries = Object.freeze({
  "device-warning": {
    textCharacters: 83,
    textDigest: "8d14a486c0876d54a08747e1367b7d287182f352bd32347cd5be8dde848fd3b6"
  },
  "browser-warning": {
    textCharacters: 81,
    textDigest: "ef65efb7af609672583ef2ee3e99082f4ac4321510ea63533d68d18c8acdca91"
  },
  "initial-notices": {
    textCharacters: 2047,
    textDigest: "9c559f79accfe5a6b6302817c4394052af104cf759f9591e3d67e8426635b3d1"
  },
  "photo-registration": {
    textCharacters: 735,
    textDigest: "e32352648699c5d68ecbf702a37703ecbedefd5241c65ecf327403c22ac1b85a"
  },
  "course-content": {
    textCharacters: 74940,
    textDigest: "7d5008b37a43c813d66f31a6dae45d577ee0e90cdc126f8f5ca89c76fb6c1b47"
  },
  login: {
    textCharacters: 226,
    textDigest: "f3f142ef35fd416ad7345c9df4d406d27c391d11def65c977e1e6c0364d0baba"
  },
  "status-report": {
    textCharacters: 202,
    textDigest: "135520c2034620ae1337c6b4f69596a643e5ca4f25483c998c90c5d6e59a47d8"
  }
});

const moduleScopes = Object.freeze({
  "initial-notices": ["initial-notices.js"],
  login: ["login.js"],
  "photo-registration": ["photo-registration.js"],
  "course-content": fs
    .readdirSync(path.join(platformRoot, "modules", "course-content"))
    .filter((fileName) => fileName.endsWith(".js"))
    .map((fileName) => path.join("course-content", fileName)),
  "status-report": fs
    .readdirSync(path.join(platformRoot, "modules", "status-report"))
    .filter((fileName) => fileName.endsWith(".js"))
    .map((fileName) => path.join("status-report", fileName))
});

function readEntry(entryName, fileName) {
  return fs.readFileSync(path.join(platformRoot, entryName, fileName), "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function idValues(html) {
  return Array.from(
    html.matchAll(/(?<![-\w])id="([^"]+)"/g),
    ([, id]) => id
  );
}

function classValues(html) {
  return Array.from(
    html.matchAll(/(?<![-\w])class="([^"]+)"/g),
    ([, classes]) => classes.split(/\s+/)
  ).flat();
}

function openingTag(html, id) {
  return html.match(
    new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*(?<![-\\w])id="${escapeRegExp(id)}"[^>]*>`, "i")
  )?.[0];
}

function cssRule(css, selector) {
  const rule = Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g)).find(([, rawSelectors]) =>
    rawSelectors
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(",")
      .map((value) => value.trim())
      .includes(selector)
  );

  assert.ok(rule, `Missing CSS rule for ${selector}`);
  return rule[2];
}

function tagName(html, id) {
  return openingTag(html, id)?.match(/^<([a-z][a-z0-9-]*)/i)?.[1].toLowerCase();
}

function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&laquo;/gi, "\u00ab")
    .replace(/\s+/g, " ")
    .trim();
}

function digest(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function moduleSource(entryName) {
  return moduleScopes[entryName]
    .map((relativePath) =>
      fs.readFileSync(path.join(platformRoot, "modules", relativePath), "utf8")
    )
    .join("\n");
}

test("[MARKUP-01] seven entry documents retain unique DOM seams and exact visible copy", () => {
  assert.deepEqual(Object.keys(entries), [
    "device-warning",
    "browser-warning",
    "initial-notices",
    "photo-registration",
    "course-content",
    "login",
    "status-report"
  ]);

  for (const [entryName, expected] of Object.entries(entries)) {
    const html = readEntry(entryName, "index.html");
    const ids = idValues(html);
    const text = visibleText(html);

    assert.equal(new Set(ids).size, ids.length, `${entryName} IDs must be unique`);
    assert.equal(text.length, expected.textCharacters, `${entryName} visible text length`);
    assert.equal(digest(text), expected.textDigest, `${entryName} visible text digest`);
    assert.ok(fs.existsSync(path.join(platformRoot, entryName, "style.css")));
    assert.ok(fs.existsSync(path.join(platformRoot, entryName, "main.js")));
  }
});

test("[MARKUP-02] current application selector producers retain their exact DOM inventory", () => {
  const intentionallyMissingIds = {
    "status-report": [
      "Observação_Gráfico_Controle_Resultados_Avanço_Formação",
      "Título_Gráfico_Controle_Resultados_Avanço_Formação"
    ]
  };

  for (const entryName of Object.keys(moduleScopes)) {
    const html = readEntry(entryName, "index.html");
    const source = moduleSource(entryName);
    const initialIds = new Set(idValues(html));
    const generatedIds = new Set(
      Array.from(source.matchAll(/(?<![-\w])id=["']([^"']+)["']/g), ([, id]) => id)
    );
    const referencedIds = new Set(
      Array.from(
        source.matchAll(/getElementById\(\s*(["'])([^"']+)\1\s*\)/g),
        ([, , id]) => id
      )
    );

    const missingIds = Array.from(referencedIds)
      .filter((id) => !initialIds.has(id) && !generatedIds.has(id))
      .sort();
    assert.deepEqual(missingIds, intentionallyMissingIds[entryName] ?? [], entryName);
  }

  const studyHtml = readEntry("course-content", "index.html");
  const studyClasses = classValues(studyHtml);
  const expectedClassCounts = {
    "Container-Módulo": 10,
    "Container-Tópico-Fechado": 171,
    "Tópico-Nome": 171,
    "Containers-Questões-Módulos": 10,
    "Containers-Questões": 197,
    "Opção": 798,
    "Opções": 798,
    "Opções-Feedbacks": 20
  };

  for (const [className, expectedCount] of Object.entries(expectedClassCounts)) {
    assert.equal(
      studyClasses.filter((value) => value === className).length,
      expectedCount,
      className
    );
  }
});

test("[MARKUP-03] current event targets and generated-control seams remain explicit", () => {
  const targetContracts = {
    "device-warning": {
      "Sessão-Principal": "main",
      "Logo-Machado": "img",
      "Aviso": "h1"
    },
    "browser-warning": {
      "Sessão-Principal": "main",
      "Logo-Machado": "img",
      "Aviso": "h1"
    },
    "initial-notices": {
      "Seção": "main",
      "Logo-Machado": "img",
      "Manchete-Formulário": "h1",
      "Formulário": "form",
      "Palavra-Passe-Credenciais": "input",
      "Palavra-Passe-Direitos": "input",
      "Palavra-Passe-Janela": "input",
      "Botão-Li-e-Concordo": "button",
      "Texto-Rodapé": "footer"
    },
    login: {
      "Seção-Login": "main",
      "Logo-Machado": "img",
      "Manchete-Formulário-Login": "h1",
      "Cabeçalho-E-mail": "label",
      "Cabeçalho-Senha": "label",
      "Formulário-Login": "form",
      "E-mail": "input",
      "Senha": "input",
      "Entrar": "button",
      "Container-Auxiliar-FaceID": "div",
      "Texto-Rodapé": "footer"
    },
    "photo-registration": {
      "Seção-Cadastro-Foto-Referência": "main",
      "Logo-Machado": "img",
      "Manchete-Formulário-Foto-Referência": "h1",
      "Formulário-Foto-Referência": "form",
      "Botão-Escolher-Arquivo": "input",
      "Botão-Cadastrar-Foto-Referência": "button",
      "Container-Auxiliar-FaceID": "div",
      "Texto-Rodapé": "footer"
    },
    "course-content": {
      "Container-Seções": "main",
      "Seção-Navegação": "nav",
      "Botão-Sair": "button",
      "Formação-Nome": "h1",
      "Container-Módulo-1": "button",
      "Símbolo-Check-Tópico-1": "span",
      "Formação-Botão-Desempenho-e-Certificado": "button",
      "Seção-Conteúdo": "section",
      "Nome-Tópico": "h2",
      "Container-Interno-Shaka-Player": "video",
      "Botão-Download-1": "a",
      "Campo-Comentários": "textarea",
      "Botão-Download-Certificado-Impresso": "button",
      "Faixa-Inferior": "footer"
    },
    "status-report": {
      "Seção_Principal": "main",
      "Faixa_Superior": "header",
      "Título_Status_Report": "h1",
      "Última_Atualização": "p",
      "Logo_Machado": "img",
      "Aviso_Carregando_Informações": "div",
      "Container_Externo_Conteúdo": "section",
      "Manchete": "h2",
      "Texto_Rodapé": "footer"
    }
  };

  for (const [entryName, contracts] of Object.entries(targetContracts)) {
    const html = readEntry(entryName, "index.html");
    for (const [id, expectedTag] of Object.entries(contracts)) {
      assert.equal(tagName(html, id), expectedTag, `${entryName}#${id}`);
    }
  }

  const studyHtml = readEntry("course-content", "index.html");
  assert.equal((studyHtml.match(/<input\b[^>]*\btype="radio"/g) ?? []).length, 593);
  assert.equal((studyHtml.match(/<input\b[^>]*\btype="checkbox"/g) ?? []).length, 225);
  assert.equal((studyHtml.match(/<label\b/g) ?? []).length, 818);
  assert.equal((studyHtml.match(/<button\b/g) ?? []).length, 184);
  assert.equal((studyHtml.match(/<fieldset\b/g) ?? []).length, 201);
  assert.equal((studyHtml.match(/<legend\b/g) ?? []).length, 201);
  assert.equal(
    (studyHtml.match(/<button\b[^>]*class="Container-Tópico-Fechado"[^>]*disabled>/g) ?? []).length,
    171
  );
  assert.equal(
    (studyHtml.match(/<label class="Opção">\s*<input\b[^>]*>\s*<span>/g) ?? []).length,
    798,
    "Assessment choices must keep the input directly wrapped by its visible label"
  );
  const describedAssessmentGroups = Array.from(
    studyHtml.matchAll(
      /<fieldset class="Containers-Questões" aria-describedby="(question-prompt-(\d+))">[\s\S]*?<legend class="Títulos">Questão \2<\/legend>[\s\S]*?<div class="Perguntas" id="\1">/g
    )
  );
  assert.equal(describedAssessmentGroups.length, 197);
  assert.equal(new Set(describedAssessmentGroups.map((match) => match[1])).size, 197);
});

test("[A11Y-01] focus, non-selectable copy, and motion expectations advance entry by entry", () => {
  assert.match(readEntry("initial-notices", "style.css"), /:focus-visible/);
  assert.match(readEntry("login", "style.css"), /:focus-visible/);
  assert.match(readEntry("login", "style.css"), /prefers-reduced-motion/);
  assert.match(readEntry("login", "style.css"), /:is\(\.loading-dot, \.cancel-button\)/);
  assert.match(readEntry("photo-registration", "style.css"), /:focus-visible/);
  assert.match(readEntry("photo-registration", "style.css"), /prefers-reduced-motion/);
  assert.match(readEntry("photo-registration", "style.css"), /:is\(\.loading-dot, \.cancel-button\)/);
  assert.match(moduleSource("initial-notices"), /invalidFields\[0\]\.focus\(\)/);
  assert.match(moduleSource("login"), /email\.focus\(\)/);
  assert.match(moduleSource("photo-registration"), /referencePhotoInput\.focus\(\)/);
  for (const entryName of Object.keys(entries)) {
    const style = readEntry(entryName, "style.css");
    const globalRule = cssRule(style, "*");

    assert.match(globalRule, /-webkit-user-select:\s*none\s*;/, entryName);
    assert.match(globalRule, /(?:^|\s)user-select:\s*none\s*;/, entryName);
    assert.doesNotMatch(
      style,
      /(?:-webkit-)?user-select:\s*(?:all|auto|contain|text)\b/,
      `${entryName} must not override the non-selectable-copy policy`
    );
  }

  const noticesHtml = readEntry("initial-notices", "index.html");
  for (const [suffix, inputId] of [
    ["Credenciais", "Palavra-Passe-Credenciais"],
    ["Direitos", "Palavra-Passe-Direitos"],
    ["Janela", "Palavra-Passe-Janela"]
  ]) {
    assert.match(
      noticesHtml,
      new RegExp(`<label\\b[^>]*for="${inputId}"[^>]*>Palavra-Passe:<\\/label>`)
    );
    const inputTag = openingTag(noticesHtml, inputId);
    assert.match(inputTag, new RegExp(`aria-describedby="Alerta-Palavra-Passe-${suffix}"`));
    assert.match(inputTag, /aria-invalid="false"/);
    assert.match(
      openingTag(noticesHtml, `Alerta-Palavra-Passe-${suffix}`),
      /role="alert"/
    );
  }

  const loginHtml = readEntry("login", "index.html");
  assert.match(openingTag(loginHtml, "Cabeçalho-E-mail"), /for="E-mail"/);
  assert.match(openingTag(loginHtml, "Cabeçalho-Senha"), /for="Senha"/);
  assert.match(openingTag(loginHtml, "E-mail"), /autocomplete="username"/);
  assert.match(openingTag(loginHtml, "Senha"), /autocomplete="current-password"/);
  assert.match(openingTag(loginHtml, "Aviso-Inicializando"), /role="status"/);
  for (const id of [
    "Aviso-Email-ou-Senha-Inválidos",
    "Aviso-Login-Expirado",
    "Aviso-FaceID-Reprovado"
  ]) {
    assert.match(openingTag(loginHtml, id), /role="alert"/);
  }

  const registrationHtml = readEntry("photo-registration", "index.html");
  const fileInput = openingTag(registrationHtml, "Botão-Escolher-Arquivo");
  assert.match(fileInput, /accept="\.jpg"/);
  assert.match(fileInput, /aria-label="Foto de referência"/);
  assert.match(fileInput, /aria-describedby="Registration-Instructions"/);
  assert.match(openingTag(registrationHtml, "Aviso-Cadastrando"), /role="status"/);
  for (const tag of registrationHtml.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? []) {
    assert.match(tag, /rel="noopener noreferrer"/);
  }

  const reportHtml = readEntry("status-report", "index.html");
  assert.match(openingTag(reportHtml, "Seção_Principal"), /aria-busy="true"/);
  assert.match(openingTag(reportHtml, "Aviso_Carregando_Informações"), /role="status"/);
  assert.match(
    moduleSource("status-report"),
    /<section class="Gráficos_Controle_Resultados" aria-labelledby=/
  );
  assert.match(
    moduleSource("status-report"),
    /<h3 class="Títulos_Gráficos_Controle_Resultados"/
  );

  const studyHtml = readEntry("course-content", "index.html");
  const studyStyle = readEntry("course-content", "style.css");
  const studySource = moduleSource("course-content");
  assert.match(studyHtml, /<html lang="pt-BR">/);
  assert.equal((studyHtml.match(/aria-hidden="true" focusable="false"/g) ?? []).length, 20);
  assert.equal((studyHtml.match(/class="Símbolo-Check-Fechado"[^>]*aria-hidden="true"/g) ?? []).length, 171);
  assert.match(openingTag(studyHtml, "Campo-Comentários"), /aria-labelledby="Manchete-Comentários"/);
  assert.match(openingTag(studyHtml, "Campo-Comentários"), /aria-describedby="Explicação-Comentários Campo-Comentários-Contador-Caracteres"/);
  assert.match(studyStyle, /:focus-visible/);
  assert.match(studyStyle, /prefers-reduced-motion/);
  assert.match(cssRule(studyStyle, "#Container-Tamanho-Módulo"), /margin-top:\s*20px\s*;/);
  assert.match(cssRule(studyStyle, "#Container-Qualidade-Conteúdo"), /margin-top:\s*20px\s*;/);
  assert.match(cssRule(studyStyle, "#Container-Qualidade-Plataforma"), /margin-top:\s*20px\s*;/);
  assert.match(cssRule(studyStyle, "#Container-Qualidade-Materiais-Impressos"), /margin-top:\s*20px\s*;/);
  assert.match(cssRule(studyStyle, "#Container-Comentários"), /margin-top:\s*20px\s*;/);
  assert.doesNotMatch(cssRule(studyStyle, "#Manchete-Tamanho-Módulo"), /margin-top:/);
  assert.match(cssRule(studyStyle, "#Containter-Alternativas-Tamanho-Módulo"), /flex-wrap:\s*nowrap\s*;/);
  const certificateDownloadRule = cssRule(studyStyle, "#Botão-Download-Certificado-Impresso");
  assert.match(certificateDownloadRule, /display:\s*block\s*;/);
  assert.match(certificateDownloadRule, /margin-left:\s*auto\s*;/);
  assert.match(certificateDownloadRule, /margin-right:\s*auto\s*;/);
  assert.match(studySource, /<button type="button" id="Botão-Completar-e-Continuar">/);
  assert.match(studySource, /downloadLink\.setAttribute\('aria-label'/);
  assert.match(studySource, /nextTopic\.disabled = false/);
  assert.match(studySource, /'aria-valuenow'/);
  assert.match(studySource, /'aria-expanded'/);
  assert.match(studySource, /'aria-current'/);
  assert.equal(
    (studySource.match(/if \(focusHeading\) topicHeading\.focus\(\);/g) ?? []).length,
    2
  );
  assert.match(studySource, /openTopic\.call\([^;]+\{ focusHeading: false \}\)/);
  assert.match(studySource, /openPerformance\(\{ focusHeading: false \}\)/);
  assert.match(studySource, /dom\.assessmentReview\.focus\(\)/);
});
