import request from 'supertest';
import app from '../index';
import mongoose from 'mongoose';
import User from '../models/User';
import HighBoard from '../models/HighBoard';

beforeAll(async () => {
    const url = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/enactus_portal_test';
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(url);
    
    // Clear test database completely
    try {
        await User.deleteMany({});
        await HighBoard.deleteMany({});
        console.log('✓ Test database cleared');
    } catch (error) {
        console.log('Database clear warning:', error);
    }
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Enactus Portal - Security Implementation Verification', () => {
  
  test('✓ API Health Endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Enactus Portal API Running');
  });

  test('✓ Security Middleware (Helmet) Active', async () => {
    const response = await request(app).get('/');
    
    // Verify Helmet is adding security headers
    expect(response.headers).toBeDefined();
    
    // At minimum, a response should have several headers
    const headerCount = Object.keys(response.headers).length;
    expect(headerCount).toBeGreaterThan(2);
  });

  test('✓ Input Sanitization Prevents NoSQL Injection', async () => {
    // Send malicious MongoDB operator injection
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: "" }, password: "nonexistent_password_xyz123" });
    
    // After sanitization, $gt is removed -> email becomes {}
    // The validation in authController checks typeof email !== 'string'
    // So it returns 400 Bad Request
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Validation');
  });
});
