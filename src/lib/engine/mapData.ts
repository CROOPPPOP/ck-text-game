/**
 * 중세 서유럽 인터랙티브 프로빈스 맵 데이터 (1066년 성기 중세 유럽 기준)
 * - 20개 핵심 역사 프로빈스
 * - 국경 인접 그래프(Neighbors), 지형, 소유 군주, 징집병, 조세 수입, SVG 폴리곤 좌표
 */

export type TerrainType = '평야' | '구릉' | '산악' | '해안' | '산림' | '습지';

export interface Province {
  id: string;
  name: string;
  capital: string;
  rulerName: string;
  rulerTitle: string;
  realmName: string;
  culture: string;
  religion: string;
  terrain: TerrainType;
  development: number;       // 1 ~ 100
  garrison: number;          // 성채 방어력 (공성 소요치)
  maxLevies: number;         // 징집 가능 병력
  currentLevies: number;     // 현재 주둔/소집 병력
  monthlyIncome: number;     // 월간 조세 (금화)
  holdingLevel: number;      // 1 ~ 5
  isPlayerControlled: boolean;
  color: string;             // 영지 지도 채색
  borderColor: string;
  neighbors: string[];       // 인접 프로빈스 ID 목록
  // SVG 지도 렌더링 좌표 (viewBox: 0 0 1000 700 기준)
  center: { x: number; y: number };
  svgPath: string;
}

