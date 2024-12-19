<img src="https://img.shields.io/badge/node.js-%23339933.svg?&style=for-the-badge&logo=node.js&logoColor=white" /> <img src="https://img.shields.io/badge/express-%23000000.svg?&style=for-the-badge&logo=express&logoColor=white" /> <img src="https://img.shields.io/badge/socket.io-%23010101.svg?&style=for-the-badge&logo=socket.io&logoColor=white" /> <img src="https://img.shields.io/badge/redis-%23DC382D.svg?&style=for-the-badge&logo=redis&logoColor=white" /> <img src="https://img.shields.io/badge/javascript-%23F7DF1E.svg?&style=for-the-badge&logo=javascript&logoColor=black" />
# 도전! 떡볶이 만들기
## 소개하기에 앞서…
### 컨셉을 잡게 된 배경
=> 저의 처참한 프론트엔드 실력에 어찌할 바를 모르다가 옛날 게임 감성을 살리기로 결정했습니다T.T
9n년생의 추억을 가득 담아 쥬니어 네이버 시절로 되돌아가보세요! 인스타 쳐내! 버디버디 나와!

![image](https://github.com/user-attachments/assets/927a2be3-1c9f-4ebc-8106-b1491ffacac6)

### 디렉토리 구조
```
game_server_websocket
├─ .gitignore
├─ .prettierrc
├─ assets
├─ package-lock.json
├─ package.json
├─ public
├─ README.md
└─ src
   ├─ app.js
   ├─ constants.js
   ├─ handlers
   │  ├─ game.handler.js
   │  ├─ handlerMapping.js
   │  ├─ helper.js
   │  ├─ inventory.handler.js
   │  ├─ register.handler.js
   │  ├─ score.handler.js
   │  └─ stage.handler.js
   ├─ init
   │  ├─ asset.js
   │  └─ socket.js
   └─ models
      ├─ stage.model.js
      └─ user.model.js
```
### 게임의 컨셉
=> 배가 고픈 주인공이 동네 PT쌤을 요리조리 피해 떡볶이 재료를 모아서 맛있게 만들어 먹는 게 이 게임의 목표입니다!</br>
만약 잡힌다면 스쿼트를 피할 수 없을 것…이 아니라 가진 재료 중의 하나를 랜덤하게 빼앗깁니다! ㅇ0ㅇ) / oh, no!

