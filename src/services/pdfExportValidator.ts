/**
 * PDF Export Validator and Testing System
 * 
 * This service provides comprehensive validation and testing capabilities
 * for PDF export functionality, including HarfBuzz integration testing,
 * font validation, and export quality assessment.
 */

import { harfbuzzService } from './harfbuzzService';
import { fontNameMapping } from './fontNameMapping';
import { pdfGenerator, PDFExportOptions } from './pdfGenerator';
import { urduTextProcessor, TextProcessingOptions } from './urduTextProcessor';
import { fontManager } from './fontManager';

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    processingTime: number;
    textLength: number;
    fontCount: number;
    pageCount: number;
    fileSize: number;
  };
}

export interface TestCase {
  name: string;
  description: string;
  input: string;
  expectedOutput: string;
  options: PDFExportOptions;
}

export interface QualityMetrics {
  textShaping: {
    success: boolean;
    glyphCount: number;
    shapingTime: number;
    errors: string[];
  };
  fontRendering: {
    success: boolean;
    fontLoaded: boolean;
    metrics: any;
    errors: string[];
  };
  layout: {
    success: boolean;
    pageCount: number;
    overflow: boolean;
    errors: string[];
  };
  overall: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    recommendations: string[];
  };
}

class PDFExportValidator {
  private testCases: TestCase[] = [];

