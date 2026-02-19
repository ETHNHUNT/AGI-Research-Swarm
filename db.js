const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  await pool.query(`

    -- ─────────────────────────────────────────
    -- AGENTS (A, B, C all register here)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS agents (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('researcher', 'critic', 'tester')),
      registered_at TIMESTAMPTZ DEFAULT NOW(),
      tasks_done    INT DEFAULT 0,
      qc_done       INT DEFAULT 0,
      quality_score FLOAT DEFAULT 1.0,
      flagged       BOOLEAN DEFAULT FALSE,
      last_seen     TIMESTAMPTZ DEFAULT NOW()
    );

    -- ─────────────────────────────────────────
    -- TASK QUEUE (Agent A + B research tasks)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS tasks (
      id            TEXT PRIMARY KEY,
      division      TEXT NOT NULL,
      title         TEXT NOT NULL,
      description   TEXT NOT NULL,
      keywords      JSONB DEFAULT '[]',
      arxiv_cats    JSONB DEFAULT '[]',
      testable      BOOLEAN DEFAULT FALSE,
      status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
      assigned_to   TEXT REFERENCES agents(id),
      assigned_at   TIMESTAMPTZ
    );

    -- ─────────────────────────────────────────
    -- FINDINGS (submitted by A and B)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS findings (
      id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      agent_id          TEXT REFERENCES agents(id),
      task_id           TEXT REFERENCES tasks(id),
      summary           TEXT NOT NULL,
      citations         JSONB DEFAULT '[]',
      confidence        TEXT CHECK (confidence IN ('high','medium','low')),
      contradictions    JSONB DEFAULT '[]',
      research_gaps     JSONB DEFAULT '[]',
      testable_claims   JSONB DEFAULT '[]',
      submitted_at      TIMESTAMPTZ DEFAULT NOW(),
      qc_status         TEXT DEFAULT 'pending' CHECK (qc_status IN ('pending','passed','flagged','rejected')),
      qc_agent_id       TEXT REFERENCES agents(id),
      qc_verdict        TEXT,
      qc_issues         JSONB DEFAULT '[]',
      qc_hardware_claims JSONB DEFAULT '[]',
      qc_at             TIMESTAMPTZ
    );

    -- ─────────────────────────────────────────
    -- TESTABLE CLAIMS QUEUE (fed by Agent B QC)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS testable_claims (
      id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      finding_id      TEXT REFERENCES findings(id),
      task_id         TEXT REFERENCES tasks(id),
      claim           TEXT NOT NULL,
      claim_type      TEXT CHECK (claim_type IN ('inference_speed','memory_usage','benchmark_score','model_capability','pipeline')),
      source_arxiv_id TEXT,
      source_paper    TEXT,
      tagged_by       TEXT REFERENCES agents(id),
      tagged_at       TIMESTAMPTZ DEFAULT NOW(),
      status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','supported','contradicted','inconclusive','needs_hardware','dell_queued','dell_verified','dell_contradicted')),
      agent_c_id      TEXT REFERENCES agents(id),
      agent_c_method  TEXT,
      agent_c_verdict TEXT,
      agent_c_evidence TEXT,
      agent_c_model   TEXT,
      agent_c_confidence TEXT,
      agent_c_notes   TEXT,
      agent_c_at      TIMESTAMPTZ
    );

    -- ─────────────────────────────────────────
    -- BENCHMARK SCRIPTS (written by Agent C)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS benchmark_scripts (
      id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      claim_id        TEXT REFERENCES testable_claims(id),
      task_id         TEXT REFERENCES tasks(id),
      script_name     TEXT NOT NULL,
      script_content  TEXT NOT NULL,
      model_to_test   TEXT NOT NULL,
      original_claim  TEXT NOT NULL,
      expected_result TEXT,
      estimated_runtime TEXT,
      written_by      TEXT REFERENCES agents(id),
      written_at      TIMESTAMPTZ DEFAULT NOW(),
      dell_status     TEXT DEFAULT 'queued' CHECK (dell_status IN ('queued','running','done','failed')),
      dell_run_at     TIMESTAMPTZ
    );

    -- ─────────────────────────────────────────
    -- DELL RESULTS (posted by benchmark.js)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS dell_results (
      id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      claim_id        TEXT REFERENCES testable_claims(id),
      script_id       TEXT REFERENCES benchmark_scripts(id),
      model           TEXT NOT NULL,
      quantization    TEXT,
      ram_used_gb     FLOAT,
      tokens_per_sec  FLOAT,
      vram_used_mb    FLOAT,
      load_time_sec   FLOAT,
      inference_mode  TEXT CHECK (inference_mode IN ('cpu','gpu','hybrid')),
      reasoning_score FLOAT,
      instruction_score FLOAT,
      claim_verified  BOOLEAN,
      benchmark_output TEXT,
      notes           TEXT,
      hardware_profile JSONB,
      tested_at       TIMESTAMPTZ DEFAULT NOW()
    );

    -- ─────────────────────────────────────────
    -- INDEXES
    -- ─────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_findings_qc_status ON findings(qc_status);
    CREATE INDEX IF NOT EXISTS idx_findings_agent ON findings(agent_id);
    CREATE INDEX IF NOT EXISTS idx_claims_status ON testable_claims(status);
    CREATE INDEX IF NOT EXISTS idx_scripts_dell_status ON benchmark_scripts(dell_status);
  `);
  console.log('✅ DB schema ready');
}

