// Single Source of Truth (SSOT) for Character Relationships & Hierarchies
// 2차원 분류 매트릭스 (5대 위계 Tier × 6대 직능 Vocation) 및 안전 가드레일

export type RelationTierId = 'superior' | 'patron' | 'peer' | 'subordinate' | 'rival';

export type RelationVocation = 'military' | 'clergy' | 'merchant' | 'court' | 'scholar' | 'commoner';

export interface ParsedCharacterRelation {
  id: string;               // 정규화된 고유 인물 식별자 (중복 병합용)
  raw: string;              // 원본 문자열
  name: string;             // 대괄호 제거된 순수 이름
  role: string;             // 순수 직책/직위
  fullName: string;         // '이름 (직책)' 형태의 표준 표기
  trust: number;            // 신뢰도 (0 ~ 100)
  affection: number;        // 호감도 / 애정도 (0 ~ 100)
  descStr: string;          // 위계 태그가 제거/정제된 순수 설명문
  rawDescStr: string;       // 위계 태그 포함 원본 설명문

  // 1차원: 수직적 관계 위계 (Hierarchy)
  tierId: RelationTierId;
  tierLabel: string;        // '👑 상급자 / 주군', '🛡️ 직속 호위대 / 무관' 등 맞춤형 라벨
  tierColor: string;
  tierBg: string;
  tierBorder: string;

  // 2차원: 수평적 직능/도메인 (Vocation)
  vocation: RelationVocation;
  vocationLabel: string;    // '무관·경비', '성직·수도', '상인·경제' 등
  vocationIcon: string;     // '🛡️', '⛪', '🪙' 등

  // 불리언 판별 플래그
  isSuperior: boolean;      // 승격 심사 등에 쓰일 엄격한 상급자 여부
  isSubordinate: boolean;   // 거점 상주 가신/자문관 추출에 쓰일 직속부하 여부
  isPatron: boolean;        // 후원자/유력 신도/고용주 여부
  isPeer: boolean;          // 대등한 동료 여부
  isRival: boolean;         // 숙적/적대 여부
  isRomance: boolean;       // 연인/밀회/배우자 여부
}

// 1. 이름 및 직책 문자열 정규화 (예: "[베르나르도 (성 미카엘 수호대장)]" -> { name: "베르나르도", role: "성 미카엘 수호대장" })
export function sanitizeNameAndRole(rawName: string): { name: string; role: string; fullName: string } {
  if (!rawName) return { name: '미상', role: '', fullName: '미상' };
  
  // 겉을 감싼 대괄호 [ ... ] 제거
  let cleaned = rawName.trim().replace(/^\[+|\]+$/g, '').trim();

  // 내부 괄호 (직책) 추출: 이름 (직책) 또는 [직책] 형태
  let name = cleaned;
  let role = '';

  const parenMatch = cleaned.match(/^(.*?)\s*[\(\[]\s*(.*?)\s*[\)\]]$/);
  if (parenMatch) {
    name = parenMatch[1].trim().replace(/^\[+|\]+$/g, '').trim();
    role = parenMatch[2].trim().replace(/^\[+|\]+$/g, '').trim();
  }

  // 불필요한 특수문자 정제
  name = name.replace(/[\[\]]/g, '').trim() || '미상';
  role = role.replace(/[\[\]]/g, '').trim();

  const fullName = role ? `${name} (${role})` : name;
  return { name, role, fullName };
}

