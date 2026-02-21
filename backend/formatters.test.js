const test = require('node:test');
const assert = require('node:assert');
const { formatQCAssignment } = require('./formatters');

test('formatQCAssignment should format QC assignment correctly', () => {
  const agentId = 'agent-123';
  const finding = {
    id: 'finding-456',
    title: 'Finding Title',
    summary: 'Finding Summary',
    citations: ['Citation 1'],
    confidence: 0.9,
    contradictions: 'None',
    gaps: 'None',
    division_id: 'div-1',
    queue_id: 'queue-1',
    agent_id: 'original-agent-789',
    agent_quality: 0.8,
    agent_flagged: false,
    qc_status: 'pending',
    qc_cycle: 1,
    task_description: 'Original Task Description',
    task_search_terms: ['term1', 'term2']
  };

  const result = formatQCAssignment(agentId, finding);

  assert.strictEqual(result.type, 'qc_review');
  assert.strictEqual(result.findingId, finding.id);
  assert.strictEqual(result.findingTitle, finding.title);
  assert.strictEqual(result.findingSummary, finding.summary);
  assert.deepStrictEqual(result.findingCitations, finding.citations);
  assert.strictEqual(result.findingConfidence, finding.confidence);
  assert.strictEqual(result.findingContradictions, finding.contradictions);
  assert.strictEqual(result.findingGaps, finding.gaps);
  assert.strictEqual(result.findingDivision, finding.division_id);
  assert.strictEqual(result.findingQueue, finding.queue_id);
  assert.strictEqual(result.originalAgentId, finding.agent_id);
  assert.strictEqual(result.agentQuality, finding.agent_quality);
  assert.strictEqual(result.agentFlagged, finding.agent_flagged);
  assert.strictEqual(result.previousQCStatus, finding.qc_status);
  assert.strictEqual(result.qcCycle, finding.qc_cycle);
  assert.strictEqual(result.originalTaskDescription, finding.task_description);
  assert.deepStrictEqual(result.originalSearchTerms, finding.task_search_terms);
  assert.strictEqual(result.submitTo, `/api/v1/agents/${agentId}/qc-submit`);
  assert.ok(Array.isArray(result.instructions));
  assert.ok(result.instructions.length > 0);
});

test('formatQCAssignment should handle missing optional fields', () => {
  const agentId = 'agent-123';
  const finding = {
    id: 'finding-456',
    title: 'Finding Title',
    // summary missing
    // citations missing
    // ...
  };

  const result = formatQCAssignment(agentId, finding);

  assert.strictEqual(result.qcCycle, 0);
  assert.strictEqual(result.originalTaskDescription, '');
  assert.deepStrictEqual(result.originalSearchTerms, []);
});
