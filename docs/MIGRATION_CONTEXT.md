# VELOLUME MIGRATION CONTEXT
**Created:** January 8, 2026
**Purpose:** Complete technical context for continuing development in Replit

---

## Why This Document Exists

This project was built over multiple sessions with Claude Code in a local environment. This document captures EVERYTHING needed to continue seamlessly in Replit without losing context or regressing.

---

## Project Summary

**Velolume** is a Content Context Graph that:
1. Extracts intelligence from creator/brand video content
2. Correlates content patterns with performance
3. Provides recommendations on what to create
4. Generates content in the creator's style
5. Makes content discoverable to AI agents

---

## Architecture: Content Context Graph

### The Core Insight

Based on research from Glean and Foundation Capital on Context Graphs:

> "You can't reliably capture the why; you can capture the how. By capturing enough 'how', you can infer the 'why' over time."

Applied to content:
- **Knowledge Graph:** Creator → Posted → Video → Contains → Product (static relationships)
- **Context Graph:** Adds WHY — "This video performed because [hook + timing + trend + audience context]"

### Three Systems

1. **System of Record:** What exists (creators, content, products, relationships)
2. **System of Context:** Why it works (performance correlation, patterns, benchmarks)
3. **System of Action:** What to do (recommendations, generation, automation)

### Decision Traces

When we recommend → user acts → outcome occurs → we capture the trace:
```
{
  recommendation: "Use controversy hook",
  creatorAction: "Used controversy hook in video X",
  outcome: "2.3x engagement vs baseline",
  learning: "Increase weight for controversy hooks for this creator"
}
```

This creates a feedback loop for continuous improvement.

---

## What Has Been Built (Complete List)

### 1. Video Ingestion Pipeline

**Status:** ✅ Complete and validated

**Components:**
- Platform detection (TikTok, Instagram, YouTube, Xiaohongshu)
- Video download via yt-dlp
- Frame extraction (12 frames distributed across video)
- Dense frame extraction for hook window (first 3-5 seconds)
- Audio extraction
- Transcription via OpenAI Whisper

**Key Files:**
- `/lib/scraper/video-scraper.ts`
- Uses yt-dlp (installed via Homebrew/npm)

**Validation:**
- 11 real videos tested
- 100% download success rate
- All platforms working

---

### 2. Product Detection v2.1

**Status:** ✅ Complete and validated

**Capabilities:**
- Detects 5-15 products per video
- 80 category-specific attribute schemas
- Categories: clothing, footwear, accessories, jewelry, beauty, tech, home
- Evidence capture (frame index, timestamp, bounding box, transcript mention)

**Key Files:**
- `/lib/ai/processor.ts` — Main detection logic
- `/lib/types/product-claims.ts` — Type definitions

**Schema:**
```typescript
interface ProductData {
  name: string;
  category: string;
  brand?: string;
  attributes: Record<string, string>;
  searchTerms: string[];
  confidence: number;
  
  // Evidence (v2.1)
  timestamps?: number[];
  transcriptMentions?: TranscriptMention[];
  boundingBoxes?: BoundingBox[];
}
```

**Validation:**
- 68 products detected across 11 videos
- Average 6.2 products/video
- 92% average confidence for auto_high tier

---

### 3. Product Matching v2.1

**Status:** ✅ Complete and validated

**Capabilities:**
- Google Shopping search via SerpAPI
- Visual tiebreaker verification (GPT-4o)
- Category-specific matching schemas
- Deal-breaker logic (prevents wrong matches)
- Fuzzy matching for colors/materials

**Key Files:**
- `/lib/matching/product-matcher.ts`
- `/lib/google-shopping/index.ts`

**Verification Tiers:**
```typescript
type VerificationTier = 
  | 'auto'              // AI detected, <85% confidence
  | 'auto_high'         // AI detected, ≥85% confidence
  | 'creator_confirmed' // Creator approved
  | 'brand_verified'    // Brand confirmed
  | 'disputed';         // Under review
```

**Validation:**
- 100% matching accuracy on 10-product test
- Correct match in top 3 results for all tested products

---

### 4. Hook Extraction v1.0

**Status:** ✅ Complete and validated

**Capabilities:**
- Adaptive hook windows:
  - Short-form (<60s): 0-3 seconds
  - Long-form (>60s): 0-15 seconds
- 12 hook type classifications
- 4-dimension effectiveness scoring
- Evidence capture with Claim<T>

**Hook Types:**
```typescript
type HookType =
  | 'question'      // "Have you ever...?"
  | 'statement'     // "I found the best..."
  | 'pov'           // "POV: you just..."
  | 'controversy'   // "Unpopular opinion..."
  | 'teaser'        // "Wait for it..."
  | 'listicle'      // "5 things you need..."
  | 'problem'       // "Struggling with...?"
  | 'visual_hook'   // Striking visual, pattern interrupt
  | 'trend_sound'   // Uses trending audio
  | 'story'         // "Story time..."
  | 'result_first'  // Shows outcome upfront
  | 'direct_value'; // "In this video you'll learn..."
```

