/**
 * Document Analysis Operations
 * Extract statistics and insights from structured documents
 */

import { 
  DocumentNode, 
  DocumentStats, 
  NodeType,
  MarkType,
  Mark
} from '../schema/types';

/**
 * Get comprehensive document statistics
 */
export function getDocumentStats(document: DocumentNode): DocumentStats {
  const stats = {
    wordCount: 0,
    characterCount: 0,
    characterCountNoSpaces: 0,
    paragraphCount: 0,
    headingCount: 0,
    pageCount: 0,
    readingTime: 0,
    lastModified: new Date(),
    created: new Date(),
    version: '1.0.0'
  };

  // Analyze document content
  analyzeDocument(document, stats);

  // Calculate reading time (average 200 words per minute)
  stats.readingTime = Math.ceil(stats.wordCount / 200);

  return stats;
}

/**
 * Analyze document content recursively
 */
function analyzeDocument(node: DocumentNode, stats: DocumentStats): void {
  // Count different node types
  switch (node.type) {
    case 'paragraph':
      stats.paragraphCount++;
      break;
    
    case 'heading':
      stats.headingCount++;
      break;
    
    case 'pageBreak':
      stats.pageCount++;
      break;
  }

  // Analyze text content
  if (node.text) {
    const text = node.text;
    stats.characterCount += text.length;
    stats.characterCountNoSpaces += text.replace(/\s/g, '').length;
    stats.wordCount += countWords(text);
  }

  // Recursively analyze child nodes
  if (node.content) {
    node.content.forEach(child => analyzeDocument(child, stats));
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  // Handle different languages and scripts
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Get word count for the document
 */
export function getWordCount(document: DocumentNode): number {
  const stats = getDocumentStats(document);
  return stats.wordCount;
}

/**
 * Get character count for the document
 */
export function getCharacterCount(document: DocumentNode): number {
  const stats = getDocumentStats(document);
  return stats.characterCount;
}

/**
 * Get character count without spaces
 */
export function getCharacterCountNoSpaces(document: DocumentNode): number {
  const stats = getDocumentStats(document);
  return stats.characterCountNoSpaces;
}

/**
 * Get paragraph count
 */
export function getParagraphCount(document: DocumentNode): number {
  return countNodesByType(document, 'paragraph');
}

/**
 * Get heading count
 */
export function getHeadingCount(document: DocumentNode): number {
  return countNodesByType(document, 'heading');
}

/**
 * Get page count
 */
export function getPageCount(document: DocumentNode): number {
  return countNodesByType(document, 'pageBreak') + 1; // +1 for the first page
}

/**
 * Get reading time in minutes
 */
export function getReadingTime(document: DocumentNode): number {
  const wordCount = getWordCount(document);
  return Math.ceil(wordCount / 200); // 200 words per minute
}

/**
 * Count nodes by type
 */
export function countNodesByType(document: DocumentNode, nodeType: NodeType): number {
  let count = 0;
  
  if (document.type === nodeType) {
    count++;
  }
  
  if (document.content) {
    count += document.content.reduce((sum, child) => sum + countNodesByType(child, nodeType), 0);
  }
  
  return count;
}

/**
 * Get all nodes of a specific type
 */
export function getNodesByType(document: DocumentNode, nodeType: NodeType): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  
  if (document.type === nodeType) {
    nodes.push(document);
  }
  
  if (document.content) {
    document.content.forEach(child => {
      nodes.push(...getNodesByType(child, nodeType));
    });
  }
  
  return nodes;
}

/**
 * Get all text content from the document
 */
export function getAllText(document: DocumentNode): string {
  let text = '';
  
  if (document.text) {
    text += document.text;
  }
  
  if (document.content) {
    text += document.content.map(getAllText).join('');
  }
  
  return text;
}

/**
 * Get all text content with formatting preserved
 */
export function getAllTextWithFormatting(document: DocumentNode): string {
  let text = '';
  
  if (document.text) {
    text += document.text;
  }
  
  if (document.content) {
    text += document.content.map(getAllTextWithFormatting).join(' ');
  }
  
  return text;
}

/**
 * Get document outline (headings structure)
 */
export function getDocumentOutline(document: DocumentNode): Array<{
  level: number;
  text: string;
  node: DocumentNode;
  path: number[];
}> {
  const outline: Array<{
    level: number;
    text: string;
    node: DocumentNode;
    path: number[];
  }> = [];
  
  const traverse = (node: DocumentNode, path: number[]): void => {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const text = getAllText(node);
      outline.push({ level, text, node, path });
    }
    
    if (node.content) {
      node.content.forEach((child, index) => {
        traverse(child, [...path, index]);
      });
    }
  };
  
  traverse(document, []);
  return outline;
}

