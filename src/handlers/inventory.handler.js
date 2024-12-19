import { getGameAssets } from '../init/asset.js';
import Redis from 'ioredis';

const redis = new Redis(); // Redis 인스턴스 생성

// set함수 역할은 score.handler.js의 obtainScore에서 맡고 있다.

export const getInventory = async (userId) => {
  try {
    // 인벤토리의 모든 데이터를 가져오기(-1은 리스트의 마지막 요소)
    const inventory = await redis.lrange(`inventory:${userId}`, 0, -1);

    // 데이터가 없으면 빈 배열 반환
    if (!inventory || inventory.length === 0) {
      return [];
    }

    // JSON 파싱해서 재료의 id를 배열로 반환
    return inventory.map((ingredient) => JSON.parse(ingredient.id));
  } catch (err) {
    console.error('Error fetching scores:', err.message);
    return [];
  }
};

export const removeInventory = async (userId) => {
  try {
    await redis.del(`inventory:${userId}`); // 스코어 삭제
  } catch (err) {
    console.error(err.message);
  }
};
