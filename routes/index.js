const url = require("url");
const express = require("express");
const router = express.Router();
const needle = require("needle");

//Env vars
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_ISSUE_URL = process.env.JIRA_ISSUE_URL;
const JIRA_USERNAME = process.env.JIRA_USERNAME;
const JIRA_KEY = process.env.JIRA_KEY;

let options = {
  username: JIRA_USERNAME,
  password: JIRA_KEY,
  accept: "application/json",
  content_type: "application/json",
};

router.get("/", async (req, res) => {
  try {
    //console.log(url.parse(req.url, true).query);

    /* Jira doesn't use query params as far as I can tell, but maybe?

    const params = new URLSearchParams({
      //adds api key/value as query param
      [API_KEY_NAME]: API_KEY_VALUE,
      //takes additonal query params from URL and passes them in
      ...url.parse(req.url, true).query,
    });
    */

    const apiRes = await needle("get", `${JIRA_BASE_URL}`, options);
    const data = apiRes.body;

    // Log request to the actual API
    if (process.env.NODE_ENV !== "production") {
      console.log(`REQUEST: ${JIRA_BASE_URL}`);
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.post(
  "/",
  //TODO add express-validator validation/sanitization of incoming fields
  async (req, res) => {
    try {
      console.log(req.body);
      console.log("header", req.headers);

      const createIssue = await needle(
        "post",
        JIRA_ISSUE_URL,
        req.body,
        options
      );
      const jiraResp = createIssue.body;
      const jiraStatus = createIssue.statusCode;

      //error handling for the Jira response
      if (jiraStatus == 201) {
        //issue created successfully, send back 200 OK along with response object
        res.status(200).json(jiraResp);
      } else {
        //something went wrong, send back 500, response object and console error/message
        res.status(500).json(jiraResp);
        console.error("Jira issue not created, error: ", jiraResp.errors);
      }
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

module.exports = router;
