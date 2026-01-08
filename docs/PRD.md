# PRODUCT REQUIREMENTS DOCUMENT
## Velolume v1.0: Creator Content Analyzer

**Document Version:** 1.0
**Last Updated:** January 8, 2026
**Status:** Active Development

---

## Executive Summary

Velolume v1.0 is a content intelligence tool that helps creators understand why their content works and what to create next. By analyzing video content and correlating it with performance data, we provide actionable insights that improve content strategy.

---

## Problem Statement

### The Creator's Pain

Creators post content and see results, but they don't understand the connection:
- "This video got 10x views. Why?"
- "What should I create next?"
- "Am I doing this right compared to others in my niche?"
- "How do I make money from my content?"

### Current Solutions Fall Short

| Solution | Problem |
|----------|---------|
| Analytics dashboards | Show WHAT happened, not WHY |
| "Go viral" courses | Generic advice, not personalized |
| Competitor research tools | Show others' content, don't analyze yours |
| Affiliate platforms | Manual tagging, no intelligence |

### The Gap

No tool connects content analysis → performance correlation → personalized recommendations.

---

## Target User

### Primary: Mid-Tier Content Creator

**Demographics:**
- 10K - 500K followers
- Posts 3-7x per week
- Monetizing or trying to monetize
- 1-3 years creating content

**Psychographics:**
- Takes content seriously as a business or side business
- Wants to grow but feels stuck
- Knows "something" is working but can't articulate what
- Time-constrained, needs efficiency

**Platforms:**
- TikTok (primary)
- Instagram Reels
- YouTube Shorts / Long-form

**Niches (v1):**
- Fashion/Style
- Beauty/Skincare
- Tech/Gadgets
- Business/Entrepreneur

### Secondary: Brand Content Team

- Small team (1-5 people)
- Creating social content for brand
- Need to understand category patterns
- Want to create more, faster

---

## User Stories

### Core User Stories (MVP)

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| U1 | Creator | Upload my video and see what products are detected | I can create a storefront without manual tagging | P0 |
| U2 | Creator | See what hook type I used and how effective it is | I understand what grabs attention | P0 |
| U3 | Creator | Compare my content to category benchmarks | I know if I'm above or below average | P0 |
| U4 | Creator | Get recommendations on what to create next | I have clear direction | P1 |
| U5 | Creator | See my content patterns over multiple videos | I understand my style | P1 |
| U6 | Creator | Generate affiliate links for detected products | I can monetize without manual work | P1 |

### Extended User Stories (Post-MVP)

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| U7 | Creator | Generate hook variants based on what works | I can create faster | P2 |
| U8 | Creator | See trending formats in my niche | I can jump on trends | P2 |
| U9 | Brand | Analyze category content patterns | I know what works in my space | P2 |
| U10 | Brand | Find creators who match our style | I can identify partners | P3 |

---

## Functional Requirements

### FR1: Video Upload & Processing

**Description:** User can submit a video URL or upload directly. System processes and extracts data.

**Inputs:**
- Video URL (TikTok, Instagram, YouTube)
- OR direct video upload

**Processing:**
- Download video (yt-dlp)
- Extract frames (12 distributed + first 3 seconds dense)
- Extract audio → transcript (Whisper)
- Run extraction pipeline

**Outputs:**
- Processing status
- Extracted data stored in database
- Ready for display

**Acceptance Criteria:**
- [ ] TikTok URLs process successfully (>95%)
- [ ] Instagram URLs process successfully (>95%)
- [ ] YouTube URLs process successfully (>95%)
- [ ] Processing completes in <60 seconds for short-form
- [ ] Processing completes in <180 seconds for long-form

---

### FR2: Product Detection

**Description:** System detects products visible in video with evidence.

**Extraction:**
- Product name (detected or inferred)
- Category (clothing, beauty, tech, etc.)
- Brand (if identifiable)
- Attributes (color, material, style)
- Confidence score (0-100)
- Evidence (frame index, timestamp, transcript mention)

**Display:**
- List of products with thumbnails
- Confidence indicators
- "Add to storefront" action

**Acceptance Criteria:**
- [ ] Detects 80%+ of visible products
- [ ] Confidence scores correlate with accuracy
- [ ] Evidence traces back to correct frames

---

### FR3: Hook Analysis

**Description:** System analyzes the opening of the video and classifies the hook.

**Extraction:**
- Hook window (0-3s for short-form, 0-15s for long-form)
- Hook type (question, statement, POV, controversy, etc.)
- Hook transcript
- Text overlay (if present)
- Effectiveness score (0-100)
- Effectiveness breakdown (clarity, pattern interrupt, speed to value, alignment)

**Display:**
- Hook type with explanation
- Effectiveness score with breakdown
- Transcript of hook
- Visual preview of hook frames

**Acceptance Criteria:**
- [ ] Correct hook window for content type
- [ ] Hook type classification >80% accurate
- [ ] Effectiveness score correlates with actual engagement (validate later)

---

### FR4: Engagement Capture

**Description:** System captures public engagement metrics when scraping.

**Data Captured:**
- Views
- Likes
- Comments
- Shares (if available)
- Save count (if available)

**Display:**
- Engagement metrics displayed
- Engagement rate calculated
- Comparison to user's average (when multiple videos)

