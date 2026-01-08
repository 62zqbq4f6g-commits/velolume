# VELOLUME CONTENT EXTRACTION SCHEMA
## Complete Analysis Framework

**Last Updated:** January 8, 2026

---

## Overview

Velolume extracts intelligence from ALL content formats to build a machine-readable data hub. This document defines every dimension we analyze.

---

## Content Formats Supported

| Format | Source | Extraction Approach |
|--------|--------|---------------------|
| Short-form video | TikTok, Reels, Shorts | Full pipeline (visual + audio + text) |
| Long-form video | YouTube | Full pipeline with chapters |
| Images | Instagram posts, Pinterest | Visual analysis |
| Carousels | Instagram, LinkedIn | Multi-image sequence analysis |
| Text posts | Twitter/X, LinkedIn, Threads | Text analysis |
| Stories | IG/TikTok Stories | Ephemeral content capture |
| Live clips | Live stream highlights | Real-time extraction |
| Blog/Articles | Website content | Text + image analysis |
| Podcasts | Audio platforms | Audio transcription + analysis |

---

## Extraction Dimensions

### 1. HOOK ANALYSIS
*What captures attention in the first moments*

```typescript
interface HookAnalysis {
  // Basic classification
  type: HookType;
  window: { start: number; end: number }; // seconds or position
  
  // Content
  transcript?: string;
  textOverlay?: string;
  visualDescription: string;
  audioHook?: string; // trending sound, music, tone
  
  // Deeper analysis
  emotion: {
    primary: EmotionType; // curiosity, fear, desire, FOMO, humor, shock, belonging
    intensity: number; // 0-100
  };
  
  specificity: {
    score: number; // 0-100
    signals: {
      hasNumbers: boolean;
      hasTimeframe: boolean;
      hasPrice: boolean;
      hasOutcome: boolean;
      hasPersonalStake: boolean;
    };
  };
  
  valueProposition: {
    clarity: number; // 0-100
    promise: string; // What viewer will get
    targetAudience?: string;
    stakes?: string; // What's at risk
  };
  
  patternInterrupt: {
    type: 'visual' | 'audio' | 'text' | 'movement' | 'unexpected';
    description: string;
    strength: number; // 0-100
  };
  
  // Evidence
  evidence: Evidence[];
  confidence: number;
}

type HookType =
  | 'question'
  | 'statement'
  | 'pov'
  | 'controversy'
  | 'teaser'
  | 'listicle'
  | 'problem'
  | 'visual_hook'
  | 'trend_sound'
  | 'story'
  | 'result_first'
  | 'direct_value'
  | 'social_proof'
  | 'challenge';
```

---

### 2. STRUCTURE ANALYSIS
*How the content is organized and paced*

```typescript
interface StructureAnalysis {
  // Overall format
  format: ContentFormat;
  duration?: number; // seconds (for video/audio)
  segmentCount?: number; // for carousels, chapters
  
  // Pacing
  pacing: {
    overall: 'slow' | 'medium' | 'fast' | 'variable';
    cutsPerSecond?: number; // video
    wordsPerMinute?: number; // speech
    energyVariation: number; // 0-100, how much energy changes
  };
  
  // Narrative structure
  narrative: {
    arc: NarrativeArc;
    openLoops: OpenLoop[]; // Questions raised
    payoffTiming: number; // When value delivers (0-100% through)
    callbacksToHook: boolean; // Does ending connect to opening?
  };
  
  // Sections (for longer content)
  sections?: ContentSection[];
  
  // CTA analysis
  cta: {
    present: boolean;
    type?: 'follow' | 'like' | 'comment' | 'share' | 'link' | 'subscribe' | 'buy';
    placement?: number; // 0-100% through content
    strength: number; // 0-100
  };
  
  evidence: Evidence[];
  confidence: number;
}

type ContentFormat =
  | 'tutorial'
  | 'review'
  | 'grwm' // Get Ready With Me
  | 'haul'
  | 'unboxing'
  | 'story_time'
  | 'day_in_life'
  | 'transformation'
  | 'comparison'
  | 'listicle'
  | 'rant'
  | 'reaction'
  | 'duet'
  | 'trend'
  | 'educational'
  | 'entertainment'
  | 'promotional'
  | 'behind_scenes';

type NarrativeArc =
  | 'linear' // A → B → C
  | 'problem_solution'
  | 'transformation' // Before → After
  | 'journey' // Start → Obstacles → Resolution
  | 'reveal' // Build up → Big reveal
  | 'listicle' // Item 1, 2, 3...
  | 'circular'; // Ends where it started

interface OpenLoop {
  question: string;
  raisedAt: number; // timestamp or position
  resolvedAt?: number;
  resolved: boolean;
}

interface ContentSection {
  title?: string;
  start: number;
  end: number;
  purpose: 'hook' | 'context' | 'value' | 'cta' | 'entertainment';
}
```

