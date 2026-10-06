import { Character, Title } from "./types";

// 인물의 최고 작위에 따라 동적 이름과 아이콘을 반환하는 함수
export function getDynamicCharacterTitle(character: Character, highestTitle: Title) {
  const { culture, government } = character;
  const { tier, baseName } = highestTitle;

  let titleName = "";
  let iconUrl = "";

  // 동양 관료제 로직
  if (culture === "Eastern" && government === "Bureaucracy") {
    if (tier === 1) {
      titleName = `${baseName} 현령`;
      iconUrl = "/icons/magistrate_office.png";
    } else if (tier === 2) {
      titleName = `${baseName} 태수`;
      iconUrl = "/icons/prefect_palace.png";
    }
  } 
  // 서양 봉건제 로직
  else if (culture === "Western" && government === "Feudal") {
    if (tier === 1) {
      titleName = `${baseName} 남작`;
      iconUrl = "/icons/barony_castle.png";
    } else if (tier === 2) {
      titleName = `${baseName} 백작`;
      iconUrl = "/icons/county_castle.png";
    }
  }

  // 최종 조합된 칭호: 예) "장안 태수 이백"
  return {
    fullName: `${titleName} ${character.name}`,
    iconUrl,
  };
}
