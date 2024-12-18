import Player from './Player.js';
import Ground from './Ground.js';
import ObstacleCotroller from './ObstacleController.js';
import Score from './Score.js';
import ItemController from './ItemController.js';
import './Socket.js';
import { sendEvent } from './Socket.js';
import { socket } from './Socket.js';
import IngredientController from './IngredientController.js';
import { userId } from './Socket.js';

// 게임 캔버스
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// 게임 시작 버튼
const gameStartButton = document.getElementById('gameStart');

// 게임 스피드
const GAME_SPEED_START = 1;
const GAME_SPEED_INCREMENT = 0.00001;

// 게임 크기
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 500;

// 플레이어
// 800 * 200 사이즈의 캔버스에서는 이미지의 기본크기가 크기때문에 1.5로 나눈 값을 사용. (비율 유지)
const PLAYER_WIDTH = 100; // 58
const PLAYER_HEIGHT = 150; // 62
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 400;

// 땅
const GROUND_WIDTH = 1200;
const GROUND_HEIGHT = 500;
const GROUND_SPEED = 0.5;

const OBSTACLE_CONFIG = [
  {
    width: 250 / 1.5,
    height: 250 / 1.5,
    id: 1,
    image: 'images/obstacle/fitnesstrainer2.png',
  },
  {
    width: 100 / 1.5,
    height: 100 / 1.5,
    id: 2,
    image: 'images/obstacle/stop.png',
  },
];

// 아이템
const ITEM_CONFIG = [
  {
    width: 50 / 1.5,
    height: 50 / 1.5,
    id: 1,
    image: 'images/items/pokeball_red.png',
  },
  {
    width: 50 / 1.5,
    height: 50 / 1.5,
    id: 2,
    image: 'images/items/pokeball_yellow.png',
  },
  {
    width: 50 / 1.5,
    height: 50 / 1.5,
    id: 3,
    image: 'images/items/pokeball_purple.png',
  },
  {
    width: 50 / 1.5,
    height: 50 / 1.5,
    id: 4,
    image: 'images/items/pokeball_cyan.png',
  },
];

const INGREDIENT_CONFIG = [
  {
    width: 80,
    height: 80,
    id: 1,
    image: 'images/ingredients/tteok.png',
  },
  {
    width: 80,
    height: 80,
    id: 2,
    image: 'images/ingredients/gochujang.png',
  },
  {
    width: 80,
    height: 80,
    id: 3,
    image: 'images/ingredients/ramyeon.png',
  },
  {
    width: 80,
    height: 80,
    id: 4,
    image: 'images/ingredients/cheese.png',
  },
  {
    width: 80,
    height: 80,
    id: 5,
    image: 'images/ingredients/sundae.png',
  },
  {
    width: 80,
    height: 80,
    id: 6,
    image: 'images/ingredients/friedrice.png',
  },
];

// 게임 요소들
let player = null;
let ground = null;
let obstacleCotroller = null;
let ingredientController = null;
let itemController = null;
let score = null;

let scaleRatio = null;
let previousTime = null;
let gameSpeed = GAME_SPEED_START;
let gameover = false;
let gameClear = false;
let hasAddedEventListenersForRestart = false;
let waitingToStart = true;
let uuid = null;

function createSprites() {
  // 비율에 맞는 크기
  // 유저
  const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
  const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
  const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
  const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;

  // 땅
  const groundWidthInGame = GROUND_WIDTH * scaleRatio;
  const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

  player = new Player(
    ctx,
    playerWidthInGame,
    playerHeightInGame,
    minJumpHeightInGame,
    maxJumpHeightInGame,
    scaleRatio,
  );

  ground = new Ground(
    ctx,
    groundWidthInGame,
    groundHeightInGame,
    GROUND_SPEED,
    scaleRatio,
  );

  const obstacleImages = OBSTACLE_CONFIG.map((obstacle) => {
    const image = new Image();
    image.src = obstacle.image;
    return {
      image,
      id: obstacle.id,
      width: obstacle.width * scaleRatio,
      height: obstacle.height * scaleRatio,
    };
  });

  obstacleCotroller = new ObstacleCotroller(
    ctx,
    obstacleImages,
    scaleRatio,
    GROUND_SPEED,
  );

  const ingredientImages = INGREDIENT_CONFIG.map((ingredient) => {
    const image = new Image();
    image.src = ingredient.image;
    return {
      image,
      id: ingredient.id,
      width: ingredient.width * scaleRatio,
      height: ingredient.height * scaleRatio,
    };
  });

  const itemImages = ITEM_CONFIG.map((item) => {
    const image = new Image();
    image.src = item.image;
    return {
      image,
      id: item.id,
      width: item.width * scaleRatio,
      height: item.height * scaleRatio,
    };
  });

  itemController = new ItemController(
    ctx,
    itemImages,
    scaleRatio,
    GROUND_SPEED,
  );

  score = new Score(ctx, scaleRatio);
  score.getHighScore();

  ingredientController = new IngredientController(
    ctx,
    ingredientImages,
    scaleRatio,
    GROUND_SPEED,
  );
}

function getScaleRatio() {
  const screenHeight = Math.min(
    window.innerHeight,
    document.documentElement.clientHeight,
  );
  const screenWidth = Math.min(
    window.innerHeight,
    document.documentElement.clientWidth,
  );

  // window is wider than the game width
  if (screenWidth / screenHeight < GAME_WIDTH / GAME_HEIGHT) {
    return screenWidth / GAME_WIDTH;
  } else {
    return screenHeight / GAME_HEIGHT;
  }
}

