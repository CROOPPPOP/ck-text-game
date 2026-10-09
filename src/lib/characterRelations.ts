// Single Source of Truth (SSOT) for Character Relationships & Hierarchies
// 2차원 분류 매트릭스 (5대 위계 Tier × 6대 직능 Vocation) 및 안전 가드레일

export type RelationTierId = 'superior' | 'patron' | 'peer' | 'subordinate' | 'rival';

export type RelationVocation = 'military' | 'clergy' | 'merchant' | 'court' | 'scholar' | 'commoner';

export interface NPCAgenda {
  motives: string[];
  innerThought: string;
  proactiveAction: string;
}

export interface ParsedCharacterRelation {
  id: string;               // 정규화된 고유 인물 식별자 (중복 병합용)
  raw: string;              // 원본 문자열
  name: string;             // 대괄호 제거된 순수 이름
  role: string;             // 순수 직책/직위
  fullName: string;         // '이름 (직책)' 형태의 표준 표기
  trust: number;            // 신뢰도 (0 ~ 100)
  affection: number;        // 애정도 또는 우정도 수치 (0 ~ 100)
  trustStage: string;       // 신뢰도 단계 ('친밀', '신뢰', '동반' 등)
  affLabel: '애정도' | '우정도'; // 2차 감정 축 명칭 ('애정도' 또는 '우정도')
  affStage: string;         // 애정도/우정도 단계 ('사랑', '애정', '친우', '붕우' 등)
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
  isFriendship: boolean;    // 동성/비로맨스 우정도 여부
  agenda: NPCAgenda;        // NPC 지능 & 능동적 동기/속마음/행동
}

// 신뢰도 단계 룰: 0-12 경계, 13-24 어색함, 25-37 관심, 38-49 호기심, 50-62 우호, 63-74 친밀, 75-89 신뢰, 90-100 동반
export function getTrustStage(val: number): string {
  if (val <= 12) return '경계';
  if (val <= 24) return '어색함';
  if (val <= 37) return '관심';
  if (val <= 49) return '호기심';
  if (val <= 62) return '우호';
  if (val <= 74) return '친밀';
  if (val <= 89) return '신뢰';
  return '동반';
}

// 우정도 단계 룰: 0-19 타인, 20-39 지인, 40-59 친우, 60-79 붕우, 80-100 맹우
export function getFriendshipStage(val: number): string {
  if (val <= 19) return '타인';
  if (val <= 39) return '지인';
  if (val <= 59) return '친우';
  if (val <= 79) return '붕우';
  return '맹우';
}

// 애정도 단계 룰: 0-19 타인, 20-34 관심, 35-49 호감, 50-64 동경, 65-79 애정, 80-94 사랑, 95-100 극애
export function getAffectionStage(val: number): string {
  if (val <= 19) return '타인';
  if (val <= 34) return '관심';
  if (val <= 49) return '호감';
  if (val <= 64) return '동경';
  if (val <= 79) return '애정';
  if (val <= 94) return '사랑';
  return '극애';
}

// 1. 이름 및 직책 문자열 정규화 (예: "[베르나르도 (성 미카엘 수호대장)]" -> { name: "베르나르도", role: "성 미카엘 수호대장" })
export function sanitizeNameAndRole(rawName: string): { name: string; role: string; fullName: string } {
  if (!rawName) return { name: '미상', role: '', fullName: '미상' };
  
  let cleaned = rawName.trim();
  let name = cleaned;
  let role = '';

  // 패턴 A: [직책] 이름 (예: "[호위 수사] 베르나르도", "[동료] 마테오")
  const prefixTagMatch = cleaned.match(/^\[(.*?)\]\s*(.+)$/);
  if (prefixTagMatch) {
    role = prefixTagMatch[1].trim();
    name = prefixTagMatch[2].trim();
  } else {
    // 겉을 감싼 대괄호 [ ... ] 제거
    cleaned = cleaned.replace(/^\[+|\]+$/g, '').trim();
    name = cleaned;

    // 패턴 B: 이름 (직책)
    const parenMatch = cleaned.match(/^(.*?)\s*[\(\[]\s*(.*?)\s*[\)\]]$/);
    if (parenMatch) {
      name = parenMatch[1].trim().replace(/^\[+|\]+$/g, '').trim();
      role = parenMatch[2].trim().replace(/^\[+|\]+$/g, '').trim();
    }
  }

  // 불필요한 특수문자 정제
  name = name.replace(/[\[\]]/g, '').trim() || '미상';
  role = role.replace(/[\[\]]/g, '').trim();

  const fullName = role ? `${name} (${role})` : name;
  return { name, role, fullName };
}

