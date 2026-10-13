/**
 * 표준 세계지도(유라시아-지중해 중세 세계) 인터랙티브 프로빈스 및 지형 맵 데이터
 * - 1066년 성기 중세 유럽, 지중해, 비잔티움, 레반트 성지, 북아프리카
 * - 표준 투영(Mercator-Eurasia) 실제 지리 좌표계 (viewBox: 0 0 1200 800)
 * - 정치 / 지형 / 종교 / 개발도 4대 지도 모드(Map Modes) 지원
 * - 자문회 직무(Council Tasks) 시스템 연동
 */

export type TerrainType = '평야' | '구릉' | '산악' | '해안' | '산림' | '습지' | '사막';
export type MapMode = 'political' | 'terrain' | 'religious' | 'development';
export type CouncilRole = 'chancellor' | 'marshal' | 'steward' | 'spymaster' | 'chaplain';

export interface CouncilTask {
  role: CouncilRole;
  title: string;
  targetProvinceId: string;
  progressMonths: number;
  totalMonths: number;
}

export interface Province {
  id: string;
  name: string;
  capital: string;
  rulerName: string;
  rulerTitle: string;
  realmName: string;
  culture: string;
  religion: '가톨릭' | '정교회' | '이슬람(수니)' | '이슬람(시아)';
  terrain: TerrainType;
  development: number;       // 1 ~ 100
  garrison: number;          // 성채 방어력
  maxLevies: number;         // 징집 가능 병력
  currentLevies: number;     // 현재 주둔 병력
  monthlyIncome: number;     // 월간 조세 (금화)
  holdingLevel: number;      // 1 ~ 5
  isPlayerControlled: boolean;
  color: string;             // 정치 맵 색상
  borderColor: string;
  neighbors: string[];       // 인접 국경 ID 목록
  center: { x: number; y: number };
  svgPath: string;           // 실제 지리 형태의 프로빈스 폴리곤
  assignedTask?: CouncilTask; // 배속된 자문회 직무
}

/**
 * 표준 세계지도 해안선 및 대륙 베이스 레이어 (유라시아 & 지중해 & 북아프리카 대륙 윤곽)
 */
export const WORLD_BASE_GEOGRAPHY = {
  // 지중해 해역 및 바다 배경 사각형
  oceanBg: 'radial-gradient(ellipse at 50% 50%, #0c1a2d 0%, #070e18 100%)',
  
  // 실제 지리 해안선 실루엣 (고지도 대륙 랜드매스 - 유라시아, 아프리카, 인도 전도)
  continents: [
    {
      id: 'europe_mainland',
      name: '유럽 대륙',
      path: 'M 260 210 Q 340 180 430 200 Q 520 180 620 170 Q 750 160 880 180 L 920 300 Q 820 320 740 380 Q 640 400 580 480 Q 480 500 420 460 Q 350 490 280 440 Q 230 360 250 280 Z'
    },
    {
      id: 'british_isles',
      name: '브리튼 제도',
      path: 'M 210 140 Q 250 110 280 150 Q 270 230 220 250 Q 180 230 190 170 Z M 160 170 Q 190 150 180 210 Q 150 230 145 190 Z'
    },
    {
      id: 'scandinavia',
      name: '스칸디나비아',
      path: 'M 400 80 Q 500 50 560 100 Q 520 180 460 200 Q 420 160 390 120 Z'
    },
    {
      id: 'iberia',
      name: '이베리아 반도',
      path: 'M 190 420 Q 290 400 310 470 Q 280 550 200 560 Q 160 500 170 440 Z'
    },
    {
      id: 'italy',
      name: '이탈리아 반도',
      path: 'M 460 410 Q 520 430 550 500 Q 560 550 520 560 Q 490 520 480 460 Z M 480 575 Q 520 570 515 605 Q 470 600 480 575 Z'
    },
    {
      id: 'balkans_greece',
      name: '발칸 및 그리스',
      path: 'M 580 390 Q 680 370 700 440 Q 660 530 620 540 Q 570 480 580 400 Z'
    },
    {
      id: 'anatolia',
      name: '소아시아 아나톨리아',
      path: 'M 720 410 Q 860 390 890 450 Q 840 500 730 480 Z'
    },
    {
      id: 'north_africa',
      name: '북아프리카 및 나일강',
      path: 'M 140 540 Q 380 550 540 580 Q 720 570 860 600 L 890 730 Q 500 740 140 720 Z'
    },
    {
      id: 'steppe_cumania',
      name: '스텝 쿠마니아 및 유라시아 평원',
      path: 'M 650 170 Q 850 140 1150 180 L 1180 360 Q 980 340 780 330 Z'
    },
    {
      id: 'persia_mesopotamia',
      name: '페르시아 및 셀주크 고원',
      path: 'M 880 380 Q 1060 370 1150 440 L 1120 580 Q 960 590 870 530 Z'
    },
    {
      id: 'india_bengal',
      name: '인도 아대륙 및 벵골',
      path: 'M 1040 520 Q 1150 490 1180 580 L 1120 720 Q 1060 670 1040 580 Z'
    }
  ]
};

