# CLAUDE.md - Velolume Project Instructions

## Project Overview

Velolume is a **Shared Data Engine** that converts video content into machine-readable data. The engine processes three data sources:

1. **Creator uploads** — Their content, personalized analysis
2. **Brand uploads** — Product catalogs, brand guidelines
3. **Public scraping** — Top-performing content for category benchmarks

The engine powers:
- **Content Intelligence** — "What's working?", "Why did this work?"
- **AI-Assisted Creation** — Generate hooks, scripts, product content for creators AND brands
- **AI Discoverability** — Make content/products discoverable by ChatGPT, Perplexity, AI shopping agents
- **Revenue Generation** — Auto-detect products, generate affiliate links, brand matching

## Core Principles

### 1. Everything is a Claim with Evidence
Never store raw values. Every extracted data point is a `Claim<T>`:
```typescript
interface Claim<T> {
  value: T;
  confidence: number;        // 0-100
  evidence: Evidence[];      // What supports this claim
  source: ClaimSource;       // 'auto' | 'creator_confirmed' | 'brand_verified'
  modelVersion: string;
  extractedAt: Date;
}
```

### 2. Progressive Extraction
Don't treat all content equally:
- **Quick scan** first (cheap models)
- **Deep extraction** only when products detected or high-value content
- Track cost per video

### 3. Verification Tiers
Trust pyramid for product matches:
- `auto` — AI detected, not verified
- `creator_confirmed` — Creator approved
- `brand_verified` — Brand confirmed
- `disputed` — Under review

### 4. One Engine, Two Interfaces
Creators and brands share the same data engine. Different UI, same underlying data.

## Project Structure

```
/velolume
├── /docs
│   ├── PROJECT_STATE.md    # Current status (read this first!)
│   └── CLAUDE.md           # This file
├── /lib
│   ├── /ai                 # LLM integrations
│   ├── /matching           # Product matching pipeline
│   ├── /affiliate          # Affiliate link generation
│   ├── /google-shopping    # Google Shopping API
│   └── /extraction         # Content extraction (TO BUILD)
├── /src
│   └── /types              # TypeScript type definitions (TO INTEGRATE)
└── /scripts                # Test scripts
```

## Type Definitions

New type definitions are in `/velolume-engine/src/types/`. These define the target data model:

- `core.ts` — Claim<T>, Evidence, foundational types
- `entity.ts` — Creator/Brand profiles, ContentPatterns
- `content.ts` — Content extraction schema, ProductMention
- `product.ts` — CanonicalProduct, CategorySchema, matching
- `machine-readable.ts` — llms.txt, discovery.json, Schema.org

**Import from these when building new features.**

## Current Build Priority

### Phase 1: Extraction Engine (THIS WEEK)
1. Integrate new type definitions into existing code
2. Add evidence capture to product detection
3. Hook extraction + effectiveness scoring
4. Format classification
5. Test on 20+ videos across 5 niches (user uploads + public scrapes)

### Phase 2: Intelligence Layer (NEXT WEEK)
1. ContentPatterns aggregation
2. Category benchmarks from public data
3. "What's working" analysis
4. Gap detection (user vs category)

### Phase 3: Creator & Brand Studios
1. Creator: Upload → Analysis → Storefront → AI Generation
2. Brand: Upload catalog → Category intel → AI Content Studio

## Key Technical Decisions

| Decision | Implementation |
|----------|----------------|
| Product detection | GPT-4o for complex vision |
| Attribute extraction | Gemini Flash (cheaper, sufficient) |
| Product matching | Google Shopping API + visual verification |
| Affiliate links | Amazon (direct) → Involve Asia (SEA) → Skimlinks (fallback) |
| Transcription | Whisper |
| Database | PostgreSQL (Neon) |
| Storage | DigitalOcean Spaces (S3) |
| Queue | BullMQ + Redis |

## Testing Requirements

Before marking any extraction feature complete:
1. Test on minimum 5 videos
2. Test across at least 3 niches
3. Log accuracy metrics
4. Document failure cases

## Code Style

- TypeScript strict mode
- Use Claim<T> wrapper for all extracted values
- Include evidence with every claim
- Track model version and extraction cost
- Handle errors gracefully, never crash on bad input

## How to Start

1. Read `/docs/PROJECT_STATE.md` for current status
2. Check what's in progress vs completed
3. Look at existing code in `/lib/` before writing new code
4. Use types from `/velolume-engine/src/types/`
5. Test thoroughly before marking complete

## Updating Project State

At the end of each session:
```
Update /docs/PROJECT_STATE.md with:
- What was completed
- Decisions made
- What's next
- Any blockers
```
