const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repositoryRoot = resolve(__dirname, '..', '..');
const roadmapPath = resolve(repositoryRoot, 'docs', 'project-roadmap.html');
const roadmapHtml = readFileSync(roadmapPath, 'utf8');

function extractRoadmapData() {
  const match = roadmapHtml.match(
    /<script type="application\/json" id="roadmap-data">([\s\S]*?)<\/script>/,
  );
  assert.ok(match, 'roadmap-data JSON script must exist');
  return JSON.parse(match[1]);
}

test('project roadmap is self-contained and its renderer parses', () => {
  assert.doesNotMatch(roadmapHtml, /<script\s+[^>]*src=/i);
  assert.doesNotMatch(roadmapHtml, /<link\s+[^>]*rel=["']stylesheet/i);
  assert.doesNotMatch(roadmapHtml, /https?:\/\//i);

  const rendererMatch = roadmapHtml.match(
    /<script>\s*([\s\S]*?)<\/script>\s*<\/body>/,
  );
  assert.ok(rendererMatch, 'inline roadmap renderer must exist');
  assert.doesNotThrow(() => new vm.Script(rendererMatch[1]));
});

test('project roadmap data has one valid card contract for every concern', () => {
  const roadmap = extractRoadmapData();
  const statusIds = new Set(roadmap.statuses.map(({ id }) => id));
  const topicIds = new Set();
  const cardIds = new Set();
  const cards = [];

  assert.equal(roadmap.handoffReference, 'docs/project-roadmap.html');
  assert.equal(roadmap.topics.length, 22);
  assert.deepEqual(
    [...statusIds],
    ['complete', 'next', 'decision', 'queued', 'conditional', 'ongoing'],
  );

  roadmap.topics.forEach((topic, index) => {
    assert.match(topic.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!topicIds.has(topic.id), `duplicate topic id: ${topic.id}`);
    topicIds.add(topic.id);
    assert.ok(topic.title.startsWith(String(index + 1).padStart(2, '0')));
    assert.ok(topic.cards.length > 0, `${topic.id} must contain cards`);

    topic.cards.forEach((card) => {
      assert.match(card.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(!cardIds.has(card.id), `duplicate card id: ${card.id}`);
      cardIds.add(card.id);
      assert.ok(statusIds.has(card.status), `${card.id} has unknown status`);
      assert.ok(card.title.trim().length > 0, `${card.id} needs a headline`);
      assert.ok(
        card.topics.length >= 3 && card.topics.length <= 5,
        `${card.id} must list three to five topics`,
      );
      card.topics.forEach((topicText) => {
        assert.ok(topicText.trim().length > 0, `${card.id} has an empty topic`);
      });
      assert.ok(card.why.trim().length > 0, `${card.id} needs a rationale`);
      cards.push(card);
    });
  });

  assert.equal(cards.length, 88);
  assert.deepEqual(
    cards.filter(({ status }) => status === 'next').map(({ id }) => id),
    ['replace-markup-pr'],
  );
  assert.deepEqual(
    cards.filter(({ status }) => status === 'ongoing').map(({ id }) => id),
    ['operate-recurring-maintenance'],
  );

  const requiredConcerns = [
    'centralize-backend-origin',
    'replace-markup-pr',
    'align-client-intake-api-route',
    'classify-api-exposure',
    'define-input-boundaries',
    'add-abuse-controls',
    'enforce-safe-output',
    'establish-http-security',
    'define-account-security',
    'migrate-account-credentials',
    'define-personal-data-lifecycle',
    'implement-revocable-sessions',
    'retire-numbered-aliases',
    'retire-excel-writes',
    'implement-report-authority',
    'complete-credential-hygiene',
    'close-roadmap-milestone',
  ];
  requiredConcerns.forEach((id) => {
    assert.ok(cardIds.has(id), `missing major roadmap concern: ${id}`);
  });

  const cardsById = new Map(cards.map((card) => [card.id, card]));
  assert.equal(cardsById.get('publish-program-contracts').status, 'complete');
  assert.equal(cardsById.get('centralize-backend-origin').status, 'complete');
  assert.equal(cardsById.get('replace-markup-pr').status, 'next');
  assert.equal(cardsById.get('align-client-intake-api-route').status, 'queued');
});

test('card renderer preserves headline, topics, then rationale order', () => {
  const headlinePosition = roadmapHtml.indexOf('item.append(heading);');
  const topicsPosition = roadmapHtml.indexOf('item.append(topicsSection);');
  const whyPosition = roadmapHtml.indexOf('item.append(whySection);');

  assert.ok(headlinePosition >= 0);
  assert.ok(topicsPosition > headlinePosition);
  assert.ok(whyPosition > topicsPosition);
  assert.match(roadmapHtml, /Card color key/);
  assert.match(roadmapHtml, /Show overview only/);
  assert.match(roadmapHtml, /How to update and reference this roadmap/);
});
