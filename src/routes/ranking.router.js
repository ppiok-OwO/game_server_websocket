import express from 'express';
import Redis from 'ioredis';

const router = express.Router();
const redis = new Redis(); // Redis 인스턴스 생성

router.get('/ranking', async (req, res, next) => {
  try {
    // high scores를 높은 점수 기준으로 조회 (0부터 시작하는 인덱스, -1은 모든 데이터)
    const ranking = await redis.zrevrange('highscores', 0, -1, 'WITHSCORES');

    // 결과를 key-value 형태로 변환
    const result = [];
    for (let i = 0; i < ranking.length; i += 2) {
      result.push({ member: ranking[i], score: parseInt(ranking[i + 1]) });
    }

    console.log(`!!!! result : `, result);
    return res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
