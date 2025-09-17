/**
 * HarfBuzz TipTap Extension
 * 
 * This extension integrates HarfBuzz text shaping directly into the TipTap editor,
 * providing real-time text shaping for Urdu and other RTL languages.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { harfbuzzService, ShapedText, TextShapingOptions } from '../services/harfbuzzService';
import { urduTextProcessor, TextProcessingOptions } from '../services/urduTextProcessor';

export interface HarfBuzzOptions {
  enabled: boolean;
  autoShape: boolean;
  showShapingStatus: boolean;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  normalizeText: boolean;
  handleBidirectional: boolean;
}

export interface HarfBuzzStorage {
  isShaping: boolean;
  shapingProgress: number;
  lastShapedText: string;
  shapedResults: Map<string, ShapedText>;
}

const HarfBuzzExtension = Extension.create<HarfBuzzOptions, HarfBuzzStorage>({
  name: 'harfbuzz',

  addOptions() {
    return {
      enabled: true,
      autoShape: true,
      showShapingStatus: true,
      fontSize: 16,
      fontFamily: 'Noto Nastaliq Urdu, serif',
      lineHeight: 24,
      normalizeText: true,
      handleBidirectional: true,
    };
  },

  addStorage() {
    return {
      isShaping: false,
      shapingProgress: 0,
      lastShapedText: '',
      shapedResults: new Map(),
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const storage = this.storage;
    
    return [
      new Plugin({
        key: new PluginKey('harfbuzz'),
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, decorationSet, oldState, newState) => {
            try {
              if (!options.enabled || !options.autoShape) {
                return DecorationSet.empty;
              }

              // Check if content has changed
              if (tr.docChanged) {
                const textContent = newState.doc.textContent || '';
                if (textContent !== storage.lastShapedText) {
                  storage.isShaping = true;
                  storage.shapingProgress = 0;
                  
                  // Process text content
                  processTextContent(textContent, options, storage);
                  storage.lastShapedText = textContent;
                }
              }

              return decorationSet;
            } catch (error) {
              console.warn('HarfBuzz extension error:', error);
              return DecorationSet.empty;
            }
          },
        },
        props: {
          decorations: (state) => {
            try {
              if (!options.showShapingStatus || !storage.isShaping) {
                return DecorationSet.empty;
              }

              // Create shaping decorations
              return createShapingDecorations(state, storage);
            } catch (error) {
              console.warn('HarfBuzz decorations error:', error);
              return DecorationSet.empty;
            }
          },
        },
      }),
    ];
  },

  addCommands() {
    const options = this.options;
    const storage = this.storage;
    
    return {
      shapeText: (options?: Partial<TextShapingOptions>) => () => {
        if (!this.options.enabled) return false;

        const { state, dispatch } = this.editor;
        return performTextShaping(state, dispatch, this.options, this.storage, options);
      },
      toggleHarfBuzz: () => () => {
        this.options.enabled = !this.options.enabled;
        return true;
      },
      setHarfBuzzOptions: (newOptions: Partial<HarfBuzzOptions>) => () => {
        Object.assign(this.options, newOptions);
        return true;
      },
    };
  },

  onUpdate() {
    try {
      if (this.options.enabled && this.options.autoShape) {
        const { state } = this.editor;
        const textContent = state.doc.textContent || '';
        
        if (textContent && textContent !== this.storage.lastShapedText) {
          processTextContent(textContent, this.options, this.storage);
          this.storage.lastShapedText = textContent;
        }
      }
    } catch (error) {
      console.warn('HarfBuzz onUpdate error:', error);
    }
  },

  onSelectionUpdate() {
    try {
      if (this.options.enabled && this.options.autoShape) {
        const { state } = this.editor;
        const { from, to } = state.selection;
        
        if (from !== to) {
          const selectedText = state.doc.textBetween(from, to);
          processTextContent(selectedText, this.options, this.storage);
        }
      }
    } catch (error) {
      console.warn('HarfBuzz onSelectionUpdate error:', error);
    }
  },
});

// Helper functions outside the extension
function processTextContent(text: string, options: HarfBuzzOptions, storage: HarfBuzzStorage) {
  if (!text.trim()) return;

  try {
    const processingOptions: TextProcessingOptions = {
      normalizeText: options.normalizeText,
      handleBidirectional: options.handleBidirectional,
      preserveFormatting: true,
      detectScript: true,
      shapeText: true,
      fontSize: options.fontSize,
      lineHeight: options.lineHeight,
      fontFamily: options.fontFamily,
    };

    // Process text with Urdu text processor
    urduTextProcessor.processHtmlContent(
      `<p>${text}</p>`,
      processingOptions
    ).then(processedBlocks => {
      // Store shaped results
      processedBlocks.forEach(block => {
        if (block.shapedText) {
          storage.shapedResults.set(block.text, block.shapedText);
        }
      });

      // Update progress
      storage.shapingProgress = 100;
      storage.isShaping = false;
    }).catch(error => {
      console.warn('Text processing failed:', error);
      storage.isShaping = false;
    });

  } catch (error) {
    console.warn('Text processing failed:', error);
    storage.isShaping = false;
  }
}

function performTextShaping(state: any, dispatch: any, options: HarfBuzzOptions, storage: HarfBuzzStorage, customOptions?: Partial<TextShapingOptions>) {
  if (!options.enabled) return false;

  try {
    const textContent = state.doc.textContent || '';
    const shapingOptions: TextShapingOptions = {
      direction: 'rtl',
      script: 'arab',
      language: 'urd',
      fontSize: options.fontSize,
      lineHeight: options.lineHeight,
      ...customOptions,
    };

    const shapedText = harfbuzzService.shapeText(
      textContent,
      options.fontFamily,
      shapingOptions
    );

    // Store the result
    storage.shapedResults.set(textContent, shapedText);

    return true;
  } catch (error) {
    console.warn('Manual text shaping failed:', error);
    return false;
  }
}

function createShapingDecorations(state: any, storage: HarfBuzzStorage): DecorationSet {
  if (!storage.isShaping) {
    return DecorationSet.empty;
  }

  const decorations: Decoration[] = [];
  const { from, to } = state.selection;

  // Add a decoration to show shaping is in progress
  decorations.push(
    Decoration.widget(from, () => {
      const widget = document.createElement('span');
      widget.className = 'harfbuzz-shaping-indicator';
      widget.textContent = `Shaping... ${storage.shapingProgress}%`;
      widget.style.cssText = `
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid rgba(59, 130, 246, 0.3);
      `;
      return widget;
    })
  );

  return DecorationSet.create(state.doc, decorations);
}

export default HarfBuzzExtension;