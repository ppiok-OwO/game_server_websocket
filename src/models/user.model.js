import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

// 유저 관련 CRUD 함수
const users = []; // 접속 중인 유저의 배열

export const checkUser = async (user) => {
  try {
    const isExistUser = await prisma.users.findFirst({
      where: {
        uuid: user.userId,
      },
    });

    return isExistUser;
  } catch (err) {
    console.error(err.name);
  }
};

export const addUser = async (user) => {
  users.push(user);
  // try {
  //   await prisma.users.create({
  //     data: {
  //       uuid: user.uuid,
  //       socketId: user.socketId,
  //     },
  //   });
  // } catch (err) {
  //   console.error(err.name);
  // }
};

export const removeUser = async (socketId) => {
  const index = users.findIndex((user) => user.socketId === socketId);
  if (index !== -1) {
    try {
    } catch (err) {
      console.error(err.name);
    }

    return users.splice(index, 1)[0];
  }
};

export const getUsers = () => {
  return users;
};
