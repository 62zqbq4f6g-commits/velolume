# VELOLUME PRODUCT MASTER DOCUMENT
**Version:** 1.0
**Date:** January 7, 2026
**Status:** Living Document

---

## EXECUTIVE SUMMARY

Velolume is **the structured data layer for the creator economy**. We transform creator video content into machine-readable data that powers affiliate revenue, brand discovery, and AI-agent queries.

**One-Liner:** "Your content, machine-readable. Get found. Get paid."

**The Problem:** Creator videos contain valuable intelligence (product recommendations, brand preferences, content patterns) but this data is trapped in pixels and audio — invisible to AI systems, brands, and commerce platforms.

**The Solution:** Velolume extracts, structures, and exposes this intelligence through:
1. Automated product detection and affiliate linking
2. Machine-readable creator profiles (llms.txt, Schema.org)
3. AI-queryable APIs for brands and agents
4. Human-gated quality control at every step

---

## TABLE OF CONTENTS

1. [Market Context](#1-market-context)
2. [Product Vision](#2-product-vision)
3. [Core Features](#3-core-features)
4. [Technical Architecture](#4-technical-architecture)
5. [Data Model](#5-data-model)
6. [User Journeys](#6-user-journeys)
7. [Security & Privacy](#7-security--privacy)
8. [Competitive Positioning](#8-competitive-positioning)
9. [Roadmap](#9-roadmap)
10. [Metrics & Success Criteria](#10-metrics--success-criteria)

---

## 1. MARKET CONTEXT

### The Machine-Readable Web

The internet is becoming machine-readable:
- **Websites** use llms.txt to guide AI agents
- **E-commerce** uses Schema.org and product feeds
- **Documentation** uses structured formats for AI parsing

**600+ websites** have adopted llms.txt as of 2025, including Anthropic, Stripe, Cloudflare, and Zapier.

### The Gap

| Content Type | Machine-Readable? | Status |
|--------------|-------------------|--------|
| Websites | ✅ Yes | llms.txt, Schema.org |
| Products | ✅ Yes | Google Merchant, Shopify |
| Creator Videos | ❌ No | **Velolume fills this gap** |

### Why This Matters Now

- AI agents are becoming primary discovery mechanisms
- LLM traffic projected to reach 10% of search by end of 2025
- Brands want data-driven creator partnerships
- Creators need passive revenue beyond sponsorships

---

## 2. PRODUCT VISION

### What We Build

```
THE CREATOR DATA HUB

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  CREATOR VIDEOS (Input)                                     │
│  ─────────────────────                                      │
│  TikTok, Instagram, YouTube, Xiaohongshu                    │
│                                                             │
│                        ▼                                    │
│                                                             │
│  VELOLUME EXTRACTION ENGINE                                 │
│  ─────────────────────────────                              │
│  • Products detected & matched                              │
│  • Content intelligence extracted                           │
│  • Brand profile auto-generated                             │
│  • 75+ data points per video                                │
│                                                             │
│                        ▼                                    │
│                                                             │
│  HUMAN GATE (Creator Review)                                │
│  ──────────────────────────────                             │
│  • Review product matches                                   │
│  • Refine brand profile                                     │
│  • Approve what gets published                              │
│                                                             │
│                        ▼                                    │
│                                                             │
│  MACHINE-READABLE OUTPUT                                    │
│  ───────────────────────────                                │
│  • Storefronts with affiliate links                         │
│  • llms.txt for AI agents                                   │
│  • API for brand queries                                    │
│  • Creator profile for discovery                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Philosophy

**Human-Gated AI:** Every AI-generated output passes through creator review before publishing. The machine does 80% of the work; the human ensures 100% quality.

| Component | Machine Does | Human Does |
|-----------|--------------|------------|
| Product Detection | Finds 10+ products per video | Reviews, approves matches |
| Product Matching | Scores candidates, finds best | Selects final or provides own link |
| Brand Kit | Auto-generates from content | Refines, corrects, personalizes |
| Recommendations | Suggests based on data | Accepts, modifies, rejects |

### Value Propositions

**For Creators:**
- "We watch your videos so you don't have to"
- Automatic affiliate revenue from existing content
- Brand profile that AI agents can discover
- Content recommendations based on what works

**For AI Agents:**
- Query creator recommendations via API
- Structured, attributed, up-to-date data
- Pay for access, creators get paid

**For Brands:**
- Find creators who actually use your products
- Data-verified (not self-reported)
- Match based on actual content patterns

---

## 3. CORE FEATURES

### 3.1 Product Detection & Matching

**What it does:**
- Detects 5-15 products per video automatically
- Matches each product to purchasable items
- Converts URLs to affiliate links

**How it works:**
```
Video → Frame Extraction → Product Detection → Google Shopping Search
    → Attribute Matching → Candidate Scoring → Human Review → Affiliate Link
```

**Key capabilities:**
- Multi-frame fusion for 100% attribute completeness
- 80 category schemas for accurate matching
- Fuzzy matching for colors, textures, patterns
- Deal-breaker logic for critical attributes
- Visual tiebreaker for close scores

**Accuracy:** 100% success rate on real Google Shopping data (10/10 products)

### 3.2 Content Intelligence Extraction

**What it does:**
- Extracts hooks, angles, themes from videos
- Analyzes speaking style, sentiment, energy
- Detects brand mentions, price mentions
- Identifies content patterns

**Data points extracted (75+):**
```
CONTENT INTELLIGENCE
├── Hook: type, duration, transcript, visual
├── Angle: unique claim, perspective, target audience
├── Theme: narrative structure, format, pacing
├── CTA: type, placement, transcript
└── Product reveals: timing, strategy

VISUAL ANALYSIS
├── Colors: dominant palette, consistency
├── Aesthetic: style, mood, composition
├── Scene: background, lighting, creator presence
└── Production: quality, editing style

AUDIO ANALYSIS
├── Speaking: style, pace, energy
├── Sentiment: positive/negative/mixed
├── Mentions: brands, products, prices
└── Music: presence, type

COMMERCE SIGNALS
├── Disclosure: affiliate, sponsored
├── Intent: recommendation strength
└── Pricing: positioning, mentions
```

### 3.3 Brand Kit Auto-Generation

**What it does:**
- Generates creator's brand profile from their videos
- Includes content pillars, speaking style, aesthetic
- Provides personalized recommendations

**Two data sources:**

| Source | What It Provides | Purpose |
|--------|------------------|---------|
| Creator's own videos | Their actual voice, style, pillars | "Who you ARE" |
| Successful creator data | Winning patterns in their niche | "What WORKS" |

**Output (human-reviewed):**
```
BRAND KIT
├── Identity
│   ├── Handle, bio, essence
│   ├── Signature phrases
│   └── Visual aesthetic
├── Content Pillars
│   ├── Topics they cover
│   └── Gaps vs top performers
├── Audience
│   ├── Inferred demographics
│   └── Price positioning
└── Recommendations
    ├── Hooks that work in their niche
    ├── Content gaps to explore
    └── Optimization suggestions
```

### 3.4 Machine-Readable Output

**llms.txt for Creators:**
```markdown
# @fashionista

> Fashion and lifestyle creator. Affordable luxury, curated taste.

## Products
- /products/summer-2026: Summer outfit recommendations
- /products/skincare: Current skincare routine

## Content
- /about: Brand profile and pillars
- /partnerships: Brand collaboration history

## API
- /api/recommendations: Query product recommendations
- /api/profile: Get structured creator profile
```

**Schema.org for Storefronts:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nike Air Max 90",
  "description": "Recommended by @fashionista in 'Summer Outfit Ideas'",
  "offers": {
    "@type": "Offer",
    "url": "https://affiliate.link/...",
    "priceCurrency": "USD",
    "price": "130.00"
  },
  "review": {
    "@type": "Review",
    "author": "@fashionista",
    "reviewBody": "Perfect for beach days"
  }
}
```

**API for AI Agents:**
```
GET /api/v1/creators/{handle}/recommendations
GET /api/v1/products/{category}?creator={handle}
GET /api/v1/search?q=summer+sneakers&niche=fashion
```

### 3.5 Creator Review UI

**Purpose:** Human gate for all AI outputs

**Product Match Review:**
```
┌─────────────────────────────────────────────────────────────┐
│ PRODUCT 1 OF 10: Olive Green Sweater                        │
│                                                             │
│ ┌─────────┐  TOP MATCH (Score: 92/100)                     │
│ │ [image] │  Abercrombie Cable Knit Crew                   │
│ │         │  $68.00 at Abercrombie.com                     │
│ └─────────┘                                                 │
│                                                             │
│ [✓ Accept]  [See Alternatives]  [Provide Own Link]         │
│                                                             │
│ ALTERNATIVES:                                               │
│ • H&M Ribbed Sweater - $34.99 (Score: 85)                  │
│ • Zara Knit Top - $45.90 (Score: 83)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Brand Kit Review:**
```
┌─────────────────────────────────────────────────────────────┐
│ YOUR BRAND PROFILE (Auto-generated from 47 videos)          │
│                                                             │
│ Content Pillars:                                            │
│ ✅ Fashion        [Keep] [Edit] [Remove]                    │
│ ✅ Travel         [Keep] [Edit] [Remove]                    │
│ ⚠️ Budget Finds   [Keep] [Edit] [Remove]                    │
│                   └── Suggestion: "Smart Spending"?         │
│ [+ Add Pillar]                                              │
│                                                             │
│ Brand Essence:                                              │
│ "Accessible luxury, curated taste"  [Edit]                  │
│                                                             │
│ Signature Phrases:                                          │
│ ✅ "Obsessed with this"                                     │
│ ✅ "Game changer"                                           │
│ [+ Add phrase]                                              │
│                                                             │
│ [Save Profile]  [Reset to Auto-Generated]                   │
└─────────────────────────────────────────────────────────────┘
```

### 3.6 Storefront Generation

**What it does:**
- Creates shareable product pages for each video
- Includes affiliate links
- Machine-readable (llms.txt, Schema.org)

**URL structure:** `velolume.com/@creator/video-slug`

**Features:**
- Mobile-optimized
- Product grid with images, prices, links
- Video embed or thumbnail
- Creator branding
- AI-readable metadata

---

## 4. TECHNICAL ARCHITECTURE

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│ VIDEO INGESTION                                             │
│ TikTok, Instagram, YouTube, Xiaohongshu, Direct Upload      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ EXTRACTION LAYER (Multi-Model)                              │
│                                                             │
│ GPT-4o: Complex vision (detection, fusion, tiebreaker)     │
│ Gemini Flash: High-volume (candidate extraction, content)  │
│ GPT-4o-mini: Text tasks (SEO, parsing)                     │
│                                                             │
│ Output: 75+ data points per video                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ MATCHING LAYER                                              │
│                                                             │
│ Google Shopping search → Candidate retrieval               │
│ Attribute extraction → Multi-frame fusion                  │
│ Scoring → Fuzzy matching + deal-breakers                   │
│ Tiebreaker → Visual comparison (if needed)                 │
│                                                             │
│ 80 category schemas, 100% success rate                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ AFFILIATE LAYER                                             │
│                                                             │
│ Amazon → Amazon Associates (direct)                        │
│ Shopee/Lazada → Involve Asia                               │
│ Everything else → Skimlinks (48,500 merchants)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ HUMAN GATE (Creator Review)                                 │
│                                                             │
│ Review matches → Accept/Modify/Reject                      │
│ Review brand kit → Refine/Approve                          │
│ Control visibility → Public/Private/AI-only                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ OUTPUT LAYER                                                │
│                                                             │
│ Storefronts → Fan-facing product pages                     │
│ llms.txt → AI agent discovery                              │
│ API → Programmatic access                                  │
│ Webhooks → Real-time updates                               │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js, React, Tailwind |
| Backend | Node.js, TypeScript |
| Database | PostgreSQL (Neon) |
| Queue | BullMQ + Redis |
| Storage | DigitalOcean Spaces (S3) |
| AI Models | OpenAI GPT-4o, Google Gemini Flash |
| Search | SERP API (Google Shopping) |
| Affiliate | Amazon Associates, Skimlinks, Involve Asia |

### Key Modules

```
/lib/
├── ai/
│   ├── processor.ts          # Video processing orchestration
│   └── model-router.ts       # Multi-model routing
├── matching/
│   ├── product-matcher.ts    # Core matching logic
│   └── category-schemas.ts   # 80 category definitions
├── extraction/
│   ├── comprehensive-extractor.ts  # Full extraction
│   └── types.ts              # Data schemas
├── shopping/
│   └── google-shopping.ts    # Product search
├── affiliate/
│   ├── amazon.ts             # Amazon Associates
│   ├── skimlinks.ts          # Skimlinks
│   └── involve-asia.ts       # Involve Asia
├── scraper/
│   └── video-scraper.ts      # Platform scrapers
└── benchmark/                # (Planned)
    ├── creators.ts           # Top creator profiles
    └── patterns.ts           # Winning patterns
```

---

## 5. DATA MODEL

### Creator Profile

```typescript
interface CreatorProfile {
  id: string;
  handle: string;
  platforms: Platform[];

  // Auto-generated, human-refined
  brandKit: {
    essence: string;
    pillars: string[];
    signaturePhrases: string[];
    aesthetic: AestheticProfile;
    speakingStyle: SpeakingStyle;
    targetAudience: AudienceInference;
  };

  // Aggregated from videos
  products: ProductRecommendation[];
  brands: BrandMention[];
  contentPatterns: ContentPattern[];

  // Settings
  visibility: VisibilitySettings;
  affiliateAccounts: AffiliateAccount[];
}
```

### Video Extraction (Digital DNA)

```typescript
interface VideoExtraction {
  videoId: string;
  creatorId: string;
  extractedAt: Date;

  // Products (5-15 per video)
  products: DetectedProduct[];

  // Content intelligence
  hook: HookAnalysis;
  narrative: NarrativeStructure;
  cta: CTADetection;
  productReveals: ProductReveal[];

  // Visual analysis
  colors: ColorAnalysis;
  aesthetic: AestheticStyle;
  composition: SceneComposition;

  // Audio analysis
  transcript: string;
  speakingStyle: SpeakingAnalysis;
  sentiment: SentimentAnalysis;
  mentions: MentionDetection;

  // Commerce signals
  disclosure: DisclosureDetection;
  pricePositioning: PricePosition;
}
```

### Product Match

```typescript
interface ProductMatch {
  detectedProduct: DetectedProduct;
  candidates: ScoredCandidate[];
  topMatch: ScoredCandidate;

  // Human gate
  creatorApproved: boolean;
  creatorSelected: string | null;  // If different from top match
  creatorProvidedLink: string | null;

  // Affiliate
  affiliateUrl: string;
  affiliateNetwork: 'amazon' | 'skimlinks' | 'involve_asia';
  estimatedCommission: number;
}
```

### Benchmark Data (Anonymized)

```typescript
interface NicheBenchmark {
  niche: string;
  sampleSize: number;
  lastUpdated: Date;

  // Aggregated patterns (no individual identification)
  patterns: {
    avgVideoLength: number;
    topHookTypes: { type: string; percentage: number }[];
    contentMix: { format: string; percentage: number }[];
    postingFrequency: number;
    engagementCorrelations: Correlation[];
  };

  // What works
  topPerformingHooks: string[];
  effectiveFormats: string[];
  optimalPostingTimes: number[];
}
```

---

## 6. USER JOURNEYS

### Journey 1: New Creator Onboarding

```
1. SIGN UP
   └── Connect TikTok/Instagram/YouTube

2. INITIAL SCAN
   └── We process last 20 videos
   └── Extract products, content patterns, brand signals

3. REVIEW PRODUCTS
   └── See all detected products
   └── Review top matches
   └── Approve or provide own links

4. REVIEW BRAND KIT
   └── See auto-generated profile
   └── Refine pillars, phrases, essence
   └── Set visibility preferences

5. LAUNCH STOREFRONT
   └── Get shareable link
   └── Share in bio, stories, posts

6. ONGOING
   └── New videos auto-processed
   └── Flagged for review if needed
   └── Revenue flows automatically
```

### Journey 2: Fan Discovery

```
1. FIND LINK
   └── In creator's bio, video caption, or direct share

2. VIEW STOREFRONT
   └── See products from video
   └── Click to purchase

3. PURCHASE
   └── Redirected to retailer
   └── Creator earns commission
```

### Journey 3: AI Agent Query

```
1. AGENT QUERY
   └── "What sneakers does @fashionista recommend?"

2. API CALL
   └── GET /api/v1/creators/fashionista/recommendations?category=footwear

3. RESPONSE
   └── Structured JSON with products, context, affiliate links

4. ATTRIBUTION
   └── Query logged, creator credited
```

### Journey 4: Brand Discovery

```
1. BRAND SEARCH
   └── "Find creators who feature Nike products authentically"

2. QUERY
   └── Search by brand mentions, not self-reported tags

3. RESULTS
   └── Creators ranked by actual usage
   └── Content samples, engagement data

4. OUTREACH
   └── Contact through platform or direct
```

---

## 7. SECURITY & PRIVACY

### Data Security Principles

1. **ISOLATION:** Row-level security — creators only access own data
2. **ENCRYPTION:** All data encrypted at rest and in transit
3. **MINIMIZATION:** Delete raw videos after processing
4. **CONTROL:** Creators own data, can export/delete anytime
5. **TRANSPARENCY:** Clear about what we collect
6. **ANONYMIZATION:** Benchmarks never identify individuals

### Creator Data Controls

```
┌─────────────────────────────────────────────────────────────┐
│ YOUR DATA SETTINGS                                          │
│                                                             │
│ WHO CAN SEE YOUR DATA:                                      │
│                                                             │
│ Your Brand Profile                                          │
│ ├── Public (anyone)              ○                          │
│ ├── AI Agents (via API)          ○                          │
│ ├── Brands (for matching)        ●                          │
│ └── Only You                     ○                          │
│                                                             │
│ Your Product Recommendations                                │
│ ├── Public (storefront)          ●                          │
│ ├── AI Agents (via API)          ●                          │
│ └── Only You                     ○                          │
│                                                             │
│ Contribute to Benchmarks (anonymized)?                      │
│ [Yes, help other creators] [No, keep private]               │
│                                                             │
│ ──────────────────────────────────────────────────────────  │
│                                                             │
│ [Download All My Data]                                      │
│ [Delete My Account]                                         │
│ [Revoke AI Agent Access]                                    │
└─────────────────────────────────────────────────────────────┘
```

### Technical Security Requirements

- [ ] Row-level security (PostgreSQL RLS)
- [ ] Encryption at rest
- [ ] HTTPS everywhere
- [ ] API rate limiting
- [ ] Admin access logging
- [ ] Data retention policy
- [ ] GDPR compliance
- [ ] Incident response plan

---

## 8. COMPETITIVE POSITIONING

### Landscape

| Competitor | What They Do | Limitation |
|------------|--------------|------------|
| LTK | Affiliate links for influencers | Manual linking, no AI |
| ShopMy | Creator storefronts | Self-reported, not extracted |
| Linktree | Link aggregation | No intelligence |
| Generic AI tools | LLM access | No creator-specific data |

### Velolume Differentiation

| Capability | Others | Velolume |
|------------|--------|----------|
| Product detection | Manual | Automatic (AI) |
| Matching accuracy | N/A | 100% (validated) |
| Content intelligence | No | Yes (75+ data points) |
| Machine-readable output | No | Yes (llms.txt, API) |
| Human gate | N/A | Yes (creator control) |
| Cross-creator insights | No | Yes (anonymized benchmarks) |

### Moat

1. **Data flywheel:** More creators → better patterns → better recommendations → more creators
2. **Extraction tech:** 80 category schemas, multi-model architecture
3. **First-mover in machine-readable creator data**
4. **Network effects from benchmark data**

---

## 9. ROADMAP

### Phase 1: Revenue MVP (Current)
**Goal:** Validate that creators make money

- [x] Product detection V2.0
- [x] Product matching V2.0
- [x] Affiliate integration
- [ ] Creator review UI
- [ ] Basic storefront
- [ ] First revenue test

### Phase 2: Machine-Readable Output
**Goal:** Make creator content AI-discoverable

- [ ] llms.txt generation for storefronts
- [ ] Schema.org structured data
- [ ] API for AI agent queries
- [ ] Creator attribution tracking

### Phase 3: Intelligence Layer
**Goal:** Help creators improve

- [ ] Brand kit auto-generation
- [ ] Benchmark scraping (manual first)
- [ ] Recommendation engine
- [ ] Content analytics dashboard

### Phase 4: Scale
**Goal:** Grow the platform

- [ ] Automated benchmark scraping
- [ ] Real-time trend detection
- [ ] Brand marketplace
- [ ] Agency partnerships
- [ ] Self-serve onboarding

---

## 10. METRICS & SUCCESS CRITERIA

### Phase 1 Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Product match accuracy | >90% | 100% ✅ |
| Videos processed | 100 | 1 |
| Creators onboarded | 5 | 0 |
| First affiliate revenue | >$0 | $0 |

### Phase 2 Metrics

| Metric | Target |
|--------|--------|
| AI agent queries | 1,000/month |
| Storefronts with llms.txt | 100% |
| API uptime | 99.9% |

### Phase 3 Metrics

| Metric | Target |
|--------|--------|
| Brand kits generated | 80% of creators |
| Recommendation acceptance rate | >50% |
| Creator retention (90-day) | >70% |

### North Star Metrics

1. **Creator Revenue:** Total affiliate earnings for creators
2. **Data Queries:** API calls from AI agents and brands
3. **Creator Retention:** % of creators active after 90 days

---

## APPENDIX

### A. Category Schemas (80 Total)

**Clothing:** Tops, Bottoms, Dresses, Outerwear, Activewear, Swimwear, Loungewear, Jumpsuits
**Footwear:** Sneakers, Heels, Flats, Boots, Sandals, Loafers, Slides, Mules
**Bags:** Totes, Crossbody, Clutches, Backpacks, Shoulder, Belt Bags, Mini Bags
**Accessories:** Hats, Scarves, Belts, Hair Accessories, Sunglasses, Socks, Wallets
**Jewelry:** Earrings, Necklaces, Bracelets, Rings, Watches, Anklets
**Beauty:** Lipstick, Foundation, Skincare, Fragrance, Nail Polish, Eye Makeup, Hair Products
**Tech:** Phone Cases, Headphones, Earbuds, Cameras, Tablets, Laptops, Speakers, Gaming, E-readers, Power Banks, Smart Speakers
**Home:** Candles, Mugs, Decor, Planters, Blankets, Pillows, Lamps, Rugs, Diffusers, Storage
**Stationery:** Notebooks, Planners, Pens, Journals, Desk Accessories
**Pet:** Collars, Leashes, Toys, Beds, Bowls
**Fitness:** Yoga Mats, Resistance Bands, Weights, Gym Bags, Water Bottles

### B. Affiliate Network Coverage

| Network | Retailers | Commission | Cookie |
|---------|-----------|------------|--------|
| Amazon Associates | Amazon | 1-10% | 24h |
| Skimlinks | 48,500+ | ~3% (after cut) | Varies |
| Involve Asia | Shopee, Lazada | 6-12% | 7 days |

### C. Multi-Model Architecture

| Task | Model | Cost/100 |
|------|-------|----------|
| Complex vision | GPT-4o | $0.38 |
| High-volume images | Gemini Flash | $0.004 |
| Text tasks | GPT-4o-mini | $0.01 |

**Result:** 57% cost reduction vs GPT-4o only

---

*This document is the source of truth for Velolume product development. Update as decisions are made and features ship.*
