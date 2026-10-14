import { Province } from '../mapData';
import { convertAzgaarProvinceToCK, AzgaarRawProvinceInput } from '../azgaarConverter';

/**
 * Azgaar's Fantasy Map Generator 규격으로 설계된 '에테리아 대륙(Realm of Aetheria)' 판타지 세계관 맵 프리셋
 * - viewBox: "0 0 1200 800"
 * - 10대 판타지 프로빈스 및 왕국/공국/요새
 * - 인접 국경 그래프 완비 (군사 이동 및 공성전 즉시 지원)
 */
export const AZGAAR_FANTASY_RAW_PROVINCES: AzgaarRawProvinceInput[] = [
  // 1. 발렌시아 왕국 수도 (중부 비옥한 평야)
  {
    id: 'prov_valencia',
    name: '발렌시아 왕국령',
    capitalName: '태양의 성채 (솔라리스)',
    stateName: '발렌시아 성왕국',
    rulerName: '알렉산더 4세 국왕',
    rulerTitle: '국왕',
    culture: '하이 발렌시안',
    religion: '가톨릭',
    biome: 'Grassland',
    population: 4500,
    military: 1200,
    color: '#6366f1',
    center: { x: 550, y: 380 },
    neighbors: ['prov_eldoria', 'prov_silverport', 'prov_drakenhold', 'prov_astral', 'prov_northfell', 'prov_sunspear'],
    svgPath: 'M 480 320 L 620 310 L 650 390 L 610 460 L 510 450 L 460 380 Z'
  },

  // 2. 엘도리아 대수림 (동부 신비의 산림)
  {
    id: 'prov_eldoria',
    name: '엘도리아 은빛 숲',
    capitalName: '세계수의 회당',
    stateName: '엘도리아 요정 자치령',
    rulerName: '엘레니아 대여공',
    rulerTitle: '대공작',
    culture: '실반 엘프',
    religion: '정령',
    biome: 'Temperate Deciduous Forest',
    population: 3200,
    military: 850,
    color: '#10b981',
    center: { x: 730, y: 330 },
    neighbors: ['prov_valencia', 'prov_drakenhold', 'prov_astral', 'prov_mistsea'],
    svgPath: 'M 620 310 L 760 270 L 830 340 L 770 420 L 650 390 Z'
  },

  // 3. 드라켄홀드 흑철 산맥 (북동부 난공불락의 드워프 요새)
  {
    id: 'prov_drakenhold',
    name: '드라켄홀드 요새봉',
    capitalName: '카라크 앙코르 (철의 전당)',
    stateName: '드라켄홀드 광산 연합',
    rulerName: '토르그림 철망치 영주',
    rulerTitle: '영주',
    culture: '마운틴 드워프',
    religion: '정교회',
    biome: 'Mountain',
    population: 2800,
    military: 950,
    color: '#71717a',
    center: { x: 740, y: 200 },
    neighbors: ['prov_eldoria', 'prov_valencia', 'prov_northfell'],
    svgPath: 'M 640 160 L 780 140 L 840 220 L 760 270 L 620 310 L 610 210 Z'
  },

  // 4. 노스펠 서리벌판 (북서부 바이킹 야를령)
  {
    id: 'prov_northfell',
    name: '노스펠 서리고원',
    capitalName: '야를의 롱홀 (윈터할)',
    stateName: '노스펠 부족 연맹',
    rulerName: '라그나르 야를',
    rulerTitle: '야를(공작)',
    culture: '노르드 판타지',
    religion: '텡그리',
    biome: 'Tundra',
    population: 1800,
    military: 700,
    color: '#0284c7',
    center: { x: 450, y: 180 },
    neighbors: ['prov_drakenhold', 'prov_valencia', 'prov_silverport'],
    svgPath: 'M 360 140 L 520 120 L 640 160 L 610 210 L 480 320 L 380 250 Z'
  },

  // 5. 실버포트 무역해협 (서부 해안 무역 도시공화국)
  {
    id: 'prov_silverport',
    name: '실버포트 자유시',
    capitalName: '황금 닻 총독관저',
    stateName: '실버포트 해상 상인공화국',
    rulerName: '도제 마테오 카르발료',
    rulerTitle: '도제(총독)',
    culture: '지중해 상인계',
    religion: '가톨릭',
    biome: 'Marine',
    population: 5200,
    military: 1100,
    color: '#06b6d4',
    center: { x: 370, y: 380 },
    neighbors: ['prov_northfell', 'prov_valencia', 'prov_sunspear'],
    svgPath: 'M 380 250 L 480 320 L 460 380 L 440 470 L 310 440 L 290 320 Z'
  },

  // 6. 아스트랄 성기사단령 (남동부 신성 교황령)
  {
    id: 'prov_astral',
    name: '아스트랄 대성전',
    capitalName: '빛의 대성당',
    stateName: '태양 성기사 수도회',
    rulerName: '이노센트 3세 교황 성하',
    rulerTitle: '교황령 총사령관',
    culture: '신성 로마 기사',
    religion: '가톨릭',
    biome: 'Grassland',
    population: 3600,
    military: 1300,
    color: '#f59e0b',
    center: { x: 670, y: 530 },
    neighbors: ['prov_valencia', 'prov_eldoria', 'prov_sunspear', 'prov_mistsea', 'prov_duskswamp'],
    svgPath: 'M 610 460 L 770 420 L 820 520 L 720 610 L 590 570 Z'
  },

  // 7. 선스피어 황금사막 (남서부 오아시스 술탄국)
  {
    id: 'prov_sunspear',
    name: '선스피어 술탄령',
    capitalName: '비단 오아시스',
    stateName: '칼리프 알-만수르 술탄국',
    rulerName: '타리크 이븐 지야드 술탄',
    rulerTitle: '술탄',
    culture: '사막 유목민',
    religion: '이슬람(수니)',
    biome: 'Hot Desert',
    population: 4100,
    military: 1250,
    color: '#d97706',
    center: { x: 450, y: 550 },
    neighbors: ['prov_silverport', 'prov_valencia', 'prov_astral', 'prov_duskswamp'],
    svgPath: 'M 440 470 L 510 450 L 610 460 L 590 570 L 480 640 L 390 570 Z'
  },

  // 8. 더스크스웜프 안개습지 (최남단 주술사 거점)
  {
    id: 'prov_duskswamp',
    name: '더스크스웜프 늪지',
    capitalName: '검은 안개 탑',
    stateName: '망자의 늪 마법사 의회',
    rulerName: '모르가나 대마녀',
    rulerTitle: '마녀 영주',
    culture: '늪지 이민족',
    religion: '정령',
    biome: 'Wetland',
    population: 1500,
    military: 600,
    color: '#8b5cf6',
    center: { x: 530, y: 680 },
    neighbors: ['prov_sunspear', 'prov_astral'],
    svgPath: 'M 480 640 L 590 570 L 720 610 L 670 720 L 500 730 Z'
  },

  // 9. 미스트헤이븐 군도 (동남단 해양 해적/상인 도서)
  {
    id: 'prov_mistsea',
    name: '미스트헤이븐 해적만',
    capitalName: '검은 돛 보루',
    stateName: '바다 도적 형제단',
    rulerName: '에드워드 선장',
    rulerTitle: '선장령 제독',
    culture: '해양 코르세어',
    religion: '텡그리',
    biome: 'Marine',
    population: 2200,
    military: 800,
    color: '#0d9488',
    center: { x: 900, y: 480 },
    neighbors: ['prov_eldoria', 'prov_astral'],
    svgPath: 'M 830 340 L 970 320 L 1020 450 L 930 550 L 820 520 L 770 420 Z'
  }
];

export const FANTASY_PROVINCES: Province[] = AZGAAR_FANTASY_RAW_PROVINCES.map((raw, idx) => 
  convertAzgaarProvinceToCK(raw, idx)
);
