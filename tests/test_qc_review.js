const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { db } = require('../backend/db');
const app = require('../backend/server');

describe('POST /api/v1/qc/review/:findingId', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise(resolve => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  after(() => {
    server.close();
  });

  // Default mocks
  beforeEach(() => {
    db.getFindingById = async () => null;
    db.updateFindingQC = async () => {};
    db.recalcAgentQuality = async () => ({ score: 1.0, flagged: false });
    db.getActiveMission = async () => ({ id: 'm1' });
    db.log = async () => {};
    db.getFindingsForQC = async () => []; // Default to empty array
  });

  test('should return 400 if verdict is missing', async () => {
    const res = await fetch(`${baseUrl}/api/v1/qc/review/f1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'missing verdict' }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('verdict required'));
  });

  test('should return 400 if verdict is invalid', async () => {
    const res = await fetch(`${baseUrl}/api/v1/qc/review/f1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verdict: 'maybe', notes: 'invalid verdict' }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.ok(data.error.includes('verdict required'));
  });

  test('should return 404 if finding not found', async () => {
    db.getFindingById = async () => null;

    const res = await fetch(`${baseUrl}/api/v1/qc/review/f1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verdict: 'passed' }),
    });

    assert.strictEqual(res.status, 404);
  });

  test('should update finding QC status and return 200 on success', async () => {
    const mockFinding = {
      id: 'f1',
      agent_id: 'a1',
      qc_cycle: 0,
      title: 'Test Finding',
      mission_id: 'm1'
    };

    let updateCalled = false;
    let logCalled = false;

    db.getFindingById = async (id) => {
      if (id === 'f1') return mockFinding;
      return null;
    };

    db.updateFindingQC = async (id, data) => {
      assert.strictEqual(id, 'f1');
      assert.strictEqual(data.qcStatus, 'passed');
      assert.strictEqual(data.qcNotes, 'Good job');
      assert.strictEqual(data.qcAgentId, 'reviewer1');
      assert.strictEqual(data.qcCycle, 1);
      updateCalled = true;
    };

    db.recalcAgentQuality = async (agentId) => {
      assert.strictEqual(agentId, 'a1');
      return { score: 0.9, flagged: false, passes: 9, fails: 1 };
    };

    db.log = async (missionId, msg, type) => {
      assert.strictEqual(missionId, 'm1');
      assert.strictEqual(type, 'qc');
      logCalled = true;
    };

    const res = await fetch(`${baseUrl}/api/v1/qc/review/f1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verdict: 'passed',
        notes: 'Good job',
        reviewerAgentId: 'reviewer1'
      }),
    });

    assert.strictEqual(res.status, 200);
    assert.ok(updateCalled, 'updateFindingQC should be called');
    assert.ok(logCalled, 'db.log should be called');
  });

  test('should handle flagged agent logic', async () => {
    const mockFinding = {
        id: 'f2',
        agent_id: 'a2',
        qc_cycle: 0,
        title: 'Bad Finding',
        mission_id: 'm1'
    };

    let flaggedLogCalled = false;

    db.getFindingById = async () => mockFinding;

    db.recalcAgentQuality = async () => ({ score: 0.2, flagged: true, passes: 2, fails: 8 });

    db.log = async (missionId, msg, type) => {
        if (msg.includes('FLAGGED') && type === 'warning') {
            flaggedLogCalled = true;
        }
    };

    const res = await fetch(`${baseUrl}/api/v1/qc/review/f2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verdict: 'rejected' }),
    });

    assert.strictEqual(res.status, 200);
    assert.ok(flaggedLogCalled, 'Should log agent flagging');
  });
});