  /**
   * Initialize validator with test cases
   */
  async initialize(): Promise<void> {
    this.testCases = [
      {
        name: 'Simple Urdu Text',
        description: 'Basic Urdu text with Nasta\'liq font',
        input: '<p>اردو میں خوش آمدید</p>',
        expectedOutput: 'PDF with properly shaped Urdu text',
        options: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          fontSize: 16,
          lineHeight: 24,
          fontFamily: 'Noto Nastaliq Urdu, serif',
          textColor: '#000000',
          backgroundColor: '#ffffff'
        }
      },
      {
        name: 'Mixed Script Text',
        description: 'Text with Urdu and English mixed',
        input: '<p>اردو میں خوش آمدید - Welcome to Urdu</p>',
        expectedOutput: 'PDF with proper bidirectional text handling',
        options: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          fontSize: 16,
          lineHeight: 24,
          fontFamily: 'Noto Nastaliq Urdu, serif',
          textColor: '#000000',
          backgroundColor: '#ffffff'
        }
      },
      {
        name: 'Large Document',
        description: 'Multi-page document with various formatting',
        input: this.generateLargeDocument(),
        expectedOutput: 'Multi-page PDF with proper pagination',
        options: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          fontSize: 14,
          lineHeight: 20,
          fontFamily: 'Noto Nastaliq Urdu, serif',
          textColor: '#000000',
          backgroundColor: '#ffffff'
        }
      }
    ];
  }

  /**
   * Validate PDF export functionality
   */
  async validateExport(
    htmlContent: string,
    options: PDFExportOptions
  ): Promise<ValidationResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test HarfBuzz initialization
      if (!harfbuzzService) {
        errors.push('HarfBuzz service not available');
      }

      // Test font loading
      const fontStatus = fontManager.getLoadingStatus();
      if (fontStatus.loaded === 0) {
        errors.push('No fonts loaded');
      } else if (fontStatus.loaded < 2) {
        warnings.push('Limited font selection available');
      }

      // Test text processing
      const processingOptions: TextProcessingOptions = {
        normalizeText: true,
        handleBidirectional: true,
        preserveFormatting: true,
        detectScript: true,
        shapeText: true,
        fontSize: options.fontSize,
        lineHeight: options.lineHeight,
        fontFamily: options.fontFamily
      };

      const processedBlocks = await urduTextProcessor.processHtmlContent(htmlContent, processingOptions);
      if (processedBlocks.length === 0) {
        errors.push('No text content processed');
      }

      // Test PDF generation
      const pdfBytes = await pdfGenerator.processHtmlContent(htmlContent, options);
      if (pdfBytes.length === 0) {
        errors.push('PDF generation failed - empty output');
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      return {
        success: errors.length === 0,
        errors,
        warnings,
        metrics: {
          processingTime,
          textLength: htmlContent.length,
          fontCount: fontStatus.loaded,
          pageCount: 1, // This would be calculated from actual PDF
          fileSize: pdfBytes.length
        }
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        errors: [`Export validation failed: ${error}`],
        warnings,
        metrics: {
          processingTime: endTime - startTime,
          textLength: htmlContent.length,
          fontCount: 0,
          pageCount: 0,
          fileSize: 0
        }
      };
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runTestSuite(): Promise<{
    passed: number;
    failed: number;
    results: Array<{ testCase: TestCase; result: ValidationResult }>;
  }> {
    const results: Array<{ testCase: TestCase; result: ValidationResult }> = [];
    let passed = 0;
    let failed = 0;

    for (const testCase of this.testCases) {
      try {
        const result = await this.validateExport(testCase.input, testCase.options);
        results.push({ testCase, result });
        
        if (result.success) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        results.push({
          testCase,
          result: {
            success: false,
            errors: [`Test execution failed: ${error}`],
            warnings: [],
            metrics: {
              processingTime: 0,
              textLength: 0,
              fontCount: 0,
              pageCount: 0,
              fileSize: 0
            }
          }
        });
        failed++;
      }
    }

    return { passed, failed, results };
  }

  /**
   * Assess export quality
   */
  async assessQuality(
    htmlContent: string,
    options: PDFExportOptions
  ): Promise<QualityMetrics> {
    const textShaping = await this.testTextShaping(htmlContent);
    const fontRendering = await this.testFontRendering(options);
    const layout = await this.testLayout(htmlContent, options);

    const overallScore = this.calculateOverallScore(textShaping, fontRendering, layout);
    const grade = this.getGrade(overallScore);
    const recommendations = this.generateRecommendations(textShaping, fontRendering, layout);

    return {
      textShaping,
      fontRendering,
      layout,
      overall: {
        score: overallScore,
        grade,
        recommendations
      }
    };
  }

  /**
   * Test text shaping functionality
   */
  private async testTextShaping(htmlContent: string): Promise<QualityMetrics['textShaping']> {
    const startTime = performance.now();
    const errors: string[] = [];

    try {
      const processedBlocks = await urduTextProcessor.processHtmlContent(htmlContent, {
        normalizeText: true,
        handleBidirectional: true,
        preserveFormatting: true,
        detectScript: true,
        shapeText: true,
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'Noto Nastaliq Urdu, serif'
      });

      let totalGlyphs = 0;
      for (const block of processedBlocks) {
        if (block.shapedText) {
          totalGlyphs += block.shapedText.glyphs.length;
        }
      }

      const endTime = performance.now();
      const shapingTime = endTime - startTime;

      return {
        success: errors.length === 0,
        glyphCount: totalGlyphs,
        shapingTime,
        errors
      };
    } catch (error) {
      return {
        success: false,
        glyphCount: 0,
        shapingTime: 0,
        errors: [`Text shaping failed: ${error}`]
      };
    }
  }

  /**
   * Test font rendering
   */
  private async testFontRendering(options: PDFExportOptions): Promise<QualityMetrics['fontRendering']> {
    const errors: string[] = [];
    let fontLoaded = false;
    let metrics = null;

    try {
      const fontName = this.getFontNameForOptions(options);
      fontLoaded = harfbuzzService.isFontLoaded(fontName);
      
      if (fontLoaded) {
        metrics = await fontManager.getFontMetrics(fontName);
      } else {
        errors.push(`Font not loaded: ${fontName}`);
      }

      return {
        success: fontLoaded && metrics !== null,
        fontLoaded,
        metrics,
        errors
      };
    } catch (error) {
      return {
        success: false,
        fontLoaded: false,
        metrics: null,
        errors: [`Font rendering test failed: ${error}`]
      };
    }
  }

  /**
   * Test layout and pagination
   */
  private async testLayout(htmlContent: string, options: PDFExportOptions): Promise<QualityMetrics['layout']> {
    const errors: string[] = [];
    let pageCount = 1;
    let overflow = false;

    try {
      // This would involve more sophisticated layout testing
      // For now, we'll do basic validation
      const contentLength = htmlContent.length;
      if (contentLength > 10000) {
        pageCount = Math.ceil(contentLength / 5000);
      }

      return {
        success: errors.length === 0,
        pageCount,
        overflow,
        errors
      };
    } catch (error) {
      return {
        success: false,
        pageCount: 0,
        overflow: true,
        errors: [`Layout test failed: ${error}`]
      };
    }
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(
    textShaping: QualityMetrics['textShaping'],
    fontRendering: QualityMetrics['fontRendering'],
    layout: QualityMetrics['layout']
  ): number {
    let score = 0;
    
    if (textShaping.success) score += 40;
    if (fontRendering.success) score += 30;
    if (layout.success) score += 30;
    
    // Deduct points for errors
    score -= textShaping.errors.length * 5;
    score -= fontRendering.errors.length * 5;
    score -= layout.errors.length * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get grade based on score
   */
  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(
    textShaping: QualityMetrics['textShaping'],
    fontRendering: QualityMetrics['fontRendering'],
    layout: QualityMetrics['layout']
  ): string[] {
    const recommendations: string[] = [];

    if (!textShaping.success) {
      recommendations.push('Enable HarfBuzz text shaping for better typography');
    }
    
    if (!fontRendering.success) {
      recommendations.push('Load additional Urdu fonts for better coverage');
    }
    
    if (layout.overflow) {
      recommendations.push('Consider adjusting page margins or font size');
    }
    
    if (textShaping.shapingTime > 1000) {
      recommendations.push('Text shaping is slow - consider optimizing font loading');
    }

    return recommendations;
  }

  /**
   * Get font name for options
   */
  private getFontNameForOptions(options: PDFExportOptions): string {
    return fontNameMapping.getInternalName(options.fontFamily);
  }

  /**
   * Generate large document for testing
   */
  private generateLargeDocument(): string {
    const paragraphs = [
      'اردو زبان ایک خوبصورت اور نفیس زبان ہے جو اپنی شاعری اور نثر کے لیے مشہور ہے۔',
      'یہ زبان عربی رسم الخط میں لکھی جاتی ہے اور اس میں بہت سے خوبصورت حروف اور الفاظ ہیں۔',
      'اردو ادب میں بہت سے مشہور شاعر اور ادیب ہوئے ہیں جن میں مرزا غالب، علامہ اقبال، اور فیض احمد فیض شامل ہیں۔',
      'آج کل اردو زبان کو ڈیجیٹل دنیا میں بھی اہمیت حاصل ہو رہی ہے اور بہت سے نئے ٹولز اور سافٹ ویئر بنائے جا رہے ہیں۔'
    ];

    let html = '';
    for (let i = 0; i < 20; i++) {
      const paragraph = paragraphs[i % paragraphs.length];
      html += `<p>${paragraph}</p>`;
    }

    return html;
  }

  /**
   * Get validation report
   */
  async getValidationReport(htmlContent: string, options: PDFExportOptions): Promise<string> {
    const validation = await this.validateExport(htmlContent, options);
    const quality = await this.assessQuality(htmlContent, options);

    let report = 'PDF Export Validation Report\n';
    report += '================================\n\n';
    
    report += `Status: ${validation.success ? 'PASSED' : 'FAILED'}\n`;
    report += `Quality Grade: ${quality.overall.grade} (${quality.overall.score}/100)\n\n`;
    
    report += 'Metrics:\n';
    report += `- Processing Time: ${validation.metrics.processingTime.toFixed(2)}ms\n`;
    report += `- Text Length: ${validation.metrics.textLength} characters\n`;
    report += `- Fonts Loaded: ${validation.metrics.fontCount}\n`;
    report += `- File Size: ${(validation.metrics.fileSize / 1024).toFixed(2)} KB\n\n`;
    
    if (validation.errors.length > 0) {
      report += 'Errors:\n';
      validation.errors.forEach(error => report += `- ${error}\n`);
      report += '\n';
    }
    
    if (validation.warnings.length > 0) {
      report += 'Warnings:\n';
      validation.warnings.forEach(warning => report += `- ${warning}\n`);
      report += '\n';
    }
    
    if (quality.overall.recommendations.length > 0) {
      report += 'Recommendations:\n';
      quality.overall.recommendations.forEach(rec => report += `- ${rec}\n`);
    }

    return report;
  }
}

// Export singleton instance
export const pdfExportValidator = new PDFExportValidator();
export default pdfExportValidator;
