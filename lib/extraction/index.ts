/**
 * Comprehensive Video Extraction Module
 *
 * Exports the complete extraction system for extracting
 * "Digital DNA" from creator videos.
 */

// Types
export * from "./types";

// Extractor
export {
  ComprehensiveExtractor,
  getExtractor,
  extractVideoDigitalDNA,
  type ExtractorOptions,
} from "./comprehensive-extractor";
