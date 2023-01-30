const express = require("express");

const router = express.Router();
const needle = require("needle");

const { getCustomerRecord } = require("../customers");

//Env vars
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_GS_REQUEST_URL = process.env.JIRA_GS_REQUEST_URL;
const JIRA_USERNAME = process.env.JIRA_USERNAME;
const JIRA_KEY = process.env.JIRA_KEY;

//headers for general Jira http requests
let options = {
  username: JIRA_USERNAME,
  password: JIRA_KEY,
  accept: "application/json",
  content_type: "application/json",
};

//format textarea input to replace textarea "new line" with new line character
const replaceNewLines = (description) => {
  let regex = /[\r\n\x0B\x0C\u0085\u2028\u2029]+/g;
  return description.replace(regex, "\\n");
};

//build request body to send to GS project
const buildGSRequest = async (requestBodyObject, accountID) => {
  let formattedDescription = replaceNewLines(requestBodyObject.description);

  const bodyData = `{
    "raiseOnBehalfOf": "${accountID}",
    "serviceDeskId": "8",
    "requestTypeId": "137",
    "requestFieldValues": {
      "summary": "${requestBodyObject.summary}",
      "description": "${formattedDescription} \\n user agent: ${requestBodyObject.userAgent} \\n user URL: ${requestBodyObject.userURL}"
    }
  }`;
  return bodyData;
};

router.get("/", async (req, res) => {
  try {
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
  //TODO
  //add express - validator validation / sanitization of incoming fields

  async (req, res) => {
    try {
      let requestBodyObject = req.body;
      let userEmail = req.body.email;
      let userDisplayName = req.body.name;

      //get or create customer's account ID
      const customerID = await getCustomerRecord(userEmail, userDisplayName);

      //build new GS request body prior to sending it to Jira
      // pass in the incoming request data from the feedback form and the generated accountID/email
      const gsRequestBody = await buildGSRequest(requestBodyObject, customerID);

      // do the dang posting of the service desk issue
      const createIssue = await needle(
        "post",
        JIRA_GS_REQUEST_URL,
        gsRequestBody,
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
