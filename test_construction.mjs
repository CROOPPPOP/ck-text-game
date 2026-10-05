import { parseLLMResponse } from './src/lib/parser.ts';
import {
  parseTurnNumber, getMaxSlots, createQueueItem, turnsLeft, normalizeQueue,
  buildSystemCommands, applyTurnResult, sameBuildingName, summarizeQueue,
} from './src/lib/construction.ts';

let fail = 0;
const check = (name, cond) => { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + name); if (!cond) fail++; };

const base = (extra) => `
【 판정 결과 】
[최종 결과]: 성공
[긍정적 요인(핵심 및 보조 증거)]: 테스트
[부정적 요인(배제 증거)]: 없음

【 날짜 / 위치 】
1191년 12월 08일 / 로마냐 요새 [턴 수: 16]

【 현재 상황 】
나는 성에 입성했다.
[역사적 고증: 개연성 있음]

${extra}

【 일반 행동 선택지 】
1. [행정] 성벽 증축 지시
   └ 예상 성공 가능성: 60% ~ 80%
`;

console.log('--- 파서: 건설 가능 시설 ---');
const p1 = parseLLMResponse(base(`
【 영지 및 야영지 상태 】
[거점 형태]: 로마냐 백작령 주성
[거점 규모]: Lv.3 성채
▶ 대장간(Lv.1): 무기 정비

【 건설 가능 시설 】
(설명 줄은 무시되어야 함)
▶ [제분소] | 비용: 500 솔리디 | 3턴 | 효과: 곡물 가공으로 세수 증가
▶ [성벽 증축] | 비용: 1200 솔리디 | 8턴 | 효과: 방어력 강화
- 예배당 | 비용: 300 솔리디 | 2턴 | 효과: 신앙심 상승
▶ 없음
[건설 거부: 기사 훈련소 - 자금 부족]

【 현재 국면 및 야망 】
[현재 주요 국면]: 테스트
`));
check('옵션 3개 파싱', p1.buildOptions?.length === 3);
check('제분소 필드', p1.buildOptions?.[0].name === '제분소' && p1.buildOptions?.[0].cost === '500 솔리디' && p1.buildOptions?.[0].turns === 3 && p1.buildOptions?.[0].desc.includes('세수'));
check('턴 8 파싱', p1.buildOptions?.[1].turns === 8);
check('하이픈 불릿 허용', p1.buildOptions?.[2].name === '예배당' && p1.buildOptions?.[2].turns === 2);
check('건설 거부 파싱', JSON.stringify(p1.constructionRejected) === JSON.stringify(['기사 훈련소']));
check('영지 섹션 영향 없음', p1.estate?.buildings.length === 1);
check('국면 섹션 영향 없음', p1.objective?.ultimateGoal === '테스트');

const p2 = parseLLMResponse(base(`
【 건설 가능 시설 】
▶ 없음
`));
check('"없음"은 빈 배열(섹션 존재)', Array.isArray(p2.buildOptions) && p2.buildOptions.length === 0);
const p3 = parseLLMResponse(base(''));
check('섹션 생략 시 undefined (이전 값 유지용)', p3.buildOptions === undefined);
const p4 = parseLLMResponse(base(`
【 건설 가능 시설 】
▶ [대장간] | 비용: 100냥 | 99턴 | 효과: x
`));
check('소요 턴 상한 12', p4.buildOptions?.[0].turns === 12);

console.log('--- 턴/슬롯 ---');
check('턴 번호 파싱', parseTurnNumber('1191년 12월 08일 / 요새 [턴 수: 16]') === 16);
check('턴 번호 없음 -> null', parseTurnNumber('날짜만 있음') === null);
check('Lv.1 -> 2슬롯', getMaxSlots({ level: 'Lv.1 야영지' }) === 2);
check('Lv.2 -> 2슬롯', getMaxSlots({ level: 'Lv.2 장원' }) === 2);
check('Lv.3 -> 3슬롯', getMaxSlots({ level: 'Lv.3 성채' }) === 3);
check('Lv.5 -> 3슬롯', getMaxSlots({ level: 'Lv.5 대성' }) === 3);
check('거점 없음 -> 2슬롯', getMaxSlots(undefined) === 2);
check('규모 숫자 없음 -> 2슬롯', getMaxSlots({ level: '소규모 야영지' }) === 2);

