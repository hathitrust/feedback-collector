// index.js

const expect = require('chai').expect;
const request = require('supertest');
const app = require('../app')

describe('application', function() {

  it('should exist', function() {
    expect(app).to.not.be.null
  });

  it('GET /health should give a 200', async function() {
    response = await request(app)
      .get('/health')
    
    expect(response.status).to.equal(200)
    expect(response.text).to.equal("ok")
  });

  it('GET /api should give a 404', async function() {
    response = await request(app)
      .get('/api')

    expect(response.status).to.equal(404)
  });

  it('with mocked JIRA API, POST /api should give a 200')

});

