"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.join(__dirname, "..", "..");
const platformRoot = path.join(repositoryRoot, "apps", "learning-platform");
const entrySourcePaths = [
  "viewport-warning/main.js",
  "device-browser-warning/main.js",
  "initial-notices/main.js",
  "photo-registration/main.js",
  "course-content/main.js",
  "login/main.js",
  "status-report/main.js"
];

const deprecatedInternalIdentifiers = new Map([
  ["MóduloAberto", "moduleName"],
  ["NomeVídeo", "videoName"],
  ["ContainerDownloadArquivo1", "downloadContainer1"],
  ["ContainerDownloadArquivo2", "downloadContainer2"],
  ["ContainerDownloadArquivo3", "downloadContainer3"],
  ["ContainerDownloadArquivo4", "downloadContainer4"],
  ["NomeArquivo1", "downloadName1"],
  ["NomeArquivo2", "downloadName2"],
  ["NomeArquivo3", "downloadName3"],
  ["NomeArquivo4", "downloadName4"],
  ["BotãoDownload1", "downloadButton1"],
  ["BotãoDownload2", "downloadButton2"],
  ["BotãoDownload3", "downloadButton3"],
  ["BotãoDownload4", "downloadButton4"],
  ["Usuário_NomeCompleto", "fullName"],
  ["Usuário_Formação_NotaAcumulado", "accumulatedGrade"],
  ["Usuário_Formação_CertificadoID", "certificateId"]
]);

// These identifiers are Portuguese compatibility fields at the API boundary. They
// are allowed only as object keys or member properties, never as local bindings.
const boundaryIdentifierAllowlist = new Set([
  "Dados_Extraídos_BD_Plataforma",
  "Feedback_Comentários",
  "Feedback_DataPreenchimento",
  "Feedback_QualidadeConteúdo",
  "Feedback_QualidadeMateriaisImpressos",
  "Feedback_QualidadePlataforma",
  "Feedback_TamanhoMódulo",
  "NotaTeste",
  "NúmeroMódulo",
  "NúmeroTópicosConcluídos",
  "Opções",
  "Símbolo",
  "TipoAtualização",
  "Tópico",
  "Usuário_Email",
  "Usuário_Foto_Cadastrada",
  "Usuário_Formação_CertificadoID",
  "Usuário_Formação_NotaAcumulado",
  "Usuário_Formação_NúmeroTópicosConcluídos",
  "Usuário_Login",
  "Usuário_NomeCompleto",
  "Usuário_PrazoAcesso",
  "Usuário_PrimeiroNome",
  "Usuário_Senha",
  "Usuário_Status_FaceID",
  "Usuário_Status_Login"
]);

const compatibilityCommentLocations = new Set([
  "modules/status-report/query.js:13"
]);

const approvedApplicationCommentRules = [
  {
    path: "modules/course-content/downloads.js",
    pattern: /^\/+$/u
  },
  {
    path: "modules/course-content/downloads.js",
    pattern: /^ Module (?:2|3|4|5|7|8|9)$/u
  }
];

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function regularJavaScriptFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => compareText(left.name, right.name))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return regularJavaScriptFiles(entryPath);
      return entry.isFile() && path.extname(entry.name) === ".js" ? [entryPath] : [];
    });
}