// 2. 직능(Vocation) 감지 로직
export function detectVocation(role: string, desc: string, name: string = ''): RelationVocation {
  const roleName = `${role} ${name}`;

  // 1) 1차 판별: 직책(role)과 이름(name)을 최우선으로 검사 (설명문에 언급된 플레이어 직위 오염 방지)
  // 상인 / 경제 (마테오 사례 방어: '주교좌 성당 납품 상단', '상단 행수' 등)
  if (
    roleName.includes('행수') || roleName.includes('상단') || roleName.includes('상인') ||
    roleName.includes('점원') || roleName.includes('도제') || roleName.includes('길드') ||
    roleName.includes('환전') || roleName.includes('조합') || roleName.includes('거상') ||
    roleName.includes('납품') || roleName.includes('교역') || roleName.includes('대상인')
  ) {
    return 'merchant';
  }

  // 무관 / 경비 / 군사 (베르나르도 사례 방어: '성 미카엘 수호대장' 등)
  if (
    roleName.includes('수호대') || roleName.includes('경비대') || roleName.includes('호위') ||
    roleName.includes('기사') || roleName.includes('무관') || roleName.includes('용병') ||
    roleName.includes('부대장') || roleName.includes('지휘관') || roleName.includes('단장') ||
    roleName.includes('사병') || roleName.includes('원수') || roleName.includes('방위') ||
    roleName.includes('무력대') || roleName.includes('수호병') || roleName.includes('순찰')
  ) {
    return 'military';
  }

  // 행정 / 궁정 관료 / 봉건 영주 및 미망인·영주 부인 (베아트리체, 엘레오노라)
  if (
    roleName.includes('미망인') || roleName.includes('영주 부인') || roleName.includes('섭정') ||
    roleName.includes('백작') || roleName.includes('공작') || roleName.includes('남작') ||
    roleName.includes('후작') || roleName.includes('자작') || roleName.includes('영주') ||
    roleName.includes('제후') || roleName.includes('국왕') || roleName.includes('황제') ||
    roleName.includes('군주') || roleName.includes('귀족') || roleName.includes('집사') ||
    roleName.includes('서기') || roleName.includes('참모') || roleName.includes('관리인') ||
    roleName.includes('재상') || roleName.includes('시종') || roleName.includes('궁정') ||
    roleName.includes('가신') || roleName.includes('촌장') || roleName.includes('부인')
  ) {
    return 'court';
  }

  // 성직 / 수도
  if (
    roleName.includes('교구장') || roleName.includes('대주교') || roleName.includes('교황') ||
    roleName.includes('추기경') || roleName.includes('총대주교') || roleName.includes('관구장') ||
    roleName.includes('사제') || roleName.includes('신부') || roleName.includes('수도원장') ||
    roleName.includes('수사') || roleName.includes('수도사') || roleName.includes('복사') ||
    roleName.includes('수련수사') || roleName.includes('종정') || roleName.includes('이단심문') ||
    roleName.includes('성직') || (roleName.includes('주교') && !roleName.includes('주교좌'))
  ) {
    return 'clergy';
  }

  // 학자 / 의원
  if (
    roleName.includes('학사') || roleName.includes('교수') || roleName.includes('의원') ||
    roleName.includes('의술') || roleName.includes('연금술') || roleName.includes('천문')
  ) {
    return 'scholar';
  }

  // 2) 2차 판별: 직책이 불명확할 때만 설명문(desc) 보조 검사
  const combined = `${role} ${desc} ${name}`;
  if (combined.includes('행수') || combined.includes('상단') || combined.includes('상인')) return 'merchant';
  if (combined.includes('수호대') || combined.includes('경비대') || combined.includes('호위')) return 'military';
  if (combined.includes('미망인') || combined.includes('영주 부인') || combined.includes('영주') || combined.includes('귀족')) return 'court';
  if (combined.includes('수도원장') || combined.includes('수사') || combined.includes('복사')) return 'clergy';

  return 'commoner';
}

