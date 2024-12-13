import { sendEvent } from './Socket.js';
import { socket } from './Socket.js';

let userId = null;

// 서버에서 UUID를 받을 수 있도록 설정
socket.on('connection', (data) => {
  if (data && data.uuid) {
    userId = data.uuid;
    console.log('User ID received:', userId);
  } else {
    console.error('Failed to load userId from server.');
  }
});

// =======================

class Score {
  score = 0;
  time = 0;
  HIGH_SCORE_KEY = 'highScore';
  stageId = null;

  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;
  }

  update = async (deltaTime) => {
    this.time += deltaTime * 0.001;

    try {
      // 클라이언트 상의 stageId
      const clientStageId = Math.floor(this.time / 10) + 1000;

      // serverStageId 값을 불러온다.
      const serverResponse = await sendEvent(4, {});
      const serverStageId = serverResponse.message;
      this.stageId = serverStageId;

      if (
        Math.floor(this.time) % 10 === 0 && // 클라 기준 경과시간이 10의 배수일 때
        serverStageId !== clientStageId && // 서버에 기록된 stageId와 클라이언트의 stageId가 다를 때
        Math.floor(this.time) >= 10 && // 경과 시간이 클라이언트 기준으로 10초 이상 지났을 때
        clientStageId === serverStageId + 1
      ) {
        // 스테이지 이동 이벤트를 요청(검증은 서버에서)
        await sendEvent(11, {
          currentStage: serverStageId,
          targetStage: serverStageId + 1,
        });
      }
      if (clientStageId !== serverStageId + 1) {
        throw new Error('Stage mismatch');
      }
    } catch (err) {
      console.error('오류 발생:', err.message);
    }
  };

  getIngredient(ingredientId) {
    for (let i = 1; i <= 5; i++) {
      if (ingredientId % 6 === i) {
        this.score += 10 * i;
      }
    }
    if (ingredientId % 6 === 0) {
      this.score += 10 * 6;
    }
  }

  getItem(itemId) {
    this.score += 0;
  }

  reset() {
    this.score = 0;
    this.time = 0;
    this.lastStageId = null; // 리셋 시 마지막 스테이지 ID 초기화
  }

  setHighScore() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    if (this.score > highScore) {
      localStorage.setItem(this.HIGH_SCORE_KEY, Math.floor(this.score));
    }
  }

  getScore() {
    return this.score;
  }

  draw() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    const y = 20 * this.scaleRatio;

    const fontSize = 20 * this.scaleRatio;
    this.ctx.font = `${fontSize}px monospace`;
    this.ctx.fillStyle = '#525250';

    const scoreX = this.canvas.width - 155 * this.scaleRatio;
    const highScoreX = scoreX - 165 * this.scaleRatio;

    const scorePadded = Math.floor(this.score).toString().padStart(6, 0);
    const highScorePadded = highScore.toString().padStart(6, 0);

    const timePadded = Math.floor(this.time).toString().padStart(4, 0);
    const tiemX = 20 * this.scaleRatio;

    this.ctx.fillText(` SCORE ${scorePadded}`, scoreX, y);
    this.ctx.fillText(`HISCORE ${highScorePadded} |`, highScoreX, y);
    this.ctx.fillText(`TIME ${timePadded}`, tiemX, y);
  }
}

export default Score;
