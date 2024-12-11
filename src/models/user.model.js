// 유저 관련 CRUD 함수
const users = []; // 접속 중인 유저의 배열

export const addUser = (user) => {
  users.push(user);
};

export const removeUser = (socketId) => {
  const index = users.findIndex((user) => user.socketId === socketId);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

export const getUsers = () => {
  return users;
};
