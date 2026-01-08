# VELOLUME PRODUCT VISION
**Last Updated:** January 8, 2026
**Version:** 2.2

---

## Vision Statement

**Velolume is the machine-readable data hub for creators and brands — extracting intelligence from all content formats to power better content creation, AI discoverability, and monetization.**

We are a **Content Context Graph** that captures not just what's in content, but why it works, how it connects, and what should come next.

---

## What We Are (Corrected Understanding)

| We Are NOT | We ARE |
|------------|--------|
| Just a video analyzer | Machine-readable data hub for ALL content formats |
| Just hooks analysis | Complete content intelligence (8+ extraction dimensions) |
| Just for video scripts | Generation for ANY format (video, image, carousel, text, ads) |
| Just a creator tool | Platform for creators AND brands with shared data engine |

### Content Formats We Support

| Format | Source | Why It Matters |
|--------|--------|----------------|
| Short-form video | TikTok, Reels, Shorts | Highest engagement, richest signals |
| Long-form video | YouTube | Deep content, tutorials, reviews |
| Images | Instagram, Pinterest | Visual style extraction |
| Carousels | Instagram, LinkedIn | Multi-frame storytelling |
| Text posts | Twitter/X, LinkedIn, Threads | Writing style, messaging |
| Stories | IG/TikTok Stories | Ephemeral content patterns |
| Blog/Articles | Websites | Long-form writing style |
| Podcasts | Audio platforms | Voice and narrative style |

### Why "Machine-Readable" Is the Core

The internet is shifting from human-browsed to AI-queried:
- AI shopping agents recommend products
- AI assistants recommend creators
- AI search surfaces content

**Creators and brands that aren't machine-readable become invisible.**

We make them visible by converting unstructured content into structured data that AI can understand, query, and recommend.

---

## The Core Insight: Context Graphs for Content

### What is a Context Graph?

Traditional databases store facts: "This video has 10,000 views."
Knowledge graphs add relationships: "Creator X → Posted → Video Y → Contains → Product Z"
**Context graphs capture decision intelligence:** "This video performed because of [hook type + timing + emotion + trending sound], in the context of [creator's style + category trends + audience expectations], leading to [engagement pattern + conversion behavior]."

The key distinction from the Glean/Foundation Capital research:
- **"You can't reliably capture the why; you can capture the how."**
- The "why" (intent, reasoning) lives in people's heads
- The "how" (process, patterns, outcomes) leaves a digital trail
- By capturing enough "how", you can **infer** the "why" over time

### Applied to Content

| Enterprise Context Graph | Velolume Content Context Graph |
|--------------------------|--------------------------------|
| How work gets done | How content gets created & performs |
| Activity signals (edits, messages) | Content signals (hooks, formats, products) |
| Process traces | Content patterns + performance traces |
| Decision traces | "Why this content worked" traces |
| Relationship knowledge | Creator-Product-Brand-Audience relationships |

---

## What We're Building

### Layer 1: Content Graph (Entities + Relationships)

```
CREATOR ←──────────────────────────────→ BRAND
    │                                        │
    │ creates                                │ owns
    ↓                                        ↓
CONTENT ←─── features ───→ PRODUCT ←─── in catalog
    │                          │
    │ triggers                 │ drives
    ↓                          ↓
ENGAGEMENT               CONVERSION
    │                          │
    └────────── feeds ─────────┘
                 ↓
           PERFORMANCE TRACE
                 │
                 ↓
         PATTERN LEARNING
```

### Layer 2: Context Layer (Why Things Work)

For every content piece, we capture:
- **What happened:** Products, hooks, format, visuals, audio
- **How it performed:** Views, engagement, retention, conversion
- **Why it worked:** The combination of signals that led to performance
- **What it connects to:** Similar content, creator patterns, category benchmarks

### Layer 3: Decision Traces (Learning Over Time)

When we recommend → creator implements → outcome occurs → we capture the trace:
```
Recommendation: "Use controversy hook"
    → Creator used it: Yes
    → Performance: 2.3x baseline
    → Added to: Pattern learning
    → Future weight: Increased for this creator + category
```

---

## The Three Systems

