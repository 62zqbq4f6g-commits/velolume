# Multi-LLM Architecture Research

**Date:** 2026-01-06
**Purpose:** Comprehensive evaluation of ALL viable models for video extraction (~75 data points per product)

---

## 1. Current Pipeline Analysis

### Current Architecture
```
Video → Frame Extraction (12 frames)
     → Whisper-1 (audio transcription)
     → GPT-4o Vision (product detection, ~5-15 products)
           ↓
For each product:
     → GPT-4o Vision (multi-frame attribute extraction, 3-4 frames)
     → Google Shopping API (candidate generation)
     → GPT-4o Vision (candidate attribute extraction)
     → GPT-4o Vision (visual tiebreaker, conditional)
           ↓
     → GPT-4o-mini (SEO generation)
```

### Current Model Usage Per Video
| Stage | Model | Calls | Input Tokens (est.) | Output Tokens (est.) |
|-------|-------|-------|---------------------|----------------------|
| Transcription | Whisper-1 | 1 | N/A (audio) | ~200 |
| Product Detection | GPT-4o | 1 | ~50K (12 frames) | ~2K |
| Reference Extraction | GPT-4o | 10 products × 1 call | ~150K total | ~5K |
| Candidate Extraction | GPT-4o | 10 products × 10 candidates | ~200K total | ~10K |
| Visual Tiebreaker | GPT-4o | ~5 (conditional) | ~75K | ~1K |
| SEO Generation | GPT-4o-mini | 1 | ~2K | ~500 |

**Estimated Current Cost Per Video:** ~$15-25 (mostly GPT-4o vision calls)

---

## 2. Comprehensive Model Comparison

### 2.1 Frontier Models (Premium Vision)

#### GPT-4o (OpenAI)
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $5.00 / 1M tokens |
| **Output Cost** | $15.00 / 1M tokens (reduced from $20) |
| **Vision Quality** | Excellent - industry leading |
| **Context Window** | 128K tokens |
| **Multi-Image** | Up to 50 images per request |
| **Image Tokens** | Low: 85 tokens, High: up to 1,100 tokens |
| **JSON Output** | Native structured outputs - best in class |
| **Speed** | Fast (~50-100 tokens/sec) |
| **Best For** | Complex multi-frame analysis, product detection |

**Image Cost Examples:**
- Low-detail image: 85 tokens × $5/1M = **$0.000425/image**
- High-detail image: ~1,100 tokens × $5/1M = **$0.0055/image**

---

#### Claude 3.5 Sonnet (Anthropic)
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $3.00 / 1M tokens |
| **Output Cost** | $15.00 / 1M tokens |
| **Vision Quality** | Excellent - matches GPT-4o |
| **Context Window** | 200K tokens |
| **Multi-Image** | Up to 20 images per request |
| **Image Tokens** | ~1,600 tokens for max-sized image (1568×1568) |
| **JSON Output** | Via "tool call" trick - reliable but requires workaround |
| **Speed** | Fast |
| **Best For** | Visual reasoning, charts, diagrams, code screenshots |

**Image Token Formula:** `tokens = (width × height) / 750`

**Cost per 1,000 max-sized images:** ~$4.80

---

#### Gemini 1.5 Pro (Google)
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $1.25 / 1M tokens (64% reduction Oct 2024) |
| **Output Cost** | $5.00 / 1M tokens |
| **Vision Quality** | Very Good |
| **Context Window** | 1M tokens (best in class) |
| **Multi-Image** | Excellent multi-image support |
| **JSON Output** | Native via genai.protos.Schema - less intuitive API |
| **Speed** | Fast |
| **Best For** | Long video understanding, bulk image processing |

**Note:** Being superseded by Gemini 2.5 series in 2025.

---

#### Grok-2 Vision (xAI)
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $2.00 / 1M tokens |
| **Output Cost** | $10.00 / 1M tokens |
| **Vision Quality** | Good |
| **Context Window** | 32K tokens |
| **Multi-Image** | Yes |
| **JSON Output** | Supports function calling |
| **Speed** | Fast |
| **Best For** | Multilingual content, general vision tasks |

**Note:** 75% discount for exact-match prompts (cacheable).

---

### 2.2 Fast/Cheap Models (Budget Vision)

#### GPT-4o-mini (OpenAI)
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $0.15 / 1M tokens |
| **Output Cost** | $0.60 / 1M tokens |
| **Vision Quality** | Good (88% accuracy) |
| **Context Window** | 128K tokens |
| **JSON Output** | Excellent - same as GPT-4o |
| **Speed** | Very Fast |

