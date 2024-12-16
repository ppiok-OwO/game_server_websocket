import { getGameAssets } from '../init/asset.js';
import { getStage, setStage } from '../models/stage.model.js';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

const scores = {}; // 유저의 현재 스코어 객체
const highScores = {}; // 유저의 최고 스코어 객체

export const setScore = async (userId, score) => {
  const timestamp = Date.now();

  // 유저별 스코어 배열 초기화
  if (!scores[userId]) {
    scores[userId] = [];
  }

  // 가장 최근 기록된 스코어 가져오기
  const recentScore =
    scores[userId].length > 0
      ? scores[userId][scores[userId].length - 1].score
      : 0;

  // 새로운 점수를 계산하여 추가
  const newScore = recentScore + score;
  scores[userId].push({ score: newScore, timestamp });
};

export const getScore = (userId) => {
  return scores[userId];
};

export const getHighScore = (userId) => {
  return highScores[userId];
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

  if (currentScores) {
    if (currentScores.length >= 5) {
      // 최근 5개의 점수만 추출
      const recentScores = currentScores.slice(-5); // 끝에서 5개의 요소를 가져옴

      const timestampDiff =
        recentScores[recentScores.length - 1].timestamp -
        recentScores[0].timestamp;

      console.log(`Obtain score time diff: ${timestampDiff / 1000}`);

      if (timestampDiff / 1000 < 1) {
        return {
          status: 'fail',
          message: 'Score obtained through unauthorized means',
        };
      }
    }
  }

  try {
    await setScore(userId, serverIngScore);

    // 최종: 클라이언트와 서버 간의 총 스코어가 동일해졌는지 검증
    // 최근 스코어 구하기
    const scores = await getScore(userId);
    const serverScore = scores[scores.length - 1].score;
    const newClientScore = clientScore + serverIngScore;
    // console.log('serverScore: ', serverScore);

    if (newClientScore !== serverScore) {
      return { status: 'fail', message: 'Score mismatch' };
    }

    // 최고 기록이라면 기록해두기
    if (!highScores[userId] || serverScore > highScores[userId].highestScore) {
      highScores[userId] = {
        highestScore: serverScore,
        timestamp: scores[scores.length - 1].timestamp,
      };
    }

    let result = { status: 'success', message: serverIngScore };
    // console.log('result: ', result.message);
    return result;
  } catch (err) {
    console.error(err.message);
  }
};

export const getHighScoreHandler = async (userId, payload) => {
  const highScoreRecord = getHighScore(userId);
  let highScore = 0;
  if (highScoreRecord) {
    highScore = highScoreRecord.highestScore;
  }
  // console.log(`highScore: ${highScore}`);

  let result = { status: 'success', message: highScore };

  return result;
};

export const removeScore = async (userId) => {
  if (scores.hasOwnProperty(userId)) {
    // userId가 scores에 존재하는지 확인
    try {
      const removedScore = scores[userId]; // 삭제 전에 데이터 백업
      delete scores[userId]; // scores 객체에서 해당 userId 삭제
      return removedScore; // 삭제된 데이터를 반환
    } catch (err) {
      console.error(err.name); // 에러 로그 출력
      throw new Error('Score 삭제 중 오류 발생');
    }
  } else {
    console.error('해당 userId를 찾을 수 없음');
    return null; // 해당 userId가 없을 경우 null 반환
  }
};
