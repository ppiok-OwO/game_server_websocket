// 유저는 스테이지를 하나씩 올라갈 수 있다.
// 유저는 일정 점수가 되면 다음 스테이지로 이동한다.

import { getGameAssets } from '../init/asset.js';
import { getStage, setStage } from '../models/stage.model.js';

export const getStageId = async (userId, payload) => {
  // 유저의 현재 스테이지 정보(서버 기준)
  const serverStages = await getStage(userId, 1);
  if (!serverStages) {
    console.log('No stages found for user');
    return { status: 'fail', message: 'No stages found for user' };
  }

  const serverStageId = serverStages[0].id;

  let result = { status: 'success', message: serverStageId };
  return result;
};

export const moveStageHandler = async (userId, payload) => {
  // 가장 최근 스테이지를 확인
  const serverStage = await getStage(userId, 1);
  if (!serverStage) {
    console.log('No stages found for user');
    return { status: 'fail', message: 'No stages found for user' };
  }

  console.log(`Sever Stage: `, serverStage);
  console.log(`Client Stages: `, payload.currentStage);

  // 클라이언트 vs 서버 비교
  if (serverStage[0].id !== payload.currentStage) {
    console.log('Server currentStage:', serverStage[0].id);
    console.log('Client currentStage:', payload.currentStage);
    return { status: 'fail', message: 'Current stage mismatch' };
  }

  // 점수 검증 절차
  const serverTime = Date.now(); // 현재 타임스탬프
  const elapsedTime = (serverTime - serverStage[0].timestamp) / 1000; // 단위가 밀리세컨드기 때문에 초단위로 계산하려면 1000으로 나누어줘야 한다.
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

  await setStage(userId, payload.targetStage, serverTime);
  console.log('Stage successfully updated to:', payload.targetStage);
  return { status: 'success' };
};
