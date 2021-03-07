// const { databases } = require("../db/testdata");
const databases = [
  {
    id: 1,
    providerIds: [1],
    consumerIds: [1, 2],
    title: "Philippine Sea 1",
    body: "test1",
    createdAt: "2018-10-22T01:40:14.941Z"
  },
  {
    id: 2,
    authorId: [2],
    consumerIds: [2, 3],
    title: "Philippine Sea 2",
    body: "test2",
    createdAt: "2018-10-24T01:40:14.941Z"
  }
];
// helper functions
const filterConsumedDbByUserId = (userId) =>
  databases.filter((database) => database.providerIds.includes(Number(userId)));
const findDbByName = (title) =>
  databases.find((database) => title === database.title);
const findDbByDbId = (databaseId) =>
  databases.find((database) => database.id === Number(databaseId));

// Mutations
const updateDatabase = (postId, data) =>
  Object.assign(findDbByDbId(postId), data);

const addDatabase = ({ providers, consumers, title, body }) =>
  (databases[databases.length] = {
    id: databases[databases.length - 1].id + 1,
    providers,
    consumers,
    title,
    body,
    createdAt: new Date().toISOString()
  });

// module.exports = {
//   filterConsumedDbByUserId,
//   findDbByName,
//   findDbByDbId,
//   addDatabase,
//   updateDatabase
// };
module.exports = {
  findDbByName: (title) =>
    databases.find((database) => title === database.title)
};
