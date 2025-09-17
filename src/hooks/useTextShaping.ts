/**
 * Text Shaping Hook
 * 
 * This hook provides real-time text shaping capabilities using HarfBuzz
 * for Urdu and other RTL languages in the editor.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { harfbuzzService, ShapedText, TextShapingOptions } from '../services/harfbuzzService';
import { urduTextProcessor, TextProcessingOptions, ProcessedTextBlock } from '../services/urduTextProcessor';
import { useHarfBuzz } from '../contexts/HarfBuzzContext';

export interface UseTextShapingOptions {
  enabled: boolean;
  autoShape: boolean;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  normalizeText: boolean;
  handleBidirectional: boolean;
  debounceMs: number;
}

export interface TextShapingResult {
  originalText: string;
  shapedText: ShapedText | null;
  processedBlocks: ProcessedTextBlock[];
  isShaping: boolean;
  progress: number;
  error: string | null;
  lastShaped: Date | null;
}

export interface UseTextShapingReturn {
  result: TextShapingResult;
  shapeText: (text: string, options?: Partial<TextShapingOptions>) => Promise<ShapedText | null>;
  shapeHtmlContent: (html: string, options?: Partial<TextProcessingOptions>) => Promise<ProcessedTextBlock[]>;
  clearResults: () => void;
  isHarfBuzzAvailable: boolean;
  isInitialized: boolean;
}

const defaultOptions: UseTextShapingOptions = {
  enabled: true,
  autoShape: true,
  fontSize: 16,
  fontFamily: 'Noto Nastaliq Urdu, serif',
  lineHeight: 24,
  normalizeText: true,
  handleBidirectional: true,
  debounceMs: 300,
};

export const useTextShaping = (options: Partial<UseTextShapingOptions> = {}): UseTextShapingReturn => {
  const opts = { ...defaultOptions, ...options };
  
  // Use centralized HarfBuzz context
  const { isInitialized, isHarfBuzzAvailable, error: harfbuzzError } = useHarfBuzz();
  
  const [result, setResult] = useState<TextShapingResult>({
    originalText: '',
    shapedText: null,
    processedBlocks: [],
    isShaping: false,
    progress: 0,
    error: null,
    lastShaped: null,
  });
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Update result error when HarfBuzz context error changes
  useEffect(() => {
    if (harfbuzzError) {
      setResult(prev => ({ ...prev, error: harfbuzzError }));
    }
  }, [harfbuzzError]);

  // Shape text with HarfBuzz
  const shapeText = useCallback(async (
    text: string,
    customOptions?: Partial<TextShapingOptions>
  ): Promise<ShapedText | null> => {
    if (!opts.enabled || !isHarfBuzzAvailable || !text.trim()) {
      return null;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setResult(prev => ({
      ...prev,
      originalText: text,
      isShaping: true,
      progress: 0,
      error: null,
    }));

    try {
      const shapingOptions: TextShapingOptions = {
        direction: 'rtl',
        script: 'arab',
        language: 'urd',
        fontSize: opts.fontSize,
        lineHeight: opts.lineHeight,
        ...customOptions,
      };

      setResult(prev => ({ ...prev, progress: 25 }));

      const shapedText = harfbuzzService.shapeText(text, opts.fontFamily, shapingOptions);
      
      setResult(prev => ({ ...prev, progress: 75 }));

      // Calculate metrics
      const metrics = harfbuzzService.calculateTextMetrics(shapedText, opts.fontSize);
      
      setResult(prev => ({
        ...prev,
        shapedText,
        isShaping: false,
        progress: 100,
        lastShaped: new Date(),
      }));

      return shapedText;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Text shaping failed';
      setResult(prev => ({
        ...prev,
        isShaping: false,
        error: errorMessage,
        progress: 0,
      }));
      return null;
    }
  }, [opts, isHarfBuzzAvailable]);

  // Shape HTML content
  const shapeHtmlContent = useCallback(async (
    html: string,
    customOptions?: Partial<TextProcessingOptions>
  ): Promise<ProcessedTextBlock[]> => {
    if (!opts.enabled || !isHarfBuzzAvailable || !html.trim()) {
      return [];
    }

    setResult(prev => ({
      ...prev,
      isShaping: true,
      progress: 0,
      error: null,
    }));

    try {
      const processingOptions: TextProcessingOptions = {
        normalizeText: opts.normalizeText,
        handleBidirectional: opts.handleBidirectional,
        preserveFormatting: true,
        detectScript: true,
        shapeText: true,
        fontSize: opts.fontSize,
        lineHeight: opts.lineHeight,
        fontFamily: opts.fontFamily,
        ...customOptions,
      };

      setResult(prev => ({ ...prev, progress: 30 }));

      const processedBlocks = await urduTextProcessor.processHtmlContent(html, processingOptions);
      
      setResult(prev => ({ ...prev, progress: 80 }));

      // Extract shaped text from blocks
      const shapedTexts = processedBlocks
        .filter(block => block.shapedText)
        .map(block => block.shapedText!);

      setResult(prev => ({
        ...prev,
        processedBlocks,
        isShaping: false,
        progress: 100,
        lastShaped: new Date(),
      }));

      return processedBlocks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'HTML processing failed';
      setResult(prev => ({
        ...prev,
        isShaping: false,
        error: errorMessage,
        progress: 0,
      }));
      return [];
    }
  }, [opts, isHarfBuzzAvailable]);

  // Debounced text shaping
  const debouncedShapeText = useCallback((text: string, options?: Partial<TextShapingOptions>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      shapeText(text, options);
    }, opts.debounceMs);
  }, [shapeText, opts.debounceMs]);

  // Auto-shape text when it changes
  useEffect(() => {
    if (opts.autoShape && result.originalText && result.originalText !== result.lastShaped?.toString()) {
      debouncedShapeText(result.originalText);
    }
  }, [result.originalText, opts.autoShape, debouncedShapeText, result.lastShaped]);

  // Clear results
  const clearResults = useCallback(() => {
    setResult({
      originalText: '',
      shapedText: null,
      processedBlocks: [],
      isShaping: false,
      progress: 0,
      error: null,
      lastShaped: null,
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    result,
    shapeText,
    shapeHtmlContent,
    clearResults,
    isHarfBuzzAvailable,
    isInitialized,
  };
};

export default useTextShaping;
