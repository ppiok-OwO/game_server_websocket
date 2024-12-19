import { getGameAssets } from '../init/asset.js';
import Redis from 'ioredis';

const redis = new Redis(); // Redis 인스턴스 생성

// set함수 역할은 score.handler.js의 obtainScore에서 맡고 있다.

export const getInventory = async (userId, payload) => {
  try {
    // Redis에서 인벤토리 데이터를 가져오기
    const inventory = await redis.lrange(`inventory:${userId}`, 0, -1);

    console.log('Inventory from Redis:', inventory);

    // 데이터가 없으면 빈 배열 반환
    if (!inventory || inventory.length === 0) {
      return { status: 'success', message: [] };
    }

    // 게임 에셋을 기반으로 재료들의 이름을 가져오기
    const { ingredients } = getGameAssets();
    const inventoryIngId = inventory.map(
      (ingredient) => JSON.parse(ingredient).ingredientId,
    );

    // 중복 제거 (Set 사용)
    const uniqueInventoryIngId = [...new Set(inventoryIngId)];

    // ID를 이름으로 변환
    const inventoryIngName = uniqueInventoryIngId.map((ingredientId) => {
      const ingName = ingredients.data[ingredientId - 1].name;
      if (!ingName) {
        console.warn(`Ingredient ID ${ingredientId} not found in assets.`);
      }

      return ingName || 'Unknown';
    });

    inventoryIngName.sort((a, b) => a - b);

    console.log('Unique Inventory IngName:', inventoryIngName);

    return {
      status: 'success',
      message: inventoryIngName,
    };
  } catch (err) {
    console.error('Error fetching inventory:', err.message);
    return { status: 'fail', message: 'Error fetching inventory' };
  }
};

export const removeInventory = async (userId) => {
  try {
    await redis.del(`inventory:${userId}`); // 스코어 삭제
  } catch (err) {
    console.error(err.message);
  }
};
