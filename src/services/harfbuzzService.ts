/**
 * HarfBuzz WASM Service for Advanced Text Shaping
 * 
 * This service provides comprehensive text shaping capabilities using HarfBuzz WASM
 * for complex scripts like Urdu, Arabic, and other RTL languages. It handles
 * font loading, text shaping, glyph positioning, and integration with PDF generation.
 * 
 * Note: This implementation uses a browser-compatible approach with fallback support.
 * Updated: Fixed fontInfo undefined error - cache refresh
 */

import { browserHarfBuzz, HarfBuzzInstance } from './browserHarfBuzz';
import { simpleFontService } from './simpleFontService';
import { fontNameMapping } from './fontNameMapping';
import { harfBuzzErrorHandler, HarfBuzzErrorType } from './harfBuzzErrorHandler';

// Types for HarfBuzz integration
export interface ShapedGlyph {
  codepoint: number;
  cluster: number;
  x_advance: number;
  y_advance: number;
  x_offset: number;
  y_offset: number;
  flags: number;
}

export interface ShapedText {
  glyphs: ShapedGlyph[];
  text: string;
  direction: 'ltr' | 'rtl' | 'ttb' | 'btt';
  script: string;
  language: string;
  font: string;
}

export interface FontInfo {
  name: string;
  data: ArrayBuffer;
  face: any;
  font: any;
  loaded: boolean;
}

export interface TextShapingOptions {
  direction?: 'ltr' | 'rtl' | 'ttb' | 'btt';
  script?: string;
  language?: string;
  features?: Record<string, number>;
  fontSize?: number;
  lineHeight?: number;
}

export interface PDFExportOptions {
  pageSize: 'A4' | 'Letter' | 'Custom';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
}

class HarfBuzzService {
  private hb: HarfBuzzInstance | null = null;
  private fonts: Map<string, FontInfo> = new Map();
  private textShapingCache: Map<string, ShapedText> = new Map();
  private initialized = false;
  private useFallback = false;
  private maxCacheSize = 1000; // Limit cache size to prevent memory issues

  /**
   * Initialize HarfBuzz WASM module with fallback support
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize simple font service first
      await simpleFontService.initialize();
      
      // Try to load HarfBuzz from browser-compatible implementation
      this.hb = await browserHarfBuzz.loadFromCDN();
      this.initialized = true;
      this.useFallback = false;
      console.log('HarfBuzz initialized successfully');
    } catch (error) {
      const hbError = harfBuzzErrorHandler.handleInitializationError(
        error as Error,
        { service: 'harfbuzzService', method: 'initialize' }
      );
      
      console.warn('HarfBuzz not available, using fallback:', hbError.message);
      this.useFallback = true;
      this.initialized = true;
      console.log('HarfBuzz fallback mode initialized');
    }
  }

  /**
   * Load a font from URL or ArrayBuffer
   */
  async loadFont(fontName: string, fontSource: string | ArrayBuffer): Promise<FontInfo> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let fontData: ArrayBuffer;
      
      if (typeof fontSource === 'string') {
        // Load from URL
        const response = await fetch(fontSource);
        if (!response.ok) {
          throw new Error(`Failed to load font from ${fontSource}: ${response.statusText}`);
        }
        fontData = await response.arrayBuffer();
      } else {
        fontData = fontSource;
      }

      let face: any = null;
      let font: any = null;

      if (!this.useFallback && this.hb) {
        // Use HarfBuzz if available
        const blob = this.hb.createBlob(fontData);
        face = this.hb.createFace(blob, 0);
        font = this.hb.createFont(face);
      }

      const fontInfo: FontInfo = {
        name: fontName,
        data: fontData,
        face,
        font,
        loaded: true
      };

      this.fonts.set(fontName, fontInfo);
      console.log(`Font loaded successfully: ${fontName} (${this.useFallback ? 'fallback mode' : 'HarfBuzz mode'})`);
      
