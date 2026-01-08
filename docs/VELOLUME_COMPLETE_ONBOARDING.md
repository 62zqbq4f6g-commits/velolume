# VELOLUME: COMPLETE PROJECT ONBOARDING
## Everything You Need to Know

**Created:** January 8, 2026
**Purpose:** Give Claude Code full context to continue building Velolume

---

## SECTION 1: WHAT IS VELOLUME?

### One-Liner
**Velolume is the machine-readable data hub for creators and brands** — extracting intelligence from all content formats to power better content creation, AI discoverability, and monetization.

### The Vision
We are building a **Content Context Graph** that captures:
- **What's in content** (products, hooks, format, visuals, audio)
- **Why it works** (performance correlation, patterns, benchmarks)
- **What to create next** (recommendations based on data)
- **How to be discovered** (machine-readable profiles for AI agents)

### Why This Matters
The internet is shifting from human-browsed to AI-queried:
- AI shopping agents will recommend products
- AI assistants will recommend creators
- AI search will surface content

**Creators and brands that aren't machine-readable become invisible.** We make them visible.

---

## SECTION 2: WHAT WE ARE NOT

| We Are NOT | We ARE |
|------------|--------|
| Just a video analyzer | Machine-readable data hub for ALL content formats |
| Just hooks analysis | Complete content intelligence (8 extraction dimensions) |
| Just for video scripts | Generation for ANY format (video, image, carousel, text, ads) |
| Just a creator tool | Platform for creators AND brands with shared data engine |
| A content factory (like KLING) | The intelligence layer that DIRECTS content factories |

---

## SECTION 3: THE CONTENT CONTEXT GRAPH

### Layer 1: Entities & Relationships
```
CREATOR ←────────────────────────→ BRAND
    │                                  │
    │ creates                          │ owns
    ↓                                  ↓
CONTENT ←─── features ───→ PRODUCT ←─── in catalog
    │                          │
    │ triggers                 │ drives
    ↓                          ↓
ENGAGEMENT               CONVERSION
```

### Layer 2: Context (Why Things Work)
For every content piece, we capture:
- What happened: Products, hooks, format, visuals, audio
- How it performed: Views, engagement, retention, conversion
- Why it worked: The combination of signals that led to performance
- What it connects to: Similar content, creator patterns, category benchmarks

### Layer 3: Decision Traces (Learning Over Time)
When we recommend → creator implements → outcome occurs → we capture:
```
{
  recommendation: "Use controversy hook",
  action: "Creator used controversy hook",
  outcome: "2.3x engagement vs baseline",
  learning: "Increase weight for controversy hooks"
}
```

---

## SECTION 4: THE 8 EXTRACTION DIMENSIONS

We don't just analyze hooks. We extract across 8 dimensions:

### 1. HOOK ANALYSIS
- Hook type (question, controversy, POV, teaser, etc.)
- Hook window (0-3s for short-form, 0-15s for long-form)
- Effectiveness score (0-100)
- 4 sub-dimensions: Clarity, Pattern Interrupt, Speed to Value, Content Alignment

### 2. STRUCTURE ANALYSIS
- Content format (tutorial, review, haul, GRWM, etc.)
- Pacing (cuts per second, energy variation)
- Narrative arc (linear, problem-solution, transformation, reveal)
- Open loops and payoff timing
- CTA placement and strength

### 3. VISUAL ANALYSIS
- Visual aesthetic (minimalist, chaotic, professional, etc.)
- Color palette and production quality
- Face presence and expressions
- Text overlays and readability
- Thumbnail clickability score

### 4. AUDIO ANALYSIS
- Voice characteristics (tone, pace, energy)
- Music (trending sound, mood, prominence)
- Sound effects usage
- Audio quality and balance

### 5. PRODUCT ANALYSIS
- Products detected with evidence
- Category and brand identification
- Integration style (organic, sponsored, review)
- Purchase intent signals
- Matched to real products via Google Shopping

### 6. PERFORMANCE ANALYSIS
- Engagement metrics (views, likes, comments, shares, saves)
- Engagement rates
- Benchmark comparisons (vs creator average, vs category)

### 7. AUDIENCE SIGNALS
- Comment sentiment and themes
- Questions asked
- Purchase intent signals in comments

