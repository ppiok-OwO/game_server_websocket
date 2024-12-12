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
  HIGH_SCORE_KEY = 'highScore';
  // stageChange = true;
  lastStageId = null; // 마지막으로 알림을 보낸 스테이지 ID

  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;
  }

  update = async (deltaTime) => {
    this.score += deltaTime * 0.001;
    let currentStageId = Math.floor(this.score / 10) + 1000;

    if (
      Math.floor(this.score) % 10 === 0 && // 스코어가 10의 배수일 때
      this.lastStageId !== currentStageId && // 마지막으로 알림을 보낸 스테이지와 다를 때
      Math.floor(this.score) >= 10
      // && this.stageChange
    ) {
      // this.stageChange = false;
      this.lastStageId = currentStageId; // 현재 스테이지 ID로 업데이트
      await sendEvent(11, {
        currentStage: currentStageId - 1,
        targetStage: currentStageId,
      });
    }
  };

  getItem(itemId) {
    this.score += 0;
  }

  reset() {
    this.score = 0;
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
    this.ctx.font = `${fontSize}px serif`;
    this.ctx.fillStyle = '#525250';

    const scoreX = this.canvas.width - 75 * this.scaleRatio;
    const highScoreX = scoreX - 125 * this.scaleRatio;

    const scorePadded = Math.floor(this.score).toString().padStart(6, 0);
    const highScorePadded = highScore.toString().padStart(6, 0);

    this.ctx.fillText(scorePadded, scoreX, y);
    this.ctx.fillText(`HI ${highScorePadded}`, highScoreX, y);
  }
}

export default Score;
