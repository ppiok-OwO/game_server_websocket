import { moveStageHandler, getStageId } from './stage.handler.js';
import { gameStart, gameEnd, gameOver } from './game.handler.js';
import { obtainScore } from './score.handler.js';

const handlerMappings = {
  2: gameStart,
  3: gameEnd,
  4: getStageId,
  5: obtainScore,
  6: gameOver,
  11: moveStageHandler,
};

export default handlerMappings;
