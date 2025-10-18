import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { TestAppModule } from '../test-app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email', 'test@example.com');
        });
    });

    it('should return 409 for existing user', async () => {
      // First register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
        })
        .expect(201);

      // Try to register again
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });
    });

    it('should login with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email', 'login@example.com');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
