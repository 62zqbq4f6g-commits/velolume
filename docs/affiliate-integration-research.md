# Affiliate Integration Research

## Executive Summary

This document analyzes how to convert Google Shopping product URLs into affiliate links for monetization. We evaluate two approaches:

1. **Direct Integration**: Join individual affiliate networks per retailer
2. **Auto-Conversion**: Use aggregator services like Skimlinks

**Recommendation**: Start with **Skimlinks** for rapid deployment, then add direct integrations for high-volume retailers (Amazon, Walmart) to maximize commissions.

---

## Part 1: Retailer → Affiliate Network Mapping

### US Retailers

| Retailer | Affiliate Network | Commission | Cookie Duration | Approval |
|----------|------------------|------------|-----------------|----------|
| **Amazon** | Amazon Associates | 1-10% (category-dependent) | 24 hours | Easy |
| **Walmart** | Impact | 1-4% | 3 days | Moderate |
| **Target** | Impact | 0-8% (category-dependent) | 7 days | Moderate |
| **Nordstrom** | Rakuten / Impact | 1-11% | 14 days | Moderate |
| **Macy's** | CJ Affiliate / Rakuten | 3-6% | 10 days | Moderate |
| **Best Buy** | Impact | 0.5-7% | 1 day | Moderate |
| **Nike** | Awin / Impact | 5-11% | 30 days | Selective |
| **Sephora** | Rakuten | 5-10% | 24 hours | Selective |
| **Ulta** | Rakuten | 2-5% | 7 days | Moderate |

### International Retailers

| Retailer | Affiliate Network | Commission | Cookie Duration | Region |
|----------|------------------|------------|-----------------|--------|
| **ASOS** | Awin | 3-7% | 45 days | UK/Global |
| **Shopee** | Involve Asia | Up to 12% | 7 days | SEA |
| **Lazada** | Involve Asia | Up to 12% | 7 days | SEA |
| **Zalando** | Awin | 6-8% | 30 days | EU |
| **Farfetch** | CJ Affiliate | 5-10% | 30 days | Global |

### Commission Rates by Category (Amazon)

| Category | Commission Rate |
|----------|----------------|
| Luxury Beauty | 10% |
| Amazon Fresh | 10% |
| Fashion (Women, Men, Kids) | 4% |
| Shoes, Handbags, Accessories | 4% |
| Furniture, Home, Garden | 8% |
| Electronics | 1% |
| Video Games | 1% |

---

## Part 2: Link Conversion Methods

### Method 1: Direct API Integration

#### Amazon Product Advertising API (PA-API 5.0)

**Endpoint**: `webservices.amazon.com/paapi5/getitems`

**Request**:
```javascript
const params = {
  PartnerTag: "velolume-20",
  PartnerType: "Associates",
  ItemIds: ["B08N5WRWNW"], // ASIN
  Resources: ["ItemInfo.Title", "Offers.Listings.Price"]
};
```

**Response includes affiliate link**:
```json
{
  "DetailPageURL": "https://www.amazon.com/dp/B08N5WRWNW?tag=velolume-20"
}
```

**Pros**: Full product data, real-time pricing, official support
**Cons**: Requires approval, rate limits (1 req/sec), complex setup

#### Impact Partner API (Walmart, Target)

**Link Generation**:
```
https://goto.walmart.com/c/{PUBLISHER_ID}/1?subId1={SUB_ID}&u={ENCODED_PRODUCT_URL}
```

**Example**:
```javascript
const affiliateLink = `https://goto.walmart.com/c/1234567/1?subId1=ootd-video-123&u=${encodeURIComponent(productUrl)}`;
```

**Pros**: Simple URL structure, no API needed for basic linking
**Cons**: Need to extract deep link from Google Shopping first

### Method 2: URL Parameter Appending

For most affiliate programs, you can append tracking parameters:

```javascript
// Amazon
const amazonAffiliate = (url) => {
  const parsed = new URL(url);
  parsed.searchParams.set('tag', 'velolume-20');
  return parsed.toString();
};

// Generic with subId tracking
const genericAffiliate = (url, publisherId, subId) => {
  return `https://goto.target.com/c/${publisherId}/1?subId1=${subId}&u=${encodeURIComponent(url)}`;
};
```

### Method 3: Product ID Extraction + Deep Link

1. Extract retailer and product ID from Google Shopping URL
2. Construct canonical product URL
3. Apply affiliate parameters

```javascript
function convertToAffiliate(googleShoppingUrl, matchedProduct) {
  const { retailer, productId, productUrl } = matchedProduct;

  switch (retailer) {
    case 'amazon':
      // Extract ASIN, construct affiliate link
      return `https://amazon.com/dp/${productId}?tag=velolume-20`;

    case 'walmart':
      return `https://goto.walmart.com/c/PUBID/1?u=${encodeURIComponent(productUrl)}`;

    case 'target':
      return `https://goto.target.com/c/PUBID/1?u=${encodeURIComponent(productUrl)}`;

    default:
      return productUrl; // Fallback to Skimlinks auto-conversion
  }
}
```

---

## Part 3: Auto-Conversion Services

### Skimlinks (Recommended for MVP)

**Overview**: Automatic affiliate link conversion covering 48,500+ merchants globally.

**How It Works**:
1. Add JavaScript snippet to site
2. Skimlinks automatically converts outbound links to affiliate links
3. Handles all merchant relationships, tracking, and payments

**Integration**:
```html
<script type="text/javascript">
  var skimlinks_domain = "velolume.com";
  var skimlinks_publisherId = "YOUR_PUBLISHER_ID";
