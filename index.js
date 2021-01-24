const {
  ApolloServer,
  gql,
  ForbiddenError,
  AuthenticationError
} = require("apollo-server");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 定義 bcrypt 加密所需 saltRounds 次數
const SALT_ROUNDS = 2;
// 定義 jwt 所需 secret (可隨便打)
const SECRET = "just_a_random_secret";

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

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Database {
    id: ID!
    providers: [User]
    consumers: [User]
    title: String
    body: String
    createdAt: String
  }

  type User {
    id: ID!
    email: String!
    name: String
    consumedDbs: [Database]
  }

  type Query {
    "test: Hello World"
    hello: String
    "get current user"
    me: User
    "get available databases"
    databases: [Database]
    "find db based on id"
    database(name: String!): Database
  }

  input AddDatabase {
    title: String!
    body: String
  }

  type Token {
    token: String!
  }

  type Mutation {
    addProvider(userId: ID!): User
    addConsumer(userId: ID!): User
    addDatabase(input: AddDatabase!): Database
    deleteDatabase(databaseId: ID!): Database
    signUp(name: String, email: String!, password: String!): User
    login(email: String!, password: String!): Token
  }
`;

// helper functions
// Queries
const findUserByUserId = (userId) =>
  users.find((user) => user.id === Number(userId));
const filterConsumedDbByUserId = (userId) =>
  databases.filter((database) => database.providerIds.includes(Number(userId)));
const findDbByName = (title) =>
  databases.find((database) => title === database.title);
const findDbByDbId = (databaseId) =>
  databases.find((database) => database.id === Number(databaseId));
/*
  // Mutations
const updateUserInfo = (userId, data) =>
  Object.assign(findUserByUserId(userId), data);

const addPost = ({ authorId, title, body }) =>
  (posts[posts.length] = {
    id: posts[posts.length - 1].id + 1,
    authorId,
    title,
    body,
    likeGiverIds: [],
    createdAt: new Date().toISOString()
  });

const updatePost = (postId, data) =>
  Object.assign(findPostByPostId(postId), data);

const addUser = ({ name, email, password }) =>
  (users[users.length] = {
    id: users[users.length - 1].id + 1,
    name,
    email,
    password
  });

const deletePost = (postId) =>
  posts.splice(
    posts.findIndex((post) => post.id === postId),
    1
  )[0];
*/
const hash = (text) => bcrypt.hash(text, SALT_ROUNDS);

const createToken = ({ id, email, name }) =>
  jwt.sign({ id, email, name }, SECRET, {
    expiresIn: "1d"
  });

const isAuthenticated = (resolverFunc) => (parent, args, context) => {
  if (!context.me) throw new ForbiddenError("Not logged in.");
  return resolverFunc.apply(null, [parent, args, context]);
};

const isPostAuthor = (resolverFunc) => (parent, args, context) => {
  const { databaseId } = args;
  const { me } = context;
  const isAuthor = findDbByDbId(Number(databaseId)).authorId === me.id;
  if (!isAuthor) throw new ForbiddenError("Only provider Can Delete this Post");
  return resolverFunc.applyFunc(parent, args, context);
};

// Resolvers
const resolvers = {
  Query: {
    hello: () => "world",
    me: isAuthenticated((root, args, { me }) => findUserByUserId(me.id)),
    databases: () => databases,
    database: (root, { name }, context) => findDbByName(name)
  },
  User: {
    consumedDbs: (parent, args, context) =>
      filterConsumedDbByUserId(parent.id || [])
  },
  Database: {
    consumers: (parent, args, context) => findUserByUserId(parent.consumerId)
  },
  Mutation: {
    /*
    updateMyInfo: isAuthenticated((parent, { input }, { me }) => {
      // 過濾空值
      const data = ["name", "age"].reduce(
        (obj, key) => (input[key] ? { ...obj, [key]: input[key] } : obj),
        {}
      );

      return updateUserInfo(me.id, data);
    }),
    addFriend: isAuthenticated((parent, { userId }, { me: { id: meId } }) => {
      const me = findUserByUserId(meId);
      if (me.friendIds.include(userId))
        throw new Error(`User ${userId} Already Friend.`);

      const friend = findUserByUserId(userId);
      const newMe = updateUserInfo(meId, {
        friendIds: me.friendIds.concat(userId)
      });
      updateUserInfo(userId, { friendIds: friend.friendIds.concat(meId) });

      return newMe;
    }),
    addPost: isAuthenticated((parent, { input }, { me }) => {
      const { title, body } = input;
      return addPost({ authorId: me.id, title, body });
    }),
    likePost: isAuthenticated((parent, { postId }, { me }) => {
      const post = findPostByPostId(Number(postId));

      if (!post) throw new Error(`Post ${postId} Not Exists`);

      if (!post.likeGiverIds.includes(postId)) {
        return updatePost(postId, {
          likeGiverIds: post.likeGiverIds.concat(me.id)
        });
      }
      return updatePost(postId, {
        likeGiverIds: post.likeGiverIds.filter((id) => id === me.id)
      });
    }),
    deletePost: isAuthenticated(
      isPostAuthor((root, { postId }, { me }) => deletePost(postId))
    ),
    
    signUp: async (root, { name, email, password }, context) => {
      // 1. 檢查不能有重複註冊 email
      const isUserEmailDuplicate = users.some((user) => user.email === email);
      if (isUserEmailDuplicate) throw new Error("User Email Duplicate");

      // 2. 將 passwrod 加密再存進去。非常重要 !!
      const hashedPassword = await hash(password, SALT_ROUNDS);
      // 3. 建立新 user
      return addUser({ name, email, password: hashedPassword });
    },
    */
    login: async (root, { email, password }, context) => {
      // 1. 透過 email 找到相對應的 user
      const user = users.find((user) => user.email === email);
      if (!user) throw new Error("Email Account Not Exists");

      // 2. 將傳進來的 password 與資料庫存的 user.password 做比對
      const passwordIsValid = await bcrypt.compare(password, user.password);
      if (!passwordIsValid) throw new AuthenticationError("Wrong Password");

      // 3. 成功則回傳 token
      return { token: await createToken(user) };
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    // 1. 取出 token
    const token = req.headers["x-token"];
    if (token) {
      try {
        // 2. 檢查 token + 取得解析出的資料
        const me = await jwt.verify(token, SECRET);
        // 3. 放進 context
        return { me };
      } catch (e) {
        throw new Error("Your session expired. Sign in again.");
      }
    }
    // 如果沒有 token 就回傳空的 context 出去
    return {};
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
