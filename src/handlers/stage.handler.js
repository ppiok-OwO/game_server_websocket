// 유저는 스테이지를 하나씩 올라갈 수 있다.
// 유저는 일정 점수가 되면 다음 스테이지로 이동한다.

import { getGameAssets } from '../init/asset.js';
import { getStage, setStage } from '../models/stage.model.js';

export const moveStageHandler = async (uuid, payload) => {
  // 유저의 현재 스테이지 정보
  let currentStages = getStage(uuid);
  if (!currentStages.length) {
    console.log('No stages found for user');
    return { status: 'fail', message: 'No stages found for user' };
  }

  console.log(`Client Stages: `, payload.currentStage);
  console.log(`Sever Stage: `, currentStages);

  // 오름차순 -> 가장 큰 스테이지 ID를 확인 <- 유저의 현재 스테이지
  currentStages.sort((a, b) => b.id - a.id);
  const currentStage = currentStages[0];

  // 클라이언트 vs 서버 비교
  if (currentStage.id !== payload.currentStage) {
    console.log('Server currentStage:', currentStage.id);
    console.log('Client currentStage:', payload.currentStage);
    return { status: 'fail', message: 'Current stage mismatch' };
  }

  // 점수 검증 절차
  const serverTime = Date.now(); // 현재 타임스탬프
  const elapsedTime = (serverTime - currentStage.timestamp) / 1000; // 단위가 밀리세컨드기 때문에 초단위로 계산하려면 1000으로 나누어줘야 한다.
  console.log('Elapsed time:', elapsedTime);

  // 임의로 정한 오차범위(±0.5)를 넘었을 경우 fail
  if (elapsedTime < 9.5 || elapsedTime > 10.5) {
    console.log('Server elapsedTime:', elapsedTime);
    return { status: 'fail', message: 'Invalid elapsed time' };
  }

  // targetStage에 대한 검증 <- 게임 에셋에 존재하는 스테이지인가?
  const { stages } = getGameAssets();
  if (!stages.data.some((stage) => stage.id === payload.targetStage)) {
    return { status: 'fail', message: 'Target stage not found' };
  }

  await setStage(uuid, payload.targetStage, serverTime);
  console.log('Stage successfully updated to:', payload.targetStage);
  return { status: 'success' };
};

