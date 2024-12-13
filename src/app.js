import express from 'express';
import { createServer } from 'http';
import initSocket from './init/socket.js';
import { loadGameAssets } from './init/asset.js';
import path from 'path';
import errorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const app = express();
const server = createServer(app);

const PORT = 3000;
// 정적 파일 경로 설정
const __dirname = path.resolve(); // 현재 디렉토리 경로

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
initSocket(server);

app.use(errorHandlingMiddleware);

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // 이 곳에서 파일 읽음
    const assets = await loadGameAssets();
    console.log(assets);
    console.log('Assets loaded successfully');
  } catch (err) {
    console.error('Failed to load game assets: ', err);
  }
});
