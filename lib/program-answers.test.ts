import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerLabel,
  programByKey,
  programBySlug,
  readableAnswers,
} from './program-config.ts';

const hamilton = programBySlug('hamilton')!;
const simcoe = programBySlug('simcoe')!;

test('programByKey resolves the program a lead was captured under', () => {
  assert.equal(programByKey(hamilton.key)?.slug, 'hamilton');
  assert.equal(programByKey(simcoe.key)?.slug, 'simcoe');
  assert.equal(programByKey('no-such-program'), null);
  assert.equal(programByKey(null), null);
  assert.equal(programByKey(''), null);
});

// ─── answerLabel ──────────────────────────────────────────────────────────────

test('a stored value renders as the words the homeowner saw', () => {
  const label = answerLabel(hamilton, 'projectType', 'garden_suite');
  assert.notEqual(label, 'garden_suite');
  assert.ok(label.length > 0);
});

test('prep questions resolve too — the old local helper missed these', () => {
  // basementStatus/separateEntrance/permitStatus live in prepQuestions, which
  // the booking branch's version never searched, so they rendered blank.
  const label = answerLabel(hamilton, 'basementStatus', 'unfinished');
  assert.notEqual(label, '', 'prep question resolved to empty');
  assert.notEqual(label, 'unfinished', 'prep question fell through to the raw value');
});

test('an unrecognised value falls back to itself, never to empty', () => {
  assert.equal(answerLabel(hamilton, 'projectType', 'from_an_older_version'), 'from_an_older_version');
  assert.equal(answerLabel(hamilton, 'noSuchQuestion', 'whatever'), 'whatever');
});

test('a blank answer stays blank — "not answered" is the caller\'s wording', () => {
  assert.equal(answerLabel(hamilton, 'projectType', ''), '');
  assert.equal(answerLabel(hamilton, 'projectType', null), '');
  assert.equal(answerLabel(hamilton, 'projectType', undefined), '');
});

test('a null program returns the raw value rather than throwing', () => {
  assert.equal(answerLabel(null, 'projectType', 'garden_suite'), 'garden_suite');
  assert.equal(answerLabel(null, 'projectType', ''), '');
});

// ─── readableAnswers ──────────────────────────────────────────────────────────

test('answers come back in the program question order', () => {
  const rows = readableAnswers(hamilton, {
    contribution: 'need_financing',
    ownership: 'yes',
    projectType: 'garden_suite',
    timeline: 'asap',
  });
  assert.deepEqual(
    rows.map((r) => r.key),
    ['ownership', 'projectType', 'timeline', 'contribution']
  );
  for (const row of rows) {
    assert.ok(row.questionLabel.length > 0);
    assert.ok(row.valueLabel.length > 0);
  }
});

test('question sets differ by program — Simcoe has no contribution question', () => {
  assert.ok(hamilton.questions.some((q) => q.key === 'contribution'));
  assert.ok(!simcoe.questions.some((q) => q.key === 'contribution'));

  // A Simcoe lead carrying a stray contribution key still shows it, appended
  // rather than silently dropped.
  const rows = readableAnswers(simcoe, { ownership: 'yes', contribution: 'cash_equity' });
  assert.deepEqual(rows.map((r) => r.key).sort(), ['contribution', 'ownership']);
});

test('a blank stored answer is reported, not dropped', () => {
  // The submit branch writes every key even when unanswered, so '' is normal —
  // and "not answered" is a different fact from "not asked".
  const rows = readableAnswers(hamilton, { ownership: 'yes', projectType: '' });
  const projectType = rows.find((r) => r.key === 'projectType');
  assert.ok(projectType, 'blank answer was dropped');
  assert.equal(projectType.value, '');
  assert.equal(projectType.valueLabel, '');
});

test('keys the program no longer asks are kept, labelled by their key', () => {
  const rows = readableAnswers(hamilton, { retiredQuestion: 'some_value' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].key, 'retiredQuestion');
  assert.equal(rows[0].questionLabel, 'retiredQuestion');
  assert.equal(rows[0].valueLabel, 'some_value');
});

test('a question the lead never answered is absent, not blank-filled', () => {
  const rows = readableAnswers(hamilton, { ownership: 'yes' });
  assert.deepEqual(rows.map((r) => r.key), ['ownership']);
});

test('null and empty answer blobs are safe', () => {
  assert.deepEqual(readableAnswers(hamilton, null), []);
  assert.deepEqual(readableAnswers(hamilton, undefined), []);
  assert.deepEqual(readableAnswers(hamilton, {}), []);
  assert.deepEqual(readableAnswers(null, null), []);
});

test('a lead from an unconfigured program still renders its raw answers', () => {
  const rows = readableAnswers(programByKey('deleted-program'), { ownership: 'yes' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].valueLabel, 'yes');
});
