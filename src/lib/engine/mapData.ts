/**
 * 표준 세계지도(유라시아-지중해-북아프리카-중동-인도 중세 세계) 정밀 지리 데이터
 * - 1066년 성기 중세 유럽, 지중해, 비잔티움, 레반트 성지, 북아프리카, 페르시아, 스텝
 * - 실제 지리학적 투영(Equirectangular/Miller 좌표계, viewBox: 0 0 1200 800)
 * - 실제 해안선 및 지형 경계에 기반한 정밀 프로빈스 폴리곤(Realistic Geographic Boundaries)
 * - 정치 / 지형 / 종교 / 개발도 4대 지도 모드 지원
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
  religion: '가톨릭' | '정교회' | '이슬람(수니)' | '이슬람(시아)' | '불교' | '힌두교' | '텡그리';
  terrain: TerrainType;
  development: number;       // 1 ~ 100
  garrison: number;          // 성채 방어력
  maxLevies: number;         // 징집 가능 병력
  currentLevies: number;     // 현재 주둔 병력
  monthlyIncome: number;     // 월간 조세 (금화)
  holdingLevel: number;      // 1 ~ 5
  isPlayerControlled: boolean;
  color: string;             // 정치 맵 수채화 색상
  borderColor: string;
  neighbors: string[];       // 인접 국경 ID 목록
  center: { x: number; y: number };
  svgPath: string;           // 실제 지리 형태의 프로빈스 다각형 패스
  assignedTask?: CouncilTask; // 배속된 자문회 직무
}

/**
 * 실제 세계 지도 해안선 및 주요 수계 베이스 레이어 (유라시아 & 지중해 & 북아프리카 실제 지형)
 */