// 2. 직능(Vocation) 감지 로직
export function detectVocation(role: string, desc: string, name: string = ''): RelationVocation {
  const combined = `${role} ${desc} ${name}`;

  // 1) 상인 / 경제 (마테오 사례 방어: '주교좌 성당 납품 상단' 등)
  if (
    combined.includes('행수') || combined.includes('상단') || combined.includes('상인') ||
    combined.includes('점원') || combined.includes('도제') || combined.includes('길드원') ||
    combined.includes('환전') || combined.includes('조합') || combined.includes('거상') ||
    combined.includes('납품') || combined.includes('교역') || combined.includes('대상인')
  ) {
    return 'merchant';
  }

  // 2) 무관 / 경비 / 군사 (베르나르도 사례 방어: '성 미카엘 수호대장' 등)
  if (
    combined.includes('수호대') || combined.includes('경비대') || combined.includes('호위') ||
    combined.includes('기사') || combined.includes('무관') || combined.includes('용병') ||
    combined.includes('부대장') || combined.includes('지휘관') || combined.includes('단장') ||
    combined.includes('사병') || combined.includes('원수') || combined.includes('방위') ||
    combined.includes('무력대') || combined.includes('수호병') || combined.includes('순찰')
  ) {
    return 'military';
  }

  // 3) 성직 / 수도
  // 주의: 상인/무관은 1), 2)에서 이미 우선 분류됨
  if (
    combined.includes('주교') || combined.includes('대주교') || combined.includes('교황') ||
    combined.includes('추기경') || combined.includes('총대주교') || combined.includes('교구장') ||
    combined.includes('관구장') || combined.includes('사제') || combined.includes('신부') ||
    combined.includes('수도원장') || combined.includes('수사') || combined.includes('수도사') ||
    combined.includes('복사') || combined.includes('수련수사') || combined.includes('종정') ||
    combined.includes('이단심문') || combined.includes('성직')
  ) {
    return 'clergy';
  }

  // 4) 행정 / 궁정 관료 / 봉건 영주 및 가신 (Noble & Court)
  if (
    combined.includes('백작') || combined.includes('공작') || combined.includes('남작') ||
    combined.includes('후작') || combined.includes('자작') || combined.includes('영주') ||
    combined.includes('제후') || combined.includes('국왕') || combined.includes('황제') ||
    combined.includes('군주') || combined.includes('귀족') || combined.includes('집사') ||
    combined.includes('서기') || combined.includes('참모') || combined.includes('관리인') ||
    combined.includes('재상') || combined.includes('시종') || combined.includes('궁정') ||
    combined.includes('가신') || combined.includes('촌장')
  ) {
    return 'court';
  }

  // 5) 학자 / 의원
  if (
    combined.includes('학사') || combined.includes('교수') || combined.includes('의원') ||
    combined.includes('의술') || combined.includes('연금술') || combined.includes('천문')
  ) {
    return 'scholar';
  }

  return 'commoner';
}