/**
 * 대제국 캘리그라피 레이어 (CK3 지도 스타일 대형 레터링)
 */
export interface ImperialCalligraphy {
  id: string;
  text: string;
  x: number;
  y: number;
  rotate?: number;
  fontSize: number;
  letterSpacing: number;
  color: string;
}

export const IMPERIAL_CALLIGRAPHIES: ImperialCalligraphy[] = [
  { id: 'cumania', text: 'CUMANIA', x: 800, y: 250, rotate: -2, fontSize: 34, letterSpacing: 8, color: '#4a3828' },
  { id: 'seljuk', text: 'SELJUK', x: 880, y: 440, rotate: -4, fontSize: 36, letterSpacing: 9, color: '#31441a' },
  { id: 'byzantine', text: 'BYZANTINE EMPIRE', x: 670, y: 450, rotate: 2, fontSize: 18, letterSpacing: 4, color: '#4c264c' },
  { id: 'france', text: 'FRANCE', x: 310, y: 310, rotate: -8, fontSize: 24, letterSpacing: 6, color: '#1e3a6a' },
  { id: 'fatimid', text: 'FATIMID', x: 740, y: 620, rotate: -6, fontSize: 24, letterSpacing: 6, color: '#164835' },
  { id: 'mongolia', text: 'MONGOLIA', x: 1080, y: 210, rotate: 1, fontSize: 22, letterSpacing: 5, color: '#2d472d' },
  { id: 'poland', text: 'POLAND', x: 530, y: 230, rotate: -3, fontSize: 16, letterSpacing: 4, color: '#662222' },
  { id: 'hungary', text: 'HUNGARY', x: 570, y: 320, rotate: 0, fontSize: 16, letterSpacing: 4, color: '#553311' },
  { id: 'england', text: 'ENGLAND', x: 220, y: 175, rotate: -8, fontSize: 14, letterSpacing: 3, color: '#682222' },
  { id: 'ghana', text: 'GHANA', x: 210, y: 660, rotate: -4, fontSize: 18, letterSpacing: 5, color: '#5c3317' }
];

/**
 * 24개 핵심 중세 역사 프로빈스 (1066년 성기 중세 세계 기준 정밀 지리 좌표)
 */
