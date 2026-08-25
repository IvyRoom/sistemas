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
      "Formulário-Login": "form",
      "E-mail": "input",
      "Senha": "input",
      "Entrar": "button",
      "Container-Auxiliar-FaceID": "div"
    },
    "photo-registration": {
      "Formulário-Foto-Referência": "form",
      "Botão-Escolher-Arquivo": "input",
      "Botão-Cadastrar-Foto-Referência": "button",
      "Container-Auxiliar-FaceID": "div"
    },
    "course-content": {
      "Botão-Sair": "div",
      "Container-Módulo-1": "div",
      "Símbolo-Check-Tópico-1": "div",
      "Formação-Botão-Desempenho-e-Certificado": "div",
      "Container-Interno-Shaka-Player": "video",
      "Botão-Download-1": "a",
      "Campo-Comentários": "textarea",
      "Botão-Download-Certificado-Impresso": "div",
      "Faixa-Inferior": "div"
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
  assert.equal(
    (studyHtml.match(/<div class="Opção">\s*<input\b[^>]*>\s*<label>/g) ?? []).length,
    798,
    "Assessment choices currently retain their sibling-label seam"
  );
});

test("[A11Y-01] focus, selection, and motion expectations advance entry by entry", () => {
  const allCss = Object.keys(entries)
    .map((entryName) => readEntry(entryName, "style.css"))
    .join("\n");

  assert.match(readEntry("initial-notices", "style.css"), /:focus-visible/);
  assert.doesNotMatch(allCss, /prefers-reduced-motion/);
  assert.match(moduleSource("initial-notices"), /invalidFields\[0\]\.focus\(\)/);
  assert.doesNotMatch(readEntry("initial-notices", "style.css"), /\.Avisos-Iniciais\s*\{[^}]*user-select:/);
  assert.match(readEntry("photo-registration", "style.css"), /\.Instruções-Upload-Foto\{[^}]*user-select:\s*none;/);
  assert.match(readEntry("login", "style.css"), /#Manchete-Formulário-Login\{[^}]*user-select:\s*none;/);

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
});