// 3. 2차원 매트릭스 기반 단일 인물 관계 파싱 함수
export function parsePersonalRelation(
  rawRel: string, 
  playerArchetype: string = 'noble'
): ParsedCharacterRelation {
  const parts = rawRel.split('|').map(s => s.trim());
  const rawName = parts[0] || '';
  const { name, role, fullName } = sanitizeNameAndRole(rawName);

  const trustStr = parts[1] || '';
  const affStr = parts[2] || '';
  const rawDescStr = parts.slice(3).join(' | ').replace(/^관계:\s*/, '').trim();

  // 신뢰도 & 호감도 숫자 파싱
  const trustMatch = trustStr.match(/(\d+)/);
  const affMatch = affStr.match(/(\d+)/);
  const trust = trustMatch ? Math.min(100, Math.max(0, parseInt(trustMatch[1], 10))) : 50;
  const affection = affMatch ? Math.min(100, Math.max(0, parseInt(affMatch[1], 10))) : 50;

  // 설명문에서 [태그] 추출 및 정제
  const tagMatch = rawDescStr.match(/\[(.*?)\]/);
  const explicitTag = tagMatch ? tagMatch[1].trim() : '';
  const descStr = rawDescStr.replace(/^\[.*?\]\s*/, '').trim();

  // 직능 판별
  const vocation = detectVocation(role, rawDescStr, name);

  // 직능별 기본 메타
  const vocationMeta: Record<RelationVocation, { label: string; icon: string }> = {
    military: { label: '무관·경비', icon: '⚔️' },
    clergy: { label: '성직·수도', icon: '⛪' },
    merchant: { label: '상인·경제', icon: '🪙' },
    court: { label: '행정·가신', icon: '📜' },
    scholar: { label: '학자·의원', icon: '🧪' },
    commoner: { label: '평민·기타', icon: '🌾' }
  };

  const combined = `${rawName} ${role} ${rawDescStr} ${affStr}`;

  // 특수 상태 플래그
  const isRomance = affStr.includes('애정도') || rawDescStr.includes('연인') || rawDescStr.includes('배우자') || rawDescStr.includes('밀회');

  // 1단계: 적대 관계 판별
  const isExplicitRival = explicitTag.includes('적대') || rawDescStr.includes('[적대]') || affStr.includes('숙적') || affStr.includes('라이벌');
  const isKeywordRival = combined.includes('숙적') || combined.includes('라이벌') || combined.includes('원한') || combined.includes('적대자');
  if (isExplicitRival || isKeywordRival) {
    return {
      id: name,
      raw: rawRel,
      name,
      role,
      fullName,
      trust,
      affection,
      descStr,
      rawDescStr,
      tierId: 'rival',
      tierLabel: '⚔️ 숙적 / 적대',
      tierColor: '#f87171',
      tierBg: 'rgba(239, 68, 68, 0.2)',
      tierBorder: '#ef4444',
      vocation,
      vocationLabel: vocationMeta[vocation].label,
      vocationIcon: vocationMeta[vocation].icon,
      isSuperior: false,
      isSubordinate: false,
      isPatron: false,
      isPeer: false,
      isRival: true,
      isRomance
    };
  }

  // 2단계: 상급자 차단 게이트 (Superior Blocker)
  // 상인/평민 직능은 봉건/교단 서열의 상급자가 될 수 없음 (마테오 사례 방어)
  const isBlockedFromSuperior = vocation === 'merchant' || vocation === 'commoner';

  // 3단계: 명시적 상급자 태그 판별
  const hasExplicitSuperiorTag = explicitTag.includes('상급자') || rawDescStr.includes('[상급자]');
  
  // 4단계: 키워드 기반 상급자 판별 (기관명 오인식 방어)
  // '주교좌'는 장소/기관명이므로 '주교' 단순 포함에서 엄격 배제
  const isClergySuperior = (combined.includes('교구장') || combined.includes('대주교') || combined.includes('교황') || combined.includes('종정') || combined.includes('관구장') || combined.includes('추기경')) ||
                           (combined.includes('주교') && !combined.includes('주교좌'));
  const isFeudalSuperior = combined.includes('주군') || combined.includes('국왕') || combined.includes('황제') || combined.includes('스승') || combined.includes('백작') || combined.includes('공작');

  const isSuperior = !isBlockedFromSuperior && (hasExplicitSuperiorTag || ((isClergySuperior || isFeudalSuperior) && !explicitTag.includes('동료') && !explicitTag.includes('직속부하') && !explicitTag.includes('가신')));

  if (isSuperior) {
    return {
      id: name,
      raw: rawRel,
      name,
      role,
      fullName,
      trust,
      affection,
      descStr,
      rawDescStr,
      tierId: 'superior',
      tierLabel: '👑 상급자 / 주군',
      tierColor: '#fbbf24',
      tierBg: 'rgba(251, 191, 36, 0.2)',
      tierBorder: '#f59e0b',
      vocation,
      vocationLabel: vocationMeta[vocation].label,
      vocationIcon: vocationMeta[vocation].icon,
      isSuperior: true,
      isSubordinate: false,
      isPatron: false,
      isPeer: false,
      isRival: false,
      isRomance
    };
  }

  // 5단계: 후원자 / 유력 신도 / 고용주 판별
  const hasExplicitPatronTag = explicitTag.includes('후원자') || rawDescStr.includes('[후원자]');
  const isPatronKeyword = combined.includes('후원자') || combined.includes('신도') || combined.includes('미망인') || combined.includes('고용주') || combined.includes('의뢰인') || combined.includes('영부인') || combined.includes('대상인');

  if (hasExplicitPatronTag || isPatronKeyword) {
    return {
      id: name,
      raw: rawRel,
      name,
      role,
      fullName,
      trust,
      affection,
      descStr,
      rawDescStr,
      tierId: 'patron',
      tierLabel: '📜 후원자 / 신도',
      tierColor: '#38bdf8',
      tierBg: 'rgba(56, 189, 248, 0.2)',
      tierBorder: '#0284c7',
      vocation,
      vocationLabel: vocationMeta[vocation].label,
      vocationIcon: vocationMeta[vocation].icon,
      isSuperior: false,
      isSubordinate: false,
      isPatron: true,
      isPeer: false,
      isRival: false,
      isRomance
    };
  }

  // 6단계: 직속부하 / 가신 판별 (베르나르도 사례 보정)
  const hasExplicitSubordinateTag = explicitTag.includes('직속부하') || explicitTag.includes('가신') || rawDescStr.includes('[직속부하]') || rawDescStr.includes('[가신]');
  const isSubordinateKeyword = combined.includes('직속부하') || combined.includes('가신') || combined.includes('부관') || combined.includes('시종') || combined.includes('복사') || combined.includes('수련수사') || combined.includes('도제') || combined.includes('사병');

  if (hasExplicitSubordinateTag || isSubordinateKeyword) {
    // 플레이어 아키타입과 NPC의 직능(Vocation)을 결합하여 동적 라벨 결정
    let subLabel = '🛡️ 직속 가신 / 보좌';
    if (vocation === 'military') {
      subLabel = '🛡️ 직속 호위대 / 무관';
    } else if (vocation === 'clergy') {
      subLabel = '🛡️ 직속 보좌 / 복사 / 수사';
    } else if (vocation === 'merchant') {
      subLabel = '🛡️ 전속 상인 / 회계인';
    } else if (vocation === 'court') {
      subLabel = '🛡️ 직속 가신 / 집사';
    } else if (playerArchetype === 'company') {
      subLabel = '🛡️ 직속 부관 / 단원';
    } else if (playerArchetype === 'wanderer') {
      subLabel = '🛡️ 동행 제자 / 조력자';
    }

    return {
      id: name,
      raw: rawRel,
      name,
      role,
      fullName,
      trust,
      affection,
      descStr,
      rawDescStr,
      tierId: 'subordinate',
      tierLabel: subLabel,
      tierColor: '#a78bfa',
      tierBg: 'rgba(167, 139, 250, 0.2)',
      tierBorder: '#8b5cf6',
      vocation,
      vocationLabel: vocationMeta[vocation].label,
      vocationIcon: vocationMeta[vocation].icon,
      isSuperior: false,
      isSubordinate: true,
      isPatron: false,
      isPeer: false,
      isRival: false,
      isRomance
    };
  }

  // 7단계: 기본값 대등한 동료 (Peer)
  return {
    id: name,
    raw: rawRel,
    name,
    role,
    fullName,
    trust,
    affection,
    descStr,
    rawDescStr,
    tierId: 'peer',
    tierLabel: '🤝 대등한 동료',
    tierColor: '#34d399',
    tierBg: 'rgba(52, 211, 153, 0.2)',
    tierBorder: '#10b981',
    vocation,
    vocationLabel: vocationMeta[vocation].label,
    vocationIcon: vocationMeta[vocation].icon,
    isSuperior: false,
    isSubordinate: false,
    isPatron: false,
    isPeer: true,
    isRival: false,
    isRomance
  };
}

