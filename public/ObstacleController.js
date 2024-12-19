import Obstacle from './Obstacle.js';

class ObstacleController {
  OBSTACLE_INTERVAL_MIN = 500;
  OBSTACLE_INTERVAL_MAX = 2000;

  nextObstacleInterval = null;
  obstacle = [];

  constructor(ctx, obstacleImages, scaleRatio, speed) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.obstacleImages = obstacleImages;
    this.scaleRatio = scaleRatio;
    this.speed = speed;

    this.setNextObstacleTime();
  }

  setNextObstacleTime() {
    this.nextObstacleInterval = this.getRandomNumber(
      this.OBSTACLE_INTERVAL_MIN,
      this.OBSTACLE_INTERVAL_MAX,
    );
  }

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  createObstacle() {
    const index = this.getRandomNumber(0, this.obstacleImages.length - 1);
    const obstacleImage = this.obstacleImages[index];
    const x = this.canvas.width * 1.5;
    const y = this.canvas.height - obstacleImage.height;

    const obstacle = new Obstacle(
      this.ctx,
      obstacleImage.id,
      x,
      y,
      obstacleImage.width,
      obstacleImage.height,
      obstacleImage.image,
    );

    this.obstacle.push(obstacle);
  }

  update(gameSpeed, deltaTime) {
    if (this.nextObstacleInterval <= 0) {
      // 장애물 생성
      this.createObstacle();
      this.setNextObstacleTime();
    }

    this.nextObstacleInterval -= deltaTime;

    this.obstacle.forEach((obstacle) => {
      obstacle.update(this.speed, gameSpeed, deltaTime, this.scaleRatio);
    });

    // 지나간 장애물 삭제
    this.obstacle = this.obstacle.filter(
      (obstacle) => obstacle.x > -obstacle.width,
    );
  }

  draw() {
    this.obstacle.forEach((obstacle) => obstacle.draw());
  }

  collideWith(sprite) {
    const collidedObstacle = this.obstacle.find(
      (obstacle) => obstacle.canDamage && obstacle.collideWith(sprite),
    );

    if (collidedObstacle) {
      collidedObstacle.canDamage = false; // 충돌 처리 후 비활성화
      return {
        obstacleId: collidedObstacle.id,
        canDamage: collidedObstacle.canDamage,
      };
    }
    return null; // 충돌이 없으면 null 반환
  }

  reset() {
    this.obstacle = [];
  }
}

export default ObstacleController;
