const express = require("express");

const router = express.Router();
const needle = require("needle");

//Env vars
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_ISSUE_URL = process.env.JIRA_ISSUE_URL;
const JIRA_GS_REQUEST_URL = process.env.JIRA_GS_REQUEST_URL;
const JIRA_USERNAME = process.env.JIRA_USERNAME;
const JIRA_KEY = process.env.JIRA_KEY;

let options = {
  username: JIRA_USERNAME,
  password: JIRA_KEY,
  accept: "application/json",
  content_type: "application/json",
};

let email;

//customer functions
//TODO: modularize these functions, abstract to customers.js

//creates new customer account based on email address
//returns new accountId
const createNewCustomer = (email) => {
  console.log("Creating new customer...");
  const createCustomerData = `{
    "displayName": "${email}",
    "email": "${email}"
  }`;
  needle(
    "post",
    "https://hathitrust.atlassian.net/rest/servicedeskapi/customer",
    createCustomerData,
    options
  )
    .then(function (response) {
      if (response.statusCode == 201) {
        //201 status is "created", so should have accountId in the body
        console.log("new customer accountID: ", response.body.accountId);
        return response.body.accountId;
      } else {
        console.log("user not created, status code: ", response.statusCode);
      }
    })
    .catch(function (error) {
      console.log("error with POST request to create customer: ", error);
    });
};

//returns accountID of customer
//if no user with email address is in system
const getCustomerRecord = (email) => {
  //encode symbols in email address before passing to Jira
  const encodedEmail = encodeURIComponent(email);

  //send GET request to /customer endpoint
  needle(
    "get",
    `https://hathitrust.atlassian.net/rest/servicedeskapi/servicedesk/8/customer?query=${encodedEmail}`,
    {
      headers: { "X-ExperimentalApi": "opt-in" },
      username: JIRA_USERNAME,
      password: JIRA_KEY,
    }
  )
    .then(function (response) {
      //if the response body values array has something in it, customer already exists
      if (response.statusCode == 200 && response.body.values.length >= 1) {
        console.log(
          "getCustomerEmail accountID: ",
          response.body.values[0].accountId
        );
        return response.body.values[0].accountId;

        // if that values array is empty, we need to create a new customer using their email address and name (if supplied)
      } else if (response.body.values.length === 0) {
        console.log("no users with that email address");
        createNewCustomer(email);
        return;

        //if something went wrong with either looking up or creating user, fallback to HTUS default account details
      } else {
        // TODO: return HTUS general accountID as fallback
        console.log(`status code: ${response.statusCode}`);
        return;
      }
    })
    .catch(function (error) {
      console.log(`error getting customer data: ${error}`);
    });
};

//format textarea input to replace textarea "new line" with new line character
const replaceNewLines = (description) => {
  let regex = /[\r\n\x0B\x0C\u0085\u2028\u2029]+/g;
  return description.replace(regex, "\\n");
};

//build request body to send to GS project
const buildGSRequest = (requestBodyObject, accountID) => {
  let formattedDescription = replaceNewLines(requestBodyObject.description);
  //example of request body
  //{
  //   name: 'caryl',
  //   email: 'carylw@umich.edu',
  //   summary: 'hi',
  //   description: 'hi again',
  //   userURL: 'http://127.0.0.1:5173/',
  //   userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
  // }
  const bodyData = `{
    "raiseOnBehalfOf": "${accountID}",
    "serviceDeskId": "8",
    "requestTypeId": "137",
    "requestFieldValues": {
      "summary": "${requestBodyObject.summary}",
      "description": "${formattedDescription} \\n user agent: ${requestBodyObject.userAgent} \\n user URL: ${requestBodyObject.userURL}"
    }
  }`;
  console.log(bodyData);
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
    //request body looks like:

    try {
      // console.log("header", req.headers);
      console.log(req.body);

      let requestBodyObject = req.body;

      let userEmail = req.body.email;

      // TODO:
      // since this is a slow action, gonna need to convert to async/await
      // or make the buildGSRequest function await the result of getCustomerRecord
      // probably safest to make everything async await
      // as of jan 18, the console log with variables is returning the email ID retrieved from getCustomerRecord as undefined
      // but then returns the ID after... just a timing issue
      email = getCustomerRecord(userEmail);
      // getCustomerRecord("carylw@umich.edu");

      //build new GS request body prior to sending it to Jira
      // pass in the incoming request data from the feedback form and the generated accountID/email
      // const gsRequestBody = buildGSRequest(
      //   requestBodyObject,
      //   "633ac40a7f85f16777a16b93"
      // );

      // const createIssue = await needle(
      //   "post",
      //   JIRA_GS_REQUEST_URL,
      //   gsRequestBody,
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
