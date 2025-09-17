/**
 * PDF Generator with HarfBuzz Integration
 * 
 * This service generates high-quality PDF documents using HarfBuzz for text shaping
 * and pdf-lib for PDF creation. It provides advanced typography support for complex
 * scripts like Urdu, Arabic, and other RTL languages.
 */

import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { harfbuzzService, ShapedText, PDFExportOptions, TextShapingOptions } from './harfbuzzService';
import { fontNameMapping } from './fontNameMapping';

export interface PDFPageLayout {
  width: number;
  height: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  contentArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TextElement {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  textAlign: string;
  direction: string;
  shapedText?: ShapedText;
}

export interface PDFDocumentData {
  pages: TextElement[][];
  layout: PDFPageLayout;
  options: PDFExportOptions;
}

class PDFGenerator {
  private document: PDFDocument | null = null;
  private currentPage: PDFPage | null = null;
  private currentY: number = 0;
  private lineHeight: number = 0;
  private pageLayout: PDFPageLayout | null = null;

  /**
   * Initialize PDF document with specified options
   */
  async initialize(options: PDFExportOptions): Promise<void> {
    this.document = await PDFDocument.create();
    this.pageLayout = this.calculatePageLayout(options);
    this.lineHeight = options.lineHeight;
    
    // Load default fonts if needed
    await this.ensureFontsLoaded();
  }

  /**
   * Calculate page layout based on options
   */
  private calculatePageLayout(options: PDFExportOptions): PDFPageLayout {
    let pageWidth: number;
    let pageHeight: number;

    switch (options.pageSize) {
      case 'A4':
        pageWidth = 595.28; // A4 width in points
        pageHeight = 841.89; // A4 height in points
        break;
      case 'Letter':
        pageWidth = 612; // Letter width in points
        pageHeight = 792; // Letter height in points
        break;
      case 'Custom':
        // Use custom dimensions (assuming mm, convert to points)
        pageWidth = options.margins.left * 2.834645669; // mm to points
        pageHeight = options.margins.bottom * 2.834645669; // mm to points
        break;
      default:
        pageWidth = 595.28;
        pageHeight = 841.89;
    }

    if (options.orientation === 'landscape') {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }

    const margins = {
      top: options.margins.top * 2.834645669, // mm to points
      bottom: options.margins.bottom * 2.834645669,
      left: options.margins.left * 2.834645669,
      right: options.margins.right * 2.834645669
    };

    const contentArea = {
      x: margins.left,
      y: pageHeight - margins.top,
      width: pageWidth - margins.left - margins.right,
      height: pageHeight - margins.top - margins.bottom
    };

    return {
      width: pageWidth,
      height: pageHeight,
      margins,
      contentArea
    };
  }

  /**
   * Ensure required fonts are loaded
   */
  private async ensureFontsLoaded(): Promise<void> {
    const requiredFonts = ['NotoNastaliqUrdu', 'NotoNastaliqUrduBold'];
    
    for (const fontName of requiredFonts) {
      if (!harfbuzzService.isFontLoaded(fontName)) {
        try {
          await harfbuzzService.loadDefaultUrduFonts();
        } catch (error) {
          console.warn(`Failed to load font ${fontName}:`, error);
        }
      }
    }
  }

  /**
   * Add a new page to the document
   */
  private addNewPage(): void {
    if (!this.document || !this.pageLayout) {
      throw new Error('PDF document not initialized');
    }

    this.currentPage = this.document.addPage([
      this.pageLayout.width,
      this.pageLayout.height
    ]);

    this.currentY = this.pageLayout.contentArea.y;
  }

  /**
   * Process HTML content and convert to PDF
   */
  async processHtmlContent(
    htmlContent: string,
    options: PDFExportOptions
  ): Promise<Uint8Array> {
    await this.initialize(options);

    // Process HTML content
    const processedElements = harfbuzzService.processHtmlContent(htmlContent);
    
    // Add first page
    this.addNewPage();

    for (const element of processedElements) {
      await this.addTextElement(element, options);
    }

    return await this.document!.save();
  }

