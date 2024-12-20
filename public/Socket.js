import { CLIENT_VERSION } from './Constants.js';

export const socket = io('http://3.39.232.183:3001', {
  // export const socket = io('http://localhost:3001', {
  // 서버에 연결할 때 추가 정보를 전달하는 역할
  // 쿼리 문자열로 변환되어 URL에 추가된다(예: http://localhost:3000?clientVersion=1.0.0)
  // 다만 이 쿼리 문자열은 웹소켓 연결의 헤더(header) 또는 Payload로 전송되어서 브라우저 주소창이나 네트워크 요청 URL에는 쿼리 문자열이 보이지 않는다.
  // 개발자 도구 - 네트워크에서는 쿼리 문자열이 포함된 걸 확인할 수 있을 것이다.
  query: {
    clientVersion: CLIENT_VERSION,
  },
});
// io: Socket.IO 라이브러리에서 제공하는 함수로, 웹소켓 연결을 쉽게 설정하고 관리할 수 있게 한다.

// 로컬스토리지에 uuid가 있다면 가져오기
let userId = localStorage.getItem('userUUID') || null;

socket.on('connection', (data) => {
  // uuid가 있는가? 없다면 서버에서 받은 걸 쓰기
  if (!userId) {
    userId = data.userUUID;
    localStorage.setItem('userUUID', userId);
  } else {
    // 기존에 쓰던 uuid가 있다면 서버한테 알려준다!
    socket.emit('register', { uuid: userId });
  }

  console.log('connection: ', userId);
});

const responseListeners = {}; // 핸들러 ID별 리스너 관리 객체

// 이벤트 핸들러로 요청을 보내는 함수
export const sendEvent = (handlerId, payload) => {
  // 서버의 response를 받아서 사용하기 위해 Promise로 비동기 처리를 한다.
  return new Promise((resolve, reject) => {
    // 리스너 함수
    responseListeners[handlerId] = (response) => {
      try {
        if (!response) {
          reject(new Error('서버 응답이 비어 있습니다.'));
          return;
        }

        // handlerId 일치 시 처리
        if (response.handlerId === handlerId) {
          if (response.status === 'success') {
            resolve(response); // 성공 응답 반환
          } else {
            reject(new Error(response.message || 'Unknown Error')); // 실패 응답
          }

          delete responseListeners[handlerId]; // 리스너 제거
        }
      } catch (err) {
        console.error(err.message);
        delete responseListeners[handlerId]; // 에러 발생 시 리스너 제거
        reject(err);
      }
    };

    // 이벤트 전송
    socket.emit('event', {
      userId,
      clientVersion: CLIENT_VERSION,
      handlerId,
      payload,
    });
  });
};

// 이 socket.on에 위에서 정의한 responseListeners를 등록하여 사용한다.
// 단, broadcast는 다른 곳에서 활용하기 위해 return
socket.on('response', (response) => {
  const { handlerId } = response;

  if (response.broadcast) return;

  // handlerId에 해당하는 리스너 실행
  if (responseListeners[handlerId]) {
    responseListeners[handlerId](response);
  } else {
    console.warn(`No listener found for handlerId ${handlerId}`);
  }
});

export { userId };
