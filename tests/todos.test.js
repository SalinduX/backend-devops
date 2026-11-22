const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const { resetDb, registerAndLogin } = require('./helpers');

beforeEach(resetDb);
afterAll(() => pool.end());

const auth = token => ({ Authorization: `Bearer ${token}` });

describe('todos API', () => {
  test('401 without a token', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).toBe(401);
  });

  test('creates a todo (201)', async () => {
    const token = await registerAndLogin('a@example.com');
    const res = await request(app).post('/todos').set(auth(token)).send({ title: 'Write tests' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Write tests', done: false });
  });

  test('400 when title is missing', async () => {
    const token = await registerAndLogin('a@example.com');
    const res = await request(app).post('/todos').set(auth(token)).send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });

  test("a user cannot read another user's todo (IDOR)", async () => {
    const tokenA = await registerAndLogin('a@example.com');
    const tokenB = await registerAndLogin('b@example.com');

    const created = await request(app).post('/todos').set(auth(tokenA)).send({ title: 'Private' });

    const res = await request(app).get(`/todos/${created.body.id}`).set(auth(tokenB));
    expect(res.status).toBe(404);

    const list = await request(app).get('/todos').set(auth(tokenB));
    expect(list.body.total).toBe(0);
  });

  test('update → delete → gone', async () => {
    const token = await registerAndLogin('a@example.com');
    const { body } = await request(app).post('/todos').set(auth(token)).send({ title: 'Temp' });

    const updated = await request(app).put(`/todos/${body.id}`).set(auth(token)).send({ done: true });
    expect(updated.status).toBe(200);
    expect(updated.body.done).toBe(true);

    const deleted = await request(app).delete(`/todos/${body.id}`).set(auth(token));
    expect(deleted.status).toBe(204);

    const after = await request(app).get(`/todos/${body.id}`).set(auth(token));
    expect(after.status).toBe(404);
  });
});