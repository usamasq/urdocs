/**
 * Font Manager for Urdu and RTL Fonts
 * 
 * This service manages font loading, caching, and provides font information
 * for HarfBuzz text shaping and PDF generation.
 */

import { harfbuzzService } from './harfbuzzService';

export interface FontResource {
  name: string;
  displayName: string;
  family: string;
  weight: string;
  style: string;
  url: string;
  localPath?: string;
  loaded: boolean;
  data?: ArrayBuffer;
  harfbuzzFace?: any;
  harfbuzzFont?: any;
  supportedScripts: string[];
  isRTL: boolean;
  isUrdu: boolean;
  isArabic: boolean;
  isPersian: boolean;
}

export interface FontLoadingOptions {
  preload: boolean;
  cache: boolean;
  fallback: boolean;
  timeout: number;
}

export interface FontMetrics {
  ascent: number;
  descent: number;
  lineGap: number;
  unitsPerEm: number;
  xHeight: number;
  capHeight: number;
  underlinePosition: number;
  underlineThickness: number;
}

class FontManager {
  private fonts: Map<string, FontResource> = new Map();
  private loadingPromises: Map<string, Promise<FontResource>> = new Map();
  private defaultOptions: FontLoadingOptions = {
    preload: true,
    cache: true,
    timeout: 10000
  };

  /**
   * Initialize font manager with default Urdu fonts
   */
  async initialize(): Promise<void> {
    const defaultFonts: FontResource[] = [
      {
        name: 'NotoNastaliqUrdu',
        displayName: 'Noto Nastaliq Urdu',
        family: 'Noto Nastaliq Urdu',
        weight: '400',
        style: 'normal',
        url: 'https://fonts.gstatic.com/s/notonastaliqurdu/v1/7cHrv4Yiiz-EOSit_MYpMPIlMFajIq2F.ttf',
        supportedScripts: ['arab'],
        isRTL: true,
        isUrdu: true,
        isArabic: true,
        isPersian: true
      },
      {
        name: 'NotoNastaliqUrduBold',
        displayName: 'Noto Nastaliq Urdu Bold',
        family: 'Noto Nastaliq Urdu',
        weight: '700',
        style: 'normal',
        url: 'https://fonts.gstatic.com/s/notonastaliqurdu/v1/7cHrv4Yiiz-EOSit_MYpMPIlMFajIq2F.ttf',
        supportedScripts: ['arab'],
        isRTL: true,
        isUrdu: true,
        isArabic: true,
        isPersian: true
      },
      {
        name: 'Gulzar',
        displayName: 'Gulzar',
        family: 'Gulzar',
        weight: '400',
        style: 'normal',
        url: 'https://fonts.gstatic.com/s/gulzar/v1/3Jn5SD_ynL1r7O6YHhAha2t6.ttf',
        supportedScripts: ['arab'],
        isRTL: true,
        isUrdu: true,
        isArabic: true,
        isPersian: true
      },
      {
        name: 'NotoNaskhArabic',
        displayName: 'Noto Naskh Arabic',
        family: 'Noto Naskh Arabic',
        weight: '400',
        style: 'normal',
        url: 'https://fonts.gstatic.com/s/notonaskharabic/v1/CSR94zUbZ5fZ2f4YPN5Ex7nR.ttf',
        supportedScripts: ['arab'],
        isRTL: true,
        isUrdu: false,
        isArabic: true,
        isPersian: true
      },
      {
        name: 'Amiri',
        displayName: 'Amiri',
        family: 'Amiri',
        weight: '400',
        style: 'normal',
        url: 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf',
        supportedScripts: ['arab'],
        isRTL: true,
        isUrdu: false,
        isArabic: true,
        isPersian: true
      }
    ];

    // Load default fonts
    const loadPromises = defaultFonts.map(font => 
      this.loadFont(font, this.defaultOptions).catch(error => {
        console.warn(`Failed to load default font ${font.name}:`, error);
        return null;
      })
    );

    await Promise.all(loadPromises);
    console.log('Font manager initialized with default fonts');
  }

  /**
   * Load a font from URL or local path
   */
  async loadFont(
    font: FontResource,
    options: FontLoadingOptions = this.defaultOptions
  ): Promise<FontResource> {
    // Check if already loaded
    if (this.fonts.has(font.name) && this.fonts.get(font.name)!.loaded) {
      return this.fonts.get(font.name)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(font.name)) {
      return this.loadingPromises.get(font.name)!;
    }

    // Start loading
    const loadingPromise = this.loadFontInternal(font, options);
    this.loadingPromises.set(font.name, loadingPromise);

    try {
      const loadedFont = await loadingPromise;
      this.fonts.set(font.name, loadedFont);
      return loadedFont;
    } finally {
      this.loadingPromises.delete(font.name);
    }
  }

