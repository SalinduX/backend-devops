const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

async function resetDb() {
  await pool.query('TRUNCATE users, todos RESTART IDENTITY CASCADE');
}

async function registerAndLogin(email) {
  const creds = { email, password: 'password123' };
  await request(app).post('/auth/register').send(creds);
  const res = await request(app).post('/auth/login').send(creds);
  return res.body.token;
}

module.exports = { resetDb, registerAndLogin };