      return fontInfo;
    } catch (error) {
      const hbError = harfBuzzErrorHandler.handleFontLoadingError(
        fontName,
        error as Error,
        { service: 'harfbuzzService', method: 'loadFont' }
      );
      
      console.error(`Failed to load font ${fontName}:`, hbError.message);
      throw hbError;
    }
  }

  /**
   * Load default Urdu fonts
   */
  async loadDefaultUrduFonts(): Promise<void> {
    // Use the simple font service which provides virtual fonts
    console.log('Using simple font service for Urdu fonts');
    
    // Get standardized font names from mapping service
    const fontMappings = fontNameMapping.getAllMappings();
    const fontNames = fontMappings.map(mapping => mapping.internalName);
    
    for (const fontName of fontNames) {
      const simpleFont = simpleFontService.getFont(fontName);
      if (simpleFont && simpleFont.loaded) {
        // Create a fallback font entry for HarfBuzz
        this.createFallbackFont(fontName);
      }
    }
    
    const fontStatus = simpleFontService.getLoadingStatus();
    console.log(`Font service status: ${fontStatus.loaded}/${fontStatus.total} fonts loaded`);
  }

  /**
   * Create a fallback font entry when loading fails
   */
  private createFallbackFont(fontName: string): void {
    const fontInfo: FontInfo = {
      name: fontName,
      data: new ArrayBuffer(0), // Empty data for fallback
      face: null,
      font: null,
      loaded: true // Mark as loaded so it can be used
    };

    this.fonts.set(fontName, fontInfo);
    console.log(`Created fallback font: ${fontName}`);
  }

  /**
   * Generate cache key for text shaping
   */
  private generateCacheKey(text: string, fontName: string, options: TextShapingOptions): string {
    const key = `${text}|${fontName}|${options.direction || 'rtl'}|${options.script || 'arab'}|${options.language || 'urd'}|${options.fontSize || 16}|${JSON.stringify(options.features || {})}`;
    return key;
  }

  /**
   * Clear cache if it exceeds max size
   */
  private clearCacheIfNeeded(): void {
    if (this.textShapingCache.size > this.maxCacheSize) {
      // Remove oldest entries (simple LRU-like behavior)
      const entries = Array.from(this.textShapingCache.entries());
      const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.2)); // Remove 20% of cache
      toRemove.forEach(([key]) => this.textShapingCache.delete(key));
    }
  }

  /**
   * Clear the text shaping cache
   */
  clearCache(): void {
    this.textShapingCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.textShapingCache.size,
      maxSize: this.maxCacheSize
    };
  }

  /**
   * Shape text using HarfBuzz or fallback with caching
   */
  shapeText(
    text: string,
    fontName: string,
    options: TextShapingOptions = {}
  ): ShapedText {
    if (!this.initialized) {
      throw new Error('HarfBuzz not initialized');
    }

    // Standardize font name using mapping service
    const standardizedFontName = fontNameMapping.getFontNameForWeight(fontName, options.fontSize || 16);

    // Check cache first
    const cacheKey = this.generateCacheKey(text, standardizedFontName, options);
    const cachedResult = this.textShapingCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

      // Check if font exists in simple font service
      const simpleFont = simpleFontService.getFont(standardizedFontName);
      if (!simpleFont || !simpleFont.loaded) {
        // Try to get a fallback font
        const fallbackFont = simpleFontService.getBestFontForText(text);
        if (fallbackFont) {
          console.log(`Using fallback font: ${fallbackFont.name} for text: ${text.substring(0, 20)}...`);
          const fallbackResult = this.fallbackTextShaping(text, fallbackFont.name, options);
          // Cache the fallback result
          this.clearCacheIfNeeded();
          this.textShapingCache.set(cacheKey, fallbackResult);
          return fallbackResult;
        }
        
        const hbError = harfBuzzErrorHandler.handleFontNotAvailableError(
          standardizedFontName,
          { service: 'harfbuzzService', method: 'shapeText', textLength: text.length }
        );
        throw hbError;
      }

    if (this.useFallback || !this.hb) {
      // Use fallback text shaping
      const fallbackResult = this.fallbackTextShaping(text, standardizedFontName, options);
      // Cache the fallback result
      this.clearCacheIfNeeded();
      this.textShapingCache.set(cacheKey, fallbackResult);
      return fallbackResult;
    }

    try {
      if (!this.hb) {
        throw new Error('HarfBuzz instance not available');
      }

      // Get font information
      const fontInfo = this.fonts.get(standardizedFontName);
      if (!fontInfo || !fontInfo.font) {
        // If font is not in HarfBuzz registry but available in simple font service, use fallback
        const simpleFont = simpleFontService.getFont(standardizedFontName);
        if (simpleFont && simpleFont.loaded) {
          console.log(`Font ${standardizedFontName} not in HarfBuzz registry, using fallback shaping`);
          return this.fallbackTextShaping(text, standardizedFontName, options);
        }
        throw new Error(`Font ${standardizedFontName} not loaded or not available`);
      }

      const buffer = this.hb.createBuffer();
      
      // Add text to buffer
      this.hb.bufferAddUtf8(buffer, text, 0, -1);
      
      // Set text direction
      const direction = options.direction || 'rtl';
      this.hb.bufferSetDirection(buffer, this.hb.Direction[direction.toUpperCase()]);
      
      // Set script
      const script = options.script || 'arab';
      this.hb.bufferSetScript(buffer, this.hb.Script[script.toUpperCase()]);
      
      // Set language
      const language = options.language || 'urd';
      this.hb.bufferSetLanguage(buffer, this.hb.Language.fromString(language));
      
      // Apply OpenType features if specified
      const features = options.features || {};
      const featureArray = Object.entries(features).map(([tag, value]) => ({
        tag: this.hb.Tag.fromString(tag),
        value: value,
        start: 0,
        end: -1
      }));
      
      // Shape the text
      this.hb.shape(fontInfo.font, buffer, featureArray);
      
      // Get shaped glyphs
      const glyphs: ShapedGlyph[] = [];
      const glyphCount = this.hb.bufferGetLength(buffer);
      
      for (let i = 0; i < glyphCount; i++) {
        const glyphInfo = this.hb.bufferGetGlyphInfo(buffer, i);
        const glyphPos = this.hb.bufferGetGlyphPositions(buffer, i);
        
        glyphs.push({
          codepoint: glyphInfo.codepoint,
          cluster: glyphInfo.cluster,
          x_advance: glyphPos.x_advance,
          y_advance: glyphPos.y_advance,
          x_offset: glyphPos.x_offset,
          y_offset: glyphPos.y_offset,
          flags: glyphInfo.flags
        });
      }
      
      // Clean up
      this.hb.destroyBuffer(buffer);
      
      const result = {
        glyphs,
        text,
        direction,
        script,
        language,
        font: standardizedFontName
      };
      
      // Cache the result
      this.clearCacheIfNeeded();
      this.textShapingCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      const hbError = harfBuzzErrorHandler.handleTextShapingError(
        text,
        standardizedFontName,
        error as Error,
        { service: 'harfbuzzService', method: 'shapeText', options }
      );
      
      console.error('Text shaping failed, using fallback:', hbError.message);
      const fallbackResult = this.fallbackTextShaping(text, standardizedFontName, options);
      // Cache the fallback result
      this.clearCacheIfNeeded();
      this.textShapingCache.set(cacheKey, fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * Fallback text shaping for when HarfBuzz is not available
   */
  private fallbackTextShaping(
    text: string,
    fontName: string,
    options: TextShapingOptions = {}
  ): ShapedText {
    const direction = options.direction || 'rtl';
    const script = options.script || 'arab';
    const language = options.language || 'urd';
    
    // Create simple glyphs for each character
    const glyphs: ShapedGlyph[] = [];
    const fontSize = options.fontSize || 16;
    const charWidth = fontSize * 0.6; // Approximate character width
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const codepoint = char.charCodeAt(0);
      
      glyphs.push({
        codepoint,
        cluster: i,
        x_advance: charWidth,
        y_advance: 0,
        x_offset: 0,
        y_offset: 0,
        flags: 0
      });
    }
    
    return {
      glyphs,
      text,
      direction,
      script,
      language,
      font: fontName
    };
  }

  /**
   * Process HTML content and extract text with styling information
   */
  processHtmlContent(htmlContent: string): Array<{
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
    textAlign: string;
    color: string;
    direction: string;
  }> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span');
    
    const processedElements: Array<{
      text: string;
      fontFamily: string;
      fontSize: number;
      fontWeight: string;
      fontStyle: string;
      textAlign: string;
      color: string;
      direction: string;
    }> = [];

    elements.forEach(element => {
      const text = element.textContent?.trim();
      if (!text) return;

      const computedStyle = window.getComputedStyle(element);
      
      processedElements.push({
        text,
        fontFamily: computedStyle.fontFamily,
        fontSize: parseFloat(computedStyle.fontSize),
        fontWeight: computedStyle.fontWeight,
        fontStyle: computedStyle.fontStyle,
        textAlign: computedStyle.textAlign,
        color: computedStyle.color,
        direction: computedStyle.direction
      });
    });

    return processedElements;
  }

  /**
   * Calculate text metrics for layout
   */
  calculateTextMetrics(
    shapedText: ShapedText,
    fontSize: number = 12
  ): {
    width: number;
    height: number;
    baseline: number;
    lineHeight: number;
  } {
    const scale = fontSize / 1000; // HarfBuzz uses 1000 units per em
    
    let width = 0;
    let maxAscent = 0;
    let maxDescent = 0;
    
    shapedText.glyphs.forEach(glyph => {
      width += glyph.x_advance * scale;
      
      // Get glyph metrics (simplified)
      const ascent = 800 * scale; // Approximate ascent
      const descent = 200 * scale; // Approximate descent
      
      maxAscent = Math.max(maxAscent, ascent);
      maxDescent = Math.max(maxDescent, descent);
    });
    
    const height = maxAscent + maxDescent;
    const baseline = maxAscent;
    const lineHeight = height * 1.2; // 20% line spacing
    
    return {
      width,
      height,
      baseline,
      lineHeight
    };
  }

  /**
   * Get available fonts
   */
  getAvailableFonts(): string[] {
    return Array.from(this.fonts.keys());
  }

  /**
   * Check if font is loaded
   */
  isFontLoaded(fontName: string): boolean {
    const font = this.fonts.get(fontName);
    return font ? font.loaded : false;
  }

  /**
   * Check if HarfBuzz is available (not in fallback mode)
   */
  isHarfBuzzAvailable(): boolean {
    return this.initialized && !this.useFallback && this.hb !== null;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.fonts.forEach(fontInfo => {
      if (fontInfo.font && this.hb) {
        this.hb.destroyFont(fontInfo.font);
      }
      if (fontInfo.face && this.hb) {
        this.hb.destroyFace(fontInfo.face);
      }
    });
    this.fonts.clear();
    this.initialized = false;
    this.hb = null;
  }
}

// Export singleton instance
export const harfbuzzService = new HarfBuzzService();
export default harfbuzzService;
