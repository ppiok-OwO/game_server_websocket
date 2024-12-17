import { sendEvent } from './Socket.js';
import { socket } from './Socket.js';
import { userId } from './Socket.js';

// =======================

class Score {
  score = 0;
  time = 0;
  // HIGH_SCORE_KEY = 'highScore';
  highScore = 0;
  stageId = null;
  isNewScore = false;

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
        if (clientStageId !== serverStageId + 1) {
          throw new Error('Stage mismatch');
        }
      }
    } catch (err) {
      console.error('오류 발생:', err.message);
    }
  };

  getIngredient = async (ingredientId) => {
    const clientScore = this.score;
    const clientStageId = Math.floor(this.time / 10) + 1000;
    const clientTimestamp = Date.now(); // 현재 타임스탬프

    try {
      // 서버에 패킷을 보내고, 재료의 스코어 데이터를 응답받는다.
      const ingScoreResponse = await sendEvent(5, {
        clientIngId: ingredientId,
        clientScore,
        clientStageId,
        clientTimestamp,
      });
      console.log('ingScoreResponse: ', ingScoreResponse);
      const serverIngScore = ingScoreResponse.message;
      console.log('serverIngScore: ', serverIngScore);

      this.score += serverIngScore;

      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.isNewScore = true;
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  getItem(itemId) {
    this.score += 0;
  }

  reset() {
    this.score = 0;
    this.time = 0;
    this.lastStageId = null; // 리셋 시 마지막 스테이지 ID 초기화
    this.isNewScore = false;
  }

  getHighScore = async () => {
    const highScoreResponse = await sendEvent(7, {
      isNewScore: this.isNewScore,
    });
    const serverHighScore = highScoreResponse.message;
    // console.log(`message: ${serverHighScore}`);

    this.highScore = serverHighScore;
    // return serverHighScore;
  };

  getScore() {
    return this.score;
  }

  draw = async () => {
    // const highScore = await this.getHighScore();
    const y = 20 * this.scaleRatio;
    const fontSize = 20 * this.scaleRatio;
    this.ctx.font = `${fontSize}px monospace`;
    this.ctx.fillStyle = '#525250';

    const scoreX = this.canvas.width - 155 * this.scaleRatio;
    const highScoreX = scoreX - 165 * this.scaleRatio;

    const scorePadded = Math.floor(this.score).toString().padStart(6, 0);
    const highScorePadded = this.highScore.toString().padStart(6, 0);

    const timePadded = Math.floor(this.time).toString().padStart(4, 0);
    const tiemX = 20 * this.scaleRatio;

    this.ctx.fillText(` SCORE ${scorePadded}`, scoreX, y);
    this.ctx.fillText(`HISCORE ${highScorePadded} |`, highScoreX, y);
    this.ctx.fillText(`TIME ${timePadded}`, tiemX, y);
  };
}

export default Score;
