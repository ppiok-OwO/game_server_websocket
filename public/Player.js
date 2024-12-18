class Player {
  WALK_ANIMATION_TIMER = 200;
  walkAnimationTimer = this.WALK_ANIMATION_TIMER;
  ninjaFrogImages = [];

  //점프 상태값
  jumpPressed = false;
  jumpInProgress = false;
  falling = false;
  jumpCount = 0; // 점프 횟수 추가

  JUMP_SPEED = 1;
  GRAVITY = 0.5;

  // 생성자
  constructor(ctx, width, height, minJumpHeight, maxJumpHeight, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.width = width;
    this.height = height;
    this.minJumpHeight = minJumpHeight;
    this.maxJumpHeight = maxJumpHeight;
    this.scaleRatio = scaleRatio;

    this.x = 10 * scaleRatio;
    this.y = this.canvas.height - this.height - 1.5 * scaleRatio;
    // 기본 위치 상수화
    this.yStandingPosition = this.y;

    this.standingStillImage = new Image();
    this.standingStillImage.src = 'images/characters/ninjafrog.png';
    this.image = this.standingStillImage;

    // 달리기
    const ninjaFrogImage1 = new Image();
    ninjaFrogImage1.src = 'images/characters/ninjafrog.png';

    const ninjaFrogImage2 = new Image();
    ninjaFrogImage2.src = 'images/characters/ninjafrogjump.png';

    this.ninjaFrogImages.push(ninjaFrogImage1);
    this.ninjaFrogImages.push(ninjaFrogImage2);

    // 키보드 설정
    // 등록된 이벤트가 있는 경우 삭제하고 다시 등록
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);

    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);
  }

  keydown = (event) => {
    if (event.code === 'Space' && this.jumpCount < 2) {
      this.jumpPressed = true;
      this.jumpCount++; // 점프 횟수 증가
      this.falling = false;
    }
  };

  keyup = (event) => {
    if (event.code === 'Space') {
      this.jumpPressed = false;
    }
  };

  update(gameSpeed, deltaTime) {
    this.run(gameSpeed, deltaTime);

    if (this.jumpInProgress) {
      this.image = this.standingStillImage;
    }

    this.jump(deltaTime);
  }

  jump(deltaTime) {
    if (this.jumpPressed) {
      this.jumpInProgress = true;
    }

    // 상승 조건: 점프 중이고, 최대 높이에 도달하지 않았을 때
    if (this.jumpInProgress && !this.falling) {
      if (
        this.y > this.canvas.height - this.minJumpHeight ||
        (this.y > this.canvas.height - this.maxJumpHeight && this.jumpPressed)
      ) {
        this.y -= this.JUMP_SPEED * deltaTime * this.scaleRatio;
      } else {
        this.falling = true; // 최대 높이에 도달하면 낙하 시작
      }
    }

    // 낙하 조건: 플레이어가 서 있는 위치보다 위에 있을 때
    if (this.falling) {
      if (this.y < this.yStandingPosition) {
        this.y += this.GRAVITY * deltaTime * this.scaleRatio;
      } else {
        // 착지 시 상태 초기화
        this.y = this.yStandingPosition;
        this.falling = false;
        this.jumpInProgress = false;
        this.jumpCount = 0; // 착지 시 점프 횟수 초기화
      }
    }
  }

  run(gameSpeed, deltaTime) {
    if (this.walkAnimationTimer <= 0) {
      if (this.image === this.ninjaFrogImages[0]) {
        this.image = this.ninjaFrogImages[1];
      } else {
        this.image = this.ninjaFrogImages[0];
      }
      this.walkAnimationTimer = this.WALK_ANIMATION_TIMER;
    }

    this.walkAnimationTimer -= deltaTime * gameSpeed;
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

export default Player;
