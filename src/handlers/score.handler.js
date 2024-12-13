import { getGameAssets } from '../init/asset.js';
import { getStage, setStage } from '../models/stage.model.js';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

const scores = {}; // 유저의 현재 스코어 배열
const highScores = {}; // 유저의 최고 스코어 배열

export const setScore = async (userId) => {
  scores[userId] = [];
};

export const getScore = async (userId) => {
  return scores[userId];
};

export const obtainScore = async (userId, payload) => {
  // 재료의 id와 획득한 점수, 현재 스테이지id, timestamp를 받아야 한다.
  const { clientIngId, clientScore, clientStageId, clientTimestamp } = payload;

  // ingredientId를 바탕으로 재료의 스코어구하기
  const { ingredients } = getGameAssets();
  const serverIngScore = ingredients.data[clientIngId - 1].score;

  // 현재 스테이지에서 획득할 수 있는 아이템인지 검증
  const { ingredientUnlocks } = getGameAssets();

  // 1스테이지엔 1번 타입 재료들이 언락 되고, 2스테이지엔 2번 타입 재료들이 언락되고...반복하기 때문에 재료의 타입 - 1 = 언락 스테이지
  const serverIngType = ingredients.data[clientIngId - 1].type;
  const ingUnlockStageId = ingredientUnlocks.data[serverIngType - 1].stage_id;
  // 재료를 획득한 스테이지가 재료가 언락되는 스테이지보다 작은 id를 가졌을 때
  if (clientStageId < ingUnlockStageId) {
    return {
      status: 'fail',
      message: 'Score obtained through unauthorized means',
    };
  }

  // 재료를 획득하는 빈도 검증하기(어뷰저 적발)
  // 최근 5번의 재료 획득 timestamp를 추출하고, 가장 최근의 5번째 요소-1번째 요소 => 1초 미만이라면 어뷰저로 판단한다.
  let currentScores = await getScore(userId);

  if (currentScores.length >= 5) {
    currentScores.sort((a, b) => b.timestamp - a.timestamp);
    const recentFiveRecord = currentScores.slice(0, 5);
    if (
      (recentFiveRecord[4].timestamp - recentFiveRecord[0].timestamp) / 1000 <
      1
    ) {
      return {
        status: 'fail',
        message: 'Score obtained through unauthorized means',
      };
    }
  }

  // 검증이 끝났다면 캐릭터가 획득한 스코어를 서버에도 기록해둔다.
  // 최종: 클라이언트와 서버 간의 총 스코어가 동일해졌는지 검증
  try {
    await setScore(userId);
    scores[userId].push({ score: serverIngScore, timestamp: clientTimestamp });

    const serverScore = await getScore(userId);
    if (clientScore !== serverScore) {
      return { status: 'fail', message: 'Score mismatch' };
    }
  } catch (err) {
    console.error(err.message);
  }
};
