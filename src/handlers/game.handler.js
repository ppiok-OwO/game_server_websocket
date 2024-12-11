import { getGameAssets } from '../init/asset.js';
import { setStage, getStage, clearStage } from '../models/stage.model.js';

export const gameStart = (uuid, payload) => {
  const { stages } = getGameAssets();

  // 게임을 새로 시작할 때 세션 배열 초기화
  clearStage(uuid);

  // stages 배열에서 0번째 = 첫 번째 스테이지
  setStage(uuid, stages.data[0].id, payload.timestamp);
  console.log(`Stage: `, getStage(uuid));

  return { status: 'success' };
};

export const gameEnd = (payload, uuid) => {
  // 클라이언트는 게임 종료 시 타임스탬프와 총 점수를 줄 것이다.
  const { timestamp: gameEndTime, score } = payload;
  const stages = getStage(uuid);

  if (!stages) {
    return { staus: 'fail', message: 'No stages found for user' };
  }

  // 각 스테이지의 지속 시간을 계산하여 총 점수 계산
  let totalScore = 0;

  stages.forEach((stage, index) => {
    let stageEndTime;
    if (index === stages.length - 1) {
      stageEndTime = gameEndTime; // 반복문이 끝나기 직전이라면, 현재 timestamp가 곧 gameEndTime이다.
    } else {
      stageEndTime = stages[index + 1].timestamp; // 반복문의 마지막이 아니라면 다음 스테이지의 timestamp를 stageEndTime으로 가져와라
    }

    const stageDuration = (stageEndTime - stage.timestamp) / 1000;
    totalScore += stageDuration; // 초당 1점
  });

  // 점수와 타임스탬프 검증 (예: 클라이언트가 보낸 총점과 계산된 총점 비교)
  // 오차범위 5
  if (Math.abs(score - totalScore) > 5) {
    return { status: 'fail', message: 'Score verification failed' };
  }

  // 모든 검증이 통과된 후, 클라이언트에서 제공한 점수 저장하는 로직
  // saveGameResult(userId, clientScore, gameEndTime);

  // 검증이 통과되면 게임 종료 처리
  return { status: 'success', message: 'Game ended successfully', score };
};
