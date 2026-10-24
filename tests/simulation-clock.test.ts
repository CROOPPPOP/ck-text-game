import assert from 'node:assert/strict';
import test from 'node:test';
import { applyActionClock } from '../src/lib/engine/simulationClock';
import { advanceGameTime, parseDateLocation } from '../src/lib/engine/timeEngine';
import { ParsedState } from '../src/lib/parser';

const state = (overrides: Partial<ParsedState> = {}): ParsedState => ({
  dateLocation: '1066년 10월 14일 (가을) / 노르망디 루앙 성채 [턴 수: 7]',
  personalInfo: { '나이': '24세' },
  ...overrides
});

test('an action updates its counter without advancing date or age', () => {
  const current = state();
  const aiCandidate = state({
    dateLocation: '1070년 04월 01일 (봄) / 다른 장소 [턴 수: 8]',
    personalInfo: { '나이': '90세', '칭호': '공작' }
  });

  const next = applyActionClock(current, aiCandidate, 8);
  const parsed = parseDateLocation(next.dateLocation);
  assert.deepEqual(parsed.date, { year: 1066, month: 10, day: 14, season: '가을' });
  assert.equal(parsed.location, '노르망디 루앙 성채');
  assert.equal(parsed.turn, 8);
  assert.equal(next.personalInfo?.['나이'], '24세');
  assert.equal(next.personalInfo?.['칭호'], '공작');
});

test('only the real-time clock advances calendar months and years', () => {
  const start = parseDateLocation('1066년 12월 30일 (겨울) / 루앙 성채').date;
  const month = advanceGameTime(start, 2, 1, 0);
  assert.equal(month.monthsAdvanced, 1);
  assert.deepEqual(month.newDate, { year: 1067, month: 1, day: 1, season: '겨울' });
  assert.equal(month.yearsAdvanced, 1);
});