export const INITIAL_PROVINCES: Province[] = [
  // ================= 1. 브리튼 & 노르망디 =================
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
    development: 26,
    garrison: 550,
    maxLevies: 500,
    currentLevies: 500,
    monthlyIncome: 8.5,
    holdingLevel: 4,
    isPlayerControlled: true,
    color: 'rgba(220, 38, 38, 0.45)', // 붉은 잉글랜드
    borderColor: '#ef4444',
    neighbors: ['prov_yorkshire', 'prov_normandy'],
    center: { x: 235, y: 195 },
    svgPath: 'M 215 175 L 260 170 L 265 210 L 225 215 Z'
  },
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
    development: 16,
    garrison: 380,
    maxLevies: 350,
    currentLevies: 350,
    monthlyIncome: 4.8,
    holdingLevel: 2,
    isPlayerControlled: false,
    color: 'rgba(220, 38, 38, 0.35)',
    borderColor: '#ef4444',
    neighbors: ['prov_wessex', 'prov_scotland'],
    center: { x: 230, y: 150 },
    svgPath: 'M 210 130 L 255 125 L 260 168 L 215 174 Z'
  },
  {
    id: 'prov_scotland',
    name: '스코틀랜드',
    capital: '에든버러',
    rulerName: '말콤 3세',
    rulerTitle: '스코틀랜드 국왕',
    realmName: '스코틀랜드 왕국',
    culture: '스코틀랜드 게일',
    religion: '가톨릭',
    terrain: '산악',
    development: 12,
    garrison: 350,
    maxLevies: 300,
    currentLevies: 300,
    monthlyIncome: 3.5,
    holdingLevel: 2,
    isPlayerControlled: false,
    color: 'rgba(59, 130, 246, 0.35)',
    borderColor: '#60a5fa',
    neighbors: ['prov_yorkshire'],
    center: { x: 220, y: 110 },
    svgPath: 'M 195 85 L 245 80 L 250 124 L 208 128 Z'
  },
  {
    id: 'prov_normandy',
    name: '노르망디',
    capital: '루앙',
    rulerName: '기욤 2세 (정복왕)',
    rulerTitle: '노르망디 공작',
    realmName: '노르망디 공국',
    culture: '노르만',
    religion: '가톨릭',
    terrain: '해안',
    development: 24,
    garrison: 520,
    maxLevies: 480,
    currentLevies: 480,
    monthlyIncome: 7.2,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(180, 83, 9, 0.5)',
    borderColor: '#d97706',
    neighbors: ['prov_wessex', 'prov_paris', 'prov_flanders'],
    center: { x: 275, y: 245 },
    svgPath: 'M 245 225 L 300 220 L 305 260 L 250 265 Z'
  },

  // ================= 2. 프랑스 왕국권 =================
  {
    id: 'prov_paris',
    name: '일드프랑스·파리',
    capital: '파리',
    rulerName: '필리프 1세',
    rulerTitle: '프랑스 국왕',
    realmName: '프랑스 왕국',
    culture: '프랑스',
    religion: '가톨릭',
    terrain: '평야',
    development: 30,
    garrison: 600,
    maxLevies: 550,
    currentLevies: 550,
    monthlyIncome: 9.8,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(37, 99, 235, 0.5)', // 파란 카페 왕조
    borderColor: '#3b82f6',
    neighbors: ['prov_normandy', 'prov_flanders', 'prov_aquitaine', 'prov_burgundy'],
    center: { x: 320, y: 275 },
    svgPath: 'M 295 250 L 348 245 L 350 295 L 298 300 Z'
  },
  {
    id: 'prov_flanders',
    name: '플랑드르',
    capital: '브뤼허',
    rulerName: '보두앵 6세',
    rulerTitle: '플랑드르 백작',
    realmName: '프랑스 왕국',
    culture: '네덜란드 플라망',
    religion: '가톨릭',
    terrain: '습지',
    development: 32,
    garrison: 480,
    maxLevies: 420,
    currentLevies: 420,
    monthlyIncome: 11.2,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(245, 158, 11, 0.45)',
    borderColor: '#fbbf24',
    neighbors: ['prov_normandy', 'prov_paris', 'prov_cologne'],
    center: { x: 335, y: 225 },
    svgPath: 'M 310 205 L 360 200 L 365 242 L 315 248 Z'
  },
  {
    id: 'prov_aquitaine',
    name: '아키텐·보르도',
    capital: '보르도',
    rulerName: '기욤 8세',
    rulerTitle: '아키텐 공작',
    realmName: '아키텐 공국',
    culture: '오크',
    religion: '가톨릭',
    terrain: '평야',
    development: 22,
    garrison: 450,
    maxLevies: 450,
    currentLevies: 450,
    monthlyIncome: 7.0,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(217, 119, 6, 0.4)',
    borderColor: '#f59e0b',
    neighbors: ['prov_paris', 'prov_castile', 'prov_burgundy'],
    center: { x: 285, y: 345 },
    svgPath: 'M 255 315 L 315 310 L 320 370 L 260 375 Z'
  },
  {
    id: 'prov_burgundy',
    name: '부르고뉴',
    capital: '디종',
    rulerName: '로베르 1세',
    rulerTitle: '부르고뉴 공작',
    realmName: '부르고뉴 공국',
    culture: '프랑스',
    religion: '가톨릭',
    terrain: '구릉',
    development: 20,
    garrison: 420,
    maxLevies: 400,
    currentLevies: 400,
    monthlyIncome: 6.2,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(168, 85, 247, 0.4)',
    borderColor: '#c084fc',
    neighbors: ['prov_paris', 'prov_aquitaine', 'prov_swabia', 'prov_lombardy'],
    center: { x: 365, y: 320 },
    svgPath: 'M 338 295 L 395 290 L 400 345 L 342 350 Z'
  },

  // ================= 3. 이베리아 반도 =================
  {
    id: 'prov_castile',
    name: '카스티야',
    capital: '톨레도',
    rulerName: '산초 2세',
    rulerTitle: '카스티야 국왕',
    realmName: '카스티야 왕국',
    culture: '카스티야',
    religion: '가톨릭',
    terrain: '구릉',
    development: 20,
    garrison: 460,
    maxLevies: 440,
    currentLevies: 440,
    monthlyIncome: 6.5,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(234, 88, 12, 0.5)',
    borderColor: '#f97316',
    neighbors: ['prov_aquitaine', 'prov_andalusia'],
    center: { x: 235, y: 440 },
    svgPath: 'M 205 410 L 265 405 L 270 470 L 210 475 Z'
  },
  {
    id: 'prov_andalusia',
    name: '안달루시아',
    capital: '코르도바',
    rulerName: '알무타미드',
    rulerTitle: '세비야 아미르',
    realmName: '타이파 세비야',
    culture: '안달루스 아랍',
    religion: '이슬람(수니)',
    terrain: '평야',
    development: 35,
    garrison: 580,
    maxLevies: 500,
    currentLevies: 500,
    monthlyIncome: 11.5,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(16, 185, 129, 0.5)', // 이슬람 녹색
    borderColor: '#10b981',
    neighbors: ['prov_castile'],
    center: { x: 220, y: 510 },
    svgPath: 'M 190 480 L 255 475 L 260 540 L 195 545 Z'
  },

  // ================= 4. 신성로마제국 (HRE) =================
  {
    id: 'prov_cologne',
    name: '쾰른·라인란트',
    capital: '쾰른',
    rulerName: '안노 2세',
    rulerTitle: '쾰른 대주교',
    realmName: '신성로마제국',
    culture: '독일 프랑켄',
    religion: '가톨릭',
    terrain: '산림',
    development: 28,
    garrison: 520,
    maxLevies: 460,
    currentLevies: 460,
    monthlyIncome: 8.8,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(234, 179, 8, 0.45)', // 황제 제국 금빛
    borderColor: '#eab308',
    neighbors: ['prov_flanders', 'prov_swabia', 'prov_bavaria'],
    center: { x: 400, y: 235 },
    svgPath: 'M 375 210 L 430 205 L 435 260 L 380 265 Z'
  },
  {
    id: 'prov_swabia',
    name: '슈바벤',
    capital: '슈투트가르트',
    rulerName: '루돌프',
    rulerTitle: '슈바벤 공작',
    realmName: '신성로마제국',
    culture: '독일 알레만',
    religion: '가톨릭',
    terrain: '산악',
    development: 22,
    garrison: 490,
    maxLevies: 430,
    currentLevies: 430,
    monthlyIncome: 6.8,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(234, 179, 8, 0.4)',
    borderColor: '#eab308',
    neighbors: ['prov_cologne', 'prov_burgundy', 'prov_bavaria', 'prov_lombardy'],
    center: { x: 425, y: 295 },
    svgPath: 'M 400 270 L 455 265 L 460 320 L 405 325 Z'
  },
  {
    id: 'prov_bavaria',
    name: '바이에른',
    capital: '뮌헨',
    rulerName: '오토 폰 노르트하임',
    rulerTitle: '바이에른 공작',
    realmName: '신성로마제국',
    culture: '바이에른',
    religion: '가톨릭',
    terrain: '구릉',
    development: 24,
    garrison: 500,
    maxLevies: 470,
    currentLevies: 470,
    monthlyIncome: 7.5,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(234, 179, 8, 0.4)',
    borderColor: '#eab308',
    neighbors: ['prov_cologne', 'prov_swabia', 'prov_bohemia'],
    center: { x: 480, y: 280 },
    svgPath: 'M 455 255 L 510 250 L 515 305 L 460 310 Z'
  },
  {
    id: 'prov_bohemia',
    name: '보헤미아',
    capital: '프라하',
    rulerName: '브라티슬라프 2세',
    rulerTitle: '보헤미아 공작',
    realmName: '신성로마제국',
    culture: '체코',
    religion: '가톨릭',
    terrain: '산악',
    development: 22,
    garrison: 480,
    maxLevies: 450,
    currentLevies: 450,
    monthlyIncome: 6.8,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(234, 179, 8, 0.35)',
    borderColor: '#eab308',
    neighbors: ['prov_bavaria', 'prov_kiev'],
    center: { x: 535, y: 250 },
    svgPath: 'M 510 225 L 565 220 L 570 275 L 515 280 Z'
  },

  // ================= 5. 이탈리아 & 교황청 =================
  {
    id: 'prov_lombardy',
    name: '롬바르디아',
    capital: '밀라노',
    rulerName: '밀라노 코무네',
    rulerTitle: '밀라노 총독',
    realmName: '이탈리아 왕국 (HRE)',
    culture: '롬바르드',
    religion: '가톨릭',
    terrain: '평야',
    development: 36,
    garrison: 580,
    maxLevies: 520,
    currentLevies: 520,
    monthlyIncome: 12.0,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(16, 185, 129, 0.4)',
    borderColor: '#34d399',
    neighbors: ['prov_swabia', 'prov_burgundy', 'prov_tuscany'],
    center: { x: 440, y: 370 },
    svgPath: 'M 415 345 L 470 340 L 475 395 L 420 400 Z'
  },
  {
    id: 'prov_tuscany',
    name: '토스카나',
    capital: '피렌체',
    rulerName: '마틸다 디 카노사',
    rulerTitle: '토스카나 여후작',
    realmName: '토스카나 변경백국',
    culture: '이탈리아',
    religion: '가톨릭',
    terrain: '구릉',
    development: 32,
    garrison: 500,
    maxLevies: 450,
    currentLevies: 450,
    monthlyIncome: 9.5,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(244, 63, 94, 0.45)',
    borderColor: '#f43f5e',
    neighbors: ['prov_lombardy', 'prov_rome'],
    center: { x: 480, y: 420 },
    svgPath: 'M 455 395 L 505 390 L 510 445 L 460 450 Z'
  },
  {
    id: 'prov_rome',
    name: '로마 교황령',
    capital: '로마',
    rulerName: '알렉산데르 2세',
    rulerTitle: '교황 (성좌)',
    realmName: '교황령',
    culture: '로마',
    religion: '가톨릭',
    terrain: '구릉',
    development: 38,
    garrison: 650,
    maxLevies: 400,
    currentLevies: 400,
    monthlyIncome: 15.0,
    holdingLevel: 5,
    isPlayerControlled: false,
    color: 'rgba(255, 255, 255, 0.6)', // 순백의 교황청
    borderColor: '#ffffff',
    neighbors: ['prov_tuscany', 'prov_sicily'],
    center: { x: 505, y: 475 },
    svgPath: 'M 485 450 L 530 445 L 535 500 L 490 505 Z'
  },
  {
    id: 'prov_sicily',
    name: '시칠리아·팔레르모',
    capital: '팔레르모',
    rulerName: '로베르 기스카르',
    rulerTitle: '아풀리아·칼라브리아 공작',
    realmName: '노르만 시칠리아',
    culture: '노르만 이탈리아',
    religion: '가톨릭',
    terrain: '해안',
    development: 30,
    garrison: 520,
    maxLevies: 480,
    currentLevies: 480,
    monthlyIncome: 9.2,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(245, 158, 11, 0.5)',
    borderColor: '#f59e0b',
    neighbors: ['prov_rome', 'prov_constantinople', 'prov_cairo'],
    center: { x: 500, y: 585 },
    svgPath: 'M 470 565 L 530 560 L 535 610 L 475 615 Z'
  },

  // ================= 6. 비잔티움 제국 =================
  {
    id: 'prov_constantinople',
    name: '콘스탄티노플',
    capital: '콘스탄티노플 (차르그라드)',
    rulerName: '콘스탄티노스 10세 두카스',
    rulerTitle: '로마인의 바실레우스 (황제)',
    realmName: '동로마 (비잔티움) 제국',
    culture: '그리스',
    religion: '정교회',
    terrain: '해안',
    development: 50, // 중세 세계 최대 대도시
    garrison: 850,
    maxLevies: 750,
    currentLevies: 750,
    monthlyIncome: 20.0,
    holdingLevel: 5,
    isPlayerControlled: false,
    color: 'rgba(147, 51, 234, 0.55)', // 비잔티움 보라색
    borderColor: '#a855f7',
    neighbors: ['prov_sicily', 'prov_anatolia'],
    center: { x: 710, y: 440 },
    svgPath: 'M 680 415 L 740 410 L 745 465 L 685 470 Z'
  },
  {
    id: 'prov_anatolia',
    name: '아나톨리아',
    capital: '이코니온',
    rulerName: '로마노스 4세 디오게네스',
    rulerTitle: '동방 도메스티코스',
    realmName: '동로마 (비잔티움) 제국',
    culture: '그리스',
    religion: '정교회',
    terrain: '산악',
    development: 26,
    garrison: 560,
    maxLevies: 600,
    currentLevies: 600,
    monthlyIncome: 8.5,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(147, 51, 234, 0.45)',
    borderColor: '#a855f7',
    neighbors: ['prov_constantinople', 'prov_antioch'],
    center: { x: 790, y: 460 },
    svgPath: 'M 755 435 L 830 430 L 835 490 L 760 495 Z'
  },

  // ================= 7. 십자군 성지 및 레반트 =================
  {
    id: 'prov_antioch',
    name: '안티오키아',
    capital: '안티오키아',
    rulerName: '알프 아르슬란',
    rulerTitle: '셀주크 술탄',
    realmName: '셀주크 제국',
    culture: '투르크 페르시아',
    religion: '이슬람(수니)',
    terrain: '구릉',
    development: 30,
    garrison: 550,
    maxLevies: 550,
    currentLevies: 550,
    monthlyIncome: 9.0,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(20, 184, 166, 0.5)',
    borderColor: '#14b8a6',
    neighbors: ['prov_anatolia', 'prov_jerusalem'],
    center: { x: 865, y: 505 },
    svgPath: 'M 835 480 L 895 475 L 900 535 L 840 540 Z'
  },
  {
    id: 'prov_jerusalem',
    name: '성지 예루살렘',
    capital: '예루살렘 (알쿠드스)',
    rulerName: '알무스탄시르',
    rulerTitle: '파티마 칼리파',
    realmName: '파티마 왕조',
    culture: '레반트 아랍',
    religion: '이슬람(시아)',
    terrain: '구릉',
    development: 35,
    garrison: 650,
    maxLevies: 500,
    currentLevies: 500,
    monthlyIncome: 14.0,
    holdingLevel: 5,
    isPlayerControlled: false,
    color: 'rgba(13, 148, 136, 0.55)',
    borderColor: '#2dd4bf',
    neighbors: ['prov_antioch', 'prov_cairo'],
    center: { x: 885, y: 575 },
    svgPath: 'M 855 550 L 915 545 L 920 605 L 860 610 Z'
  },
  {
    id: 'prov_cairo',
    name: '이집트 카이로',
    capital: '카이로',
    rulerName: '바드르 알자말리',
    rulerTitle: '와지르 (재상)',
    realmName: '파티마 왕조',
    culture: '이집트 아랍',
    religion: '이슬람(시아)',
    terrain: '사막',
    development: 42,
    garrison: 700,
    maxLevies: 700,
    currentLevies: 700,
    monthlyIncome: 18.0,
    holdingLevel: 5,
    isPlayerControlled: false,
    color: 'rgba(13, 148, 136, 0.45)',
    borderColor: '#2dd4bf',
    neighbors: ['prov_jerusalem', 'prov_sicily'],
    center: { x: 820, y: 645 },
    svgPath: 'M 785 615 L 855 610 L 860 680 L 790 685 Z'
  },

  // ================= 8. 북유럽 & 동유럽 =================
  {
    id: 'prov_kiev',
    name: '키예프 루스',
    capital: '키예프',
    rulerName: '이자슬라프 1세',
    rulerTitle: '키예프 대공',
    realmName: '키예프 루스 공국',
    culture: '루스',
    religion: '정교회',
    terrain: '평야',
    development: 25,
    garrison: 480,
    maxLevies: 520,
    currentLevies: 520,
    monthlyIncome: 7.8,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(217, 119, 6, 0.4)',
    borderColor: '#f59e0b',
    neighbors: ['prov_bohemia', 'prov_sweden'],
    center: { x: 670, y: 220 },
    svgPath: 'M 635 190 L 710 185 L 715 255 L 640 260 Z'
  },
  {
    id: 'prov_sweden',
    name: '스웨덴·스베알란드',
    capital: '웁살라',
    rulerName: '할스텐',
    rulerTitle: '스웨덴 국왕',
    realmName: '스웨덴 왕국',
    culture: '노르드',
    religion: '가톨릭',
    terrain: '산림',
    development: 14,
    garrison: 360,
    maxLevies: 380,
    currentLevies: 380,
    monthlyIncome: 4.0,
    holdingLevel: 2,
    isPlayerControlled: false,
    color: 'rgba(56, 189, 248, 0.4)',
    borderColor: '#38bdf8',
    neighbors: ['prov_kiev'],
    center: { x: 460, y: 120 },
    svgPath: 'M 430 90 L 490 85 L 495 150 L 435 155 Z'
  },

  // ================= 9. 중앙유럽 (폴란드 & 헝가리) =================
  {
    id: 'prov_poland',
    name: '폴란드·크라쿠프',
    capital: '크라쿠프',
    rulerName: '볼레스와프 2세',
    rulerTitle: '폴란드 국왕',
    realmName: '폴란드 왕국',
    culture: '폴란드',
    religion: '가톨릭',
    terrain: '평야',
    development: 20,
    garrison: 460,
    maxLevies: 480,
    currentLevies: 480,
    monthlyIncome: 6.5,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(220, 38, 38, 0.4)',
    borderColor: '#ef4444',
    neighbors: ['prov_bohemia', 'prov_hungary', 'prov_kiev'],
    center: { x: 570, y: 235 },
    svgPath: 'M 545 205 L 600 200 L 605 260 L 550 265 Z'
  },
  {
    id: 'prov_hungary',
    name: '헝가리·에스테르곰',
    capital: '에스테르곰',
    rulerName: '셜로몬',
    rulerTitle: '헝가리 국왕',
    realmName: '헝가리 왕국',
    culture: '마자르',
    religion: '가톨릭',
    terrain: '평야',
    development: 22,
    garrison: 480,
    maxLevies: 490,
    currentLevies: 490,
    monthlyIncome: 7.2,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(180, 83, 9, 0.45)',
    borderColor: '#d97706',
    neighbors: ['prov_poland', 'prov_kiev', 'prov_constantinople', 'prov_cumania'],
    center: { x: 605, y: 310 },
    svgPath: 'M 575 285 L 635 280 L 640 340 L 580 345 Z'
  },

  // ================= 10. 유라시아 스텝 & 쿠마니아 =================
  {
    id: 'prov_cumania',
    name: '쿠마니아·사르켈',
    capital: '사르켈',
    rulerName: '볼루시 칸',
    rulerTitle: '쿠만-킵차크 대칸',
    realmName: '쿠만 킵차크 칸국 (CUMANIA)',
    culture: '쿠만',
    religion: '이슬람(수니)',
    terrain: '평야',
    development: 18,
    garrison: 520,
    maxLevies: 700,
    currentLevies: 700,
    monthlyIncome: 8.0,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(180, 140, 95, 0.55)', // 이미지 속 거대한 갈색 판도
    borderColor: '#a3704c',
    neighbors: ['prov_kiev', 'prov_hungary', 'prov_seljuk_isfahan', 'prov_mongolia'],
    center: { x: 800, y: 260 },
    svgPath: 'M 720 220 L 910 200 L 930 310 L 730 320 Z'
  },

  // ================= 11. 셀주크 제국 (동방 페르시아) =================
  {
    id: 'prov_seljuk_isfahan',
    name: '셀주크·이스파한',
    capital: '이스파한',
    rulerName: '알프 아르슬란',
    rulerTitle: '대 셀주크 술탄',
    realmName: '위대한 셀주크 제국 (SELJUK)',
    culture: '페르시아 투르크',
    religion: '이슬람(수니)',
    terrain: '구릉',
    development: 45,
    garrison: 800,
    maxLevies: 850,
    currentLevies: 850,
    monthlyIncome: 19.5,
    holdingLevel: 5,
    isPlayerControlled: false,
    color: 'rgba(132, 204, 22, 0.55)', // 이미지 속 셀주크의 상징적인 라임/올리브 그린
    borderColor: '#84cc16',
    neighbors: ['prov_antioch', 'prov_cumania', 'prov_bengal'],
    center: { x: 940, y: 440 },
    svgPath: 'M 880 390 L 1020 380 L 1030 490 L 890 500 Z'
  },

  // ================= 12. 극동 스텝 & 몽골 초원 =================
  {
    id: 'prov_mongolia',
    name: '몽골 초원',
    capital: '오논강 유역',
    rulerName: '카불 칸 (조상)',
    rulerTitle: '카묵 몽골 칸',
    realmName: '몽골 고원 (MONGOLIA)',
    culture: '몽골',
    religion: '이슬람(수니)',
    terrain: '평야',
    development: 12,
    garrison: 400,
    maxLevies: 600,
    currentLevies: 600,
    monthlyIncome: 5.0,
    holdingLevel: 2,
    isPlayerControlled: false,
    color: 'rgba(34, 197, 94, 0.45)', // 녹색 몽골
    borderColor: '#22c55e',
    neighbors: ['prov_cumania', 'prov_bengal'],
    center: { x: 1080, y: 220 },
    svgPath: 'M 1000 170 L 1150 160 L 1160 270 L 1010 280 Z'
  },

  // ================= 13. 인도 아대륙 & 벵골 =================
  {
    id: 'prov_bengal',
    name: '벵골·가우다',
    capital: '가우다',
    rulerName: '비그라하팔라 3세',
    rulerTitle: '팔라 황제',
    realmName: '팔라 제국 (BENGAL)',
    culture: '벵골',
    religion: '정교회',
    terrain: '습지',
    development: 38,
    garrison: 650,
    maxLevies: 650,
    currentLevies: 650,
    monthlyIncome: 14.0,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(168, 85, 247, 0.45)', // 자주색 인도
    borderColor: '#a855f7',
    neighbors: ['prov_seljuk_isfahan', 'prov_mongolia'],
    center: { x: 1100, y: 560 },
    svgPath: 'M 1040 500 L 1150 490 L 1160 620 L 1050 630 Z'
  },

  // ================= 14. 서아프리카 가나 제국 =================
  {
    id: 'prov_ghana',
    name: '가나·쿰비살레',
    capital: '쿰비 살레',
    rulerName: '툰카 마닌',
    rulerTitle: '가나 황제 (카야마간)',
    realmName: '황금의 가나 제국 (GHANA)',
    culture: '소닝케',
    religion: '이슬람(수니)',
    terrain: '사막',
    development: 30,
    garrison: 550,
    maxLevies: 550,
    currentLevies: 550,
    monthlyIncome: 16.0,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(234, 88, 12, 0.5)', // 주황빛 황금 가나
    borderColor: '#f97316',
    neighbors: ['prov_andalusia', 'prov_cairo'],
    center: { x: 220, y: 680 },
    svgPath: 'M 160 630 L 280 620 L 290 730 L 170 740 Z'
  }
];

