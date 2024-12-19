import { getGameAssets } from '../init/asset.js';
import Redis from 'ioredis';

const redis = new Redis(); // Redis 인스턴스 생성

export const setScore = async (userId, score) => {
  // 가장 최근 기록된 스코어 가져오기
  const getRecentScore = await getScore(userId, 1);
  const recentScore = getRecentScore[0]?.score || 0;

  // 새로운 점수를 계산하여 추가
  const newScore = recentScore + score;
  // 최고 점수인지 판단하기
  const isThisHighscore = await setHighScore(userId, newScore);

  // Redis 리스트에 스코어와 타임스탬프, 최고기록여부 추가
  const scoreData = JSON.stringify({
    score: newScore,
    timestamp: Date.now(),
    isNewHighScore: isThisHighscore,
  });

  try {
    await redis.lpush(`scores:${userId}`, scoreData); // 점수 추가
  } catch (err) {
    console.error(err.message);
  }

  // 점수 리스트의 길이 제한 (최신 20개만 유지)
  // await redis.ltrim(`scores:${userId}`, 0, 19);
};

export const getScore = async (userId, count = 10) => {
  try {
    // count만큼 최신 점수 가져오기
    const scores = await redis.lrange(`scores:${userId}`, 0, count - 1);

    // 데이터가 없으면 빈 배열 반환
    if (!scores || scores.length === 0) {
      return [];
    }

    // JSON 파싱
    return scores.map((score) => JSON.parse(score));
  } catch (err) {
    console.error('Error fetching scores:', err.message);
    return [];
  }
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
  try {
    // 새로운 점수 저장하기
    await setScore(userId, serverIngScore);
    // 어뷰저 검증 - 최근 5개의 점수 타임스탬프 확인
    const recentScores = await getScore(userId, 5); // 최신 5개 점수 가져오기

    if (recentScores.length >= 5) {
      // map()을 써서 다섯 개의 레코드의 timestamp로 새로운 배열 생성
      const timestamps = recentScores.map((entry) => entry.timestamp);
      // 첫 번째 레코드의 timestamp에서 마지막 레코드의 timestamp를 뺀다.
      // 왜냐하면 redis의 lpush 명령어는 리스트의 맨앞에 데이터를 추가하기 때문이다.
      const timestampDiff = timestamps[0] - timestamps[timestamps.length - 1];
      console.log(`Obtain score time diff: ${timestampDiff / 1000}`);

      // 1초 미만이면 어뷰저라고 판단
      if (timestampDiff / 1000 < 1) {
        return {
          status: 'fail',
          message: 'Score obtained through unauthorized means',
        };
      }
    }

    // 획득한 재료 인벤토리에 저장하기
    const inventoryData = JSON.stringify({ ingredientId: clientIngId });
    await redis.lpush(`inventory:${userId}`, inventoryData);

    // 최종: 클라이언트와 서버 간의 총 스코어가 동일해졌는지 검증
    const recentScore = recentScores[0]?.score || 0;
    const serverScore = recentScore;
    const newClientScore = clientScore + serverIngScore;

    if (newClientScore !== serverScore) {
      return { status: 'fail', message: 'Score mismatch' };
    }

    let result = {
      status: 'success',
      message: serverIngScore,
    };
    return result;
  } catch (err) {
    console.error(err.message);
  }
};

export const setHighScore = async (userId, newScore) => {
  // 유저의 최고 점수 가져오기
  const highScore = (await redis.zscore('highscores', userId)) || 0;
  // 만약 최고 기록이라면 데이터 저장
  if (newScore > highScore) {
    // 최고 점수를 저장하기 위해 키값 생성
    const highScoreKey = `highscores`;

    try {
      // 기록해두기(더블 체크를 위해 zadd의 GT 옵션 사용)
      await redis.zadd(highScoreKey, 'GT', newScore, userId);
    } catch (err) {
      console.error(err.message);
    }

    return true;
  }
  return false;
};

export const getHighScore = async (userId, payload) => {
  // 유저의 최고 점수 가져오기
  const highScore = (await redis.zscore('highscores', userId)) || 0;
  // 최근 점수 기록의 isNewHighScore가 true인지 확인
  const score = await getScore(userId, 1);

  if (score.length > 0 && score[0].isNewHighScore) {
    let result = {
      broadcast: true,
      status: 'success',
      message: `플레이어 ${userId}님이 최고 기록 ${score[0].score}점을 달성하셨습니다!`,
    };

    return result;
  }

  let result = { status: 'success', message: highScore };
  return result;
};

export const removeScore = async (userId) => {
  try {
    await redis.del(`scores:${userId}`); // 스코어 삭제
  } catch (err) {
    console.error(err.message);
  }
};
