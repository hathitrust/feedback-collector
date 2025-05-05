// configuration for tests - would come from the environment for the real app. Must
// be defined before loading the application. defines consts here only for the
// ones that tests use.
const JIRA_ENDPOINT = (process.env.JIRA_ENDPOINT = 'https://jira-endpoint.default.test');
process.env.JIRA_USERNAME = 'example_username';
process.env.JIRA_KEY = 'example_key';
process.env.HT_ACCOUNT_ID = 'fake_account_id';
const GS_SERVICE_DESK_ID = (process.env.GS_SERVICE_DESK_ID = '99');
process.env.GS_REQUEST_TYPE_ID = '999';

// index.js

const expect = require('chai').expect;
const request = require('supertest');
const app = require('../app');
const nock = require('nock');
const sinon = require('sinon');

function mockJiraCustomer() {
  return nock(JIRA_ENDPOINT)
    .get('/rest/api/latest/user/search')
    .query({ query: /.*/ })
    .reply(200, [{ accountId: 'fake-account-id' }])

    .post(`/rest/servicedeskapi/servicedesk/${GS_SERVICE_DESK_ID}/customer`)
    .reply(204);
}

describe('application', function () {
  beforeEach(function () {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterEach(function () {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('should exist', function () {
    expect(app).to.not.be.null;
  });

  it('GET /health should give a 200', async function () {
    response = await request(app).get('/health');

    expect(response.status).to.equal(200);
    expect(response.text).to.equal('ok');
  });

  it('GET /api should give a 404', async function () {
    response = await request(app).get('/api');

    expect(response.status).to.equal(404);
  });

  it('with mocked JIRA API, POST /api should give a 200 and pass through what JIRA returns', async function () {
    scope = mockJiraCustomer().post('/rest/servicedeskapi/request').reply(201, { response: 'fake-response' });

    response = await request(app)
      .post('/api')
      .send({ summary: 'summary', formName: 'basic-form', email: 'somebody@somewhere.test' });

    expect(response.status).to.equal(200);
    expect(response.body).to.eql({ response: 'fake-response' });
    expect(scope.isDone());
  });

  it('when JIRA returns an error, POST /api gives a 500 and passes through what JIRA returns', async function () {
    scope = mockJiraCustomer().post('/rest/servicedeskapi/request').reply(401, { message: 'fake-error' });

    response = await request(app).post('/api').send({ summary: 'summary', formName: 'basic-form' });

    expect(response.status).to.equal(500);
    expect(response.body).to.eql({ message: 'fake-error' });
    expect(scope.isDone());
  });

  it('with no parameters, returns a 500 and doesnt call jira', async function () {
    response = await request(app).post('/api').send({});

    expect(response.status).to.equal(500);
    expect(response.body.error).to.include('formName');

    // n.b.: nock would throw an error if something was called unexpectedly
  });

  it('with no email parameter, posts issue with default customer', async function () {
    scope = nock(JIRA_ENDPOINT).post('/rest/servicedeskapi/request').reply(201);

    response = await request(app).post('/api').send({ summary: 'summary', formName: 'basic-form' });

    expect(response.status).to.equal(200);
    expect(scope.isDone());
  });

  context('with spied logger', function () {
    const sandbox = sinon.createSandbox();

    beforeEach(function () {
      sandbox.spy(process.stdout, 'write');
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('logs output', async function () {
      response = await request(app).get('/nonexistent');
      expect(process.stdout.write.getCall(0).args[0]).to.include('"GET /nonexistent HTTP/1.1" 404');
    });
  });
});