### 1. System of Record (What Exists)
- Creator profiles with verified data
- Brand catalogs with product attributes
- Content library with full extraction
- Relationship graph (who features what)

### 2. System of Context (Why It Works)
- Performance correlation database
- Category benchmarks
- Pattern detection across content
- Decision traces from recommendations

### 3. System of Action (What To Do)
- Recommendations based on context
- Generation based on patterns
- Automation based on decision traces
- Feedback capture for learning

---

## User Value Propositions

### For Creators

| Pain | Context Graph Solution |
|------|------------------------|
| "Why did this video work?" | Decision trace: "Controversy hook + trending sound + 3s product reveal → 2.4x engagement vs your baseline" |
| "What should I create next?" | Pattern analysis: "Your audience engages most with POV hooks on Tuesdays. You haven't tried [format] which is trending in your niche." |
| "How do I create faster?" | Generation from patterns: "Here are 5 hooks in YOUR style based on what works for YOU" |
| "How do I make money?" | Relationship graph: Products → Affiliate links → Storefront → Auto-updated |
| "How do I get discovered?" | Machine-readable output: AI agents can query your content graph |

### For Brands

| Pain | Context Graph Solution |
|------|------------------------|
| "What content works in our category?" | Category context: "Tutorial format + problem hooks + 15-30s length → highest conversion in skincare" |
| "Who should we partner with?" | Relationship + performance: "Creators who feature similar products with high engagement and authentic style match" |
| "Who's talking about us?" | Graph query: All content → featuring → your products, with sentiment + context |
| "How do we create better content?" | Pattern transfer: "Top performers in your category use [patterns]. Generate content with these patterns for your brand." |

---

## Technical Architecture

