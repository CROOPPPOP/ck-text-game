/**
 * 실시간 시간 엔진 (Real-Time Time Engine)
 * - 1분 = 1달 (60초 = 30일, 2초 = 1일 at 1x)
 * - 1년 = 12분 (720초)
 * - 스피드 배속: 0(일시정지), 1(1x 보통), 2(2x 가속), 4(4x 초고속)
 */

export interface GameDate {
  year: number;
  month: number; // 1 ~ 12
  day: number;   // 1 ~ 30
  season: '봄' | '여름' | '가을' | '겨울';
}

export type GameSpeed = 0 | 1 | 2 | 4;

export const SECONDS_PER_MONTH = 60; // 1x 기준 60초 = 1달
export const DAYS_PER_MONTH = 30;    // 1달 = 30일
export const SECONDS_PER_DAY = 2;     // 1x 기준 2초 = 1일

export function getSeason(month: number): '봄' | '여름' | '가을' | '겨울' {
  if (month >= 3 && month <= 5) return '봄';
  if (month >= 6 && month <= 8) return '여름';
  if (month >= 9 && month <= 11) return '가을';
  return '겨울';
}

/**
 * 날짜 및 위치 문자열(예: "1066년 10월 14일 (가을) / 노르망디 루앙 성채 [턴 수: 1]") 파싱
 */
export function parseDateLocation(dateLocStr?: string): { date: GameDate; location: string; turn?: number } {
  let year = 1066;
  let month = 10;
  let day = 14;
  let location = '루앙 성채';
  let turn: number | undefined = undefined;

  if (dateLocStr) {
    const yMatch = dateLocStr.match(/(\d+)년/);
    if (yMatch) year = parseInt(yMatch[1], 10);

    const mMatch = dateLocStr.match(/(\d+)월/);
    if (mMatch) month = Math.min(12, Math.max(1, parseInt(mMatch[1], 10)));

    const dMatch = dateLocStr.match(/(\d+)일/);
    if (dMatch) day = Math.min(30, Math.max(1, parseInt(dMatch[1], 10)));

    const turnMatch = dateLocStr.match(/\[\s*턴\s*수\s*[:：]\s*(\d+)\s*\]/);
    if (turnMatch) turn = parseInt(turnMatch[1], 10);

    const locMatch = dateLocStr.match(/\/\s*(.*?)(?:\s*\[턴 수|$)/);
    if (locMatch && locMatch[1].trim()) {
      location = locMatch[1].trim();
    }
  }

  const season = getSeason(month);

  return {
    date: { year, month, day, season },
    location,
    turn
  };
}

/**
 * GameDate 객체를 표준 날짜/위치 문자열로 포맷팅
 */
export function formatDateLocation(date: GameDate, location: string, turn?: number): string {
  const turnSuffix = typeof turn === 'number' ? ` [턴 수: ${turn}]` : '';
  return `${date.year}년 ${String(date.month).padStart(2, '0')}월 ${String(date.day).padStart(2, '0')}일 (${date.season}) / ${location}${turnSuffix}`;
}

/**
 * UI 표시용 정제된 날짜 문자열
 */
export function formatCleanDate(date: GameDate): string {
  return `${date.year}년 ${date.month}월 ${date.day}일 (${date.season})`;
}

export interface TimeAdvanceResult {
  newDate: GameDate;
  daysAdvanced: number;
  monthsAdvanced: number;
  yearsAdvanced: number;
  monthTicked: boolean;
  yearTicked: boolean;
  leftoverSeconds: number; // 다음 틱으로 넘길 잉여 초
  monthProgressPercent: number; // 0 ~ 100%
}

/**
 * 경과 시간(초)에 따라 GameDate 전진
 * @param currentDate 현재 날짜
 * @param elapsedSeconds 이번 프레임에서 경과한 실제 초 (deltaTime)
 * @param speed 현재 게임 속도 (0, 1, 2, 4)
 * @param accumulatedSeconds 직전 프레임에서 이월된 잔여 초
 */
export function advanceGameTime(
  currentDate: GameDate,
  elapsedSeconds: number,
  speed: GameSpeed,
  accumulatedSeconds: number = 0
): TimeAdvanceResult {
  if (speed === 0 || elapsedSeconds <= 0) {
    return {
      newDate: { ...currentDate },
      daysAdvanced: 0,
      monthsAdvanced: 0,
      yearsAdvanced: 0,
      monthTicked: false,
      yearTicked: false,
      leftoverSeconds: accumulatedSeconds,
      monthProgressPercent: Math.round(((currentDate.day - 1) / DAYS_PER_MONTH) * 100)
    };
  }

  // speed가 곱해진 유효 게임 시간 (초)
  const totalEffectiveSeconds = accumulatedSeconds + elapsedSeconds * speed;
  const daysToAdvance = Math.floor(totalEffectiveSeconds / SECONDS_PER_DAY);
  const leftoverSeconds = totalEffectiveSeconds % SECONDS_PER_DAY;

  if (daysToAdvance === 0) {
    return {
      newDate: { ...currentDate },
      daysAdvanced: 0,
      monthsAdvanced: 0,
      yearsAdvanced: 0,
      monthTicked: false,
      yearTicked: false,
      leftoverSeconds,
      monthProgressPercent: Math.round(((currentDate.day - 1) / DAYS_PER_MONTH) * 100)
    };
  }

  let year = currentDate.year;
  let month = currentDate.month;
  let day = currentDate.day + daysToAdvance;
  let monthsAdvanced = 0;
  let yearsAdvanced = 0;

  while (day > DAYS_PER_MONTH) {
    day -= DAYS_PER_MONTH;
    month += 1;
    monthsAdvanced += 1;
    if (month > 12) {
      month = 1;
      year += 1;
      yearsAdvanced += 1;
    }
  }

  const season = getSeason(month);
  const monthTicked = monthsAdvanced > 0;
  const yearTicked = yearsAdvanced > 0;

  return {
    newDate: { year, month, day, season },
    daysAdvanced: daysToAdvance,
    monthsAdvanced,
    yearsAdvanced,
    monthTicked,
    yearTicked,
    leftoverSeconds,
    monthProgressPercent: Math.round(((day - 1) / DAYS_PER_MONTH) * 100)
  };
}
