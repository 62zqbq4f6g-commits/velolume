/**
 * Category Schemas v5.0
 *
 * Comprehensive product attribute schemas for the Velolume matching pipeline.
 * Each schema defines attributes, deal-breakers, weights, and extraction prompts.
 *
 * Categories (80 schemas):
 * - CLOTHING (9): Tops, Bottoms, Dresses, Outerwear, Activewear, Swimwear, Lingerie, Loungewear, Jumpsuits
 * - FOOTWEAR (8): Sneakers, Heels, Flats, Boots, Sandals, Loafers, Slides, Mules
 * - BAGS (7): Totes, Crossbody, Clutches, Backpacks, Shoulder, Belt Bags, Mini Bags
 * - JEWELRY (6): Earrings, Necklaces, Bracelets, Rings, Watches, Anklets
 * - ACCESSORIES (7): Hats, Scarves, Belts, Hair Accessories, Sunglasses, Socks, Wallets
 * - BEAUTY (7): Lipstick, Foundation, Skincare, Fragrance, Nail Polish, Eye Makeup, Hair Products
 * - TECH (11): Phone Cases, Headphones, Earbuds, Cameras, Tablets, Laptops, Speakers, Gaming, E-readers, Power Banks, Smart Speakers
 * - HOME (10): Candles, Mugs, Decor, Planters, Blankets, Pillows, Lamps, Rugs, Diffusers, Storage
 * - STATIONERY (5): Notebooks, Planners, Pens, Journals, Desk Accessories
 * - PET (5): Collars, Leashes, Pet Toys, Pet Beds, Pet Bowls
 * - FITNESS (5): Yoga Mats, Resistance Bands, Weights, Gym Bags, Water Bottles
 *
 * @module lib/matching/category-schemas
 */

// ============================================================================
// TYPES
// ============================================================================

export type ProductCategory =
  | "Clothing"
  | "Footwear"
  | "Bags"
  | "Jewelry"
  | "Accessories"
  | "Beauty"
  | "Tech"
  | "Home"
  | "Stationery"
  | "Pet"
  | "Fitness";

export type ClothingSubcategory =
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Outerwear"
  | "Activewear"
  | "Swimwear"
  | "Loungewear"
  | "Sleepwear"
  | "Lingerie"
  | "Jumpsuits";

export type FootwearSubcategory =
  | "Sneakers"
  | "Heels"
  | "Flats"
  | "Boots"
  | "Sandals"
  | "Slides"
  | "Espadrilles"
  | "Loafers"
  | "Mules";

export type BagsSubcategory =
  | "Totes"
  | "Crossbody"
  | "Clutches"
  | "Backpacks"
  | "Shoulder"
  | "Satchels"
  | "Belt Bags"
  | "Mini Bags";

export type JewelrySubcategory =
  | "Earrings"
  | "Necklaces"
  | "Bracelets"
  | "Rings"
  | "Watches"
  | "Body Jewelry"
  | "Brooches"
  | "Anklets";

export type AccessoriesSubcategory =
  | "Hats"
  | "Scarves"
  | "Belts"
  | "Hair Accessories"
  | "Sunglasses"
  | "Gloves"
  | "Socks"
  | "Wallets";

export type BeautySubcategory =
  | "Lipstick"
  | "Foundation"
  | "Skincare"
  | "Fragrance"
  | "Nail Polish"
  | "Eye Makeup"
  | "Hair Products"
  | "Blush"
  | "Setting Spray";

export type TechSubcategory =
  | "Phone Cases"
  | "Headphones"
  | "Earbuds"
  | "Cameras"
  | "Tablets"
  | "Laptops"
  | "Speakers"
  | "Gaming"
  | "E-readers"
  | "Power Banks"
  | "Smart Speakers";

export type HomeSubcategory =
  | "Candles"
  | "Mugs"
  | "Decor"
  | "Planters"
  | "Blankets"
  | "Pillows"
  | "Lamps"
  | "Rugs"
  | "Diffusers"
  | "Storage";

export type StationerySubcategory =
  | "Notebooks"
  | "Planners"
  | "Pens"
  | "Journals"
  | "Desk Accessories";

export type PetSubcategory =
  | "Collars"
  | "Leashes"
  | "Pet Toys"
  | "Pet Beds"
  | "Pet Bowls";

export type FitnessSubcategory =
  | "Yoga Mats"
  | "Resistance Bands"
  | "Weights"
  | "Gym Bags"
  | "Water Bottles";

export type Subcategory =
  | ClothingSubcategory
  | FootwearSubcategory
  | BagsSubcategory
  | JewelrySubcategory
  | AccessoriesSubcategory
  | BeautySubcategory
  | TechSubcategory
  | HomeSubcategory
  | StationerySubcategory
  | PetSubcategory
  | FitnessSubcategory;

export interface AttributeWeight {
  name: string;
  maxPoints: number;
  isCritical: boolean;
}

export interface CategorySchema {
  category: ProductCategory;
  subcategory: Subcategory;
  attributes: string[];
  dealBreakers: string[];
  weights: AttributeWeight[];
  totalPoints: number;
  extractionPrompt: string;
  fuzzyMatching?: {
    [attribute: string]: {
      families: Record<string, string[]>;
      shadeVariation: number; // 0.9 = 90%
      familyMatch: number; // 0.7 = 70%
    };
  };
}

// ============================================================================
// SHARED CONSTANTS
// ============================================================================

export const SCORE_CAP_ON_CRITICAL_MISMATCH = 65;
export const TIEBREAKER_THRESHOLD = 5;

// Color families for fuzzy matching (shared across all categories)
export const COLOR_FAMILIES: Record<string, string[]> = {
  black: ["black", "jet black", "onyx", "charcoal black", "ink"],
  white: ["white", "off-white", "ivory", "cream white", "snow", "pearl white"],
  gray: ["gray", "grey", "silver", "slate", "charcoal", "heather gray", "graphite"],
  navy: ["navy", "navy blue", "dark blue", "midnight blue"],
  blue: ["blue", "royal blue", "cobalt", "sky blue", "denim blue", "baby blue", "teal"],
  green: ["green", "olive", "olive green", "sage", "forest green", "army green", "khaki", "moss", "emerald", "hunter green", "mint"],
  red: ["red", "burgundy", "wine", "maroon", "crimson", "scarlet", "cherry", "ruby"],
  pink: ["pink", "blush", "rose", "coral", "salmon", "dusty pink", "hot pink", "fuchsia", "magenta"],
  purple: ["purple", "lavender", "lilac", "plum", "violet", "mauve", "grape", "eggplant"],
  orange: ["orange", "tangerine", "rust", "terracotta", "peach", "apricot", "coral orange"],
  yellow: ["yellow", "gold", "mustard", "lemon", "canary", "butter", "honey"],
  brown: ["brown", "chocolate", "espresso", "chestnut", "cognac", "camel", "tan", "taupe", "beige", "nude"],
  neutral: ["beige", "cream", "ivory", "tan", "taupe", "camel", "oatmeal", "sand", "nude", "champagne"],
  metallic: ["gold", "silver", "rose gold", "bronze", "copper", "platinum", "gunmetal"],
};

// Metal colors for jewelry
export const METAL_FAMILIES: Record<string, string[]> = {
  gold: ["gold", "yellow gold", "14k gold", "18k gold", "gold-plated", "gold-tone"],
  silver: ["silver", "sterling silver", "925 silver", "silver-plated", "silver-tone", "rhodium"],
  rose_gold: ["rose gold", "rose gold-plated", "rose gold-tone", "pink gold"],
  bronze: ["bronze", "antique bronze", "brass", "copper"],
  gunmetal: ["gunmetal", "black metal", "dark silver", "hematite"],
  mixed: ["two-tone", "tri-tone", "mixed metals"],
};

// ============================================================================
// CLOTHING SCHEMAS
// ============================================================================

