import Ingredient from './Ingredient.js';

class IngredientController {
  INGREDIENT_INTERVAL_MIN = 500;
  INGREDIENT_INTERVAL_MAX = 2000;

  nextIngredientInterval = null;
  ingredients = [];

  constructor(ctx, ingredientImages, scaleRatio, speed) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.ingredientImages = ingredientImages;
    this.scaleRatio = scaleRatio;
    this.speed = speed;

    this.setNextIngredientTime();
  }

  setNextIngredientTime() {
    this.nextIngredientInterval = this.getRandomNumber(
      this.INGREDIENT_INTERVAL_MIN,
      this.INGREDIENT_INTERVAL_MAX,
    );
  }

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  createIngredient(score) {
    const currentStageId = score.stageId || 1000;
    const ingredientIndex = currentStageId - 1000; // 인덱스
    const index = this.getRandomNumber(0, ingredientIndex);
    const ingredientInfo = this.ingredientImages[index];
    const x = this.canvas.width * 1.5;
    const y = this.getRandomNumber(
      10,
      this.canvas.height - ingredientInfo.height,
    );

    const ingredient = new Ingredient(
      this.ctx,
      ingredientInfo.id,
      x,
      y,
      ingredientInfo.width,
      ingredientInfo.height,
      ingredientInfo.image,
    );

    this.ingredients.push(ingredient);
  }

  update(gameSpeed, deltaTime, score) {
    if (this.nextIngredientInterval <= 0) {
      // 재료 생성
      this.createIngredient(score);
      this.setNextIngredientTime();
    }

    this.nextIngredientInterval -= deltaTime;

    this.ingredients.forEach((ingredient) => {
      ingredient.update(this.speed, gameSpeed, deltaTime, this.scaleRatio);
    });

    // 지나간 재료 삭제
    this.ingredients = this.ingredients.filter(
      (ingredient) => ingredient.x > -ingredient.width,
    );
  }

  draw() {
    this.ingredients.forEach((ingredient) => ingredient.draw());
  }

  collideWith(sprite) {
    const collidedIngredient = this.ingredients.find((ingredient) =>
      ingredient.collideWith(sprite),
    );
    if (collidedIngredient) {
      this.ctx.clearRect(
        collidedIngredient.x,
        collidedIngredient.y,
        collidedIngredient.width,
        collidedIngredient.height,
      );
      return {
        ingredientId: collidedIngredient.id,
      };
    }
  }

  reset() {
    this.ingredients = [];
  }
}

export default IngredientController;