---

### 3. VISUAL ANALYSIS
*What it looks like*

```typescript
interface VisualAnalysis {
  // Overall style
  style: {
    aesthetic: VisualAesthetic[];
    productionQuality: 'lo-fi' | 'medium' | 'polished' | 'professional';
    consistency: number; // 0-100, how consistent is visual style
  };
  
  // Color profile
  colors: {
    dominant: string[]; // hex codes
    palette: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted';
    contrast: 'low' | 'medium' | 'high';
    brandAlignment?: number; // 0-100, if brand colors known
  };
  
  // Composition
  composition: {
    primarySubject: 'person' | 'product' | 'text' | 'environment' | 'mixed';
    facePresence: number; // 0-100, % of time face visible
    faceExpressions?: string[]; // detected emotions
    framing: 'close-up' | 'medium' | 'wide' | 'mixed';
    movement: 'static' | 'handheld' | 'smooth' | 'dynamic';
  };
  
  // Text overlays
  textOverlays: {
    present: boolean;
    frequency: 'none' | 'minimal' | 'moderate' | 'heavy';
    style?: 'captions' | 'titles' | 'callouts' | 'mixed';
    readability: number; // 0-100
  };
  
  // Thumbnails / First frame
  thumbnail: {
    hasFace: boolean;
    hasText: boolean;
    hasProduct: boolean;
    emotionalTrigger?: string;
    clickability: number; // 0-100
  };
  
  // Transitions & effects
  effects: {
    transitionStyle: 'cuts' | 'fades' | 'swipes' | 'effects' | 'none';
    filtersUsed: boolean;
    speedChanges: boolean; // slow-mo, speed-up
  };
  
  evidence: Evidence[];
  confidence: number;
}

type VisualAesthetic =
  | 'minimalist'
  | 'maximalist'
  | 'clean'
  | 'chaotic'
  | 'professional'
  | 'casual'
  | 'aesthetic'
  | 'raw'
  | 'cinematic'
  | 'vlog'
  | 'meme'
  | 'editorial';
```

---

### 4. AUDIO ANALYSIS
*What it sounds like*

```typescript
interface AudioAnalysis {
  // Voice
  voice?: {
    present: boolean;
    type: 'speaking' | 'voiceover' | 'conversation' | 'none';
    tone: VoiceTone[];
    energy: 'low' | 'medium' | 'high' | 'variable';
    pace: 'slow' | 'medium' | 'fast';
    clarity: number; // 0-100
    
    // For voice cloning / generation
    characteristics?: {
      pitch: 'low' | 'medium' | 'high';
      texture: 'smooth' | 'raspy' | 'warm' | 'bright';
      accent?: string;
    };
  };
  
  // Music
  music?: {
    present: boolean;
    type: 'trending' | 'original' | 'licensed' | 'none';
    trendingSound?: {
      id: string;
      name: string;
      currentPopularity: number; // 0-100
    };
    mood: MusicMood[];
    tempo: 'slow' | 'medium' | 'fast' | 'variable';
    prominence: 'background' | 'featured' | 'dominant';
  };
  
  // Sound effects
  soundEffects: {
    present: boolean;
    types?: ('transitions' | 'emphasis' | 'comedy' | 'reactions')[];
    frequency: 'none' | 'minimal' | 'moderate' | 'heavy';
  };
  
  // Overall audio quality
  quality: {
    clarity: number; // 0-100
    balance: number; // voice vs music balance
    professional: boolean;
  };
  
  evidence: Evidence[];
  confidence: number;
}

type VoiceTone =
  | 'conversational'
  | 'enthusiastic'
  | 'calm'
  | 'authoritative'
  | 'friendly'
  | 'sarcastic'
  | 'educational'
  | 'storytelling'
  | 'urgent';

type MusicMood =
  | 'upbeat'
  | 'chill'
  | 'dramatic'
  | 'emotional'
  | 'funny'
  | 'inspiring'
  | 'edgy'
  | 'nostalgic';
```

---

### 5. PRODUCT ANALYSIS
*What's featured and how*

```typescript
interface ProductAnalysis {
  products: ProductMention[];
  
  // Overall product integration
  integration: {
    style: 'organic' | 'featured' | 'sponsored' | 'review' | 'haul';
    prominence: 'subtle' | 'moderate' | 'central';
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  };
  
  // For affiliate/commerce
  commerceSignals: {
    purchaseIntent: number; // 0-100, likelihood viewers want to buy
    priceDiscussion: boolean;
    whereToBuy: boolean;
    discountMentioned: boolean;
  };
}

interface ProductMention {
  // Core identification
  product: Claim<ProductData>;
  
  // Context of mention
  context: {
    timestamp?: number;
    position?: number; // for images/carousels
    duration?: number; // how long featured
    framing: 'recommendation' | 'review' | 'casual' | 'comparison' | 'tutorial';
  };
  
  // Sentiment
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    aspects?: { aspect: string; sentiment: string }[];
  };
  
  // Matching (for affiliate)
  matching?: {
    matchedProduct?: MatchedProduct;
    affiliateLink?: string;
    verificationTier: VerificationTier;
  };
}
```

