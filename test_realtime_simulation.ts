import { parseDateLocation, formatDateLocation, formatCleanDate, advanceGameTime } from './src/lib/engine/timeEngine';
import { createQueueItem, tickConstructionQueue, formatConstructionTimeLeft, applyCompletedBuildingToEstate } from './src/lib/construction';
import { HISTORICAL_TIMELINE_EVENTS } from './src/lib/engine/events/historicalTimelineEvents';
import { rollMonthlyEvent } from './src/lib/engine/events/eventRegistry';

let failed = 0;
function assert(name: string, condition: boolean, extra?: any) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
  } else {
    console.error(`❌ FAIL: ${name}`, extra || '');
    failed++;
  }
}

console.log('=== [1] Time Engine Real-Time Tests ===');
const parsed = parseDateLocation('1066년 10월 14일 (가을) / 노르망디 루앙 성채 [턴 수: 1]');
assert('Parse initial date year 1066', parsed.date.year === 1066);
assert('Parse initial date month 10', parsed.date.month === 10);
assert('Parse initial date day 14', parsed.date.day === 14);
assert('Parse initial season 가을', parsed.date.season === '가을');

// Advance 2 seconds at 1x -> 1 day
const t1 = advanceGameTime(parsed.date, 2, 1, 0);
assert('2 seconds at 1x advances 1 day', t1.daysAdvanced === 1 && t1.newDate.day === 15);

// Advance 32 seconds at 1x from day 15 -> 16 days -> total 31 -> month rolls over!
const t2 = advanceGameTime(t1.newDate, 32, 1, 0);
assert('Month roll over triggered', t2.monthTicked === true);
assert('Month advanced to 11', t2.newDate.month === 11);

// Advance 60 seconds at 2x -> 120 effective seconds -> 60 days -> 2 months
const t3 = advanceGameTime(t2.newDate, 60, 2, 0);
assert('Speed 2x advances 2 months', t3.monthsAdvanced === 2);

console.log('=== [2] Real-time Construction Tests ===');
const testOption = {
  name: '석조 방벽 증축',
  cost: '금화 50',
  turns: 2, // 2 months
  desc: '영지 방어력 증대'
};
const qItem = createQueueItem(testOption, 1);
assert('Duration months is 2', qItem.durationMonths === 2);
assert('Total duration is 120s', qItem.totalDurationSeconds === 120);
assert('Initial elapsed is 0', qItem.elapsedSeconds === 0);

// Tick 60 seconds (1 month equivalent)
const tick1 = tickConstructionQueue([qItem], 60);
assert('Queue still has 1 item after 60s', tick1.updatedQueue.length === 1);
assert('Progress is 50%', tick1.updatedQueue[0].progressPercent === 50);
assert('Time left text shows 1달', formatConstructionTimeLeft(tick1.updatedQueue[0]).includes('1달'));

// Tick another 60 seconds -> complete!
const tick2 = tickConstructionQueue(tick1.updatedQueue, 60);
assert('Queue is empty after completion', tick2.updatedQueue.length === 0);
assert('1 completed item returned', tick2.completedItems.length === 1);
assert('Completed item is 석조 방벽 증축', tick2.completedItems[0].building === '석조 방벽 증축');

// Apply to estate
const initialEstate = {
  level: 'Lv.2 남작 장원',
  buildings: [{ name: '본관', level: 1 }]
};
const nextEstate = applyCompletedBuildingToEstate(initialEstate, tick2.completedItems[0]);
assert('Building added to estate', nextEstate.buildings.some((b: any) => b.name === '석조 방벽 증축'));

console.log('=== [3] Historical Events 13 Key Events Tests ===');
assert('Historical events count is exactly 13', HISTORICAL_TIMELINE_EVENTS.length === 13);
const expectedYears = [1066, 1077, 1095, 1122, 1152, 1189, 1204, 1215, 1241, 1302, 1337, 1347, 1453];
expectedYears.forEach(y => {
  const found = HISTORICAL_TIMELINE_EVENTS.find(e => e.id.includes(String(y)));
  assert(`Event for year ${y} exists`, !!found);
});

// Test event roll on year 1066
const mockState1066: any = { dateLocation: '1066년 10월 14일 / 노르망디' };
const rolled1066 = rollMonthlyEvent(mockState1066, 1, new Set());
assert('1066 Hastings triggered', rolled1066?.id === 'hist_hastings_1066');

// If 1066 Hastings already seen, returns another or null
const rolledAgain = rollMonthlyEvent(mockState1066, 1, new Set(['hist_hastings_1066']));
assert('1066 not triggered twice if seen', rolledAgain?.id !== 'hist_hastings_1066');

console.log('=== Test Summary ===');
if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED! Real-time time engine and construction system working seamlessly.');
} else {
  console.error(`💥 ${failed} tests failed.`);
  process.exit(1);
}
