//const { users } = require("../db/testdata");

const users = [
  {
    id: 1,
    email: "fong@test.com",
    password: "$2b$04$wcwaquqi5ea1Ho0aKwkZ0e51/RUkg6SGxaumo8fxzILDmcrv4OBIO", // 123456
    name: "Fong",
    consumedDbIds: [1]
  },

  {
    id: 2,
    email: "kevin@test.com",
    passwrod: "$2b$04$uy73IdY9HVZrIENuLwZ3k./0azDvlChLyY1ht/73N4YfEZntgChbe", // 123456
    name: "Kevin",
    consumedDbIds: [1, 2]
  },
  {
    id: 3,
    email: "mary@test.com",
    password: "$2b$04$UmERaT7uP4hRqmlheiRHbOwGEhskNw05GHYucU73JRf8LgWaqWpTy", // 123456
    name: "Mary",
    consumedDbIds: [2]
  }
];

// // helper functions
const findUserByUserId = (userId) =>
  users.find((user) => user.id === Number(userId));

// const findUserByEmail = (email) => users.find((user) => user.email === email);

// const isUserEmailDuplicate = (email) =>
//   users.some((user) => user.email === email);

// module.exports = {
//   findUserByUserId,
//   findUserByEmail,
//   isUserEmailDuplicate,
//   updateUserInfo,
//   addUser
// };

module.exports = {
  findUserByEmail: (email) => users.find((user) => user.email === email),
  isUserEmailDuplicate: (email) => users.some((user) => user.email === email),
  updateUserInfo: (userId, data) =>
    Object.assign(findUserByUserId(userId), data),
  addUser: ({ name, email, password }) =>
    (users[users.length] = {
      id: users[users.length - 1].id + 1,
      name,
      email,
      password
    })
};
