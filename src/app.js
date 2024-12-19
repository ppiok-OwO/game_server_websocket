import express from 'express';
import { createServer } from 'http';
import initSocket from './init/socket.js';
import { loadGameAssets } from './init/asset.js';
import path from 'path';
import errorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config(); // .env 파일 로드

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3002;

// Redis 연결 설정
const redis = new Redis({
  host: process.env.REDIS_HOST, // Redis 서버 호스트
  port: process.env.REDIS_PORT, // Redis 기본 포트
  // username: process.env.REDIS_USERNAME,
  // password: process.env.REDIS_PASSWORD,
});

// Redis 연결 상태 확인
redis.on('connect', () => {
  console.log('Redis에 성공적으로 연결되었습니다.');
});
redis.on('error', (err) => {
  console.error('Redis 연결 중 에러 발생:', err);
});
// 서버 종료 시 Redis 연결 종료
process.on('SIGINT', () => {
  redis.quit();
  console.log('Redis 연결이 종료되었습니다.');
  process.exit();
});

// Middleware 또는 전역 객체에 Redis 추가
app.use((req, res, next) => {
  req.redis = redis; // 모든 요청 객체에 Redis 인스턴스를 생성
  next();
});

// Express 설정
const __dirname = path.resolve(); // 현재 디렉토리 경로
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  express.static('public', {
    etag: false, // ETag 비활성화
    maxAge: '0', // 캐시 무효화
  }),
);

// 소켓 초기화
initSocket(server);

// 에러핸들링 미들웨어
app.use(errorHandlingMiddleware);

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // 이 곳에서 파일 읽음
    const assets = await loadGameAssets();
    console.log('Assets loaded successfully', assets);
  } catch (err) {
    console.error('Failed to load game assets: ', err);
  }
});
