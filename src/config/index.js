require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1); // Fail fast: අඩ-වැඩ කරන server එකකට වඩා නොපටන් ගැනීම හොඳයි
  }
  return value;
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
};