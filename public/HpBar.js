import { ctx } from './index.js';

/** HP바 정의 */
// HP바 너비 계수
const HP_BAR_WIDTH_COEFF = 2;

const maxHp = 100;
export const HpBar = {
  x: 20,
  y: 25,
  max_width: maxHp * HP_BAR_WIDTH_COEFF,
  width: maxHp * HP_BAR_WIDTH_COEFF,
  height: 30,
  drawBG() {
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(this.x, this.y, this.max_width, this.height);
  },
  draw() {
    const my_gradient = ctx.createLinearGradient(
      0,
      this.y,
      0,
      this.y + this.height,
    ); // gradient
    my_gradient.addColorStop(0, '#800000');
    my_gradient.addColorStop(0.5, '#FF0000');
    my_gradient.addColorStop(1, '#FF7F50');
    ctx.fillStyle = my_gradient;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.max_width, this.height);
  },
};

export default HpBar;
