// 1. 정부 형태와 문화권 정의
export type GovernmentType = "Feudal" | "Theocracy" | "Bureaucracy";
export type Culture = "Western" | "Eastern";

// 2. 고정 포맷 상태 클래스 ('80/100' 구조체)
export class GameStat {
  constructor(public current: number, public max: number) {}

  // 값을 변경할 때 항상 0 ~ max 사이로 고정 (Clamping)
  modify(amount: number) {
    this.current = Math.max(0, Math.min(this.max, this.current + amount));
  }

  // 항상 '현재값/최대값' 포맷으로 출력
  toString(): string {
    return `${this.current}/${this.max}`;
  }
}

// 3. 인물, 거점, 작위 인터페이스 (직접 참조 금지, ID 참조 사용)
export interface Character {
  id: string; // 고유 ID
  name: string;
  culture: Culture;
  government: GovernmentType;
  stress: GameStat; // 스트레스 상태
  heldTitleIds: string[]; // 작위 객체를 직접 담지 않고 ID 배열만 저장
  relations: Record<string, number>; // { "대상_인물_ID": 관계도수치 }
}

export interface Title {
  id: string;
  tier: number; // 1: 남작/현령, 2: 백작/태수...
  baseName: string;
  holdingType: "Castle" | "Temple" | "City";
}
