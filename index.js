const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const app = express();

// JSON middleware for incoming requests
app.use(express.json());

// Enable cors
app.use(cors());

// Rate limiting
// returns 429 'Too many requests' error if limit is hit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 minutes
  max: 5, //max number of requests during timeframe
  message: `{"limit error": "Too many requests"}`,
});
app.use(limiter);
app.set("trust proxy", 1);

// Routes
app.use("/api", require("./routes"));

app.post("/", async (req, res) => {
  try {
    console.log(req.body);
    res.status(201).send("Issue created");
    // const issueRequest = await needle("post", JIRA_BASE_URL, options);
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
