/**
 * Urdu Text Processor with RTL Support and Complex Script Handling
 * 
 * This service provides specialized text processing capabilities for Urdu and other
 * RTL languages, including text normalization, bidirectional text handling,
 * and integration with HarfBuzz for proper text shaping.
 */

import { harfbuzzService, ShapedText, TextShapingOptions } from './harfbuzzService';
import { fontNameMapping } from './fontNameMapping';

export interface ProcessedTextBlock {
  text: string;
  originalText: string;
  direction: 'ltr' | 'rtl';
  script: string;
  language: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  color: string;
  lineHeight: number;
  shapedText?: ShapedText;
  isUrdu: boolean;
  isArabic: boolean;
  isPersian: boolean;
  hasMixedScript: boolean;
}

export interface TextProcessingOptions {
  normalizeText: boolean;
  handleBidirectional: boolean;
  preserveFormatting: boolean;
  detectScript: boolean;
  shapeText: boolean;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
}

export interface ScriptDetection {
  script: string;
  confidence: number;
  language: string;
  isRTL: boolean;
}

class UrduTextProcessor {
  private readonly urduRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  private readonly arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  private readonly persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  private readonly rtlScripts = ['arab', 'hebr', 'syrc', 'thaa', 'nkoo', 'samr', 'mand', 'arab'];
  private readonly ltrScripts = ['latn', 'grek', 'cyrl', 'armn', 'geor', 'deva', 'beng', 'gujr'];

  /**
   * Process HTML content and extract text blocks with proper RTL handling
   */
  async processHtmlContent(
    htmlContent: string,
    options: TextProcessingOptions
  ): Promise<ProcessedTextBlock[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span, li, td, th');
    
    const processedBlocks: ProcessedTextBlock[] = [];

    for (const element of elements) {
      const text = element.textContent?.trim();
      if (!text) continue;

      const block = await this.processTextBlock(text, element, options);
      if (block) {
        processedBlocks.push(block);
      }
    }

    return processedBlocks;
  }

  /**
   * Process a single text block
   */
  private async processTextBlock(
    text: string,
    element: Element,
    options: TextProcessingOptions
  ): Promise<ProcessedTextBlock | null> {
    if (!text) return null;

    // Get computed styles
    const computedStyle = window.getComputedStyle(element);
    
    // Normalize text if requested
    const normalizedText = options.normalizeText ? this.normalizeText(text) : text;
    
    // Detect script and language
    const scriptDetection = options.detectScript ? this.detectScript(normalizedText) : {
      script: 'arab',
      confidence: 1,
      language: 'urd',
      isRTL: true
    };

    // Determine direction
    const direction = this.determineDirection(normalizedText, computedStyle, scriptDetection);
    
    // Create processed block
    const block: ProcessedTextBlock = {
      text: normalizedText,
      originalText: text,
      direction,
      script: scriptDetection.script,
      language: scriptDetection.language,
      fontFamily: computedStyle.fontFamily || options.fontFamily,
      fontSize: parseFloat(computedStyle.fontSize) || options.fontSize,
      fontWeight: computedStyle.fontWeight || 'normal',
      fontStyle: computedStyle.fontStyle || 'normal',
      textAlign: computedStyle.textAlign || 'right',
      color: computedStyle.color || '#000000',
      lineHeight: parseFloat(computedStyle.lineHeight) || options.lineHeight,
      isUrdu: this.isUrduText(normalizedText),
      isArabic: this.isArabicText(normalizedText),
      isPersian: this.isPersianText(normalizedText),
      hasMixedScript: this.hasMixedScript(normalizedText)
    };

    // Shape text if requested
    if (options.shapeText && (block.isUrdu || block.isArabic || block.isPersian)) {
      try {
        const fontName = this.getFontNameForScript(block.script, block.fontWeight);
        const shapingOptions: TextShapingOptions = {
          direction: block.direction,
          script: block.script,
          language: block.language,
          fontSize: block.fontSize,
          lineHeight: block.lineHeight
        };

        block.shapedText = harfbuzzService.shapeText(block.text, fontName, shapingOptions);
      } catch (error) {
        console.warn('Text shaping failed for block:', error);
      }
    }

    return block;
  }

