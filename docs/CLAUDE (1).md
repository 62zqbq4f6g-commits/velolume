# CLAUDE.md — Velolume Project Instructions

**Read this file first when starting any session.**

---

## What Is Velolume?

Velolume is a **Content Context Graph** — a system that extracts intelligence from creator/brand video content to help them understand what works, why it works, and what to create next.

### The Core Concept: Context Graph

We don't just extract data. We build a graph that captures:
- **Entities:** Creators, Brands, Content, Products
- **Relationships:** Who creates what, what features which products
- **Context:** Why content performs (performance correlation, patterns, benchmarks)
- **Decision Traces:** When recommendations lead to outcomes, we capture that for learning

This is based on the Context Graph research from Glean and Foundation Capital:
> "You can't reliably capture the why; you can capture the how. By capturing enough 'how', you can infer the 'why' over time."

---

## What Has Been Built

### ✅ Working Components

| Component | File | What It Does |
|-----------|------|--------------|
| Product Detection v2.1 | `/lib/ai/processor.ts` | Detects 5-15 products per video with evidence |
| Product Matching v2.1 | `/lib/matching/product-matcher.ts` | Matches to real products via Google Shopping |
| Hook Extraction v1.0 | `/lib/extraction/hook-extractor.ts` | Classifies hooks, scores effectiveness |
| Type System | `/lib/types/product-claims.ts` | Claim<T>, Evidence, VerificationTier |
| Affiliate Integration | `/lib/affiliate/` | Amazon, Skimlinks, Involve Asia |
| Video Scraping | Uses yt-dlp | TikTok, Instagram, YouTube |

### ✅ Validated Results

- 11 real videos tested
- 100% download success
- 68 products detected (avg 6.2/video)
- Hook extraction working on short-form

---

## Core Principles

### 1. Everything is a Claim with Evidence

Never store raw values. Every extracted data point uses:

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

### 2. Capture the "How" to Infer the "Why"

We capture:
- What's in the content (products, hooks, format)
- How it performed (views, engagement)
- Patterns across content (what works for this creator/category)

This lets us infer WHY things work.

### 3. Decision Traces for Learning

When we recommend something → creator implements → outcome occurs:
```
Trace: {
  recommendation: "Use controversy hook",
  action: "Creator used controversy hook",
  outcome: "2.3x engagement vs baseline",
  learning: "Increase weight for controversy hooks for this creator"
}
```

### 4. Verification Tiers

Trust pyramid for data:
- `auto` — AI detected, not verified
- `auto_high` — AI detected with 85%+ confidence
- `creator_confirmed` — Creator approved
- `brand_verified` — Brand confirmed
- `disputed` — Under review

---

## Current Priority: Build UI

The extraction backend is built. Now we need to SEE it working.

### Immediate Task

Build a simple UI where a user can:
1. Paste a video URL (TikTok, Instagram, YouTube)
2. Click "Analyze"
3. See results:
   - Products detected (with thumbnails, confidence)
   - Hook analysis (type, effectiveness, transcript)
   - Engagement metrics (views, likes, comments)

### Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL (Neon)
- DigitalOcean Spaces (S3)

---

## File Structure

```
/velolume
├── /docs
│   ├── PROJECT_STATE.md      # Current status
│   ├── CLAUDE.md             # This file
│   ├── PRODUCT_VISION.md     # Strategic vision
│   ├── PRD_v1.md             # MVP requirements
│   └── MIGRATION_CONTEXT.md  # Full context
├── /lib
│   ├── /ai
│   │   └── processor.ts      # Product detection
│   ├── /extraction
│   │   └── hook-extractor.ts # Hook extraction
│   ├── /matching
│   │   └── product-matcher.ts
│   ├── /affiliate
│   │   └── index.ts
│   ├── /google-shopping
│   │   └── index.ts
│   ├── /scraper
│   │   └── video-scraper.ts
│   └── /types
│       └── product-claims.ts
├── /scripts
│   └── [test scripts]
├── /app                      # Next.js pages (to build)
└── /components               # React components (to build)
```

---

## Environment Variables

Required in Replit Secrets:

```
OPENAI_API_KEY=
SERPAPI_KEY=
DATABASE_URL=
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_BUCKET=
DO_SPACES_REGION=
DO_SPACES_ENDPOINT=
REDIS_URL=
```

---

## How to Start a Session

1. Read `/docs/PROJECT_STATE.md` for current status
2. Check what's in progress vs completed
3. Read `/docs/PRD_v1.md` for MVP requirements
4. Ask for the specific task if not clear

## How to End a Session

Update `/docs/PROJECT_STATE.md` with:
- What was completed
- Decisions made
- What's next
- Any blockers

---

## Key Documents

| Document | Purpose | When to Read |
|----------|---------|--------------|
| PROJECT_STATE.md | Current build status | Every session start |
| CLAUDE.md | This file | Every session start |
| PRD_v1.md | MVP requirements | When building features |
| PRODUCT_VISION.md | Strategic context | When making architecture decisions |
| MIGRATION_CONTEXT.md | Full technical context | When you need deep background |

---

## What NOT to Do

- ❌ Don't rebuild extraction from scratch — it's working
- ❌ Don't change the Claim<T> structure — it's validated
- ❌ Don't skip evidence capture — it's core to the architecture
- ❌ Don't use mock data — we need real validation
- ❌ Don't build features not in the PRD without discussion

---

## What TO Do

- ✅ Build UI to visualize extraction results
- ✅ Add engagement scraping to video pipeline
- ✅ Maintain evidence-backed claims
- ✅ Test on real videos
- ✅ Update PROJECT_STATE.md after each session