</script>
<script src="https://s.skimresources.com/js/YOUR_PUBLISHER_ID.skimlinks.js"></script>
```

**Server-Side Link Conversion API**:
```javascript
// POST to Skimlinks Merchant API
const response = await fetch('https://api.skimlinks.com/v3/link', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.walmart.com/ip/product/123456',
    publisher_id: 'YOUR_PUBLISHER_ID'
  })
});

const { affiliate_url } = await response.json();
```

**Pricing**:
| Tier | Revenue Share |
|------|---------------|
| Standard | 25% of commission |
| Premium (high volume) | 20% of commission |
| Enterprise | Negotiable |

**Covered Retailers**:
- All major US retailers (Amazon*, Walmart, Target, etc.)
- All major fashion retailers (Nordstrom, ASOS, Zara, etc.)
- 48,500+ merchants globally

*Note: Amazon excluded in some regions due to policy restrictions

**Pros**:
- Instant coverage of nearly all retailers
- Single payment source
- No individual approvals needed
- Automatic link health monitoring
- Cross-device tracking

**Cons**:
- 25% revenue share reduces earnings
- Less control over individual relationships
- Amazon coverage varies by region

### VigLink (Sovrn Commerce)

**Similar to Skimlinks with**:
- 70,000+ merchant coverage
- 25-30% revenue share
- Automatic link conversion
- Real-time reporting

**Integration**:
```html
<script type="text/javascript">
  var defined_vgvld = '123456';
  var defined_vgiid = 'YOUR_API_KEY';
</script>
<script src="//www.viglink.com/api/vglnk.js"></script>
```

### Comparison: Skimlinks vs VigLink

| Feature | Skimlinks | VigLink |
|---------|-----------|---------|
| Merchants | 48,500+ | 70,000+ |
| Revenue Share | 25% | 25-30% |
| API Access | Yes | Yes |
| Real-time Reporting | Yes | Yes |
| Amazon Coverage | Limited | Limited |
| Fashion Focus | Strong | Moderate |

---

## Part 4: Technical Integration Path

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Velolume Product Links                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Link Router Logic    │
                    │                       │
                    │ 1. Check retailer     │
                    │ 2. Route to handler   │
                    └───────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Direct (High   │   │  Skimlinks API  │   │   Fallback      │
│  Volume)        │   │  (Everything    │   │   (Raw URL)     │
│                 │   │   Else)         │   │                 │
│  - Amazon API   │   │                 │   │  Track for      │
│  - Walmart API  │   │  48,500+        │   │  optimization   │
│  - Target API   │   │  merchants      │   │                 │
└─────────────────┘   └─────────────────┘   └─────────────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                ▼
                    ┌───────────────────────┐
                    │   Tracking Layer      │
                    │                       │
                    │ - Video ID           │
                    │ - Product position   │
                    │ - Click timestamp    │
                    │ - Conversion tracking│
                    └───────────────────────┘
```

### Phase 1: MVP (Skimlinks Only)

**Implementation**:

```typescript
// lib/affiliate/skimlinks.ts

interface AffiliateLink {
  originalUrl: string;
  affiliateUrl: string;
  retailer: string;
  trackingId: string;
}

export async function convertToAffiliate(
  productUrl: string,
  metadata: {
    videoId: string;
    productIndex: number;
    retailer: string;
  }
): Promise<AffiliateLink> {
  const trackingId = `${metadata.videoId}-${metadata.productIndex}`;

  // Use Skimlinks Link API
  const response = await fetch('https://api.skimlinks.com/link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SKIMLINKS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: productUrl,
      xs: trackingId, // Custom tracking parameter
      publisher_id: process.env.SKIMLINKS_PUBLISHER_ID
    })
  });

  const { url: affiliateUrl } = await response.json();

  return {
    originalUrl: productUrl,
    affiliateUrl,
    retailer: metadata.retailer,
    trackingId
  };
}
```

**Effort**: ~1 day
**Revenue**: Commission - 25% (Skimlinks share)

### Phase 2: Direct Integration for Top Retailers

Add direct integrations for highest-volume retailers:

