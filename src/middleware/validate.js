const HttpError = require('../utils/httpError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const message = result.error.issues
      .map(i => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    return next(new HttpError(400, message));
  }
  req.valid = { ...(req.valid || {}), [source]: result.data };
  next();
};

module.exports = validate;