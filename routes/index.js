// const getCustomerRecord = require("../customers");
// const url = require("url");
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

let name;
let email;
let summary;
let userAgent;
let userURL;
let description;

//customer functions

//creates new customer account based on email address
//returns new accountId
const createNewCustomer = (email) => {
  console.log("Creating new customer...");
  const createCustomerData = `{
    "displayName": "${email}",
    "email": "${email}"
  }`;
  needle.post(
    "https://hathitrust.atlassian.net/rest/servicedeskapi/customer",
    createCustomerData,
    options,
    function (error, response) {
      if (!error && response.statusCode == 201) {
        //201 status is "created", so should have accountId in the body
        console.log("new customer accountID: ", response.body.accountId);
        return response.body.accountId;
      } else {
        console.log("user not created, status code: ", response.statusCode);
      }
    }
  );
};

//returns accountID of customer
//if no user with email address is in system
const getCustomerRecord = (email) => {
  const enteredEmail = `email entered in form: ${email}`;
  const encodedEmail = encodeURIComponent(email);
  //send GET request to /customers endpoint
  needle.get(
    `https://hathitrust.atlassian.net/rest/servicedeskapi/servicedesk/8/customer?query=${encodedEmail}`,
    {
      headers: { "X-ExperimentalApi": "opt-in" },
      username: JIRA_USERNAME,
      password: JIRA_KEY,
    },
    function (error, response) {
      if (
        !error &&
        response.statusCode == 200 &&
        response.body.values.length >= 1
      ) {
        console.log(
          "getCustomerEmail accountID: ",
          response.body.values[0].accountId
        );
        return response.body.values[0].accountId;
      } else if (response.body.values.length === 0) {
        console.log("no users with that email address");
        createNewCustomer(email);
        return;
      } else {
        // TODO: return HTUS general accountID as fallback
        console.log(`status code: ${response.statusCode}`);
        return;
      }
    }
  );
};

//build request body to send to GS project
const buildGSRequest = () => {};

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
    //request body looks like:
    //{
    //   name: 'caryl',
    //   email: 'carylw@umich.edu',
    //   summary: 'hi',
    //   description: 'hi again',
    //   userURL: 'http://127.0.0.1:5173/',
    //   userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
    // }
    try {
      console.log(req.body);
      console.log("header", req.headers);
      // console.log("eamil??", req.body.fields.raiseOnBehalfOf);

      let userEmail = req.body.email;

      getCustomerRecord(userEmail);
      // const customerRecord = (eamil) => {
      //   console.log("customer email?", eamil);
      // };

      // customerRecord(userEmail);
      // const createIssue = await needle(
      //   "post",
      //   JIRA_ISSUE_URL,
      //   req.body,
      //   options
      // );
      // const jiraResp = createIssue.body;
      // const jiraStatus = createIssue.statusCode;

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