**CRITICAL WARNING - Vision Token Quirk:**
- GPT-4o-mini uses **2,833 tokens per image** in low-res mode (vs 85 for GPT-4o)
- This makes GPT-4o-mini **MORE EXPENSIVE than GPT-4o for image-heavy workloads**
- For 100 candidate images: GPT-4o-mini = $0.042 vs GPT-4o = $0.042 (similar!)

**Best For:** Text-only tasks, SEO generation, NOT bulk image processing

---

#### Claude 3.5 Haiku (Anthropic)
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $0.80 / 1M tokens |
| **Output Cost** | $4.00 / 1M tokens |
| **Vision Quality** | Good |
| **Context Window** | 200K tokens |
| **JSON Output** | Reliable via tool calls |
| **Speed** | Very Fast |
| **Best For** | Fast image classification, simple extraction |

**Note:** Claude 3 Haiku (older) is even cheaper at $0.25/$1.25 but less capable.

---

#### Gemini 1.5 Flash (Google)
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $0.075 / 1M tokens |
| **Output Cost** | $0.30 / 1M tokens |
| **Vision Quality** | Good (85% accuracy) |
| **Context Window** | 1M tokens |
| **JSON Output** | Good with structured outputs |
| **Speed** | Very Fast |
| **Best For** | High-volume image processing, bulk extraction |

**Cost Example:** 100 images × 1,000 tokens × $0.075/1M = **$0.0075 total**

---

#### Gemini 2.0 Flash (Google)
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $0.10 / 1M tokens |
| **Output Cost** | $0.40 / 1M tokens |
| **Vision Quality** | Great - improved over 1.5 Flash |
| **Context Window** | 1M tokens |
| **JSON Output** | Good |
| **Speed** | Very Fast |
| **Best For** | Balance of quality and cost |

**Note:** Facing deprecation, migrating to 2.5 pricing.

---

#### Gemini 2.5 Flash (Google) - Current
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $0.15 / 1M (non-thinking) → $0.30 / 1M (unified) |
| **Output Cost** | $0.60 / 1M (non-thinking) → $2.50 / 1M (unified) |
| **Vision Quality** | Great |
| **Context Window** | 1M tokens |
| **JSON Output** | Excellent - 49% faster with structured outputs |
| **Speed** | Very Fast |

**Note:** Google unified pricing - non-thinking now costs same as thinking mode.

---

#### Gemini 2.5 Flash-Lite (Google) - Best Budget Option
| Attribute | Value |
|-----------|-------|
| **Input Cost** | $0.10 / 1M tokens |
| **Output Cost** | $0.40 / 1M tokens |
| **Vision Quality** | Good (7-17% lower than Flash on benchmarks) |
| **Context Window** | 1M tokens |
| **JSON Output** | 100% correctness in benchmarks |
| **Speed** | Fastest |
| **Best For** | High-volume, latency-sensitive tasks |

---

### 2.3 Specialized Models

#### Qwen2.5-VL (Alibaba)
| Attribute | Value |
|-----------|-------|
| **API Pricing** | Via Alibaba Cloud Model Studio (tiered) |
| **Vision Quality** | Excellent - matches GPT-4o on benchmarks |
| **Context Window** | Up to 32K (model dependent) |
| **Special Strengths** | Product recognition, celebrity ID, landmarks, Asian content |
| **Open Source** | Yes (Apache 2.0) |
| **Self-Hosted** | Yes - 3B, 7B, 72B versions |

**Key Capabilities:**
- "Recognize everything" - products, celebrities, anime, landmarks, flora/fauna
- VQAv2 benchmark: ~82% accuracy
- Omnidocument parsing (multilingual, handwritten, tables, charts)
- Precision object grounding with coordinates
- Ultra-long video comprehension (multi-hour)

**Best For:** Product/fashion recognition, Asian e-commerce content

---

#### DeepSeek-VL2 (DeepSeek)
| Attribute | Value |
|-----------|-------|
| **API Pricing** | ~$0.028 / 1M input tokens (V3.2-Exp reference) |
| **Vision Quality** | Good |
| **Open Source** | Yes (DeepSeek License - commercial OK) |
| **Variants** | VL2-tiny, VL2-small, VL2 |
| **Best For** | Cost-sensitive deployments, batch processing |

**Note:** Extremely cheap, good for high-volume classification tasks.

---

#### Llama 3.2 Vision (Meta)
| Attribute | Value |
|-----------|-------|
| **API Pricing** | 11B: ~$0.049/1K tokens, 90B: ~$2.04/1M tokens |
| **Vision Quality** | Good |
| **Sizes** | 11B (consumer GPU), 90B (enterprise) |
| **Context Window** | 128K tokens |
| **Image Support** | 1120×1120 max |
| **Languages** | 8 languages including Thai |
| **Open Source** | Yes (but EU restrictions on multimodal) |

