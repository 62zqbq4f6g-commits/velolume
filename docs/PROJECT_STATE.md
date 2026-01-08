# VELOLUME PROJECT STATE
**Last Updated:** January 8, 2026
**Session:** 9

---

## 🎯 CURRENT FOCUS

Migrating to Replit for visual development. Building UI to see extraction results.

---

## ✅ COMPLETED (What Has Been Built)

### Infrastructure ✅
- [x] Video ingestion from 4 platforms (TikTok, Instagram, YouTube, Xiaohongshu)
- [x] Frame extraction with FFmpeg (12 frames distributed)
- [x] Audio transcription with Whisper (multi-language)
- [x] S3 storage integration (DigitalOcean Spaces)
- [x] PostgreSQL database (Neon)
- [x] Job queue (BullMQ + Redis)
- [x] yt-dlp integration for reliable video download

### Product Detection v2.1 ✅
- [x] Multi-product detection (5-15 products per video)
- [x] 80 category-specific attribute schemas
- [x] Evidence capture (frame timestamps, transcript mentions, bounding boxes)
- [x] Verification tiers (auto, auto_high, creator_confirmed, brand_verified, disputed)
- [x] Claim<T> wrapper for all extracted values

### Product Matching v2.1 ✅
- [x] Google Shopping integration via SerpAPI
- [x] Visual tiebreaker verification
- [x] Multi-model routing (GPT-4o + Gemini Flash)
- [x] 100% matching accuracy on 10-product test

### Hook Extraction v1.0 ✅
- [x] Adaptive hook windows (short-form 0-3s, long-form 0-15s)
- [x] 12 hook type classifications
- [x] 4-dimension effectiveness scoring
- [x] Evidence capture with Claim<T>

### Affiliate Integration ✅
- [x] Amazon Associates (direct)
- [x] Skimlinks (48,500+ merchants)
- [x] Involve Asia (Shopee/Lazada for SEA)
- [x] Routing logic with fallbacks

### Real Validation ✅
- [x] Tested on 11 real videos (TikTok, Instagram, YouTube)
- [x] 100% download success rate
- [x] 68 products detected across videos (avg 6.2/video)
- [x] Hook extraction working on short-form content

---

## 🔄 IN PROGRESS

| Item | Status | Notes |
|------|--------|-------|
| Replit migration | Starting | Need to transfer code + context |
| Simple UI | Next | See extraction results visually |
| Engagement scraping | Planned | Add views/likes/comments capture |
| Category benchmarks | Planned | Fashion, Beauty, Tech, Business |

---

## 📋 BUILD PRIORITIES (Next 2 Weeks)

### Week 1: Visual + Performance Data
1. **Migrate to Replit** — Transfer all code, verify working
2. **Build simple UI** — Upload URL → See results
3. **Add engagement scraping** — Capture views/likes/comments
4. **Verify full pipeline** — End-to-end test in new environment

### Week 2: Benchmarks + Correlation
1. **Category scraping** — 100 videos each: Fashion, Beauty, Tech, Business
2. **Build correlation database** — Hook type → engagement
3. **First insights** — "Do controversy hooks actually outperform?"
4. **Benchmark display** — "You're in top X% for [category]"

---

## 📁 KEY FILES

### Core Extraction
| File | Purpose | Status |
|------|---------|--------|
| `/lib/ai/processor.ts` | Product detection v2.1 | ✅ Complete |
| `/lib/extraction/hook-extractor.ts` | Hook extraction v1.0 | ✅ Complete |
| `/lib/matching/product-matcher.ts` | Product matching v2.1 | ✅ Complete |
| `/lib/types/product-claims.ts` | Claim<T>, Evidence, types | ✅ Complete |

### Infrastructure
| File | Purpose | Status |
|------|---------|--------|
| `/lib/scraper/video-scraper.ts` | Platform scrapers | ✅ Complete |
| `/lib/affiliate/` | Affiliate link generation | ✅ Complete |
| `/lib/google-shopping/` | Google Shopping API | ✅ Complete |

