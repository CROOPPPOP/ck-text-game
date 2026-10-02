"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLLMResponse = parseLLMResponse;
function parseLLMResponse(text) {
    var result = {};
    // 헬퍼 함수: 특정 헤더(예: '현재 상황') 안의 내용을 추출합니다.
    var extractSection = function (headerPattern) {
        // 【 헤더 】 부터 다음 【 헤더 】가 나오기 전까지 추출
        var regex = new RegExp("\u3010 ".concat(headerPattern, " \u3011\\n([\\s\\S]*?)(?=\\n\u3010 |$)"));
        var match = text.match(regex);
        return match ? match[1].trim() : null;
    };
    // 1. 현재 상황 (메인 서사)
    result.narrative = extractSection('현재 상황') || undefined;
    // 2. 날짜 / 위치
    result.dateLocation = extractSection('날짜 / 위치') || undefined;
    // 3. 판정 결과 (있을 경우)
    result.judgment = extractSection('판정 결과') || undefined;
    // 4. 개인 정보 파싱 (이름: 유비 | 나이: 32세 ...)
    var personalInfoMatch = extractSection('개인 정보');
    if (personalInfoMatch) {
        var info_1 = {};
        personalInfoMatch.split('|').forEach(function (part) {
            var _a = part.split(':').map(function (s) { return s.trim(); }), key = _a[0], value = _a[1];
            if (key && value)
                info_1[key] = value;
        });
        result.personalInfo = info_1;
    }
    // 5. 플레이어 상태 파싱 (예: [건강](86, 최상 — 전반적으로 양호))
    var playerStatusMatch = extractSection('플레이어 상태');
    if (playerStatusMatch) {
        result.playerStatus = [];
        var lines = playerStatusMatch.split('\n');
        lines.forEach(function (line) {
            var match = line.match(/\[(.*?)\]\((.*?),\s*(.*?)\s*—\s*(.*?)\)/);
            if (match) {
                result.playerStatus.push({
                    name: match[1].trim(),
                    value: match[2].trim(),
                    risk: match[3].trim(),
                    description: match[4].trim()
                });
            }
        });
    }
    // 6. 개인 능력치 파싱 (선천/후천 카테고리 무시하고 키-값만 추출)
    var statsMatch = extractSection('개인 능력치');
    if (statsMatch) {
        result.stats = {};
        var statsLines = statsMatch.split('\n');
        statsLines.forEach(function (line) {
            if (!line.startsWith('[')) {
                line.split('|').forEach(function (part) {
                    var _a = part.split(':').map(function (s) { return s.trim(); }), key = _a[0], value = _a[1];
                    if (key && value)
                        result.stats[key] = value;
                });
            }
        });
    }
    // 7. 소지품 / 자원 파싱
    var inventoryMatch = extractSection('소지품 / 자원');
    if (inventoryMatch) {
        result.inventory = {};
        var currentCategory_1 = '';
        var lines = inventoryMatch.split('\n');
        lines.forEach(function (line) {
            if (line.startsWith('▶')) {
                currentCategory_1 = line.replace('▶', '').replace('<', '').replace('>', '').replace(':', '').trim();
                result.inventory[currentCategory_1] = [];
            }
            else if (line.startsWith('○') && currentCategory_1) {
                result.inventory[currentCategory_1].push(line.replace('○', '').trim());
            }
        });
    }
    // 8. 선택지 파싱 (여러 종류의 선택지 블록을 모두 탐색)
    var choices = [];
    var choiceBlocks = text.match(/【 (.*?) 선택지 】\n([\s\S]*?)(?=\n【 |$)/g);
    if (choiceBlocks) {
        choiceBlocks.forEach(function (block) {
            var blockLines = block.split('\n');
            var currentChoice = null;
            blockLines.forEach(function (line) {
                // 정규식: "1. [일반 행동] 서신을 숨긴다." 추출
                var choiceMatch = line.match(/^(\d+)\.\s*\[(.*?)\]\s*(.*)/);
                if (choiceMatch) {
                    if (currentChoice)
                        choices.push(currentChoice);
                    currentChoice = {
                        id: choiceMatch[1],
                        type: choiceMatch[2],
                        text: choiceMatch[3].trim(),
                        probability: ''
                    };
                }
                else if (line.includes('예상 성공 가능성:') || line.includes('예상 승리 가능성:') || line.includes('판정:')) {
                    if (currentChoice)
                        currentChoice.probability = line.replace('└', '').trim();
                }
            });
            if (currentChoice)
                choices.push(currentChoice);
        });
        result.choices = choices;
    }
    return result;
}