/**
 * Get document structure (tree view)
 */
export function getDocumentStructure(document: DocumentNode): Array<{
  type: NodeType;
  level: number;
  text?: string;
  attrs?: Record<string, any>;
  path: number[];
}> {
  const structure: Array<{
    type: NodeType;
    level: number;
    text?: string;
    attrs?: Record<string, any>;
    path: number[];
  }> = [];
  
  const traverse = (node: DocumentNode, path: number[], level: number = 0): void => {
    structure.push({
      type: node.type,
      level,
      text: node.text,
      attrs: node.attrs,
      path
    });
    
    if (node.content) {
      node.content.forEach((child, index) => {
        traverse(child, [...path, index], level + 1);
      });
    }
  };
  
  traverse(document, []);
  return structure;
}

/**
 * Get document metadata
 */
export function getDocumentMetadata(document: DocumentNode): Record<string, any> {
  const metadata: Record<string, any> = {};
  
  // Extract metadata from document attributes
  if (document.attrs) {
    Object.entries(document.attrs).forEach(([key, value]) => {
      if (key.startsWith('meta_')) {
        metadata[key.substring(5)] = value;
      }
    });
  }
  
  // Add computed metadata
  metadata.wordCount = getWordCount(document);
  metadata.characterCount = getCharacterCount(document);
  metadata.paragraphCount = getParagraphCount(document);
  metadata.headingCount = getHeadingCount(document);
  metadata.pageCount = getPageCount(document);
  metadata.readingTime = getReadingTime(document);
  
  return metadata;
}

/**
 * Get document language
 */
export function getDocumentLanguage(document: DocumentNode): string {
  // Check for language in document attributes
  if (document.attrs?.language) {
    return document.attrs.language;
  }
  
  // Check for language in text nodes
  const textNodes = getNodesByType(document, 'text');
  for (const node of textNodes) {
    if (node.attrs?.language) {
      return node.attrs.language;
    }
  }
  
  // Default to Urdu for our editor
  return 'ur';
}

/**
 * Get document direction (RTL/LTR)
 */
export function getDocumentDirection(document: DocumentNode): 'ltr' | 'rtl' {
  // Check for direction in document attributes
  if (document.attrs?.dir) {
    return document.attrs.dir;
  }
  
  // Check for direction in paragraph nodes
  const paragraphNodes = getNodesByType(document, 'paragraph');
  for (const node of paragraphNodes) {
    if (node.attrs?.dir) {
      return node.attrs.dir;
    }
  }
  
  // Default to RTL for Urdu
  return 'rtl';
}

/**
 * Get document fonts used
 */
export function getDocumentFonts(document: DocumentNode): string[] {
  const fonts = new Set<string>();
  
  const traverse = (node: DocumentNode): void => {
    // Check for font family in marks
    if (node.marks) {
      node.marks.forEach(mark => {
        if (mark.type === 'fontFamily' && mark.attrs?.family) {
          fonts.add(mark.attrs.family);
        }
      });
    }
    
    // Check for font family in attributes
    if (node.attrs?.fontFamily) {
      fonts.add(node.attrs.fontFamily);
    }
    
    // Recursively check child nodes
    if (node.content) {
      node.content.forEach(traverse);
    }
  };
  
  traverse(document);
  return Array.from(fonts);
}

/**
 * Get document colors used
 */
export function getDocumentColors(document: DocumentNode): string[] {
  const colors = new Set<string>();
  
  const traverse = (node: DocumentNode): void => {
    // Check for colors in marks
    if (node.marks) {
      node.marks.forEach(mark => {
        if (mark.type === 'color' && mark.attrs?.color) {
          colors.add(mark.attrs.color);
        }
        if (mark.type === 'backgroundColor' && mark.attrs?.color) {
          colors.add(mark.attrs.color);
        }
        if (mark.type === 'highlight' && mark.attrs?.color) {
          colors.add(mark.attrs.color);
        }
      });
    }
    
    // Check for colors in attributes
    if (node.attrs?.color) {
      colors.add(node.attrs.color);
    }
    if (node.attrs?.backgroundColor) {
      colors.add(node.attrs.backgroundColor);
    }
    
    // Recursively check child nodes
    if (node.content) {
      node.content.forEach(traverse);
    }
  };
  
  traverse(document);
  return Array.from(colors);
}

