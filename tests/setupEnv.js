require('dotenv').config({ path: '.env.test' });

// Dev DB එකට වැරදිලා test run වීම වළක්වන guard එක
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('test')) {
  throw new Error('Refusing to run tests: DATABASE_URL must point to a *test* database');
}