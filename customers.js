const needle = require("needle");

let accountID;

//check if the email address of the submitter is a current service management customer - if yes, use the customer’s accountId for submission

const getCustomerRecord = (email) => {
  //send GET request to /customers endpoint
  // https://hathitrust.atlassian.net/rest/servicedeskapi/servicedesk/8/customer?query=carylw@umich.edu
  // returns
  // {
  //     "size": 1,
  //     "start": 0,
  //     "limit": 50,
  //     "isLastPage": true,
  //     "_links": {
  //         "self": "https://hathitrust.atlassian.net/rest/servicedeskapi/servicedesk/8/customer?query=carylw@umich.edu",
  //         "base": "https://hathitrust.atlassian.net",
  //         "context": ""
  //     },
  //     "values": [
  //         {
  //             "accountId": "633ac40a7f85f16777a16b93",
  //             "emailAddress": "carylw@umich.edu",
  //             "displayName": "caryl wyatt",
  //             "active": true,
  //             "timeZone": "America/Chicago",
  //             "_links": {
  //                 "jiraRest": "https://hathitrust.atlassian.net/rest/api/2/user?accountId=633ac40a7f85f16777a16b93",
  //                 "avatarUrls": {
  //                     "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633ac40a7f85f16777a16b93/8afd5248-4fda-43ed-9edc-a6f684ce021c/48",
  //                     "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633ac40a7f85f16777a16b93/8afd5248-4fda-43ed-9edc-a6f684ce021c/24",
  //                     "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633ac40a7f85f16777a16b93/8afd5248-4fda-43ed-9edc-a6f684ce021c/16",
  //                     "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/633ac40a7f85f16777a16b93/8afd5248-4fda-43ed-9edc-a6f684ce021c/32"
  //                 },
  //                 "self": "https://hathitrust.atlassian.net/rest/api/2/user?accountId=633ac40a7f85f16777a16b93"
  //             }
  //         }
  //     ]
  // }
  //set accountID variable to values.accountID (if it exists)
  //otherwise, return
  //next function checks if accountID is truthy
};

if (accountID) {
  //if accountID has anything in it, return
} else {
  //send POST request to create a customer
  //https://hathitrust.atlassian.net/rest/servicedeskapi/customer
  //if user didn't currently exist, returns a 201 CREATED response with new account details
  //if user is already in the system or you sent a malformed email address, you get a 400
  //send POST request to add customer to GS service desk
  //https://hathitrust.atlassian.net/rest/servicedeskapi/servicedesk/8/customer
  //if done correctly, this returns a 204 status with no response
  //if you pass an ID that doesn't exist, you get a 400
  //set accountID
}

//add accountId to the rest of the form JSON data, send POST request to create new service management request
