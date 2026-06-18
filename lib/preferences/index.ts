export {
  FUSELY_PREFS_STORAGE_KEY,
  loadFuselyPrefs,
  normalizeFuselyPrefs,
  saveCustomMaskTerms,
  saveDetectionPrefs,
  saveFuselyPrefs,
} from "./fuselyPrefs";
export {
  createTermId,
  getCustomMaskTermDedupKey,
  getEnabledCustomMaskTexts,
  MAX_CUSTOM_MASK_TERM_LENGTH,
  MAX_CUSTOM_MASK_TERMS,
  normalizeCustomMaskTerms,
  sanitizeCustomMaskTermsForSave,
} from "./customMaskTerms";
export { deepMergeRecords } from "./deepMerge";
export {
  DEFAULT_FUSELY_PREFS,
  type CustomMaskTerm,
  type DetectionPrefs,
  type FuselyPrefs,
} from "./types";