function applicationSources() {
  const modulePaths = regularJavaScriptFiles(path.join(platformRoot, "modules"));
  const entryPaths = entrySourcePaths.map((relativePath) =>
    path.join(platformRoot, ...relativePath.split("/"))
  );

  return [...entryPaths, ...modulePaths]
    .sort(compareText)
    .map((filePath) => ({
      filePath,
      relativePath: path.relative(platformRoot, filePath).split(path.sep).join("/"),
      source: fs.readFileSync(filePath, "utf8")
    }));
}

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function maskJavaScriptLiterals(source) {
  const masked = source.split("");
  const comments = [];

  function mask(start, end) {
    for (let index = start; index < end; index += 1) {
      if (masked[index] !== "\r" && masked[index] !== "\n") masked[index] = " ";
    }
  }

  function scanQuotedString(start) {
    const quote = source[start];
    let end = start + 1;
    while (end < source.length) {
      if (source[end] === "\\") {
        end += 2;
        continue;
      }
      if (source[end] === quote) {
        end += 1;
        break;
      }
      end += 1;
    }
    mask(start, Math.min(end, source.length));
    return end;
  }

  function scanLineComment(start) {
    let end = start + 2;
    while (end < source.length && source[end] !== "\r" && source[end] !== "\n") {
      end += 1;
    }
    comments.push({ index: start, text: source.slice(start + 2, end) });
    mask(start, end);
    return end;
  }

  function scanBlockComment(start) {
    let end = start + 2;
    while (end < source.length && !(source[end] === "*" && source[end + 1] === "/")) {
      end += 1;
    }
    end = Math.min(end + 2, source.length);
    comments.push({ index: start, text: source.slice(start + 2, end - 2) });
    mask(start, end);
    return end;
  }

  function scanTemplateExpression(start) {
    let cursor = start;
    let braceDepth = 0;

    while (cursor < source.length) {
      const character = source[cursor];
      const nextCharacter = source[cursor + 1];

      if (character === "'" || character === '"') {
        cursor = scanQuotedString(cursor);
        continue;
      }
      if (character === "`") {
        cursor = scanTemplate(cursor);
        continue;
      }
      if (character === "/" && nextCharacter === "/") {
        cursor = scanLineComment(cursor);
        continue;
      }
      if (character === "/" && nextCharacter === "*") {
        cursor = scanBlockComment(cursor);
        continue;
      }
      if (character === "{") {
        braceDepth += 1;
      } else if (character === "}") {
        if (braceDepth === 0) return cursor;
        braceDepth -= 1;
      }
      cursor += 1;
    }

    return cursor;
  }

  function scanTemplate(start) {
    mask(start, start + 1);
    let cursor = start + 1;

    while (cursor < source.length) {
      if (source[cursor] === "\\") {
        mask(cursor, Math.min(cursor + 2, source.length));
        cursor += 2;
        continue;
      }
      if (source[cursor] === "`") {
        mask(cursor, cursor + 1);
        return cursor + 1;
      }
      if (source[cursor] === "$" && source[cursor + 1] === "{") {
        mask(cursor, cursor + 2);
        const expressionEnd = scanTemplateExpression(cursor + 2);
        if (source[expressionEnd] === "}") mask(expressionEnd, expressionEnd + 1);
        cursor = expressionEnd + 1;
        continue;
      }
      mask(cursor, cursor + 1);
      cursor += 1;
    }

    return cursor;
  }

  for (let index = 0; index < source.length;) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === "/" && nextCharacter === "/") {
      index = scanLineComment(index);
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      index = scanBlockComment(index);
      continue;
    }

    if (character === "'" || character === '"') {
      index = scanQuotedString(index);
      continue;
    }

    if (character === "`") {
      index = scanTemplate(index);
      continue;
    }

    index += 1;
  }

  return { code: masked.join(""), comments };
}

function nearestNonWhitespace(source, index, direction) {
  for (
    let cursor = index;
    cursor >= 0 && cursor < source.length;
    cursor += direction
  ) {
    if (!/\s/u.test(source[cursor])) return source[cursor];
  }
  return null;
}

function isBoundaryProperty(code, match) {
  const before = nearestNonWhitespace(code, match.index - 1, -1);
  const after = nearestNonWhitespace(code, match.index + match[0].length, 1);
  return before === "." || after === ":";
}

test("template expressions remain visible to the internal-identifier scanner", () => {
  const { code } = maskJavaScriptLiterals(
    "const rendered = `compatibility text ${MóduloAberto}`;"
  );

  assert.match(code, /MóduloAberto/u);
  assert.doesNotMatch(code, /compatibility text/u);
});

test("application-owned learning-platform identifiers stay English and ASCII", () => {
  const violations = [];

  for (const { relativePath, source } of applicationSources()) {
    const { code } = maskJavaScriptLiterals(source);
    const identifiers = code.matchAll(/[$_\p{ID_Start}][$\u200C\u200D\p{ID_Continue}]*/gu);

    for (const match of identifiers) {
      const identifier = match[0];
      const location = `${relativePath}:${lineNumber(source, match.index)}`;

      if (deprecatedInternalIdentifiers.has(identifier)) {
        if (
          boundaryIdentifierAllowlist.has(identifier) &&
          isBoundaryProperty(code, match)
        ) {
          continue;
        }
        violations.push(
          `${location} uses ${identifier}; use ${deprecatedInternalIdentifiers.get(identifier)}`
        );
        continue;
      }

      if (/^[\x00-\x7F]+$/u.test(identifier)) continue;
      if (
        boundaryIdentifierAllowlist.has(identifier) &&
        isBoundaryProperty(code, match)
      ) {
        continue;
      }
      violations.push(
        `${location} contains unclassified non-ASCII identifier ${identifier}`
      );
    }
  }

  assert.deepEqual(
    violations,
    [],
    "Rename application-owned internals or document an exact API boundary in the allowlist"
  );
});

test("application-owned learning-platform comments stay US-English ASCII", () => {
  const violations = [];

  for (const { relativePath, source } of applicationSources()) {
    const { comments } = maskJavaScriptLiterals(source);
    for (const comment of comments) {
      const location = `${relativePath}:${lineNumber(source, comment.index)}`;
      if (/[^\x00-\x7F]/u.test(comment.text)) {
        violations.push(`${location} contains a non-ASCII application comment`);
      }
      const approved =
        compatibilityCommentLocations.has(location) ||
        approvedApplicationCommentRules.some(
          (rule) => rule.path === relativePath && rule.pattern.test(comment.text)
        );
      if (!approved) {
        violations.push(`${location} is not an approved US-English application comment`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    "Translate application comments; compatibility strings are intentionally outside this check"
  );
});
