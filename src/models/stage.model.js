import Redis from 'ioredis';
import { getGameAssets } from '../init/asset.js';
const redis = new Redis(); // Redis 인스턴스 생성

// key: uuid, value: array -> stage 정보는 객체
// const stages = {};

// 스테이지 초기화
export const createStage = async (userId) => {
  // stages[uuid] = [];
  try {
    const { stages } = getGameAssets();
    const firstStageId = stages.data[0].id;
    console.log(`firstStageId: ${firstStageId}`);
    const timestamp = Date.now();

    const stageData = JSON.stringify({ id: firstStageId, timestamp });
    await redis.lpush(`stage:${userId}`, stageData);
    await redis.lpush(`stage:${userId}`, 0, 9); // 최신 10개만 유지

    console.log(`Stage created for user ${userId}: ${stageData}`);
  } catch (err) {
    console.error(err.message);
  }
};

export const getStage = async (userId, count = 10) => {
  try {
    const stageDataList = await redis.lrange(`stage:${userId}`, 0, count - 1);
    if (!stageDataList || stageDataList.length === 0) return null;

    const parsedStages = stageDataList.map((data) => JSON.parse(data)); // JSON 파싱
    return parsedStages; // 리스트 형태로 반환
  } catch (err) {
    console.error(err.message);
    return null;
  }
};

export const setStage = async (userId, id, timestamp) => {
  try {
    try {
      const stageData = JSON.stringify({ id, timestamp }); // 객체를 문자열로 직렬화
      await redis.lpush(`stage:${userId}`, stageData);
      console.log(`Stage set for user ${userId}: ${stageData}`);
    } catch (err) {
      console.error('Error setting stage:', err.message);
    }
  } catch (err) {
    console.error(err.message);
  }
};

// 스테이지 데이터를 삭제하는 함수
export const removeStage = async (userId) => {
  try {
    await redis.del(`stage:${userId}`);
    console.log(`Stage data cleared for user ${userId}`);
  } catch (err) {
    console.error('Error clearing stage:', err.message);
  }
};
