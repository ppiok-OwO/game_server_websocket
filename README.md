# 게임서버개발 심화주차 강의
## 웹소켓으로 실시간 게임 구현하기
### 내일배움캠프 Node.js 7기
내일배움캠프 <Node.js 게임서버개발> 강의를 듣고 실습을 해보는 레포지토리입니다.

```
game_server_websocket
├─ .gitignore
├─ .prettierrc
├─ assets                     // 게임 데이터
│  ├─ item.json
│  ├─ item_unlock.json
│  └─ stage.json
├─ package-lock.json
├─ package.json
├─ public                     // 프론트 엔드
├─ README.md
└─ src                        // 서버 코드
   ├─ app.js
   ├─ constants.js
   ├─ handlers                // 비즈니스 로직
   │  ├─ game.handler.js
   │  ├─ handlerMapping.js
   │  ├─ helper.js
   │  ├─ register.handler.js
   │  └─ stage.handler.js
   ├─ init                    // 필수 데이터, 기능 로드(load)
   │  ├─ asset.js
   │  └─ socket.js
   └─ models                  // 세션 모델 관리
      ├─ stage.model.js
      └─ user.model.js

```