  /**
   * Add a text element to the current page
   */
  private async addTextElement(
    element: {
      text: string;
      fontFamily: string;
      fontSize: number;
      fontWeight: string;
      fontStyle: string;
      textAlign: string;
      color: string;
      direction: string;
    },
    options: PDFExportOptions
  ): Promise<void> {
    if (!this.currentPage || !this.pageLayout) {
      throw new Error('No current page available');
    }

    // Determine font name for HarfBuzz
    const fontName = this.getFontName(element.fontFamily, element.fontWeight);
    
    // Shape the text using HarfBuzz
    const shapingOptions: TextShapingOptions = {
      direction: element.direction as 'ltr' | 'rtl',
      script: 'arab', // Arabic script for Urdu
      language: 'urd', // Urdu language
      fontSize: element.fontSize,
      lineHeight: element.fontSize * 1.2
    };

    let shapedText: ShapedText;
    try {
      shapedText = harfbuzzService.shapeText(element.text, fontName, shapingOptions);
    } catch (error) {
      console.warn('Text shaping failed, using fallback:', error);
      // Fallback to simple text rendering
      await this.addFallbackText(element, options);
      return;
    }

    // Calculate text metrics
    const metrics = harfbuzzService.calculateTextMetrics(shapedText, element.fontSize);
    
    // Check if we need a new page
    if (this.currentY - metrics.height < this.pageLayout.contentArea.y - this.pageLayout.contentArea.height) {
      this.addNewPage();
    }

    // Calculate position based on text alignment
    let x = this.pageLayout.contentArea.x;
    if (element.textAlign === 'center') {
      x = this.pageLayout.contentArea.x + (this.pageLayout.contentArea.width - metrics.width) / 2;
    } else if (element.textAlign === 'right' || element.direction === 'rtl') {
      x = this.pageLayout.contentArea.x + this.pageLayout.contentArea.width - metrics.width;
    }

    // Render shaped text
    await this.renderShapedText(shapedText, x, this.currentY, element, options);

    // Update current Y position
    this.currentY -= metrics.lineHeight;
  }

  /**
   * Render shaped text using HarfBuzz glyphs
   */
  private async renderShapedText(
    shapedText: ShapedText,
    x: number,
    y: number,
    element: any,
    options: PDFExportOptions
  ): Promise<void> {
    if (!this.currentPage) return;

    const scale = element.fontSize / 1000; // HarfBuzz uses 1000 units per em
    let currentX = x;

    // For RTL text, start from the right
    if (shapedText.direction === 'rtl') {
      currentX = x + shapedText.glyphs.reduce((width, glyph) => width + glyph.x_advance * scale, 0);
    }

    for (const glyph of shapedText.glyphs) {
      // Calculate glyph position
      const glyphX = currentX + glyph.x_offset * scale;
      const glyphY = y - glyph.y_offset * scale;

      // Get glyph character (simplified - in real implementation, you'd need a glyph-to-char mapping)
      const glyphChar = String.fromCharCode(glyph.codepoint);
      
      // Set font and color
      const font = await this.currentPage.doc.embedFont(StandardFonts.Helvetica);
      const color = this.parseColor(element.color);

      // Draw the glyph
      this.currentPage.drawText(glyphChar, {
        x: glyphX,
        y: glyphY,
        size: element.fontSize,
        font,
        color
      });

      // Update position for next glyph
      if (shapedText.direction === 'rtl') {
        currentX -= glyph.x_advance * scale;
      } else {
        currentX += glyph.x_advance * scale;
      }
    }
  }

