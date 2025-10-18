import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { TestAppModule } from '../test-app.module';

describe('Notes (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let noteId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login to get token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'password123',
      });

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/notes (POST)', () => {
    it('should create a new note', () => {
      return request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleCt: Buffer.from('encrypted title'),
          bodyCt: Buffer.from('encrypted body'),
          ivTitle: Buffer.from('ivtitle'),
          ivBody: Buffer.from('ivbody'),
          termHashes: [],
          tags: [],
        })
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('titleCt');
          expect(res.body).toHaveProperty('bodyCt');
          expect(res.body).toHaveProperty('ivTitle');
          expect(res.body).toHaveProperty('ivBody');

          expect(res.body).toHaveProperty('created_at');
          expect(res.body).toHaveProperty('updated_at');
          noteId = res.body.id;
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .post('/notes')
        .send({
          title: 'Test Note',
          body: 'This is a test note content',
        })
        .expect(401);
    });
  });

  describe('/notes (GET)', () => {
    beforeEach(async () => {
      // Create a note for testing
      const response = await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleCt: Buffer.from('encrypted title'),
          bodyCt: Buffer.from('encrypted body'),
          ivTitle: Buffer.from('ivtitle'),
          ivBody: Buffer.from('ivbody'),
           termHashes: [],
           tags: [],
        });
      noteId = response.body.id;
    });

    it('should get paginated list of notes', () => {
      return request(app.getHttpServer())
        .get('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('notes');

          expect(Array.isArray(res.body.notes)).toBe(true);
          expect(res.body.notes.length).toBeGreaterThan(0);
        });
    });

    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/notes')
        .expect(401);
    });
  });

  describe('/notes/:id (GET)', () => {
    beforeEach(async () => {
      // Create a note for testing
      const response = await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleCt: Buffer.from('encrypted title'),
          bodyCt: Buffer.from('encrypted body'),
          ivTitle: Buffer.from('ivtitle'),
          ivBody: Buffer.from('ivbody'),
          termHashes: [],
           tags: [],
        });
      noteId = response.body.id;
    });

    it('should get a specific note', () => {
      return request(app.getHttpServer())
        .get(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('id', noteId);
          expect(res.body).toHaveProperty('titleCt');
          expect(res.body).toHaveProperty('bodyCt');
        });
    });

    it('should return 404 for non-existent note', () => {
      return request(app.getHttpServer())
        .get('/notes/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/notes/:id (PUT)', () => {
    beforeEach(async () => {
      // Create a note for testing
      const response = await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleCt: Buffer.from('encrypted title'),
          bodyCt: Buffer.from('encrypted body'),
          ivTitle: Buffer.from('ivtitle'),
          ivBody: Buffer.from('ivbody'),
          termHashes: [],
           tags: [],
        });
      noteId = response.body.id;
    });

    it('should update a note', () => {
      return request(app.getHttpServer())
        .put(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleCt: Buffer.from('updated encrypted title'),
          bodyCt: Buffer.from('updated encrypted body'),
          ivTitle: Buffer.from('ivtitle'),
          ivBody: Buffer.from('ivbody'),
          termHashes: [],
           tags: [],
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('id', noteId);
          expect(res.body).toHaveProperty('titleCt');
          expect(res.body).toHaveProperty('bodyCt');
        });
    });
  });

  describe('/notes/:id (DELETE)', () => {
    beforeEach(async () => {
      // Create a note for testing
      const response = await request(app.getHttpServer())
        .post('/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleCt: Buffer.from('encrypted title'),
          bodyCt: Buffer.from('encrypted body'),
          ivTitle: Buffer.from('ivtitle'),
          ivBody: Buffer.from('ivbody'),
          termHashes: [],
           tags: [],
        });
      noteId = response.body.id;
    });

    it('should delete a note', async () => {
      // Delete the note
      await request(app.getHttpServer())
        .delete(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify it's deleted
      return request(app.getHttpServer())
        .get(`/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
