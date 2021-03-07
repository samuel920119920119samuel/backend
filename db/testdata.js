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

module.exports = {
  databases,
  users
};