**Effectiveness Score:**
```typescript
interface EffectivenessScore {
  total: number;           // 0-100
  clarity: number;         // 0-25: Is the promise clear?
  patternInterrupt: number; // 0-25: Does it stop the scroll?
  speedToValue: number;    // 0-25: How fast is the payoff?
  contentAlignment: number; // 0-25: Does it match content type?
}
```

**Key Files:**
- `/lib/extraction/hook-extractor.ts`

**Validation:**
- Working on short-form content
- Issue: YouTube long-form returns "unknown" (needs denser frame sampling)

---

### 5. Affiliate Integration

**Status:** ✅ Complete (pending account approvals)

**Networks:**
- Amazon Associates (direct integration)
- Skimlinks (48,500+ merchants)
- Involve Asia (Shopee/Lazada for SEA)

**Routing Logic:**
```
Amazon product → Amazon Associates link
SEA retailer → Involve Asia link
Other → Skimlinks fallback
```

**Key Files:**
- `/lib/affiliate/index.ts`
- `/lib/affiliate/amazon.ts`
- `/lib/affiliate/skimlinks.ts`
- `/lib/affiliate/involve-asia.ts`

---

### 6. Core Type System

**Status:** ✅ Complete

**Key Types:**

```typescript
// Everything is a Claim with Evidence
interface Claim<T> {
  value: T;
  confidence: number;
  evidence: Evidence[];
  source: ClaimSource;
  modelVersion: string;
  extractedAt: Date;
}

interface Evidence {
  type: 'frame' | 'transcript' | 'external_api';
  frameIndex?: number;
  timestamp?: number;
  transcriptSpan?: {
    start: number;
    end: number;
    text: string;
  };
  apiSource?: string;
  confidence: number;
}

type ClaimSource = 
  | 'auto' 
  | 'auto_high' 
  | 'creator_confirmed' 
  | 'brand_verified' 
  | 'disputed';
```

**Helper Functions:**
- `createClaim<T>(value, confidence, evidence, source)`
- `createFrameEvidence(frameIndex, timestamp, confidence)`
- `createTranscriptEvidence(start, end, text, confidence)`
- `convertToProductClaim(product)`

**Key Files:**
- `/lib/types/product-claims.ts`

---

## What Needs to Be Built

### Immediate (This Week)

1. **Simple UI**
   - Upload URL → Process → Show results
   - Display: products, hook analysis, engagement
   - See PRD_v1.md for wireframes

2. **Engagement Scraping**
   - Add to video download pipeline
   - Capture: views, likes, comments, shares
   - Store alongside extraction data

3. **Verify Pipeline in Replit**
   - End-to-end test with real video
   - Confirm all dependencies work

### Next Week

4. **Category Benchmarks**
   - Scrape 100 videos each: Fashion, Beauty, Tech, Business
   - Build correlation: hook type → engagement
   - Enable: "You're in top X% for [category]"

5. **Basic Recommendations**
   - Rule-based initially
   - "Your controversy hooks outperform — use more"
   - "Try [format] trending in your niche"

### Future

6. **Hook Variant Generation**
7. **Pattern Analysis (across multiple videos)**
8. **Decision Trace Capture**
9. **Full Creator Studio**
10. **Brand Studio**

---

## Technical Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | Next.js 14 (App Router) | |
| Language | TypeScript (strict mode) | |
| Database | PostgreSQL | Hosted on Neon |
| Storage | S3-compatible | DigitalOcean Spaces |
| Queue | BullMQ | Redis backend |
| Video Download | yt-dlp | Installed separately |
| Transcription | OpenAI Whisper | Via API |
| Vision AI | GPT-4o | Complex analysis |
| Cheap Extraction | Gemini Flash | High-volume, simple tasks |
| Product Search | Google Shopping | Via SerpAPI |
| Styling | Tailwind CSS | |

---

## Environment Variables

```bash
# OpenAI (Required)
OPENAI_API_KEY=sk-...

# SerpAPI for Google Shopping (Required)
SERPAPI_KEY=...

# Database (Required)
DATABASE_URL=postgresql://...

# DigitalOcean Spaces / S3 (Required for video storage)
DO_SPACES_KEY=...
DO_SPACES_SECRET=...
DO_SPACES_BUCKET=velolume
DO_SPACES_REGION=sgp1
DO_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com

# Redis for BullMQ (Required for queue)
REDIS_URL=redis://...

# Affiliate Networks (Optional - pending approval)
AMAZON_ASSOCIATE_ID=
SKIMLINKS_PUBLISHER_ID=
INVOLVE_ASIA_API_KEY=
```

---

## Validation Data (Real Tests)

