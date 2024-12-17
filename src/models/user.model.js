import Redis from 'ioredis';
const redis = new Redis(); // Redis 인스턴스 생성

// 유저 관련 CRUD 함수
const users = []; // 접속 중인 유저의 배열

export const addUser = async (user) => {
  try {
    users.push(user);
    await redis.hmset(`user:${user.uuid}`, {
      uuid: user.uuid,
      socketId: user.socketId,
      createdAt: Date.now(),
    });
    console.log(`User added to Redis: ${user.uuid}`);
  } catch (err) {
    console.error(err.message);
  }
};

export const removeUser = async (socketId) => {
  const index = users.findIndex((user) => user.socketId === socketId);
  if (index !== -1) {
    const removedUser = users.splice(index, 1)[0];
    try {
      await redis.del(`user:${removedUser.uuid}`);
      console.log(`User removed from Redis: ${removedUser.uuid}`);
      return removedUser;
    } catch (err) {
      console.error(err.message);
    }
  }
};

// 접속 중인 유저를 가져오는 함수
export const getUsers = async () => {
  try {
    const keys = await redis.keys('user:*');
    const users = await Promise.all(keys.map((key) => redis.hgetall(key)));
    return users;
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};
