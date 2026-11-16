const pool = require('../db/pool');

async function list(userId, { done, search, page, limit }) {
  const conditions = ['user_id = $1'];
  const values = [userId];

  if (done !== undefined) {
    values.push(done === 'true');
    conditions.push(`done = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`title ILIKE $${values.length}`);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const count = await pool.query(`SELECT COUNT(*) FROM todos ${where}`, values);
  const total = Number(count.rows[0].count);

  const dataValues = [...values, limit, (page - 1) * limit];
  const { rows } = await pool.query(
    `SELECT * FROM todos ${where} ORDER BY id
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );
  return { rows, total };
}

async function findById(id, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM todos WHERE id = $1 AND user_id = $2', [id, userId]
  );
  return rows[0] || null;
}

async function create(title, userId) {
  const { rows } = await pool.query(
    'INSERT INTO todos (title, user_id) VALUES ($1, $2) RETURNING *', [title, userId]
  );
  return rows[0];
}

async function update(id, userId, { title, done }) {
  const { rows } = await pool.query(
    `UPDATE todos
     SET title = COALESCE($1, title), done = COALESCE($2, done)
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [title ?? null, done ?? null, id, userId]
  );
  return rows[0] || null;
}

async function remove(id, userId) {
  const { rowCount } = await pool.query(
    'DELETE FROM todos WHERE id = $1 AND user_id = $2', [id, userId]
  );
  return rowCount > 0;
}

module.exports = { list, findById, create, update, remove };