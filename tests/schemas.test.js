const { registerSchema, listQuerySchema } = require('../src/schemas');

describe('registerSchema', () => {
  test('trims and lowercases email', () => {
    const result = registerSchema.parse({ email: '  SALI@Example.COM ', password: 'password123' });
    expect(result.email).toBe('sali@example.com');
  });

  test('rejects short password', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('listQuerySchema', () => {
  test('applies defaults', () => {
    const result = listQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  test('rejects limit above 50', () => {
    expect(listQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});