// 4. 전체 개인 관계 일괄 파싱 함수
export function parseAllPersonalRelations(
  personalRels: string[] = [], 
  playerArchetype: string = 'noble'
): ParsedCharacterRelation[] {
  return personalRels.map(rel => parsePersonalRelation(rel, playerArchetype));
}

// 5. 상급자 승인 신뢰도 안전 추출 함수 (마테오 등 상인 배제, 진짜 상급자 및 후원자 승인)
export function getSuperiorApprovalTrust(
  personalRels: string[] = [],
  playerArchetype: string = 'noble'
): { maxTrust: number; superiorName: string; superiorRole: string; hasSuperior: boolean } {
  const parsed = parseAllPersonalRelations(personalRels, playerArchetype);
  const superiors = parsed.filter(p => p.isSuperior);

  if (superiors.length > 0) {
    // 가장 신뢰도가 높은 상급자 선별
    let best = superiors[0];
    superiors.forEach(s => {
      if (s.trust > best.trust) best = s;
    });

    return {
      maxTrust: best.trust,
      superiorName: best.name,
      superiorRole: best.role,
      hasSuperior: true
    };
  }

  // 상급자가 명시적으로 없는 경우, 승격을 지지/후원해줄 유력 후원자(Patron) 탐색 (용병, 방랑자 등)
  const patrons = parsed.filter(p => p.isPatron);
  if (patrons.length > 0) {
    let bestPatron = patrons[0];
    patrons.forEach(p => {
      if (p.trust > bestPatron.trust) bestPatron = p;
    });

    return {
      maxTrust: bestPatron.trust,
      superiorName: bestPatron.name,
      superiorRole: bestPatron.role,
      hasSuperior: true
    };
  }

  return { maxTrust: 30, superiorName: '상급자 없음', superiorRole: '', hasSuperior: false };
}

// 6. 거점 상주 가신 및 자문관 안전 추출 함수 (상급자/후원자 엄격 제외, 베르나르도 등 무관/보좌 포함)
export function getCouncilVassals(
  personalRels: string[] = [],
  playerArchetype: string = 'noble'
): ParsedCharacterRelation[] {
  const parsed = parseAllPersonalRelations(personalRels, playerArchetype);
  return parsed.filter(p => p.isSubordinate);
}
