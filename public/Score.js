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

// 웹소켓을 통해 스테이지 데이터를 가져오는 함수

// =======================

class Score {
  score = 0;
  HIGH_SCORE_KEY = 'highScore';
  stageChange = true;

  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;
  }

  update = async (deltaTime) => {
    this.score += deltaTime * 0.001;

    let currentStages;
    try {
      currentStages = sendEvent(4, { uuid: userId });
      console.log('Fetched stages:', currentStages);
    } catch (error) {
      console.error(error.message);
      return;
    }

    if (!currentStages || !currentStages.length) {
      console.error('No stages found for user');
      return { status: 'fail', message: 'No stages found for user' };
    }

    currentStages.sort((a, b) => b.id - a.id);
    const currentStage = currentStages[0];
    const targetStage = currentStages[1] || { id: currentStage.id + 1 };

    // console.log('Current stage:', currentStage);
    // console.log('Target stage:', targetStage);

    if (Math.floor(this.score) % 10 === 0 && this.stageChange) {
      this.stageChange = false;
      sendEvent(11, {
        currentStage: currentStage.id,
        targetStage: targetStage.id,
      });

      // 스테이지 이동 후 1초가 지나면 플래그 초기화
      // setTimeout(() => {
      //   this.stageChange = true;
      // }, 8000);
    }
  };

  getItem(itemId) {
    this.score += 0;
  }

  reset() {
    this.score = 0;
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