export const WORLD_BASE_GEOGRAPHY = {
  oceanBg: '#c9b897',
  
  continents: [
    // 1. 브리튼 제도 (그레이트브리튼 섬 & 아일랜드 섬)
    {
      id: 'british_isles',
      name: '브리튼 제도',
      path: `
        M 195 90 C 205 80 230 75 235 90 C 240 105 220 120 235 135 C 245 145 255 170 240 190
        C 250 205 235 225 210 220 C 190 225 180 210 190 195 C 175 185 185 155 200 150
        C 195 130 185 110 195 90 Z
        M 160 140 C 175 135 180 155 175 175 C 170 195 150 205 145 185 C 140 165 150 145 160 140 Z
      `
    },
    // 2. 스칸디나비아 반도 및 덴마크
    {
      id: 'scandinavia',
      name: '스칸디나비아',
      path: `
        M 380 140 C 390 110 410 70 440 60 C 480 50 520 70 540 110 C 560 150 530 190 490 200
        C 460 210 440 180 410 170 C 390 180 375 160 380 140 Z
        M 385 195 C 395 185 410 190 405 210 C 395 225 380 215 385 195 Z
      `
    },
    // 3. 서유럽 및 프랑스 본토
    {
      id: 'western_europe',
      name: '프랑스 및 서유럽',
      path: `
        M 255 220 C 290 215 320 205 345 210 C 360 230 385 240 375 280 C 370 320 330 340 335 375
        C 310 380 280 385 255 375 C 245 340 270 310 250 275 C 230 260 240 235 255 220 Z
      `
    },
    // 4. 이베리아 반도
    {
      id: 'iberia',
      name: '이베리아 반도',
      path: `
        M 250 380 C 290 385 320 400 305 440 C 295 480 270 530 235 540 C 200 545 170 520 175 470
        C 180 430 210 400 240 385 C 250 380 250 380 250 380 Z
      `
    },
    // 5. 중앙유럽 (독일, 알프스, 저지대)
    {
      id: 'central_europe',
      name: '중앙유럽',
      path: `
        M 345 210 C 400 200 460 190 515 200 C 530 240 540 275 510 320 C 480 345 440 355 390 345
        C 375 320 380 280 370 240 C 360 220 345 210 345 210 Z
      `
    },
    // 6. 이탈리아 반도 및 섬들 (시칠리아, 사르데냐, 코르시카)
    {
      id: 'italy',
      name: '이탈리아 반도',
      path: `
        M 405 345 C 450 335 480 355 465 390 C 475 420 515 470 530 520 C 525 545 490 550 480 520
        C 460 480 435 440 430 395 C 415 370 405 345 405 345 Z
        M 465 550 C 495 545 510 565 485 580 C 455 580 450 560 465 550 Z
        M 385 400 C 395 395 400 420 395 445 C 385 450 380 425 385 400 Z
      `
    },
    // 7. 발칸 반도 및 그리스 군도
    {
      id: 'balkans',
      name: '발칸 및 그리스',
      path: `
        M 515 320 C 560 305 620 320 655 345 C 670 390 680 450 645 500 C 625 530 600 525 590 480
        C 575 440 550 400 530 360 C 520 340 515 320 515 320 Z
      `
    },
    // 8. 동유럽 (폴란드, 헝가리, 키예프 루스)
    {
      id: 'eastern_europe',
      name: '동유럽 평원',
      path: `
        M 515 200 C 580 185 660 170 735 180 C 760 230 750 290 710 330 C 650 340 580 325 540 310
        C 525 270 520 230 515 200 Z
      `
    },
    // 9. 소아시아 아나톨리아
    {
      id: 'anatolia',
      name: '소아시아 아나톨리아',
      path: `
        M 660 380 C 730 365 810 360 870 385 C 885 430 860 470 800 475 C 740 470 690 445 660 380 Z
      `
    },
    // 10. 흑해 북방 유라시아 스텝 (쿠마니아)
    {
      id: 'steppe_cumania',
      name: '유라시아 스텝',
      path: `
        M 735 180 C 830 160 960 150 1060 170 C 1075 240 1020 310 930 320 C 840 325 760 300 735 180 Z
      `
    },
    // 11. 페르시아 및 메소포타미아 (셀주크)
    {
      id: 'persia_mesopotamia',
      name: '페르시아 및 메소포타미아',
      path: `
        M 840 390 C 930 375 1020 380 1080 420 C 1070 490 1000 540 920 530 C 860 510 840 450 840 390 Z
      `
    },
    // 12. 레반트 및 아라비아 북부
    {
      id: 'levant',
      name: '레반트 성지',
      path: `
        M 800 475 C 840 460 865 490 860 540 C 850 580 820 590 805 550 C 795 510 800 475 800 475 Z
      `
    },
    // 13. 북아프리카 및 나일강 (파티마)
    {
      id: 'north_africa',
      name: '북아프리카 및 이집트',
      path: `
        M 160 560 C 260 545 420 550 550 575 C 670 565 770 580 840 600 C 850 670 800 720 730 730
        C 580 735 380 740 150 720 C 140 650 150 590 160 560 Z
      `
    },
    // 14. 극동 몽골 고원
    {
      id: 'mongolia_plateau',
      name: '몽골 고원',
      path: `
        M 1030 160 C 1100 145 1160 150 1180 190 C 1175 250 1120 280 1050 270 C 1030 220 1025 180 1030 160 Z
      `
    },
    // 15. 인도 아대륙 (벵골/팔라)
    {
      id: 'india',
      name: '인도 아대륙',
      path: `
        M 1040 480 C 1100 460 1160 480 1175 540 C 1160 620 1120 700 1080 710 C 1050 650 1040 560 1040 480 Z
      `
    },
    // 16. 중화 본토 및 양쯔강·황하 대평원 (송나라 & 거란)
    {
      id: 'china_mainland',
      name: '중화 중원 및 강남',
      path: `
        M 1140 240 C 1220 220 1280 230 1270 280 C 1255 350 1270 420 1280 500 C 1270 560 1220 620 1130 610
        C 1070 600 1050 510 1060 430 C 1050 360 1100 270 1140 240 Z
      `
    },
    // 17. 만주 및 한반도 (고려 삼한)
    {
      id: 'korean_peninsula',
      name: '한반도 및 요동',
      path: `
        M 1260 250 C 1290 235 1330 250 1335 290 C 1340 330 1330 380 1300 410 C 1275 400 1270 350 1280 310
        C 1270 280 1260 260 1260 250 Z
      `
    },
    // 18. 일본 열도 (헤이안 일본)
    {
      id: 'japanese_archipelago',
      name: '일본 열도',
      path: `
        M 1340 330 C 1365 300 1410 280 1430 320 C 1440 360 1400 410 1365 420 C 1345 390 1335 360 1340 330 Z
      `
    },
    // 19. 티베트 고원 (히말라야 설산)
    {
      id: 'tibet_plateau',
      name: '티베트 고원',
      path: `
        M 1040 380 C 1110 390 1140 430 1135 480 C 1090 500 1045 490 1035 440 C 1030 400 1035 385 1040 380 Z
      `
    }
  ]
};

