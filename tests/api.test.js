import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

test('NEUZEN AI HRMS API Test Suite', async (t) => {
  await t.test('GET /api/health returns 200 OK and health status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'NEUZEN AI HRMS API is running');
  });

  await t.test('GET /api/audit-logs returns 401 Unauthorized without token', async () => {
    const res = await request(app).get('/api/audit-logs');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});
