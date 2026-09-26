import assert from 'node:assert/strict';
import test from 'node:test';
import { ageBand, ageOnDate } from './age.ts';

test('registration boundary uses the birthday in Japan', () => {
  assert.equal(ageOnDate('2013-09-27', '2026-09-26'), 12);
  assert.equal(ageOnDate('2013-09-26', '2026-09-26'), 13);
  assert.equal(ageBand(12), null);
  assert.equal(ageBand(13), '13-15');
  assert.equal(ageBand(16), '16-17');
  assert.equal(ageBand(18), '18+');
});

test('invalid or future dates are rejected', () => {
  assert.equal(ageOnDate('2012-02-30', '2026-09-26'), null);
  assert.equal(ageOnDate('2027-01-01', '2026-09-26'), null);
});
