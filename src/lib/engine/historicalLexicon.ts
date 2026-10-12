// ==========================================
// 6대 지리·문화권별 역사 고증 어휘집 (Historical Lexicon Engine)
// ==========================================

export interface HistoricalCultureLexicon {
  id: string;
  label: string;
  currencyMajor: string; // 주요 금화 화폐
  currencyMinor: string; // 보조 은화/동화 화폐
  marshalTitle: string;  // 무관장 / 군사 지휘관
  stewardTitle: string;  // 재정관 / 수석 집사
  chancellorTitle: string; // 외교관 / 대법관
  monarchTitle: string;  // 군주에 대한 존칭
  knightTitle: string;   // 정예 기사 호칭
  infantryTitle: string; // 보병 호칭
  castleTitle: string;   // 성채/거점 호칭
  distanceUnit: string;  // 거리 단위
}

export const CULTURE_LEXICONS: Record<string, HistoricalCultureLexicon> = {
  french_norman: {
    id: 'french_norman',
    label: '서유럽 프랑스·노르만 문화권',
    currencyMajor: '금화 리브르 (Livre)',
    currencyMinor: '은화 드니에 (Denier)',
    marshalTitle: '코네타블 (Connétable)',
    stewardTitle: '세네샬 (Sénéchal)',
    chancellorTitle: '상슬리에 (Chancelier)',
    monarchTitle: '주군 각하 (Monseigneur)',
    knightTitle: '슈발리에 (Chevalier)',
    infantryTitle: '세르장 (Sergent)',
    castleTitle: '샤토 (Château)',
    distanceUnit: '리 (Lieue)'
  },
  germanic_hre: {
    id: 'germanic_hre',
    label: '신성로마제국 게르만 제후권',
    currencyMajor: '금화 굴덴 (Gulden)',
    currencyMinor: '은화 탈러 (Thaler)',
    marshalTitle: '마르샬크 (Marschall)',
    stewardTitle: '캄머마이스터 (Kammermeister)',
    chancellorTitle: '칸츨러 (Kanzler)',
    monarchTitle: '영주 각하 (Mein Herr)',
    knightTitle: '리터 (Ritter)',
    infantryTitle: '란츠크네히트 (Landsknecht)',
    castleTitle: '부르크 (Burg)',
    distanceUnit: '마일 (Meile)'
  },
  byzantine: {
    id: 'byzantine',
    label: '동로마 비잔티움 정교권',
    currencyMajor: '금화 히페르피론 (Hyperpyron)',
    currencyMinor: '은화 밀리아레시온 (Miliaresion)',
    marshalTitle: '도메스티코스 (Domestikos)',
    stewardTitle: '로그라테스 (Logothete)',
    chancellorTitle: '프로토노타리오스 (Protonotarios)',
    monarchTitle: '바실레우스 (Basileus)',
    knightTitle: '카타프락토이 (Kataphraktoi)',
    infantryTitle: '스쿠타토이 (Skutatoi)',
    castleTitle: '카스트론 (Kastron)',
    distanceUnit: '스타디온 (Stadion)'
  },
  islamic_levante: {
    id: 'islamic_levante',
    label: '이슬람 레반트·안달루스 문화권',
    currencyMajor: '금화 디나르 (Dinar)',
    currencyMinor: '은화 디르함 (Dirham)',
    marshalTitle: '에미르 알 우마라 (Amir al-Umara)',
    stewardTitle: '와지르 알 말리야 (Wazir)',
    chancellorTitle: '카디 알 쿠다트 (Qadi)',
    monarchTitle: '술탄 전하 (Sayyidi)',
    knightTitle: '파리스 (Faris)',
    infantryTitle: '맘루크 (Mamluk)',
    castleTitle: '카스바 (Kasbah)',
    distanceUnit: '파르상 (Farsakh)'
  },
  italian_republic: {
    id: 'italian_republic',
    label: '이탈리아 해양공화국 무역권',
    currencyMajor: '금화 두카트 (Ducat)',
    currencyMinor: '은화 그로소 (Grosso)',
    marshalTitle: '카피타노 제네랄레 (Capitano Generale)',
    stewardTitle: '카메를렌고 (Camerlengo)',
    chancellorTitle: '칸첼리에레 (Cancelliere)',
    monarchTitle: '총독 각하 (Messere)',
    knightTitle: '콘도티에로 (Condottiero)',
    infantryTitle: '발레스트리에레 (석궁병)',
    castleTitle: '팔라초 (Palazzo)',
    distanceUnit: '밀리오 (Miglio)'
  },
  scandinavian_baltic: {
    id: 'scandinavian_baltic',
    label: '북유럽 스칸디나비아·발트 문화권',
    currencyMajor: '은화 마르크 (Mark)',
    currencyMinor: '은화 페닝 (Penning)',
    marshalTitle: '마르스크 (Marsk)',
    stewardTitle: '호프마이스터 (Hofmeister)',
    chancellorTitle: '칸슬레르 (Kansler)',
    monarchTitle: '군주 영식 (Herre)',
    knightTitle: '후스카를 (Huscarl)',
    infantryTitle: '본데 (Bonde 장창병)',
    castleTitle: '보르그 (Borg)',
    distanceUnit: '밀 (Mil)'
  }
};

