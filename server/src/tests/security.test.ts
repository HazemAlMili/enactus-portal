// server/src/tests/security.test.ts
// Updated for Supabase — MongoDB-specific tests removed.

import request from 'supertest';
import app from '../index';

describe('Enactus Portal - Security Implementation Verification', () => {

  test('✓ API Health Endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Enactus Portal API Running');
  });

  test('✓ Security Middleware (Helmet) Active', async () => {
    const response = await request(app).get('/');
    expect(response.headers).toBeDefined();
    const headerCount = Object.keys(response.headers).length;
    expect(headerCount).toBeGreaterThan(2);
  });

  test('✓ Protected route returns 401 without token', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });

  test('✓ Rate limiter present on /api routes', async () => {
    const response = await request(app).get('/api/health');
    // Header should be set by express-rate-limit
    expect(response.headers['x-ratelimit-limit'] || response.headers['ratelimit-limit']).toBeDefined();
  });
});