**Acceptance Criteria:**
- [ ] Engagement data captured for >90% of videos
- [ ] Data matches platform display (±5% tolerance)

---

### FR5: Category Benchmarks

**Description:** User can compare their content to category averages.

**Benchmark Data:**
- Average engagement by hook type in category
- Top-performing formats in category
- Product categories trending

**Display:**
- "Your hook effectiveness: 76 (Category avg: 68)"
- "Your engagement rate: Top 30% for Beauty"
- Visual comparison charts

**Acceptance Criteria:**
- [ ] Benchmarks based on 100+ videos per category
- [ ] Benchmarks refresh weekly
- [ ] Clear visual indication of above/below average

---

### FR6: Results Dashboard

**Description:** Single-page view of all extraction results for a video.

**Sections:**
1. Video preview/thumbnail
2. Products detected (with confidence)
3. Hook analysis (type, score, breakdown)
4. Engagement metrics
5. Benchmark comparisons
6. Recommendations (basic)

**Acceptance Criteria:**
- [ ] All sections load in <3 seconds
- [ ] Mobile responsive
- [ ] Clear visual hierarchy

---

## Non-Functional Requirements

### Performance
- Video processing: <60s (short-form), <180s (long-form)
- Dashboard load: <3s
- API response: <500ms

### Scalability
- Support 1000 videos/day initially
- Horizontal scaling path defined

### Security
- No video storage after processing (unless user opts in)
- API keys secured
- User data isolated

### Reliability
- 99% uptime target
- Graceful degradation if APIs fail

---

## Data Model (Core Entities)

### Video
```
- id
- userId
- sourceUrl
- platform (tiktok, instagram, youtube)
- duration
- processedAt
- status
```

### Extraction
```
- id
- videoId
- products: ProductClaim[]
- hook: HookAnalysis
- engagement: EngagementData
- extractedAt
- modelVersion
```

### ProductClaim
```
- value: ProductData
- confidence: number
- evidence: Evidence[]
- source: VerificationTier
```

### HookAnalysis
```
- type: HookType
- transcript: string
- textOverlay: string
- effectiveness: EffectivenessScore
- evidence: Evidence[]
```

### CategoryBenchmark
```
- category
- hookTypeStats: { [type]: avgEngagement }
- formatStats: { [format]: avgEngagement }
- updatedAt
```

---

## User Interface

### Screen 1: Upload

**Components:**
- URL input field
- Platform auto-detection
- "Analyze" button
- Recent analyses list

**Flow:**
1. User pastes URL
2. Platform detected and shown
3. Click "Analyze"
4. Progress indicator
5. Redirect to Results

### Screen 2: Results Dashboard

**Layout:**
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
│  • Add product close-ups for better detection       │
└─────────────────────────────────────────────────────┘
```

### Screen 3: My Content (Library)

**Components:**
- Grid of analyzed videos
- Filter by date, performance
- Pattern summary across videos
- "Analyze New" CTA

---

## Success Metrics

### Launch Metrics (Week 1-4)
| Metric | Target |
|--------|--------|
| Videos analyzed | 500+ |
| Unique users | 50+ |
| Return users | 30%+ |
| Processing success rate | 95%+ |

### Growth Metrics (Month 2-3)
| Metric | Target |
|--------|--------|
| Weekly active users | 200+ |
| Videos per user per week | 3+ |
| Storefront activations | 20% of users |
| Recommendation click-through | 40%+ |

### Validation Metrics
| Metric | Target |
|--------|--------|
| Hook effectiveness correlation with engagement | r > 0.5 |
| Product detection accuracy (user verified) | 80%+ |
| User satisfaction (NPS) | 40+ |

---

## Release Plan

### MVP (v1.0) — Week 1-2
- [ ] Video URL processing
- [ ] Product detection with evidence
- [ ] Hook analysis with scoring
- [ ] Engagement capture
- [ ] Basic results dashboard
- [ ] Single video view

### v1.1 — Week 3-4
- [ ] Category benchmarks
- [ ] Multi-video library
- [ ] Basic recommendations
- [ ] Storefront generation

### v1.2 — Week 5-6
- [ ] Pattern analysis (across user's videos)
- [ ] Improved recommendations
- [ ] Hook variant generation (basic)

---

## Open Questions

1. **Account creation:** Required for v1.0 or allow anonymous analysis?
2. **Video storage:** Store processed videos or delete after extraction?
3. **Benchmark granularity:** By niche or broader categories?
4. **Recommendation logic:** Rules-based v1 or ML from start?

---

## Appendix: Hook Types

| Type | Example | Description |
|------|---------|-------------|
| question | "Have you ever...?" | Opens with direct question |
| statement | "I found the best..." | Bold declarative opening |
| pov | "POV: you just..." | Point-of-view narrative |
| controversy | "Unpopular opinion..." | Provocative take |
| teaser | "Wait for it..." | Promises payoff |
| listicle | "5 things you need..." | Numbered format |
| problem | "Struggling with...?" | Pain point focused |
| visual_hook | [striking visual] | Visual pattern interrupt |
| trend_sound | [trending audio] | Uses viral sound |
| story | "Story time..." | Narrative opening |
| result_first | [shows outcome] | Transformation upfront |
| direct_value | "In this video..." | Clear value statement |

---

## Document History

- **v1.0 (Jan 8, 2026):** Initial PRD created