export const INITIAL_PROVINCES: Province[] = [
  // 1. 잉글랜드 남부 (웨식스·런던)
  {
    id: 'prov_wessex',
    name: '웨식스·런던',
    capital: '런던',
    rulerName: '해럴드 고드윈슨',
    rulerTitle: '잉글랜드 국왕',
    realmName: '잉글랜드 왕국',
    culture: '앵글로색슨',
    religion: '가톨릭',
    terrain: '평야',
    development: 22,
    garrison: 500,
    maxLevies: 500,
    currentLevies: 500,
    monthlyIncome: 8.5,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(185, 28, 28, 0.45)', // 붉은색
    borderColor: '#ef4444',
    neighbors: ['prov_yorkshire', 'prov_normandy'],
    center: { x: 260, y: 150 },
    svgPath: 'M 180 120 L 320 110 L 340 180 L 280 210 L 190 190 Z'
  },
  // 2. 잉글랜드 북부 (요크셔)
  {
    id: 'prov_yorkshire',
    name: '요크셔',
    capital: '요크',
    rulerName: '모카르',
    rulerTitle: '노섬브리아 백작',
    realmName: '잉글랜드 왕국',
    culture: '앵글로색슨',
    religion: '가톨릭',
    terrain: '구릉',
    development: 14,
    garrison: 300,
    maxLevies: 280,
    currentLevies: 280,
    monthlyIncome: 4.5,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(153, 27, 27, 0.4)',
    borderColor: '#dc2626',
    neighbors: ['prov_wessex'],
    center: { x: 250, y: 60 },
    svgPath: 'M 190 20 L 310 30 L 320 110 L 180 120 Z'
  },
  // 3. 노르망디 공국 (플레이어 기본 시작지 연동 가능)
  {
    id: 'prov_normandy',
    name: '노르망디',
    capital: '루앙',
    rulerName: '기욤 드 노르망디',
    rulerTitle: '노르망디 공작',
    realmName: '노르망디 공국',
    culture: '노르만',
    religion: '가톨릭',
    terrain: '해안',
    development: 20,
    garrison: 400,
    maxLevies: 380,
    currentLevies: 380,
    monthlyIncome: 7.0,
    holdingLevel: 3,
    isPlayerControlled: true, // 기본 플레이어 세력
    color: 'rgba(202, 138, 4, 0.55)', // 황금/호박색
    borderColor: '#fbbf24',
    neighbors: ['prov_wessex', 'prov_ile_de_france', 'prov_brittany', 'prov_flanders', 'prov_anjou'],
    center: { x: 290, y: 260 },
    svgPath: 'M 220 230 L 350 220 L 370 290 L 260 300 L 210 260 Z'
  },
  // 4. 일드프랑스 (파리 - 프랑스 왕령지)
  {
    id: 'prov_ile_de_france',
    name: '일드프랑스',
    capital: '파리',
    rulerName: '필리프 1세',
    rulerTitle: '프랑스 국왕',
    realmName: '프랑스 왕국',
    culture: '프랑스',
    religion: '가톨릭',
    terrain: '평야',
    development: 26,
    garrison: 450,
    maxLevies: 420,
    currentLevies: 420,
    monthlyIncome: 8.0,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(30, 58, 138, 0.55)', // 프랑스 청색
    borderColor: '#3b82f6',
    neighbors: ['prov_normandy', 'prov_flanders', 'prov_champagne', 'prov_anjou', 'prov_burgundy'],
    center: { x: 380, y: 310 },
    svgPath: 'M 350 250 L 440 260 L 430 360 L 340 350 L 350 290 Z'
  },
  // 5. 플랑드르 백국
  {
    id: 'prov_flanders',
    name: '플랑드르',
    capital: '겐트',
    rulerName: '보두앵 5세',
    rulerTitle: '플랑드르 백작',
    realmName: '플랑드르 백국',
    culture: '네덜란드',
    religion: '가톨릭',
    terrain: '습지',
    development: 28,
    garrison: 350,
    maxLevies: 310,
    currentLevies: 310,
    monthlyIncome: 9.8,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(234, 88, 12, 0.45)', // 오렌지색
    borderColor: '#fb923c',
    neighbors: ['prov_normandy', 'prov_ile_de_france', 'prov_champagne', 'prov_cologne'],
    center: { x: 420, y: 210 },
    svgPath: 'M 360 170 L 480 180 L 460 250 L 350 230 Z'
  },
  // 6. 샹파뉴 백국
  {
    id: 'prov_champagne',
    name: '샹파뉴',
    capital: '랭스',
    rulerName: '테오발트 3세',
    rulerTitle: '샹파뉴 백작',
    realmName: '샹파뉴 백국',
    culture: '프랑스',
    religion: '가톨릭',
    terrain: '구릉',
    development: 19,
    garrison: 320,
    maxLevies: 280,
    currentLevies: 280,
    monthlyIncome: 6.2,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(76, 29, 149, 0.45)', // 자주색
    borderColor: '#a855f7',
    neighbors: ['prov_ile_de_france', 'prov_flanders', 'prov_burgundy', 'prov_lorraine', 'prov_cologne'],
    center: { x: 490, y: 290 },
    svgPath: 'M 440 250 L 540 260 L 530 350 L 430 340 Z'
  },
  // 7. 브르타뉴 공국
  {
    id: 'prov_brittany',
    name: '브르타뉴',
    capital: '렌',
    rulerName: '코낭 2세',
    rulerTitle: '브르타뉴 공작',
    realmName: '브르타뉴 공국',
    culture: '브르타뉴',
    religion: '가톨릭',
    terrain: '해안',
    development: 15,
    garrison: 280,
    maxLevies: 220,
    currentLevies: 220,
    monthlyIncome: 4.2,
    holdingLevel: 2,
    isPlayerControlled: false,
    color: 'rgba(13, 148, 136, 0.45)', // 청록색
    borderColor: '#14b8a6',
    neighbors: ['prov_normandy', 'prov_anjou'],
    center: { x: 170, y: 310 },
    svgPath: 'M 90 280 L 220 270 L 230 370 L 110 380 Z'
  },
  // 8. 앙주 백국
  {
    id: 'prov_anjou',
    name: '앙주',
    capital: '앙제',
    rulerName: '조프루아 3세',
    rulerTitle: '앙주 백작',
    realmName: '앙주 백국',
    culture: '프랑스',
    religion: '가톨릭',
    terrain: '평야',
    development: 18,
    garrison: 300,
    maxLevies: 260,
    currentLevies: 260,
    monthlyIncome: 5.5,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(180, 83, 9, 0.45)',
    borderColor: '#f59e0b',
    neighbors: ['prov_normandy', 'prov_ile_de_france', 'prov_brittany', 'prov_aquitaine'],
    center: { x: 270, y: 380 },
    svgPath: 'M 220 330 L 330 320 L 330 430 L 210 420 Z'
  },
  // 9. 아키텐 공국
  {
    id: 'prov_aquitaine',
    name: '아키텐',
    capital: '보르도',
    rulerName: '기욤 8세',
    rulerTitle: '아키텐 공작',
    realmName: '아키텐 공국',
    culture: '옥시타니아',
    religion: '가톨릭',
    terrain: '평야',
    development: 24,
    garrison: 450,
    maxLevies: 460,
    currentLevies: 460,
    monthlyIncome: 8.2,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(147, 51, 234, 0.4)',
    borderColor: '#c084fc',
    neighbors: ['prov_anjou', 'prov_toulouse', 'prov_burgundy'],
    center: { x: 280, y: 510 },
    svgPath: 'M 200 440 L 360 430 L 370 580 L 190 570 Z'
  },
  // 10. 툴루즈 백국
  {
    id: 'prov_toulouse',
    name: '툴루즈',
    capital: '툴루즈',
    rulerName: '기욤 4세',
    rulerTitle: '툴루즈 백작',
    realmName: '툴루즈 백국',
    culture: '옥시타니아',
    religion: '가톨릭',
    terrain: '구릉',
    development: 20,
    garrison: 320,
    maxLevies: 270,
    currentLevies: 270,
    monthlyIncome: 5.9,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(217, 119, 6, 0.4)',
    borderColor: '#f59e0b',
    neighbors: ['prov_aquitaine', 'prov_provence'],
    center: { x: 380, y: 620 },
    svgPath: 'M 310 570 L 460 560 L 450 670 L 290 660 Z'
  },
  // 11. 부르고뉴 공국
  {
    id: 'prov_burgundy',
    name: '부르고뉴',
    capital: '디종',
    rulerName: '로베르 1세',
    rulerTitle: '부르고뉴 공작',
    realmName: '부르고뉴 공국',
    culture: '프랑스',
    religion: '가톨릭',
    terrain: '산림',
    development: 21,
    garrison: 340,
    maxLevies: 310,
    currentLevies: 310,
    monthlyIncome: 6.4,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(15, 118, 110, 0.45)',
    borderColor: '#2dd4bf',
    neighbors: ['prov_ile_de_france', 'prov_champagne', 'prov_aquitaine', 'prov_provence', 'prov_swabia'],
    center: { x: 470, y: 440 },
    svgPath: 'M 400 380 L 530 380 L 520 500 L 390 490 Z'
  },
  // 12. 프로방스 백국
  {
    id: 'prov_provence',
    name: '프로방스',
    capital: '마르세유',
    rulerName: '베르트랑 2세',
    rulerTitle: '프로방스 백작',
    realmName: '프로방스 백국',
    culture: '옥시타니아',
    religion: '가톨릭',
    terrain: '해안',
    development: 23,
    garrison: 330,
    maxLevies: 250,
    currentLevies: 250,
    monthlyIncome: 7.5,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(2, 132, 199, 0.45)',
    borderColor: '#38bdf8',
    neighbors: ['prov_burgundy', 'prov_toulouse', 'prov_lombardy'],
    center: { x: 520, y: 580 },
    svgPath: 'M 460 530 L 580 520 L 590 650 L 460 660 Z'
  },
  // 13. 쾰른 대주교령 (신성로마제국)
  {
    id: 'prov_cologne',
    name: '쾰른',
    capital: '쾰른',
    rulerName: '안노 2세',
    rulerTitle: '쾰른 대주교',
    realmName: '신성 로마 제국',
    culture: '독일',
    religion: '가톨릭',
    terrain: '평야',
    development: 25,
    garrison: 360,
    maxLevies: 270,
    currentLevies: 270,
    monthlyIncome: 7.2,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(71, 85, 105, 0.45)', // 제국 회색/슬레이트
    borderColor: '#94a3b8',
    neighbors: ['prov_flanders', 'prov_champagne', 'prov_lorraine', 'prov_saxony'],
    center: { x: 580, y: 190 },
    svgPath: 'M 510 140 L 630 150 L 620 250 L 500 240 Z'
  },
  // 14. 로렌 공국
  {
    id: 'prov_lorraine',
    name: '로렌',
    capital: '메츠',
    rulerName: '게르하르트',
    rulerTitle: '로렌 공작',
    realmName: '신성 로마 제국',
    culture: '독일',
    religion: '가톨릭',
    terrain: '구릉',
    development: 18,
    garrison: 300,
    maxLevies: 260,
    currentLevies: 260,
    monthlyIncome: 5.2,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(100, 116, 139, 0.4)',
    borderColor: '#cbd5e1',
    neighbors: ['prov_champagne', 'prov_cologne', 'prov_swabia'],
    center: { x: 590, y: 310 },
    svgPath: 'M 540 260 L 650 270 L 640 370 L 530 360 Z'
  },
  // 15. 슈바벤 공국
  {
    id: 'prov_swabia',
    name: '슈바벤',
    capital: '울름',
    rulerName: '루돌프 폰 라인펠덴',
    rulerTitle: '슈바벤 공작',
    realmName: '신성 로마 제국',
    culture: '독일',
    religion: '가톨릭',
    terrain: '산림',
    development: 22,
    garrison: 350,
    maxLevies: 320,
    currentLevies: 320,
    monthlyIncome: 6.0,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(120, 113, 108, 0.45)',
    borderColor: '#a8a29e',
    neighbors: ['prov_burgundy', 'prov_lorraine', 'prov_bavaria', 'prov_lombardy'],
    center: { x: 640, y: 430 },
    svgPath: 'M 570 380 L 700 370 L 690 490 L 560 480 Z'
  },
  // 16. 바이에른 공국
  {
    id: 'prov_bavaria',
    name: '바이에른',
    capital: '레겐스부르크',
    rulerName: '오토 폰 노르트하임',
    rulerTitle: '바이에른 공작',
    realmName: '신성 로마 제국',
    culture: '독일',
    religion: '가톨릭',
    terrain: '평야',
    development: 24,
    garrison: 400,
    maxLevies: 380,
    currentLevies: 380,
    monthlyIncome: 7.0,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(87, 83, 78, 0.5)',
    borderColor: '#d6d3d1',
    neighbors: ['prov_swabia', 'prov_saxony', 'prov_lombardy'],
    center: { x: 770, y: 400 },
    svgPath: 'M 700 330 L 840 320 L 830 470 L 690 480 Z'
  },
  // 17. 작센 공국
  {
    id: 'prov_saxony',
    name: '작센',
    capital: '마그데부르크',
    rulerName: '마그누스 빌룽',
    rulerTitle: '작센 공작',
    realmName: '신성 로마 제국',
    culture: '독일',
    religion: '가톨릭',
    terrain: '평야',
    development: 21,
    garrison: 380,
    maxLevies: 350,
    currentLevies: 350,
    monthlyIncome: 6.5,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(107, 114, 128, 0.45)',
    borderColor: '#e5e7eb',
    neighbors: ['prov_cologne', 'prov_bavaria'],
    center: { x: 740, y: 200 },
    svgPath: 'M 660 130 L 820 140 L 810 270 L 650 260 Z'
  },
  // 18. 롬바르디아 (밀라노 자치도시)
  {
    id: 'prov_lombardy',
    name: '롬바르디아',
    capital: '밀라노',
    rulerName: '밀라노 자치 의회',
    rulerTitle: '총독',
    realmName: '이탈리아 왕국',
    culture: '이탈리아',
    religion: '가톨릭',
    terrain: '평야',
    development: 32,
    garrison: 480,
    maxLevies: 400,
    currentLevies: 400,
    monthlyIncome: 11.5,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(16, 185, 129, 0.45)', // 에메랄드 상업도시
    borderColor: '#34d399',
    neighbors: ['prov_provence', 'prov_swabia', 'prov_bavaria', 'prov_tuscany'],
    center: { x: 670, y: 550 },
    svgPath: 'M 600 500 L 730 490 L 730 600 L 590 610 Z'
  },
  // 19. 토스카나 후국
  {
    id: 'prov_tuscany',
    name: '토스카나',
    capital: '피렌체',
    rulerName: '마틸다 디 카노사',
    rulerTitle: '토스카나 변경백',
    realmName: '토스카나 변경백국',
    culture: '이탈리아',
    religion: '가톨릭',
    terrain: '구릉',
    development: 26,
    garrison: 380,
    maxLevies: 330,
    currentLevies: 330,
    monthlyIncome: 8.0,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(5, 150, 105, 0.4)',
    borderColor: '#10b981',
    neighbors: ['prov_lombardy', 'prov_rome'],
    center: { x: 750, y: 620 },
    svgPath: 'M 690 580 L 800 570 L 800 660 L 680 670 Z'
  },
  // 20. 로마 교황령 (바티칸 성좌)
  {
    id: 'prov_rome',
    name: '로마 교황령',
    capital: '로마',
    rulerName: '알렉산데르 2세',
    rulerTitle: '로마 교황',
    realmName: '성좌 (교황령)',
    culture: '이탈리아',
    religion: '가톨릭',
    terrain: '구릉',
    development: 35,
    garrison: 500,
    maxLevies: 300,
    currentLevies: 300,
    monthlyIncome: 14.0,
    holdingLevel: 5,
    isPlayerControlled: false,
    color: 'rgba(245, 158, 11, 0.45)', // 교황 성좌 황금색
    borderColor: '#f59e0b',
    neighbors: ['prov_tuscany'],
    center: { x: 840, y: 640 },
    svgPath: 'M 790 610 L 900 600 L 890 680 L 780 690 Z'
  }
];

/** 프로빈스 ID로 조회 */
export function getProvinceById(provinces: Province[], id: string): Province | undefined {
  return provinces.find(p => p.id === id);
}

/** 인접 프로빈스인지 여부 확인 */
export function areProvincesAdjacent(p1: Province, p2: Province): boolean {
  return p1.neighbors.includes(p2.id);
}
