import { addUser } from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import { handleConnection, handleDisconnect, handlerEvent } from './helper.js';
import { getHighScore } from './score.handler.js';
import Redis from 'ioredis';

const redis = new Redis(); // Redis 인스턴스 생성

// 최초 커넥션을 맺은 이후 발생하는 각종 이벤트를 처리하는 곳
const registerHandler = (io) => {
  io.on('connection', async (socket) => {
    let userUUID = uuidv4(); // 기본 UUID 생성
    socket.emit('connection', { userUUID });

    // 만약 클라이언트로부터 기존에 쓰던 uuid를 수신받는다면 해당 값을 사용한다.
    socket.on('register', async (data) => {
      if (data.uuid) {
        userUUID = data.uuid;
        // 유저의 최고 점수 가져오기
        const highScore = (await redis.zscore('highscores', userUUID)) || 0;
        socket.emit('register', {
          status: 'success',
          message: `안녕하세요, 플레이어 ${userUUID}님! 또 오셨네요! 플레이어 님의 최고 기록은 ${highScore}점입니다!`,
        });
      } else {
        socket.emit('register', {
          status: 'success',
          message: `안녕하세요, 플레이어 ${userUUID}님! 새로 오셨네요. 환영합니다!`,
        });
      }

      await addUser({ uuid: userUUID, socketId: socket.id });

      // 유저의 게임 정보 초기화
      handleConnection(socket, userUUID);
    });

    // 모든 서비스 이벤트 처리
    socket.on('event', (data) => handlerEvent(io, socket, data));

    // 접속 해제시 이벤트 처리
    socket.on('disconnect', () => handleDisconnect(socket, userUUID));
  });
};

// io.on : 접속한 모든 유저에 대한 로직
// socket.on : 특정 소켓에 접속한 유저에 대한 로직

export default registerHandler;