![image](https://github.com/user-attachments/assets/96fb9fa8-1eab-4a8a-8b9f-9189a2981834)

---

## 게임 소개
### 게임 규칙
![image](https://github.com/user-attachments/assets/3274407a-43b8-4ff4-b9e1-e9c8ca4f09c6)
- 게임 시간(좌측 상단)이 10초 지날 때마다 스테이지가 1씩 증가합니다.</br>
- 스테이지가 증가하면 적의 게임 속도가 상승하고 더 희귀한 재료들이 등장합니다.
- 그러나 조심하세요! PT쌤과 부딪히면 재료를 잃어버리거든요! ㄴ(ㅇ0ㅇ)ㄱ
- 플레이어의 전체 체력은 100! 장애물(PT쌤 혹은 STOP 표지판) 부딪히면 10씩 감소합니다!!

## 게임 데이터
<details>
	<summary></summary>
  	<div markdown="1">
      
redis와 연동해서 게임 정보 저장했습니다! 사용한 메서드에 대한 내용은 블로그에([2024-12-18](https://princeali.tistory.com/93))에 정리해두었습니다.
      
### 플레이어(user) 데이터
![image](https://github.com/user-attachments/assets/93e4cbbe-024e-4c44-9bd9-6d73ee7957bc)

### 스테이지(stage) 데이터
![image](https://github.com/user-attachments/assets/879fa624-07cc-45a4-9fdf-76bfb267e2d3)

### 점수(socores) 데이터
![image](https://github.com/user-attachments/assets/942c4e4c-d5c2-49ba-b4dc-82cbf58f44a9)

### 플레이어별 최고 기록(highscores) 데이터
![image](https://github.com/user-attachments/assets/8cf662e6-7a8e-4eed-bff2-572c45dc9b25)
Member = 플레이어의 uuid, Score=플레이어의 최고 기록(ZADD 함수 이용)

### 획득한 재료 인벤토리(inventory)
![image](https://github.com/user-attachments/assets/519b154c-0b67-452c-bbdc-9dedb0956d55)
  	</div>
</details>

---

## 필수 기능 구현 방식 소개
### 1. 스테이지 구분
**클라이언트 측 코드:** 
```js
// score 클래스의 update 함수()
update = async (deltaTime) => {
	this.time += deltaTime * 0.001;
	try {
		// 클라이언트 상의 시간으로 stageId 계산
		const clientStageId = Math.floor(this.time / 10) + 1000;

		// server에 저장된 StageId 값을 불러온다.
		const serverResponse = await sendEvent(4, {});
		const serverStageId = serverResponse.message;
		this.stageId = serverStageId;

		if (
			Math.floor(this.time) % 10 === 0 && // 클라 기준 경과시간이 10의 배수일 때
			serverStageId !== clientStageId && // 서버에 기록된 stageId와 클라이언트의 stageId가 다를 때
			Math.floor(this.time) >= 10 && // 경과 시간이 클라이언트 기준으로 10초 이상 지났을 때
			clientStageId === serverStageId + 1
		) {
			// 스테이지 이동 이벤트를 요청(검증은 서버에서)
			await sendEvent(11, {
				currentStage: serverStageId,
				targetStage: serverStageId + 1,
			});
			if (clientStageId !== serverStageId + 1) {
				throw new Error('Stage mismatch');
			}
		}
	} catch (err) {
		console.error('오류 발생:', err.message);
	}
};
```
**서버 측 코드:** 
```js
// 클라이언트로부터 4번 이벤트를 요청받을 때 실행된다.
export const moveStageHandler = async (userId, payload) => {
  // 가장 최근 스테이지를 확인
  const serverStage = await getStage(userId, 1);
  if (!serverStage) {
    console.log('No stages found for user');
    return { status: 'fail', message: 'No stages found for user' };
  }

  console.log(`Sever Stage: `, serverStage);
  console.log(`Client Stages: `, payload.currentStage);

  // 클라이언트 vs 서버 비교
  if (serverStage[0].id !== payload.currentStage) {
    console.log('Server currentStage:', serverStage[0].id);
    console.log('Client currentStage:', payload.currentStage);
    return { status: 'fail', message: 'Current stage mismatch' };
  }

  // 점수 검증 절차
  const serverTime = Date.now(); // 현재 타임스탬프
  const elapsedTime = (serverTime - serverStage[0].timestamp) / 1000; // 단위가 밀리세컨드기 때문에 초단위로 계산하려면 1000으로 나누어줘야 한다.
  console.log('Elapsed time:', elapsedTime);

  // 임의로 정한 오차범위(±0.5)를 넘었을 경우 fail
  if (elapsedTime < 9.5 || elapsedTime > 10.5) {
    console.log('Server elapsedTime:', elapsedTime);
    return { status: 'fail', message: 'Invalid elapsed time' };
  }

  // targetStage에 대한 검증 <- 게임 에셋에 존재하는 스테이지인가?
  const { stages } = getGameAssets();
  if (!stages.data.some((stage) => stage.id === payload.targetStage)) {
    return { status: 'fail', message: 'Target stage not found' };
  }

  await setStage(userId, payload.targetStage, serverTime);
  console.log('Stage successfully updated to:', payload.targetStage);
  return { status: 'success' };
};
```

### 2. 스테이지에 따른 점수 획득 & 5. 아이템 별 획득 점수 구분
10초마다 스테이지가 자동으로 넘어가기 때문에 스테이지당 점수는 존재하지 않지만, 스테이지가 올라가면 더 새로운 재료가 등장하고 희귀도에 따라 점수를 다르게 부여했습니다. (ingredient.json 파일 참고)
```json
{
  "name": "ingredient",
  "version": "1.0.0",
  "data": [
    { "id": 1, "type": 1, "score": 10, "name": "떡" },
    { "id": 2, "type": 2, "score": 20, "name": "고추장" },
    { "id": 3, "type": 3, "score": 30, "name": "라면" },
    { "id": 4, "type": 4, "score": 40, "name": "치즈" },
    { "id": 5, "type": 5, "score": 50, "name": "순대" },
    { "id": 6, "type": 6, "score": 60, "name": "볶음밥" }
  ]
}
```

### 3. 스테이지에 따라 아이템이 생성
(1) 서버측 게임 에셋에 재료가 해금되는 데이터를 json형식으로 저장했습니다.
```json
{
  "name": "ingredient_unlock",
  "version": "1.0.0",
  "data": [
    { "id": 101, "stage_id": 1000, "ingredient_type": 1 },
    { "id": 201, "stage_id": 1001, "ingredient_type": 2 },
    { "id": 301, "stage_id": 1002, "ingredient_type": 3 },
    { "id": 401, "stage_id": 1003, "ingredient_type": 4 },
    { "id": 501, "stage_id": 1004, "ingredient_type": 5 },
    { "id": 601, "stage_id": 1005, "ingredient_type": 6 }
  ]
}
```

(2) 기존에 아이템을 생성할 때 image 배열에서 랜덤한 인덱스를 골라 생성하였는데, 저는 그 랜덤한 인덱스를 제한하는 방식으로 구현하였습니다.(혹시 클라이언트가 변조되어서 획득해선 안 되는 아이템을 패킷으로 보낼 때를 대비하여 서버에서 검증 절차 진행합니다.)
**클라이언트 측 코드:** 
=> 클라이언트 측의 ingredientController.js에서 IngredientController 객체는 다음과 같은 생성자 함수를 가지고 있습니다.
```js
constructor(ctx, ingredientImages, scaleRatio, speed) {
	this.ctx = ctx;
	this.canvas = ctx.canvas;
	this.ingredientImages = ingredientImages;
	this.scaleRatio = scaleRatio;
	this.speed = speed;

	this.setNextIngredientTime();
}
```
두 번째 변수로 이미지의 배열을 받게 되는데요. 스테이지 ID가 1000부터 1씩 증가한다는 점을 이용하여 아이템의 인덱스를 제한하였습니다.
```js
createIngredient(score) {
	// 클라이언트 상의 stageId
	const currentStageId = score.stageId || 1000;
	// stageId를 통해 해당 스테이지에서 나올 수 있는 아이템의 Id를 계산한다.
	let ingredientIndex = currentStageId - 1000;
	if (ingredientIndex > 5) ingredientIndex = 5;
	// 랜덤한 아이템을 생성할 때 위에서 구한 인덱스 범위 내에서 생성한다.
	const index = this.getRandomNumber(0, ingredientIndex);
	const ingredientInfo = this.ingredientImages[index];
 // ... 생략 ... 
	this.ingredients.push(ingredient);
}
```

### 4. 아이템 획득 시 점수 획득
플레이어의 스프라이트 이미지가 재료 아이템의 스프라이트 이미지와 부딪힐 때, 아래와 같은 메서드가 실행됩니다. 부딪힌 재료 아이템의 Id를 보내면 서버는 그 재료가 가진 점수를 응답해줍니다.
**클라이언트 측 코드:** 
```js
getIngredient = async (ingredientId) => {
	const clientScore = this.score;
	const clientStageId = Math.floor(this.time / 10) + 1000;
	const clientTimestamp = Date.now(); // 현재 타임스탬프

	try {
		// 서버에 패킷을 보내고, 재료의 스코어 데이터를 응답받는다.
		const ingScoreResponse = await sendEvent(5, {
			clientIngId: ingredientId,
			clientScore,
			clientStageId,
			clientTimestamp,
		});
		console.log('ingScoreResponse: ', ingScoreResponse);
		const serverIngScore = ingScoreResponse.message;
		console.log('serverIngScore: ', serverIngScore);

		this.score += serverIngScore;

		if (this.score > this.highScore) {
			this.highScore = this.score;
		}
	} catch (err) {
		console.error(err.message);
	}
};
```
**서버 측 코드:** 
```js
export const obtainScore = async (userId, payload) => {
  // 재료의 id와 획득한 점수, 현재 스테이지id, timestamp를 받아야 한다.
  const { clientIngId, clientScore, clientStageId, clientTimestamp } = payload;

  // ingredientId를 바탕으로 재료의 스코어구하기
  const { ingredients } = getGameAssets();
  const serverIngScore = ingredients.data[clientIngId - 1].score;

  // 현재 스테이지에서 획득할 수 있는 아이템인지 검증
  const { ingredientUnlocks } = getGameAssets();

  // 1스테이지엔 1번 타입 재료들이 언락 되고, 2스테이지엔 2번 타입 재료들이 언락되고...반복하기 때문에 
  // => 언락 스테이지Id = 재료의 타입 - 1 
  const serverIngType = ingredients.data[clientIngId - 1].type;
  const ingUnlockStageId = ingredientUnlocks.data[serverIngType - 1].stage_id;
  // 재료를 획득한 스테이지가 재료가 언락되는 스테이지보다 작은 id를 가졌을 때
  if (clientStageId < ingUnlockStageId) {
    return {
      status: 'fail',
      message: 'Score obtained through unauthorized means',
    };
  }

  // 재료를 획득하는 빈도 검증하기(어뷰저 적발)
  // 최근 5번의 재료 획득 timestamp를 추출하고, 가장 최근의 5번째 요소-1번째 요소 => 1초 미만이라면 어뷰저로 판단한다.
  try {
    // 새로운 점수 저장하기
    await setScore(userId, serverIngScore);
    // 어뷰저 검증 - 최근 5개의 점수 타임스탬프 확인
    const recentScores = await getScore(userId, 5); // 최신 5개 점수 가져오기

    if (recentScores.length >= 5) {
      // map()을 써서 다섯 개의 레코드의 timestamp로 새로운 배열 생성
      const timestamps = recentScores.map((entry) => entry.timestamp);
      // 첫 번째 레코드의 timestamp에서 마지막 레코드의 timestamp를 뺀다.
      // 왜냐하면 redis의 lpush 명령어는 리스트의 맨앞에 데이터를 추가하기 때문이다.
      const timestampDiff = timestamps[0] - timestamps[timestamps.length - 1];
      console.log(`Obtain score time diff: ${timestampDiff / 1000}`);

      // 1초 미만이면 어뷰저라고 판단
      if (timestampDiff / 1000 < 1) {
        return {
          status: 'fail',
          message: 'Score obtained through unauthorized means',
        };
      }
    }

    // 획득한 재료 인벤토리에 저장하기
    const inventoryData = JSON.stringify({ ingredientId: clientIngId });
    await redis.lpush(`inventory:${userId}`, inventoryData);

    // 최종: 클라이언트와 서버 간의 총 스코어가 동일해졌는지 검증
    const recentScore = recentScores[0]?.score || 0;
    const serverScore = recentScore;
    const newClientScore = clientScore + serverIngScore;

    if (newClientScore !== serverScore) {
      return { status: 'fail', message: 'Score mismatch' };
    }

    let result = {
      status: 'success',
      message: serverIngScore,
    };
    return result;
  } catch (err) {
    console.error(err.message);
  }
};
```

---

## 필수 기능 구현 방식 소개
### 1. Broadcast
이 기능을 따로 이용하고 싶어서 이벤트 리스너 함수를 분리했습니다. 아래 있는 건 공용으로 사용하는 이벤트 리스너 함수인데요. response에 broadcast 키가 존재한다면 return을 시켜줬습니다.
```js
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
```
그리고 index.js(html파일에 연결된 스크립트 파일)에서 broadcast가 존재하는 response만 받아 alert 함수를 실행시켜주었습니다. alert함수는 html에 만들어둔 전광판에 메시지를 출력하는 역할을 맡고 있습니다!
```js
socket.on('response', (response) => {
  if (response.broadcast) {
    alert(response);
  }
});

export function alert(response) {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) {
    console.error('Alert box element with ID "alertBox" not found.');
    return;
  }
  alertBox.innerHTML = response.message;
}
```
### 2. uuid로 유저 정보 연결
처음 접속한 유저는 새로 uuid를 발급 받고 로컬 스토리지에 저장하게 됩니다. 추후에 방문했을 때 서버에 해당 uuid를 전송하도록 하였습니다.
**클라이언트 측 코드:**
```js
let userId = localStorage.getItem('userUUID') || null;

socket.on('connection', (data) => {
  if (!userId) {
    userId = data.userUUID;
    localStorage.setItem('userUUID', userId);
  } else {
    socket.emit('register', { uuid: userId });
  }

  console.log('connection: ', userId);
});
```
**서버 측 코드:**
```js
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
        // 환영 메시지
        socket.emit('register', {
          status: 'success',
          message: `안녕하세요, 플레이어 ${userUUID}님! 또 오셨네요! 플레이어 님의 최고 기록은 ${highScore}점입니다!`,
        });
      }
      
			// 유저 데이터 생성
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
```

### 3. Redis와 연동
( O w O ) b

### 도전 기능 테스트
**(1) uuid와 유저 정보 연결**

로컬 스토리지에 uuid가 저장되어 있다면 재방문한 플레이어에게 환영 메시지와 최고 기록을 안내합니다.
![image](https://github.com/user-attachments/assets/7555bc85-3ee0-45df-9638-760b9bab8923)
새롭게 발급된 uuid라면 환영 메시지는 뜨지 않습니다.
![image](https://github.com/user-attachments/assets/7fd95bb1-2a0a-41ac-908a-a269ba7b9029)

**(2) 연결된 유저 정보를 이용한 Broadcast**

플레이어가 최고 기록을 세운다면, 해당 플레이어의 uuid와 달성한 점수를 Broadcast로 모든 유저에게 알립니다. 아래 이미지는 Edge 브라우저의 프라이빗 모드로 접속했을 때의 예시입니다.

=> 플레이어1이 최고 기록을 기록한 경우
플레이어1의 화면 (uuid: 69ad8c60-c202-43b6-a583-2dad7465b22b)
![image](https://github.com/user-attachments/assets/79f3cab4-02ea-46d2-bd85-92927b358ef5)
플레이어2의 화면 (uuid: 6c17b1bc-91b6-4c1e-b7e8-01a8962ebf00)
![image](https://github.com/user-attachments/assets/d8ec824d-927a-443a-a2ea-4d9be217448a)

uuid별로 최고 기록이 따로 기록됩니다!
![image](https://github.com/user-attachments/assets/c133a75f-f4f2-42ae-9b8a-8fd11305b002)

