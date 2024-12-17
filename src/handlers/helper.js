import { CLIENT_VERSION } from '../constants.js';
import { getGameAssets } from '../init/asset.js';
import { getStage, setStage } from '../models/stage.model.js';
import { getUsers, removeUser } from '../models/user.model.js';
import handlerMappings from './handlerMapping.js';
import { createStage } from '../models/stage.model.js';
import { removeScore } from './score.handler.js';

// 핸들러 내부 로직에 사용될 함수들

// 접속할 경우에 사용할 함수
export const handleConnection = (socket, uuid) => {
  console.log(`New user connected: ${uuid} with socket ID ${socket.id}`);
  console.log('Current users: ', getUsers());

  createStage(uuid);

  socket.emit('connection', { uuid });
};

// 접속 해제할 경우에 사용할 함수
export const handleDisconnect = (socket, uuid) => {
  removeUser(socket.id); // 사용자 삭제
  removeScore(uuid); // 사용자의 스코어 삭제
  console.log(`User disconnected: ${socket.id}`);
  console.log('Current users:', getUsers());
};

// 이벤트마다 사용할 함수
export const handlerEvent = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit('response', {
      status: 'fail',
      message: 'Client version mismatch',
    });

    return;
  }

  const handler = handlerMappings[data.handlerId];

  if (!handler) {
    socket.emit('response', { status: 'fail', message: 'Handler not found' });

    return;
  }

  try {
    let response = await handler(data.userId, data.payload);
    // console.log(response);

    if (!response) {
      console.log(`response not found`);
      throw new Error('Handler did not return a response');
    }

    response.handlerId = data.handlerId;

    // 브로드캐스팅 여부에 따른 응답 처리
    if (response.broadcast) {
      io.emit('response', response); // 브로드캐스트
    } else {
      socket.emit('response', response); // 개인 응답
    }
  } catch (error) {
    console.error('Handler 실행 중 오류 발생:', error);
    socket.emit('response', {
      status: 'fail',
      message: 'Internal server error',
    });
  }
};