### 8. CREATOR/BRAND DNA
- Aggregated style fingerprint across all content
- Visual, audio, writing patterns
- Best-performing patterns
- Product affinity

---

## SECTION 5: WHAT HAS BEEN BUILT

### ✅ Complete & Validated

| Component | File | Status |
|-----------|------|--------|
| Video Ingestion | `/lib/scraper/` | ✅ TikTok, Instagram, YouTube, Xiaohongshu |
| Product Detection v2.1 | `/lib/ai/processor.ts` | ✅ 5-15 products per video, 80 category schemas |
| Product Matching v2.1 | `/lib/matching/product-matcher.ts` | ✅ Google Shopping + visual verification |
| Hook Extraction v1.0 | `/lib/extraction/hook-extractor.ts` | ✅ 12 hook types, effectiveness scoring |
| Type System | `/lib/types/product-claims.ts` | ✅ Claim<T>, Evidence, VerificationTier |
| Affiliate Integration | `/lib/affiliate/` | ✅ Amazon, Skimlinks, Involve Asia |

### Validation Results
- 11 real videos tested
- 100% download success rate
- 68 products detected (avg 6.2/video)
- Hook extraction working on short-form content

---

## SECTION 6: THE CORE TYPE SYSTEM

### Everything is a Claim with Evidence

```typescript
interface Claim<T> {
  value: T;
  confidence: number;        // 0-100
  evidence: Evidence[];      // What supports this claim
  source: ClaimSource;       // Verification tier
  modelVersion: string;
  extractedAt: Date;
}

interface Evidence {
  type: 'frame' | 'transcript' | 'external_api';
  frameIndex?: number;
  timestamp?: number;
  transcriptSpan?: { start: number; end: number; text: string; };
  apiSource?: string;
  confidence: number;
}

type ClaimSource = 
  | 'auto'              // AI detected, <85% confidence
  | 'auto_high'         // AI detected, ≥85% confidence
  | 'creator_confirmed' // Creator approved
  | 'brand_verified'    // Brand confirmed
  | 'disputed';         // Under review
```

### Why This Matters
- Every claim is traceable to evidence
- We can debug why something was detected
- Users can verify/dispute claims
- System improves over time

---

## SECTION 7: USER VALUE PROPOSITIONS

### For Creators

| Pain | Our Solution |
|------|--------------|
| "Why did this video work?" | Full extraction + performance correlation |
| "What should I create next?" | Pattern analysis + recommendations |
| "How do I create faster?" | AI generation in YOUR style |
| "How do I make money?" | Auto-storefront with affiliate links |
| "How do I get discovered?" | Machine-readable profile for AI agents |

### For Brands

| Pain | Our Solution |
|------|--------------|
| "What content works in our category?" | Category benchmarks |
| "Who should we partner with?" | Creator matching based on verified data |
| "Who's talking about us?" | Mention monitoring with sentiment |
| "How do we create better content?" | Pattern transfer from top performers |

---

## SECTION 8: VALUE TIERS (Why Users Upload)

### Tier 1: Immediate Value (First Upload)
- Instant Storefront — Products → Affiliate links → Money
- Content Report Card — Score + breakdown
- Product Detection — Auto-tagging

### Tier 2: Growing Value (Multiple Uploads)
- Pattern Analysis — "Your controversy hooks outperform by 40%"
- Style DNA Profile — Your unique fingerprint
- Benchmark Comparison — "Top 20% in Beauty"

### Tier 3: Compounding Value (Ongoing Use)
- AI Generation in Your Style
- Brand Matching
- AI Discoverability

### Tier 4: Network Value (Community)
- Category Benchmarks
- Trend Detection
- Creator Community Insights

---

## SECTION 9: MVP REQUIREMENTS (PRD v1)

### The MVP Flow
```
User pastes video URL
    → Platform detected (TikTok/Instagram/YouTube)
    → Click "Analyze"
    → Processing (download, extract frames, transcribe, analyze)
    → Results page shows:
        - Video thumbnail
        - Engagement metrics
        - Hook analysis (type, score, breakdown)
        - Products detected (with confidence)
        - Basic recommendations
```

