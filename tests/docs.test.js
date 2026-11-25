const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

afterAll(() => pool.end());

test('OpenAPI spec documents the main routes', async () => {
  const res = await request(app).get('/openapi.json');
  expect(res.status).toBe(200);
  expect(Object.keys(res.body.paths)).toEqual(
    expect.arrayContaining(['/auth/login', '/auth/register', '/todos', '/todos/{id}'])
  );
});