```typescript
// lib/affiliate/router.ts

import { convertViaSkimlinks } from './skimlinks';
import { convertAmazon } from './amazon';
import { convertWalmart } from './walmart';
import { convertTarget } from './target';

const DIRECT_HANDLERS: Record<string, Function> = {
  'amazon.com': convertAmazon,
  'walmart.com': convertWalmart,
  'target.com': convertTarget,
};

export async function convertToAffiliate(
  productUrl: string,
  metadata: AffiliateMetadata
): Promise<AffiliateLink> {
  // Extract domain
  const domain = new URL(productUrl).hostname.replace('www.', '');

  // Check for direct handler (higher commission)
  const directHandler = DIRECT_HANDLERS[domain];
  if (directHandler) {
    try {
      return await directHandler(productUrl, metadata);
    } catch (error) {
      console.error(`Direct handler failed for ${domain}, falling back to Skimlinks`);
    }
  }

  // Fallback to Skimlinks (handles everything else)
  return convertViaSkimlinks(productUrl, metadata);
}
```

**Effort**: ~1 week (per retailer API integration)
**Revenue**: Full commission (no aggregator cut)

### Phase 3: Analytics & Optimization

Track performance to optimize:

```typescript
// lib/affiliate/analytics.ts

interface AffiliateEvent {
  eventType: 'click' | 'conversion';
  videoId: string;
  productIndex: number;
  retailer: string;
  revenue?: number;
  timestamp: Date;
}

export async function trackAffiliateEvent(event: AffiliateEvent) {
  // Store in analytics database
  await db.affiliateEvents.create({
    data: event
  });

  // If conversion, update video/product stats
  if (event.eventType === 'conversion') {
    await updateConversionStats(event);
  }
}

// Dashboard query: Revenue by retailer
const revenueByRetailer = await db.affiliateEvents.groupBy({
  by: ['retailer'],
  where: { eventType: 'conversion' },
  _sum: { revenue: true }
});
```

---

## Part 5: Revenue Projections

### Assumptions
- 1,000 videos/month processed
- 5 products matched per video
- 20% click-through rate on matched products
- 3% conversion rate on clicks
- $50 average order value

### Calculations

| Metric | Value |
|--------|-------|
| Products shown | 5,000/month |
| Clicks | 1,000/month |
| Conversions | 30/month |
| GMV | $1,500/month |
| Commission (4% avg) | $60/month |
| After Skimlinks (25%) | $45/month |

### Scaling Projections

| Videos/Month | GMV | Commission | After Skimlinks | With Direct (top 3) |
|--------------|-----|------------|-----------------|---------------------|
| 1,000 | $1,500 | $60 | $45 | $54 |
| 10,000 | $15,000 | $600 | $450 | $540 |
| 100,000 | $150,000 | $6,000 | $4,500 | $5,400 |

*Direct integration for Amazon/Walmart/Target saves ~20% of Skimlinks cut on those retailers*

---

## Part 6: Implementation Checklist

### Immediate (Week 1)
- [ ] Apply for Skimlinks account
- [ ] Integrate Skimlinks Link API
- [ ] Add affiliate links to product match results
- [ ] Deploy basic tracking

### Short-term (Month 1)
- [ ] Apply for Amazon Associates
- [ ] Apply for Impact (Walmart/Target)
- [ ] Implement direct Amazon link conversion
- [ ] Add conversion tracking pixels

### Medium-term (Quarter 1)
- [ ] Implement direct Walmart integration
- [ ] Implement direct Target integration
- [ ] Build affiliate analytics dashboard
- [ ] A/B test link placements

### Long-term (Year 1)
- [ ] Expand direct integrations to top 10 retailers
- [ ] Negotiate premium Skimlinks rates (20%)
- [ ] Implement dynamic commission routing
- [ ] Add international retailer coverage

---

## Recommendation

### Start with Skimlinks

**Why**:
1. **Speed**: Integration in <1 day vs weeks for individual networks
2. **Coverage**: 48,500 merchants means nearly 100% of our matches are covered
3. **Simplicity**: Single API, single payment, single dashboard
4. **Risk**: Validate the model before investing in direct integrations

### Then Optimize

Once we have data on which retailers drive the most conversions:
1. Apply for direct programs with top 3 retailers
2. Route those retailers directly (save 25% commission share)
3. Keep Skimlinks for long-tail retailers

### Technical Implementation

```typescript
// Immediate implementation
const affiliateLink = await convertViaSkimlinks(matchedProduct.url, {
  videoId: video.id,
  productIndex: i,
  retailer: matchedProduct.retailer
});

// Store in match result
matchedProduct.affiliateUrl = affiliateLink;
matchedProduct.trackingId = `${video.id}-${i}`;
```

This approach gives us:
- Monetization from day 1
- Data to optimize later
- Minimal engineering investment
- Maximum retailer coverage
