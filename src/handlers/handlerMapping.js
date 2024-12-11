import { moveStageHandler } from './stage.handler.js';
import { gameStart, gameEnd } from './game.handler.js';
import { getStage } from '../models/stage.model.js';

const handlerMappings = {
  2: gameStart,
  3: gameEnd,
  4: getStage,
  11: moveStageHandler,
};

export default handlerMappings;
