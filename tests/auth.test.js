const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const { resetDb } = require('./helpers');

beforeEach(resetDb);
afterAll(() => pool.end());

const creds = { email: 'sali@example.com', password: 'password123' };

describe('POST /auth/register', () => {
  test('returns 201 and never exposes the password hash', async () => {
    const res = await request(app).post('/auth/register').send(creds);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('sali@example.com');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  test('returns 409 for a duplicate email', async () => {
    await request(app).post('/auth/register').send(creds);
    const res = await request(app).post('/auth/register').send(creds);
    expect(res.status).toBe(409);
  });
});

describe('POST /auth/login', () => {
  test('returns a token for valid credentials', async () => {
    await request(app).post('/auth/register').send(creds);
    const res = await request(app).post('/auth/login').send(creds);
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  test('wrong password and unknown email give the same error', async () => {
    await request(app).post('/auth/register').send(creds);
    const wrongPw = await request(app).post('/auth/login').send({ ...creds, password: 'wrongpass1' });
    const noUser = await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'password123' });

    expect(wrongPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPw.body.error).toBe(noUser.body.error);
  });
});