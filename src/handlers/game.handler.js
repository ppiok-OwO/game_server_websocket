import { getGameAssets } from '../init/asset.js';
import { setStage, getStage, removeStage } from '../models/stage.model.js';
import { removeInventory } from './inventory.handler.js';
import { getScore, removeScore } from './score.handler.js';

export const gameStart = async (uuid, payload) => {
  const { stages } = getGameAssets();

  // 게임을 새로 시작할 때 세션 배열 초기화
  removeStage(uuid);
  removeScore(uuid);
  removeInventory(uuid);

  // stages 배열에서 0번째 = 첫 번째 스테이지
  await setStage(uuid, stages.data[0].id, payload.timestamp);
  // console.log(`Stage: `, getStage(uuid, 1));

  return { status: 'success' };
};

export const gameOver = async (uuid, payload) => {
  const currentScores = await getScore(uuid, 1);
  let recentScore;
  if (!currentScores || currentScores.length === 0) {
    recentScore = 0;
  }
  recentScore = currentScores[0]?.score || 0;
  console.log(`recentScore: ${recentScore}`);

  // 검증이 통과되면 게임 종료 처리
  return { status: 'success', message: `Game Over: ${recentScore}` };
};

export const gameEnd = async (uuid, payload) => {
  let recentScore = 0;
  const currentScores = await getScore(uuid, 1);

  if (currentScores) {
    recentScore = currentScores[0]?.score;
  }

  // 검증이 통과되면 게임 종료 처리
  return {
    status: 'success',
    message: 'Game ended successfully!',
    recentScore,
  };
};
