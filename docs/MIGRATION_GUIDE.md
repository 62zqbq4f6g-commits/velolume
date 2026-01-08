# VELOLUME MIGRATION GUIDE
## Step-by-Step Instructions

---

## Overview

You are migrating the Velolume project from local Claude Code development to Replit. This guide ensures nothing is lost.

**What you have:** A complete extraction backend (products, hooks, affiliate links)
**What you need:** A UI to see it working + continued development

---

## Step 1: Backup Code to GitHub

**Send this to Claude Code (your current local session):**

```
Before we migrate to Replit, push ALL code to GitHub.

1. Create a new GitHub repository called "velolume"

2. Push EVERYTHING:
   - All /lib files (ai, extraction, matching, affiliate, google-shopping, scraper, types)
   - All /scripts files
   - package.json, tsconfig.json
   - Any .env.example (without real values)
   - Any test result JSON files

3. Create a .gitignore that excludes:
   - node_modules
   - .env
   - Any downloaded videos

4. Confirm the GitHub repo URL when done.

DO NOT skip any files. This is critical for migration.
```

**Wait for:** GitHub repo URL

---

## Step 2: Download Documentation Files

Download these 8 files from this conversation:
1. `PROJECT_STATE.md`
2. `CLAUDE.md`
3. `PRODUCT_VISION.md`
4. `PRD_v1.md`
5. `MIGRATION_CONTEXT.md`
6. `EXTRACTION_SCHEMA.md`
7. `VALUE_EXCHANGE.md`
8. `MIGRATION_GUIDE.md` (this file)

**Save them locally.** You'll add them to Replit.

---

## Step 3: Create Replit Project

1. Go to [replit.com](https://replit.com)
2. Click **Create Repl**
3. Choose **Import from GitHub**
4. Paste the GitHub repo URL from Step 1
5. Replit will auto-detect Node.js/TypeScript
6. Click **Import from GitHub**

**Wait for:** Project to import

---

## Step 4: Add Documentation to Replit

In Replit:
1. Create a `/docs` folder
2. Upload all 8 documentation files

---

## Step 5: Set Environment Variables

In Replit:
1. Click the **Secrets** tab (lock icon in left sidebar)
2. Add each secret:

| Key | Value |
|-----|-------|
| OPENAI_API_KEY | Your OpenAI API key |
| SERPAPI_KEY | Your SerpAPI key |
| DATABASE_URL | Your Neon PostgreSQL URL |
| DO_SPACES_KEY | Your DigitalOcean Spaces key |
| DO_SPACES_SECRET | Your DigitalOcean Spaces secret |
| DO_SPACES_BUCKET | velolume (or your bucket name) |
| DO_SPACES_REGION | sgp1 (or your region) |
| DO_SPACES_ENDPOINT | https://sgp1.digitaloceanspaces.com |
| REDIS_URL | Your Redis URL |

---

## Step 6: Install Dependencies

In Replit Shell:
```bash
npm install
```

Check if yt-dlp is available:
```bash
which yt-dlp
```

If not available, you may need to:
- Use a Replit that supports system packages
- Or use an alternative video download approach

---

## Step 7: Verify Extraction Works

Create a test file `/scripts/verify-migration.ts`:

```typescript
import { processVideo } from '../lib/ai/processor';

async function verify() {
  console.log('Testing video processing...');
  
  try {
    const result = await processVideo(
      'https://www.instagram.com/reel/DTLPmlajSQ5/'
    );
    
    console.log('✅ Processing complete');
    console.log('Products found:', result.products?.length || 0);
    console.log('Hook type:', result.hook?.type || 'unknown');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verify();
```

Run it:
```bash
npx ts-node scripts/verify-migration.ts
```

**Expected:** Products detected, hook classified

---

## Step 8: First Command to Replit Claude

Once everything is verified, start the Claude AI panel in Replit and send:

```
Read these files to understand the project:
1. /docs/CLAUDE.md (instructions)
2. /docs/PROJECT_STATE.md (current status)
3. /docs/PRD_v1.md (what to build)
4. /docs/EXTRACTION_SCHEMA.md (what we extract)
5. /docs/VALUE_EXCHANGE.md (why users upload)

This project was migrated from local development. The extraction backend is COMPLETE and VALIDATED:
- Product detection works (68 products across 11 videos)
- Hook extraction works (12 types, effectiveness scoring)
- Affiliate integration built

DO NOT rebuild extraction. It works.

CURRENT TASK: Build a simple UI page where I can:
1. Paste a video URL
2. Click "Analyze"
3. See results:
   - Products detected (thumbnails, confidence)
   - Hook analysis (type, effectiveness, transcript)
   - Video thumbnail

Start with a single page at /app/page.tsx. Use Next.js App Router + Tailwind.
```

---

## Step 9: Verify UI Works

Test the UI with a real video:
- `https://www.instagram.com/reel/DTLPmlajSQ5/`

You should see:
- Products detected with confidence scores
- Hook type and effectiveness
- Actual data from the extraction

---

## Troubleshooting

### yt-dlp not available
Try installing in Replit:
```bash
pip install yt-dlp
```

Or use a Nix package:
```nix
{ pkgs }: {
  deps = [
    pkgs.yt-dlp
  ];
}
```

### TypeScript errors
Run:
```bash
npm install typescript @types/node --save-dev
```

### Environment variables not loading
Make sure you're using `process.env.VARIABLE_NAME` and secrets are set in Replit Secrets (not .env file).

### Database connection fails
Check DATABASE_URL format:
```
postgresql://user:password@host:5432/database?sslmode=require
```

---

## What NOT to Do

❌ Don't rebuild the extraction pipeline — it's working
❌ Don't change the Claim<T> type structure — it's validated
❌ Don't skip the documentation files — they contain critical context
❌ Don't use mock data — always test with real videos
❌ Don't start features not in PRD_v1 without discussion

---

## What TO Do

✅ Verify extraction works first before building UI
✅ Use real videos for testing
✅ Update PROJECT_STATE.md after each session
✅ Follow the PRD_v1.md for MVP features
✅ Ask questions if something isn't clear

---

## Success Criteria

Migration is complete when:
- [ ] All code is in Replit
- [ ] All environment variables are set
- [ ] Extraction runs successfully on a real video
- [ ] You can see results in a UI
- [ ] Claude in Replit understands the project context

---

## Files Checklist

### From GitHub (code)
- [ ] /lib/ai/processor.ts
- [ ] /lib/extraction/hook-extractor.ts
- [ ] /lib/matching/product-matcher.ts
- [ ] /lib/types/product-claims.ts
- [ ] /lib/affiliate/
- [ ] /lib/google-shopping/
- [ ] /lib/scraper/
- [ ] /scripts/
- [ ] package.json
- [ ] tsconfig.json

### From This Conversation (docs) — 8 files
- [ ] /docs/PROJECT_STATE.md
- [ ] /docs/CLAUDE.md
- [ ] /docs/PRODUCT_VISION.md
- [ ] /docs/PRD_v1.md
- [ ] /docs/MIGRATION_CONTEXT.md
- [ ] /docs/EXTRACTION_SCHEMA.md
- [ ] /docs/VALUE_EXCHANGE.md
- [ ] /docs/MIGRATION_GUIDE.md