/**
 * 대제국 고전 캘리그라피 메타데이터
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
  { id: 'france', text: 'FRANCE', x: 290, y: 290, rotate: -6, fontSize: 24, letterSpacing: 8, color: '#1e3a6a' },
  { id: 'england', text: 'ENGLAND', x: 215, y: 165, rotate: -8, fontSize: 15, letterSpacing: 4, color: '#7f1d1d' },
  { id: 'hre', text: 'HOLY ROMAN EMPIRE', x: 440, y: 260, rotate: -3, fontSize: 18, letterSpacing: 6, color: '#574116' },
  { id: 'byzantine', text: 'BYZANTINE EMPIRE', x: 740, y: 430, rotate: 2, fontSize: 20, letterSpacing: 6, color: '#4c1d55' },
  { id: 'cumania', text: 'CUMANIA', x: 860, y: 230, rotate: -2, fontSize: 32, letterSpacing: 10, color: '#543b22' },
  { id: 'seljuk', text: 'SELJUK', x: 940, y: 440, rotate: -3, fontSize: 34, letterSpacing: 10, color: '#2f4b16' },
  { id: 'fatimid', text: 'FATIMID', x: 740, y: 640, rotate: -5, fontSize: 24, letterSpacing: 7, color: '#144c35' },
  { id: 'mongolia', text: 'MONGOLIA', x: 1080, y: 190, rotate: 1, fontSize: 20, letterSpacing: 6, color: '#2b4d2b' },
  { id: 'poland', text: 'POLAND', x: 550, y: 235, rotate: -2, fontSize: 16, letterSpacing: 5, color: '#662222' },
  { id: 'hungary', text: 'HUNGARY', x: 605, y: 320, rotate: 0, fontSize: 16, letterSpacing: 5, color: '#5c3a16' },
  { id: 'ghana', text: 'GHANA', x: 210, y: 670, rotate: -4, fontSize: 18, letterSpacing: 6, color: '#6b3612' },
  // 동양 대제국 고전 캘리그라피
  { id: 'song', text: 'SONG DYNASTY', x: 1180, y: 450, rotate: -2, fontSize: 26, letterSpacing: 8, color: '#991b1b' },
  { id: 'goryeo', text: 'GORYEO', x: 1290, y: 310, rotate: 4, fontSize: 15, letterSpacing: 4, color: '#1e40af' },
  { id: 'liao', text: 'LIAO EMPIRE', x: 1190, y: 260, rotate: -3, fontSize: 18, letterSpacing: 6, color: '#78350f' },
  { id: 'japan', text: 'JAPAN', x: 1375, y: 360, rotate: -15, fontSize: 14, letterSpacing: 4, color: '#831843' },
  { id: 'tibet', text: 'TIBET', x: 1070, y: 435, rotate: 0, fontSize: 16, letterSpacing: 5, color: '#581c87' }
];

/**
 * 28개 핵심 중세 역사 프로빈스 (실제 해안선과 강, 산맥에 맞춘 정밀 지리 다각형)
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
    color: 'rgba(185, 28, 28, 0.42)',
    borderColor: '#991b1b',
    neighbors: ['prov_yorkshire', 'prov_normandy'],
    center: { x: 222, y: 195 },
    // 잉글랜드 남부 해안선 및 템스강 라인을 따르는 실제 지형 다각형
    svgPath: 'M 190 195 C 205 185 225 180 240 185 C 248 198 238 215 220 220 C 200 222 188 208 190 195 Z'
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
    color: 'rgba(185, 28, 28, 0.35)',
    borderColor: '#991b1b',
    neighbors: ['prov_wessex', 'prov_scotland'],
    center: { x: 225, y: 152 },
    svgPath: 'M 205 145 C 220 135 235 140 240 160 C 245 178 230 185 212 180 C 200 170 200 155 205 145 Z'
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
    color: 'rgba(30, 64, 175, 0.38)',
    borderColor: '#1d4ed8',
    neighbors: ['prov_yorkshire'],
    center: { x: 215, y: 105 },
    svgPath: 'M 198 90 C 215 80 235 85 235 105 C 235 125 215 140 205 142 C 190 130 190 105 198 90 Z'
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
    color: 'rgba(180, 83, 9, 0.45)',
    borderColor: '#b45309',
    neighbors: ['prov_wessex', 'prov_paris', 'prov_flanders'],
    center: { x: 275, y: 245 },
    svgPath: 'M 252 230 C 275 220 295 225 305 242 C 298 260 270 265 255 255 C 248 245 248 238 252 230 Z'
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
    color: 'rgba(29, 78, 216, 0.48)',
    borderColor: '#1e40af',
    neighbors: ['prov_normandy', 'prov_flanders', 'prov_aquitaine', 'prov_burgundy'],
    center: { x: 310, y: 268 },
    svgPath: 'M 292 245 C 315 238 335 245 342 265 C 340 288 320 298 298 290 C 288 275 288 255 292 245 Z'
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
    color: 'rgba(217, 119, 6, 0.42)',
    borderColor: '#d97706',
    neighbors: ['prov_normandy', 'prov_paris', 'prov_cologne'],
    center: { x: 330, y: 225 },
    svgPath: 'M 315 212 C 335 208 352 215 358 232 C 352 246 332 250 318 242 C 310 230 312 218 315 212 Z'
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
    color: 'rgba(180, 83, 9, 0.38)',
    borderColor: '#92400e',
    neighbors: ['prov_paris', 'prov_castile', 'prov_burgundy'],
    center: { x: 285, y: 340 },
    svgPath: 'M 260 300 C 285 295 308 310 315 335 C 310 365 285 378 260 365 C 248 340 250 315 260 300 Z'
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
    color: 'rgba(147, 51, 234, 0.38)',
    borderColor: '#7e22ce',
    neighbors: ['prov_paris', 'prov_aquitaine', 'prov_swabia', 'prov_lombardy'],
    center: { x: 355, y: 310 },
    svgPath: 'M 335 285 C 360 275 380 290 385 315 C 380 340 355 352 335 340 C 325 320 328 298 335 285 Z'
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
    color: 'rgba(194, 65, 12, 0.45)',
    borderColor: '#c2410c',
    neighbors: ['prov_aquitaine', 'prov_andalusia'],
    center: { x: 245, y: 440 },
    svgPath: 'M 220 400 C 255 390 285 410 295 440 C 285 475 250 485 220 465 C 205 440 210 415 220 400 Z'
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
    color: 'rgba(5, 150, 105, 0.45)',
    borderColor: '#059669',
    neighbors: ['prov_castile', 'prov_ghana'],
    center: { x: 228, y: 505 },
    svgPath: 'M 205 470 C 240 465 275 480 270 515 C 255 540 220 545 195 530 C 185 500 195 480 205 470 Z'
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
    color: 'rgba(202, 138, 4, 0.42)',
    borderColor: '#a16207',
    neighbors: ['prov_flanders', 'prov_swabia', 'prov_bavaria'],
    center: { x: 395, y: 240 },
    svgPath: 'M 370 215 C 405 208 430 220 435 245 C 428 270 400 278 375 268 C 362 250 362 228 370 215 Z'
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
    color: 'rgba(202, 138, 4, 0.38)',
    borderColor: '#a16207',
    neighbors: ['prov_cologne', 'prov_burgundy', 'prov_bavaria', 'prov_lombardy'],
    center: { x: 415, y: 295 },
    svgPath: 'M 390 272 C 420 265 445 275 448 302 C 440 325 415 332 392 322 C 382 305 382 285 390 272 Z'
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
    color: 'rgba(202, 138, 4, 0.38)',
    borderColor: '#a16207',
    neighbors: ['prov_cologne', 'prov_swabia', 'prov_bohemia'],
    center: { x: 470, y: 280 },
    svgPath: 'M 445 255 C 475 248 500 258 505 285 C 498 312 470 320 448 308 C 438 290 438 268 445 255 Z'
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
    color: 'rgba(202, 138, 4, 0.32)',
    borderColor: '#a16207',
    neighbors: ['prov_bavaria', 'prov_poland', 'prov_kiev'],
    center: { x: 515, y: 245 },
    svgPath: 'M 495 220 C 525 212 548 222 552 248 C 545 272 520 280 498 268 C 488 250 488 230 495 220 Z'
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
    color: 'rgba(16, 185, 129, 0.38)',
    borderColor: '#059669',
    neighbors: ['prov_swabia', 'prov_burgundy', 'prov_tuscany'],
    center: { x: 435, y: 365 },
    svgPath: 'M 405 345 C 440 338 468 348 472 372 C 465 395 435 402 410 392 C 398 375 398 355 405 345 Z'
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
    color: 'rgba(225, 29, 72, 0.42)',
    borderColor: '#be123c',
    neighbors: ['prov_lombardy', 'prov_rome'],
    center: { x: 465, y: 418 },
    svgPath: 'M 445 395 C 475 388 495 400 498 425 C 490 450 465 458 445 445 C 435 430 435 408 445 395 Z'
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
    color: 'rgba(250, 250, 249, 0.65)',
    borderColor: '#78716c',
    neighbors: ['prov_tuscany', 'prov_sicily'],
    center: { x: 488, y: 470 },
    svgPath: 'M 470 450 C 498 442 518 455 520 480 C 512 505 488 512 470 500 C 460 485 460 462 470 450 Z'
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
    color: 'rgba(217, 119, 6, 0.45)',
    borderColor: '#b45309',
    neighbors: ['prov_rome', 'prov_constantinople', 'prov_cairo'],
    center: { x: 485, y: 565 },
    svgPath: 'M 460 550 C 490 545 510 560 505 585 C 485 595 465 590 452 575 C 448 560 452 552 460 550 Z'
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
    development: 50,
    garrison: 850,
    maxLevies: 750,
    currentLevies: 750,
    monthlyIncome: 20.0,
    holdingLevel: 5,
    isPlayerControlled: false,
    color: 'rgba(126, 34, 206, 0.52)',
    borderColor: '#6b21a8',
    neighbors: ['prov_sicily', 'prov_hungary', 'prov_anatolia'],
    center: { x: 675, y: 420 },
    svgPath: 'M 645 390 C 685 375 715 390 710 425 C 695 450 660 458 640 442 C 632 425 635 405 645 390 Z'
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
    color: 'rgba(126, 34, 206, 0.42)',
    borderColor: '#6b21a8',
    neighbors: ['prov_constantinople', 'prov_antioch'],
    center: { x: 775, y: 435 },
    svgPath: 'M 725 400 C 785 385 835 395 845 440 C 830 475 770 480 730 465 C 715 445 715 415 725 400 Z'
  },

  // ================= 7. 십자군 성지 & 레반트 =================
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
    color: 'rgba(77, 124, 15, 0.48)',
    borderColor: '#4d7c0f',
    neighbors: ['prov_anatolia', 'prov_jerusalem', 'prov_seljuk_isfahan'],
    center: { x: 835, y: 495 },
    svgPath: 'M 810 470 C 845 460 870 475 872 505 C 865 530 835 540 812 528 C 802 510 802 485 810 470 Z'
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
    color: 'rgba(13, 148, 136, 0.48)',
    borderColor: '#0f766e',
    neighbors: ['prov_antioch', 'prov_cairo'],
    center: { x: 825, y: 565 },
    svgPath: 'M 805 535 C 835 528 855 540 858 570 C 850 595 825 605 808 595 C 798 578 798 550 805 535 Z'
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
    color: 'rgba(13, 148, 136, 0.52)',
    borderColor: '#0f766e',
    neighbors: ['prov_jerusalem', 'prov_sicily', 'prov_ghana'],
    center: { x: 760, y: 645 },
    svgPath: 'M 720 605 C 775 595 825 605 820 655 C 805 695 750 710 710 685 C 698 655 705 625 720 605 Z'
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
    color: 'rgba(180, 83, 9, 0.38)',
    borderColor: '#b45309',
    neighbors: ['prov_bohemia', 'prov_sweden', 'prov_poland', 'prov_cumania'],
    center: { x: 670, y: 220 },
    svgPath: 'M 630 180 C 690 170 740 185 745 235 C 735 275 680 288 640 270 C 620 240 620 205 630 180 Z'
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
    color: 'rgba(2, 132, 199, 0.42)',
    borderColor: '#0284c7',
    neighbors: ['prov_kiev'],
    center: { x: 460, y: 120 },
    svgPath: 'M 425 80 C 475 70 515 85 510 135 C 495 175 450 180 425 160 C 415 135 415 105 425 80 Z'
  },
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
    color: 'rgba(185, 28, 28, 0.42)',
    borderColor: '#991b1b',
    neighbors: ['prov_bohemia', 'prov_hungary', 'prov_kiev'],
    center: { x: 570, y: 235 },
    svgPath: 'M 535 205 C 575 195 615 205 620 240 C 610 270 575 280 545 265 C 530 245 530 220 535 205 Z'
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
    color: 'rgba(161, 98, 7, 0.45)',
    borderColor: '#a16207',
    neighbors: ['prov_poland', 'prov_kiev', 'prov_constantinople', 'prov_cumania'],
    center: { x: 605, y: 310 },
    svgPath: 'M 565 275 C 615 265 655 280 658 320 C 648 355 605 365 572 350 C 555 330 555 295 565 275 Z'
  },

  // ================= 9. 유라시아 스텝 & 쿠마니아 =================
  {
    id: 'prov_cumania',
    name: '쿠마니아·사르켈',
    capital: '사르켈',
    rulerName: '볼루시 칸',
    rulerTitle: '쿠만-킵차크 대칸',
    realmName: '쿠만 킵차크 칸국 (CUMANIA)',
    culture: '쿠만',
    religion: '텡그리',
    terrain: '평야',
    development: 18,
    garrison: 520,
    maxLevies: 700,
    currentLevies: 700,
    monthlyIncome: 8.0,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(146, 64, 14, 0.45)',
    borderColor: '#78350f',
    neighbors: ['prov_kiev', 'prov_hungary', 'prov_seljuk_isfahan', 'prov_mongolia'],
    center: { x: 860, y: 240 },
    // 흑해 북방에서 카스피해 북안을 덮는 실제 광활한 스텝 지형
    svgPath: 'M 740 180 C 850 160 980 150 1020 200 C 1010 270 940 310 820 305 C 750 300 730 240 740 180 Z'
  },

  // ================= 10. 셀주크 제국 (동방 페르시아) =================
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
    color: 'rgba(77, 124, 15, 0.52)',
    borderColor: '#3f6212',
    neighbors: ['prov_antioch', 'prov_cumania', 'prov_bengal'],
    center: { x: 960, y: 440 },
    // 페르시아 고원 및 자그로스 산맥을 덮는 방대한 영역
    svgPath: 'M 870 380 C 970 365 1060 380 1075 435 C 1060 510 980 540 890 520 C 850 490 850 420 870 380 Z'
  },

  // ================= 11. 극동 몽골 고원 =================
  {
    id: 'prov_mongolia',
    name: '몽골 초원',
    capital: '오논강 유역',
    rulerName: '카불 칸 (선조)',
    rulerTitle: '카묵 몽골 칸',
    realmName: '몽골 고원 (MONGOLIA)',
    culture: '몽골',
    religion: '텡그리',
    terrain: '평야',
    development: 12,
    garrison: 400,
    maxLevies: 600,
    currentLevies: 600,
    monthlyIncome: 5.0,
    holdingLevel: 2,
    isPlayerControlled: false,
    color: 'rgba(21, 128, 61, 0.45)',
    borderColor: '#15803d',
    neighbors: ['prov_cumania', 'prov_liao_yanzhou', 'prov_western_xia'],
    center: { x: 1080, y: 200 },
    svgPath: 'M 1030 160 C 1110 145 1170 155 1180 200 C 1170 260 1100 280 1040 265 C 1020 220 1020 180 1030 160 Z'
  },

  // ================= 12. 인도 아대륙 & 벵골 =================
  {
    id: 'prov_bengal',
    name: '벵골·가우다',
    capital: '가우다',
    rulerName: '비그라하팔라 3세',
    rulerTitle: '팔라 황제',
    realmName: '팔라 제국 (BENGAL)',
    culture: '벵골',
    religion: '불교',
    terrain: '습지',
    development: 38,
    garrison: 650,
    maxLevies: 650,
    currentLevies: 650,
    monthlyIncome: 14.0,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(126, 34, 206, 0.45)',
    borderColor: '#7e22ce',
    neighbors: ['prov_seljuk_isfahan', 'prov_tibet', 'prov_song_kaifeng'],
    center: { x: 1080, y: 560 },
    svgPath: 'M 1040 480 C 1110 460 1165 480 1175 550 C 1160 640 1110 705 1075 690 C 1045 630 1035 540 1040 480 Z'
  },

  // ================= 13. 동양: 대송 제국 (황하 중원 황도) =================
  {
    id: 'prov_song_kaifeng',
    name: '송·개봉 (Kaifeng)',
    capital: '동경 개봉부',
    rulerName: '조서 (송 영종)',
    rulerTitle: '대송 천자',
    realmName: '대송 제국 (SONG DYNASTY)',
    culture: '송 중원',
    religion: '불교',
    terrain: '평야',
    development: 85,
    garrison: 1200,
    maxLevies: 1200,
    currentLevies: 1200,
    monthlyIncome: 28.0,
    holdingLevel: 5,
    isPlayerControlled: false,
    color: 'rgba(220, 38, 38, 0.52)',
    borderColor: '#b91c1c',
    neighbors: ['prov_western_xia', 'prov_liao_yanzhou', 'prov_song_hangzhou', 'prov_tibet', 'prov_bengal'],
    center: { x: 1200, y: 410 },
    svgPath: 'M 1150 360 C 1220 345 1255 355 1260 400 C 1250 450 1210 470 1150 460 C 1130 420 1135 380 1150 360 Z'
  },

  // ================= 14. 동양: 대송 제국 (양쯔강 강남 부유령) =================
  {
    id: 'prov_song_hangzhou',
    name: '송·항주 (Hangzhou)',
    capital: '임안부 (항주)',
    rulerName: '소동파 (소식)',
    rulerTitle: '항주 지부',
    realmName: '대송 제국 (강남 부유권)',
    culture: '강남 한족',
    religion: '불교',
    terrain: '습지',
    development: 78,
    garrison: 900,
    maxLevies: 950,
    currentLevies: 950,
    monthlyIncome: 24.0,
    holdingLevel: 5,
    isPlayerControlled: false,
    color: 'rgba(234, 88, 12, 0.48)',
    borderColor: '#c2410c',
    neighbors: ['prov_song_kaifeng', 'prov_goryeo', 'prov_japan_kyoto'],
    center: { x: 1220, y: 520 },
    svgPath: 'M 1150 460 C 1210 470 1260 480 1270 530 C 1250 580 1180 610 1130 580 C 1120 520 1130 480 1150 460 Z'
  },

  // ================= 15. 동양: 고려 왕국 (개경 만월대) =================
  {
    id: 'prov_goryeo',
    name: '고려·개경 (Kaegyong)',
    capital: '개경 (만월대)',
    rulerName: '문종 (휘 휘)',
    rulerTitle: '고려 국왕',
    realmName: '고려 왕국 (GORYEO)',
    culture: '고려',
    religion: '불교',
    terrain: '산악',
    development: 52,
    garrison: 750,
    maxLevies: 700,
    currentLevies: 700,
    monthlyIncome: 15.0,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(37, 99, 235, 0.52)',
    borderColor: '#1d4ed8',
    neighbors: ['prov_liao_yanzhou', 'prov_song_hangzhou', 'prov_japan_kyoto'],
    center: { x: 1300, y: 320 },
    svgPath: 'M 1270 260 C 1310 250 1330 270 1325 310 C 1335 340 1320 380 1295 400 C 1275 390 1270 350 1280 320 C 1275 290 1265 270 1270 260 Z'
  },

  // ================= 16. 동양: 거란 요제국 (연경/북경) =================
  {
    id: 'prov_liao_yanzhou',
    name: '요·연경 (Yanjing)',
    capital: '남경 석진부 (연경)',
    rulerName: '야율홍기 (요 도종)',
    rulerTitle: '대요 천자',
    realmName: '대요 거란제국 (LIAO)',
    culture: '거란',
    religion: '불교',
    terrain: '구릉',
    development: 46,
    garrison: 850,
    maxLevies: 900,
    currentLevies: 900,
    monthlyIncome: 16.5,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(180, 83, 9, 0.52)',
    borderColor: '#92400e',
    neighbors: ['prov_mongolia', 'prov_western_xia', 'prov_song_kaifeng', 'prov_goryeo'],
    center: { x: 1210, y: 280 },
    svgPath: 'M 1150 240 C 1220 220 1270 230 1270 260 C 1265 290 1255 355 1220 345 C 1150 360 1140 300 1150 240 Z'
  },

  // ================= 17. 동양: 탕구트 서하 왕국 =================
  {
    id: 'prov_western_xia',
    name: '서하·흥경 (Yinchuan)',
    capital: '흥경부',
    rulerName: '이양조 (서하 혜종)',
    rulerTitle: '하국 황제',
    realmName: '탕구트 서하 왕국 (WESTERN XIA)',
    culture: '탕구트',
    religion: '불교',
    terrain: '사막',
    development: 32,
    garrison: 600,
    maxLevies: 650,
    currentLevies: 650,
    monthlyIncome: 11.0,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(217, 119, 6, 0.52)',
    borderColor: '#b45309',
    neighbors: ['prov_mongolia', 'prov_liao_yanzhou', 'prov_song_kaifeng', 'prov_tibet'],
    center: { x: 1100, y: 340 },
    svgPath: 'M 1060 280 C 1120 260 1150 290 1150 360 C 1135 380 1100 400 1060 380 C 1045 330 1045 300 1060 280 Z'
  },

  // ================= 18. 동양: 토번 티베트 연맹 =================
  {
    id: 'prov_tibet',
    name: '토번·라싸 (Lhasa)',
    capital: '라싸',
    rulerName: '외송 찬푸 후예',
    rulerTitle: '토번 대왕',
    realmName: '토번 왕국 (TIBET)',
    culture: '티베트',
    religion: '불교',
    terrain: '산악',
    development: 26,
    garrison: 500,
    maxLevies: 550,
    currentLevies: 550,
    monthlyIncome: 7.5,
    holdingLevel: 3,
    isPlayerControlled: false,
    color: 'rgba(147, 51, 234, 0.48)',
    borderColor: '#7e22ce',
    neighbors: ['prov_western_xia', 'prov_song_kaifeng', 'prov_bengal'],
    center: { x: 1080, y: 440 },
    svgPath: 'M 1040 380 C 1100 400 1135 420 1130 480 C 1090 500 1050 490 1040 450 C 1030 420 1030 390 1040 380 Z'
  },

  // ================= 19. 동양: 일본 헤이안 왕조 =================
  {
    id: 'prov_japan_kyoto',
    name: '일본·헤이안쿄 (Kyoto)',
    capital: '헤이안쿄 (교토)',
    rulerName: '고산조 천황',
    rulerTitle: '일본 천황',
    realmName: '헤이안 조정 (HEIAN JAPAN)',
    culture: '야마토',
    religion: '불교',
    terrain: '해안',
    development: 54,
    garrison: 750,
    maxLevies: 750,
    currentLevies: 750,
    monthlyIncome: 15.5,
    holdingLevel: 4,
    isPlayerControlled: false,
    color: 'rgba(157, 23, 77, 0.5)',
    borderColor: '#9d174d',
    neighbors: ['prov_goryeo', 'prov_song_hangzhou'],
    center: { x: 1370, y: 360 },
    svgPath: 'M 1340 330 C 1370 300 1410 290 1420 340 C 1400 390 1360 410 1335 380 C 1330 350 1335 340 1340 330 Z'
  },

  // ================= 13. 서아프리카 가나 제국 =================
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
    color: 'rgba(194, 65, 12, 0.48)',
    borderColor: '#c2410c',
    neighbors: ['prov_andalusia', 'prov_cairo'],
    center: { x: 220, y: 670 },
    svgPath: 'M 160 620 C 230 605 290 620 285 675 C 275 730 220 740 170 725 C 145 680 150 640 160 620 Z'
  }
];

/**
 * 맵 모드별 프로빈스 채색 계산
 */
