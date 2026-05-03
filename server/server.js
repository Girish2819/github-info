import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: "http://github-info-ashy.vercel.app/"
}));
app.use(express.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});


app.get("/api/github", async (req, res) => {
  try {
    const username = req.query.username;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const response = await axios.get(
      `https://api.github.com/users/${username}`
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch GitHub data",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});