**Key Capabilities:**
- Document understanding (charts, graphs)
- Image captioning
- Visual grounding
- Visual question answering

**Best For:** Self-hosted deployments, on-device processing

---

#### Yi-VL (01.AI)
| Attribute | Value |
|-----------|-------|
| **API Pricing** | Via 01.AI platform (flexible pricing) |
| **Vision Quality** | Good (VQAv2: ~82%) |
| **Open Source** | Yes (Apache 2.0) |
| **Sizes** | 6B, 34B versions |
| **Best For** | Asian content, self-hosted deployments |

---

## 3. Benchmark Comparisons

### 3.1 Vision Quality (MMMU Multimodal Understanding)

| Model | MMMU Score | Notes |
|-------|------------|-------|
| GPT-5.1 | 84.2% | Leader |
| Gemini 3 Pro | ~83% | Close second |
| Claude 4.5 Sonnet | 77.8% | Strong practical image analysis |
| GPT-4o | ~75% | Excellent for products |
| Qwen2.5-VL-72B | ~75% | Matches GPT-4o |
| Claude 3.5 Sonnet | ~73% | Very good |
| Gemini 1.5 Pro | ~70% | Good |

### 3.2 Structured JSON Output Reliability

| Model | JSON Reliability | Notes |
|-------|-----------------|-------|
| OpenAI (GPT-4o/mini) | **Best** | Native structured outputs API |
| Gemini 2.5 Flash-Lite | **Excellent** | 100% correctness in benchmarks |
| Gemini 2.5 Flash | **Excellent** | 49% faster with structured |
| Claude 3.5 Sonnet | **Good** | Requires "tool call" workaround |
| Gemini 1.5 Pro | **Adequate** | Cumbersome genai.protos.Schema API |
| DeepSeek V3.2 | **Good** | Reliable for complex structures |

### 3.3 Speed Comparison

| Model | Est. Tokens/Sec | Latency |
|-------|-----------------|---------|
| Gemini 2.5 Flash-Lite | 150+ | Sub-second |
| Gemini 2.5 Flash | 120+ | Sub-second |
| GPT-4o-mini | 100+ | Fast |
| Claude 3.5 Haiku | 100+ | Fast |
| GPT-4o | 50-80 | Fast |
| Claude 3.5 Sonnet | 50-80 | Fast |
| Gemini 1.5 Pro | 50-80 | Fast |

---

## 4. Cost Analysis by Use Case

### 4.1 Per-Video Cost Estimates (10 products, 100 candidates)

| Strategy | Complex Vision | Candidate Extraction | Text Tasks | **Total** |
|----------|---------------|---------------------|------------|-----------|
| Current (GPT-4o all) | $7.50 | $10.00 | $0.05 | **$17.55** |
| GPT-4o + GPT-4o-mini | $7.50 | $4.20* | $0.02 | **$11.72** |
| GPT-4o + Gemini Flash | $7.50 | $0.10 | $0.02 | **$7.62** |
| Claude Sonnet + Flash | $4.50 | $0.10 | $0.02 | **$4.62** |
| Gemini Pro + Flash-Lite | $1.50 | $0.05 | $0.01 | **$1.56** |
| Qwen2.5-VL (self-hosted) | GPU cost | GPU cost | GPU cost | **~$0.50** |

*GPT-4o-mini vision token quirk makes it nearly as expensive as GPT-4o for images

### 4.2 Annual Cost Projections (1,000 videos/month)

| Strategy | Cost/Video | Monthly | Annual | Savings |
|----------|------------|---------|--------|---------|
| Current | $17.55 | $17,550 | $210,600 | Baseline |
| Tiered (GPT-4o + Flash) | $7.62 | $7,620 | $91,440 | **57%** |
| Multi-provider (Sonnet + Flash) | $4.62 | $4,620 | $55,440 | **74%** |
| Aggressive (Gemini all) | $1.56 | $1,560 | $18,720 | **91%** |
| Self-hosted (Qwen2.5-VL) | $0.50 | $500 | $6,000 | **97%** |

---

## 5. Recommendations

### 5.1 Immediate Recommendation: Gemini Flash for Candidates

**Key Finding:** GPT-4o-mini's vision token quirk makes it unsuitable for bulk image processing. Gemini 1.5 Flash is 100x cheaper for the same task.

```typescript
// RECOMMENDED: Use Gemini Flash for candidate extraction
const MODEL_BY_TASK = {
  productDetection: "gpt-4o",           // Keep premium for critical task
  referenceExtraction: "gpt-4o",        // Keep premium for accuracy
  visualTiebreaker: "gpt-4o",           // Keep premium for final decision
  candidateExtraction: "gemini-1.5-flash", // 100x cheaper than GPT-4o-mini for images!
  seoGeneration: "gpt-4o-mini",         // Text-only, mini is fine
  searchQueryGen: "gpt-4o-mini",        // Text-only, mini is fine
};
```

