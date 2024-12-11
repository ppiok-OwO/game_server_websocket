import { addUser } from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import { handleConnection, handleDisconnect, handlerEvent } from './helper.js';

// 최초 커넥션을 맺은 이후 발생하는 각종 이벤트를 처리하는 곳
const registerHandler = (io) => {
  io.on('connection', (socket) => {
    const userUUID = uuidv4();

    // 유저가 처음 접속하는 경우
    addUser({ uuid: userUUID, socketId: socket.id });

    // 새 유저의 게임 정보 초기화
    handleConnection(socket, userUUID);

    // 유저가 경험하는 이벤트는 핸들러 맵핑을 통해 처리
    socket.on('event', (data) => handlerEvent(io, socket, data));

    // 접속을 해제하는 경우, socket.id를 통해 users 배열에서 삭제
    socket.on('disconnect', (socket) => handleDisconnect(socket, userUUID));
  });
};

// io.on : 접속한 모든 유저에 대한 로직
// socket.on : 특정 소켓에 접속한 유저에 대한 로직

export default registerHandler;
