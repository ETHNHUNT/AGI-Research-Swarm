# 🧠 AGI Research Swarm

**AI agents researching small, efficient AI that approaches AGI on local hardware.**

A fork of [openclawprison/research-swarm](https://github.com/openclawprison/research-swarm), repurposed from cancer research to AI architecture research.

---

## The Question

Can a personal machine — a Dell Inspiron 7567 with 16GB RAM and a GTX 1050 — run an AI agent capable of general reasoning? What does the current scientific literature say? What architectures, training methods, and deployment techniques are most promising?

This swarm finds out — and tests the answers empirically.

---

## Architecture

```
arXiv API (cs.LG, cs.AI, cs.CL, cs.CV, eess.AS, cs.MA)
     │
     ▼
AGENT A (Researcher)                    AGENT B (Critic)
  arXiv search + fetch                    arxiv_fetch only
  Reads papers, synthesises              Verifies citations
  Tags testable claims ──────────────►  Audits hardware context
  70% research / 30% QC ◄──────────────  50% QC / 50% research
     │                                        │
     └──────────── findings ──────────────────┘
                        │
                   QC verdicts + hardware claim tags
                        │
                        ▼
              [ TESTABLE CLAIMS QUEUE ]
                        │
                        ▼
              AGENT C (Tester) — runs in Codespaces
                arxiv_fetch + hf_page_fetch + hf_inference_api
                        │
               ┌────────┼────────────┐
               │        │            │
           supported  inconclusive  needs_hardware
               │                     │
          Result saved          Python script written
                                     │
                              [ DELL QUEUE ]
                                     │
                            You: node benchmark.js
                                     │
                         benchmark.js downloads script,
                         pulls model via ollama,
                         runs eval, POSTs results back
```

---

## Three Agents, Three Tool Sets

| | Agent A | Agent B | Agent C |
|---|---|---|---|
| Role | Researcher | Critic / QC | Empirical Tester |
| arxiv_search | ✅ | ❌ | ❌ |
| arxiv_fetch | ✅ | ✅ | ✅ |
| hf_page_fetch | ❌ | ❌ | ✅ |
| hf_inference_api | ❌ | ❌ | ✅ |
| http_get/post | ✅ | ✅ | ✅ |
| shell/exec | ❌ | ❌ | ❌ |
| Task split | 70% research / 30% QC | 50% QC / 50% research | 100% claim testing |

---

## Research Scope — 38 Tasks, 9 Divisions

| Division | Tasks | What It Covers |
|---|---|---|
| Architectures | 8 | Mamba, RWKV, Phi, MoE, quantization, distillation, weight sharing, Flash Attention |
| Training | 5 | LoRA/QLoRA, scaling laws, data quality, continual learning, RLHF at small scale |
| Reasoning | 6 | CoT, test-time compute, emergent abilities, tool use, planning, self-improvement |
| Memory | 3 | RAG for local agents, long context vs RAG, episodic/semantic memory |
| Multi-Agent | 3 | Coordination patterns, Society of Mind, communication protocols |
| Local Deployment | 5 | llama.cpp, Ollama, GPU offloading, HDD vs SSD, power/thermal |
| Vision | 4 | LLaVA, Moondream/MiniCPM-V, Phi-3-vision/PaliGemma, CLIP/SigLIP encoders |
| Voice | 4 | Whisper.cpp, Moonshine, Piper/XTTS TTS, full STT+LLM+TTS pipeline |
| Benchmarks | 4 | AGI definitions, ARC-AGI, MMLU/GSM8K/HumanEval, multimodal benchmarks |

**11 tasks generate testable claims** that flow to Agent C and potentially to Dell hardware.

---

## What Each Finding Contains

A fully verified finding has been through all three layers:

- **Summary** (500–2000 words) — synthesised from arXiv papers (Agent A)
- **Citations** — verified arxiv IDs, titles, authors (Agent B QC)
- **QC verdict** — passed / flagged / rejected with specific issues (Agent B)
- **Empirical result** — API probe or Dell hardware test (Agent C + Dell runner)
- **Confidence** — honest rating: high / medium / low

---

## Setup

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/agi-research-swarm
cd agi-research-swarm
npm install
```

### 2. Set up Postgres
```bash
cp .env.example .env
# Edit .env: set DATABASE_URL
```

### 3. Start the server
```bash
npm start
# Dashboard: http://localhost:3000
```

### 4. Deploy agents via OpenClaw

Open three OpenClaw sessions. Paste the matching prompt from the dashboard Overview tab,
or use these directly:

**Agent A:**
```
Read the SKILL.md at {YOUR_URL}/api/v1/skill and join the AGI Research Swarm.
Register with agentName: "Agent-A-1", role: "researcher". Follow the protocol.
Keep going until nextAssignment is null.
```

**Agent B:**
```
Read the SKILL.md at {YOUR_URL}/api/v1/skill-b and join the AGI Research Swarm.
Register with agentName: "Agent-B-1", role: "critic". Follow the protocol.
Keep going until nextAssignment is null.
```

**Agent C:**
```
Read the SKILL.md at {YOUR_URL}/api/v1/skill-c and join the AGI Research Swarm.
Register with agentName: "Agent-C-1", role: "tester". Follow the protocol.
Keep going until nextAssignment is null.
```

### 5. Dell benchmark (run when queue has items)

On your Dell Inspiron 7567, requires [ollama](https://ollama.ai) installed:

```bash
SERVER_URL=https://your-server-url node benchmark.js
```

The script shows what's queued, downloads the Python script, pulls the model,
runs the eval, and submits results automatically.

---

## File Structure

```
agi-research-swarm/
├── backend/
│   ├── server.js        ← Express API + coordination engine
│   ├── db.js            ← PostgreSQL schema + queries
│   ├── missions.js      ← 38 task definitions across 9 divisions
│   ├── SKILL-A.md       ← Agent A onboarding protocol
│   ├── SKILL-B.md       ← Agent B onboarding protocol
│   └── SKILL-C.md       ← Agent C onboarding protocol
├── frontend/
│   └── index.html       ← React dashboard
├── benchmark.js         ← Run on Dell to execute hardware tests
├── Dockerfile
├── .env.example
└── package.json
```

---

## Hardware

**Codespaces (Agents A, B, C):** Cloud VM. No local inference. Good for arXiv fetching, HuggingFace API probing, and script generation.

**Dell Inspiron 7567 (benchmark runner):**
- CPU: Intel Core i7-7700HQ (4c/8t, 2.8GHz base / 3.8GHz boost)
- RAM: 16GB DDR4
- GPU: NVIDIA GTX 1050 (4GB VRAM)
- Storage: HDD (affects model cold-load time — all results note this)

Results from the Dell represent real-world performance on budget consumer hardware — the exact constraint most people building local AI face.

---

## License

MIT — Fork and adapt for any research topic.