### The Content Context Graph Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                            │
├─────────────────────────────────────────────────────────────┤
│  Creator Uploads    Brand Catalogs    Public Scraping       │
│  (their content)    (products)        (category intel)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTRACTION ENGINE                         │
├─────────────────────────────────────────────────────────────┤
│  Products + Evidence    Hooks + Emotion    Format + Style   │
│  Visual DNA             Audio DNA          Narrative        │
│  Performance Metrics    Engagement Signals                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONTEXT GRAPH                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ENTITIES           RELATIONSHIPS         CONTEXT           │
│  ─────────          ─────────────         ───────           │
│  • Creators         • Creates             • Performance     │
│  • Brands           • Features            • Timing          │
│  • Content          • Owns                • Trends          │
│  • Products         • Engages             • Benchmarks      │
│  • Audiences        • Converts            • Patterns        │
│                                                             │
│  DECISION TRACES                                            │
│  ────────────────                                           │
│  • Recommendation → Action → Outcome → Learning             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTELLIGENCE LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Pattern Detection      Performance Correlation             │
│  Benchmark Comparison   Trend Analysis                      │
│  Gap Detection          Prediction Models                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   OUTPUT LAYERS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RECOMMENDATIONS        GENERATION          DISTRIBUTION    │
│  ───────────────        ──────────          ────────────    │
│  • What to create       • Hook variants     • Storefronts   │
│  • When to post         • Full scripts      • AI profiles   │
│  • Who to target        • Visual concepts   • Media kits    │
│  • What to feature      • Tool integration  • APIs          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FEEDBACK LOOP                             │
├─────────────────────────────────────────────────────────────┤
│  Creator actions → Performance outcomes → Decision traces   │
│  Traces feed back into Context Graph for continuous learning│
└─────────────────────────────────────────────────────────────┘
```

---

## Defensive Moat Strategy

### The Existential Threats

| Threat | Risk Level | Our Defense |
|--------|------------|-------------|
| Platform AI (TikTok/IG/YouTube) | Medium | Cross-platform intelligence, creator-centric not platform-centric |
| Foundation models (Google/OpenAI) | Low-Medium | Proprietary data (decision traces, performance correlation), vertical focus |
| Existing tools (LTK/ShopMy) | Low | AI-native architecture, intelligence not just links |
| Content factories (KLING stack) | Low | We're the brain they need, complementary not competitive |
| Google Pomelli | Very Low | Different problem (brand assets vs content intelligence) |

### Building the Moat

**Moat 1: Proprietary Data (MOST IMPORTANT)**
| Data Asset | How We Get It | Why Defensible |
|------------|---------------|----------------|
| Performance correlation | Scrape public + user analytics | Takes time to accumulate |
| Decision traces | Our recommendations → outcomes | Only we see this |
| Category benchmarks | Continuous scraping at scale | Expensive to replicate |
| Style DNA profiles | Deep extraction from user content | Personalized, not generic |
| Content relationship graph | Relationships we build over time | Network effects |

**Moat 2: Network Effects**
```
More creators → More data → Better recommendations → More creators
```
Plus:
- Creator-brand relationships we facilitate
- Category benchmarks improve with more data
- Community knowledge becomes proprietary

**Moat 3: Integration Depth**
Deeply integrated into workflows:
- Storefront = their revenue source
- Analytics = their decision tool
- Generation = their creation tool
- Switching cost becomes high

**Moat 4: Speed + Time**
Data moat compounds. First mover + continuous accumulation = hard to catch.

### What We Should Do

✅ **Accumulate proprietary data** — Every upload, every recommendation, every outcome
✅ **Build network effects** — Creator-brand connections, community benchmarks
✅ **Integrate aggressively** — Be the brain for every tool stack
✅ **Go vertical** — Best-in-class for creators/brands, not horizontal for everyone
✅ **Move fast** — Data moat compounds with time

### What We Should NOT Do

❌ **Don't try to build everything** — Focus on intelligence, integrate for creation
❌ **Don't compete on generation** — Google/OpenAI will win raw generation
❌ **Don't ignore data accumulation** — Start capturing decision traces NOW
❌ **Don't stay horizontal** — Go deep on creators/brands specifically

---

## Competitive Intel: AI Content Factory Stack

Reference from market research (Noah Frydberg et al.):

| Layer | Tools | Gap We Fill |
|-------|-------|-------------|
| Video Creation | KLING 2.6, VEO 3 | No intelligence on WHAT to create |
| Scriptwriting | FastMoss + Gemini | Copies, doesn't understand patterns |
| Voice | ElevenLabs, Linah AI | Generic, not personalized |
| Avatar | HeyGen | Not creator's authentic style |
| Editing | Captions AI | No content strategy |
| Automation | N8N, Zapier, ReelFarm | Workflow, not intelligence |
| Tracking | FastMoss, TT Seller Center | Data, not insights |

**Our position:** We're the brain that directs these tools. We provide:
- What to create (based on context graph)
- Why it will work (based on decision traces)
- How to make it yours (based on style DNA)

---

## Success Metrics

### For the Platform
| Metric | Target | Why |
|--------|--------|-----|
| Recommendation accuracy | >70% lead to better performance | Proves context graph works |
| Decision traces captured | 10K+/month | Feeds learning loop |
| Pattern prediction accuracy | Improves over time | Shows system learns |

### For Creators
| Metric | Target | Why |
|--------|--------|-----|
| Revenue generated | Track per creator | Core value prop |
| Performance improvement | 20%+ after using recommendations | Proves intelligence |
| Time saved | 5+ hours/week | Efficiency value |

### For Brands
| Metric | Target | Why |
|--------|--------|-----|
| Content performance vs category | Top 30% | Proves intelligence |
| Creator match quality | 80%+ satisfaction | Proves relationship graph |
| AI discoverability | Measurable increase | Proves machine-readable value |

---

## Roadmap Summary

### Phase 1: Foundation (Built)
- Extraction engine (products, hooks, format)
- Evidence-backed claims
- Multi-platform support

### Phase 2: Context (Current)
- Performance data capture
- Category benchmarks
- Correlation database

### Phase 3: Intelligence (Next)
- Pattern detection
- Recommendation engine
- Decision trace capture

### Phase 4: Generation (Future)
- Hook/script generation
- Tool integration
- Personalized to style DNA

### Phase 5: Scale (Future)
- Self-improving from traces
- Full automation pipeline
- API for external tools

---

---

## Integration Strategy

### Core Philosophy

**Velolume is the intelligence layer.** We don't need to build every tool — we need to integrate with the tools creators and brands already use.

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VELOLUME CORE                            │
│                (Content Context Graph)                      │
│                                                             │
│   Extract → Correlate → Recommend → Generate                │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │  APIs   │          │Webhooks │          │   UI    │
    └─────────┘          └─────────┘          └─────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  AUTOMATION LAYER                           │
├─────────────────────────────────────────────────────────────┤
│   n8n    │   Zapier   │   Make   │   Native Automations    │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL TOOLS                             │
├─────────────────────────────────────────────────────────────┤
│ Content Creation  │  Distribution  │  Analytics  │  CRM    │
│ KLING, VEO        │  Social APIs   │  Platform   │  HubSpot│
│ ElevenLabs        │  Schedulers    │  Analytics  │  Notion │
│ Captions AI       │  Link-in-bio   │  GA4        │  Airtable│
└─────────────────────────────────────────────────────────────┘
```

