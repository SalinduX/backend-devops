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

  const registerSchema = z.object({
    email: z.string().trim().toLowerCase().email('invalid email').max(255),
    password: z.string().min(8, 'password must be at least 8 characters').max(72),
  });
  
  const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('invalid email').max(255),
    password: z.string().min(1, 'password cannot be empty'),
  
  });

  module.exports = {
  createTodoSchema, updateTodoSchema, listQuerySchema,
  registerSchema, loginSchema,
};