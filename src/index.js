const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });

const createServer = require("./createServer");
const db = require("./db");

const server = createServer();

// Use expresss middleware to handle cookies JWT

server.express.use(cookieParser());

// decode JWT so we ccsn get the user Id on each request
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  console.log("cadenas");
  console.log(req.cookies);
  console.log(token);
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    req.userId = userId;
  }
  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL
    }
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
  }
);