  /**
   * Normalize text for better processing
   */
  private normalizeText(text: string): string {
    // Remove zero-width characters
    let normalized = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // Normalize Arabic/Urdu characters
    normalized = normalized
      // Normalize Arabic ligatures
      .replace(/\uFEFB/g, '\u0644\u0627') // لا
      .replace(/\uFEF7/g, '\u0644\u0622') // لآ
      .replace(/\uFEF9/g, '\u0644\u0623') // لأ
      .replace(/\uFEF5/g, '\u0644\u0625') // لإ
      // Normalize other common ligatures
      .replace(/\uFEDF/g, '\u0644\u0644') // لل
      .replace(/\uFEE0/g, '\u0644\u0644') // لل
      // Normalize Arabic presentation forms
      .replace(/[\uFE80-\uFEFC]/g, (char) => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code - 0xFE80 + 0x0621);
      });

    // Trim whitespace
    normalized = normalized.trim();
    
    return normalized;
  }

  /**
   * Detect script and language of text
   */
  private detectScript(text: string): ScriptDetection {
    const urduCount = (text.match(this.urduRegex) || []).length;
    const arabicCount = (text.match(this.arabicRegex) || []).length;
    const persianCount = (text.match(this.persianRegex) || []).length;
    const totalChars = text.length;

    if (totalChars === 0) {
      return { script: 'latn', confidence: 0, language: 'en', isRTL: false };
    }

    const urduRatio = urduCount / totalChars;
    const arabicRatio = arabicCount / totalChars;
    const persianRatio = persianCount / totalChars;

    // Determine primary script
    if (urduRatio > 0.5) {
      return { script: 'arab', confidence: urduRatio, language: 'urd', isRTL: true };
    } else if (arabicRatio > 0.5) {
      return { script: 'arab', confidence: arabicRatio, language: 'ara', isRTL: true };
    } else if (persianRatio > 0.5) {
      return { script: 'arab', confidence: persianRatio, language: 'fas', isRTL: true };
    } else if (urduRatio > 0.1 || arabicRatio > 0.1 || persianRatio > 0.1) {
      return { script: 'arab', confidence: Math.max(urduRatio, arabicRatio, persianRatio), language: 'urd', isRTL: true };
    } else {
      return { script: 'latn', confidence: 1 - Math.max(urduRatio, arabicRatio, persianRatio), language: 'en', isRTL: false };
    }
  }

  /**
   * Determine text direction based on content and styles
   */
  private determineDirection(
    text: string,
    computedStyle: CSSStyleDeclaration,
    scriptDetection: ScriptDetection
  ): 'ltr' | 'rtl' {
    // Check CSS direction first
    if (computedStyle.direction === 'rtl') return 'rtl';
    if (computedStyle.direction === 'ltr') return 'ltr';

    // Check text-align
    if (computedStyle.textAlign === 'right') return 'rtl';
    if (computedStyle.textAlign === 'left') return 'ltr';

    // Use script detection
    return scriptDetection.isRTL ? 'rtl' : 'ltr';
  }

  /**
   * Check if text contains Urdu characters
   */
  private isUrduText(text: string): boolean {
    return this.urduRegex.test(text);
  }

  /**
   * Check if text contains Arabic characters
   */
  private isArabicText(text: string): boolean {
    return this.arabicRegex.test(text);
  }

  /**
   * Check if text contains Persian characters
   */
  private isPersianText(text: string): boolean {
    return this.persianRegex.test(text);
  }

  /**
   * Check if text has mixed scripts
   */
  private hasMixedScript(text: string): boolean {
    const hasRTL = this.rtlScripts.some(script => {
      // Simplified check - in real implementation, you'd use proper Unicode ranges
      return this.urduRegex.test(text) || this.arabicRegex.test(text);
    });
    
    const hasLTR = this.ltrScripts.some(script => {
      // Check for Latin characters
      return /[a-zA-Z]/.test(text);
    });

    return hasRTL && hasLTR;
  }

  /**
   * Get appropriate font name for script
   */
  private getFontNameForScript(script: string, fontWeight: string): string {
    const isBold = parseInt(fontWeight) >= 600 || fontWeight === 'bold';
    
    switch (script) {
      case 'arab':
        return fontNameMapping.getFontNameForWeight('NotoNastaliqUrdu', fontWeight);
      case 'latn':
        // Use Urdu fonts for Latin text as well to avoid font loading issues
        return fontNameMapping.getFontNameForWeight('NotoNastaliqUrdu', fontWeight);
      default:
        return fontNameMapping.getFontNameForWeight('NotoNastaliqUrdu', fontWeight);
    }
  }

  /**
   * Handle bidirectional text reordering
   */
  private handleBidirectionalText(text: string): string {
    // This is a simplified implementation
    // In a real application, you'd use a proper bidirectional algorithm
    const words = text.split(/\s+/);
    const rtlWords: string[] = [];
    const ltrWords: string[] = [];
    
    words.forEach(word => {
      if (this.isUrduText(word) || this.isArabicText(word)) {
        rtlWords.push(word);
      } else {
        ltrWords.push(word);
      }
    });
    
    // Simple reordering - RTL words first, then LTR words
    return [...rtlWords, ...ltrWords].join(' ');
  }

  /**
   * Calculate text metrics for layout
   */
  calculateTextMetrics(block: ProcessedTextBlock): {
    width: number;
    height: number;
    lineHeight: number;
    baseline: number;
  } {
    if (block.shapedText) {
      return harfbuzzService.calculateTextMetrics(block.shapedText, block.fontSize);
    } else {
      // Fallback calculation
      const charWidth = block.fontSize * 0.6; // Approximate character width
      const width = block.text.length * charWidth;
      const height = block.fontSize;
      const lineHeight = block.lineHeight;
      const baseline = block.fontSize * 0.8; // Approximate baseline
      
      return { width, height, lineHeight, baseline };
    }
  }

  /**
   * Split text into lines based on available width
   */
  splitTextIntoLines(
    block: ProcessedTextBlock,
    maxWidth: number
  ): string[] {
    const metrics = this.calculateTextMetrics(block);
    
    if (metrics.width <= maxWidth) {
      return [block.text];
    }
    
    // Simple word-based line breaking
    const words = block.text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testMetrics = this.calculateTextMetrics({
        ...block,
        text: testLine
      });
      
      if (testMetrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, force break
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Get default processing options
   */
  getDefaultOptions(): TextProcessingOptions {
    return {
      normalizeText: true,
      handleBidirectional: true,
      preserveFormatting: true,
      detectScript: true,
      shapeText: true,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'Noto Nastaliq Urdu, serif'
    };
  }
}

// Export singleton instance
export const urduTextProcessor = new UrduTextProcessor();
export default urduTextProcessor;
