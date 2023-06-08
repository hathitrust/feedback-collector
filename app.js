const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// API requests

// JSON middleware for incoming requests
app.use("/api", express.json());

// Enable cors
app.use("/api", cors());

// enable logging
app.use(morgan('combined'))

// Rate limiting
// returns 429 'Too many requests' error if limit is hit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 minutes
  max: 5, //max number of requests during timeframe
  message: `{"limit error": "Too many requests"}`,
});
app.use("/api", limiter);
app.set("trust proxy", 1);

app.use("/api", require("./routes"));


// Health check

const healthcheck_routes = express.Router();
healthcheck_routes.get(
  "/",

  async (req, res) => {
    res.status(200).send("ok")
  }
)
app.use("/health", healthcheck_routes);

module.exports = app // for testing