/**
 * 맵 모드별 프로빈스 채색 계산
 */
export function getProvinceColorByMode(province: Province, mode: MapMode): { fill: string; stroke: string } {
  switch (mode) {
    case 'terrain': {
      const terrainColors: Record<TerrainType, { fill: string; stroke: string }> = {
        '평야': { fill: 'rgba(34, 197, 94, 0.45)', stroke: '#22c55e' },
        '구릉': { fill: 'rgba(202, 138, 4, 0.45)', stroke: '#eab308' },
        '산악': { fill: 'rgba(100, 116, 139, 0.55)', stroke: '#94a3b8' },
        '해안': { fill: 'rgba(2, 132, 199, 0.45)', stroke: '#38bdf8' },
        '산림': { fill: 'rgba(21, 128, 61, 0.55)', stroke: '#16a34a' },
        '습지': { fill: 'rgba(77, 124, 15, 0.45)', stroke: '#84cc16' },
        '사막': { fill: 'rgba(217, 119, 6, 0.55)', stroke: '#f59e0b' }
      };
      return terrainColors[province.terrain] || { fill: 'rgba(100, 116, 139, 0.4)', stroke: '#94a3b8' };
    }

    case 'religious': {
      const religionColors: Record<string, { fill: string; stroke: string }> = {
        '가톨릭': { fill: 'rgba(59, 130, 246, 0.5)', stroke: '#60a5fa' },
        '정교회': { fill: 'rgba(168, 85, 247, 0.5)', stroke: '#c084fc' },
        '이슬람(수니)': { fill: 'rgba(16, 185, 129, 0.5)', stroke: '#34d399' },
        '이슬람(시아)': { fill: 'rgba(20, 184, 166, 0.5)', stroke: '#2dd4bf' }
      };
      return religionColors[province.religion] || { fill: 'rgba(156, 163, 175, 0.4)', stroke: '#9ca3af' };
    }

    case 'development': {
      // 개발도 1~50에 따른 히트맵
      const ratio = Math.min(1, Math.max(0.1, province.development / 50));
      if (ratio > 0.7) {
        return { fill: 'rgba(234, 179, 8, 0.65)', stroke: '#fde047' }; // 최고 발전 (황금빛)
      } else if (ratio > 0.4) {
        return { fill: 'rgba(56, 189, 248, 0.45)', stroke: '#38bdf8' }; // 보통 발전
      } else {
        return { fill: 'rgba(107, 114, 128, 0.4)', stroke: '#9ca3af' }; // 미개발
      }
    }

    case 'political':
    default:
      return {
        fill: province.isPlayerControlled ? 'rgba(59, 130, 246, 0.5)' : province.color,
        stroke: province.isPlayerControlled ? '#60a5fa' : province.borderColor
      };
  }
}
