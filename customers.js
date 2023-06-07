const needle = require("needle");

const GS_SERVICE_DESK_ID = process.env.GS_SERVICE_DESK_ID;
const HT_ACCOUNT_ID = process.env.HT_ACCOUNT_ID;
const JIRA_ENDPOINT = process.env.JIRA_ENDPOINT;
const JIRA_KEY = process.env.JIRA_KEY;
const JIRA_USERNAME = process.env.JIRA_USERNAME;

const headerOptions = {
  username: JIRA_USERNAME,
  password: JIRA_KEY,
  accept: "application/json",
  content_type: "application/json",
};

//creates new customer account based on email address
//returns new accountId
createNewCustomer = async (email, name) => {
  console.log("Creating new customer...");
  const createCustomerData = `{
    "displayName": "${name}",
    "email": "${email}"
  }`;
  try {
    let createCustomer = await needle(
      "post",
      `${JIRA_ENDPOINT}/rest/servicedeskapi/customer`,
      createCustomerData,
      headerOptions
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

//adds customer account ID to service desk
//return customer ID if successful, return HT account ID if something went wrong
addCustomerToServiceDesk = async (account) => {
  console.log("adding customer to service desk...");
  const customerAccountID = `{
    "accountIds": ["${account}"]
  }`;
  try {
    let addCustomer = await needle(
      "post",
      `${JIRA_ENDPOINT}/rest/servicedeskapi/servicedesk/${GS_SERVICE_DESK_ID}/customer`,
      customerAccountID,
      headerOptions
    );
    if (addCustomer.statusCode == 204) {
      console.log("customer added to service desk");
      //return accountID
      return account;
    } else {
      console.log(
        "customer not added to service desk, falling back to HT user account. Status code: ",
        addCustomer.statusCode
      );
      // use HT user account ID
      return HT_ACCOUNT_ID;
    }
  } catch (error) {
    console.log(`error adding customer to service desk: ${error}`);
  }
};

//returns account ID of customer
exports.getCustomerRecord = async (email, name) => {

  //encode symbols in email address before passing to Jira
  const encodedEmail = encodeURIComponent(email);

  try {
    //send GET request to general system /user endpoint
    let getCustomerData = await needle(
      "get",
      `${JIRA_ENDPOINT}/rest/api/latest/user/search?query=${encodedEmail}`,
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
      //add user to service desk
      accountID = await addCustomerToServiceDesk(
        getCustomerData.body[0].accountId
      );

      // if that values array is empty, we need to create a new customer using their email address and name (if supplied)
    } else if (getCustomerData.body.length === 0) {
      console.log("no users with that email address");
      const newCustomer = await createNewCustomer(email, name);
      accountID = await addCustomerToServiceDesk(newCustomer);

      //if something went wrong with either looking up or creating user, fallback to HTUS default account details
    } else {
      console.log(
        `gotta fallback to HT general accountID, status code: ${getCustomerData.statusCode}`
      );
      accountID = HT_ACCOUNT_ID;
    }
    return accountID;
  } catch (error) {
    console.log(`error getting customer data: ${error}`);
  }
};
