const errorResponse = description => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const idParam = {
  name: 'id', in: 'path', required: true,
  schema: { type: 'integer', minimum: 1 },
};

const json = schema => ({ 'application/json': { schema } });
const secured = [{ bearerAuth: [] }];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Todo API',
    version: '1.0.0',
    description: 'Node.js + Express + PostgreSQL REST API with JWT authentication.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [{ name: 'Health' }, { name: 'Auth' }, { name: 'Todos' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' } } },
      Credentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'sali@example.com' },
          password: { type: 'string', minLength: 8, maxLength: 72, example: 'password123' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Todo: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          done: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          user_id: { type: 'integer' },
        },
      },
      TodoCreate: {
        type: 'object',
        required: ['title'],
        properties: { title: { type: 'string', minLength: 1, maxLength: 255, example: 'Learn Docker Compose' } },
      },
      TodoUpdate: {
        type: 'object',
        minProperties: 1,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          done: { type: 'boolean' },
        },
      },
      TodoPage: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Todo' } },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'], summary: 'Liveness check',
        responses: { 200: { description: 'App is alive' } },
      },
    },
    '/health/db': {
      get: {
        tags: ['Health'], summary: 'Readiness check (database)',
        responses: { 200: { description: 'DB reachable' }, 500: errorResponse('DB unreachable') },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register a new user',
        requestBody: { required: true, content: json({ $ref: '#/components/schemas/Credentials' }) },
        responses: {
          201: { description: 'Created', content: json({ $ref: '#/components/schemas/User' }) },
          400: errorResponse('Validation error'),
          409: errorResponse('Email already registered'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login and receive a JWT (valid 1 hour)',
        requestBody: { required: true, content: json({ $ref: '#/components/schemas/Credentials' }) },
        responses: {
          200: {
            description: 'OK',
            content: json({ type: 'object', properties: { token: { type: 'string' } } }),
          },
          400: errorResponse('Validation error'),
          401: errorResponse('Invalid email or password'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'], summary: 'Current user', security: secured,
        responses: {
          200: { description: 'OK', content: json({ $ref: '#/components/schemas/User' }) },
          401: errorResponse('Missing or invalid token'),
        },
      },
    },
    '/todos': {
      get: {
        tags: ['Todos'], summary: 'List my todos (filter, search, paginate)', security: secured,
        parameters: [
          { name: 'done', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'search', in: 'query', schema: { type: 'string', maxLength: 100 } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } },
        ],
        responses: {
          200: { description: 'OK', content: json({ $ref: '#/components/schemas/TodoPage' }) },
          400: errorResponse('Invalid query'),
          401: errorResponse('Unauthorized'),
        },
      },
      post: {
        tags: ['Todos'], summary: 'Create a todo', security: secured,
        requestBody: { required: true, content: json({ $ref: '#/components/schemas/TodoCreate' }) },
        responses: {
          201: { description: 'Created', content: json({ $ref: '#/components/schemas/Todo' }) },
          400: errorResponse('Validation error'),
          401: errorResponse('Unauthorized'),
        },
      },
    },
    '/todos/{id}': {
      get: {
        tags: ['Todos'], summary: 'Get one todo', security: secured, parameters: [idParam],
        responses: {
          200: { description: 'OK', content: json({ $ref: '#/components/schemas/Todo' }) },
          400: errorResponse('Invalid id'),
          401: errorResponse('Unauthorized'),
          404: errorResponse('Not found (or belongs to another user)'),
        },
      },
      put: {
        tags: ['Todos'], summary: 'Update a todo', security: secured, parameters: [idParam],
        requestBody: { required: true, content: json({ $ref: '#/components/schemas/TodoUpdate' }) },
        responses: {
          200: { description: 'OK', content: json({ $ref: '#/components/schemas/Todo' }) },
          400: errorResponse('Validation error'),
          401: errorResponse('Unauthorized'),
          404: errorResponse('Not found'),
        },
      },
      delete: {
        tags: ['Todos'], summary: 'Delete a todo', security: secured, parameters: [idParam],
        responses: {
          204: { description: 'Deleted' },
          400: errorResponse('Invalid id'),
          401: errorResponse('Unauthorized'),
          404: errorResponse('Not found'),
        },
      },
    },
  },
};