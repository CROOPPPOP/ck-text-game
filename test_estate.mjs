import { parseLLMResponse } from './src/lib/parser.ts';

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

【 개인 정보 】
이름: 안드레아 | 나이: 26세 | 성별: 남성 | 신분: 영주 | 직위: 백작 | 종교: 가톨릭 | 칭호: 해방자

【 소지품 / 자원 】
▶ <장비 및 영지>:
○ [로마냐 요새] 튼튼한 성벽
▶ <재산 및 병력>:
○ 은화 1000닢

${extra}

【 일반 행동 선택지 】
1. [행정] 성벽 증축 지시
   └ 예상 성공 가능성: 60% ~ 80%
`;

let fail = 0;
const check = (name, cond) => { console.log((cond ? 'PASS' : 'FAIL') + ' - ' + name); if (!cond) fail++; };

// 1. 영지 있음 + 신규 국면 라벨
const r1 = parseLLMResponse(base(`
【 영지 및 야영지 상태 】
[거점 형태]: 로마냐 백작령 주성
[거점 규모]: Lv.3 성채
▶ 대장간(Lv.1): 무기 정비 가능
▶ 곡물창고(Lv.2): 식량 비축

【 현재 국면 및 야망 】
[현재 주요 국면]: 겨울나기 식량 확보
[단기 야망]: 대장간 확장
[진행 상태]: 순조로움
[상황 요약]: 식량이 부족하다
`));
check('estate 파싱', r1.estate && r1.estate.type === '로마냐 백작령 주성');
check('estate 규모', r1.estate?.level === 'Lv.3 성채');
check('estate 건물 2개', r1.estate?.buildings.length === 2);
check('건물 이름/설명 분리', r1.estate?.buildings[0].name === '대장간(Lv.1)' && r1.estate?.buildings[0].desc.includes('무기'));
check('주요 국면', r1.objective?.ultimateGoal === '겨울나기 식량 확보');
check('단기 야망', r1.objective?.currentGoal === '대장간 확장');
check('진행도 필드 비어있음', !r1.objective?.totalProgress && !r1.objective?.currentProgress);

// 2. 거점 없음 -> estate undefined
const r2 = parseLLMResponse(base(`
【 영지 및 야영지 상태 】
[거점 형태]: 거점 없음
`));
check('거점 없음 -> estate 제거', r2.estate === undefined);

// 3. 섹션 생략
const r3 = parseLLMResponse(base(''));
check('영지 섹션 생략 -> estate undefined', r3.estate === undefined);

// 4. 구 포맷 호환
const r4 = parseLLMResponse(base(`
【 목표 현황 】
[궁극적 목표]: 로마 재건
[현재 단기 목표]: 방어선 구축
[요약]: 시작
`));
check('구 포맷 호환', r4.objective?.ultimateGoal === '로마 재건' && r4.objective?.currentGoal === '방어선 구축');

console.log(fail === 0 ? '\n전체 통과' : `\n실패 ${fail}건`);
process.exit(fail ? 1 : 0);