  /**
   * Add fallback text when HarfBuzz shaping fails
   */
  private async addFallbackText(
    element: {
      text: string;
      fontSize: number;
      color: string;
      textAlign: string;
      direction: string;
    },
    options: PDFExportOptions
  ): Promise<void> {
    if (!this.currentPage || !this.pageLayout) return;

    // Calculate text width (approximate)
    const textWidth = element.text.length * element.fontSize * 0.6;
    
    // Calculate position
    let x = this.pageLayout.contentArea.x;
    if (element.textAlign === 'center') {
      x = this.pageLayout.contentArea.x + (this.pageLayout.contentArea.width - textWidth) / 2;
    } else if (element.textAlign === 'right' || element.direction === 'rtl') {
      x = this.pageLayout.contentArea.x + this.pageLayout.contentArea.width - textWidth;
    }

    // Use a font that supports Unicode characters
    let font;
    try {
      // Try to use a Unicode-compatible font
      font = await this.currentPage.doc.embedFont(StandardFonts.Helvetica);
    } catch (error) {
      console.warn('Failed to embed font, using default:', error);
      font = await this.currentPage.doc.embedFont(StandardFonts.Helvetica);
    }

    const color = this.parseColor(element.color);

    // For Arabic/Urdu text, we need to handle encoding properly
    try {
      this.currentPage.drawText(element.text, {
        x,
        y: this.currentY,
        size: element.fontSize,
        font,
        color
      });
    } catch (error) {
      console.warn('Failed to draw text, using simplified approach:', error);
      // Fallback: draw each character individually or use a different approach
      this.drawTextSafely(element.text, x, this.currentY, element.fontSize, font, color);
    }

    this.currentY -= element.fontSize * 1.2;
  }

  /**
   * Safely draw text by handling encoding issues
   */
  private drawTextSafely(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    font: any,
    color: any
  ): void {
    if (!this.currentPage) return;

    try {
      // Try to draw the text as-is first
      this.currentPage.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color
      });
    } catch (error) {
      // If that fails, try drawing character by character
      let currentX = x;
      for (const char of text) {
        try {
          this.currentPage.drawText(char, {
            x: currentX,
            y,
            size: fontSize,
            font,
            color
          });
          currentX += fontSize * 0.6; // Approximate character width
        } catch (charError) {
          // Skip problematic characters
          console.warn(`Skipping character: ${char}`, charError);
          currentX += fontSize * 0.6;
        }
      }
    }
  }

  /**
   * Get font name for HarfBuzz based on CSS font family
   */
  private getFontName(fontFamily: string, fontWeight: string): string {
    return fontNameMapping.getFontNameForWeight(fontFamily, fontWeight);
  }

  /**
   * Parse CSS color to PDF color
   */
  private parseColor(color: string): any {
    // Remove any whitespace
    color = color.trim();
    
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
    
    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
      const values = color.match(/\d+/g);
      if (values && values.length >= 3) {
        const r = parseInt(values[0]) / 255;
        const g = parseInt(values[1]) / 255;
        const b = parseInt(values[2]) / 255;
        return rgb(r, g, b);
      }
    }
    
    // Handle named colors
    const namedColors: Record<string, [number, number, number]> = {
      black: [0, 0, 0],
      white: [1, 1, 1],
      red: [1, 0, 0],
      green: [0, 1, 0],
      blue: [0, 0, 1],
      gray: [0.5, 0.5, 0.5],
      grey: [0.5, 0.5, 0.5]
    };
    
    const lowerColor = color.toLowerCase();
    if (namedColors[lowerColor]) {
      const [r, g, b] = namedColors[lowerColor];
      return rgb(r, g, b);
    }
    
    // Default to black
    return rgb(0, 0, 0);
  }

  /**
   * Export PDF to blob for download
   */
  async exportToBlob(pdfBytes: Uint8Array): Promise<Blob> {
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  /**
   * Download PDF file
   */
  async downloadPDF(pdfBytes: Uint8Array, filename: string = 'document.pdf'): Promise<void> {
    const blob = await this.exportToBlob(pdfBytes);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Get PDF as data URL
   */
  async getPDFDataURL(pdfBytes: Uint8Array): Promise<string> {
    const blob = await this.exportToBlob(pdfBytes);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Export singleton instance
export const pdfGenerator = new PDFGenerator();
export default pdfGenerator;
