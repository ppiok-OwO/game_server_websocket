import { CLIENT_VERSION } from './Constants.js';

const socket = io('http://localhost:3000', {
  // 서버에 연결할 때 추가 정보를 전달하는 역할
  // 쿼리 문자열로 변환되어 URL에 추가된다(예: http://localhost:3000?clientVersion=1.0.0)
  // 다만 이 쿼리 문자열은 웹소켓 연결의 헤더(header) 또는 Payload로 전송되어서 브라우저 주소창이나 네트워크 요청 URL에는 쿼리 문자열이 보이지 않는다.
  // 개발자 도구 - 네트워크에서는 쿼리 문자열이 포함된 걸 확인할 수 있을 것이다.
  query: {
    clientVersion: CLIENT_VERSION,
  },
});
// io: Socket.IO 라이브러리에서 제공하는 함수로, 웹소켓 연결을 쉽게 설정하고 관리할 수 있게 한다.

let userId = null;
socket.on('response', (data) => {
  console.log(data);
});

socket.on('connection', (data) => {
  console.log('connection: ', data);
  userId = data.uuid;
});

const sendEvent = (handlerId, payload) => {
  socket.emit('event', {
    userId,
    clientVersion: CLIENT_VERSION,
    handlerId,
    payload,
  });
};

export { sendEvent };