/**
 * 텍스트나 지역/문화 문자열로부터 가장 적합한 고증 어휘집 자동 추론
 */
export function getLexiconByCultureOrLocation(str?: string): HistoricalCultureLexicon {
  if (!str) return CULTURE_LEXICONS.french_norman;
  const s = str.toLowerCase();

  if (s.includes('독일') || s.includes('제국') || s.includes('게르만') || s.includes('바이에른') || s.includes('라인') || s.includes('오스트리아')) {
    return CULTURE_LEXICONS.germanic_hre;
  }
  if (s.includes('비잔티움') || s.includes('콘스탄티노폴리스') || s.includes('그리스') || s.includes('동로마') || s.includes('정교')) {
    return CULTURE_LEXICONS.byzantine;
  }
  if (s.includes('이슬람') || s.includes('안달루스') || s.includes('레반트') || s.includes('예루살렘') || s.includes('카이로') || s.includes('셀주크')) {
    return CULTURE_LEXICONS.islamic_levante;
  }
  if (s.includes('베네치아') || s.includes('제노바') || s.includes('이탈리아') || s.includes('피렌체') || s.includes('밀라노')) {
    return CULTURE_LEXICONS.italian_republic;
  }
  if (s.includes('노르드') || s.includes('바이킹') || s.includes('스웨덴') || s.includes('덴마크') || s.includes('발트') || s.includes('튜턴')) {
    return CULTURE_LEXICONS.scandinavian_baltic;
  }

  // 기본값: 서유럽 프랑스·노르만 봉건권
  return CULTURE_LEXICONS.french_norman;
}

/**
 * 텍스트 템플릿 내의 치환 태그({{CURRENCY_MAJOR}} 등)를 고증 어휘로 주입
 */
export function injectHistoricalLexicon(templateText: string, lexicon: HistoricalCultureLexicon): string {
  return templateText
    .replace(/\{\{CURRENCY_MAJOR\}\}/g, lexicon.currencyMajor)
    .replace(/\{\{CURRENCY_MINOR\}\}/g, lexicon.currencyMinor)
    .replace(/\{\{MARSHAL\}\}/g, lexicon.marshalTitle)
    .replace(/\{\{STEWARD\}\}/g, lexicon.stewardTitle)
    .replace(/\{\{CHANCELLOR\}\}/g, lexicon.chancellorTitle)
    .replace(/\{\{MONARCH\}\}/g, lexicon.monarchTitle)
    .replace(/\{\{KNIGHT\}\}/g, lexicon.knightTitle)
    .replace(/\{\{INFANTRY\}\}/g, lexicon.infantryTitle)
    .replace(/\{\{CASTLE\}\}/g, lexicon.castleTitle)
    .replace(/\{\{DISTANCE\}\}/g, lexicon.distanceUnit);
}
