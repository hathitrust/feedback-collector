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

//customer functions
//TODO: modularize these functions, abstract to customers.js

//creates new customer account based on email address
//returns new accountId
const createNewCustomer = async (email, name) => {
  console.log("Creating new customer...");
  const createCustomerData = `{
    "displayName": "${name}",
    "email": "${email}"
  }`;
  try {
    let createCustomer = await needle(
      "post",
      "https://hathitrust.atlassian.net/rest/servicedeskapi/customer",
      createCustomerData,
      options
    );
    if (createCustomer.statusCode == 201) {
      //201 status is "created", so should have accountId in the body
      console.log("new customer accountID: ", createCustomer.body.accountId);
      return createCustomer.body.accountId;
    } else if (createCustomer.statusCode == 400) {
      console.log(
        "Response code: " +
          createCustomer.statusCode +
          ", user already exists or email formatted incorrectly"
      );
    } else {
      console.log("user not created, status code: ", createCustomer.statusCode);
      return false;
    }
  } catch (error) {
    console.log("error with POST request to create customer: ", error);
  }
};

const addCustomerToServiceDesk = async (account) => {
  console.log("adding customer to service desk...");
  const customerAccountID = `{
    "accountIds": ["${account}"]
  }`;
  try {
    let addCustomer = await needle(
      "post",
      "https://hathitrust.atlassian.net/rest/servicedeskapi/servicedesk/8/customer",
      customerAccountID,
      options
    );
    if (addCustomer.statusCode == 204) {
      console.log("customer added to service desk");
    } else {
      console.log(
        "customer not added to service desk, status code: ",
        addCustomer.statusCode
      );
    }
    return;
  } catch (error) {
    console.log(`error adding customer to service desk: ${error}`);
  }
};

//returns accountID of customer
//if no user with email address is in system
const getCustomerRecord = async (email, name) => {
  //encode symbols in email address before passing to Jira
  const encodedEmail = encodeURIComponent(email);

  try {
    //send GET request to general system /user endpoint
    let getCustomerData = await needle(
      "get",
      `https://hathitrust.atlassian.net/rest/api/latest/user/search?query=${encodedEmail}`,
      {
        headers: { "X-ExperimentalApi": "opt-in" },
        username: JIRA_USERNAME,
        password: JIRA_KEY,
      }
    );

    let accountID;

    //if the response body array has something in it, customer already exists
    if (getCustomerData.statusCode == 200 && getCustomerData.body.length >= 1) {
      console.log(
        "getCustomerEmail accountID: ",
        getCustomerData.body[0].accountId
      );
      //doesn't hurt to add user to service desk
      await addCustomerToServiceDesk(getCustomerData.body[0].accountId);
      accountID = getCustomerData.body[0].accountId;

      // if that values array is empty, we need to create a new customer using their email address and name (if supplied)
    } else if (getCustomerData.body.length === 0) {
      console.log("no users with that email address");
      const newCustomer = await createNewCustomer(email, name);
      await addCustomerToServiceDesk(newCustomer);
      accountID = newCustomer;

      //if something went wrong with either looking up or creating user, fallback to HTUS default account details
    } else {
      console.log(
        `gotta fallback to HT general accountID 628d0d7b1c97b5006f0b29f4, status code: ${getCustomerData.statusCode}`
      );
      accountID = "628d0d7b1c97b5006f0b29f4";
    }
    console.log("accountID variable is ", accountID);
    return accountID;
  } catch (error) {
    console.log(`error getting customer data: ${error}`);
  }
};

//format textarea input to replace textarea "new line" with new line character
const replaceNewLines = (description) => {
  let regex = /[\r\n\x0B\x0C\u0085\u2028\u2029]+/g;
  return description.replace(regex, "\\n");
};

//build request body to send to GS project
const buildGSRequest = async (requestBodyObject, accountID) => {
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
    try {
      // console.log("header", req.headers);
      console.log(req.body);

      let requestBodyObject = req.body;

      let userEmail = req.body.email;
      let userDisplayName = req.body.name;

      console.log(`email submitted: ${userEmail}`);
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