### Scripts
| File | Purpose | Status |
|------|---------|--------|
| `/scripts/real-validation-ytdlp.ts` | Real video validation | ✅ Complete |
| `/scripts/test-hook-extractor.ts` | Hook extraction tests | ✅ Complete |

### Documentation
| File | Purpose | Status |
|------|---------|--------|
| `/docs/PROJECT_STATE.md` | This file | ✅ Current |
| `/docs/CLAUDE.md` | Instructions for Claude | ✅ Current |
| `/docs/PRODUCT_VISION.md` | Strategic vision | ✅ Current |
| `/docs/PRD_v1.md` | MVP requirements | ✅ Current |
| `/docs/MIGRATION_CONTEXT.md` | Full context for Replit | ✅ Current |

---

## 🔧 ENVIRONMENT VARIABLES

```
# Required
OPENAI_API_KEY=
SERPAPI_KEY=

# Database
DATABASE_URL=

# Storage
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_BUCKET=
DO_SPACES_REGION=
DO_SPACES_ENDPOINT=

# Queue
REDIS_URL=

# Affiliate (when approved)
AMAZON_ASSOCIATE_ID=
SKIMLINKS_PUBLISHER_ID=
INVOLVE_ASIA_API_KEY=
```

---

## 📊 VALIDATION DATA

### 11 Video Test (Jan 7, 2026)
| Metric | Result |
|--------|--------|
| Download success | 100% (11/11) |
| Products detected | 68 total |
| Avg products/video | 6.2 |
| Hook effectiveness avg | 76/100 |

### 5 Niche Product Test
| Niche | Product | Confidence | Tier |
|-------|---------|------------|------|
| Fashion | Olive Green Cable Knit Sweater | 92% | auto_high |
| Beauty | Charlotte Tilbury Pillow Talk Lipstick | 88% | auto_high |
| Tech | Apple AirPods Pro | 95% | auto_high |
| Home | West Elm Mid-Century Table Lamp | 72% | auto |
| Fitness | Lululemon Align Leggings | 85% | auto_high |

---

## 💡 KEY DECISIONS

| Decision | Rationale | Date |
|----------|-----------|------|
| Context Graph architecture | Capture WHY content works, not just WHAT | Jan 8 |
| Claim<T> with evidence | Debuggable, trustworthy, improvable | Jan 7 |
| Google Shopping for matching | 100% vs 0% success rate (vs Google Lens) | Jan 6 |
| Multi-model routing | Best model per task, cost optimization | Jan 6 |
| Shared engine for creators + brands | Same core needs, different UI | Jan 7 |
| Migration to Replit | Need visual feedback during development | Jan 8 |

---

## ⚠️ KNOWN ISSUES

| Issue | Severity | Workaround |
|-------|----------|------------|
| YouTube long-form hooks = "unknown" | Medium | Need denser frame sampling in hook window |
| No UI for testing | High | Migration to Replit fixes this |
| Engagement data not captured | Medium | Adding to scraper next |

---

## 📝 SESSION LOG

### Session 9 — January 8, 2026

**Focus:** Context Graph research + Migration planning

**What was done:**
1. Researched Context Graph concept (Glean, Foundation Capital)
2. Incorporated context graph thinking into architecture
3. Created PRD v1 for MVP
4. Created migration documentation
5. Decision to move to Replit

**Key insight:**
- Context Graphs capture not just WHAT exists, but WHY things work
- Decision traces enable learning over time
- This is additive to what we built, not a change

**What's next:**
1. Execute migration to Replit
2. Build simple UI
3. Add engagement scraping
4. Test full pipeline

---

## 🚀 MIGRATION CHECKLIST

- [ ] Claude Code pushes all code to GitHub
- [ ] Download all documentation files
- [ ] Create Replit project (import from GitHub)
- [ ] Add environment variables in Replit
- [ ] Add docs to /docs folder
- [ ] Verify extraction pipeline works
- [ ] Build simple UI
- [ ] Test with real video