### Test Videos Used

| # | Platform | URL | Result |
|---|----------|-----|--------|
| 1 | Instagram | /reel/DTLPmlajSQ5/ | ✅ 7 products |
| 2 | Instagram | /reel/DSH_WXWEcu7/ | ✅ Working |
| 3 | Instagram | /reel/DTGGtYhCCD1/ | ✅ Working |
| 4 | TikTok | /ZS5HWJKMq/ | ✅ Working |
| 5 | TikTok | /ZS5HnvAsf/ | ✅ Working |
| 6 | TikTok | /ZS5HWd8fa/ | ✅ Working |
| 7 | TikTok | /ZS5HW2Lyv/ | ✅ Working |
| 8 | YouTube | /mzR4804FxFU | ✅ Working |
| 9 | YouTube | /ThchMj9hMvE | ✅ Working |
| 10 | Instagram | /reel/DRTUc6akezF/ | ✅ Working |
| 11 | YouTube | /PC3tUZ1qGws | ✅ Working |

### Product Detection Results

| Niche | Sample Product | Confidence | Tier |
|-------|----------------|------------|------|
| Fashion | Olive Green Cable Knit Sweater | 92% | auto_high |
| Beauty | Charlotte Tilbury Pillow Talk Lipstick | 88% | auto_high |
| Tech | Apple AirPods Pro | 95% | auto_high |
| Home | West Elm Mid-Century Table Lamp | 72% | auto |
| Fitness | Lululemon Align Leggings | 85% | auto_high |

### Hook Extraction Results

| Platform | Videos | Avg Effectiveness | Hook Types Found |
|----------|--------|-------------------|------------------|
| Instagram | 4 | 82/100 | statement, question, controversy |
| TikTok | 4 | 86/100 | statement, visual_hook, controversy |
| YouTube | 3 | 72/100 | statement, unknown (needs fix) |

---

## Known Issues & Fixes Needed

| Issue | Severity | Fix |
|-------|----------|-----|
| YouTube long-form hooks = "unknown" | Medium | Need denser frame sampling in first 15s |
| No engagement data captured | High | Add to scraper pipeline |
| No UI | High | Build in Replit |
| yt-dlp might not be in Replit | Medium | Install or use alternative |

---

## Key Decisions Made

| Decision | Rationale | Date | Reversible? |
|----------|-----------|------|-------------|
| Claim<T> wrapper for all data | Evidence-backed, debuggable | Jan 7 | No (core architecture) |
| Google Shopping for matching | 100% vs 0% success vs Lens | Jan 6 | No (validated) |
| Multi-model routing | Cost optimization | Jan 6 | Yes |
| Context Graph architecture | Capture WHY not just WHAT | Jan 8 | No (strategic) |
| Verification tiers | Trust pyramid | Jan 7 | No (core feature) |
| Replit for development | Need visual feedback | Jan 8 | Yes |

---

## How to Resume in Replit

### Step 1: Verify Code Transferred
Check these files exist:
- `/lib/ai/processor.ts`
- `/lib/extraction/hook-extractor.ts`
- `/lib/matching/product-matcher.ts`
- `/lib/types/product-claims.ts`

### Step 2: Verify Environment
All secrets set in Replit:
- OPENAI_API_KEY
- SERPAPI_KEY
- DATABASE_URL
- (others as needed)

### Step 3: Install Dependencies
```bash
npm install
```

If yt-dlp needed:
```bash
# Check if available
which yt-dlp

# If not, may need alternative approach in Replit
```

### Step 4: Test Extraction
Run on a single video to verify pipeline works:
```typescript
// Test script
import { processVideo } from './lib/ai/processor';

const result = await processVideo('https://www.instagram.com/reel/DTLPmlajSQ5/');
console.log(result);
```

### Step 5: Build UI
Once extraction verified, build the simple results UI per PRD_v1.md.

---

## Documents in This Package

| File | Purpose | Priority |
|------|---------|----------|
| CLAUDE.md | Instructions for Claude | Read first |
| PROJECT_STATE.md | Current build status | Read second |
| PRD_v1.md | MVP requirements | Reference for building |
| PRODUCT_VISION.md | Strategic context | Reference for decisions |
| MIGRATION_CONTEXT.md | This file - full context | Deep reference |

---

## Contact Points

- All code was built with Claude Code (Anthropic)
- Strategic planning with Claude (Anthropic)
- No external team members

---

## Final Checklist Before Starting Work

- [ ] All code files present
- [ ] All environment variables set
- [ ] npm install completed
- [ ] Can run TypeScript files
- [ ] yt-dlp or alternative available
- [ ] Read PROJECT_STATE.md
- [ ] Read CLAUDE.md
- [ ] Understand current priority: Build UI

---

**You are now ready to continue development. The extraction backend is complete and validated. Focus on building the UI to visualize results.**
