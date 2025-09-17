/**
 * Simple Font Service for PDF Export
 * 
 * This service provides a simplified approach to font handling
 * that works reliably in browser environments without external dependencies.
 */

export interface SimpleFontInfo {
  name: string;
  family: string;
  weight: string;
  style: string;
  loaded: boolean;
  isUrdu: boolean;
  isArabic: boolean;
}

class SimpleFontService {
  private fonts: Map<string, SimpleFontInfo> = new Map();
  private initialized = false;

  /**
   * Initialize the font service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create virtual font entries for common fonts
    this.createVirtualFonts();
    this.initialized = true;
    console.log('Simple font service initialized');
  }

  /**
   * Create virtual font entries
   */
  private createVirtualFonts(): void {
    const virtualFonts: SimpleFontInfo[] = [
      {
        name: 'NotoNastaliqUrdu',
        family: 'Noto Nastaliq Urdu',
        weight: '400',
        style: 'normal',
        loaded: true,
        isUrdu: true,
        isArabic: true
      },
      {
        name: 'NotoNastaliqUrduBold',
        family: 'Noto Nastaliq Urdu',
        weight: '700',
        style: 'normal',
        loaded: true,
        isUrdu: true,
        isArabic: true
      },
      {
        name: 'Gulzar',
        family: 'Gulzar',
        weight: '400',
        style: 'normal',
        loaded: true,
        isUrdu: true,
        isArabic: true
      },
      {
        name: 'Amiri',
        family: 'Amiri',
        weight: '400',
        style: 'normal',
        loaded: true,
        isUrdu: false,
        isArabic: true
      }
    ];

    virtualFonts.forEach(font => {
      this.fonts.set(font.name, font);
    });
  }

  /**
   * Get font by name
   */
  getFont(name: string): SimpleFontInfo | undefined {
    return this.fonts.get(name);
  }

  /**
   * Get all loaded fonts
   */
  getLoadedFonts(): SimpleFontInfo[] {
    return Array.from(this.fonts.values()).filter(font => font.loaded);
  }

  /**
   * Get best font for text
   */
  getBestFontForText(
    text: string,
    preferredFamily?: string,
    weight?: string
  ): SimpleFontInfo | null {
    const fonts = this.getLoadedFonts();
    
    // Filter by preferred family if specified
    let candidateFonts = fonts;
    if (preferredFamily) {
      candidateFonts = fonts.filter(font => 
        font.family.toLowerCase().includes(preferredFamily.toLowerCase())
      );
    }

    // Filter by weight if specified
    if (weight) {
      candidateFonts = candidateFonts.filter(font => font.weight === weight);
    }

    // Check which fonts support the text's script
    const textScript = this.detectTextScript(text);
    const supportedFonts = candidateFonts.filter(font => {
      if (textScript === 'arab') {
        return font.isArabic || font.isUrdu;
      }
      return true; // All fonts support Latin
    });

    // Return the first supported font, or fallback to any font
    return supportedFonts[0] || candidateFonts[0] || fonts[0] || null;
  }

  /**
   * Detect script of text
   */
  private detectTextScript(text: string): string {
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) {
      return 'arab';
    }
    if (/[\u0590-\u05FF]/.test(text)) {
      return 'hebr';
    }
    return 'latn';
  }

  /**
   * Check if font is loaded
   */
  isFontLoaded(name: string): boolean {
    const font = this.fonts.get(name);
    return font ? font.loaded : false;
  }

  /**
   * Get font loading status
   */
  getLoadingStatus(): { loaded: number; total: number } {
    const allFonts = Array.from(this.fonts.values());
    const loadedFonts = allFonts.filter(font => font.loaded);

    return {
      loaded: loadedFonts.length,
      total: allFonts.length
    };
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const simpleFontService = new SimpleFontService();
export default simpleFontService;
