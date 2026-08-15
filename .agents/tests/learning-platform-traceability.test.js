"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repositoryRoot = path.join(__dirname, "..", "..");
const contractPath = path.join(repositoryRoot, "docs", "learning-platform-contracts.md");
const contractSource = fs.readFileSync(contractPath, "utf8");

function learningPlatformTestPaths() {
  return fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith("learning-platform-") &&
        entry.name.endsWith(".test.js")
    )
    .map((entry) => path.join(__dirname, entry.name));
}

function learningPlatformSupportPaths() {
  const supportRoots = ["helpers", "fixtures"].map((directory) =>
    path.join(__dirname, directory)
  );

  function descend(directory) {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return descend(entryPath);
      return entry.isFile() ? [entryPath] : [];
    });
  }

  return supportRoots.flatMap(descend);
}

function acceptanceIds() {
  const matrixStart = contractSource.indexOf("## Behavior-baseline acceptance matrix");
  const matrixEnd = contractSource.indexOf("## Safe synthetic-dependency strategy");
  assert.notEqual(matrixStart, -1, "The behavior-baseline matrix must remain present");
  assert.ok(matrixEnd > matrixStart, "The behavior-baseline matrix must remain bounded");

  return Array.from(
    contractSource.slice(matrixStart, matrixEnd).matchAll(/^\| ([A-Z]+-\d{2}) \|/gm),
    ([, id]) => id
  );
}

function namedTestTitles() {
  return learningPlatformTestPaths().flatMap((testPath) => {
    const source = fs.readFileSync(testPath, "utf8");
    return Array.from(
      source.matchAll(/\btest\(\s*(["'])([^"'\r\n]+)\1/g),
      ([, , title]) => title
    );
  });
}

function sensitiveSourceLiterals() {
  const studySource = fs.readFileSync(
    path.join(repositoryRoot, "apps", "learning-platform", "estudo", "main.js"),
    "utf8"
  );
  const bypassCondition = studySource.match(
    /function isDrmEnabled\(fullName\) \{[\s\S]*?if \(([\s\S]*?)\) \{ drmEnabled = false \} else \{ drmEnabled = true \};[\s\S]*?\}/
  );
  assert.ok(bypassCondition, "The five-person bypass branch must remain discoverable");
  const participantNames = Array.from(
    bypassCondition[1].matchAll(/fullName === '([^']+)'/g),
    ([, value]) => value
  );
  assert.equal(participantNames.length, 5, "The bypass branch must retain five entries");

  const playReadyConfiguration = studySource.match(
    /servers:\s*\{\s*'com\.microsoft\.playready':\s*'([^']+)'\s*\}/
  );
  assert.ok(playReadyConfiguration, "The PlayReady configuration must remain discoverable");

  return [...participantNames, playReadyConfiguration[1]];
}

test("[TRACEABILITY] every behavior-baseline acceptance ID has a named test", () => {
  const ids = acceptanceIds();
  const testTitles = namedTestTitles();

  assert.equal(ids.length, 29, "The acceptance matrix must retain all 29 stable IDs");
  for (const id of ids) {
    assert.ok(
      testTitles.some((title) => title.startsWith(`[${id}]`)),
      `Missing named learning-platform test coverage for ${id}`
    );
  }
});

test("[SAFETY-REDACTION] tests and traceability prose contain no sensitive source literals", () => {
  const auditablePaths = [
    ...learningPlatformTestPaths(),
    ...learningPlatformSupportPaths(),
    contractPath
  ];
  const auditableSource = auditablePaths
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
    .join("\n");

  for (const sensitiveLiteral of sensitiveSourceLiterals()) {
    assert.equal(
      auditableSource.includes(sensitiveLiteral),
      false,
      "A sensitive source-derived literal was copied into the behavior baseline"
    );
  }
});

test("[SAFETY-REDACTION] learning-platform tests and helpers contain no complete network URL literals", () => {
  const testSources = [
    ...learningPlatformTestPaths(),
    ...learningPlatformSupportPaths()
  ]
    .map((testPath) => fs.readFileSync(testPath, "utf8"))
    .join("\n");

  const completeUrlLiteralCount =
    (testSources.match(/(?:https?|wss?):\/\/[^\s'"`]+/g) ?? []).length;
  assert.equal(
    completeUrlLiteralCount,
    0,
    "A complete URL literal was copied into behavior-baseline test code"
  );
});