console.log('--- 큐/시스템 명령 ---');
const T = 10;
const mill = createQueueItem({ name: '제분소', cost: '500 솔리디', turns: 3, desc: '' }, T);
const wall = createQueueItem({ name: '성벽 증축', cost: '1200 솔리디', turns: 8, desc: '' }, T);
check('완공 턴 = 시작+소요', mill.completeTurn === 13 && wall.completeTurn === 18);
check('초기 commandSent=false', mill.commandSent === false);

let q = [mill, wall];
let s1 = buildSystemCommands(q, T); // 10 -> 11
check('착수 명령 2개 포함', s1.startedIds.length === 2 && (s1.text.match(/건설 착수/g) || []).length === 2);
check('비용이 명령에 포함', s1.text.includes('500 솔리디') && s1.text.includes('1200 솔리디'));
check('아직 완공 아님', s1.completedIds.length === 0 && !s1.text.includes('건설 완공'));
q = applyTurnResult(q, s1);
check('착수 후 commandSent=true', q.every(x => x.commandSent));

let turn = 11;
let s2 = buildSystemCommands(q, turn); // 11 -> 12
check('재착수 명령 없음', s2.startedIds.length === 0 && !s2.text.includes('건설 착수'));
check('12턴엔 완공 없음', s2.completedIds.length === 0 && s2.text === '');
q = applyTurnResult(q, s2);

turn = 12;
let s3 = buildSystemCommands(q, turn); // 12 -> 13 : 제분소 완공
check('13턴에 제분소 완공 명령', s3.completedIds.length === 1 && s3.text.includes('건설 완공: 제분소'));
check('성벽은 계속 진행', !s3.text.includes('성벽 증축'));
q = applyTurnResult(q, s3);
check('완공 항목 큐에서 제거(1개 남음)', q.length === 1 && q[0].building === '성벽 증축');
check('남은 턴 계산', turnsLeft(q[0], 13) === 5 && turnsLeft(q[0], 99) === 0);

console.log('--- 1턴 건설 / 거부 / 취소 ---');
const quick = createQueueItem({ name: '야영지 설치', cost: '50', turns: 1, desc: '' }, 20);
let sq = buildSystemCommands([quick], 20);
check('1턴짜리는 착수+완공 동시', sq.startedIds.length === 1 && sq.completedIds.length === 1);
check('착수 줄이 완공 줄보다 먼저', sq.text.indexOf('건설 착수') < sq.text.indexOf('건설 완공'));

const r1 = createQueueItem({ name: '기사 훈련소(Lv.1)', cost: '9999', turns: 4, desc: '' }, 30);
const r2 = createQueueItem({ name: '대장간', cost: '100', turns: 2, desc: '' }, 30);
let sr = buildSystemCommands([r1, r2], 30);
const afterReject = applyTurnResult([r1, r2], sr, ['기사 훈련소']);
check('거부 시 해당 항목만 제거(레벨 표기 무시)', afterReject.length === 1 && afterReject[0].building === '대장간');
check('이름 비교: 괄호/공백 무시', sameBuildingName('기사 훈련소 (Lv.2)', '기사훈련소') && !sameBuildingName('대장간', '제분소'));

console.log('--- 저장 호환 ---');
const legacy = normalizeQueue([{ building: '서원', turnsLeft: 3 }], 40);
check('구형식 turnsLeft 변환', legacy.length === 1 && legacy[0].completeTurn === 43 && legacy[0].commandSent === true);
check('잘못된 데이터는 빈 배열', normalizeQueue(undefined, 1).length === 0 && normalizeQueue('x', 1).length === 0);
const roundtrip = normalizeQueue(JSON.parse(JSON.stringify([mill])), 99);
check('JSON 왕복 시 완공 턴 유지', roundtrip[0].completeTurn === 13 && roundtrip[0].id === mill.id);
const summ = summarizeQueue([mill], 11);
check('AI 전달용 요약(turnsLeft)', summ[0].building === '제분소' && summ[0].turnsLeft === 2);

console.log(fail === 0 ? '\n전체 통과' : `\n실패 ${fail}건`);
process.exit(fail ? 1 : 0);
