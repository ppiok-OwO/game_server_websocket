// 스테이지 관련 CRUD 함수

// key: uuid, value: array -> stage 정보는 배열
const stages = {};

// 스테이지 초기화
export const createStage = (uuid) => {
  stages[uuid] = [];
};

export const getStage = (uuid) => {
  return stages[uuid];
};

export const setStage = async (uuid, id, timestamp) => {
  return await stages[uuid].push({ id, timestamp });
};

export const clearStage = (uuid) => (stages[uuid] = []);
