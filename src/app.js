const express = require('express');
const pool = require('./db/pool');
const logger = require('./middleware/logger');
const asyncHandler = require('./middleware/asyncHandler');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const todoRoutes = require('./routes/todos.routes');

const app = express();
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');

app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(logger); // Jest NODE_ENV=test auto set කරනවා


// Liveness: process එක ජීවතුන් අතරද? (DB අවශ්‍ය නැහැ)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.get('/openapi.json', (req, res) => res.json(openapi));

// Readiness: DB එකට connect වෙන්න පුළුවන්ද?
app.get('/health/db', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', db: 'connected' });
}));

app.use('/auth', authRoutes);
app.use('/todos', todoRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;