/**
 * Get document formatting summary
 */
export function getDocumentFormattingSummary(document: DocumentNode): {
  boldCount: number;
  italicCount: number;
  underlineCount: number;
  strikeCount: number;
  linkCount: number;
  highlightCount: number;
  fontSizeCount: number;
  fontFamilyCount: number;
  colorCount: number;
} {
  const summary = {
    boldCount: 0,
    italicCount: 0,
    underlineCount: 0,
    strikeCount: 0,
    linkCount: 0,
    highlightCount: 0,
    fontSizeCount: 0,
    fontFamilyCount: 0,
    colorCount: 0
  };
  
  const traverse = (node: DocumentNode): void => {
    if (node.marks) {
      node.marks.forEach(mark => {
        switch (mark.type) {
          case 'bold':
            summary.boldCount++;
            break;
          case 'italic':
            summary.italicCount++;
            break;
          case 'underline':
            summary.underlineCount++;
            break;
          case 'strike':
            summary.strikeCount++;
            break;
          case 'link':
            summary.linkCount++;
            break;
          case 'highlight':
            summary.highlightCount++;
            break;
          case 'fontSize':
            summary.fontSizeCount++;
            break;
          case 'fontFamily':
            summary.fontFamilyCount++;
            break;
          case 'color':
            summary.colorCount++;
            break;
        }
      });
    }
    
    if (node.content) {
      node.content.forEach(traverse);
    }
  };
  
  traverse(document);
  return summary;
}

/**
 * Get document complexity score
 */
export function getDocumentComplexity(document: DocumentNode): number {
  const stats = getDocumentStats(document);
  const formatting = getDocumentFormattingSummary(document);
  
  // Calculate complexity based on various factors
  let complexity = 0;
  
  // Base complexity from content
  complexity += stats.wordCount * 0.1;
  complexity += stats.paragraphCount * 0.5;
  complexity += stats.headingCount * 1.0;
  complexity += stats.pageCount * 2.0;
  
  // Formatting complexity
  complexity += formatting.boldCount * 0.1;
  complexity += formatting.italicCount * 0.1;
  complexity += formatting.underlineCount * 0.1;
  complexity += formatting.linkCount * 0.5;
  complexity += formatting.highlightCount * 0.3;
  complexity += formatting.fontSizeCount * 0.2;
  complexity += formatting.fontFamilyCount * 0.2;
  complexity += formatting.colorCount * 0.2;
  
  return Math.round(complexity);
}

/**
 * Get document readability score
 */
export function getDocumentReadability(document: DocumentNode): number {
  const text = getAllText(document);
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  
  if (words.length === 0 || sentences.length === 0) {
    return 0;
  }
  
  // Simple readability calculation (Flesch Reading Ease approximation)
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = words.reduce((sum, word) => sum + countSyllables(word), 0) / words.length;
  
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
  // Simple syllable counting for English
  const vowels = 'aeiouyAEIOUY';
  let count = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  // Handle silent 'e'
  if (word.endsWith('e') && count > 1) {
    count--;
  }
  
  return Math.max(1, count);
}

/**
 * Get document summary
 */
export function getDocumentSummary(document: DocumentNode): {
  stats: DocumentStats;
  outline: Array<{ level: number; text: string; node: DocumentNode; path: number[] }>;
  formatting: ReturnType<typeof getDocumentFormattingSummary>;
  complexity: number;
  readability: number;
  language: string;
  direction: 'ltr' | 'rtl';
  fonts: string[];
  colors: string[];
} {
  return {
    stats: getDocumentStats(document),
    outline: getDocumentOutline(document),
    formatting: getDocumentFormattingSummary(document),
    complexity: getDocumentComplexity(document),
    readability: getDocumentReadability(document),
    language: getDocumentLanguage(document),
    direction: getDocumentDirection(document),
    fonts: getDocumentFonts(document),
    colors: getDocumentColors(document)
  };
}

/**
 * Export all functions
 */
export * from './analysis';
