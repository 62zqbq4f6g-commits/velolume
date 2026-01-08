# CLAUDE.md — Velolume Project Instructions

**⚠️ READ THIS ENTIRE FILE BEFORE DOING ANYTHING**

---

## CRITICAL: MVP SCOPE

### Pages That Should Exist (ONLY THESE)

| Page | Route | Purpose |
|------|-------|---------|
| Homepage | `/` | URL input → Analyze button |
| Results | `/analyze/[id]` | Show extraction results |

### Pages That Should NOT Exist

- ❌ `/dashboard` — DELETE if exists
- ❌ `/store` — DELETE if exists
- ❌ `/settings` — DELETE if exists
- ❌ `/profile` — DELETE if exists
- ❌ Any other pages not listed above

### Before Building ANY Feature

1. Is it in `/docs/PRD.md`? → Build it
2. Not in PRD? → ASK before building
3. Feature removed from PRD? → DELETE the code

---

## What Is Velolume?

**One-liner:** Velolume is the machine-readable data hub for creators and brands — extracting intelligence from all content formats.

**We are NOT:**
- Just a video analyzer
- Just hooks analysis
- A dashboard/analytics tool
- A content factory

**We ARE:**
- A Content Context Graph
- Machine-readable data layer for the creator economy
- Intelligence that powers content creation

---

## The MVP Flow

```
User visits homepage
    ↓
Pastes video URL (TikTok/Instagram/YouTube)
    ↓
Clicks "Analyze"
    ↓
Processing happens (download, extract, analyze)
    ↓
Results page shows:
    - Video thumbnail
    - Engagement metrics (views, likes, comments)
    - Hook analysis (type, score 0-100, transcript)
    - Products detected (with confidence %)
    - Basic recommendations
```

**That's the MVP. Nothing more.**

---

## What Has Been Built (DO NOT REBUILD)

| Component | File | Status |
|-----------|------|--------|
| Product Detection v2.1 | `/lib/ai/processor.ts` | ✅ Working |
| Product Matching v2.1 | `/lib/matching/product-matcher.ts` | ✅ Working |
| Hook Extraction v1.0 | `/lib/extraction/hook-extractor.ts` | ✅ Working |
| Type System | `/lib/types/product-claims.ts` | ✅ Working |
| Affiliate Integration | `/lib/affiliate/` | ✅ Working |
| Video Scraping | `/lib/scraper/` | ✅ Working |

**The extraction backend is COMPLETE. Focus on UI.**

---

## Core Type System (DO NOT CHANGE)

```typescript
interface Claim<T> {
  value: T;
  confidence: number;        // 0-100
  evidence: Evidence[];      // What supports this claim
  source: ClaimSource;       // Verification tier
  modelVersion: string;
  extractedAt: Date;
}

type ClaimSource = 
  | 'auto'              // AI detected, <85% confidence
  | 'auto_high'         // AI detected, ≥85% confidence
  | 'creator_confirmed' // Creator approved
  | 'brand_verified'    // Brand confirmed
  | 'disputed';         // Under review
```

---

## UI Requirements

### Homepage (`/`)

```
┌─────────────────────────────────────────────────────┐
│                     [Logo]                          │
│                                                     │
│     Understand why your content works               │
│                                                     │
│  Extract intelligence from your videos to create    │
│  better content, faster                             │
│                                                     │
│  ┌─────────────────────────────────┐ ┌──────────┐  │
│  │ Paste your video URL...         │ │ Analyze  │  │
│  └─────────────────────────────────┘ └──────────┘  │
│                                                     │
│       🎵 TikTok    📷 Instagram    ▶️ YouTube       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Requirements:**
- Dark mode (#0a0a0f or similar dark background)
- Large, centered URL input
- Blue "Analyze" button (#3B82F6)
- Platform icons below input
- Clean, modern typography
- Minimal — no clutter

### Results Page (`/analyze/[id]`)

```
┌─────────────────────────────────────────────────────┐
│  ← Back                          [Platform] Video   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Video Thumbnail]    │  ENGAGEMENT                 │
│                       │  Views: 319.8K              │
│                       │  Likes: 24.1K               │
│                       │  Comments: 1.2K             │
│                       │  Shares: 892                │
├───────────────────────┴─────────────────────────────┤
│  HOOK ANALYSIS                        Score: 81/100 │
│  Type: [Listicle]                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ "best purchases in 2025"                     │   │
│  └─────────────────────────────────────────────┘   │
│  Clarity: 20/25  |  Pattern Interrupt: 16/25       │
│  Speed to Value: 22/25  |  Alignment: 23/25        │
├─────────────────────────────────────────────────────┤
│  PRODUCTS DETECTED (6)        [Add All to Store]   │
│  ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │  img   │ │  img   │ │  img   │ ...              │
│  │  92%   │ │  88%   │ │  76%   │                  │
│  │ Name   │ │ Name   │ │ Name   │                  │
│  └────────┘ └────────┘ └────────┘                  │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) |
| Video Download | yt-dlp |
| AI | OpenAI GPT-4o |
| Product Search | Google Shopping via SerpAPI |

---

## Environment Variables Required

```
OPENAI_API_KEY=
SERPAPI_KEY=
DATABASE_URL= (optional for MVP)
```

---

## Test Videos

Use these for testing:

```
TikTok: https://www.tiktok.com/@ryukkongee/video/7589728644025699591
Instagram: https://www.instagram.com/reel/DTLPmlajSQ5/
YouTube: https://www.youtube.com/watch?v=mzR4804FxFU
```

---

## What NOT To Do

- ❌ Don't rebuild extraction — it works
- ❌ Don't change Claim<T> structure — it's validated
- ❌ Don't build dashboard — not in MVP
- ❌ Don't build store pages — not in MVP
- ❌ Don't build user accounts — not in MVP
- ❌ Don't use mock data — use real extraction
- ❌ Don't add features not in PRD

---

## What TO Do

- ✅ Build clean homepage with URL input
- ✅ Build results page showing real extraction
- ✅ Connect UI to existing `/lib` extraction code
- ✅ Use dark mode, modern design
- ✅ Test with real video URLs
- ✅ Delete non-MVP pages if they exist

---

## Session Workflow

### Starting a Session

1. Read this file (CLAUDE.md)
2. Read `/docs/VELOLUME_COMPLETE_ONBOARDING.md` for full context
3. Check what exists vs what should exist
4. Delete anything not in MVP scope
5. Build what's missing

### Ending a Session

1. Test with a real video URL
2. Commit working code
3. Note any issues or next steps

---

## Key Documents

| Document | Purpose |
|----------|---------|
| CLAUDE.md | This file — read first |
| VELOLUME_COMPLETE_ONBOARDING.md | Full project context |
| PRD_v1.md | MVP requirements |
| PRODUCT_VISION.md | Strategic vision |

---

## Success Criteria

MVP is complete when:

- [ ] Homepage has URL input + Analyze button
- [ ] Analyze button triggers real extraction
- [ ] Results page shows real engagement metrics
- [ ] Results page shows real hook analysis
- [ ] Results page shows real products detected
- [ ] UI is dark mode and looks professional
- [ ] No dashboard or other non-MVP pages exist
