import { moveStageHandler, getStageId } from './stage.handler.js';
import { gameStart, gameEnd, gameOver } from './game.handler.js';
import { getHighScore, obtainScore } from './score.handler.js';
import { getInventory } from './inventory.handler.js';

const handlerMappings = {
  2: gameStart,
  3: gameEnd,
  4: getStageId,
  5: obtainScore,
  6: gameOver,
  7: getHighScore,
  8: getInventory,
  11: moveStageHandler,
};

export default handlerMappings;
