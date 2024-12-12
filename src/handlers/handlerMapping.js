import { moveStageHandler, getStageScore } from './stage.handler.js';
import { gameStart, gameEnd } from './game.handler.js';

const handlerMappings = {
  2: gameStart,
  3: gameEnd,
  4: getStageScore,
  11: moveStageHandler,
};

export default handlerMappings;
