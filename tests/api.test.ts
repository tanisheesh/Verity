import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('API Integration Tests', () => {
  describe('POST /api/analyze', () => {
    it('should return 400 for text shorter than 10 characters', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ text: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TEXT_TOO_SHORT');
    });

    it('should return 400 for text longer than 10000 characters', async () => {
      const longText = 'a'.repeat(10001);
      const response = await request(app)
        .post('/api/analyze')
        .send({ text: longText });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TEXT_TOO_LONG');
    });

    it('should return 400 for invalid input format', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return valid analysis report for valid input', async () => {
      const text = "I went to the store yesterday and bought groceries.";
      const response = await request(app)
        .post('/api/analyze')
        .send({ text });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('confidence_interval');
      expect(response.body.data).toHaveProperty('verdict');
      expect(response.body.data).toHaveProperty('indicators');
      expect(response.body.data).toHaveProperty('sentence_flags');
      expect(response.body.data).toHaveProperty('narrative_structure');
      expect(response.body.data).toHaveProperty('summary');
    });

    it('should handle conversation mode', async () => {
      const text = "First message here.\nSecond message here.\nThird message here.";
      const response = await request(app)
        .post('/api/analyze')
        .send({ text, mode: 'conversation' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data).toHaveProperty('aggregateScore');
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});
