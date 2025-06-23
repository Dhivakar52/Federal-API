const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const trendsRouter = require("./routes/trends");
const summarizeRouter = require("./routes/summary");
const flashRouter = require("./routes/flash");
const peerRouter = require("./routes/peer");
const newsRoutes = require("./routes/tubesrcipt");
const privotRoutes = require("./routes/privot");
const employeeRegister = require("./routes/register");
const employeeLogin = require("./routes/login");
const employeeLogOut = require("./routes/logout");
const opinionRouter = require('./routes/opinion');
const editorialRouter = require('./routes/editorial');
const resetPassword = require('./routes/reset_password');

const userDetail = require("./routes/userDetail");
const userId= require('./routes/userId');
const userDelete=  require('./routes/userDelete');
const userAdd= require('./routes/userAdd');

const morgan = require("morgan");
const punycode = require("punycode/");
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

mongoose
  .connect("mongodb://127.0.0.1:27017/employee", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Routes
app.use("/trends", trendsRouter);
app.use("/summary", summarizeRouter);
app.use("/flash", flashRouter);
app.use("/peer", peerRouter);
app.use("/api", newsRoutes);
app.use("/privot", privotRoutes);
app.use("/register", employeeRegister);
app.use("/logout", employeeLogOut);
app.use("/", employeeLogin);
app.use('/opinion', opinionRouter);
app.use('/editorial', editorialRouter);
app.use('/reset-password', resetPassword);
//  For Admin Panel

app.use("/userDetails", userDetail);
  app.use("/userDetails",userId);
 app.use('/userDetails',userDelete); 
 app.use('/userDetails',userDelete); 
 app.use('/userDetails',userAdd); 

 //  For Admin Panel
// app.use('/form', employeeForm);
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
