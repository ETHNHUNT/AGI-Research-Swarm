require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { tasks } = require('./missions');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// ─────────────────────────────────────────────────────────────────────────────
// BOOT — seed tasks on first run
// ─────────────────────────────────────────────────────────────────────────────

async function seedTasks() {
  const { rows } = await db.pool.query(`SELECT COUNT(*) FROM tasks`);
  if (parseInt(rows[0].count) > 0) return;
  for (const t of tasks) {
    await db.pool.query(`
      INSERT INTO tasks (id, division, title, description, keywords, arxiv_cats, testable)
      VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING
    `, [t.id, t.division, t.title, t.description,
        JSON.stringify(t.keywords || []),
        JSON.stringify(t.arxivCats || []),
        t.testable || false]);
  }
  console.log(`✅ Seeded ${tasks.length} tasks`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL ENDPOINTS — agents read these to understand their roles
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/v1/skill', (req, res) => {
  res.type('text/plain').send(fs.readFileSync(path.join(__dirname, 'SKILL-A.md'), 'utf8'));
});

app.get('/api/v1/skill-b', (req, res) => {
  res.type('text/plain').send(fs.readFileSync(path.join(__dirname, 'SKILL-B.md'), 'utf8'));
});

app.get('/api/v1/skill-c', (req, res) => {
  res.type('text/plain').send(fs.readFileSync(path.join(__dirname, 'SKILL-C.md'), 'utf8'));
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT REGISTRATION — all roles use same endpoint
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/v1/register', async (req, res) => {
  try {
    const { agentName, role } = req.body;
    if (!['researcher', 'critic', 'tester'].includes(role)) {
      return res.status(400).json({ error: 'role must be researcher, critic, or tester' });
    }
    const agentId = `${role.slice(0,1).toUpperCase()}-${uuidv4().slice(0,8)}`;
    await db.registerAgent(agentId, agentName, role);

    // Give first task immediately on registration
    let firstAssignment = null;
    if (role === 'tester') {
      firstAssignment = await db.getNextClaimForAgentC(agentId);
    } else {
      firstAssignment = await db.getNextTask(agentId, role);
    }

    res.json({ agentId, agentName, role, firstAssignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT A + B — get next task
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/v1/next/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { rows } = await db.pool.query(`SELECT role FROM agents WHERE id=$1`, [req.params.agentId]);
    if (!rows.length) return res.status(404).json({ error: 'Agent not found. Register first.' });

    const role = rows[0].role;
    if (role === 'tester') {
      const claim = await db.getNextClaimForAgentC(agentId);
      return res.json({ nextAssignment: claim ? { type: 'test', claim } : null });
    }

    const assignment = await db.getNextTask(agentId, role);
    if (!assignment) return res.json({ nextAssignment: null });

    await db.pool.query(`UPDATE agents SET last_seen=NOW() WHERE id=$1`, [agentId]);
    res.json({ nextAssignment: assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT — Agent A/B submit findings or QC verdicts
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/v1/submit', async (req, res) => {
  try {
    const { type } = req.body;

    if (type === 'research') {
      const findingId = await db.submitFinding(req.body);
      const nextAssignment = await db.getNextTask(req.body.agentId, 'researcher');
      return res.json({ received: true, findingId, nextAssignment });
    }

    if (type === 'qc') {
      await db.submitQCVerdict(req.body);
      const { rows } = await db.pool.query(`SELECT role FROM agents WHERE id=$1`, [req.body.agentId]);
      const role = rows[0]?.role || 'critic';
      const nextAssignment = await db.getNextTask(req.body.agentId, role);
      return res.json({ received: true, nextAssignment });
    }

    res.status(400).json({ error: 'type must be research or qc' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT C — submit test result (literature, HF API probe, or script)
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/v1/agent-c/submit', async (req, res) => {
  try {
    const { agentId } = req.body;
    const result = await db.submitAgentCResult(req.body);
    const nextClaim = await db.getNextClaimForAgentC(agentId);
    res.json({ received: true, ...result, nextAssignment: nextClaim ? { type: 'test', claim: nextClaim } : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELL QUEUE — human-facing endpoints for the benchmark runner
// ─────────────────────────────────────────────────────────────────────────────

// View all tasks waiting for Dell benchmark
app.get('/api/v1/dell-queue', async (req, res) => {
  try {
    const items = await db.getDellQueue();
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download a specific benchmark script
app.get('/api/v1/scripts/:scriptId', async (req, res) => {
  try {
    const script = await db.getScript(req.params.scriptId);
    if (!script) return res.status(404).json({ error: 'Script not found' });
    res.setHeader('Content-Disposition', `attachment; filename="${script.script_name}"`);
    res.type('text/plain').send(script.script_content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// benchmark.js on Dell POSTs results here
app.post('/api/v1/dell-result', async (req, res) => {
  try {
    await db.submitDellResult(req.body);
    res.json({
      received: true,
      message: `Claim ${req.body.claimVerified ? '✅ VERIFIED' : '❌ CONTRADICTED'} on Dell hardware.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD DATA — frontend reads these
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/v1/stats', async (req, res) => {
  try {
    res.json(await db.getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/findings', async (req, res) => {
  try {
    const { page = 1, qcStatus, division } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (qcStatus) { params.push(qcStatus); where += ` AND f.qc_status=$${params.length}`; }
    if (division) { params.push(division); where += ` AND t.division=$${params.length}`; }
    params.push(limit, offset);
    const { rows } = await db.pool.query(`
      SELECT f.*, t.division, t.title as task_title, a.name as agent_name,
             a.role as agent_role, a.quality_score
      FROM findings f
      JOIN tasks t ON f.task_id = t.id
      JOIN agents a ON f.agent_id = a.id
      ${where}
      ORDER BY f.submitted_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ findings: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/agents', async (req, res) => {
  try {
    const { rows } = await db.pool.query(`
      SELECT a.*, 
        COUNT(DISTINCT f.id) as findings_count,
        COUNT(DISTINCT tc.id) as claims_tested
      FROM agents a
      LEFT JOIN findings f ON f.agent_id = a.id
      LEFT JOIN testable_claims tc ON tc.agent_c_id = a.id
      GROUP BY a.id ORDER BY a.registered_at DESC
    `);
    res.json({ agents: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/claims', async (req, res) => {
  try {
    const { status } = req.query;
    let where = status ? `WHERE tc.status = '${status}'` : '';
    const { rows } = await db.pool.query(`
      SELECT tc.*, bs.script_name, bs.model_to_test, bs.estimated_runtime,
             dr.tokens_per_sec, dr.ram_used_gb, dr.claim_verified, dr.tested_at as dell_tested_at
      FROM testable_claims tc
      LEFT JOIN benchmark_scripts bs ON bs.claim_id = tc.id
      LEFT JOIN dell_results dr ON dr.claim_id = tc.id
      ${where}
      ORDER BY tc.tagged_at DESC
    `);
    res.json({ claims: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

(async () => {
  await db.initDB();
  await seedTasks();
  app.listen(PORT, () => {
    console.log(`\n🧠 AGI Research Swarm running on port ${PORT}`);
    console.log(`   Dashboard: http://localhost:${PORT}`);
    console.log(`   Agent A skill: http://localhost:${PORT}/api/v1/skill`);
    console.log(`   Agent B skill: http://localhost:${PORT}/api/v1/skill-b`);
    console.log(`   Agent C skill: http://localhost:${PORT}/api/v1/skill-c`);
    console.log(`   Dell queue:    http://localhost:${PORT}/api/v1/dell-queue\n`);
  });
})();
