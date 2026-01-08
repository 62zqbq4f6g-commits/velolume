/**
 * VELOLUME SHARED DATA ENGINE
 * Type Exports
 * 
 * This is the main entry point for all type definitions.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export {
  // IDs
  EntityId,
  ContentId,
  ProductId,
  ProductMentionId,
  CanonicalProductId,
  
  // ID creators
  createEntityId,
  createContentId,
  createProductId,
  createProductMentionId,
  createCanonicalProductId,
  
  // Primitives
  Timestamp,
  Price,
  PriceRange,
  
  // Evidence system
  EvidenceType,
  Evidence,
  BoundingBox,
  
  // Claim system
  ClaimSource,
  Claim,
  createClaim,
  confirmClaim,
  correctClaim,
  
  // Temporal
  LifespanType,
  TemporalData,
  
  // Embeddings
  Embedding,
  StyleFingerprint,
  VoiceFingerprint,
  
  // Trust & Verification
  VerificationLevel,
  TrustSignals,
  
  // Platform & Source
  Platform,
  SubmissionType,
  
  // Extraction
  ExtractionDepth,
  ProcessingMetadata,
  
  // Enums
  ProductCategory,
  ContentFormat,
  HookType,
  Sentiment,
  ProductPositioning,
} from './core';

// =============================================================================
// ENTITY TYPES
// =============================================================================

export {
  EntityType,
  Entity,
  ContentPatterns,
  Recommendation,
  Goal,
  createMinimalEntity,
} from './entity';

// =============================================================================
// CONTENT TYPES
// =============================================================================

export {
  ContentMediaType,
  Content,
  ProductMention,
  createContentForProcessing,
} from './content';

// =============================================================================
// PRODUCT TYPES
// =============================================================================

export {
  ProductStatus,
  CanonicalProduct,
  ProductListing,
  ProductCatalog,
  ProductMatchRequest,
  ProductMatchResult,
  CategorySchema,
  CATEGORY_SCHEMAS,
  createCanonicalProduct,
} from './product';

// =============================================================================
// MACHINE-READABLE TYPES
// =============================================================================

export {
  // llms.txt
  LlmsTxtData,
  generateLlmsTxt,
  
  // discovery.json
  DiscoveryJson,
  
  // products.json
  ProductsJson,
  ProductJsonEntry,
  
  // Schema.org
  SchemaOrgPerson,
  SchemaOrgOrganization,
  SchemaOrgProduct,
  SchemaOrgItemList,
  
  // Agent API
  AgentQueryType,
  AgentQueryRequest,
  AgentQueryResponse,
  
  // Helpers
  generateQueryExamples,
} from './machine-readable';
