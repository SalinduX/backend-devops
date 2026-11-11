const { z } = require('zod');

const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'title cannot be empty').max(255, 'title too long'),
});

const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    done: z.boolean().optional(),
  })
  .refine(d => Object.keys(d).length > 0, {
    message: 'Provide at least one field: title or done',
  });

const listQuerySchema = z.object({
  done: z.enum(['true', 'false']).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

function formatIssues(error) {
  return error.issues
    .map(i => `${i.path.join('.') || 'body'}: ${i.message}`)
    .join('; ');
}

// source = 'body' හෝ 'query'
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const err = new Error(formatIssues(result.error));
    err.status = 400;
    return next(err);
  }
  // Query object එක Express 5 වල read-only නිසා වෙනම property එකක
  req.valid = { ...(req.valid || {}), [source]: result.data };
  next();
};

module.exports = { validate, createTodoSchema, updateTodoSchema, listQuerySchema };