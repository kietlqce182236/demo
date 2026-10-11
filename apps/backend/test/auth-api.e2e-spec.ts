import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/v1/auth/tenants (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/tenants')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/api/v1/auth/quick-login (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/quick-login')
      .send({ roleCode: 'SCHOOL_MANAGER' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.roles).toContain('SCHOOL_MANAGER');
  });
});
