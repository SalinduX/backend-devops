const HttpError = require('../utils/httpError');

function notFound(req, res, next) {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} not found`));
}

// ⚠️ Parameters 4ක් තියෙන්න ඕන
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.message,
  });
  if (status === 500) console.error(err);
}

module.exports = { notFound, errorHandler };