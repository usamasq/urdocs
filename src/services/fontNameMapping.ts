/**
 * Font Name Mapping Service
 * 
 * This service provides consistent font name mapping across all HarfBuzz services
 * to prevent inconsistencies between different naming conventions.
 */

export interface FontMapping {
  internalName: string;      // Name used internally by HarfBuzz services
  displayName: string;       // Human-readable name
  cssFamily: string;         // CSS font-family value
  fallbackNames: string[];   // Alternative names that might be used
}

export class FontNameMappingService {
  private static instance: FontNameMappingService;
  private fontMappings: Map<string, FontMapping> = new Map();

  private constructor() {
    this.initializeFontMappings();
  }

  public static getInstance(): FontNameMappingService {
    if (!FontNameMappingService.instance) {
      FontNameMappingService.instance = new FontNameMappingService();
    }
    return FontNameMappingService.instance;
  }

  private initializeFontMappings(): void {
    const mappings: FontMapping[] = [
      {
        internalName: 'NotoNastaliqUrdu',
        displayName: 'Noto Nastaliq Urdu',
        cssFamily: 'Noto Nastaliq Urdu, serif',
        fallbackNames: ['nastaliq', 'Noto Nastaliq Urdu', 'noto-nastaliq-urdu']
      },
      {
        internalName: 'NotoNastaliqUrduBold',
        displayName: 'Noto Nastaliq Urdu Bold',
        cssFamily: 'Noto Nastaliq Urdu, serif',
        fallbackNames: ['nastaliq-bold', 'Noto Nastaliq Urdu Bold', 'noto-nastaliq-urdu-bold']
      },
      {
        internalName: 'Gulzar',
        displayName: 'Gulzar',
        cssFamily: 'Gulzar, serif',
        fallbackNames: ['gulzar', 'Gulzar Regular']
      },
      {
        internalName: 'Amiri',
        displayName: 'Amiri',
        cssFamily: 'Amiri, serif',
        fallbackNames: ['amiri', 'Amiri Regular']
      },
      {
        internalName: 'NotoSerifArabic',
        displayName: 'Noto Serif Arabic',
        cssFamily: 'Noto Serif Arabic, serif',
        fallbackNames: ['noto-serif-arabic', 'Noto Serif Arabic']
      },
      {
        internalName: 'Estedad',
        displayName: 'Estedad',
        cssFamily: 'Estedad, sans-serif',
        fallbackNames: ['estedad', 'Estedad Regular']
      }
    ];

    mappings.forEach(mapping => {
      // Map by internal name
      this.fontMappings.set(mapping.internalName, mapping);
      
      // Map by display name
      this.fontMappings.set(mapping.displayName, mapping);
      
      // Map by CSS family (first part only)
      const cssFamilyFirst = mapping.cssFamily.split(',')[0].trim();
      this.fontMappings.set(cssFamilyFirst, mapping);
      
      // Map fallback names
      mapping.fallbackNames.forEach(fallback => {
        this.fontMappings.set(fallback.toLowerCase(), mapping);
        this.fontMappings.set(fallback, mapping);
      });
    });
  }

  /**
   * Get standardized internal name for any font reference
   */
  public getInternalName(fontReference: string): string {
    if (!fontReference) return 'NotoNastaliqUrdu'; // Default fallback

    // Direct lookup
    const directMapping = this.fontMappings.get(fontReference);
    if (directMapping) return directMapping.internalName;

    // Case-insensitive lookup
    const lowerMapping = this.fontMappings.get(fontReference.toLowerCase());
    if (lowerMapping) return lowerMapping.internalName;

    // Partial match lookup
    for (const [key, mapping] of this.fontMappings) {
      if (key.toLowerCase().includes(fontReference.toLowerCase()) || 
          fontReference.toLowerCase().includes(key.toLowerCase())) {
        return mapping.internalName;
      }
    }

    // CSS family parsing
    if (fontReference.includes('Noto Nastaliq Urdu') || fontReference.includes('nastaliq')) {
      // Check if bold
      if (fontReference.includes('Bold') || fontReference.includes('bold') || fontReference.includes('700')) {
        return 'NotoNastaliqUrduBold';
      }
      return 'NotoNastaliqUrdu';
    }

    if (fontReference.includes('Gulzar')) {
      return 'Gulzar';
    }

    if (fontReference.includes('Amiri')) {
      return 'Amiri';
    }

    if (fontReference.includes('Estedad')) {
      return 'Estedad';
    }

    // Default fallback
    console.warn(`Unknown font reference: ${fontReference}, using default`);
    return 'NotoNastaliqUrdu';
  }

  /**
   * Get display name for internal font name
   */
  public getDisplayName(internalName: string): string {
    const mapping = this.fontMappings.get(internalName);
    return mapping ? mapping.displayName : internalName;
  }

  /**
   * Get CSS family for internal font name
   */
  public getCssFamily(internalName: string): string {
    const mapping = this.fontMappings.get(internalName);
    return mapping ? mapping.cssFamily : 'Noto Nastaliq Urdu, serif';
  }

  /**
   * Get all available font mappings
   */
  public getAllMappings(): FontMapping[] {
    const uniqueMappings = new Map<string, FontMapping>();
    this.fontMappings.forEach(mapping => {
      uniqueMappings.set(mapping.internalName, mapping);
    });
    return Array.from(uniqueMappings.values());
  }

  /**
   * Check if font name is valid
   */
  public isValidFontName(fontReference: string): boolean {
    return this.getInternalName(fontReference) !== 'NotoNastaliqUrdu' || 
           fontReference.includes('Noto') || 
           fontReference.includes('nastaliq');
  }

  /**
   * Get font name based on weight
   */
  public getFontNameForWeight(baseFontName: string, fontWeight: string | number): string {
    const internalName = this.getInternalName(baseFontName);
    
    // Handle bold fonts
    const isBold = fontWeight === 'bold' || 
                   fontWeight === '700' || 
                   (typeof fontWeight === 'number' && fontWeight >= 600) ||
                   fontWeight === '600';

    if (internalName === 'NotoNastaliqUrdu' && isBold) {
      return 'NotoNastaliqUrduBold';
    }

    return internalName;
  }
}

// Export singleton instance
export const fontNameMapping = FontNameMappingService.getInstance();
export default fontNameMapping;