/**
 * 2.5 NPC 자율 지능 및 고유 동기 엔진 (NPC Dynamic Agendas)
 * NPC의 직책, 위계, 직능, 신뢰도 및 플레이어와의 관계를 종합 평가하여
 * 고유한 내부 동기(motives), 속마음(innerThought), 능동적 행동(proactiveAction)을 도출합니다.
 */
export function deriveNPCAgenda(
  name: string,
  role: string,
  vocation: RelationVocation,
  tierId: RelationTierId,
  trust: number,
  affection: number,
  isRomance: boolean,
  desc: string = ''
): NPCAgenda {
  const combined = `${name} ${role} ${desc}`;

  // 1. 특정 주요 네임드 캐릭터 고유 심리 & 지능 규칙
  // 1-1. 오도 주교 (선대 노주교이자 영적 스승/후원자)
  if (combined.includes('오도') || (combined.includes('노주교') && combined.includes('교구장'))) {
    const isRetiringOrInfirm = /병약|안도|맡기|착좌|후계|위임|노주교/.test(combined);
    if (trust >= 70 || isRetiringOrInfirm) {
      return {
        motives: ['교단 안녕', '후계 육성'],
        innerThought: '자신의 쇠약함을 인정하고, 교구의 미래를 온전히 짊어질 플레이어의 성장을 흐뭇하게 지켜보며 평온히 축복함',
        proactiveAction: '교구 주요 성물과 인장 인계 및 사목 전권 위임 발표, 영적 축복 집전'
      };
    }
    return {
      motives: ['교단 지도', '사목 지도'],
      innerThought: '플레이어가 교구의 참된 지도자로 올바르게 성장하도록 자애로운 시선으로 이끌어줌',
      proactiveAction: '교구 참사회 주관 및 사목 활동 평가, 교단 법률 자문'
    };
  }

  // 1-2. 엘레오노라 (카스텔로 영주 부인 겸 단독 섭정 - 로맨스/밀회/임신 또는 정치적 동맹)
  if (combined.includes('엘레오노라') || (combined.includes('영주 부인') && combined.includes('섭정'))) {
    const hasRomanceOrPregnancy = isRomance || affection >= 50 || /밀회|태중|아이|임신|연정|사랑|사모|공모자/.test(combined);
    if (hasRomanceOrPregnancy) {
      return {
        motives: ['애정·유대', '혈통 수호'],
        innerThought: '태중에 잉태된 플레이어의 핏줄과 비밀스러운 연정을 지키기 위해, 주교의 품에 온전히 의탁하며 둘만의 은밀한 미래를 꿈꿈',
        proactiveAction: '은밀한 야간 밀회 및 태중 아이의 안위를 위한 기도와 비밀 서신 교환'
      };
    }
    return {
      motives: ['가문·혈통', '영지 안정'],
      innerThought: trust >= 60
        ? '어린 후계자를 지키고 섭정 권력을 유지하기 위해 주교이자 막후 실력자인 플레이어와의 확고한 동맹을 원함'
        : '자신의 섭정권을 침해받지 않도록 플레이어의 영향력과 의도를 예의주시함',
      proactiveAction: '카스텔로 영지의 중요 외교 기밀 공유 및 사적인 야간 자문 회의 요청'
    };
  }

  // 1-3. 베아트리체 (토착 장원 미망인)
  if (combined.includes('베아트리체') || (combined.includes('미망인') && combined.includes('장원'))) {
    if (isRomance || affection >= 60 || /밀회|연정|사랑/.test(combined)) {
      return {
        motives: ['애정·유대', '영지 보전'],
        innerThought: '엄격한 세속의 시선을 넘어 플레이어에게 깊은 연정을 품고 있으며, 장원과 함께 자신의 마음을 온전히 바치고자 함',
        proactiveAction: '비밀스런 장원 만찬 초대 및 손수 빚은 특산 와인과 사적인 정표 전달'
      };
    }
    return {
      motives: ['가문·혈통', '영지 안정'],
      innerThought: trust >= 60 
        ? '남편 사후 위태로운 장원을 지켜줄 강력한 수호자이자 주교인 플레이어를 온전히 신뢰함'
        : '장원의 소유권을 온전히 보전하기 위해 주교좌 성당과의 관계를 조심스럽게 살핌',
      proactiveAction: '장원 최고급 올리브유 첫 압착분 봉헌 및 비밀스런 장원 만찬 초대'
    };
  }

  // 1-4. 마틸다 (토스카나 여백작)
  if (combined.includes('마틸다')) {
    return {
      motives: ['애정·유대', '가문·혈통'],
      innerThought: affection >= 60
        ? '플레이어의 고위 성직 승격과 안전을 진심으로 염려하며 깊은 애정과 연정을 품고 있음'
        : '플레이어의 곁에서 특별한 존재로 인정받기를 은밀히 갈망함',
      proactiveAction: '피로와 스트레스를 달래줄 향유와 다과 마련 및 사적인 산책 밀회 주선'
    };
  }

  // 1-5. 마테오 (우르비노 상단 행수)
  if (combined.includes('마테오') || (combined.includes('상단') && combined.includes('행수'))) {
    return {
      motives: ['실리·상업', '독점 이권'],
      innerThought: trust >= 60
        ? '플레이어가 교단의 막대한 십일조와 재정을 쥐었으므로 동반자로서 독점 납품권을 영구 공고히 하려 함'
        : '수익성 높은 교역로를 확보하기 위해 주교좌의 칙허와 후원을 적극적으로 타진함',
      proactiveAction: '신규 교역로 개척 수익 및 희귀 향신료 진상, 독점 상업 특허권 갱신 청원'
    };
  }

  // 1-6. 베르나르도 (성 미카엘 수호대장)
  if (combined.includes('베르나르도') || combined.includes('수호대장') || combined.includes('호위대장')) {
    return {
      motives: ['충의·명예', '군사 규율'],
      innerThought: trust >= 60
        ? '주군을 위해 목숨을 바칠 각오가 되어 있으며, 거점 방어와 순찰 기강을 빈틈없이 확립하고자 함'
        : '병사들의 사기와 군수 보급 상태를 엄격히 점검하며 주군의 군령을 기다림',
      proactiveAction: '주야 순찰 보고 및 의용 기사단 증원, 병영 무구 개편 건의'
    };
  }

  // 2. 범용 인물 위계 및 직능 기반 동적 심리 산출 (서사 맥락 감응)
  if (tierId === 'rival') {
    return {
      motives: ['정적 숙청', '위협 견제'],
      innerThought: '플레이어의 급격한 위세 확장을 강하게 경계하며 흠결과 약점을 잡아 실각시킬 기회를 엿봄',
      proactiveAction: '반대파 세력 규합 및 상위 제후/교황청에 비방 투서와 사문서 위조 공작 모의'
    };
  }

  if (tierId === 'superior') {
    const isRetiringOrInfirm = /병약|안도|맡기|착좌|후계|위임|은퇴/.test(combined);
    if (trust >= 75 || isRetiringOrInfirm) {
      return {
        motives: ['후계 양성', '영지 안녕'],
        innerThought: '자신의 신뢰받는 기둥이자 후계자인 플레이어를 깊이 신뢰하며 중대한 사목과 통치 권한을 위임하고자 함',
        proactiveAction: '영지/교구 주요 특권 위임 및 영적·정치적 공식 축복, 공동 정무 주관'
      };
    }
    if (trust < 40) {
      return {
        motives: ['권위 유지', '충성 시험'],
        innerThought: '플레이어의 영향력을 강하게 경계하며 자신을 넘어서지 못하도록 공납과 서약을 지속 시험함',
        proactiveAction: '교구/영지 칙령 준수 여부 감찰 사절 파견 및 특별 십일조/의전 참석 명령'
      };
    }
    return {
      motives: ['기강 확립', '질서 유지'],
      innerThought: '플레이어의 역량을 인정하면서도 상하 위계와 본령의 법도를 엄격히 준수하도록 감독함',
      proactiveAction: '정례 업무 보고 접수 및 상급 기관 하달 칙서 준수 점검'
    };
  }

  if (tierId === 'patron') {
    return {
      motives: ['가문 보호', '상호 실리'],
      innerThought: '자신의 영지와 재산을 지키기 위해 플레이어의 거대한 영적·정치적 영향력에 의탁하려 함',
      proactiveAction: '특별 헌금 및 교회 기부금 전달, 가문 후계자에 대한 성별 강복 요청'
    };
  }

  if (tierId === 'subordinate') {
    return {
      motives: ['가신 충성', '입신양명'],
      innerThought: '주군의 총애를 받아 더 높은 직책과 장원 관리권을 하사받아 가문을 일으키고자 함',
      proactiveAction: '거점 시설 관리 성과 보고 및 직속 자문관 승진 천거'
    };
  }

  // Default: Peer (로맨스, 밀회/혈통 공모 범용 감응)
  if (isRomance || /밀회|태중의 아이|태중|연정|사모/.test(combined)) {
    return {
      motives: ['애정·유대', '혈통 수호'],
      innerThought: '세속의 엄격한 규율 속에서도 플레이어와의 특별한 인연과 태중의 약속을 소중히 지켜나가고자 함',
      proactiveAction: '은밀한 서신 교환 및 사적인 비밀 회동, 혈통의 안위를 위한 기도'
    };
  }

  return {
    motives: vocation === 'military' ? ['무훈·명예', '동료애'] : vocation === 'merchant' ? ['상업 실리', '교역 협력'] : vocation === 'clergy' ? ['교단 연대', '영적 구원'] : ['친선 유지', '정보 공유'],
    innerThought: '플레이어와의 원만한 관계를 유지하여 지역 사회와 권역 내에서의 입지를 강화하려 함',
    proactiveAction: '주변 제후들의 은밀한 동향 및 상업/교구 소문 정보 공유'
  };
}

