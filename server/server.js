const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require('cors');
const dbConnect = require("./config/db/dbConnect");
const userRoutes = require("./route/users/usersRoute");
const { errorHandler, notFound } = require("./middlewares/error/errorHandler");
const postRoute = require("./route/posts/postRoute");
const commentRoute = require("./route/comments/commentRoute");
const emailRoutes = require("./route/email/emailRoute");
const categoryRoutes = require("./route/category/categoryRoute");

const app = express();
//DB
dbConnect();

//Middleware
app.use(express.json());
//
app.use(cors());

//Users route
app.use("/api/users", userRoutes);

// post Route
app.use('/api/posts',postRoute);

// comment Route
app.use('/api/comments',commentRoute);

// email route
app.use('/api/email',emailRoutes);

// category Route
app.use('/api/category',categoryRoutes);

//err handler
app.use(notFound);
app.use(errorHandler);

//server
const PORT = process.env.PORT || 4000;
app.listen(PORT, console.log(`Server is running ${PORT}`));