### What We Expose

**Webhooks (Events):**
| Event | Payload | Use Case |
|-------|---------|----------|
| `video.analyzed` | Products, hooks, engagement | Trigger downstream actions |
| `products.detected` | Product list with confidence | Auto-add to storefront |
| `recommendation.generated` | Content recommendations | Create tasks/briefs |
| `benchmark.updated` | Category benchmark data | Weekly reports |
| `mention.detected` | Brand/product mention | Alert brand teams |

**APIs (Actions):**
| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `POST /analyze` | Submit video for analysis | Integrate into workflows |
| `GET /insights/{creator}` | Get creator insights | Dashboard integrations |
| `GET /benchmarks/{category}` | Get category benchmarks | Reporting tools |
| `POST /generate/hooks` | Generate hook variants | Content creation |
| `GET /storefront/{creator}` | Get storefront data | E-commerce integrations |

### Integration Roadmap

**Phase 1: API-First (MVP)**
- RESTful API for all core functions
- API keys for authentication
- Rate limiting and usage tracking
- Design events that can become webhooks

**Phase 2: Webhooks**
- Event-driven notifications
- Configurable webhook endpoints
- Retry logic and delivery confirmation
- Common workflow documentation

**Phase 3: Native Integrations**
- Official n8n node
- Zapier integration
- Make (Integromat) integration
- Pre-built workflow templates

**Phase 4: Native Automations**
- Built-in automation builder
- "If this, then that" rules
- Scheduled actions
- Premium feature tier

### Example User Workflows

**Creator: Auto-Storefront**
```
[New Instagram Post]
    → [Velolume: Analyze]
    → [Filter: Products detected?]
    → [Velolume: Add to Storefront]
    → [Slack: Notify creator]
```

**Creator: Content Calendar**
```
[Weekly Schedule]
    → [Velolume: Get Recommendations]
    → [Notion: Create content briefs]
    → [Calendar: Schedule reminders]
```

**Brand: Mention Monitoring**
```
[Velolume: Mention Detected]
    → [Filter: Positive sentiment?]
    → [Slack: Alert brand team]
    → [Airtable: Log to tracker]
    → [HubSpot: Create contact if new]
```

**Brand: Content Factory**
```
[Velolume: Category Trends]
    → [Filter: Trending format]
    → [Velolume: Generate Script]
    → [KLING: Create Video]
    → [Review Queue]
```

### Design Principles for Integration

1. **Events over polling** — Push data when things happen
2. **Granular permissions** — Users control what's exposed
3. **Idempotent operations** — Safe to retry
4. **Comprehensive payloads** — Include context, not just IDs
5. **Versioned APIs** — Don't break existing integrations

### Competitive Position

| Competitor Stack | Our Position |
|------------------|--------------|
| FastMoss + Gemini + KLING + n8n | We replace FastMoss (better intelligence) and enhance the rest |
| Manual research + creation | We automate intelligence, integrate with creation tools |
| Platform-native analytics | We provide cross-platform intelligence + action |

**Key differentiator:** Others provide data OR creation tools. We provide intelligence that DRIVES creation through integrations.

---

## Document History

- **v1.0 (Jan 7, 2026):** Initial vision, competitive positioning
- **v2.0 (Jan 8, 2026):** Incorporated Context Graph thinking from Glean/Foundation Capital research. Added decision traces, learning loops, three-system architecture.
- **v2.1 (Jan 8, 2026):** Added Integration Strategy section — webhooks, APIs, n8n/Zapier considerations, example workflows.
