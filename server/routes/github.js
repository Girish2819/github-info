const express = require("express");
const cors = require("cors");
require("dotenv").config();

const githubRoutes = require("./routes/github");

const app = express();
app.use(cors());

app.use("/api", githubRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});