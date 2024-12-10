import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url); // 현재 파일의 절대 경로
const __dirname = path.dirname(__filename); // 현재 파일이 속한 디렉토리
const basePath = path.join(__dirname, '../../assets'); // 최상위 폴더 + 에셋 폴더로의 절대 경로

// gameAssets 를 전역변수로 선언한다.
let gameAssets = {};

// 파일 읽는 함수
// 비동기 병렬로 파일을 읽는다.(다수의 파일을 동시에 읽는다.)
const readFileAsync = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(basePath, filename), 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(JSON.parse(data));
    });
  });
};

// Promise.all()
export const loadGameAssets = async () => {
  try {
    const [stages, items, itemUnlocks] = await Promise.all([
      readFileAsync('stage.json'),
      readFileAsync('item.json'),
      readFileAsync('item_unlock.json'),
    ]);

    gameAssets = { stages, items, itemUnlocks };
    return gameAssets;
  } catch (err) {
    throw new Error('Failed to load game: ' + err.message);
  }
};

// 게임에셋에 접근할 수 있도록 get 함수도 같이 생성한다.
export const getGameAssets = () => {
  return gameAssets;
};
