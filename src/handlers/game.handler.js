import { getGameAssets } from '../init/asset.js';
import { setStage, getStage, clearStage } from '../models/stage.model.js';
import { getScore, removeScore } from './score.handler.js';

export const gameStart = (uuid, payload) => {
  const { stages } = getGameAssets();

  // 게임을 새로 시작할 때 세션 배열 초기화
  clearStage(uuid);
  console.log(`After clearStage: `, getStage(uuid));

  // stages 배열에서 0번째 = 첫 번째 스테이지
  setStage(uuid, stages.data[0].id, payload.timestamp);
  console.log(`Stage: `, getStage(uuid));

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

  removeScore(uuid);

  // 검증이 통과되면 게임 종료 처리
  return { status: 'success', message: `Game Over: ${recentScore}` };
};

export const gameEnd = async (uuid, payload) => {
  let recentScore = 0;
  const currentScores = await getScore(uuid, 1);

  if (currentScores) {
    recentScore = currentScores[0]?.score;

    removeScore(uuid);
  }

  // 검증이 통과되면 게임 종료 처리
  return { status: 'success', message: 'Game ended successfully', recentScore };
};