// 3. 2차원 매트릭스 기반 단일 인물 관계 파싱 함수
export function parsePersonalRelation(
  rawRel: string, 
  playerArchetype: string = 'noble'
): ParsedCharacterRelation {
  let parts: string[];
  if (rawRel.includes('|')) {
    parts = rawRel.split('|').map(s => s.trim());
  } else if (rawRel.includes(':')) {
    // 레거시 콜론 포맷: "이름 (직책) : 설명 (신뢰 X / 호감 Y)" 또는 "[직책] 이름 (신뢰 X / 호감 Y): 설명"
    const colonIdx = rawRel.indexOf(':');
    let firstPart = rawRel.substring(0, colonIdx).trim();
    const restPart = rawRel.substring(colonIdx + 1).trim();

    // 신뢰도/호감도/우정도/애정도 추출
    const trustMatch = rawRel.match(/신뢰(?:도)?\s*[:\s\[\(]?\s*(\d+)/);
    const affMatch = rawRel.match(/(?:호감|우정|애정)(?:도)?\s*[:\s\[\(]?\s*(\d+)/);

    // firstPart에 (신뢰 ... 호감 ...)이 포함되어 있다면 제거하여 순수 이름/직책만 남김
    firstPart = firstPart.replace(/\s*\([^\)]*신뢰[^\)]*\)/, '').trim();

    const tStr = trustMatch ? `신뢰도 [${trustMatch[1]}]` : '';
    const aLabel = rawRel.includes('애정') ? '애정도' : (rawRel.includes('우정') ? '우정도' : '우정도');
    const aStr = affMatch ? `${aLabel} [${affMatch[1]}]` : '';
    parts = [firstPart, tStr, aStr, restPart];
  } else {
    parts = [rawRel];
  }

  const rawName = parts[0] || '';
  const { name, role, fullName } = sanitizeNameAndRole(rawName);

  const trustStr = parts[1] || '';
  const affStr = parts[2] || '';
  const rawDescStr = parts.slice(3).join(' | ').replace(/^관계:\s*/, '').trim();

  // 신뢰도 & 우정도/애정도 숫자 파싱
  const trustMatch = trustStr.match(/(\d+)/);
  const affMatch = affStr.match(/(\d+)/);
  const trust = trustMatch ? Math.min(100, Math.max(0, parseInt(trustMatch[1], 10))) : 50;
  const affection = affMatch ? Math.min(100, Math.max(0, parseInt(affMatch[1], 10))) : 50;

  // 설명문에서 [태그] 추출 및 정제
  const tagMatch = rawDescStr.match(/\[(.*?)\]/);
  const explicitTag = tagMatch ? tagMatch[1].trim() : '';
  const descStr = rawDescStr.replace(/^\[.*?\]\s*/, '').trim();

  // 직능 판별 (직책 우선 판별 SSOT 적용)
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
  const roleNameTarget = `${name} ${role}`;

  // 1. 신뢰도 단계 추출 또는 자동 산정 (대시, 콜론, 괄호 뒤의 단계명 파싱 지원)
  const trustStageMatch = trustStr.match(/(?:[-\u2013\u2014:]|\()\s*\[?([가-힣]+)\]?/) || trustStr.match(/\[([가-힣]+)\]/);
  const trustStage = trustStageMatch ? trustStageMatch[1].trim() : getTrustStage(trust);

  // 2. 특수 상태 및 로맨스/우정도 플래그
  // 주의: '첩', '처' 같은 단일 글자는 '첩자'(간첩), '상처' 등과 오매칭되므로 명확한 복합 명사로 지정
  const romanceKeywords = [
    '연인', '정인', '배우자', '밀회', '은밀한 연인', '연정', '로맨스', 
    '후궁', '첩실', '측실', '소실', '미망인', '아내', '본처', '정실', '약혼', '정혼', '애인'
  ];
  const hasRomanceKeyword = romanceKeywords.some(kw => combined.includes(kw)) || 
    (combined.includes('부인') && !combined.includes('부인하'));
  const isExplicitAff = affStr.includes('애정');
  const isExplicitFriend = affStr.includes('우정');

  // '우정도'가 명시되어 있고 로맨스 키워드가 없으면 엄격히 우정도
  const isRomance = (isExplicitAff || hasRomanceKeyword) && !isExplicitFriend;
  const isFriendship = !isRomance;
  const affLabel: '애정도' | '우정도' = isRomance ? '애정도' : '우정도';

  // 3. 우정도 / 애정도 단계 추출 또는 자동 산정
  const affStageMatch = affStr.match(/(?:[-\u2013\u2014:]|\()\s*\[?([가-힣]+)\]?/) || affStr.match(/\[([가-힣]+)\]/);
  let affStage = '';
  if (affStageMatch) {
    affStage = affStageMatch[1].trim();
  } else if (isRomance) {
    if (combined.includes('광애')) {
      affStage = '광애';
    } else if (combined.includes('집착')) {
      affStage = '집착';
    } else {
      affStage = getAffectionStage(affection);
    }
  } else {
    // 비로맨스 우정도일 때만 맹우/숙적 판별
    if (affStr.includes('맹우') || explicitTag.includes('맹우')) {
      affStage = '맹우';
    } else if (combined.includes('숙적') || combined.includes('라이벌')) {
      affStage = '숙적';
    } else {
      affStage = getFriendshipStage(affection);
    }
  }

  // 1단계: 적대 관계 판별
  const isExplicitRival = explicitTag.includes('적대') || rawDescStr.includes('[적대]') || affStr.includes('숙적') || affStr.includes('라이벌');
  const isKeywordRival = combined.includes('숙적') || combined.includes('라이벌') || combined.includes('원한') || combined.includes('적대자');
  if (isExplicitRival || isKeywordRival) {
    const tierId: RelationTierId = 'rival';
    const agenda = deriveNPCAgenda(name, role, vocation, tierId, trust, affection, isRomance, rawDescStr);
    return {
      id: name,
      raw: rawRel,
      name,
      role,
      fullName,
      trust,
      affection,
      trustStage,
      affLabel,
      affStage: isExplicitRival || isKeywordRival ? (combined.includes('라이벌') ? '라이벌' : '숙적') : affStage,
      descStr,
      rawDescStr,
      tierId,
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
      isRomance,
      isFriendship,
      agenda
    };
  }

  // 2단계: 상급자 차단 게이트 (Superior Blocker)
  // 미망인, 영주 부인, 섭정, 부인, 신도, 상인, 평민은 봉건/교단 서열의 상급자가 될 수 없음 (베아트리체, 엘레오노라, 마테오 사례 철저 방어)
  const isPatronPerson = 
    roleNameTarget.includes('미망인') || 
    roleNameTarget.includes('영주 부인') || 
    roleNameTarget.includes('섭정') || 
    roleNameTarget.includes('신도') || 
    roleNameTarget.includes('과부') ||
    rawDescStr.includes('미망인') ||
    rawDescStr.includes('영주 부인');

  // 진짜 독립 작위 보유자(예: '여백작', '여공작')는 부인이 아니므로 예외 허용
  const isRealRulingNoble = roleNameTarget.includes('여백작') || roleNameTarget.includes('여공작');

  const isBlockedFromSuperior = 
    vocation === 'merchant' || 
    vocation === 'commoner' || 
    (isPatronPerson && !isRealRulingNoble);

  // 3단계: 명시적 상급자 태그 판별 (단, 차단 게이트 통과자만)
  const hasExplicitSuperiorTag = !isBlockedFromSuperior && (explicitTag.includes('상급자') || rawDescStr.includes('[상급자]'));
  
  // 4단계: 키워드 기반 상급자 판별 (기관명 및 설명문 오인식 철저 방어)
  // ★ 중요: 설명문(rawDescStr)에는 '주교 등극에', '주교의 위세에'처럼 플레이어의 신분이 자주 언급되므로,
  // 상급자 여부는 오직 NPC 본인의 이름과 직책(roleNameTarget) 및 명시적 [상급자] 태그로만 판별해야 함!
  const isClergySuperior = 
    roleNameTarget.includes('교구장') || 
    roleNameTarget.includes('대주교') || 
    roleNameTarget.includes('교황') || 
    roleNameTarget.includes('종정') || 
    roleNameTarget.includes('관구장') || 
    roleNameTarget.includes('추기경') || 
    (roleNameTarget.includes('주교') && !roleNameTarget.includes('주교좌') && !roleNameTarget.includes('보좌'));

  const isFeudalSuperior = 
    roleNameTarget.includes('주군') || 
    roleNameTarget.includes('국왕') || 
    roleNameTarget.includes('황제') || 
    roleNameTarget.includes('스승') || 
    (!roleNameTarget.includes('부인') && (roleNameTarget.includes('백작') || roleNameTarget.includes('공작')));

  const isSuperior = !isBlockedFromSuperior && (hasExplicitSuperiorTag || ((isClergySuperior || isFeudalSuperior) && !explicitTag.includes('동료') && !explicitTag.includes('직속부하') && !explicitTag.includes('가신')));

  if (isSuperior) {
    const tierId: RelationTierId = 'superior';
    const agenda = deriveNPCAgenda(name, role, vocation, tierId, trust, affection, isRomance, rawDescStr);
    return {
      id: name,
      raw: rawRel,
      name,
      role,
      fullName,
      trust,
      affection,
      trustStage,
      affLabel,
      affStage,
      descStr,
      rawDescStr,
      tierId,
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
      isRomance,
      isFriendship,
      agenda
    };
  }

  // 5단계: 후원자 / 유력 신도 / 고용주 판별
  const hasExplicitPatronTag = explicitTag.includes('후원자') || rawDescStr.includes('[후원자]');
  const isPatronRole = 
    roleNameTarget.includes('미망인') || 
    roleNameTarget.includes('신도') || 
    roleNameTarget.includes('후원자') || 
    roleNameTarget.includes('영주 부인') || 
    roleNameTarget.includes('영부인') || 
    roleNameTarget.includes('섭정') || 
    roleNameTarget.includes('고용주') || 
    roleNameTarget.includes('의뢰인') ||
    rawDescStr.includes('미망인') ||
    rawDescStr.includes('영주 부인');

  // 상인 직능(마테오 등)은 명시적 [후원자] 태그가 없는 한 기본적으로 협력 '동료(상업 파트너)'로 유지 (설명문 속 '대상인' 수식어 오분류 방어)
  const isMerchantPeer = vocation === 'merchant' && !hasExplicitPatronTag && !role.includes('후원');

  const isPatron = !isMerchantPeer && (hasExplicitPatronTag || isPatronRole || (!isSuperior && (combined.includes('후원자') || combined.includes('신도'))));

  if (isPatron) {
    const tierId: RelationTierId = 'patron';
    const agenda = deriveNPCAgenda(name, role, vocation, tierId, trust, affection, isRomance, rawDescStr);
    return {
      id: name,
      raw: rawRel,
      name,
      role,
      fullName,
      trust,
      affection,
      trustStage,
      affLabel,
      affStage,
      descStr,
      rawDescStr,
      tierId,
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
      isRomance,
      isFriendship,
      agenda
    };
  }

  // 6단계: 직속부하 / 가신 판별 (베르나르도 사례 보정: 호위/수호대/경비대)
  const hasExplicitSubordinateTag = explicitTag.includes('직속부하') || explicitTag.includes('가신') || rawDescStr.includes('[직속부하]') || rawDescStr.includes('[가신]');
  const isSubordinateKeyword = combined.includes('직속부하') || combined.includes('가신') || combined.includes('부관') || combined.includes('시종') || combined.includes('복사') || combined.includes('수련수사') || combined.includes('도제') || combined.includes('사병') || combined.includes('호위') || combined.includes('수호대') || combined.includes('경비대') || combined.includes('호위대') || combined.includes('경호');

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

    const tierId: RelationTierId = 'subordinate';
    const agenda = deriveNPCAgenda(name, role, vocation, tierId, trust, affection, isRomance, rawDescStr);
    return {
      id: name,
      raw: rawRel,
      name,
      role,
      fullName,
      trust,
      affection,
      trustStage,
      affLabel,
      affStage,
      descStr,
      rawDescStr,
      tierId,
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
      isRomance,
      isFriendship,
      agenda
    };
  }

  // 7단계: 기본값 대등한 동료 (Peer)
  const tierId: RelationTierId = 'peer';
  const agenda = deriveNPCAgenda(name, role, vocation, tierId, trust, affection, isRomance, rawDescStr);
  return {
    id: name,
    raw: rawRel,
    name,
    role,
    fullName,
    trust,
    affection,
    trustStage,
    affLabel,
    affStage,
    descStr,
    rawDescStr,
    tierId,
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
    isRomance,
    isFriendship,
    agenda
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

/**
 * 7. LLM 프롬프트 주입용 주요 NPC 지능 및 능동적 아젠다 포맷터
 * 등장인물들이 플레이어의 신분, 행동, 결단에 수동적으로 머무르지 않고
 * 자신의 고유 동기에 따라 아첨, 청탁, 밀회, 견제 등의 자율적 행동을 하도록 유도합니다.
 */
export function formatNPCAgendasForPrompt(
  personalRels: string[] = [],
  playerArchetype: string = 'noble'
): string {
  const parsed = parseAllPersonalRelations(personalRels, playerArchetype);
  if (parsed.length === 0) return '';

  const lines = parsed.slice(0, 7).map(p => {
    return `- [${p.fullName}] (${p.tierLabel} | ${p.affLabel} ${p.affection} [${p.affStage}], 신뢰 ${p.trust} [${p.trustStage}])
  * 고유 동기: ${p.agenda.motives.join(', ')}
  * 내면 심리: "${p.agenda.innerThought}"
  * 능동적 의도 및 권고 행동: ${p.agenda.proactiveAction}`;
  });

  return `[주요 주변 인물들의 지능 및 능동적 심리 상태 (NPC Dynamic Agendas)]
다음 인물들은 단순한 대화 상대가 아니라 각자의 정치적·개인적 야망과 이해관계를 가진 자율적 에이전트입니다.
내러티브와 선택지 생성 시 이들의 고유 동기와 내면 심리, 능동적 행동을 적극 반영하세요:
${lines.join('\n')}`;
}

