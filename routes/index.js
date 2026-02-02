const express = require('express');

const router = express.Router();
const needle = require('needle');

const { getCustomerRecord } = require('../customers');

//Env vars
const GS_REQUEST_TYPE_ID = process.env.GS_REQUEST_TYPE_ID;
const GS_SERVICE_DESK_ID = process.env.GS_SERVICE_DESK_ID;
const JIRA_ENDPOINT = process.env.JIRA_ENDPOINT;
const JIRA_KEY = process.env.JIRA_KEY;
const JIRA_USERNAME = process.env.JIRA_USERNAME;

//headers for general Jira http requests
const headerOptions = {
  username: JIRA_USERNAME,
  password: JIRA_KEY,
  accept: 'application/json',
  content_type: 'application/json',
};

//build request description based on which form is being submitted
const buildDescription = async (requestBodyObject) => {
  if (requestBodyObject.formName == 'basic-form') {
    return `*GENERAL FEEDBACK* \n\n Book description or URL: ${requestBodyObject.bookDescription} \n Full description: ${requestBodyObject.description} \n\n User agent: ${requestBodyObject.userAgent} \n User URL: ${requestBodyObject.userURL} \n User auth: ${requestBodyObject.userAuthStatus}`;
  } else if (requestBodyObject.formName == 'catalog-correction') {
    return `*CATALOG QUALITY CORRECTION* \n\n URL of catalog record: ${requestBodyObject.recordURL} \n URL of item with issue within record: ${requestBodyObject.itemURL} \n Title of book: ${requestBodyObject.itemTitle} \n Problems: ${requestBodyObject.problems} \n Access issues: ${requestBodyObject.access} \n\n Other: ${requestBodyObject.description} \n\n User agent: ${requestBodyObject.userAgent} \n User URL: ${requestBodyObject.userURL} \n User auth: ${requestBodyObject.userAuthStatus}`;
    // return `Book description or URL: ${requestBodyObject.bookDescription} \n Full description: ${requestBodyObject.description} \n user agent: ${requestBodyObject.userAgent} \n user URL: ${requestBodyObject.userURL} \n user auth: ${requestBodyObject.userAuthStatus}`;
  } else if (requestBodyObject.formName == 'content-correction') {
    return `*CONTENT QUALITY CORRECTION* \n\n URL of book with problem: ${requestBodyObject.bookURL} \n Title of book: ${requestBodyObject.itemTitle} \n Overall quality: ${requestBodyObject.imageQuality} \n Specific page image problems: ${requestBodyObject.imageProblems} \n\n Other: ${requestBodyObject.description} \n\n User agent: ${requestBodyObject.userAgent} \n User URL: ${requestBodyObject.userURL} \n User auth: ${requestBodyObject.userAuthStatus}`;
  } else {
    throw new Error('Issue description did not build, check formName variable is set on front-end form');
  }
};

//build request body to send to GS project
const buildGSRequest = async (requestBodyObject, accountID) => {
  const bodyObject = {
    raiseOnBehalfOf: accountID,
    serviceDeskId: GS_SERVICE_DESK_ID,
    requestTypeId: GS_REQUEST_TYPE_ID,
    requestFieldValues: {
      summary: requestBodyObject.summary,
      description: await buildDescription(requestBodyObject),
    },
  };

  return JSON.stringify(bodyObject);
};

const createJiraIssue = async(gsRequestBody, headerOptions, res) => {
  const httpResponse = await needle(
    'post',
    `${JIRA_ENDPOINT}/rest/servicedeskapi/request`,
    gsRequestBody,
    headerOptions
  );
  const jiraResponse = httpResponse.body;

  //error handling for the Jira response
  if (httpResponse.statusCode == 201) {
    //issue created successfully, send back 200 OK along with response object
    res.status(200).json(jiraResponse);
  } else {
    //something went wrong, send back 500, response object and console error/message
    res.status(500).json(jiraResponse);
    console.error(
      'Jira issue not created, error: ', jiraResponse.errors
    );
  }
}

router.post(
  '/',
  //TODO
  //add express - validator validation / sanitization of incoming fields

  async (req, res) => {
    try {
      let requestBodyObject = req.body;
      let userEmail = req.body.email;
      let userDisplayName = req.body.name || req.body.email;

      //get or create customer's account ID
      const customerID = await getCustomerRecord(userEmail, userDisplayName);

      //build new General Support (GS) ticket request body prior to sending it to Jira
      //pass in the incoming request data from the feedback form and the generated accountID/email
      const gsRequestBody = await buildGSRequest(requestBodyObject, customerID);

      // do the dang posting of the service desk request
      await(createJiraIssue(gsRequestBody, headerOptions, res))

    } catch (error) {
      res.status(500).json({ error: error.message });
      console.error(error)
    }
  }
);

module.exports = router;
