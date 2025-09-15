/**
 * Application constants and configuration
 */

// Font Categories
export const FONT_CATEGORIES = {
  NASTALIQ: 'font.category.nastaliq',
  NASKH: 'font.category.naskh',
  TRADITIONAL: 'font.category.traditional',
  MODERN: 'font.category.modern',
  PERSIAN: 'font.category.persian',
  CALLIGRAPHIC: 'font.category.calligraphic',
  BALOO: 'font.category.baloo',
  MODERN_UI: 'font.category.modern.ui',
  SAMEER: 'font.category.sameer',
} as const;

// Page Sizes
export const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 216, height: 279 },
} as const;

// Dimension Constants
export const MM_TO_PX = 3.7795275591;
export const PX_TO_MM = 1 / MM_TO_PX;
export const MM_TO_INCHES = 1 / 25.4;
export const INCHES_TO_MM = 25.4;

// Zoom Limits
export const ZOOM_LIMITS = {
  MIN: 0.25,
  MAX: 3,
  DEFAULT: 1,
} as const;

// Margin Limits
export const MARGIN_LIMITS = {
  MIN: 0,
  MAX_MM: 100,
  MAX_INCHES: 4,
} as const;

// Font Size Options
export const FONT_SIZES = [
  { value: '8', label: '8px' },
  { value: '9', label: '9px' },
  { value: '10', label: '10px' },
  { value: '11', label: '11px' },
  { value: '12', label: '12px' },
  { value: '14', label: '14px' },
  { value: '16', label: '16px' },
  { value: '18', label: '18px' },
  { value: '20', label: '20px' },
  { value: '22', label: '22px' },
  { value: '24', label: '24px' },
  { value: '26', label: '26px' },
  { value: '28', label: '28px' },
  { value: '30', label: '30px' },
  { value: '32', label: '32px' },
  { value: '36', label: '36px' },
  { value: '40', label: '40px' },
  { value: '44', label: '44px' },
  { value: '48', label: '48px' },
  { value: '54', label: '54px' },
  { value: '60', label: '60px' },
  { value: '72', label: '72px' },
  { value: '96', label: '96px' },
] as const;

// Font Family Mappings
export const FONT_FAMILY_MAP = {
  // Urdu Nasta'liq Fonts
  'nastaliq': 'Noto Nastaliq Urdu, serif',
  'gulzar': 'Gulzar, serif',
  'jameel-noori': 'Jameel Noori Nastaleeq, serif',
  'al-qalam': 'Al Qalam Taj Nastaleeq, serif',
  'alvi-nastaleeq': 'Alvi Nastaleeq, serif',
  'nafees-nastaleeq': 'Nafees Nastaleeq, serif',
  'fajer-noori': 'Fajer Noori Nastalique, serif',
  'aasar-unicode': 'Aasar Unicode, serif',
  
  // Arabic Naskh Fonts
  'naskh': 'Noto Naskh Arabic, serif',
  'naskh-sans': 'Noto Sans Arabic, sans-serif',
  'naskh-serif': 'Noto Serif Arabic, serif',
  'paktype-naskh': 'PakType Naskh Basic, serif',
  
  // Traditional Arabic Fonts
  'amiri': 'Amiri, serif',
  'amiri-quran': 'Amiri Quran, serif',
  'scheherazade': 'Scheherazade New, serif',
  'scheherazade-old': 'Scheherazade, serif',
  
  // Modern Arabic Fonts
  'cairo': 'Cairo, sans-serif',
  'tajawal': 'Tajawal, sans-serif',
  'ibm-sans-arabic': 'IBM Plex Sans Arabic, sans-serif',
  'ibm-serif-arabic': 'IBM Plex Serif, serif',
  'changa': 'Changa, sans-serif',
  'el-messiri': 'El Messiri, serif',
  'harmattan': 'Harmattan, serif',
  'lalezar': 'Lalezar, serif',
  'mada': 'Mada, sans-serif',
  'mirza': 'Mirza, serif',
  'noto-kufi': 'Noto Kufi Arabic, sans-serif',
  'rakkas': 'Rakkas, serif',
  
  // Persian Fonts
  'vazirmatn': 'Vazirmatn, sans-serif',
  'estedad': 'Estedad, sans-serif',
  
  // Calligraphic Fonts
  'reem-kufi': 'Reem Kufi, sans-serif',
  'markazi': 'Markazi Text, serif',
  
  // Baloo Font Family
  'baloo-2': 'Baloo 2, sans-serif',
  'baloo-bhaijaan': 'Baloo Bhaijaan 2, sans-serif',
  'baloo-tamma': 'Baloo Tamma 2, sans-serif',
  'baloo-thambi': 'Baloo Thambi 2, sans-serif',
  
  // Modern UI Fonts
  'rubik': 'Rubik, sans-serif',
  'oswald': 'Oswald, sans-serif',
  'quicksand': 'Quicksand, sans-serif',
  'source-sans': 'Source Sans 3, sans-serif',
  'source-serif': 'Source Serif 4, serif',
  'work-sans': 'Work Sans, sans-serif',
  
  // Sameer Font Family
  'sameer-tasmeem': 'Sameer Tasmeem Bold, serif',
  'sameer-rafiya': 'Sameer Rafiya Unicode, serif',
  'sameer-qamri': 'Sameer Qamri, serif',
} as const;

// Default Values
export const DEFAULTS = {
  LANGUAGE: 'ur' as const,
  THEME: 'light' as const,
  LAYOUT: 'phonetic' as const,
  FONT: 'nastaliq' as const,
  FONT_SIZE: '18' as const,
  ZOOM: 1 as const,
  PAGE_SIZE: 'A4' as const,
  ORIENTATION: 'portrait' as const,
  UNIT: 'mm' as const,
  MARGINS: {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
  } as const,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'urdocs-theme',
  LANGUAGE: 'urdocs-language',
  LAYOUT: 'urdocs-layout',
  FONT: 'urdocs-font',
  FONT_SIZE: 'urdocs-font-size',
  PAGE_LAYOUT: 'urdocs-page-layout',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  EXPORT_FAILED: 'Failed to export document. Please try again.',
  PRINT_FAILED: 'Failed to print document. Please try again.',
  SAVE_FAILED: 'Failed to save document. Please try again.',
  LOAD_FAILED: 'Failed to load document. Please try again.',
  INVALID_INPUT: 'Invalid input provided.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  EXPORT_SUCCESS: 'Document exported successfully.',
  SAVE_SUCCESS: 'Document saved successfully.',
  LOAD_SUCCESS: 'Document loaded successfully.',
} as const;

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
} as const;

// Debounce Delays
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  SAVE: 1000,
  RESIZE: 200,
  CONTENT_UPDATE: 200,
} as const;
