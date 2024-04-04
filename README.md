<br/>
  <p align="center">
    HathiTrust JIRA feedback collector
    <br/>
    <br/>
    <a href="https://github.com/Ronster/SuperAwesomeProject/issues">Report Bug</a>
    -
    <a href="https://github.com/Ronster/SuperAwesomeProject/issues">Request Feature</a>
  </p>



## Table Of Contents

* [About the Project](#about-the-project)
* [Built With](#built-with)
* [Project Set Up](#project-set-up)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Content Structure](#content-structure)
  * [Project Structure](#project-structure)
* [Functionality](#functionality)
* [Usage](#usage)
* [Tests](#tests)
* [Hosting](#hosting)
* [Resources](#resources)

## About The Project
Allows the front-end to express the various form and data elements and send that to Jira. It needs to know what Jira needs so that it can effectively send it to Jira for ingest.

We wanted to use the Jira API but we couldnt do that directly from the browser because we couldn't put API keys in the HTML source code. It also abstracts the Jira API from the front-end.


## Built With

- [ExpressJS](https://expressjs.com/)
- [NodeJS](https://nodejs.org/en)


## Project Set Up
### Prerequisites
- Docker
- Jira API key
    - Jira Service Desk Instance for communication

- **JIRA_ENDPOINT** Your Jira endpoint
- **JIRA_USERNAME** = ''
- **JIRA_KEY** = ''
- **HT_ACCOUNT_ID**  ID number that corresponds to the support email address user. A user of Jira.

### Installation
- This section clearly outline the steps taken to get the project installed on the system. This is a great place to include commands that have been run and configuration files that have been changed.

1. `git clone git@github.com:hathitrust/feedback-collector.git`
2. `cd feedback-collector`
3. add API info to `.env.example` and remove the `.example` extension
5. `$ docker compose up`
6. use Postman to `GET` request `http://localhost:5000/api`


## Functionality
- This section outlines how your project will work. For example, some sites have integrations with third-party APIs. These should be outlined in terms of how they’ll work and whatever other information is needed. This section may mirror/overalap/mingle with indepth code documentation.

## Usage
- This section should clearly state the intended usecase for this project and how to interact with it. This section could aid in developing tests for the product as well as uncover un-intended use cases.

## Tests
- Uses [Nock](https://github.com/nock/nock) and [Sinon](https://sinonjs.org/) to mock the Jira API and tests that the expected feedback form parameters and expected issues getting posted to jira are present. The rest of it checks that the error conditions are passed back to the feedback form.

## Hosting
- For the HathiTrust production deployment, this is deployed using ArgoCD and Tanka; [private control repository](https://github.com/hathitrust/ht_tanka/tree/main/environments/feedback/production)
## Resources
- This section should be used to keep track of any 3rd party resources used to help aid in the creation of this project.