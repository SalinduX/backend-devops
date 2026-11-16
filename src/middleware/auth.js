const jwt = require('jsonwebtoken');
const config = require('../config');
const HttpError = require('../utils/httpError');

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing or malformed Authorization header'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.id };
    next();
  } catch (e) {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

module.exports = { requireAuth };