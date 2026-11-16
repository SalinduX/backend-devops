const HttpError = require('../utils/httpError');

module.exports = function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return next(new HttpError(400, 'id must be a positive integer'));
  }
  req.todoId = id;
  next();
};