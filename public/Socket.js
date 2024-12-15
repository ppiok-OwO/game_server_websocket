import { CLIENT_VERSION } from './Constants.js';

export const socket = io('http://localhost:3000', {
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

socket.on('connection', (data) => {
  console.log('connection: ', data);
  userId = data.uuid;
});

export const sendEvent = async (handlerId, payload) => {
  return new Promise((resolve, reject) => {
    // 서버로 이벤트 전송한다.
    socket.emit('event', {
      userId,
      clientVersion: CLIENT_VERSION,
      handlerId,
      payload,
    });

    // 위에서 전송한 이벤트의 응답을 비동기 처리한 뒤, Promise 객체 안에 반환해주는 함수
    const responseListener = (response) => {
      try {
        if (!response) {
          // 응답이 비어있다면 reject
          reject(new Error('서버 응답이 비어 있습니다.'));
          return;
        }

        // 비어있지 않다면, handlerId를 비교하여 내가 원한 응답인지 확인한다.
        if (response.handlerId === handlerId) {
          if (response.status === 'success') {
            // 응답의 형식이 적절하다면 resolve
            resolve(response);
          } else {
            // 응답의 형식이 적절하지 않다면 'Unknown Error'
            reject(new Error(response.message || 'Unknown Error'));
          }

          // 응답을 처리한 후 이벤트 리스너 제거 => sendEvent 요청을 할 때마다 이벤트 리스너 on/off를 반복하는 구조
          socket.off('response', responseListener);
        }
      } catch (err) {
        console.error(err.message);
        // 에러 발생 시에도 이벤트 리스너 제거
        socket.off('response', responseListener);
      }
    };

    // esponseListener를 socket.on의 콜백함수로 등록
    socket.on('response', responseListener);
  });
};
