// missions.js — AGI Research Swarm task definitions
// All tasks are sourced from arXiv only (cs.LG, cs.AI, cs.CL, cs.CV, eess.AS, cs.MA, cs.NE)

const tasks = [

  // ══════════════════════════════════════════════════
  // DIVISION 1: ARCHITECTURES
  // Small, efficient model architectures
  // ══════════════════════════════════════════════════

  { id: 'arch-001', division: 'architectures', title: 'Mamba SSM — architecture and efficiency',
    description: 'Survey the Mamba state space model. How does selective state space replace attention? What parameter counts have been evaluated? What tasks does it excel at vs transformers?',
    keywords: ['Mamba', 'state space model', 'SSM', 'selective scan'], arxivCats: ['cs.LG','cs.AI'],
    testable: true, testClaim: 'Mamba 1.4B matches Transformer 3× larger in language modelling perplexity', claimType: 'benchmark_score' },

  { id: 'arch-002', division: 'architectures', title: 'RWKV — linear attention language model',
    description: 'Research RWKV architecture. How does it achieve transformer-quality with RNN inference? What are smallest viable sizes? Parallelisable during training, linear during inference?',
    keywords: ['RWKV', 'linear attention', 'RNN', 'receptance'], arxivCats: ['cs.CL','cs.LG'],
    testable: true, testClaim: 'RWKV-4 1.5B runs inference on 8GB RAM CPU at competitive speed', claimType: 'inference_speed' },

  { id: 'arch-003', division: 'architectures', title: 'Phi series — small model data efficiency',
    description: 'Survey Phi-1 through Phi-3.5. What training data strategies produce outsized capability at small scale? Which Phi model has best reasoning per parameter?',
    keywords: ['Phi-3', 'small language model', 'data efficient', 'textbook quality'], arxivCats: ['cs.CL','cs.LG'],
    testable: true, testClaim: 'Phi-3-mini-4k outperforms models 3× larger on MMLU', claimType: 'benchmark_score' },

  { id: 'arch-004', division: 'architectures', title: 'Mixture of Experts — sparse inference for consumer hardware',
    description: 'How do sparse MoE models activate only a fraction of parameters per token? What is minimum RAM to run Mixtral 8×7B? What quality loss vs dense equivalent?',
    keywords: ['mixture of experts', 'sparse MoE', 'Mixtral', 'sparse activation'], arxivCats: ['cs.LG','cs.CL'],
    testable: false },

  { id: 'arch-005', division: 'architectures', title: 'Quantization survey — GGUF, GPTQ, AWQ on consumer hardware',
    description: 'Compare quantization methods for running large models on constrained hardware. Quality vs size tradeoff at 2/4/8-bit. Which method is best for CPU-only?',
    keywords: ['quantization', 'GGUF', 'GPTQ', 'AWQ', '4-bit'], arxivCats: ['cs.LG','cs.AR'],
    testable: true, testClaim: '4-bit quantization retains >95% benchmark performance vs FP16 baseline', claimType: 'benchmark_score' },

  { id: 'arch-006', division: 'architectures', title: 'Knowledge distillation — compressing capability into tiny models',
    description: 'How is knowledge distilled from large teacher models to small students? Smallest model that retains useful reasoning via distillation? Task-specific vs general distillation?',
    keywords: ['knowledge distillation', 'model compression', 'teacher student', 'DistilBERT'], arxivCats: ['cs.LG','cs.CL'],
    testable: false },

  { id: 'arch-007', division: 'architectures', title: 'Weight sharing and parameter efficiency',
    description: 'Survey ALBERT-style weight sharing, tied embeddings, and cross-layer parameter sharing. How much parameter reduction is achievable without capability loss?',
    keywords: ['weight sharing', 'ALBERT', 'parameter efficient', 'layer tying'], arxivCats: ['cs.CL','cs.LG'],
    testable: false },

  { id: 'arch-008', division: 'architectures', title: 'Flash Attention and memory-efficient attention',
    description: 'How does Flash Attention reduce memory from O(n²) to O(n)? Does it enable running longer contexts on 16GB RAM? What is the practical gain for 7B models?',
    keywords: ['flash attention', 'memory efficient', 'attention optimization', 'IO aware'], arxivCats: ['cs.LG','cs.PF'],
    testable: true, testClaim: 'Flash Attention 2 enables 4× longer context on same GPU memory', claimType: 'memory_usage' },

  // ══════════════════════════════════════════════════
  // DIVISION 2: TRAINING EFFICIENCY
  // ══════════════════════════════════════════════════

  { id: 'train-001', division: 'training', title: 'LoRA and QLoRA — fine-tuning on consumer hardware',
    description: 'How does Low-Rank Adaptation enable fine-tuning 7B+ models on 4GB VRAM? What tasks benefit most? What is the quality gap vs full fine-tuning?',
    keywords: ['LoRA', 'QLoRA', 'PEFT', 'fine-tuning', 'low rank'], arxivCats: ['cs.LG','cs.CL'],
    testable: true, testClaim: 'QLoRA can fine-tune a 7B model on a 4GB VRAM GPU with minimal quality loss', claimType: 'memory_usage' },

  { id: 'train-002', division: 'training', title: 'Chinchilla scaling laws — optimal size vs compute',
    description: 'What do scaling laws say about optimal model size vs training tokens? Implications for building capable small models with limited compute budget?',
    keywords: ['Chinchilla', 'scaling laws', 'compute optimal', 'training budget'], arxivCats: ['cs.LG','cs.AI'],
    testable: false },

  { id: 'train-003', division: 'training', title: 'Data quality over quantity — training small capable models',
    description: 'How do high-quality curated datasets (SlimPajama, The Pile, FineWeb) enable small models to outperform larger models on noisier data? Best curation practices?',
    keywords: ['data quality', 'data curation', 'FineWeb', 'SlimPajama', 'training data'], arxivCats: ['cs.CL','cs.LG'],
    testable: false },

  { id: 'train-004', division: 'training', title: 'Continual learning — avoiding catastrophic forgetting in local agents',
    description: 'How can local AI agents learn from new interactions without forgetting prior knowledge? Survey EWC, replay buffers, progressive nets, and LoRA-based continual learning.',
    keywords: ['continual learning', 'catastrophic forgetting', 'EWC', 'lifelong learning'], arxivCats: ['cs.LG','cs.AI'],
    testable: false },

  { id: 'train-005', division: 'training', title: 'RLHF and RLAIF at small scale',
    description: 'Can RLHF / RLAIF alignment techniques be applied to sub-7B models? What is the minimum scale for effective preference learning? DPO vs PPO for small models?',
    keywords: ['RLHF', 'RLAIF', 'DPO', 'PPO', 'alignment small model'], arxivCats: ['cs.LG','cs.CL','cs.AI'],
    testable: false },

  // ══════════════════════════════════════════════════
  // DIVISION 3: REASONING & INTELLIGENCE
  // ══════════════════════════════════════════════════

  { id: 'reason-001', division: 'reasoning', title: 'Chain-of-thought prompting in small models',
    description: 'Does CoT prompting improve reasoning in sub-7B models? At what parameter count does it become reliably effective? Survey empirical results across model families.',
    keywords: ['chain of thought', 'CoT', 'reasoning', 'prompting', 'small model'], arxivCats: ['cs.CL','cs.AI'],
    testable: true, testClaim: 'CoT prompting improves GSM8K scores in 3B+ parameter models', claimType: 'benchmark_score' },

  { id: 'reason-002', division: 'reasoning', title: 'Test-time compute scaling — thinking longer vs bigger models',
    description: 'Can small models with extended inference-time compute (o1-style, beam search, MCTS) match larger models? What open implementations exist for local use?',
    keywords: ['test time compute', 'inference scaling', 'o1', 'reasoning budget', 'MCTS'], arxivCats: ['cs.AI','cs.LG'],
    testable: false },

  { id: 'reason-003', division: 'reasoning', title: 'Emergent abilities in small models — threshold and induction',
    description: 'At what parameter scale do emergent reasoning abilities appear? Can curriculum learning or synthetic data induce emergent reasoning below 7B? What does recent literature say?',
    keywords: ['emergent abilities', 'phase transition', 'small LLM', 'capability threshold'], arxivCats: ['cs.LG','cs.AI'],
    testable: false },

  { id: 'reason-004', division: 'reasoning', title: 'Tool use and function calling in small models',
    description: 'How well do sub-7B models handle structured tool use, JSON function schemas, and agentic tasks? Which architectures support this natively vs via fine-tuning?',
    keywords: ['tool use', 'function calling', 'JSON schema', 'agentic LLM'], arxivCats: ['cs.CL','cs.AI'],
    testable: true, testClaim: 'Mistral 7B Instruct reliably follows JSON function calling schemas', claimType: 'model_capability' },

  { id: 'reason-005', division: 'reasoning', title: 'Planning and multi-step task execution — ReAct, Reflexion, ToT',
    description: 'Survey ReAct, Reflexion, tree-of-thoughts, and similar frameworks. Minimum model size for reliable multi-step planning? How do they perform on constrained hardware?',
    keywords: ['ReAct', 'Reflexion', 'tree of thoughts', 'LLM planning', 'agentic'], arxivCats: ['cs.AI','cs.CL'],
    testable: false },

  { id: 'reason-006', division: 'reasoning', title: 'Self-improvement and meta-learning in small models',
    description: 'What is the current state of models that improve via self-play, self-correction, or STaR (self-taught reasoning)? What scale is required? Theoretical limits?',
    keywords: ['self improvement', 'STaR', 'self play', 'meta learning', 'self correction'], arxivCats: ['cs.LG','cs.AI'],
    testable: false },

  // ══════════════════════════════════════════════════
  // DIVISION 4: MEMORY SYSTEMS
  // ══════════════════════════════════════════════════

  { id: 'mem-001', division: 'memory', title: 'RAG for local agents — vector stores on constrained hardware',
    description: 'How does RAG extend effective knowledge of small models? Best local vector stores (ChromaDB, FAISS, SQLite-VSS) for 16GB RAM machines? Chunking strategies?',
    keywords: ['RAG', 'retrieval augmented', 'ChromaDB', 'FAISS', 'local vector store'], arxivCats: ['cs.IR','cs.CL'],
    testable: true, testClaim: 'ChromaDB or FAISS runs efficiently for RAG on 16GB RAM with sub-100ms retrieval', claimType: 'inference_speed' },

  { id: 'mem-002', division: 'memory', title: 'Long context vs RAG — tradeoffs for local inference',
    description: 'Is a 128k context window better than RAG for local agents? Compute cost of long context on CPU inference? When does each approach win?',
    keywords: ['long context', '128k context', 'RAG vs context', 'KV cache'], arxivCats: ['cs.CL','cs.LG'],
    testable: false },

  { id: 'mem-003', division: 'memory', title: 'Episodic and semantic memory for persistent local agents',
    description: 'How do cognitive-science-inspired memory architectures (episodic, semantic, procedural) map to LLM agent systems? What implementations are most practical for local use?',
    keywords: ['episodic memory', 'semantic memory', 'agent memory', 'cognitive architecture'], arxivCats: ['cs.AI','cs.LG'],
    testable: false },

  // ══════════════════════════════════════════════════
  // DIVISION 5: MULTI-AGENT SYSTEMS
  // ══════════════════════════════════════════════════

  { id: 'multi-001', division: 'multiagent', title: 'Multi-agent LLM coordination patterns',
    description: 'Survey debate, peer-review, consensus, and specialised agent patterns. How do they improve quality over single agents? What coordination overhead on local hardware?',
    keywords: ['multi-agent LLM', 'agent debate', 'peer review agent', 'swarm AI'], arxivCats: ['cs.MA','cs.AI'],
    testable: false },

  { id: 'multi-002', division: 'multiagent', title: 'Society of Mind and modular AI architectures',
    description: 'Modular systems where specialist sub-agents collaborate vs monolithic large models. Minimum per-agent capability for useful contribution? Routing and orchestration overhead?',
    keywords: ['society of mind', 'modular AI', 'specialist agents', 'mixture of agents'], arxivCats: ['cs.AI','cs.MA'],
    testable: false },

  { id: 'multi-003', division: 'multiagent', title: 'Agent communication protocols — structured vs natural language',
    description: 'What communication formats (JSON, NL, blackboard) work best for local agent swarms? Latency, reliability, and interpretability tradeoffs?',
    keywords: ['agent communication', 'A2A protocol', 'blackboard system', 'inter-agent'], arxivCats: ['cs.MA','cs.AI'],
    testable: false },

  // ══════════════════════════════════════════════════
  // DIVISION 6: LOCAL DEPLOYMENT
  // What actually runs on consumer hardware
  // ══════════════════════════════════════════════════

  { id: 'local-001', division: 'local_deployment', title: 'llama.cpp — state of CPU inference',
    description: 'What models run well via llama.cpp on CPU with 16GB RAM? Realistic tok/s speeds by quantization level? GPU layer offloading with 4GB VRAM on llama.cpp?',
    keywords: ['llama.cpp', 'CPU inference', 'quantized inference', 'consumer LLM'], arxivCats: ['cs.LG','cs.PF'],
    testable: true, testClaim: 'Llama 3.2 3B Q4_K_M runs at >10 tok/s on i7 CPU with 16GB RAM', claimType: 'inference_speed' },

  { id: 'local-002', division: 'local_deployment', title: 'Ollama — practical local model serving',
    description: 'How does Ollama simplify local model deployment? Model library, API surface, performance vs raw llama.cpp? Resource use for simultaneous model serving?',
    keywords: ['Ollama', 'local model serving', 'personal AI', 'model management'], arxivCats: ['cs.LG'],
    testable: true, testClaim: 'Ollama serves 7B model with <4s first-token latency on 16GB RAM', claimType: 'inference_speed' },

  { id: 'local-003', division: 'local_deployment', title: 'GPU offloading — GTX 1050 4GB + 16GB RAM hybrid',
    description: 'When is partial GPU offloading on a 4GB VRAM GPU beneficial vs pure CPU? How many layers can be offloaded? What is the practical speed gain for 7B models?',
    keywords: ['GPU offloading', 'hybrid inference', 'VRAM constraint', 'partial GPU'], arxivCats: ['cs.LG','cs.AR'],
    testable: true, testClaim: 'Offloading 10 layers to GTX 1050 4GB meaningfully improves 7B inference speed vs CPU-only', claimType: 'inference_speed' },

  { id: 'local-004', division: 'local_deployment', title: 'HDD vs SSD — storage impact on model loading',
    description: 'How much does HDD vs SSD storage affect LLM cold-load times? For a 4GB GGUF model, what is the load time difference? Does memory-mapped loading help on HDD?',
    keywords: ['model loading', 'HDD inference', 'mmap', 'storage bottleneck', 'cold start'], arxivCats: ['cs.PF','cs.AR'],
    testable: true, testClaim: 'HDD storage causes 3-5× longer model cold-load time vs SSD for GGUF models', claimType: 'inference_speed' },

  { id: 'local-005', division: 'local_deployment', title: 'Power and thermal limits for continuous local AI on laptop',
    description: 'Power draw and thermal implications of continuous LLM inference on a laptop. Throttling effects. Sustainable inference rate for an always-on local AI agent.',
    keywords: ['power consumption', 'thermal throttling', 'laptop inference', 'TDP', 'sustainable AI'], arxivCats: ['cs.PF','cs.AR'],
    testable: false },

  // ══════════════════════════════════════════════════
  // DIVISION 7: VISION MODELS
  // Local multimodal — vision
  // ══════════════════════════════════════════════════

  { id: 'vision-001', division: 'vision', title: 'LLaVA series — open vision-language models',
    description: 'Survey LLaVA 1.0 through LLaVA-NeXT. Architecture, training, benchmark performance. Smallest viable LLaVA for useful vision understanding on 16GB RAM?',
    keywords: ['LLaVA', 'vision language model', 'VLM', 'multimodal LLM'], arxivCats: ['cs.CV','cs.CL'],
    testable: true, testClaim: 'LLaVA 1.6 7B runs inference on 16GB RAM with GPU offloading', claimType: 'memory_usage' },

  { id: 'vision-002', division: 'vision', title: 'Moondream and MiniCPM-V — sub-3B vision models',
    description: 'Survey Moondream (1-2B) and MiniCPM-V. How much vision capability survives at tiny scale? What tasks are feasible? Real-world use on CPU-only machines?',
    keywords: ['Moondream', 'MiniCPM-V', 'tiny VLM', 'efficient vision LLM'], arxivCats: ['cs.CV','cs.CL'],
    testable: true, testClaim: 'Moondream 2B provides useful image description on CPU with 8GB RAM', claimType: 'model_capability' },

  { id: 'vision-003', division: 'vision', title: 'Phi-3-vision and PaliGemma — vision designed for constrained hardware',
    description: 'How do Phi-3-vision and PaliGemma achieve good vision-language performance at small scale? Architecture choices that enable efficiency? Benchmark comparisons?',
    keywords: ['Phi-3-vision', 'PaliGemma', 'efficient VLM', 'small multimodal'], arxivCats: ['cs.CV','cs.CL'],
    testable: true, testClaim: 'Phi-3-vision scores competitively on VQA benchmarks at 4B parameters', claimType: 'benchmark_score' },

  { id: 'vision-004', division: 'vision', title: 'Vision encoders — CLIP, SigLIP, and variants for local use',
    description: 'How do vision encoders (CLIP, SigLIP, DINOv2) work as the visual frontend for VLMs? What encoder size is needed for useful performance? Can encoders run CPU-only?',
    keywords: ['CLIP', 'SigLIP', 'vision encoder', 'DINOv2', 'image embedding'], arxivCats: ['cs.CV','cs.LG'],
    testable: false },

  // ══════════════════════════════════════════════════
  // DIVISION 8: VOICE MODELS
  // Local multimodal — audio
  // ══════════════════════════════════════════════════

  { id: 'voice-001', division: 'voice', title: 'Whisper and Whisper.cpp — speech recognition on CPU',
    description: 'Survey Whisper model family. How does whisper.cpp C++ port achieve efficient CPU inference? What size model gives best quality/speed tradeoff on i7 CPU?',
    keywords: ['Whisper', 'whisper.cpp', 'speech recognition', 'ASR', 'CPU audio'], arxivCats: ['eess.AS','cs.CL'],
    testable: true, testClaim: 'Whisper.cpp small model runs real-time speech recognition on i7 CPU', claimType: 'inference_speed' },

  { id: 'voice-002', division: 'voice', title: 'Moonshine — faster-than-Whisper ASR',
    description: 'How does Moonshine achieve better speed than Whisper at similar quality? Architecture differences? Is it suitable for local CPU deployment on consumer hardware?',
    keywords: ['Moonshine', 'ASR', 'fast speech recognition', 'efficient audio model'], arxivCats: ['eess.AS','cs.LG'],
    testable: true, testClaim: 'Moonshine runs 5× faster than Whisper base on CPU with comparable WER', claimType: 'inference_speed' },

  { id: 'voice-003', division: 'voice', title: 'Local text-to-speech — XTTS, Piper, and Kokoro',
    description: 'Survey local TTS options (XTTS-v2, Piper, Kokoro). Quality, latency, and RAM requirements. Which provides best voice output for a local AI agent on 16GB RAM?',
    keywords: ['XTTS', 'Piper TTS', 'Kokoro', 'local TTS', 'text to speech'], arxivCats: ['eess.AS','cs.CL'],
    testable: true, testClaim: 'Piper TTS achieves real-time synthesis on CPU with natural voice quality', claimType: 'inference_speed' },

  { id: 'voice-004', division: 'voice', title: 'End-to-end voice pipeline — STT + LLM + TTS on 16GB RAM',
    description: 'Can a full voice pipeline (whisper.cpp → 7B LLM → Piper TTS) run simultaneously in 16GB RAM? RAM budget analysis. Latency from speech-in to speech-out?',
    keywords: ['voice pipeline', 'STT LLM TTS', 'voice agent', 'end to end audio'], arxivCats: ['eess.AS','cs.CL','cs.AI'],
    testable: true, testClaim: 'Full STT+7B LLM+TTS pipeline fits in 16GB RAM with acceptable latency', claimType: 'pipeline' },

  // ══════════════════════════════════════════════════
  // DIVISION 9: AGI BENCHMARKS & DEFINITIONS
  // ══════════════════════════════════════════════════

  { id: 'bench-001', division: 'benchmarks', title: 'AGI definitions — measurable criteria',
    description: 'Leading academic definitions of AGI. Which are measurable with current benchmarks? What would a local-machine AGI demonstrably need to do?',
    keywords: ['AGI definition', 'general intelligence', 'AGI criteria', 'Chollet'], arxivCats: ['cs.AI'],
    testable: false },

  { id: 'bench-002', division: 'benchmarks', title: 'ARC-AGI benchmark — abstract reasoning evaluation',
    description: 'What does ARC-AGI measure? Which small models score well? What techniques (test-time compute, program synthesis) improve ARC scores without massive models?',
    keywords: ['ARC-AGI', 'abstract reasoning', 'ARC benchmark', 'compositional reasoning'], arxivCats: ['cs.AI','cs.LG'],
    testable: true, testClaim: 'ARC-AGI scores correlate with genuine novel reasoning better than MMLU', claimType: 'benchmark_score' },

  { id: 'bench-003', division: 'benchmarks', title: 'MMLU, GSM8K, HumanEval — small model performance survey',
    description: 'Compile performance data for sub-7B models on MMLU, GSM8K, HumanEval. Which models punch above weight? What training approaches explain this?',
    keywords: ['MMLU', 'GSM8K', 'HumanEval', 'benchmark survey', 'small model eval'], arxivCats: ['cs.CL','cs.AI'],
    testable: false },

  { id: 'bench-004', division: 'benchmarks', title: 'Holistic multimodal AGI benchmarks',
    description: 'What benchmarks evaluate text+vision+voice together as a unified capability? MMMU, MMBench, and others — which small multimodal models score highest?',
    keywords: ['MMMU', 'MMBench', 'multimodal benchmark', 'VLM evaluation', 'holistic AGI'], arxivCats: ['cs.CV','cs.AI'],
    testable: false },

];

module.exports = { tasks };
