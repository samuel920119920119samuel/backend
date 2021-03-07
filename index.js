require("dotenv").config();

const {
  ApolloServer,
  gql,
  ForbiddenError,
  AuthenticationError
} = require("apollo-server");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userModel, databaseModel } = require("./model");

// Env Var
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
const SECRET = process.env.SECRET;

// Helper Functions
const hash = (text) => bcrypt.hash(text, SALT_ROUNDS);

const createToken = ({ id, email, name }) =>
  jwt.sign({ id, email, name }, SECRET, {
    expiresIn: "1d"
  });

const isAuthenticated = (resolverFunc) => (parent, args, context) => {
  if (!context.me) throw new ForbiddenError("Not logged in.");
  return resolverFunc.apply(null, [parent, args, context]);
};

/*
const isPostAuthor = (resolverFunc) => (parent, args, context) => {
  const { databaseId } = args;
  const { me } = context;
  const isAuthor = findDbByDbId(Number(databaseId)).authorId === me.id;
  if (!isAuthor) throw new ForbiddenError("Only provider Can Delete this Post");
  return resolverFunc.applyFunc(parent, args, context);
};
*/

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

  input UpdateMyInfoInput {
    name: String
    age: Int
  }

  input AddDatabase {
    title: String!
    body: String
  }

  type Token {
    token: String!
  }

  type Mutation {
    updateMyInfo(input: UpdateMyInfoInput!): User
    addconsumedDbs(databaseId: ID!): User
    addDatabase(input: AddDatabase!): Database
    signUp(name: String, email: String!, password: String!): User
    login(email: String!, password: String!): Token
  }
`;

// Resolvers
const resolvers = {
  Query: {
    hello: () => "world",
    me: isAuthenticated((root, args, { me, userModel }) =>
      userModel.findUserByUserId(me.id)
    ),
    database: (root, { name }, { databaseModel }) =>
      databaseModel.findDbByName(name)
  },
  User: {
    consumedDbs: (parent, args, context) =>
      databaseModel.filterConsumedDbByUserId(parent.id || [])
  },
  Database: {
    consumers: (parent, args, context) =>
      userModel.findUserByUserId(parent.consumerId)
  },
  Mutation: {
    // User
    updateMyInfo: isAuthenticated((parent, { input }, { me }) => {
      const data = ["name"].reduce(
        (obj, key) => (input[key] ? { ...obj, [key]: input[key] } : obj),
        {}
      );
      return userModel.updateUserInfo(me.id, data);
    }),
    addconsumedDbs: isAuthenticated(
      (parent, { databaseId }, { me: { id: meId } }) => {
        const me = userModel.findUserByUserId(meId);
        if (me.consumedDbIds.include(databaseId))
          throw new Error(`User ${databaseId} Already consumed.`);
        const database = databaseModel.findDbByDbId(databaseId);
        const newMe = userModel.updateUserInfo(meId, {
          databaseId: me.consumedDbIds.concat(databaseId)
        });
        databaseModel.updateDatabase(databaseId, {
          meId: database.consumerIds.concat(meId)
        });
        return newMe;
      }
    ),
    // Database
    addDatabase: isAuthenticated((parent, { input }, { me }) => {
      const { provider, consumer, title, body } = input;
      return databaseModel.addDatabase({ provider, consumer, title, body });
    }),
    /*
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
    */
    signUp: async (root, { name, email, password }, context) => {
      // check duplicated email
      const isUserEmailDuplicate = userModel.isUserEmailDuplicate(email);
      if (isUserEmailDuplicate) throw new Error("User Email Duplicate");
      // Encrypt password
      const hashedPassword = await hash(password, SALT_ROUNDS);
      // Add a new user
      return userModel.addUser({ name, email, password: hashedPassword });
    },
    login: async (root, { email, password }, context) => {
      // find user through email
      const user = userModel.findUserByEmail(email);
      if (!user) throw new Error("Email Account Not Exists");
      // compare password
      const passwordIsValid = await bcrypt.compare(password, user.password);
      if (!passwordIsValid) throw new AuthenticationError("Wrong Password");
      // return token
      return { token: await createToken(user) };
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const context = {
      secret: SECRET,
      saltRounds: SALT_ROUNDS,
      userModel,
      databaseModel
    };
    // get token
    const token = req.headers["x-token"];
    if (token) {
      try {
        // check token and get info
        const me = await jwt.verify(token, SECRET);
        // store in the context
        return { me };
      } catch (e) {
        throw new Error("Your session expired. Sign in again.");
      }
    }
    return context;
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