export const CLOTHING_TOPS_SCHEMA: CategorySchema = {
  category: "Clothing",
  subcategory: "Tops",
  attributes: [
    "primaryColor",
    "colorFamily",
    "colorTone",
    "neckline",
    "sleeveLength",
    "bodyLength",
    "fit",
    "fabric",
    "texture",
    "pattern",
    "hasButtons",
    "hasZipper",
    "hasPockets",
    "hasCollar",
  ],
  dealBreakers: ["neckline", "sleeveLength", "bodyLength"],
  weights: [
    { name: "primaryColor", maxPoints: 20, isCritical: false },
    { name: "colorTone", maxPoints: 10, isCritical: false },
    { name: "neckline", maxPoints: 15, isCritical: true },
    { name: "sleeveLength", maxPoints: 12, isCritical: true },
    { name: "bodyLength", maxPoints: 10, isCritical: true },
    { name: "fit", maxPoints: 8, isCritical: false },
    { name: "fabric", maxPoints: 8, isCritical: false },
    { name: "texture", maxPoints: 7, isCritical: false },
    { name: "pattern", maxPoints: 5, isCritical: false },
    { name: "details", maxPoints: 5, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise clothing attribute extractor analyzing a TOP (shirt, blouse, sweater, tank, etc.).

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name (e.g., "olive green", "navy blue", "heather gray")
- colorFamily: Broad family (black, white, gray, blue, green, red, pink, purple, orange, yellow, brown, neutral)
- colorTone: muted/earthy, bright/vivid, pastel, dark, neutral

**STYLE:**
- neckline: crew, v-neck, scoop, boat, mock, turtleneck, collared, henley, square, sweetheart, off-shoulder, halter, cowl
- sleeveLength: sleeveless, cap, short, elbow, 3/4, long, bell, puff
- bodyLength: crop, regular, tunic, longline
- fit: fitted, slim, regular, relaxed, oversized, boxy

**MATERIAL:**
- fabric: cotton, linen, silk, satin, chiffon, jersey, knit, ribbed, denim, chambray, velvet, cashmere, wool, polyester, rayon
- texture: smooth, ribbed, cable-knit, waffle, chunky, sheer, textured, quilted

**DETAILS:**
- pattern: solid, striped, plaid, floral, polka-dot, geometric, abstract, animal-print, colorblock, tie-dye
- hasButtons: true/false
- hasZipper: true/false
- hasPockets: true/false
- hasCollar: true/false

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
  fuzzyMatching: {
    primaryColor: {
      families: COLOR_FAMILIES,
      shadeVariation: 0.9,
      familyMatch: 0.7,
    },
  },
};

export const CLOTHING_BOTTOMS_SCHEMA: CategorySchema = {
  category: "Clothing",
  subcategory: "Bottoms",
  attributes: [
    "primaryColor",
    "colorFamily",
    "colorTone",
    "bottomType",
    "rise",
    "legShape",
    "length",
    "fit",
    "fabric",
    "pattern",
    "hasPockets",
    "hasZipper",
    "waistDetail",
  ],
  dealBreakers: ["bottomType", "length", "legShape"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "colorTone", maxPoints: 8, isCritical: false },
    { name: "bottomType", maxPoints: 15, isCritical: true },
    { name: "rise", maxPoints: 8, isCritical: false },
    { name: "legShape", maxPoints: 12, isCritical: true },
    { name: "length", maxPoints: 12, isCritical: true },
    { name: "fit", maxPoints: 8, isCritical: false },
    { name: "fabric", maxPoints: 10, isCritical: false },
    { name: "pattern", maxPoints: 5, isCritical: false },
    { name: "details", maxPoints: 4, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise clothing attribute extractor analyzing BOTTOMS (pants, jeans, shorts, skirts).

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- colorTone: muted/earthy, bright/vivid, pastel, dark, neutral

**STYLE:**
- bottomType: jeans, trousers, shorts, skirt, leggings, joggers, culottes, cargo, chinos
- rise: low, mid, high, super-high
- legShape: skinny, slim, straight, wide-leg, bootcut, flare, tapered, relaxed
- length: mini, above-knee, knee, midi, ankle, full-length, cropped
- fit: fitted, slim, regular, relaxed, loose

**MATERIAL:**
- fabric: denim, cotton, linen, wool, silk, satin, leather, faux-leather, corduroy, twill, knit, ponte
- wash: (for denim) light-wash, medium-wash, dark-wash, black, raw, distressed

**DETAILS:**
- pattern: solid, striped, plaid, check, printed
- hasPockets: true/false
- hasZipper: true/false
- waistDetail: belted, elastic, drawstring, button, paper-bag

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const CLOTHING_DRESSES_SCHEMA: CategorySchema = {
  category: "Clothing",
  subcategory: "Dresses",
  attributes: [
    "primaryColor",
    "colorFamily",
    "colorTone",
    "dressType",
    "neckline",
    "sleeveLength",
    "length",
    "silhouette",
    "fabric",
    "pattern",
    "backDetail",
    "waistDetail",
  ],
  dealBreakers: ["dressType", "length", "silhouette"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "colorTone", maxPoints: 8, isCritical: false },
    { name: "dressType", maxPoints: 12, isCritical: true },
    { name: "neckline", maxPoints: 10, isCritical: false },
    { name: "sleeveLength", maxPoints: 8, isCritical: false },
    { name: "length", maxPoints: 12, isCritical: true },
    { name: "silhouette", maxPoints: 12, isCritical: true },
    { name: "fabric", maxPoints: 8, isCritical: false },
    { name: "pattern", maxPoints: 6, isCritical: false },
    { name: "details", maxPoints: 6, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise clothing attribute extractor analyzing a DRESS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- colorTone: muted/earthy, bright/vivid, pastel, dark, neutral

**STYLE:**
- dressType: casual, cocktail, maxi, midi, mini, bodycon, wrap, shirt-dress, slip, sundress, formal, evening
- neckline: v-neck, scoop, square, sweetheart, halter, strapless, off-shoulder, high-neck, cowl, one-shoulder
- sleeveLength: sleeveless, spaghetti-strap, cap, short, 3/4, long, puff, bell
- length: mini, above-knee, knee, midi, maxi, floor-length
- silhouette: fitted, a-line, empire, sheath, fit-and-flare, column, mermaid, tent, shift

**MATERIAL:**
- fabric: cotton, linen, silk, satin, chiffon, velvet, jersey, lace, tulle, sequin, crepe, rayon

**DETAILS:**
- pattern: solid, floral, striped, polka-dot, abstract, animal-print, geometric, paisley
- backDetail: open-back, low-back, tie-back, zip-back, button-back, cutout
- waistDetail: belted, cinched, elastic, empire, drop-waist, natural

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const CLOTHING_OUTERWEAR_SCHEMA: CategorySchema = {
  category: "Clothing",
  subcategory: "Outerwear",
  attributes: [
    "primaryColor",
    "colorFamily",
    "colorTone",
    "outerwearType",
    "length",
    "fit",
    "closure",
    "collar",
    "fabric",
    "lining",
    "hasPockets",
    "hasHood",
  ],
  dealBreakers: ["outerwearType", "length", "closure"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "colorTone", maxPoints: 7, isCritical: false },
    { name: "outerwearType", maxPoints: 15, isCritical: true },
    { name: "length", maxPoints: 12, isCritical: true },
    { name: "fit", maxPoints: 8, isCritical: false },
    { name: "closure", maxPoints: 10, isCritical: true },
    { name: "collar", maxPoints: 8, isCritical: false },
    { name: "fabric", maxPoints: 10, isCritical: false },
    { name: "lining", maxPoints: 4, isCritical: false },
    { name: "details", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise clothing attribute extractor analyzing OUTERWEAR (jackets, coats, blazers).

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- colorTone: muted/earthy, bright/vivid, pastel, dark, neutral

**STYLE:**
- outerwearType: blazer, bomber, denim-jacket, leather-jacket, trench, parka, puffer, peacoat, cardigan, kimono, cape, vest, shacket, teddy, fleece
- length: cropped, hip-length, mid-thigh, knee-length, long
- fit: fitted, regular, relaxed, oversized
- closure: button, zipper, snap, toggle, open-front, belted, double-breasted

**MATERIAL:**
- fabric: leather, faux-leather, denim, wool, cotton, nylon, polyester, fleece, shearling, suede, tweed, velvet
- lining: lined, unlined, sherpa-lined, quilted-lining

**DETAILS:**
- collar: notched-lapel, shawl, stand, hooded, fur-trim, no-collar
- hasPockets: true/false
- hasHood: true/false
- hasButtons: true/false
- hasZipper: true/false

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const CLOTHING_ACTIVEWEAR_SCHEMA: CategorySchema = {
  category: "Clothing",
  subcategory: "Activewear",
  attributes: [
    "primaryColor",
    "colorFamily",
    "activewearType",
    "fit",
    "length",
    "waistband",
    "support",
    "fabric",
    "pattern",
    "features",
  ],
  dealBreakers: ["activewearType", "length", "support"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "colorTone", maxPoints: 7, isCritical: false },
    { name: "activewearType", maxPoints: 15, isCritical: true },
    { name: "fit", maxPoints: 10, isCritical: false },
    { name: "length", maxPoints: 12, isCritical: true },
    { name: "waistband", maxPoints: 8, isCritical: false },
    { name: "support", maxPoints: 10, isCritical: true },
    { name: "fabric", maxPoints: 8, isCritical: false },
    { name: "pattern", maxPoints: 6, isCritical: false },
    { name: "features", maxPoints: 6, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise clothing attribute extractor analyzing ACTIVEWEAR.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- colorTone: muted/earthy, bright/vivid, pastel, dark, neutral

**STYLE:**
- activewearType: sports-bra, tank-top, crop-top, t-shirt, long-sleeve, hoodie, leggings, shorts, bike-shorts, joggers, skort, sports-dress
- fit: compression, fitted, regular, relaxed
- length: (for bottoms) short, mid-thigh, knee, 7/8, full-length
- waistband: high-rise, mid-rise, low-rise, crossover, fold-over
- support: (for bras) light, medium, high

**MATERIAL:**
- fabric: spandex, nylon, polyester, cotton-blend, mesh, seamless, ribbed
- features: moisture-wicking, quick-dry, compression, breathable, squat-proof

**DETAILS:**
- pattern: solid, color-block, tie-dye, camo, geometric, logo
- hasPockets: true/false
- hasThumbholes: true/false
- hasBranding: true/false

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const CLOTHING_SWIMWEAR_SCHEMA: CategorySchema = {
  category: "Clothing",
  subcategory: "Swimwear",
  attributes: [
    "primaryColor",
    "colorFamily",
    "swimwearType",
    "topStyle",
    "bottomStyle",
    "coverage",
    "straps",
    "pattern",
    "fabric",
    "features",
  ],
  dealBreakers: ["swimwearType", "topStyle", "bottomStyle"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "colorTone", maxPoints: 7, isCritical: false },
    { name: "swimwearType", maxPoints: 15, isCritical: true },
    { name: "topStyle", maxPoints: 12, isCritical: true },
    { name: "bottomStyle", maxPoints: 12, isCritical: true },
    { name: "coverage", maxPoints: 10, isCritical: false },
    { name: "straps", maxPoints: 8, isCritical: false },
    { name: "pattern", maxPoints: 8, isCritical: false },
    { name: "fabric", maxPoints: 5, isCritical: false },
    { name: "features", maxPoints: 5, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise clothing attribute extractor analyzing SWIMWEAR.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- colorTone: muted/earthy, bright/vivid, pastel, dark, neutral

**STYLE:**
- swimwearType: bikini, one-piece, tankini, monokini, swim-shorts, cover-up, sarong, rashguard
- topStyle: triangle, bandeau, halter, underwire, bralette, crop, push-up, sport
- bottomStyle: brief, cheeky, high-waist, high-leg, string, boyshort, skirt
- coverage: minimal, moderate, full
- straps: tie, adjustable, fixed, strapless, crossback, racerback

**MATERIAL:**
- fabric: nylon, spandex, lycra, polyester, ribbed, crinkle, terry
- features: underwire, padding, removable-pads, lining, ruching, cutouts

**DETAILS:**
- pattern: solid, tropical, floral, striped, animal-print, geometric, tie-dye, colorblock

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// FOOTWEAR SCHEMAS
// ============================================================================

export const FOOTWEAR_SNEAKERS_SCHEMA: CategorySchema = {
  category: "Footwear",
  subcategory: "Sneakers",
  attributes: [
    "primaryColor",
    "colorFamily",
    "secondaryColor",
    "sneakerType",
    "height",
    "closure",
    "sole",
    "upperMaterial",
    "brand",
    "features",
  ],
  dealBreakers: ["sneakerType", "height", "closure"],
  weights: [
    { name: "primaryColor", maxPoints: 20, isCritical: false },
    { name: "secondaryColor", maxPoints: 8, isCritical: false },
    { name: "sneakerType", maxPoints: 15, isCritical: true },
    { name: "height", maxPoints: 12, isCritical: true },
    { name: "closure", maxPoints: 10, isCritical: true },
    { name: "sole", maxPoints: 10, isCritical: false },
    { name: "upperMaterial", maxPoints: 10, isCritical: false },
    { name: "features", maxPoints: 8, isCritical: false },
    { name: "brand", maxPoints: 7, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise footwear attribute extractor analyzing SNEAKERS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Main color of the shoe
- colorFamily: Broad family
- secondaryColor: Accent color if present

**STYLE:**
- sneakerType: low-top, mid-top, high-top, slip-on, platform, chunky, minimalist, retro, running, basketball, tennis, skate
- height: low, mid, high
- closure: lace-up, slip-on, velcro, elastic, zipper
- sole: flat, chunky, platform, gum, white, black, translucent

**MATERIAL:**
- upperMaterial: leather, suede, canvas, mesh, knit, synthetic, nubuck, patent

**DETAILS:**
- brand: Nike, Adidas, New Balance, Converse, Vans, Puma, Reebok, Jordan, or "unknown"
- features: perforated, reflective, padded-collar, logo-prominent, colorblock
- hasBranding: true/false

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FOOTWEAR_HEELS_SCHEMA: CategorySchema = {
  category: "Footwear",
  subcategory: "Heels",
  attributes: [
    "primaryColor",
    "colorFamily",
    "finish",
    "heelType",
    "heelHeight",
    "toeShape",
    "closure",
    "upperMaterial",
    "platform",
    "strapStyle",
  ],
  dealBreakers: ["heelType", "heelHeight", "toeShape"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "finish", maxPoints: 10, isCritical: false },
    { name: "heelType", maxPoints: 15, isCritical: true },
    { name: "heelHeight", maxPoints: 12, isCritical: true },
    { name: "toeShape", maxPoints: 12, isCritical: true },
    { name: "closure", maxPoints: 8, isCritical: false },
    { name: "upperMaterial", maxPoints: 10, isCritical: false },
    { name: "platform", maxPoints: 7, isCritical: false },
    { name: "strapStyle", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise footwear attribute extractor analyzing HEELS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: matte, glossy/patent, suede, satin, glitter, metallic

**STYLE:**
- heelType: stiletto, block, kitten, wedge, cone, spool, platform
- heelHeight: low (1-2"), mid (2-3"), high (3-4"), ultra-high (4"+)
- toeShape: pointed, round, almond, square, peep-toe, open-toe
- closure: slip-on, ankle-strap, slingback, mary-jane, lace-up, buckle
- platform: none, slight, platform

**MATERIAL:**
- upperMaterial: leather, suede, satin, velvet, patent, synthetic, mesh, fabric

**DETAILS:**
- strapStyle: single-strap, multi-strap, wrap-around, t-strap, none
- hasAccents: true/false
- accentType: bow, buckle, crystal, chain, none

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FOOTWEAR_FLATS_SCHEMA: CategorySchema = {
  category: "Footwear",
  subcategory: "Flats",
  attributes: [
    "primaryColor",
    "colorFamily",
    "finish",
    "flatType",
    "toeShape",
    "closure",
    "upperMaterial",
    "hasAccents",
    "accentType",
  ],
  dealBreakers: ["flatType", "toeShape", "closure"],
  weights: [
    { name: "primaryColor", maxPoints: 20, isCritical: false },
    { name: "finish", maxPoints: 12, isCritical: false },
    { name: "flatType", maxPoints: 15, isCritical: true },
    { name: "toeShape", maxPoints: 12, isCritical: true },
    { name: "closure", maxPoints: 12, isCritical: true },
    { name: "upperMaterial", maxPoints: 12, isCritical: false },
    { name: "hasAccents", maxPoints: 8, isCritical: false },
    { name: "accentType", maxPoints: 9, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise footwear attribute extractor analyzing FLATS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: matte, glossy/patent, suede, metallic, textured

**STYLE:**
- flatType: ballet-flat, loafer, mule, mary-jane, espadrille, moccasin, oxford, d'orsay
- toeShape: pointed, round, almond, square
- closure: slip-on, strap, buckle, lace-up, elastic

**MATERIAL:**
- upperMaterial: leather, suede, patent, canvas, velvet, satin, mesh, synthetic

**DETAILS:**
- hasAccents: true/false
- accentType: bow, buckle, tassel, chain, studs, horsebit, none
- hasBranding: true/false

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FOOTWEAR_BOOTS_SCHEMA: CategorySchema = {
  category: "Footwear",
  subcategory: "Boots",
  attributes: [
    "primaryColor",
    "colorFamily",
    "finish",
    "bootType",
    "shaftHeight",
    "heelHeight",
    "heelType",
    "toeShape",
    "closure",
    "upperMaterial",
  ],
  dealBreakers: ["bootType", "shaftHeight", "heelType"],
  weights: [
    { name: "primaryColor", maxPoints: 16, isCritical: false },
    { name: "finish", maxPoints: 8, isCritical: false },
    { name: "bootType", maxPoints: 14, isCritical: true },
    { name: "shaftHeight", maxPoints: 12, isCritical: true },
    { name: "heelHeight", maxPoints: 10, isCritical: false },
    { name: "heelType", maxPoints: 10, isCritical: true },
    { name: "toeShape", maxPoints: 10, isCritical: false },
    { name: "closure", maxPoints: 10, isCritical: false },
    { name: "upperMaterial", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise footwear attribute extractor analyzing BOOTS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: matte, glossy/patent, suede, distressed, croc-embossed

**STYLE:**
- bootType: ankle, chelsea, combat, cowboy, knee-high, over-knee, riding, hiking, rain, sock-boot
- shaftHeight: ankle, mid-calf, knee, over-knee
- heelHeight: flat, low, mid, high
- heelType: flat, block, stiletto, wedge, stacked, platform
- toeShape: pointed, round, square, almond

**MATERIAL:**
- upperMaterial: leather, suede, patent, synthetic, rubber, shearling-lined, canvas
- closure: zipper, pull-on, lace-up, buckle, elastic-gusset

**DETAILS:**
- hasHardware: true/false
- hardwareType: buckle, studs, chain, zipper-detail, none

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FOOTWEAR_SANDALS_SCHEMA: CategorySchema = {
  category: "Footwear",
  subcategory: "Sandals",
  attributes: [
    "primaryColor",
    "colorFamily",
    "finish",
    "sandalType",
    "heelHeight",
    "strapStyle",
    "toeStyle",
    "closure",
    "upperMaterial",
    "sole",
  ],
  dealBreakers: ["sandalType", "heelHeight", "strapStyle"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "finish", maxPoints: 8, isCritical: false },
    { name: "sandalType", maxPoints: 15, isCritical: true },
    { name: "heelHeight", maxPoints: 12, isCritical: true },
    { name: "strapStyle", maxPoints: 12, isCritical: true },
    { name: "toeStyle", maxPoints: 8, isCritical: false },
    { name: "closure", maxPoints: 8, isCritical: false },
    { name: "upperMaterial", maxPoints: 10, isCritical: false },
    { name: "sole", maxPoints: 9, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise footwear attribute extractor analyzing SANDALS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: matte, glossy, suede, metallic, woven, braided

**STYLE:**
- sandalType: slide, flip-flop, gladiator, platform, wedge, flat, heeled, sport, thong, strappy
- heelHeight: flat, low, mid, high, wedge
- strapStyle: single-band, multi-strap, ankle-strap, toe-loop, wrap-around, cage
- toeStyle: open, thong, closed
- closure: slip-on, buckle, velcro, tie, elastic

**MATERIAL:**
- upperMaterial: leather, suede, fabric, rubber, rope, jute, synthetic, PVC
- sole: rubber, cork, rope/jute, leather, foam, platform

**DETAILS:**
- hasAccents: true/false
- accentType: buckle, studs, beads, shells, crystals, none

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// BAGS SCHEMAS
// ============================================================================

export const BAGS_TOTES_SCHEMA: CategorySchema = {
  category: "Bags",
  subcategory: "Totes",
  attributes: [
    "primaryColor",
    "colorFamily",
    "finish",
    "size",
    "shape",
    "material",
    "handleType",
    "closure",
    "hardware",
    "features",
  ],
  dealBreakers: ["size", "material", "handleType"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "finish", maxPoints: 8, isCritical: false },
    { name: "size", maxPoints: 14, isCritical: true },
    { name: "shape", maxPoints: 10, isCritical: false },
    { name: "material", maxPoints: 14, isCritical: true },
    { name: "handleType", maxPoints: 12, isCritical: true },
    { name: "closure", maxPoints: 8, isCritical: false },
    { name: "hardware", maxPoints: 8, isCritical: false },
    { name: "features", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise bag attribute extractor analyzing a TOTE BAG.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: matte, glossy, pebbled, smooth, textured, canvas, woven

**STYLE:**
- size: small, medium, large, oversized
- shape: structured, slouchy, rectangular, square, bucket

**MATERIAL:**
- material: leather, faux-leather, canvas, nylon, straw, raffia, fabric, vegan-leather

**DETAILS:**
- handleType: short-handle, long-handle, double-handle, shoulder-strap, adjustable
- closure: open-top, zipper, snap, magnetic, drawstring
- hardware: gold, silver, gunmetal, rose-gold, none
- hasPockets: true/false
- hasLining: true/false
- hasBranding: true/false

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BAGS_CROSSBODY_SCHEMA: CategorySchema = {
  category: "Bags",
  subcategory: "Crossbody",
  attributes: [
    "primaryColor",
    "colorFamily",
    "finish",
    "size",
    "shape",
    "material",
    "strapType",
    "closure",
    "hardware",
    "features",
  ],
  dealBreakers: ["size", "shape", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "finish", maxPoints: 8, isCritical: false },
    { name: "size", maxPoints: 12, isCritical: true },
    { name: "shape", maxPoints: 12, isCritical: true },
    { name: "material", maxPoints: 14, isCritical: true },
    { name: "strapType", maxPoints: 10, isCritical: false },
    { name: "closure", maxPoints: 10, isCritical: false },
    { name: "hardware", maxPoints: 8, isCritical: false },
    { name: "features", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise bag attribute extractor analyzing a CROSSBODY BAG.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: smooth, pebbled, quilted, croc-embossed, saffiano, patent

**STYLE:**
- size: mini, small, medium, large
- shape: rectangular, square, saddle, half-moon, circle, envelope

**MATERIAL:**
- material: leather, faux-leather, nylon, canvas, suede, fabric, vegan-leather

**DETAILS:**
- strapType: chain, leather, fabric, woven, adjustable, fixed
- closure: flap, zipper, snap, magnetic, clasp, drawstring
- hardware: gold, silver, gunmetal, rose-gold, mixed
- hasChainStrap: true/false
- hasLogo: true/false
- hasCompartments: true/false

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BAGS_CLUTCHES_SCHEMA: CategorySchema = {
  category: "Bags",
  subcategory: "Clutches",
  attributes: [
    "primaryColor",
    "colorFamily",
    "finish",
    "size",
    "shape",
    "material",
    "closure",
    "hardware",
    "hasStrap",
    "features",
  ],
  dealBreakers: ["shape", "material", "closure"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "finish", maxPoints: 12, isCritical: false },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "shape", maxPoints: 14, isCritical: true },
    { name: "material", maxPoints: 14, isCritical: true },
    { name: "closure", maxPoints: 12, isCritical: true },
    { name: "hardware", maxPoints: 8, isCritical: false },
    { name: "hasStrap", maxPoints: 6, isCritical: false },
    { name: "features", maxPoints: 6, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise bag attribute extractor analyzing a CLUTCH BAG.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: smooth, satin, velvet, sequin, beaded, metallic, patent, glitter

**STYLE:**
- size: small, medium, oversized
- shape: envelope, box, pouch, minaudiere, fold-over, hard-case

**MATERIAL:**
- material: leather, satin, velvet, sequin, beaded, acrylic, metal, fabric

**DETAILS:**
- closure: magnetic, clasp, zipper, snap, none
- hardware: gold, silver, crystal, none
- hasStrap: true/false
- strapType: wrist-strap, chain, removable, none
- hasEmbellishment: true/false
- embellishmentType: crystals, beads, bow, clasp-detail, none

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BAGS_BACKPACKS_SCHEMA: CategorySchema = {
  category: "Bags",
  subcategory: "Backpacks",
  attributes: [
    "primaryColor",
    "colorFamily",
    "finish",
    "size",
    "style",
    "material",
    "closure",
    "strapType",
    "hardware",
    "features",
  ],
  dealBreakers: ["size", "style", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 16, isCritical: false },
    { name: "finish", maxPoints: 8, isCritical: false },
    { name: "size", maxPoints: 14, isCritical: true },
    { name: "style", maxPoints: 14, isCritical: true },
    { name: "material", maxPoints: 14, isCritical: true },
    { name: "closure", maxPoints: 10, isCritical: false },
    { name: "strapType", maxPoints: 8, isCritical: false },
    { name: "hardware", maxPoints: 8, isCritical: false },
    { name: "features", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise bag attribute extractor analyzing a BACKPACK.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: smooth, pebbled, quilted, nylon, canvas, waxed

**STYLE:**
- size: mini, small, medium, large
- style: fashion, casual, sporty, convertible, drawstring, structured

**MATERIAL:**
- material: leather, faux-leather, nylon, canvas, polyester, vegan-leather, recycled

**DETAILS:**
- closure: zipper, drawstring, flap, buckle, magnetic
- strapType: adjustable, padded, convertible-to-tote, single-strap
- hardware: gold, silver, gunmetal, matte-black, none
- hasPockets: true/false
- hasLaptopCompartment: true/false
- hasLogo: true/false

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// JEWELRY SCHEMAS
// ============================================================================

export const JEWELRY_EARRINGS_SCHEMA: CategorySchema = {
  category: "Jewelry",
  subcategory: "Earrings",
  attributes: [
    "metalColor",
    "metalFinish",
    "earringType",
    "size",
    "shape",
    "hasGemstones",
    "gemstoneType",
    "gemstoneColor",
    "closure",
    "style",
  ],
  dealBreakers: ["metalColor", "earringType", "size"],
  weights: [
    { name: "metalColor", maxPoints: 20, isCritical: true },
    { name: "metalFinish", maxPoints: 8, isCritical: false },
    { name: "earringType", maxPoints: 18, isCritical: true },
    { name: "size", maxPoints: 12, isCritical: true },
    { name: "shape", maxPoints: 10, isCritical: false },
    { name: "hasGemstones", maxPoints: 8, isCritical: false },
    { name: "gemstoneType", maxPoints: 8, isCritical: false },
    { name: "gemstoneColor", maxPoints: 6, isCritical: false },
    { name: "closure", maxPoints: 5, isCritical: false },
    { name: "style", maxPoints: 5, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise jewelry attribute extractor analyzing EARRINGS.

Extract these attributes. Use "not_visible" if cannot be determined.

**MATERIAL:**
- metalColor: gold, silver, rose-gold, bronze, copper, gunmetal, mixed
- metalFinish: polished, matte, brushed, hammered, textured, antiqued

**STYLE:**
- earringType: stud, hoop, huggie, drop, dangle, chandelier, threader, ear-cuff, climber
- size: small/petite, medium, large, oversized
- shape: round, oval, geometric, irregular, teardrop, star, heart, linear

**DETAILS:**
- hasGemstones: true/false
- gemstoneType: diamond, pearl, crystal, cubic-zirconia, turquoise, jade, opal, none
- gemstoneColor: clear, white, black, colored, iridescent, none
- closure: post, leverback, hook, clip-on, huggie-hinge
- style: minimalist, statement, classic, bohemian, modern, vintage

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
  fuzzyMatching: {
    metalColor: {
      families: METAL_FAMILIES,
      shadeVariation: 0.95,
      familyMatch: 0.8,
    },
  },
};

export const JEWELRY_NECKLACES_SCHEMA: CategorySchema = {
  category: "Jewelry",
  subcategory: "Necklaces",
  attributes: [
    "metalColor",
    "metalFinish",
    "necklaceType",
    "length",
    "chainStyle",
    "pendant",
    "hasGemstones",
    "gemstoneType",
    "closure",
    "style",
  ],
  dealBreakers: ["metalColor", "necklaceType", "length"],
  weights: [
    { name: "metalColor", maxPoints: 18, isCritical: true },
    { name: "metalFinish", maxPoints: 6, isCritical: false },
    { name: "necklaceType", maxPoints: 16, isCritical: true },
    { name: "length", maxPoints: 14, isCritical: true },
    { name: "chainStyle", maxPoints: 12, isCritical: false },
    { name: "pendant", maxPoints: 10, isCritical: false },
    { name: "hasGemstones", maxPoints: 8, isCritical: false },
    { name: "gemstoneType", maxPoints: 6, isCritical: false },
    { name: "closure", maxPoints: 4, isCritical: false },
    { name: "style", maxPoints: 6, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise jewelry attribute extractor analyzing a NECKLACE.

Extract these attributes. Use "not_visible" if cannot be determined.

**MATERIAL:**
- metalColor: gold, silver, rose-gold, bronze, mixed, beaded-non-metal
- metalFinish: polished, matte, brushed, antiqued

**STYLE:**
- necklaceType: chain, pendant, choker, statement, layered, collar, lariat, bib, beaded
- length: choker (14-16"), princess (17-19"), matinee (20-24"), opera (28-36"), rope (36"+)
- chainStyle: cable, curb, box, snake, rope, figaro, herringbone, paperclip, ball

**DETAILS:**
- pendant: yes/no
- pendantShape: round, oval, heart, cross, initial, charm, bar, geometric, none
- hasGemstones: true/false
- gemstoneType: diamond, pearl, crystal, turquoise, opal, none
- closure: lobster-claw, spring-ring, toggle, magnetic, adjustable
- style: minimalist, statement, layering, classic, bohemian, modern

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const JEWELRY_BRACELETS_SCHEMA: CategorySchema = {
  category: "Jewelry",
  subcategory: "Bracelets",
  attributes: [
    "metalColor",
    "metalFinish",
    "braceletType",
    "width",
    "closure",
    "hasCharm",
    "hasGemstones",
    "gemstoneType",
    "material",
    "style",
  ],
  dealBreakers: ["metalColor", "braceletType", "width"],
  weights: [
    { name: "metalColor", maxPoints: 18, isCritical: true },
    { name: "metalFinish", maxPoints: 6, isCritical: false },
    { name: "braceletType", maxPoints: 18, isCritical: true },
    { name: "width", maxPoints: 12, isCritical: true },
    { name: "closure", maxPoints: 10, isCritical: false },
    { name: "hasCharm", maxPoints: 8, isCritical: false },
    { name: "hasGemstones", maxPoints: 8, isCritical: false },
    { name: "gemstoneType", maxPoints: 6, isCritical: false },
    { name: "material", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 6, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise jewelry attribute extractor analyzing a BRACELET.

Extract these attributes. Use "not_visible" if cannot be determined.

**MATERIAL:**
- metalColor: gold, silver, rose-gold, bronze, gunmetal, mixed, non-metal
- metalFinish: polished, matte, brushed, hammered, textured
- material: metal, leather, fabric, beaded, cord, silicone

**STYLE:**
- braceletType: bangle, cuff, chain, charm, beaded, wrap, tennis, slider, link, stretch
- width: thin/delicate, medium, wide/chunky
- closure: clasp, toggle, magnetic, stretch, adjustable-slider, none-rigid

**DETAILS:**
- hasCharm: true/false
- charmType: initial, symbol, mixed, none
- hasGemstones: true/false
- gemstoneType: diamond, crystal, pearl, turquoise, none
- style: minimalist, statement, stacking, classic, bohemian, modern

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const JEWELRY_RINGS_SCHEMA: CategorySchema = {
  category: "Jewelry",
  subcategory: "Rings",
  attributes: [
    "metalColor",
    "metalFinish",
    "ringType",
    "bandWidth",
    "hasStone",
    "stoneType",
    "stoneShape",
    "stoneSetting",
    "stackable",
    "style",
  ],
  dealBreakers: ["metalColor", "ringType", "hasStone"],
  weights: [
    { name: "metalColor", maxPoints: 18, isCritical: true },
    { name: "metalFinish", maxPoints: 6, isCritical: false },
    { name: "ringType", maxPoints: 18, isCritical: true },
    { name: "bandWidth", maxPoints: 10, isCritical: false },
    { name: "hasStone", maxPoints: 12, isCritical: true },
    { name: "stoneType", maxPoints: 10, isCritical: false },
    { name: "stoneShape", maxPoints: 8, isCritical: false },
    { name: "stoneSetting", maxPoints: 6, isCritical: false },
    { name: "stackable", maxPoints: 6, isCritical: false },
    { name: "style", maxPoints: 6, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise jewelry attribute extractor analyzing a RING.

Extract these attributes. Use "not_visible" if cannot be determined.

**MATERIAL:**
- metalColor: gold, silver, rose-gold, platinum, mixed, black
- metalFinish: polished, matte, brushed, hammered, milgrain

**STYLE:**
- ringType: band, solitaire, statement, signet, cocktail, stackable, midi, wrap, dome
- bandWidth: thin/delicate, medium, wide/chunky
- stackable: true/false

**DETAILS:**
- hasStone: true/false
- stoneType: diamond, cubic-zirconia, pearl, colored-gem, crystal, none
- stoneShape: round, oval, princess, emerald, cushion, pear, marquise, none
- stoneSetting: prong, bezel, pave, channel, cluster, none
- style: minimalist, vintage, modern, classic, bohemian, statement

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const JEWELRY_WATCHES_SCHEMA: CategorySchema = {
  category: "Jewelry",
  subcategory: "Watches",
  attributes: [
    "caseColor",
    "caseFinish",
    "caseShape",
    "caseSize",
    "bandType",
    "bandColor",
    "dialColor",
    "watchStyle",
    "features",
    "brand",
  ],
  dealBreakers: ["caseColor", "caseShape", "bandType"],
  weights: [
    { name: "caseColor", maxPoints: 16, isCritical: true },
    { name: "caseFinish", maxPoints: 6, isCritical: false },
    { name: "caseShape", maxPoints: 14, isCritical: true },
    { name: "caseSize", maxPoints: 10, isCritical: false },
    { name: "bandType", maxPoints: 14, isCritical: true },
    { name: "bandColor", maxPoints: 12, isCritical: false },
    { name: "dialColor", maxPoints: 10, isCritical: false },
    { name: "watchStyle", maxPoints: 10, isCritical: false },
    { name: "features", maxPoints: 4, isCritical: false },
    { name: "brand", maxPoints: 4, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise jewelry attribute extractor analyzing a FASHION WATCH.

Extract these attributes. Use "not_visible" if cannot be determined.

**CASE:**
- caseColor: gold, silver, rose-gold, black, mixed, ceramic
- caseFinish: polished, matte, brushed
- caseShape: round, square, rectangular, oval, tonneau
- caseSize: small (under 36mm), medium (36-40mm), large (over 40mm)

**BAND:**
- bandType: metal-bracelet, leather, fabric, silicone, mesh, ceramic, chain
- bandColor: matching-case, black, brown, tan, navy, colored, patterned

**DIAL:**
- dialColor: white, black, silver, gold, mother-of-pearl, colored, patterned

**STYLE:**
- watchStyle: classic, sport, dress, minimalist, fashion, smart
- features: date, chronograph, diamond-bezel, roman-numerals, none
- brand: (if visible)

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// ACCESSORIES SCHEMAS
// ============================================================================

export const ACCESSORIES_HATS_SCHEMA: CategorySchema = {
  category: "Accessories",
  subcategory: "Hats",
  attributes: [
    "primaryColor",
    "colorFamily",
    "hatType",
    "material",
    "brimStyle",
    "crown",
    "features",
    "style",
  ],
  dealBreakers: ["hatType", "material", "brimStyle"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "colorTone", maxPoints: 7, isCritical: false },
    { name: "hatType", maxPoints: 20, isCritical: true },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "brimStyle", maxPoints: 15, isCritical: true },
    { name: "crown", maxPoints: 10, isCritical: false },
    { name: "features", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 7, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise accessory attribute extractor analyzing a HAT.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- colorTone: muted, bright, pastel, dark, neutral

**STYLE:**
- hatType: baseball-cap, beanie, bucket-hat, fedora, sun-hat, beret, visor, newsboy, trucker, cowboy, panama, straw-hat
- brimStyle: flat, curved, wide, no-brim, floppy
- crown: structured, unstructured, fitted, adjustable

**MATERIAL:**
- material: cotton, wool, felt, straw, denim, canvas, knit, leather, synthetic

**DETAILS:**
- features: logo, embroidery, patch, pom-pom, ribbon, none
- adjustable: true/false
- style: casual, sporty, dressy, bohemian, streetwear

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const ACCESSORIES_SCARVES_SCHEMA: CategorySchema = {
  category: "Accessories",
  subcategory: "Scarves",
  attributes: [
    "primaryColor",
    "colorFamily",
    "pattern",
    "scarfType",
    "size",
    "material",
    "finish",
    "style",
  ],
  dealBreakers: ["scarfType", "material", "pattern"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "colorTone", maxPoints: 7, isCritical: false },
    { name: "pattern", maxPoints: 15, isCritical: true },
    { name: "scarfType", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 12, isCritical: false },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "finish", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise accessory attribute extractor analyzing a SCARF.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name or dominant color
- colorFamily: Broad family
- secondaryColors: Other prominent colors

**STYLE:**
- scarfType: silk-scarf, wool-scarf, infinity, blanket-scarf, bandana, neck-scarf, hair-scarf, shawl
- size: small/skinny, medium, large/oversized, square
- pattern: solid, striped, plaid, paisley, floral, geometric, animal-print, abstract, polka-dot, logo

**MATERIAL:**
- material: silk, cashmere, wool, cotton, linen, chiffon, polyester, knit, velvet
- finish: smooth, textured, fringed, tasseled

**DETAILS:**
- style: classic, bohemian, preppy, luxe, casual

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const ACCESSORIES_BELTS_SCHEMA: CategorySchema = {
  category: "Accessories",
  subcategory: "Belts",
  attributes: [
    "primaryColor",
    "colorFamily",
    "finish",
    "beltType",
    "width",
    "buckleType",
    "buckleColor",
    "material",
    "style",
  ],
  dealBreakers: ["beltType", "width", "buckleType"],
  weights: [
    { name: "primaryColor", maxPoints: 16, isCritical: false },
    { name: "finish", maxPoints: 10, isCritical: false },
    { name: "beltType", maxPoints: 15, isCritical: true },
    { name: "width", maxPoints: 14, isCritical: true },
    { name: "buckleType", maxPoints: 15, isCritical: true },
    { name: "buckleColor", maxPoints: 10, isCritical: false },
    { name: "material", maxPoints: 12, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise accessory attribute extractor analyzing a BELT.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: smooth, pebbled, glossy/patent, suede, croc-embossed, woven, braided

**STYLE:**
- beltType: classic, western, chain, obi, corset, waist, elastic, rope
- width: thin/skinny, medium, wide, extra-wide

**MATERIAL:**
- material: leather, faux-leather, suede, fabric, elastic, chain, rope

**DETAILS:**
- buckleType: prong, slide, d-ring, double-ring, logo, western, statement, no-buckle
- buckleColor: gold, silver, gunmetal, rose-gold, matching-belt, crystal
- hasLogo: true/false
- style: minimalist, statement, western, classic, trendy

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const ACCESSORIES_HAIR_SCHEMA: CategorySchema = {
  category: "Accessories",
  subcategory: "Hair Accessories",
  attributes: [
    "primaryColor",
    "colorFamily",
    "pattern",
    "accessoryType",
    "size",
    "material",
    "features",
    "style",
  ],
  dealBreakers: ["accessoryType", "material", "size"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "pattern", maxPoints: 10, isCritical: false },
    { name: "accessoryType", maxPoints: 20, isCritical: true },
    { name: "size", maxPoints: 15, isCritical: true },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise accessory attribute extractor analyzing a HAIR ACCESSORY.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, printed, striped, floral, animal-print, tie-dye

**STYLE:**
- accessoryType: scrunchie, claw-clip, barrette, headband, hair-tie, bobby-pin, hair-comb, banana-clip, snap-clip, alligator-clip
- size: small, medium, large, oversized

**MATERIAL:**
- material: satin, silk, velvet, cotton, plastic, metal, acrylic, resin, pearl, crystal, fabric

**DETAILS:**
- features: bow, pearl-detail, rhinestone, beaded, plain, logo
- style: minimalist, statement, classic, bohemian, trendy, elegant

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const ACCESSORIES_SUNGLASSES_SCHEMA: CategorySchema = {
  category: "Accessories",
  subcategory: "Sunglasses",
  attributes: [
    "frameColor",
    "framePattern",
    "frameShape",
    "frameMaterial",
    "lensColor",
    "lensTint",
    "lensType",
    "templeStyle",
    "style",
  ],
  dealBreakers: ["frameShape", "framePattern", "frameColor"],
  weights: [
    { name: "frameColor", maxPoints: 18, isCritical: true },
    { name: "framePattern", maxPoints: 12, isCritical: true },
    { name: "frameShape", maxPoints: 18, isCritical: true },
    { name: "frameMaterial", maxPoints: 10, isCritical: false },
    { name: "lensColor", maxPoints: 12, isCritical: false },
    { name: "lensTint", maxPoints: 8, isCritical: false },
    { name: "lensType", maxPoints: 6, isCritical: false },
    { name: "templeStyle", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise accessory attribute extractor analyzing SUNGLASSES.

Extract these attributes. Use "not_visible" if cannot be determined.

**FRAME COLOR & PATTERN - CRITICAL:**
- frameColor: The PRIMARY color of the frame material
  - "tortoiseshell" = brown/amber with darker brown/black spots or swirls (VERY COMMON)
  - "black" = solid black only (no brown tones)
  - "brown" = solid brown without pattern
  - Other: clear, white, gold, silver, colored
- framePattern: The pattern ON the frame
  - "tortoiseshell" = mottled brown/amber with darker spots (if frame has this pattern, BOTH frameColor AND framePattern should be "tortoiseshell")
  - "solid" = single uniform color
  - "gradient" = color fades from dark to light
  - "two-tone" = two distinct colors

**FRAME SHAPE:**
- frameShape: aviator, round, square, rectangular, cat-eye, oversized, wayfarer, shield, geometric, oval

**FRAME MATERIAL:**
- frameMaterial: plastic, acetate, metal, mixed, titanium

**LENS:**
- lensColor: The tint/color of the lens (brown, gray, green, blue, pink/rose, gradient, mirrored, clear)
- lensTint: dark, medium, light
- lensType: solid, gradient, polarized, mirrored

**DETAILS:**
- templeStyle: thin, thick, logo, decorated, clear
- style: classic, trendy, sporty, luxury, retro, minimalist

**CONFIDENCE:** (0.0-1.0)

IMPORTANT: Tortoiseshell is brown-based with darker spots - do NOT confuse with solid black.

Respond with flat JSON only.`,
};

export const ACCESSORIES_SOCKS_SCHEMA: CategorySchema = {
  category: "Accessories",
  subcategory: "Socks",
  attributes: [
    "primaryColor",
    "colorFamily",
    "pattern",
    "sockType",
    "length",
    "material",
    "features",
    "style",
  ],
  dealBreakers: ["sockType", "length", "pattern"],
  weights: [
    { name: "primaryColor", maxPoints: 18, isCritical: false },
    { name: "pattern", maxPoints: 15, isCritical: true },
    { name: "sockType", maxPoints: 18, isCritical: true },
    { name: "length", maxPoints: 15, isCritical: true },
    { name: "material", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise accessory attribute extractor analyzing SOCKS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, striped, polka-dot, argyle, logo, novelty, colorblock, animal-print

**STYLE:**
- sockType: athletic, dress, casual, compression, no-show, liner
- length: no-show, ankle, quarter, crew, knee-high, over-knee

**MATERIAL:**
- material: cotton, wool, synthetic, bamboo, cashmere, cotton-blend

**DETAILS:**
- features: cushioned, ribbed, seamless, arch-support, logo, lace-trim, ruffle
- style: athletic, casual, dressy, novelty, minimalist

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const ACCESSORIES_WALLETS_SCHEMA: CategorySchema = {
  category: "Accessories",
  subcategory: "Wallets",
  attributes: [
    "primaryColor",
    "colorFamily",
    "material",
    "walletType",
    "size",
    "closure",
    "hardware",
    "pattern",
    "style",
  ],
  dealBreakers: ["walletType", "material", "size"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "walletType", maxPoints: 18, isCritical: true },
    { name: "size", maxPoints: 15, isCritical: true },
    { name: "closure", maxPoints: 10, isCritical: false },
    { name: "hardware", maxPoints: 8, isCritical: false },
    { name: "pattern", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise accessory attribute extractor analyzing a WALLET.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, logo, monogram, textured, printed

**STYLE:**
- walletType: bifold, trifold, card-holder, zip-around, clutch-wallet, money-clip, passport-holder
- size: compact, standard, large, slim

**MATERIAL:**
- material: leather, faux-leather, canvas, nylon, saffiano, pebbled-leather, patent

**DETAILS:**
- closure: snap, zipper, open, magnetic, button
- hardware: gold, silver, gunmetal, none, logo
- style: minimalist, luxury, casual, sporty, classic

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// CLOTHING EXPANSION SCHEMAS
// ============================================================================

export const CLOTHING_LINGERIE_SCHEMA: CategorySchema = {
  category: "Clothing",
  subcategory: "Lingerie",
  attributes: [
    "primaryColor",
    "colorFamily",
    "lingerieType",
    "style",
    "material",
    "coverage",
    "strapStyle",
    "closure",
    "padding",
    "features",
  ],
  dealBreakers: ["lingerieType", "style", "coverage"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "lingerieType", maxPoints: 18, isCritical: true },
    { name: "style", maxPoints: 15, isCritical: true },
    { name: "material", maxPoints: 12, isCritical: false },
    { name: "coverage", maxPoints: 12, isCritical: true },
    { name: "strapStyle", maxPoints: 10, isCritical: false },
    { name: "closure", maxPoints: 6, isCritical: false },
    { name: "padding", maxPoints: 6, isCritical: false },
    { name: "features", maxPoints: 6, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise clothing attribute extractor analyzing LINGERIE/INTIMATES.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family

**STYLE:**
- lingerieType: bralette, bra, underwire-bra, sports-bra, camisole, bodysuit, corset, bustier, teddy
- style: everyday, push-up, wireless, minimalist, lace, romantic, sporty, seamless
- coverage: full-coverage, demi, plunge, triangle, balconette

**MATERIAL:**
- material: lace, satin, cotton, silk, mesh, microfiber, velvet, ribbed

**DETAILS:**
- strapStyle: adjustable, convertible, strapless, halter, racerback, spaghetti
- closure: hook-and-eye, front-close, pullover, tie
- padding: padded, lightly-lined, unlined, push-up, removable-pads
- features: underwire, wireless, longline, cut-out, sheer, embroidered

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const CLOTHING_LOUNGEWEAR_SCHEMA: CategorySchema = {
  category: "Clothing",
  subcategory: "Loungewear",
  attributes: [
    "primaryColor",
    "colorFamily",
    "loungewearType",
    "fit",
    "material",
    "sleeveLength",
    "length",
    "pattern",
    "features",
  ],
  dealBreakers: ["loungewearType", "fit", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "loungewearType", maxPoints: 18, isCritical: true },
    { name: "fit", maxPoints: 15, isCritical: true },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "sleeveLength", maxPoints: 10, isCritical: false },
    { name: "length", maxPoints: 10, isCritical: false },
    { name: "pattern", maxPoints: 8, isCritical: false },
    { name: "features", maxPoints: 9, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise clothing attribute extractor analyzing LOUNGEWEAR.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, striped, tie-dye, printed, floral

**STYLE:**
- loungewearType: joggers, sweatpants, lounge-shorts, hoodie, sweatshirt, lounge-set, robe, pajama-pants, sleep-shirt
- fit: relaxed, oversized, fitted, loose, boyfriend
- length: cropped, regular, full-length, maxi

**MATERIAL:**
- material: cotton, fleece, terry, velour, modal, french-terry, waffle-knit, jersey
- sleeveLength: sleeveless, short, long, 3/4

**DETAILS:**
- features: drawstring, elastic-waist, pockets, ribbed-cuffs, hood, kangaroo-pocket, thumb-holes

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const CLOTHING_JUMPSUITS_SCHEMA: CategorySchema = {
  category: "Clothing",
  subcategory: "Jumpsuits",
  attributes: [
    "primaryColor",
    "colorFamily",
    "jumpsuitType",
    "neckline",
    "sleeveLength",
    "legStyle",
    "fit",
    "material",
    "pattern",
    "closure",
  ],
  dealBreakers: ["jumpsuitType", "legStyle", "neckline"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "jumpsuitType", maxPoints: 15, isCritical: true },
    { name: "neckline", maxPoints: 12, isCritical: true },
    { name: "sleeveLength", maxPoints: 10, isCritical: false },
    { name: "legStyle", maxPoints: 15, isCritical: true },
    { name: "fit", maxPoints: 10, isCritical: false },
    { name: "material", maxPoints: 10, isCritical: false },
    { name: "pattern", maxPoints: 6, isCritical: false },
    { name: "closure", maxPoints: 7, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise clothing attribute extractor analyzing a JUMPSUIT or ROMPER.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, striped, floral, printed, geometric

**STYLE:**
- jumpsuitType: jumpsuit, romper, playsuit, overalls, utility-jumpsuit, wide-leg-jumpsuit
- neckline: v-neck, square, strapless, halter, off-shoulder, collared, scoop, wrap
- sleeveLength: sleeveless, cap, short, 3/4, long
- legStyle: wide-leg, straight, tapered, shorts, flared, skinny
- fit: fitted, relaxed, tailored, loose

**MATERIAL:**
- material: cotton, linen, denim, silk, jersey, rayon, crepe, chambray

**DETAILS:**
- closure: zipper, buttons, tie-waist, wrap, elastic

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// FOOTWEAR EXPANSION SCHEMAS
// ============================================================================

export const FOOTWEAR_LOAFERS_SCHEMA: CategorySchema = {
  category: "Footwear",
  subcategory: "Loafers",
  attributes: [
    "primaryColor",
    "colorFamily",
    "loaferType",
    "toeShape",
    "heelHeight",
    "material",
    "finish",
    "hardware",
    "style",
  ],
  dealBreakers: ["loaferType", "toeShape", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "loaferType", maxPoints: 18, isCritical: true },
    { name: "toeShape", maxPoints: 15, isCritical: true },
    { name: "heelHeight", maxPoints: 10, isCritical: false },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "finish", maxPoints: 10, isCritical: false },
    { name: "hardware", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 7, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise footwear attribute extractor analyzing LOAFERS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: matte, glossy, patent, suede, distressed

**STYLE:**
- loaferType: penny-loafer, tassel-loafer, horsebit-loafer, driving-loafer, platform-loafer, chunky-loafer
- toeShape: round, almond, square, pointed
- heelHeight: flat, low, platform, chunky
- style: classic, preppy, modern, chunky, minimalist

**MATERIAL:**
- material: leather, suede, patent-leather, faux-leather, velvet, fabric

**DETAILS:**
- hardware: gold-bit, silver-bit, tassel, penny-slot, chain, none

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FOOTWEAR_SLIDES_SCHEMA: CategorySchema = {
  category: "Footwear",
  subcategory: "Slides",
  attributes: [
    "primaryColor",
    "colorFamily",
    "slideType",
    "strapStyle",
    "soleType",
    "material",
    "pattern",
    "style",
  ],
  dealBreakers: ["slideType", "strapStyle", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "slideType", maxPoints: 18, isCritical: true },
    { name: "strapStyle", maxPoints: 18, isCritical: true },
    { name: "soleType", maxPoints: 12, isCritical: false },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "pattern", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 12, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise footwear attribute extractor analyzing SLIDES.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, logo, printed, textured

**STYLE:**
- slideType: pool-slide, sport-slide, platform-slide, fashion-slide, fur-slide, molded-slide
- strapStyle: single-band, double-band, wide-band, crossover, logo-strap
- soleType: flat, platform, contoured, chunky, molded
- style: sporty, casual, luxury, minimalist, statement

**MATERIAL:**
- material: rubber, leather, foam, fabric, fur, pvc, suede

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FOOTWEAR_MULES_SCHEMA: CategorySchema = {
  category: "Footwear",
  subcategory: "Mules",
  attributes: [
    "primaryColor",
    "colorFamily",
    "muleType",
    "toeShape",
    "heelHeight",
    "heelType",
    "material",
    "finish",
    "style",
  ],
  dealBreakers: ["muleType", "heelHeight", "toeShape"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "muleType", maxPoints: 15, isCritical: true },
    { name: "toeShape", maxPoints: 15, isCritical: true },
    { name: "heelHeight", maxPoints: 15, isCritical: true },
    { name: "heelType", maxPoints: 12, isCritical: false },
    { name: "material", maxPoints: 12, isCritical: false },
    { name: "finish", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise footwear attribute extractor analyzing MULES.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: matte, glossy, patent, suede, textured

**STYLE:**
- muleType: heeled-mule, flat-mule, platform-mule, clog-mule, pointed-mule, backless-loafer
- toeShape: pointed, square, round, open-toe, peep-toe
- heelHeight: flat, low, mid, high, platform
- heelType: block, stiletto, kitten, sculptural, wedge
- style: elegant, casual, trendy, minimalist, statement

**MATERIAL:**
- material: leather, suede, satin, velvet, patent-leather, fabric, woven

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// BAGS EXPANSION SCHEMAS
// ============================================================================

export const BAGS_SHOULDER_SCHEMA: CategorySchema = {
  category: "Bags",
  subcategory: "Shoulder",
  attributes: [
    "primaryColor",
    "colorFamily",
    "shoulderType",
    "size",
    "shape",
    "material",
    "closure",
    "hardware",
    "strapStyle",
    "style",
  ],
  dealBreakers: ["shoulderType", "size", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "shoulderType", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 15, isCritical: true },
    { name: "shape", maxPoints: 10, isCritical: false },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "closure", maxPoints: 8, isCritical: false },
    { name: "hardware", maxPoints: 8, isCritical: false },
    { name: "strapStyle", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 7, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise bag attribute extractor analyzing a SHOULDER BAG.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family

**STYLE:**
- shoulderType: hobo, baguette, flap, chain-strap, bucket, slouchy, structured
- size: mini, small, medium, large, oversized
- shape: rectangular, crescent, rounded, structured, slouchy

**MATERIAL:**
- material: leather, faux-leather, canvas, nylon, suede, quilted, woven, raffia

**DETAILS:**
- closure: zipper, flap, magnetic, open, drawstring, clasp
- hardware: gold, silver, gunmetal, chain, logo, minimal
- strapStyle: chain, leather, adjustable, fixed, braided, wide
- style: classic, trendy, luxury, casual, bohemian, minimalist

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BAGS_BELT_BAGS_SCHEMA: CategorySchema = {
  category: "Bags",
  subcategory: "Belt Bags",
  attributes: [
    "primaryColor",
    "colorFamily",
    "beltBagType",
    "size",
    "material",
    "closure",
    "beltStyle",
    "hardware",
    "style",
  ],
  dealBreakers: ["beltBagType", "size", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "beltBagType", maxPoints: 18, isCritical: true },
    { name: "size", maxPoints: 15, isCritical: true },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "closure", maxPoints: 10, isCritical: false },
    { name: "beltStyle", maxPoints: 10, isCritical: false },
    { name: "hardware", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 9, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise bag attribute extractor analyzing a BELT BAG/FANNY PACK.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family

**STYLE:**
- beltBagType: classic-fanny, fashion-belt-bag, sporty-waist-bag, quilted-belt-bag, chain-belt-bag, sling-bag
- size: mini, small, medium, large
- style: sporty, luxury, casual, streetwear, minimalist, statement

**MATERIAL:**
- material: leather, nylon, canvas, quilted, faux-leather, technical-fabric

**DETAILS:**
- closure: zipper, magnetic, buckle, flap
- beltStyle: adjustable-strap, chain, logo-belt, webbing, leather-belt
- hardware: gold, silver, gunmetal, logo, minimal

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BAGS_MINI_BAGS_SCHEMA: CategorySchema = {
  category: "Bags",
  subcategory: "Mini Bags",
  attributes: [
    "primaryColor",
    "colorFamily",
    "miniBagType",
    "shape",
    "material",
    "closure",
    "strapStyle",
    "hardware",
    "style",
  ],
  dealBreakers: ["miniBagType", "shape", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "miniBagType", maxPoints: 18, isCritical: true },
    { name: "shape", maxPoints: 15, isCritical: true },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "closure", maxPoints: 10, isCritical: false },
    { name: "strapStyle", maxPoints: 10, isCritical: false },
    { name: "hardware", maxPoints: 9, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise bag attribute extractor analyzing a MINI BAG.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family

**STYLE:**
- miniBagType: micro-bag, mini-crossbody, mini-top-handle, coin-purse, card-case, lipstick-case, phone-bag
- shape: rectangular, square, round, heart, novelty, structured
- style: luxury, trendy, playful, classic, statement, minimalist

**MATERIAL:**
- material: leather, patent, satin, beaded, crystal, quilted, exotic, velvet

**DETAILS:**
- closure: zipper, clasp, magnetic, kiss-lock, drawstring
- strapStyle: chain, leather, detachable, wristlet, crossbody
- hardware: gold, silver, crystal, pearl, logo, ornate

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// JEWELRY EXPANSION SCHEMAS
// ============================================================================

export const JEWELRY_ANKLETS_SCHEMA: CategorySchema = {
  category: "Jewelry",
  subcategory: "Anklets",
  attributes: [
    "metalColor",
    "metalType",
    "ankletType",
    "chainStyle",
    "charms",
    "closure",
    "width",
    "style",
  ],
  dealBreakers: ["metalColor", "ankletType", "chainStyle"],
  weights: [
    { name: "metalColor", maxPoints: 18, isCritical: true },
    { name: "metalType", maxPoints: 12, isCritical: false },
    { name: "ankletType", maxPoints: 18, isCritical: true },
    { name: "chainStyle", maxPoints: 15, isCritical: true },
    { name: "charms", maxPoints: 12, isCritical: false },
    { name: "closure", maxPoints: 8, isCritical: false },
    { name: "width", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 9, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise jewelry attribute extractor analyzing an ANKLET.

Extract these attributes. Use "not_visible" if cannot be determined.

**METAL:**
- metalColor: gold, silver, rose-gold, mixed, beaded, cord
- metalType: gold-plated, sterling-silver, stainless-steel, 14k-gold, brass, cord

**STYLE:**
- ankletType: chain-anklet, charm-anklet, beaded-anklet, cord-anklet, layered-anklet, cuff-anklet
- chainStyle: cable, figaro, snake, curb, satellite, herringbone, rope
- width: dainty, medium, chunky

**DETAILS:**
- charms: none, single-charm, multiple-charms, initial, gemstone, shell, coin
- closure: lobster-clasp, toggle, adjustable, tie
- style: dainty, bohemian, classic, trendy, layering, statement

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// BEAUTY SCHEMAS
// ============================================================================

export const BEAUTY_LIPSTICK_SCHEMA: CategorySchema = {
  category: "Beauty",
  subcategory: "Lipstick",
  attributes: [
    "shade",
    "colorFamily",
    "finish",
    "lipType",
    "coverage",
    "formula",
    "packaging",
    "brand",
  ],
  dealBreakers: ["colorFamily", "finish", "lipType"],
  weights: [
    { name: "shade", maxPoints: 15, isCritical: false },
    { name: "colorFamily", maxPoints: 18, isCritical: true },
    { name: "finish", maxPoints: 18, isCritical: true },
    { name: "lipType", maxPoints: 15, isCritical: true },
    { name: "coverage", maxPoints: 10, isCritical: false },
    { name: "formula", maxPoints: 10, isCritical: false },
    { name: "packaging", maxPoints: 6, isCritical: false },
    { name: "brand", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise beauty product attribute extractor analyzing LIPSTICK/LIP PRODUCT.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- shade: Exact shade name if visible (e.g., "mauve", "berry", "nude pink")
- colorFamily: red, pink, nude, berry, coral, orange, mauve, brown, plum, burgundy

**FORMULA:**
- finish: matte, satin, glossy, velvet, cream, shimmer, metallic, sheer
- lipType: bullet-lipstick, liquid-lipstick, lip-gloss, lip-stain, lip-oil, lip-liner, lip-balm, lip-crayon
- coverage: sheer, buildable, medium, full
- formula: long-wearing, hydrating, transfer-proof, moisturizing, plumping

**PACKAGING:**
- packaging: tube, bullet, wand, pencil, pot, click-pen
- brand: Name if visible on packaging

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BEAUTY_FOUNDATION_SCHEMA: CategorySchema = {
  category: "Beauty",
  subcategory: "Foundation",
  attributes: [
    "foundationType",
    "finish",
    "coverage",
    "formula",
    "packaging",
    "shade",
    "undertone",
    "brand",
  ],
  dealBreakers: ["foundationType", "finish", "coverage"],
  weights: [
    { name: "foundationType", maxPoints: 20, isCritical: true },
    { name: "finish", maxPoints: 18, isCritical: true },
    { name: "coverage", maxPoints: 18, isCritical: true },
    { name: "formula", maxPoints: 12, isCritical: false },
    { name: "packaging", maxPoints: 10, isCritical: false },
    { name: "shade", maxPoints: 8, isCritical: false },
    { name: "undertone", maxPoints: 6, isCritical: false },
    { name: "brand", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise beauty product attribute extractor analyzing FOUNDATION/BASE MAKEUP.

Extract these attributes. Use "not_visible" if cannot be determined.

**TYPE:**
- foundationType: liquid-foundation, powder-foundation, stick-foundation, cushion-foundation, tinted-moisturizer, bb-cream, cc-cream, concealer, primer
- finish: matte, dewy, satin, natural, radiant, velvet, luminous
- coverage: sheer, light, medium, full, buildable

**FORMULA:**
- formula: long-wearing, hydrating, oil-free, oil-control, anti-aging, spf, skin-tint

**PACKAGING:**
- packaging: bottle, pump, tube, compact, cushion, stick, dropper, jar
- shade: Light/medium/deep if visible
- undertone: warm, cool, neutral, olive
- brand: Name if visible on packaging

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BEAUTY_SKINCARE_SCHEMA: CategorySchema = {
  category: "Beauty",
  subcategory: "Skincare",
  attributes: [
    "skincareType",
    "productForm",
    "skinConcern",
    "keyIngredients",
    "packaging",
    "brand",
    "size",
  ],
  dealBreakers: ["skincareType", "productForm", "skinConcern"],
  weights: [
    { name: "skincareType", maxPoints: 22, isCritical: true },
    { name: "productForm", maxPoints: 18, isCritical: true },
    { name: "skinConcern", maxPoints: 15, isCritical: true },
    { name: "keyIngredients", maxPoints: 15, isCritical: false },
    { name: "packaging", maxPoints: 10, isCritical: false },
    { name: "brand", maxPoints: 10, isCritical: false },
    { name: "size", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise beauty product attribute extractor analyzing SKINCARE.

Extract these attributes. Use "not_visible" if cannot be determined.

**TYPE:**
- skincareType: moisturizer, serum, cleanser, toner, sunscreen, eye-cream, face-oil, mask, exfoliant, essence, mist, treatment
- productForm: cream, gel, liquid, foam, oil, balm, stick, sheet-mask, powder, spray

**PURPOSE:**
- skinConcern: hydration, anti-aging, acne, brightening, pore-minimizing, sensitive, oil-control, firming, dark-spots, redness
- keyIngredients: retinol, vitamin-c, hyaluronic-acid, niacinamide, salicylic-acid, aha, bha, peptides, ceramides, spf

**PACKAGING:**
- packaging: jar, pump, tube, dropper, bottle, spray, pot, sachet
- brand: Name if visible on packaging
- size: travel, regular, large

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BEAUTY_FRAGRANCE_SCHEMA: CategorySchema = {
  category: "Beauty",
  subcategory: "Fragrance",
  attributes: [
    "fragranceType",
    "concentration",
    "scentFamily",
    "bottleShape",
    "bottleColor",
    "capStyle",
    "brand",
    "size",
  ],
  dealBreakers: ["fragranceType", "bottleShape", "scentFamily"],
  weights: [
    { name: "fragranceType", maxPoints: 15, isCritical: true },
    { name: "concentration", maxPoints: 12, isCritical: false },
    { name: "scentFamily", maxPoints: 15, isCritical: true },
    { name: "bottleShape", maxPoints: 18, isCritical: true },
    { name: "bottleColor", maxPoints: 15, isCritical: false },
    { name: "capStyle", maxPoints: 10, isCritical: false },
    { name: "brand", maxPoints: 8, isCritical: false },
    { name: "size", maxPoints: 7, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise beauty product attribute extractor analyzing FRAGRANCE/PERFUME.

Extract these attributes. Use "not_visible" if cannot be determined.

**TYPE:**
- fragranceType: eau-de-parfum, eau-de-toilette, cologne, perfume-oil, body-mist, solid-perfume, hair-mist
- concentration: parfum, edp, edt, cologne, mist

**SCENT:**
- scentFamily: floral, woody, fresh, oriental, citrus, gourmand, fruity, musk, aquatic, spicy (if indicated on packaging)

**BOTTLE:**
- bottleShape: rectangular, round, square, oval, novelty, cylindrical, geometric
- bottleColor: clear, pink, gold, amber, blue, black, frosted, colored
- capStyle: round, square, sculptural, spray-top, rollerball, ornate

**INFO:**
- brand: Name if visible on packaging
- size: travel, 30ml, 50ml, 100ml, large

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BEAUTY_NAIL_POLISH_SCHEMA: CategorySchema = {
  category: "Beauty",
  subcategory: "Nail Polish",
  attributes: [
    "shade",
    "colorFamily",
    "finish",
    "nailType",
    "effect",
    "bottleShape",
    "brand",
  ],
  dealBreakers: ["colorFamily", "finish", "nailType"],
  weights: [
    { name: "shade", maxPoints: 15, isCritical: false },
    { name: "colorFamily", maxPoints: 20, isCritical: true },
    { name: "finish", maxPoints: 20, isCritical: true },
    { name: "nailType", maxPoints: 15, isCritical: true },
    { name: "effect", maxPoints: 12, isCritical: false },
    { name: "bottleShape", maxPoints: 8, isCritical: false },
    { name: "brand", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise beauty product attribute extractor analyzing NAIL POLISH.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- shade: Exact shade name if visible
- colorFamily: red, pink, nude, coral, orange, purple, blue, green, black, white, gold, silver, neutral

**FORMULA:**
- finish: cream, shimmer, glitter, matte, metallic, jelly, sheer, chrome, holographic
- nailType: regular-polish, gel-polish, base-coat, top-coat, nail-treatment, peel-off, press-ons
- effect: none, french-tip, ombre, magnetic, color-changing, glow-in-dark

**PACKAGING:**
- bottleShape: classic, round, square, tall, short
- brand: Name if visible on packaging

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BEAUTY_EYE_MAKEUP_SCHEMA: CategorySchema = {
  category: "Beauty",
  subcategory: "Eye Makeup",
  attributes: [
    "eyeProductType",
    "shade",
    "colorFamily",
    "finish",
    "formula",
    "packaging",
    "brand",
  ],
  dealBreakers: ["eyeProductType", "colorFamily", "finish"],
  weights: [
    { name: "eyeProductType", maxPoints: 22, isCritical: true },
    { name: "shade", maxPoints: 12, isCritical: false },
    { name: "colorFamily", maxPoints: 18, isCritical: true },
    { name: "finish", maxPoints: 15, isCritical: true },
    { name: "formula", maxPoints: 12, isCritical: false },
    { name: "packaging", maxPoints: 10, isCritical: false },
    { name: "brand", maxPoints: 11, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise beauty product attribute extractor analyzing EYE MAKEUP.

Extract these attributes. Use "not_visible" if cannot be determined.

**TYPE:**
- eyeProductType: eyeshadow-palette, single-eyeshadow, mascara, eyeliner, brow-product, eye-primer, lash-serum, false-lashes

**COLOR:**
- shade: Exact shade name if visible
- colorFamily: neutral, warm, cool, colorful, smoky, nude, black, brown

**FORMULA:**
- finish: matte, shimmer, metallic, satin, glitter, velvet, duo-chrome
- formula: waterproof, long-wearing, volumizing, lengthening, curling, pencil, liquid, gel, fiber

**PACKAGING:**
- packaging: palette, single-pan, tube, pencil, pot, wand, stick
- brand: Name if visible on packaging

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const BEAUTY_HAIR_PRODUCTS_SCHEMA: CategorySchema = {
  category: "Beauty",
  subcategory: "Hair Products",
  attributes: [
    "hairProductType",
    "productForm",
    "hairConcern",
    "holdLevel",
    "packaging",
    "brand",
    "size",
  ],
  dealBreakers: ["hairProductType", "productForm", "hairConcern"],
  weights: [
    { name: "hairProductType", maxPoints: 22, isCritical: true },
    { name: "productForm", maxPoints: 18, isCritical: true },
    { name: "hairConcern", maxPoints: 18, isCritical: true },
    { name: "holdLevel", maxPoints: 12, isCritical: false },
    { name: "packaging", maxPoints: 10, isCritical: false },
    { name: "brand", maxPoints: 10, isCritical: false },
    { name: "size", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise beauty product attribute extractor analyzing HAIR PRODUCTS.

Extract these attributes. Use "not_visible" if cannot be determined.

**TYPE:**
- hairProductType: shampoo, conditioner, hair-mask, hair-oil, styling-cream, hair-spray, mousse, gel, serum, dry-shampoo, heat-protectant, leave-in-conditioner
- productForm: liquid, cream, gel, foam, spray, oil, powder, paste

**PURPOSE:**
- hairConcern: hydration, volume, smoothing, curl-definition, color-protection, damage-repair, dandruff, growth, shine, frizz-control
- holdLevel: none, light, medium, strong, extra-strong

**PACKAGING:**
- packaging: bottle, pump, tube, spray, jar, dropper, aerosol
- brand: Name if visible on packaging
- size: travel, regular, large, salon-size

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// TECH SCHEMAS
// ============================================================================

export const TECH_PHONE_CASES_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Phone Cases",
  attributes: [
    "primaryColor",
    "colorFamily",
    "caseType",
    "material",
    "pattern",
    "features",
    "brand",
    "style",
  ],
  dealBreakers: ["caseType", "material", "pattern"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "caseType", maxPoints: 18, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "pattern", maxPoints: 15, isCritical: true },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "brand", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 14, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing a PHONE CASE.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, marble, floral, geometric, abstract, glitter, holographic, logo, character, photo

**TYPE:**
- caseType: slim, protective, wallet, clear, bumper, rugged, battery-case, leather, silicone, magsafe
- material: silicone, leather, plastic, tpu, hard-shell, fabric, metal, wood, biodegradable

**FEATURES:**
- features: card-holder, kickstand, strap, ring-holder, magsafe, wireless-charging, screen-protector
- brand: Case brand if visible
- style: minimalist, luxury, cute, sporty, professional, trendy, aesthetic

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const TECH_HEADPHONES_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Headphones",
  attributes: [
    "primaryColor",
    "headphoneType",
    "style",
    "connectivity",
    "features",
    "material",
    "brand",
  ],
  dealBreakers: ["headphoneType", "style", "connectivity"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "headphoneType", maxPoints: 20, isCritical: true },
    { name: "style", maxPoints: 18, isCritical: true },
    { name: "connectivity", maxPoints: 15, isCritical: true },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "material", maxPoints: 10, isCritical: false },
    { name: "brand", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing HEADPHONES.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name (black, white, silver, gold, pink, blue, etc.)

**TYPE:**
- headphoneType: over-ear, on-ear, in-ear, earbuds, bone-conduction, gaming
- style: studio, casual, sporty, luxury, gaming, dj
- connectivity: wireless, wired, bluetooth, usb-c, 3.5mm

**FEATURES:**
- features: noise-cancelling, anc, transparency-mode, foldable, waterproof, microphone, touch-controls
- material: plastic, metal, leather, fabric, memory-foam

**BRAND:**
- brand: Name if visible (Apple, Sony, Bose, Beats, etc.)

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const TECH_EARBUDS_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Earbuds",
  attributes: [
    "primaryColor",
    "earbudType",
    "caseShape",
    "caseColor",
    "features",
    "brand",
    "style",
  ],
  dealBreakers: ["earbudType", "caseShape", "brand"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "earbudType", maxPoints: 20, isCritical: true },
    { name: "caseShape", maxPoints: 18, isCritical: true },
    { name: "caseColor", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "brand", maxPoints: 15, isCritical: true },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing EARBUDS/TRUE WIRELESS EARBUDS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name of earbuds
- caseColor: Exact color name of charging case

**TYPE:**
- earbudType: true-wireless, stem-style, bean-style, sporty, in-ear, semi-in-ear
- caseShape: pill, square, round, oval, rectangular

**FEATURES:**
- features: anc, transparency, wireless-charging, water-resistant, touch-controls, spatial-audio
- brand: Name if visible (AirPods, Galaxy Buds, Pixel Buds, Jabra, etc.)
- style: compact, sporty, luxury, minimalist

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// HOME SCHEMAS
// ============================================================================

export const HOME_CANDLES_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Candles",
  attributes: [
    "candleColor",
    "containerType",
    "containerColor",
    "containerMaterial",
    "size",
    "wickCount",
    "scentFamily",
    "brand",
    "style",
  ],
  dealBreakers: ["containerType", "containerMaterial", "size"],
  weights: [
    { name: "candleColor", maxPoints: 12, isCritical: false },
    { name: "containerType", maxPoints: 18, isCritical: true },
    { name: "containerColor", maxPoints: 10, isCritical: false },
    { name: "containerMaterial", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 15, isCritical: true },
    { name: "wickCount", maxPoints: 8, isCritical: false },
    { name: "scentFamily", maxPoints: 8, isCritical: false },
    { name: "brand", maxPoints: 6, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing a CANDLE.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- candleColor: Color of the wax (white, cream, pink, black, etc.)
- containerColor: Color of the container

**CONTAINER:**
- containerType: jar, tin, pillar, votive, taper, tea-light, novelty, vessel
- containerMaterial: glass, ceramic, concrete, metal, terracotta, wood
- size: mini, small, medium, large, extra-large

**DETAILS:**
- wickCount: single, double, triple, multiple
- scentFamily: floral, woody, fresh, sweet, spicy, citrus, clean (if indicated)
- brand: Name if visible
- style: minimalist, luxury, rustic, modern, bohemian, decorative

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const HOME_MUGS_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Mugs",
  attributes: [
    "primaryColor",
    "colorFamily",
    "mugType",
    "material",
    "pattern",
    "handleStyle",
    "size",
    "style",
  ],
  dealBreakers: ["mugType", "material", "pattern"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "mugType", maxPoints: 18, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "pattern", maxPoints: 15, isCritical: true },
    { name: "handleStyle", maxPoints: 10, isCritical: false },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 14, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing a MUG/CUP.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, printed, illustrated, text, logo, speckled, gradient

**TYPE:**
- mugType: standard, travel, tumbler, camping, espresso, latte, oversized
- material: ceramic, porcelain, stoneware, glass, stainless-steel, enamel, plastic
- handleStyle: standard, large, no-handle, double-handle, ergonomic

**DETAILS:**
- size: espresso, small, standard, large, oversized
- style: minimalist, cute, rustic, modern, vintage, novelty, professional

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const HOME_DECOR_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Decor",
  attributes: [
    "primaryColor",
    "decorType",
    "material",
    "size",
    "shape",
    "pattern",
    "style",
  ],
  dealBreakers: ["decorType", "material", "style"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "decorType", maxPoints: 20, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "size", maxPoints: 12, isCritical: false },
    { name: "shape", maxPoints: 12, isCritical: false },
    { name: "pattern", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 15, isCritical: true },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing HOME DECOR.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- pattern: solid, geometric, floral, abstract, textured, printed

**TYPE:**
- decorType: vase, figurine, tray, bowl, frame, mirror, clock, sculpture, bookend, box, wall-art
- material: ceramic, glass, metal, wood, resin, marble, concrete, rattan, acrylic
- shape: round, rectangular, organic, geometric, abstract, traditional

**DETAILS:**
- size: small, medium, large, statement
- style: minimalist, bohemian, modern, vintage, rustic, glamorous, scandinavian, coastal

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// TECH EXPANSION SCHEMAS
// ============================================================================

export const TECH_CAMERAS_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Cameras",
  attributes: [
    "primaryColor",
    "cameraType",
    "brand",
    "bodyStyle",
    "lensType",
    "features",
    "size",
    "style",
  ],
  dealBreakers: ["cameraType", "brand", "bodyStyle"],
  weights: [
    { name: "primaryColor", maxPoints: 10, isCritical: false },
    { name: "cameraType", maxPoints: 22, isCritical: true },
    { name: "brand", maxPoints: 18, isCritical: true },
    { name: "bodyStyle", maxPoints: 15, isCritical: true },
    { name: "lensType", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "size", maxPoints: 6, isCritical: false },
    { name: "style", maxPoints: 7, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing a CAMERA.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: black, silver, white, retro-brown, pink, colored

**TYPE:**
- cameraType: dslr, mirrorless, point-and-shoot, instant, film, action-camera, vlogging, webcam, disposable
- brand: Canon, Sony, Nikon, Fujifilm, Panasonic, GoPro, Polaroid, Instax, Leica, etc.
- bodyStyle: compact, professional, retro, rugged, slim

**DETAILS:**
- lensType: kit-lens, prime, zoom, wide-angle, interchangeable
- features: flip-screen, viewfinder, touchscreen, wifi, 4k, stabilization
- size: compact, medium, large, professional
- style: professional, casual, vintage, modern, minimal

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const TECH_TABLETS_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Tablets",
  attributes: [
    "primaryColor",
    "brand",
    "tabletType",
    "screenSize",
    "caseType",
    "accessories",
    "style",
  ],
  dealBreakers: ["brand", "tabletType", "screenSize"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "brand", maxPoints: 22, isCritical: true },
    { name: "tabletType", maxPoints: 20, isCritical: true },
    { name: "screenSize", maxPoints: 18, isCritical: true },
    { name: "caseType", maxPoints: 12, isCritical: false },
    { name: "accessories", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing a TABLET.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: silver, space-gray, gold, white, black, pink, blue, starlight

**TYPE:**
- brand: Apple/iPad, Samsung, Microsoft/Surface, Amazon/Fire, Wacom, etc.
- tabletType: tablet, drawing-tablet, e-ink, 2-in-1, kids-tablet
- screenSize: small (7-8"), medium (10-11"), large (12"+), mini

**ACCESSORIES:**
- caseType: none, folio, keyboard-case, sleeve, rugged, smart-cover
- accessories: pencil/stylus, keyboard, stand, none
- style: professional, creative, casual, kids, minimal

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const TECH_LAPTOPS_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Laptops",
  attributes: [
    "primaryColor",
    "brand",
    "laptopType",
    "screenSize",
    "finish",
    "formFactor",
    "style",
  ],
  dealBreakers: ["brand", "laptopType", "screenSize"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "brand", maxPoints: 22, isCritical: true },
    { name: "laptopType", maxPoints: 20, isCritical: true },
    { name: "screenSize", maxPoints: 15, isCritical: true },
    { name: "finish", maxPoints: 10, isCritical: false },
    { name: "formFactor", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing a LAPTOP.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: silver, space-gray, gold, midnight, starlight, black, white, rose-gold

**TYPE:**
- brand: Apple/MacBook, Dell, HP, Lenovo, ASUS, Microsoft/Surface, etc.
- laptopType: ultrabook, macbook, chromebook, gaming, workstation, 2-in-1, budget
- screenSize: 13", 14", 15", 16", 17"

**DETAILS:**
- finish: aluminum, matte, glossy, brushed-metal
- formFactor: thin, standard, thick/gaming, convertible
- style: professional, creative, gaming, minimal, premium

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const TECH_SPEAKERS_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Speakers",
  attributes: [
    "primaryColor",
    "speakerType",
    "brand",
    "size",
    "shape",
    "features",
    "style",
  ],
  dealBreakers: ["speakerType", "brand", "size"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "speakerType", maxPoints: 22, isCritical: true },
    { name: "brand", maxPoints: 18, isCritical: true },
    { name: "size", maxPoints: 15, isCritical: true },
    { name: "shape", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing a SPEAKER.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: black, white, silver, blue, red, green, teal, pink, wood

**TYPE:**
- speakerType: bluetooth-portable, smart-speaker, soundbar, bookshelf, party, outdoor, desktop
- brand: JBL, Bose, Sony, Marshall, Bang & Olufsen, Sonos, Ultimate Ears, Harman Kardon, etc.
- size: mini, portable, medium, large, tower

**DETAILS:**
- shape: cylindrical, rectangular, cube, pill, classic, unique
- features: waterproof, voice-assistant, stereo-pair, party-mode, rgb-lights, battery
- style: retro, modern, minimal, premium, rugged, party

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const TECH_GAMING_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Gaming",
  attributes: [
    "primaryColor",
    "gamingType",
    "brand",
    "platform",
    "features",
    "lighting",
    "style",
  ],
  dealBreakers: ["gamingType", "brand", "platform"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "gamingType", maxPoints: 22, isCritical: true },
    { name: "brand", maxPoints: 18, isCritical: true },
    { name: "platform", maxPoints: 18, isCritical: true },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "lighting", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing GAMING ACCESSORIES.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: black, white, blue, red, purple, pink, rgb, custom

**TYPE:**
- gamingType: controller, gaming-mouse, gaming-keyboard, headset, console, handheld, streaming-deck, capture-card, mousepad
- brand: PlayStation, Xbox, Nintendo, Razer, Logitech, SteelSeries, Corsair, HyperX, etc.
- platform: playstation, xbox, nintendo, pc, multi-platform

**DETAILS:**
- features: wireless, mechanical, rgb, programmable, ergonomic, pro-controller
- lighting: rgb, single-color, none, customizable
- style: gamer, minimal, pro, retro, limited-edition

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const TECH_EREADERS_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "E-readers",
  attributes: [
    "primaryColor",
    "brand",
    "model",
    "screenSize",
    "caseType",
    "features",
  ],
  dealBreakers: ["brand", "model", "screenSize"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "brand", maxPoints: 25, isCritical: true },
    { name: "model", maxPoints: 20, isCritical: true },
    { name: "screenSize", maxPoints: 18, isCritical: true },
    { name: "caseType", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing an E-READER.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: black, white, sage, denim, agave, rose

**TYPE:**
- brand: Amazon/Kindle, Kobo, Barnes & Noble/Nook, Onyx Boox, reMarkable
- model: basic, paperwhite, oasis, scribe, libra, forma, etc.
- screenSize: 6", 7", 8", 10"+

**DETAILS:**
- caseType: none, fabric, leather, folio, sleeve
- features: warm-light, waterproof, note-taking, color-display, physical-buttons

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const TECH_POWER_BANKS_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Power Banks",
  attributes: [
    "primaryColor",
    "brand",
    "size",
    "capacity",
    "features",
    "shape",
    "style",
  ],
  dealBreakers: ["size", "capacity", "features"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "brand", maxPoints: 15, isCritical: false },
    { name: "size", maxPoints: 18, isCritical: true },
    { name: "capacity", maxPoints: 18, isCritical: true },
    { name: "features", maxPoints: 18, isCritical: true },
    { name: "shape", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing a POWER BANK/PORTABLE CHARGER.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: black, white, silver, pink, blue, green, patterned

**TYPE:**
- brand: Anker, Apple/MagSafe, Belkin, Mophie, RAVPower, Xiaomi, etc.
- size: pocket, compact, standard, large, laptop-size
- capacity: small (5000mAh), medium (10000mAh), large (20000mAh+)

**DETAILS:**
- features: magsafe, wireless-charging, fast-charge, usb-c, solar, built-in-cable, led-display
- shape: rectangular, slim, cylindrical, credit-card
- style: minimal, rugged, premium, cute, functional

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const TECH_SMART_SPEAKERS_SCHEMA: CategorySchema = {
  category: "Tech",
  subcategory: "Smart Speakers",
  attributes: [
    "primaryColor",
    "brand",
    "assistantType",
    "size",
    "hasDisplay",
    "shape",
    "style",
  ],
  dealBreakers: ["brand", "assistantType", "size"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "brand", maxPoints: 22, isCritical: true },
    { name: "assistantType", maxPoints: 20, isCritical: true },
    { name: "size", maxPoints: 18, isCritical: true },
    { name: "hasDisplay", maxPoints: 12, isCritical: false },
    { name: "shape", maxPoints: 6, isCritical: false },
    { name: "style", maxPoints: 7, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise tech product attribute extractor analyzing a SMART SPEAKER.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: white, charcoal, space-gray, midnight, glacier, sage, pink, blue

**TYPE:**
- brand: Apple/HomePod, Amazon/Echo, Google/Nest, Sonos, etc.
- assistantType: siri, alexa, google-assistant, multi-assistant
- size: mini, standard, large, soundbar

**DETAILS:**
- hasDisplay: true/false (smart display vs speaker only)
- shape: sphere, cylinder, puck, fabric-covered, rectangular
- style: minimal, modern, premium, home-decor-friendly

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// HOME EXPANSION SCHEMAS
// ============================================================================

export const HOME_BLANKETS_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Blankets",
  attributes: [
    "primaryColor",
    "colorFamily",
    "blanketType",
    "material",
    "texture",
    "size",
    "pattern",
    "style",
  ],
  dealBreakers: ["blanketType", "material", "texture"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "blanketType", maxPoints: 18, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "texture", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "pattern", maxPoints: 12, isCritical: false },
    { name: "style", maxPoints: 12, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing a BLANKET/THROW.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, striped, plaid, checkered, geometric, cable-knit, herringbone, faux-fur

**TYPE:**
- blanketType: throw, weighted, fleece, knit, sherpa, quilt, duvet, electric
- material: cotton, wool, fleece, sherpa, velvet, linen, cashmere, acrylic, faux-fur
- texture: smooth, chunky-knit, ribbed, fuzzy, quilted, waffle

**DETAILS:**
- size: throw, twin, full/queen, king, oversized
- style: cozy, minimalist, bohemian, modern, farmhouse, luxury

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const HOME_PILLOWS_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Pillows",
  attributes: [
    "primaryColor",
    "colorFamily",
    "pillowType",
    "shape",
    "material",
    "pattern",
    "size",
    "style",
  ],
  dealBreakers: ["pillowType", "shape", "pattern"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "pillowType", maxPoints: 18, isCritical: true },
    { name: "shape", maxPoints: 18, isCritical: true },
    { name: "material", maxPoints: 12, isCritical: false },
    { name: "pattern", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 12, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing a DECORATIVE PILLOW.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, striped, geometric, floral, abstract, textured, embroidered, tufted

**TYPE:**
- pillowType: decorative, throw, lumbar, floor, body, bolster, outdoor
- shape: square, rectangular/lumbar, round, bolster, novelty
- material: cotton, velvet, linen, faux-fur, leather, silk, outdoor-fabric, bouclé

**DETAILS:**
- size: small (12"), standard (18"), large (22"+), lumbar, euro
- style: minimalist, bohemian, modern, farmhouse, glam, coastal, mid-century

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const HOME_PLANTERS_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Planters",
  attributes: [
    "primaryColor",
    "planterType",
    "material",
    "shape",
    "size",
    "features",
    "style",
  ],
  dealBreakers: ["planterType", "material", "shape"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "planterType", maxPoints: 18, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "shape", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 12, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing a PLANTER/POT.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: white, black, terracotta, cream, sage, blush, gold, natural

**TYPE:**
- planterType: pot, hanging, self-watering, planter-stand, window-box, cachepot, raised-bed
- material: ceramic, terracotta, concrete, plastic, woven, metal, wood, fiberglass
- shape: round, square, rectangular, cylinder, tapered, geometric, face/head

**DETAILS:**
- size: mini (2-4"), small (5-6"), medium (8-10"), large (12"+), extra-large
- features: drainage-hole, saucer, self-watering, legs/stand, handles
- style: minimalist, bohemian, modern, rustic, mid-century, scandinavian

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const HOME_LAMPS_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Lamps",
  attributes: [
    "primaryColor",
    "lampType",
    "baseShape",
    "baseMaterial",
    "shadeType",
    "size",
    "style",
  ],
  dealBreakers: ["lampType", "baseShape", "baseMaterial"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "lampType", maxPoints: 20, isCritical: true },
    { name: "baseShape", maxPoints: 18, isCritical: true },
    { name: "baseMaterial", maxPoints: 18, isCritical: true },
    { name: "shadeType", maxPoints: 12, isCritical: false },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing a LAMP.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: white, black, gold, brass, silver, wood-tone, colored

**TYPE:**
- lampType: table-lamp, floor-lamp, desk-lamp, pendant, ring-light, fairy-lights, led-strip, salt-lamp, lava-lamp
- baseShape: cylindrical, round, square, sculptural, tripod, arc, goose-neck
- baseMaterial: ceramic, metal, wood, glass, marble, rattan, concrete, acrylic

**DETAILS:**
- shadeType: fabric, glass, metal, paper, exposed-bulb, no-shade, diffused
- size: small, medium, large, statement
- style: minimalist, modern, industrial, bohemian, mid-century, glam, farmhouse

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const HOME_RUGS_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Rugs",
  attributes: [
    "primaryColor",
    "colorFamily",
    "rugType",
    "pattern",
    "material",
    "shape",
    "size",
    "style",
  ],
  dealBreakers: ["rugType", "pattern", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "rugType", maxPoints: 18, isCritical: true },
    { name: "pattern", maxPoints: 18, isCritical: true },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "shape", maxPoints: 12, isCritical: false },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 15, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing a RUG.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- pattern: solid, geometric, moroccan, persian, striped, abstract, floral, shag, checkered

**TYPE:**
- rugType: area-rug, runner, accent, bathroom, outdoor, sheepskin, doormat
- material: wool, cotton, jute, synthetic, sisal, shag, faux-fur, flatweave
- shape: rectangular, round, oval, runner, irregular

**DETAILS:**
- size: small (3x5), medium (5x7), large (8x10), runner, oversized
- style: minimalist, bohemian, modern, traditional, farmhouse, coastal, mid-century

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const HOME_DIFFUSERS_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Diffusers",
  attributes: [
    "primaryColor",
    "diffuserType",
    "material",
    "shape",
    "size",
    "features",
    "style",
  ],
  dealBreakers: ["diffuserType", "material", "shape"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "diffuserType", maxPoints: 22, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "shape", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing a DIFFUSER.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: white, wood-tone, black, ceramic, frosted, colored

**TYPE:**
- diffuserType: ultrasonic, reed-diffuser, nebulizer, humidifier, car-diffuser, electric-wax-warmer
- material: ceramic, glass, wood, plastic, stone, bamboo
- shape: cylindrical, round, vase, sculptural, modern, classic

**DETAILS:**
- size: small/personal, medium, large, travel
- features: led-lights, timer, auto-shutoff, mist-settings, bluetooth
- style: minimalist, modern, spa, bohemian, natural, decorative

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const HOME_STORAGE_SCHEMA: CategorySchema = {
  category: "Home",
  subcategory: "Storage",
  attributes: [
    "primaryColor",
    "storageType",
    "material",
    "shape",
    "size",
    "features",
    "style",
  ],
  dealBreakers: ["storageType", "material", "shape"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "storageType", maxPoints: 20, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "shape", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise home product attribute extractor analyzing STORAGE/ORGANIZERS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: white, natural, black, gray, cream, wood-tone, colored

**TYPE:**
- storageType: basket, bin, box, tray, shelf, drawer-organizer, caddy, rack, hooks
- material: woven, fabric, plastic, wood, metal, rattan, seagrass, acrylic, bamboo
- shape: rectangular, round, square, nested-set, cube

**DETAILS:**
- size: small, medium, large, set, oversized
- features: handles, lid, labels, stackable, collapsible, compartments
- style: minimalist, bohemian, modern, farmhouse, industrial, natural

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// STATIONERY SCHEMAS
// ============================================================================

export const STATIONERY_NOTEBOOKS_SCHEMA: CategorySchema = {
  category: "Stationery",
  subcategory: "Notebooks",
  attributes: [
    "primaryColor",
    "coverType",
    "coverMaterial",
    "bindingType",
    "pageType",
    "size",
    "style",
  ],
  dealBreakers: ["coverType", "bindingType", "pageType"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "coverType", maxPoints: 18, isCritical: true },
    { name: "coverMaterial", maxPoints: 15, isCritical: false },
    { name: "bindingType", maxPoints: 18, isCritical: true },
    { name: "pageType", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 9, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise stationery attribute extractor analyzing a NOTEBOOK.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: black, brown, navy, pink, white, kraft, colored, patterned

**TYPE:**
- coverType: hardcover, softcover, leather, fabric, kraft, plastic
- coverMaterial: leather, faux-leather, cloth, paper, cardboard, plastic
- bindingType: spiral, sewn, perfect-bound, disc-bound, ring-binder, stapled

**PAGES:**
- pageType: lined, dotted, grid, blank, mixed, cornell
- size: pocket (A6), medium (A5), large (A4), b5, letter, travelers

**STYLE:**
- style: minimalist, aesthetic, professional, bullet-journal, academic, luxury

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const STATIONERY_PLANNERS_SCHEMA: CategorySchema = {
  category: "Stationery",
  subcategory: "Planners",
  attributes: [
    "primaryColor",
    "plannerType",
    "coverType",
    "layoutType",
    "size",
    "features",
    "style",
  ],
  dealBreakers: ["plannerType", "layoutType", "size"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "plannerType", maxPoints: 20, isCritical: true },
    { name: "coverType", maxPoints: 12, isCritical: false },
    { name: "layoutType", maxPoints: 20, isCritical: true },
    { name: "size", maxPoints: 15, isCritical: true },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "style", maxPoints: 9, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise stationery attribute extractor analyzing a PLANNER.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: black, white, pink, blue, neutral, floral, patterned

**TYPE:**
- plannerType: daily, weekly, monthly, academic, financial, fitness, meal, undated
- coverType: hardcover, softcover, ring-binder, disc-bound
- layoutType: horizontal, vertical, hourly, box-grid, dashboard

**DETAILS:**
- size: pocket, a5, a4, letter, happy-planner, travelers
- features: tabs, stickers, pockets, goals-pages, habit-tracker, notes-section
- style: minimalist, aesthetic, professional, colorful, functional

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const STATIONERY_PENS_SCHEMA: CategorySchema = {
  category: "Stationery",
  subcategory: "Pens",
  attributes: [
    "primaryColor",
    "penType",
    "inkColor",
    "tipSize",
    "material",
    "brand",
    "style",
  ],
  dealBreakers: ["penType", "inkColor", "tipSize"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "penType", maxPoints: 22, isCritical: true },
    { name: "inkColor", maxPoints: 18, isCritical: true },
    { name: "tipSize", maxPoints: 15, isCritical: true },
    { name: "material", maxPoints: 10, isCritical: false },
    { name: "brand", maxPoints: 13, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise stationery attribute extractor analyzing a PEN.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Body color (black, white, clear, colored, metallic)
- inkColor: black, blue, red, colored, multi-color

**TYPE:**
- penType: ballpoint, gel, rollerball, fountain, felt-tip, brush, marker, highlighter, fineliner
- tipSize: extra-fine (0.3mm), fine (0.5mm), medium (0.7mm), bold (1.0mm+)

**DETAILS:**
- material: plastic, metal, wood, rubber-grip
- brand: Pilot, Muji, Zebra, Sakura, Pentel, Lamy, Moleskine, etc.
- style: minimalist, cute, professional, luxury, everyday

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const STATIONERY_JOURNALS_SCHEMA: CategorySchema = {
  category: "Stationery",
  subcategory: "Journals",
  attributes: [
    "primaryColor",
    "journalType",
    "coverType",
    "coverMaterial",
    "closureType",
    "size",
    "style",
  ],
  dealBreakers: ["journalType", "coverMaterial", "closureType"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "journalType", maxPoints: 20, isCritical: true },
    { name: "coverType", maxPoints: 12, isCritical: false },
    { name: "coverMaterial", maxPoints: 18, isCritical: true },
    { name: "closureType", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise stationery attribute extractor analyzing a JOURNAL.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: brown, black, navy, burgundy, natural, colored

**TYPE:**
- journalType: blank, lined, gratitude, travel, dream, prayer, art, guided
- coverType: hardcover, softcover, wraparound
- coverMaterial: leather, faux-leather, cloth, kraft, handmade-paper

**DETAILS:**
- closureType: elastic-band, tie-closure, magnetic, strap, none
- size: pocket, a5, a4, travelers, moleskine
- style: vintage, minimalist, bohemian, luxury, artisan, rustic

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const STATIONERY_DESK_ACCESSORIES_SCHEMA: CategorySchema = {
  category: "Stationery",
  subcategory: "Desk Accessories",
  attributes: [
    "primaryColor",
    "accessoryType",
    "material",
    "size",
    "features",
    "style",
  ],
  dealBreakers: ["accessoryType", "material", "style"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "accessoryType", maxPoints: 25, isCritical: true },
    { name: "material", maxPoints: 20, isCritical: true },
    { name: "size", maxPoints: 10, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 20, isCritical: true },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise stationery attribute extractor analyzing DESK ACCESSORIES.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: white, black, gold, rose-gold, wood, marble, acrylic-clear

**TYPE:**
- accessoryType: pen-holder, desk-organizer, tape-dispenser, stapler, paperweight, letter-tray, monitor-stand, pencil-cup, memo-holder, bookends
- material: acrylic, metal, wood, marble, ceramic, bamboo, leather

**DETAILS:**
- size: small, medium, large, desk-set
- features: compartments, stackable, rotating, magnetic
- style: minimalist, aesthetic, professional, cute, luxury, modern

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// PET SCHEMAS
// ============================================================================

export const PET_COLLARS_SCHEMA: CategorySchema = {
  category: "Pet",
  subcategory: "Collars",
  attributes: [
    "primaryColor",
    "collarType",
    "material",
    "closureType",
    "size",
    "features",
    "style",
  ],
  dealBreakers: ["collarType", "material", "closureType"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "collarType", maxPoints: 20, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "closureType", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise pet product attribute extractor analyzing a PET COLLAR.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color or pattern

**TYPE:**
- collarType: standard, martingale, breakaway, harness, bandana, bowtie, smart/gps
- material: nylon, leather, fabric, biothane, chain, velvet, rope
- closureType: buckle, snap, quick-release, slip, martingale

**DETAILS:**
- size: xs, small, medium, large, xl, adjustable
- features: reflective, personalized, padded, waterproof, airtag-holder
- style: classic, trendy, luxury, rugged, cute, minimal

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const PET_LEASHES_SCHEMA: CategorySchema = {
  category: "Pet",
  subcategory: "Leashes",
  attributes: [
    "primaryColor",
    "leashType",
    "material",
    "length",
    "handleType",
    "features",
    "style",
  ],
  dealBreakers: ["leashType", "material", "length"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "leashType", maxPoints: 22, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "length", maxPoints: 18, isCritical: true },
    { name: "handleType", maxPoints: 10, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise pet product attribute extractor analyzing a PET LEASH.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color or pattern

**TYPE:**
- leashType: standard, retractable, hands-free, traffic, double, rope, chain
- material: nylon, leather, rope, biothane, chain, fabric
- length: short (4ft), standard (6ft), long (10ft+), adjustable

**DETAILS:**
- handleType: loop, padded, traffic-handle, dual-handle, carabiner
- features: reflective, shock-absorbing, waterproof, multi-dog, waste-bag-holder
- style: classic, sporty, luxury, tactical, cute, minimal

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const PET_TOYS_SCHEMA: CategorySchema = {
  category: "Pet",
  subcategory: "Pet Toys",
  attributes: [
    "primaryColor",
    "toyType",
    "material",
    "size",
    "features",
    "petType",
    "style",
  ],
  dealBreakers: ["toyType", "material", "petType"],
  weights: [
    { name: "primaryColor", maxPoints: 10, isCritical: false },
    { name: "toyType", maxPoints: 22, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "size", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "petType", maxPoints: 18, isCritical: true },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise pet product attribute extractor analyzing a PET TOY.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color (or multi-color)

**TYPE:**
- toyType: ball, rope, plush, chew, puzzle, fetch, squeaky, catnip, feather, tunnel, scratching
- material: rubber, rope, plush, nylon, plastic, wood, natural
- petType: dog, cat, small-animal, bird

**DETAILS:**
- size: small, medium, large, variety-pack
- features: squeaker, treat-dispensing, interactive, durable, floats, crinkle
- style: classic, cute, funny, natural, designer

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const PET_BEDS_SCHEMA: CategorySchema = {
  category: "Pet",
  subcategory: "Pet Beds",
  attributes: [
    "primaryColor",
    "bedType",
    "material",
    "shape",
    "size",
    "features",
    "style",
  ],
  dealBreakers: ["bedType", "shape", "size"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "bedType", maxPoints: 20, isCritical: true },
    { name: "material", maxPoints: 15, isCritical: false },
    { name: "shape", maxPoints: 18, isCritical: true },
    { name: "size", maxPoints: 18, isCritical: true },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 7, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise pet product attribute extractor analyzing a PET BED.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: gray, beige, brown, white, pink, patterned

**TYPE:**
- bedType: donut, bolster, flat, cave, elevated, orthopedic, heated, cooling, travel
- material: fleece, memory-foam, canvas, sherpa, waterproof, faux-fur
- shape: round, rectangular, oval, cave, raised

**DETAILS:**
- size: small, medium, large, xl, giant
- features: washable-cover, non-slip, chew-resistant, portable, orthopedic
- style: modern, cozy, luxury, outdoor, minimal

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const PET_BOWLS_SCHEMA: CategorySchema = {
  category: "Pet",
  subcategory: "Pet Bowls",
  attributes: [
    "primaryColor",
    "bowlType",
    "material",
    "size",
    "features",
    "style",
  ],
  dealBreakers: ["bowlType", "material", "size"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "bowlType", maxPoints: 22, isCritical: true },
    { name: "material", maxPoints: 20, isCritical: true },
    { name: "size", maxPoints: 18, isCritical: true },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "style", maxPoints: 13, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise pet product attribute extractor analyzing a PET BOWL/FEEDER.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: white, silver, black, wood, colored, patterned

**TYPE:**
- bowlType: standard, elevated, slow-feeder, automatic, travel, fountain, double
- material: stainless-steel, ceramic, plastic, bamboo, silicone
- size: small, medium, large, cat-size, giant

**DETAILS:**
- features: non-slip, dishwasher-safe, slow-feed, timed-dispenser, water-fountain
- style: modern, rustic, minimal, cute, luxury

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// FITNESS SCHEMAS
// ============================================================================

export const FITNESS_YOGA_MATS_SCHEMA: CategorySchema = {
  category: "Fitness",
  subcategory: "Yoga Mats",
  attributes: [
    "primaryColor",
    "pattern",
    "material",
    "thickness",
    "size",
    "features",
    "style",
  ],
  dealBreakers: ["material", "thickness", "size"],
  weights: [
    { name: "primaryColor", maxPoints: 15, isCritical: false },
    { name: "pattern", maxPoints: 10, isCritical: false },
    { name: "material", maxPoints: 20, isCritical: true },
    { name: "thickness", maxPoints: 18, isCritical: true },
    { name: "size", maxPoints: 15, isCritical: true },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise fitness product attribute extractor analyzing a YOGA MAT.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- pattern: solid, marble, ombre, printed, mandala, geometric

**TYPE:**
- material: pvc, tpe, rubber, cork, jute, microfiber, eco-friendly
- thickness: thin (2-3mm), standard (4-5mm), thick (6mm+), extra-thick (8mm+)
- size: standard (68"), long (72"+), wide, travel

**DETAILS:**
- features: non-slip, alignment-lines, carrying-strap, closed-cell, reversible
- style: minimalist, bohemian, athletic, premium, eco

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FITNESS_RESISTANCE_BANDS_SCHEMA: CategorySchema = {
  category: "Fitness",
  subcategory: "Resistance Bands",
  attributes: [
    "primaryColor",
    "bandType",
    "resistanceLevel",
    "material",
    "features",
    "quantity",
    "style",
  ],
  dealBreakers: ["bandType", "resistanceLevel", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 10, isCritical: false },
    { name: "bandType", maxPoints: 22, isCritical: true },
    { name: "resistanceLevel", maxPoints: 22, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "quantity", maxPoints: 8, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise fitness product attribute extractor analyzing RESISTANCE BANDS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Usually color-coded by resistance (yellow, red, green, blue, black, etc.)

**TYPE:**
- bandType: loop, tube-with-handles, flat, fabric/hip-band, figure-8, therapy
- resistanceLevel: light, medium, heavy, extra-heavy, set/multi-level
- material: latex, fabric, rubber, non-latex

**DETAILS:**
- features: handles, door-anchor, ankle-straps, non-slip, stackable
- quantity: single, pair, set (3-5), complete-kit
- style: professional, home-gym, portable, physical-therapy

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FITNESS_WEIGHTS_SCHEMA: CategorySchema = {
  category: "Fitness",
  subcategory: "Weights",
  attributes: [
    "primaryColor",
    "weightType",
    "material",
    "weightAmount",
    "coating",
    "features",
    "style",
  ],
  dealBreakers: ["weightType", "material", "weightAmount"],
  weights: [
    { name: "primaryColor", maxPoints: 10, isCritical: false },
    { name: "weightType", maxPoints: 22, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "weightAmount", maxPoints: 22, isCritical: true },
    { name: "coating", maxPoints: 10, isCritical: false },
    { name: "features", maxPoints: 10, isCritical: false },
    { name: "style", maxPoints: 8, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise fitness product attribute extractor analyzing WEIGHTS/DUMBBELLS.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: black, gray, colored, chrome, neoprene-colored

**TYPE:**
- weightType: dumbbell, kettlebell, barbell, plate, ankle-weight, wrist-weight, medicine-ball
- material: cast-iron, rubber-coated, neoprene, chrome, vinyl, adjustable
- weightAmount: light (1-5lb), medium (8-15lb), heavy (20-35lb), very-heavy (40lb+), adjustable, set

**DETAILS:**
- coating: rubber, neoprene, vinyl, bare-metal, urethane
- features: hex-shape, adjustable, rack-included, ergonomic-grip
- style: professional, home-gym, compact, aesthetic

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FITNESS_GYM_BAGS_SCHEMA: CategorySchema = {
  category: "Fitness",
  subcategory: "Gym Bags",
  attributes: [
    "primaryColor",
    "bagType",
    "material",
    "size",
    "features",
    "compartments",
    "style",
  ],
  dealBreakers: ["bagType", "size", "material"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "bagType", maxPoints: 20, isCritical: true },
    { name: "material", maxPoints: 15, isCritical: true },
    { name: "size", maxPoints: 18, isCritical: true },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "compartments", maxPoints: 12, isCritical: false },
    { name: "style", maxPoints: 11, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise fitness product attribute extractor analyzing a GYM BAG.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: black, gray, navy, pink, camo, multi-color

**TYPE:**
- bagType: duffel, backpack, tote, drawstring, weekender, sling
- material: nylon, polyester, canvas, mesh, leather, recycled
- size: small, medium, large, weekender, carry-on

**DETAILS:**
- features: shoe-compartment, wet-pocket, yoga-mat-strap, laptop-sleeve, water-resistant
- compartments: minimal, multiple, organized, mesh-pockets
- style: athletic, minimal, luxury, tactical, street

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

export const FITNESS_WATER_BOTTLES_SCHEMA: CategorySchema = {
  category: "Fitness",
  subcategory: "Water Bottles",
  attributes: [
    "primaryColor",
    "bottleType",
    "material",
    "capacity",
    "lidType",
    "features",
    "style",
  ],
  dealBreakers: ["bottleType", "material", "capacity"],
  weights: [
    { name: "primaryColor", maxPoints: 12, isCritical: false },
    { name: "bottleType", maxPoints: 18, isCritical: true },
    { name: "material", maxPoints: 18, isCritical: true },
    { name: "capacity", maxPoints: 18, isCritical: true },
    { name: "lidType", maxPoints: 12, isCritical: false },
    { name: "features", maxPoints: 12, isCritical: false },
    { name: "style", maxPoints: 10, isCritical: false },
  ],
  totalPoints: 100,
  extractionPrompt: `You are a precise fitness product attribute extractor analyzing a WATER BOTTLE.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color (or gradient/ombre)

**TYPE:**
- bottleType: standard, insulated, motivational, smart, collapsible, squeeze, gallon-jug
- material: stainless-steel, plastic, glass, bpa-free, tritan, silicone
- capacity: small (12-16oz), medium (20-24oz), large (32oz), xl (40oz+), gallon

**DETAILS:**
- lidType: screw-top, flip-top, straw, chug, wide-mouth, sports-cap
- features: time-markers, insulated, infuser, handle, carabiner, leak-proof
- style: minimal, sporty, aesthetic, motivational, premium

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON only.`,
};

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

export const CATEGORY_SCHEMAS: Record<string, CategorySchema> = {
  // Clothing (9 schemas)
  "Clothing:Tops": CLOTHING_TOPS_SCHEMA,
  "Clothing:Bottoms": CLOTHING_BOTTOMS_SCHEMA,
  "Clothing:Dresses": CLOTHING_DRESSES_SCHEMA,
  "Clothing:Outerwear": CLOTHING_OUTERWEAR_SCHEMA,
  "Clothing:Activewear": CLOTHING_ACTIVEWEAR_SCHEMA,
  "Clothing:Swimwear": CLOTHING_SWIMWEAR_SCHEMA,
  "Clothing:Lingerie": CLOTHING_LINGERIE_SCHEMA,
  "Clothing:Loungewear": CLOTHING_LOUNGEWEAR_SCHEMA,
  "Clothing:Jumpsuits": CLOTHING_JUMPSUITS_SCHEMA,

  // Footwear (8 schemas)
  "Footwear:Sneakers": FOOTWEAR_SNEAKERS_SCHEMA,
  "Footwear:Heels": FOOTWEAR_HEELS_SCHEMA,
  "Footwear:Flats": FOOTWEAR_FLATS_SCHEMA,
  "Footwear:Boots": FOOTWEAR_BOOTS_SCHEMA,
  "Footwear:Sandals": FOOTWEAR_SANDALS_SCHEMA,
  "Footwear:Loafers": FOOTWEAR_LOAFERS_SCHEMA,
  "Footwear:Slides": FOOTWEAR_SLIDES_SCHEMA,
  "Footwear:Mules": FOOTWEAR_MULES_SCHEMA,

  // Bags (7 schemas)
  "Bags:Totes": BAGS_TOTES_SCHEMA,
  "Bags:Crossbody": BAGS_CROSSBODY_SCHEMA,
  "Bags:Clutches": BAGS_CLUTCHES_SCHEMA,
  "Bags:Backpacks": BAGS_BACKPACKS_SCHEMA,
  "Bags:Shoulder": BAGS_SHOULDER_SCHEMA,
  "Bags:Belt Bags": BAGS_BELT_BAGS_SCHEMA,
  "Bags:Mini Bags": BAGS_MINI_BAGS_SCHEMA,

  // Jewelry (6 schemas)
  "Jewelry:Earrings": JEWELRY_EARRINGS_SCHEMA,
  "Jewelry:Necklaces": JEWELRY_NECKLACES_SCHEMA,
  "Jewelry:Bracelets": JEWELRY_BRACELETS_SCHEMA,
  "Jewelry:Rings": JEWELRY_RINGS_SCHEMA,
  "Jewelry:Watches": JEWELRY_WATCHES_SCHEMA,
  "Jewelry:Anklets": JEWELRY_ANKLETS_SCHEMA,

  // Accessories (7 schemas)
  "Accessories:Hats": ACCESSORIES_HATS_SCHEMA,
  "Accessories:Scarves": ACCESSORIES_SCARVES_SCHEMA,
  "Accessories:Belts": ACCESSORIES_BELTS_SCHEMA,
  "Accessories:Hair Accessories": ACCESSORIES_HAIR_SCHEMA,
  "Accessories:Sunglasses": ACCESSORIES_SUNGLASSES_SCHEMA,
  "Accessories:Socks": ACCESSORIES_SOCKS_SCHEMA,
  "Accessories:Wallets": ACCESSORIES_WALLETS_SCHEMA,

  // Beauty (7 schemas)
  "Beauty:Lipstick": BEAUTY_LIPSTICK_SCHEMA,
  "Beauty:Foundation": BEAUTY_FOUNDATION_SCHEMA,
  "Beauty:Skincare": BEAUTY_SKINCARE_SCHEMA,
  "Beauty:Fragrance": BEAUTY_FRAGRANCE_SCHEMA,
  "Beauty:Nail Polish": BEAUTY_NAIL_POLISH_SCHEMA,
  "Beauty:Eye Makeup": BEAUTY_EYE_MAKEUP_SCHEMA,
  "Beauty:Hair Products": BEAUTY_HAIR_PRODUCTS_SCHEMA,

  // Tech (11 schemas)
  "Tech:Phone Cases": TECH_PHONE_CASES_SCHEMA,
  "Tech:Headphones": TECH_HEADPHONES_SCHEMA,
  "Tech:Earbuds": TECH_EARBUDS_SCHEMA,
  "Tech:Cameras": TECH_CAMERAS_SCHEMA,
  "Tech:Tablets": TECH_TABLETS_SCHEMA,
  "Tech:Laptops": TECH_LAPTOPS_SCHEMA,
  "Tech:Speakers": TECH_SPEAKERS_SCHEMA,
  "Tech:Gaming": TECH_GAMING_SCHEMA,
  "Tech:E-readers": TECH_EREADERS_SCHEMA,
  "Tech:Power Banks": TECH_POWER_BANKS_SCHEMA,
  "Tech:Smart Speakers": TECH_SMART_SPEAKERS_SCHEMA,

  // Home (10 schemas)
  "Home:Candles": HOME_CANDLES_SCHEMA,
  "Home:Mugs": HOME_MUGS_SCHEMA,
  "Home:Decor": HOME_DECOR_SCHEMA,
  "Home:Planters": HOME_PLANTERS_SCHEMA,
  "Home:Blankets": HOME_BLANKETS_SCHEMA,
  "Home:Pillows": HOME_PILLOWS_SCHEMA,
  "Home:Lamps": HOME_LAMPS_SCHEMA,
  "Home:Rugs": HOME_RUGS_SCHEMA,
  "Home:Diffusers": HOME_DIFFUSERS_SCHEMA,
  "Home:Storage": HOME_STORAGE_SCHEMA,

  // Stationery (5 schemas)
  "Stationery:Notebooks": STATIONERY_NOTEBOOKS_SCHEMA,
  "Stationery:Planners": STATIONERY_PLANNERS_SCHEMA,
  "Stationery:Pens": STATIONERY_PENS_SCHEMA,
  "Stationery:Journals": STATIONERY_JOURNALS_SCHEMA,
  "Stationery:Desk Accessories": STATIONERY_DESK_ACCESSORIES_SCHEMA,

  // Pet (5 schemas)
  "Pet:Collars": PET_COLLARS_SCHEMA,
  "Pet:Leashes": PET_LEASHES_SCHEMA,
  "Pet:Pet Toys": PET_TOYS_SCHEMA,
  "Pet:Pet Beds": PET_BEDS_SCHEMA,
  "Pet:Pet Bowls": PET_BOWLS_SCHEMA,

  // Fitness (5 schemas)
  "Fitness:Yoga Mats": FITNESS_YOGA_MATS_SCHEMA,
  "Fitness:Resistance Bands": FITNESS_RESISTANCE_BANDS_SCHEMA,
  "Fitness:Weights": FITNESS_WEIGHTS_SCHEMA,
  "Fitness:Gym Bags": FITNESS_GYM_BAGS_SCHEMA,
  "Fitness:Water Bottles": FITNESS_WATER_BOTTLES_SCHEMA,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get schema for a category/subcategory combination
 */
export function getSchema(category: ProductCategory, subcategory: Subcategory): CategorySchema | null {
  const key = `${category}:${subcategory}`;
  return CATEGORY_SCHEMAS[key] || null;
}

/**
 * Get schema by key (e.g., "Clothing:Tops")
 */
export function getSchemaByKey(key: string): CategorySchema | null {
  return CATEGORY_SCHEMAS[key] || null;
}

/**
 * Infer subcategory from product name
 */
export function inferSubcategory(productName: string, category: ProductCategory): Subcategory | null {
  const nameLower = productName.toLowerCase();

  switch (category) {
    case "Clothing":
      if (/jumpsuit|romper|playsuit|overall/.test(nameLower)) return "Jumpsuits";
      if (/dress|gown/.test(nameLower)) return "Dresses";
      if (/jacket|coat|blazer|cardigan|hoodie|vest|parka|bomber|fleece/.test(nameLower)) return "Outerwear";
      if (/legging|sports bra|yoga|athletic|gym|workout/.test(nameLower)) return "Activewear";
      if (/bikini|swimsuit|swim|bathing|cover-up|rashguard/.test(nameLower)) return "Swimwear";
      if (/bralette|bra|lingerie|bodysuit|corset|bustier/.test(nameLower)) return "Lingerie";
      if (/lounge|sweatpant|jogger|robe|pajama|sleepwear/.test(nameLower)) return "Loungewear";
      if (/pant|jean|short|skirt|trouser/.test(nameLower)) return "Bottoms";
      return "Tops"; // Default for clothing

    case "Footwear":
      if (/sneaker|trainer|running|basketball|tennis/.test(nameLower)) return "Sneakers";
      if (/heel|pump|stiletto/.test(nameLower)) return "Heels";
      if (/boot|bootie|chelsea|combat|ankle boot/.test(nameLower)) return "Boots";
      if (/loafer|penny|tassel|horsebit|driving/.test(nameLower)) return "Loafers";
      if (/slide|pool|sport slide/.test(nameLower)) return "Slides";
      if (/mule|clog|backless/.test(nameLower)) return "Mules";
      if (/sandal|flip|gladiator|espadrille|wedge/.test(nameLower)) return "Sandals";
      return "Flats"; // Default for footwear

    case "Bags":
      if (/tote/.test(nameLower)) return "Totes";
      if (/crossbody|cross-body/.test(nameLower)) return "Crossbody";
      if (/shoulder|hobo|baguette/.test(nameLower)) return "Shoulder";
      if (/clutch|evening|minaudiere/.test(nameLower)) return "Clutches";
      if (/backpack|rucksack/.test(nameLower)) return "Backpacks";
      if (/belt bag|fanny|waist bag|sling/.test(nameLower)) return "Belt Bags";
      if (/mini|micro|tiny|small bag/.test(nameLower)) return "Mini Bags";
      return "Totes"; // Default for bags

    case "Jewelry":
      if (/earring/.test(nameLower)) return "Earrings";
      if (/necklace|pendant|chain|choker/.test(nameLower)) return "Necklaces";
      if (/bracelet|bangle|cuff/.test(nameLower)) return "Bracelets";
      if (/anklet|ankle/.test(nameLower)) return "Anklets";
      if (/ring/.test(nameLower)) return "Rings";
      if (/watch|smartwatch/.test(nameLower)) return "Watches";
      return "Earrings"; // Default for jewelry

    case "Accessories":
      if (/hat|cap|beanie|fedora|bucket|visor/.test(nameLower)) return "Hats";
      if (/scarf|shawl|wrap/.test(nameLower)) return "Scarves";
      if (/belt/.test(nameLower)) return "Belts";
      if (/scrunchie|clip|headband|barrette|hair/.test(nameLower)) return "Hair Accessories";
      if (/sunglass|eyewear/.test(nameLower)) return "Sunglasses";
      if (/sock/.test(nameLower)) return "Socks";
      if (/wallet|card holder|cardholder/.test(nameLower)) return "Wallets";
      return "Scarves"; // Default for accessories

    case "Beauty":
      if (/lipstick|lip gloss|lip stain|lip oil|lip liner|lip balm/.test(nameLower)) return "Lipstick";
      if (/foundation|concealer|primer|bb cream|cc cream|tinted moisturizer/.test(nameLower)) return "Foundation";
      if (/moisturizer|serum|cleanser|toner|sunscreen|eye cream|face oil|mask|essence/.test(nameLower)) return "Skincare";
      if (/perfume|fragrance|cologne|eau de|body mist/.test(nameLower)) return "Fragrance";
      if (/nail polish|nail lacquer|gel polish|manicure/.test(nameLower)) return "Nail Polish";
      if (/eyeshadow|mascara|eyeliner|brow|lash|eye primer/.test(nameLower)) return "Eye Makeup";
      if (/shampoo|conditioner|hair mask|hair oil|styling|hair spray|mousse|dry shampoo/.test(nameLower)) return "Hair Products";
      return "Skincare"; // Default for beauty

    case "Tech":
      if (/phone case|iphone case|case/.test(nameLower)) return "Phone Cases";
      if (/headphone|over-ear|on-ear/.test(nameLower)) return "Headphones";
      if (/earbud|airpod|wireless ear/.test(nameLower)) return "Earbuds";
      if (/camera|dslr|mirrorless|point.?and.?shoot|action cam|gopro/.test(nameLower)) return "Cameras";
      if (/tablet|ipad|galaxy tab|surface/.test(nameLower)) return "Tablets";
      if (/laptop|macbook|chromebook|notebook|ultrabook/.test(nameLower)) return "Laptops";
      if (/speaker|bluetooth speaker|portable speaker|soundbar/.test(nameLower)) return "Speakers";
      if (/gaming|controller|console|playstation|xbox|nintendo|game/.test(nameLower)) return "Gaming";
      if (/e-reader|kindle|ebook|kobo|nook/.test(nameLower)) return "E-readers";
      if (/power bank|portable charger|battery pack/.test(nameLower)) return "Power Banks";
      if (/smart speaker|alexa|echo|google home|homepod/.test(nameLower)) return "Smart Speakers";
      return "Phone Cases"; // Default for tech

    case "Home":
      if (/candle/.test(nameLower)) return "Candles";
      if (/mug|cup|tumbler/.test(nameLower)) return "Mugs";
      if (/planter|pot|plant holder|plant stand/.test(nameLower)) return "Planters";
      if (/blanket|throw|quilt|afghan/.test(nameLower)) return "Blankets";
      if (/pillow|cushion/.test(nameLower)) return "Pillows";
      if (/lamp|light|lighting|sconce|chandelier/.test(nameLower)) return "Lamps";
      if (/rug|carpet|mat|runner/.test(nameLower)) return "Rugs";
      if (/diffuser|oil diffuser|reed diffuser|aromatherapy/.test(nameLower)) return "Diffusers";
      if (/storage|basket|bin|box|organizer|container/.test(nameLower)) return "Storage";
      if (/vase|figurine|frame|mirror|decor|sculpture/.test(nameLower)) return "Decor";
      return "Decor"; // Default for home

    case "Stationery":
      if (/notebook/.test(nameLower)) return "Notebooks";
      if (/planner|agenda|calendar/.test(nameLower)) return "Planners";
      if (/pen|pencil|marker|highlighter/.test(nameLower)) return "Pens";
      if (/journal|diary/.test(nameLower)) return "Journals";
      if (/desk|organizer|holder|tray|paperweight|stapler|tape/.test(nameLower)) return "Desk Accessories";
      return "Notebooks"; // Default for stationery

    case "Pet":
      if (/collar/.test(nameLower)) return "Collars";
      if (/leash|lead/.test(nameLower)) return "Leashes";
      if (/toy|chew|ball|squeaky/.test(nameLower)) return "Pet Toys";
      if (/bed|mat|cushion|crate/.test(nameLower)) return "Pet Beds";
      if (/bowl|feeder|dish|fountain/.test(nameLower)) return "Pet Bowls";
      return "Collars"; // Default for pet

    case "Fitness":
      if (/yoga mat|exercise mat|fitness mat/.test(nameLower)) return "Yoga Mats";
      if (/resistance band|exercise band|loop band/.test(nameLower)) return "Resistance Bands";
      if (/weight|dumbbell|kettlebell|barbell/.test(nameLower)) return "Weights";
      if (/gym bag|duffel|sports bag|workout bag/.test(nameLower)) return "Gym Bags";
      if (/water bottle|shaker|hydration/.test(nameLower)) return "Water Bottles";
      return "Yoga Mats"; // Default for fitness

    default:
      return null;
  }
}

/**
 * Get all available category keys
 */
export function getAllSchemaKeys(): string[] {
  return Object.keys(CATEGORY_SCHEMAS);
}

/**
 * Get subcategories for a category
 */
export function getSubcategoriesForCategory(category: ProductCategory): Subcategory[] {
  return Object.keys(CATEGORY_SCHEMAS)
    .filter((key) => key.startsWith(`${category}:`))
    .map((key) => key.split(":")[1] as Subcategory);
}