---

### 6. PERFORMANCE ANALYSIS
*How it performed (when available)*

```typescript
interface PerformanceAnalysis {
  // Raw metrics
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    watchTime?: number; // average seconds
    completionRate?: number; // 0-100%
  };
  
  // Calculated rates
  rates: {
    engagementRate?: number; // (likes + comments + shares) / views
    likeRate?: number;
    commentRate?: number;
    shareRate?: number;
    saveRate?: number;
  };
  
  // Context
  context: {
    capturedAt: Date;
    ageAtCapture: number; // hours since posted
    platform: Platform;
    creatorFollowers?: number;
  };
  
  // Benchmarking (when available)
  benchmark?: {
    vsCreatorAvg: number; // % above/below their average
    vsCategoryAvg: number; // % above/below category
    percentile: number; // 0-100, where they rank
  };
}
```

---

### 7. AUDIENCE SIGNALS
*Who engages and how*

```typescript
interface AudienceAnalysis {
  // Comment analysis
  comments?: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    themes: string[]; // common topics in comments
    questions: string[]; // questions asked
    purchaseIntent: number; // 0-100, "where to buy?" signals
    engagement: 'low' | 'medium' | 'high'; // reply rate, conversation depth
  };
  
  // Inferred audience
  inferredAudience?: {
    demographics?: string[]; // if inferable from content/comments
    interests: string[];
    painPoints: string[];
  };
}
```

---

### 8. CREATOR/BRAND DNA
*Aggregated patterns across content*

```typescript
interface CreatorDNA {
  // Identity
  identity: {
    id: string;
    type: 'creator' | 'brand';
    handles: { platform: Platform; handle: string }[];
    niche: string[];
    subNiche?: string[];
  };
  
  // Style fingerprint (aggregated from content)
  style: {
    visual: {
      dominantAesthetics: VisualAesthetic[];
      colorPalette: string[];
      productionLevel: string;
    };
    audio: {
      voiceCharacteristics?: object;
      musicPreferences: MusicMood[];
      usesTrendingSounds: boolean;
    };
    writing: {
      tone: VoiceTone[];
      vocabularyLevel: 'simple' | 'moderate' | 'advanced';
      sentenceStyle: 'short' | 'medium' | 'long' | 'varied';
      emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
    };
  };
  
  // Content patterns
  patterns: {
    preferredFormats: ContentFormat[];
    preferredHookTypes: HookType[];
    avgDuration?: number;
    postingFrequency?: number; // posts per week
    bestPerformingPatterns: Pattern[];
    underusedPatterns: Pattern[]; // opportunities
  };
  
  // Performance baseline
  baseline: {
    avgViews: number;
    avgEngagement: number;
    topPerformers: string[]; // content IDs
    growthTrend: 'declining' | 'stable' | 'growing';
  };
  
  // Products/brands
  productAffinity: {
    categories: string[];
    brands: string[];
    priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
  };
}

interface Pattern {
  description: string;
  elements: string[]; // what makes up this pattern
  performanceImpact: number; // % above/below baseline
  frequency: number; // how often they use it
}
```

---

## Machine-Readable Outputs

All extracted data feeds into machine-readable formats:

### llms.txt
For AI agents to query creator/brand profiles

### discovery.json
For AI shopping agents to find products

### Schema.org JSON-LD
For search engines and structured data

### API
For integrations with other tools

---

## Extraction Pipeline

```
CONTENT INPUT (any format)
        │
        ▼
┌─────────────────────────────────────────┐
│           FORMAT DETECTION              │
│   Identify: video/image/carousel/text   │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│           DECOMPOSITION                 │
│   Extract: frames, audio, text, meta    │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│         PARALLEL EXTRACTION             │
├─────────────────────────────────────────┤
│ Hook │ Structure │ Visual │ Audio │ ... │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│           SYNTHESIS                     │
│   Combine into unified content profile  │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│         AGGREGATION (over time)         │
│   Update Creator/Brand DNA              │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│       MACHINE-READABLE OUTPUT           │
│   llms.txt, discovery.json, Schema.org  │
└─────────────────────────────────────────┘
```

---

## What This Enables

| Feature | Powered By |
|---------|------------|
| "Why did this work?" | All extraction dimensions + performance correlation |
| "What should I create?" | Patterns + benchmarks + gaps |
| "Generate in my style" | Creator DNA (visual + audio + writing) |
| "Find me products" | Product analysis + matching |
| "Make me discoverable" | Machine-readable outputs |
| "Find creators for my brand" | Creator DNA + product affinity |
| "What works in my category" | Category benchmarks from aggregated data |