**Estimated Savings:** $10/video → **$130,000/year** at 1,000 videos/month

### 5.2 Future Consideration: Qwen2.5-VL for Products

Qwen2.5-VL has excellent product recognition capabilities and is open source. Consider:

1. **Phase 1:** Add Gemini Flash for candidates (immediate)
2. **Phase 2:** Benchmark Qwen2.5-VL-7B on 100 products
3. **Phase 3:** If quality matches, self-host for 90%+ cost reduction

### 5.3 Not Recommended

| Model | Reason |
|-------|--------|
| GPT-4o-mini for images | Vision tokens 33x higher than GPT-4o |
| Gemini 2.5 Flash | Price increase from unified pricing |
| Grok-2 Vision | No clear advantage over alternatives |
| Yi-VL | Limited documentation, uncertain support |

---

## 6. Implementation Plan

### Phase 1: Gemini Flash Integration (Immediate)
1. Add Google AI SDK to project
2. Create `extractWithGemini()` wrapper function
3. Route `candidateExtraction` to Gemini Flash
4. Benchmark quality on 50 products
5. Monitor cost savings

### Phase 2: Caching Layer (Week 2)
1. Implement attribute cache by image URL hash
2. Skip extraction for known products
3. Estimated 30-50% cache hit rate after warmup

### Phase 3: Qwen2.5-VL Evaluation (Month 2)
1. Deploy Qwen2.5-VL-7B on RunPod/Modal
2. Benchmark on product recognition task
3. Compare accuracy to GPT-4o baseline
4. If viable, migrate reference extraction

---

## 7. Model-Specific Notes

### JSON Schema Compatibility

```typescript
// OpenAI - Best JSON support
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  // or use structured outputs with Zod schema
});

// Gemini - Native schema support
const result = await model.generateContent({
  contents: [{ role: "user", parts }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

// Claude - Tool call workaround
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  tools: [{ name: "extract", input_schema: schema }],
  tool_choice: { type: "tool", name: "extract" },
});
```

### Multi-Image Limits

| Model | Max Images/Request | Recommended |
|-------|-------------------|-------------|
| GPT-4o | 50 | 20 |
| Claude 3.5 Sonnet | 20 | 10 |
| Gemini 1.5 Flash | 100+ | 50 |
| Qwen2.5-VL | Model dependent | 10 |

---

## 8. Sources

### Pricing Documentation
- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [Anthropic Claude Pricing](https://docs.claude.com/en/docs/build-with-claude/vision)
- [Google Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [xAI Grok Models & Pricing](https://docs.x.ai/docs/models)
- [DeepSeek API Pricing](https://api-docs.deepseek.com/quick_start/pricing)

### Model Documentation
- [Qwen2.5-VL Technical Report](https://arxiv.org/abs/2502.13923)
- [Llama 3.2 Vision Capabilities](https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/)
- [Claude Vision Guide](https://docs.claude.com/en/docs/build-with-claude/vision)

### Benchmarks & Comparisons
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/leaderboards/models)
- [LLM API Pricing Comparison 2025](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)
- [Structured Output Comparison](https://medium.com/@rosgluk/structured-output-comparison-across-popular-llm-providers-openai-gemini-anthropic-mistral-and-1a5d42fa612a)
- [Vellum LLM Leaderboard](https://www.vellum.ai/llm-leaderboard)

---

## Appendix: Token Calculations

### Image Token Costs by Provider

| Provider | Model | Low-Detail | High-Detail | Formula |
|----------|-------|------------|-------------|---------|
| OpenAI | GPT-4o | 85 tokens | 85 + 170/tile | tiles = ceil(w/512) × ceil(h/512) |
| OpenAI | GPT-4o-mini | 2,833 tokens | Variable | Much higher than GPT-4o! |
| Anthropic | Claude | N/A | (w×h)/750 | Max 1,600 tokens |
| Google | Gemini | ~258 tokens | Variable | Depends on resolution |

### Cost Per 100 Images (1024×1024, high detail)

| Model | Tokens/Image | Input Cost | Total |
|-------|-------------|------------|-------|
| GPT-4o | 765 | $5/1M | $0.38 |
| GPT-4o-mini | 2,833+ | $0.15/1M | $0.42 |
| Claude 3.5 Sonnet | 1,398 | $3/1M | $0.42 |
| Gemini 1.5 Flash | ~500 | $0.075/1M | $0.004 |
| Gemini 2.5 Flash-Lite | ~500 | $0.10/1M | $0.005 |

**Winner for bulk image processing: Gemini 1.5 Flash (100x cheaper)**
