import React from "react";
import { Character, Title } from "../lib/game/types";
import { getDynamicCharacterTitle } from "../lib/game/dynamicNaming";

interface Props {
  characterId: string;
  // 실제 게임에서는 전역 Store(예: Redux, Zustand, 게임 엔진 DB)에서 데이터를 가져옵니다.
  getCharacterById: (id: string) => Character | null; 
  getTitleById: (id: string) => Title | null;
}

export default function CharacterPanel({ characterId, getCharacterById, getTitleById }: Props) {
  const character = getCharacterById(characterId);

  // 1. 관계도 오류 방지 (인물이 삭제되었거나 없을 때 안전하게 처리)
  if (!character) {
    return <div className="error-panel">존재하지 않거나 사망한 인물입니다.</div>;
  }

  // 2. 최고 작위 계산 (단일 개체 갱신 로직)
  const highestTitleId = character.heldTitleIds[character.heldTitleIds.length - 1]; 
  const highestTitle = getTitleById(highestTitleId);
  
  const { fullName, iconUrl } = highestTitle 
    ? getDynamicCharacterTitle(character, highestTitle)
    : { fullName: `평민 ${character.name}`, iconUrl: "/icons/peasant.png" };

  return (
    <div className="character-window border-2 border-gold p-4">
      {/* 동적 아이콘 및 명칭 표시 */}
      <div className="header flex items-center gap-3">
        {/* 임시 아이콘 (실제 프로젝트에서는 public/icons/... 경로에 이미지 배치 필요) */}
        <div className="w-12 h-12 bg-gray-300 flex items-center justify-center text-xs overflow-hidden">
          {iconUrl ? iconUrl.split("/").pop() : "No Icon"}
        </div>
        <h2 className="text-xl font-bold">{fullName}</h2>
      </div>

      {/* 80/100 고정 포맷 스트레스 표기 */}
      <div className="stats mt-4">
        <div className="stat-row">
          <span>스트레스: </span>
          {/* GameStat 클래스의 toString()을 호출하여 '현재/최대' 포맷 강제 */}
          <span className="font-mono text-red-500">{character.stress.toString()}</span>
        </div>
      </div>
      
      {/* 관계도 리스트 (ID 기반 렌더링으로 오류 차단) */}
      <div className="relations mt-4">
        <h3 className="font-semibold mb-2">관계도</h3>
        <ul className="list-disc pl-5">
          {Object.entries(character.relations).map(([targetId, score]) => {
            const targetChar = getCharacterById(targetId);
            return (
              <li key={targetId}>
                {targetChar ? targetChar.name : "알 수 없는 인물 (사망)"} : {score}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