### Results Page Wireframe
```
┌─────────────────────────────────────────────────────┐
│  [Video Preview]     │  Engagement Metrics          │
│                      │  Views: 45,231               │
│                      │  Likes: 3,421                │
│                      │  Comments: 234               │
├──────────────────────┴──────────────────────────────┤
│  HOOK ANALYSIS                                       │
│  Type: Controversy        Effectiveness: 76/100      │
│  "Unpopular opinion: this $5 product..."            │
│  [Clarity: 18] [Interrupt: 20] [Speed: 18] [Align: 20]│
│  📊 Category avg: 68 — You're in top 35%            │
├─────────────────────────────────────────────────────┤
│  PRODUCTS DETECTED (6)                              │
│  ┌─────┐ ┌─────┐ ┌─────┐                           │
│  │ img │ │ img │ │ img │  ...                      │
│  │ 95% │ │ 88% │ │ 72% │                           │
│  └─────┘ └─────┘ └─────┘                           │
│  [Add All to Storefront]                            │
├─────────────────────────────────────────────────────┤
│  RECOMMENDATIONS                                    │
│  • Your controversy hooks outperform — use more     │
│  • Try "result first" format trending in Beauty     │
└─────────────────────────────────────────────────────┘
```

---

## SECTION 10: CURRENT PRIORITY

### What Needs to Happen NOW

1. **Fix the Homepage UI**
   - Clean landing page with URL input
   - "Understand why your content works"
   - Paste URL → Analyze → See results

2. **Connect UI to Extraction**
   - Use existing code in /lib/ai/processor.ts
   - Show REAL data, not mock data

3. **Add Engagement Scraping**
   - Capture views, likes, comments from platform

4. **Test with Real Videos**
   - Verify full pipeline works end-to-end

---

## SECTION 11: TECH STACK

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) |
| Storage | DigitalOcean Spaces (S3) |
| Video Download | yt-dlp |
| Transcription | OpenAI Whisper |
| Vision AI | GPT-4o |
| Product Search | Google Shopping via SerpAPI |

---

## SECTION 12: ENVIRONMENT VARIABLES

Required secrets:
```
OPENAI_API_KEY=
SERPAPI_KEY=
DATABASE_URL=
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_BUCKET=
DO_SPACES_REGION=
DO_SPACES_ENDPOINT=
```

---

## SECTION 13: KEY PRINCIPLES

### 1. Everything is a Claim with Evidence
Never store raw values without evidence trail.

### 2. Capture the "How" to Infer the "Why"
We capture what's in content and how it performs. Over time, we infer why things work.

### 3. Machine-Readable is Core
Everything we extract should be queryable by AI agents.

### 4. Real Data, Not Mock Data
Always test with real videos. Mock data hides bugs.

### 5. User Value First
Every feature should deliver clear value that justifies the user uploading their content.

---

## SECTION 14: WHAT NOT TO DO

❌ Don't rebuild extraction from scratch — it works
❌ Don't change the Claim<T> structure — it's validated
❌ Don't skip evidence capture — it's core to architecture
❌ Don't use mock data for testing — use real videos
❌ Don't build features not in PRD without discussion
❌ Don't delete /lib folder — that's all the extraction code

---

## SECTION 15: WHAT TO DO

✅ Read this document fully before making changes
✅ Keep extraction code in /lib intact
✅ Build UI that connects to real extraction
✅ Test with real video URLs
✅ Maintain dark mode, modern aesthetic
✅ Follow the MVP flow in PRD

---

## SECTION 16: TEST VIDEOS

Use these for testing:

| Platform | URL |
|----------|-----|
| TikTok | https://www.tiktok.com/@ryukkongee/video/7589728644025699591 |
| Instagram | https://www.instagram.com/reel/DTLPmlajSQ5/ |
| YouTube | https://www.youtube.com/watch?v=mzR4804FxFU |

---

## SECTION 17: SUCCESS CRITERIA

The MVP is successful when:
- [ ] User can paste a video URL on homepage
- [ ] Clicking "Analyze" processes the video
- [ ] Results show REAL engagement metrics
- [ ] Results show REAL hook analysis
- [ ] Results show REAL products detected
- [ ] Products have confidence scores
- [ ] Products can be added to storefront

---

## FINAL NOTE

Velolume is NOT just another analytics tool. We're building the **machine-readable data layer for the creator economy**. Every decision should move toward that vision.

When in doubt, ask: "Does this help creators/brands understand why their content works and what to create next?"