function setScreen() {
  scaleRatio = getScaleRatio();
  canvas.width = GAME_WIDTH * scaleRatio;
  canvas.height = GAME_HEIGHT * scaleRatio;
  createSprites();
}

setScreen();
window.addEventListener('resize', setScreen);

if (screen.orientation) {
  screen.orientation.addEventListener('change', setScreen);
}

function showGameOver() {
  const fontSize = 70 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = 'black';
  const x = canvas.width / 4.5;
  const y = canvas.height / 2;
  ctx.fillText('GAME OVER', x, y);
}

function showGameClear() {
  const fontSize = 70 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = 'red';
  const x = canvas.width / 4.5;
  const y = canvas.height / 2;
  ctx.fillText('GAME CLEAR!', x, y);
}

function showStartGameText() {
  const fontSize = 40 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = 'white';
  const x = canvas.width / 14;
  const y = canvas.height / 2;
  ctx.fillText('Press the Game Start Button', x, y);
}

function updateGameSpeed(deltaTime) {
  gameSpeed += deltaTime * GAME_SPEED_INCREMENT;
}

function reset() {
  hasAddedEventListenersForRestart = false;
  gameover = false;
  waitingToStart = false;

  ground.reset();
  obstacleCotroller.reset();
  ingredientController.reset();
  score.reset();
  gameSpeed = GAME_SPEED_START;
  // 게임시작 핸들러ID 2, payload 에는 게임 시작 시간
  sendEvent(2, { id: uuid, timestamp: Date.now() });
}

function setupGameReset() {
  if (!hasAddedEventListenersForRestart) {
    hasAddedEventListenersForRestart = true;

    setTimeout(() => {
      gameStartButton.addEventListener('click', reset, { once: true });
    }, 500);
  }
}

function clearScreen() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

async function gameLoop(currentTime) {
  if (previousTime === null) {
    previousTime = currentTime;
    requestAnimationFrame(gameLoop);
    return;
  }

  // 모든 환경에서 같은 게임 속도를 유지하기 위해 구하는 값
  // 프레임 렌더링 속도
  const deltaTime = currentTime - previousTime;
  previousTime = currentTime;

  clearScreen();

  if (!gameover && !waitingToStart) {
    // 선인장
    obstacleCotroller.update(gameSpeed, deltaTime);
    itemController.update(gameSpeed, deltaTime);
    ingredientController.update(gameSpeed, deltaTime, score);
    // 달리기
    player.update(gameSpeed, deltaTime);
    updateGameSpeed(deltaTime);
    // 땅이 움직임
    ground.update(gameSpeed, deltaTime);

    score.update(deltaTime);
  }

  const collideWithObstacle = obstacleCotroller.collideWith(player);

  if (!gameover && collideWithObstacle) {
    await player.getDamaged(collideWithObstacle);
    console.log(`플레이어 체력: ${player.hp}`);
    if (player.hp <= 0) {
      gameover = true;
      score.getHighScore();
      setupGameReset();
      let gameOverResponse = await sendEvent(6, {});
      let gameOverMessage = gameOverResponse.message;
      console.log(gameOverMessage);
    }
  }

  const collideWithItem = itemController.collideWith(player);
  if (collideWithItem && collideWithItem.itemId) {
    score.getItem(collideWithItem.itemId);
  }
  const collideWithIngredient = ingredientController.collideWith(player);
  if (collideWithIngredient && collideWithIngredient.ingredientId) {
    score.getIngredient(collideWithIngredient.ingredientId);
    player.setIngredient(collideWithIngredient.ingredientId);
    console.log('인벤토리: ', player.ingredients);
  }

  // draw
  ground.draw();
  obstacleCotroller.draw();
  player.draw();
  itemController.draw();
  ingredientController.draw();
  score.draw();

  if (score.stageId > 1006) {
    gameClear = true;
    let gameClearResponse = await sendEvent(3, {});
    score.getHighScore();
    setupGameReset();
    console.log(gameClearResponse.message, gameClearResponse.recentScore);
  }

  if (gameClear) {
    showGameClear();
  }

  if (gameover) {
    showGameOver();
  }

  if (waitingToStart) {
    showStartGameText();
  }

  // 재귀 호출 (무한반복)
  requestAnimationFrame(gameLoop);
}

// 배경음악
const audio = new Audio('./musics/doki-doki-crafting-club-194811.mp3');
document.getElementById('playButton').addEventListener('click', () => {
  audio.play();
});

document.getElementById('pauseButton').addEventListener('click', () => {
  audio.pause();
});

document.getElementById('stopButton').addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0; // 정지 후 재생 위치 초기화
});
audio.loop = true; // 무한 반복

// 화면에 맞는 캔버스
// function resizeCanvasWithAspectRatio() {
//   const aspectRatio = 16 / 4; // 16:9 비율
//   const width = window.innerWidth;
//   const height = window.innerHeight;

//   if (width / height > aspectRatio) {
//     canvas.height = height;
//     canvas.width = height * aspectRatio;
//   } else {
//     canvas.width = width;
//     canvas.height = width / aspectRatio;
//   }

//   ctx.fillStyle = 'lightblue';
//   ctx.fillRect(0, 0, canvas.width, canvas.height);
// }

// // 초기 크기 설정 및 화면 크기 변경 시 리사이즈
// resizeCanvasWithAspectRatio();
// window.addEventListener('resize', resizeCanvasWithAspectRatio);

// 게임 프레임을 다시 그리는 메서드
requestAnimationFrame(gameLoop);

// 게임 시작
gameStartButton.addEventListener('click', reset, { once: true });