export function getProvinceColorByMode(province: Province, mode: MapMode): { fill: string; stroke: string } {
  switch (mode) {
    case 'terrain': {
      const terrainColors: Record<TerrainType, { fill: string; stroke: string }> = {
        '평야': { fill: 'rgba(34, 197, 94, 0.45)', stroke: '#15803d' },
        '구릉': { fill: 'rgba(202, 138, 4, 0.45)', stroke: '#a16207' },
        '산악': { fill: 'rgba(100, 116, 139, 0.55)', stroke: '#475569' },
        '해안': { fill: 'rgba(2, 132, 199, 0.45)', stroke: '#0369a1' },
        '산림': { fill: 'rgba(21, 128, 61, 0.55)', stroke: '#166534' },
        '습지': { fill: 'rgba(77, 124, 15, 0.45)', stroke: '#4d7c0f' },
        '사막': { fill: 'rgba(217, 119, 6, 0.55)', stroke: '#b45309' }
      };
      return terrainColors[province.terrain] || { fill: 'rgba(100, 116, 139, 0.4)', stroke: '#475569' };
    }

    case 'religious': {
      const religionColors: Record<string, { fill: string; stroke: string }> = {
        '가톨릭': { fill: 'rgba(30, 64, 175, 0.5)', stroke: '#1d4ed8' },
        '정교회': { fill: 'rgba(147, 51, 234, 0.5)', stroke: '#7e22ce' },
        '이슬람(수니)': { fill: 'rgba(5, 150, 105, 0.5)', stroke: '#047857' },
        '이슬람(시아)': { fill: 'rgba(13, 148, 136, 0.5)', stroke: '#0f766e' },
        '불교': { fill: 'rgba(217, 119, 6, 0.5)', stroke: '#b45309' },
        '힌두교': { fill: 'rgba(225, 29, 72, 0.5)', stroke: '#be123c' },
        '텡그리': { fill: 'rgba(14, 165, 233, 0.5)', stroke: '#0284c7' }
      };
      return religionColors[province.religion] || { fill: 'rgba(156, 163, 175, 0.4)', stroke: '#6b7280' };
    }

    case 'development': {
      const ratio = Math.min(1, Math.max(0.1, province.development / 50));
      if (ratio > 0.7) {
        return { fill: 'rgba(234, 179, 8, 0.65)', stroke: '#ca8a04' };
      } else if (ratio > 0.4) {
        return { fill: 'rgba(56, 189, 248, 0.45)', stroke: '#0284c7' };
      } else {
        return { fill: 'rgba(107, 114, 128, 0.4)', stroke: '#4b5563' };
      }
    }

    case 'political':
    default:
      return {
        fill: province.isPlayerControlled ? 'rgba(37, 99, 235, 0.55)' : province.color,
        stroke: province.isPlayerControlled ? '#2563eb' : province.borderColor
      };
  }
}