  /**
   * Internal font loading implementation
   */
  private async loadFontInternal(
    font: FontResource,
    options: FontLoadingOptions
  ): Promise<FontResource> {
    try {
      let fontData: ArrayBuffer;

      if (font.localPath) {
        // Load from local path (for bundled fonts)
        const response = await fetch(font.localPath);
        if (!response.ok) {
          throw new Error(`Failed to load local font: ${response.statusText}`);
        }
        fontData = await response.arrayBuffer();
      } else {
        // Load from URL
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        try {
          const response = await fetch(font.url, {
            signal: controller.signal,
            cache: options.cache ? 'default' : 'no-cache'
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Failed to load font from ${font.url}: ${response.statusText}`);
          }
          fontData = await response.arrayBuffer();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }

      // Load font into HarfBuzz
      const harfbuzzFace = await harfbuzzService.loadFont(font.name, fontData);
      
      const loadedFont: FontResource = {
        ...font,
        data: fontData,
        harfbuzzFace: harfbuzzFace.face,
        harfbuzzFont: harfbuzzFace.font,
        loaded: true
      };

      console.log(`Font loaded successfully: ${font.name}`);
      return loadedFont;
    } catch (error) {
      console.error(`Failed to load font ${font.name}:`, error);
      throw error;
    }
  }

  /**
   * Get font by name
   */
  getFont(name: string): FontResource | undefined {
    return this.fonts.get(name);
  }

  /**
   * Get all loaded fonts
   */
  getLoadedFonts(): FontResource[] {
    return Array.from(this.fonts.values()).filter(font => font.loaded);
  }

  /**
   * Get fonts by script
   */
  getFontsByScript(script: string): FontResource[] {
    return this.getLoadedFonts().filter(font => 
      font.supportedScripts.includes(script)
    );
  }

  /**
   * Get Urdu fonts
   */
  getUrduFonts(): FontResource[] {
    return this.getLoadedFonts().filter(font => font.isUrdu);
  }

  /**
   * Get Arabic fonts
   */
  getArabicFonts(): FontResource[] {
    return this.getLoadedFonts().filter(font => font.isArabic);
  }

  /**
   * Get RTL fonts
   */
  getRTLFonts(): FontResource[] {
    return this.getLoadedFonts().filter(font => font.isRTL);
  }

  /**
   * Get best font for text
   */
  getBestFontForText(
    text: string,
    preferredFamily?: string,
    weight?: string,
    style?: string
  ): FontResource | null {
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

    // Filter by style if specified
    if (style) {
      candidateFonts = candidateFonts.filter(font => font.style === style);
    }

    // Check which fonts support the text's script
    const textScript = this.detectTextScript(text);
    const supportedFonts = candidateFonts.filter(font => 
      font.supportedScripts.includes(textScript)
    );

    // Return the first supported font, or fallback to any font
    return supportedFonts[0] || candidateFonts[0] || fonts[0] || null;
  }

  /**
   * Detect script of text
   */
  private detectTextScript(text: string): string {
    // Simple script detection
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) {
      return 'arab';
    }
    if (/[\u0590-\u05FF]/.test(text)) {
      return 'hebr';
    }
    return 'latn';
  }

  /**
   * Get font metrics
   */
  async getFontMetrics(fontName: string): Promise<FontMetrics | null> {
    const font = this.getFont(fontName);
    if (!font || !font.loaded) {
      return null;
    }

    try {
      // This would require more detailed font parsing
      // For now, return approximate metrics
      return {
        ascent: 800,
        descent: 200,
        lineGap: 0,
        unitsPerEm: 1000,
        xHeight: 500,
        capHeight: 700,
        underlinePosition: -100,
        underlineThickness: 50
      };
    } catch (error) {
      console.error(`Failed to get metrics for font ${fontName}:`, error);
      return null;
    }
  }

  /**
   * Preload fonts
   */
  async preloadFonts(fontNames: string[]): Promise<void> {
    const loadPromises = fontNames.map(name => {
      const font = this.getFont(name);
      if (font && !font.loaded) {
        return this.loadFont(font, this.defaultOptions).catch(error => {
          console.warn(`Failed to preload font ${name}:`, error);
          return null;
        });
      }
      return Promise.resolve(null);
    });

    await Promise.all(loadPromises);
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
  getLoadingStatus(): { loaded: number; total: number; loading: string[] } {
    const allFonts = Array.from(this.fonts.values());
    const loadedFonts = allFonts.filter(font => font.loaded);
    const loadingFonts = Array.from(this.loadingPromises.keys());

    return {
      loaded: loadedFonts.length,
      total: allFonts.length,
      loading: loadingFonts
    };
  }

  /**
   * Clear font cache
   */
  clearCache(): void {
    this.fonts.clear();
    this.loadingPromises.clear();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.fonts.forEach(font => {
      if (font.harfbuzzFont) {
        // Clean up HarfBuzz resources
        // This would be handled by harfbuzzService
      }
    });
    this.clearCache();
  }
}

// Export singleton instance
export const fontManager = new FontManager();
export default fontManager;
