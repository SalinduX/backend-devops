const Todo = require('../models/todo.model');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  const { page, limit } = req.valid.query;
  const { rows, total } = await Todo.list(req.user.id, req.valid.query);
  res.json({ page, limit, total, totalPages: Math.ceil(total / limit), data: rows });
}

async function getOne(req, res) {
  const todo = await Todo.findById(req.todoId, req.user.id);
  if (!todo) throw new HttpError(404, 'Todo not found');
  res.json(todo);
}

async function create(req, res) {
  const todo = await Todo.create(req.valid.body.title, req.user.id);
  res.status(201).json(todo);
}

async function update(req, res) {
  const todo = await Todo.update(req.todoId, req.user.id, req.valid.body);
  if (!todo) throw new HttpError(404, 'Todo not found');
  res.json(todo);
}

async function remove(req, res) {
  const deleted = await Todo.remove(req.todoId, req.user.id);
  if (!deleted) throw new HttpError(404, 'Todo not found');
  res.status(204).send();
}

module.exports = { list, getOne, create, update, remove };