// ─── Task assignment logic ────────────────────────────────────────────────────

async function getNextTask(agentId, role) {
  // Critic (B) gets QC 50% of the time; Researcher (A) gets QC 30%
  const qcRate = role === 'critic' ? 0.5 : 0.3;
  const doQC = Math.random() < qcRate;

  // Count verified findings to see if QC is possible
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM findings WHERE qc_status = 'pending' AND agent_id != $1`, [agentId]
  );
  const qcAvailable = parseInt(countRows[0].count) > 0;

  if (doQC && qcAvailable) {
    // QC task: prioritise flagged agents' work first
    const { rows } = await pool.query(`
      SELECT f.*, a.flagged as author_flagged
      FROM findings f
      JOIN agents a ON f.agent_id = a.id
      WHERE f.qc_status = 'pending'
        AND f.agent_id != $1
      ORDER BY a.flagged DESC, f.submitted_at ASC
      LIMIT 1
    `, [agentId]);

    if (rows.length) {
      return { type: 'qc', finding: rows[0] };
    }
  }

  // Research task: pick next pending task
  const { rows } = await pool.query(`
    UPDATE tasks SET status = 'in_progress', assigned_to = $1, assigned_at = NOW()
    WHERE id = (
      SELECT id FROM tasks WHERE status = 'pending'
      ORDER BY id LIMIT 1
    )
    RETURNING *
  `, [agentId]);

  if (rows.length) return { type: 'research', task: rows[0] };
  return null;
}

async function getNextClaimForAgentC(agentCId) {
  const { rows } = await pool.query(`
    UPDATE testable_claims SET status = 'in_progress', agent_c_id = $1
    WHERE id = (
      SELECT id FROM testable_claims WHERE status = 'pending'
      ORDER BY tagged_at ASC LIMIT 1
    )
    RETURNING *
  `, [agentCId]);
  return rows[0] || null;
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  pool,
  initDB,
  getNextTask,
  getNextClaimForAgentC,

  async registerAgent(id, name, role) {
    await pool.query(
      `INSERT INTO agents (id, name, role) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET last_seen = NOW()`,
      [id, name, role]
    );
  },

  async submitFinding(data) {
    const { agentId, taskId, summary, citations, confidence, contradictions, researchGaps, testableClaims } = data;
    const { rows } = await pool.query(`
      INSERT INTO findings (agent_id, task_id, summary, citations, confidence, contradictions, research_gaps, testable_claims)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
    `, [agentId, taskId, summary, JSON.stringify(citations), confidence,
        JSON.stringify(contradictions), JSON.stringify(researchGaps), JSON.stringify(testableClaims)]);

    await pool.query(`UPDATE tasks SET status='done' WHERE id=$1`, [taskId]);
    await pool.query(`UPDATE agents SET tasks_done=tasks_done+1, last_seen=NOW() WHERE id=$1`, [agentId]);
    return rows[0].id;
  },

  async submitQCVerdict(data) {
    const { agentId, findingId, verdict, issues, hardwareClaimsForAgentC, correctedConfidence } = data;
    await pool.query(`
      UPDATE findings SET qc_status=$1, qc_agent_id=$2, qc_verdict=$1,
        qc_issues=$3, qc_hardware_claims=$4, qc_at=NOW()
      WHERE id=$5
    `, [verdict, agentId, JSON.stringify(issues), JSON.stringify(hardwareClaimsForAgentC || []), findingId]);

    // Demote agent quality score on rejection
    if (verdict === 'rejected') {
      const { rows } = await pool.query(`SELECT agent_id FROM findings WHERE id=$1`, [findingId]);
      if (rows.length) {
        await pool.query(`
          UPDATE agents SET quality_score = GREATEST(0, quality_score - 0.15),
            flagged = (quality_score - 0.15 < 0.5)
          WHERE id=$1
        `, [rows[0].agent_id]);
      }
    }

    // Promote hardware claims to testable_claims queue
    if (hardwareClaimsForAgentC?.length) {
      const finding = await pool.query(`SELECT task_id FROM findings WHERE id=$1`, [findingId]);
      const taskId = finding.rows[0]?.task_id;
      for (const hc of hardwareClaimsForAgentC) {
        await pool.query(`
          INSERT INTO testable_claims (finding_id, task_id, claim, claim_type, source_arxiv_id, source_paper, tagged_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [findingId, taskId, hc.claim, hc.claimType, hc.sourceArxivId, hc.sourcePaper, agentId]);
      }
    }

    await pool.query(`UPDATE agents SET qc_done=qc_done+1, last_seen=NOW() WHERE id=$1`, [agentId]);
  },

  async submitAgentCResult(data) {
    const { claimId, agentId, method, verdict, evidence, modelTested, confidence, notes, scriptContent, scriptName, modelToTest, estimatedRuntime } = data;

    await pool.query(`
      UPDATE testable_claims SET
        status=$1, agent_c_id=$2, agent_c_method=$3, agent_c_verdict=$1,
        agent_c_evidence=$4, agent_c_model=$5, agent_c_confidence=$6,
        agent_c_notes=$7, agent_c_at=NOW()
      WHERE id=$8
    `, [verdict, agentId, method, evidence, modelTested, confidence, notes, claimId]);

    // If needs_hardware, save the script and move to dell queue
    if (verdict === 'needs_hardware' && scriptContent) {
      const { rows } = await pool.query(`
        INSERT INTO benchmark_scripts (claim_id, script_name, script_content, model_to_test, original_claim, estimated_runtime, written_by)
        SELECT $1, $2, $3, $4, claim, $5, $6 FROM testable_claims WHERE id=$1
        RETURNING id
      `, [claimId, scriptName || `bench_${claimId.slice(0,8)}.py`, scriptContent, modelToTest, estimatedRuntime, agentId]);

      await pool.query(`UPDATE testable_claims SET status='dell_queued' WHERE id=$1`, [claimId]);
      return { scriptId: rows[0]?.id };
    }

    return {};
  },

  async submitDellResult(data) {
    const { claimId, scriptId, model, quantization, ramUsedGb, tokensPerSec,
            vramUsedMb, loadTimeSec, inferenceMode, reasoningScore, instructionScore,
            claimVerified, benchmarkOutput, notes, hardwareProfile } = data;

    await pool.query(`
      INSERT INTO dell_results (claim_id, script_id, model, quantization, ram_used_gb,
        tokens_per_sec, vram_used_mb, load_time_sec, inference_mode, reasoning_score,
        instruction_score, claim_verified, benchmark_output, notes, hardware_profile)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    `, [claimId, scriptId, model, quantization, ramUsedGb, tokensPerSec, vramUsedMb,
        loadTimeSec, inferenceMode, reasoningScore, instructionScore, claimVerified,
        benchmarkOutput, notes, JSON.stringify(hardwareProfile)]);

    const newStatus = claimVerified ? 'dell_verified' : 'dell_contradicted';
    await pool.query(`UPDATE testable_claims SET status=$1 WHERE id=$2`, [newStatus, claimId]);
    if (scriptId) {
      await pool.query(`UPDATE benchmark_scripts SET dell_status='done', dell_run_at=NOW() WHERE id=$1`, [scriptId]);
    }
  },

  async getDellQueue() {
    const { rows } = await pool.query(`
      SELECT tc.id as claim_id, tc.claim, tc.claim_type, tc.tagged_at, tc.agent_c_notes,
             bs.id as script_id, bs.script_name, bs.model_to_test, bs.original_claim,
             bs.estimated_runtime, bs.written_at
      FROM testable_claims tc
      LEFT JOIN benchmark_scripts bs ON bs.claim_id = tc.id
      WHERE tc.status = 'dell_queued'
      ORDER BY tc.tagged_at ASC
    `);
    return rows;
  },

  async getScript(scriptId) {
    const { rows } = await pool.query(`SELECT * FROM benchmark_scripts WHERE id=$1`, [scriptId]);
    return rows[0] || null;
  },

  async getStats() {
    const [tasks, findings, agents, claims, dell] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) FROM tasks GROUP BY status`),
      pool.query(`SELECT qc_status, COUNT(*) FROM findings GROUP BY qc_status`),
      pool.query(`SELECT role, COUNT(*) FROM agents GROUP BY role`),
      pool.query(`SELECT status, COUNT(*) FROM testable_claims GROUP BY status`),
      pool.query(`SELECT COUNT(*) FROM dell_results`),
    ]);
    return { tasks: tasks.rows, findings: findings.rows, agents: agents.rows, claims: claims.rows, dell: dell.rows[0] };
  },
};
