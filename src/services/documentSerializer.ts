/**
 * Document Serialization Service
 * Handles conversion between JSON document model and various formats
 */

import { type DocumentNode } from '../document/schema/types';
import { type Document, type Page } from '../types';
import { 
  createDocumentNode, 
  createParagraphNode, 
  createTextNode, 
  createHeadingNode,
  createPageBreakNode,
  htmlToDocumentNode,
  documentNodeToHtml,
  splitDocumentIntoPages,
  isPageBreakNode
} from './documentSchema';

/**
 * Serialize document to JSON string
 */
export const serializeDocument = (document: DocumentNode): string => {
  try {
    return JSON.stringify(document, null, 2);
  } catch (error) {
    console.error('Failed to serialize document:', error);
    throw new Error('Document serialization failed');
  }
};

/**
 * Deserialize document from JSON string
 */
export const deserializeDocument = (jsonString: string): DocumentNode => {
  try {
    const parsed = JSON.parse(jsonString);
    return validateDocumentStructure(parsed);
  } catch (error) {
    console.error('Failed to deserialize document:', error);
    throw new Error('Document deserialization failed');
  }
};

/**
 * Validate document structure
 */
export const validateDocumentStructure = (document: any): DocumentNode => {
  if (!document || typeof document !== 'object') {
    throw new Error('Invalid document structure');
  }
  
  if (!document.type) {
    throw new Error('Document must have a type');
  }
  
  // Ensure required properties exist
  const validatedDocument: DocumentNode = {
    type: document.type,
    attrs: document.attrs || {},
    content: document.content || [],
    marks: document.marks || [],
    text: document.text
  };
  
  // Validate content recursively
  if (validatedDocument.content) {
    validatedDocument.content = validatedDocument.content.map(validateDocumentStructure);
  }
  
  return validatedDocument;
};

/**
 * Convert document to HTML for display
 */
export const documentToHtml = (document: DocumentNode): string => {
  try {
    return documentNodeToHtml(document);
  } catch (error) {
    console.warn('Failed to convert document to HTML:', error);
    return '<p>Error converting document</p>';
  }
};

/**
 * Convert HTML to document structure
 */
export const htmlToDocument = (html: string): DocumentNode => {
  try {
    return htmlToDocumentNode(html);
  } catch (error) {
    console.warn('Failed to convert HTML to document:', error);
    // Return a simple paragraph with the HTML content as text
    return createDocumentNode([
      createParagraphNode([
        createTextNode(html.replace(/<[^>]*>/g, '')) // Strip HTML tags
      ])
    ]);
  }
};

/**
 * Create a new empty document
 */
export const createEmptyDocument = (): DocumentNode => {
  return createDocumentNode([
    createParagraphNode([
      createTextNode('اردو میں خوش آمدید')
    ])
  ]);
};

/**
 * Create a document from pages array
 */
export const createDocumentFromPages = (pages: Page[]): DocumentNode => {
  const content: DocumentNode[] = [];
  
  pages.forEach((page, index) => {
    // Add page content
    if (page.content.content) {
      content.push(...page.content.content);
    }
    
    // Add page break between pages (except for the last page)
    if (index < pages.length - 1) {
      content.push(createPageBreakNode(index + 2, false));
    }
  });
  
  return createDocumentNode(content);
};

/**
 * Split document into pages based on content and page breaks
 */
export const splitDocumentIntoPagesWithBreaks = (
  document: DocumentNode,
  maxPageHeight: number = 800
): Page[] => {
  const pages: Page[] = [];
  const documentPages = splitDocumentIntoPages(document);
  
  documentPages.forEach((pageContent, index) => {
    const page: Page = {
      id: `page-${index + 1}`,
      content: pageContent,
      height: maxPageHeight,
      isOverflowing: false,
      overflowAmount: 0
    };
    
    pages.push(page);
  });
  
  return pages;
};

/**
 * Merge pages back into a single document
 */
export const mergePagesIntoDocument = (pages: Page[]): DocumentNode => {
  return createDocumentFromPages(pages);
};

/**
 * Extract text content from document
 */
export const extractTextFromDocument = (document: DocumentNode): string => {
  if (!document.content) {
    return document.text || '';
  }
  
  const textParts: string[] = [];
  
  const extractText = (node: DocumentNode): void => {
    if (node.text) {
      textParts.push(node.text);
    }
    
    if (node.content) {
      node.content.forEach(extractText);
    }
  };
  
  extractText(document);
  return textParts.join(' ');
};

/**
 * Get document statistics
 */
export const getDocumentStats = (document: DocumentNode): {
  totalNodes: number;
  totalText: number;
  pageBreaks: number;
  paragraphs: number;
  headings: number;
} => {
  let totalNodes = 0;
  let totalText = 0;
  let pageBreaks = 0;
  let paragraphs = 0;
  let headings = 0;
  
  const traverse = (node: DocumentNode): void => {
    totalNodes++;
    
    if (node.type === 'pageBreak') {
      pageBreaks++;
    } else if (node.type === 'paragraph') {
      paragraphs++;
    } else if (node.type === 'heading') {
      headings++;
    }
    
    if (node.text) {
      totalText += node.text.length;
    }
    
    if (node.content) {
      node.content.forEach(traverse);
    }
  };
  
  traverse(document);
  
  return {
    totalNodes,
    totalText,
    pageBreaks,
    paragraphs,
    headings
  };
};

/**
 * Clone document structure
 */
export const cloneDocument = (document: DocumentNode): DocumentNode => {
  return JSON.parse(JSON.stringify(document));
};

/**
 * Find and replace text in document
 */
export const findAndReplaceInDocument = (
  document: DocumentNode,
  searchText: string,
  replaceText: string,
  caseSensitive: boolean = false
): DocumentNode => {
  const cloned = cloneDocument(document);
  
  const replace = (node: DocumentNode): void => {
    if (node.text) {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      node.text = node.text.replace(regex, replaceText);
    }
    
    if (node.content) {
      node.content.forEach(replace);
    }
  };
  
  replace(cloned);
  return cloned;
};

/**
 * Insert content at specific position
 */
export const insertContentAtPosition = (
  document: DocumentNode,
  position: number,
  content: DocumentNode[]
): DocumentNode => {
  if (!document.content) {
    return {
      ...document,
      content: content
    };
  }
  
  const newContent = [...document.content];
  newContent.splice(position, 0, ...content);
  
  return {
    ...document,
    content: newContent
  };
};

/**
 * Remove content at specific position
 */
export const removeContentAtPosition = (
  document: DocumentNode,
  position: number,
  count: number = 1
): DocumentNode => {
  if (!document.content) {
    return document;
  }
  
  const newContent = [...document.content];
  newContent.splice(position, count);
  
  return {
    ...document,
    content: newContent
  };
};

/**
 * Get content at specific position
 */
export const getContentAtPosition = (
  document: DocumentNode,
  position: number
): DocumentNode | null => {
  if (!document.content || position < 0 || position >= document.content.length) {
    return null;
  }
  
  return document.content[position];
};

/**
 * Export document to various formats
 */
export const exportDocument = (
  document: DocumentNode,
  format: 'json' | 'html' | 'text' | 'pages'
): string | Page[] => {
  switch (format) {
    case 'json':
      return serializeDocument(document);
    case 'html':
      return documentToHtml(document);
    case 'text':
      return extractTextFromDocument(document);
    case 'pages':
      return splitDocumentIntoPagesWithBreaks(document);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Import document from various formats
 */
export const importDocument = (
  content: string,
  format: 'json' | 'html' | 'text'
): DocumentNode => {
  switch (format) {
    case 'json':
      return deserializeDocument(content);
    case 'html':
      return htmlToDocument(content);
    case 'text':
      return createDocumentNode([
        createParagraphNode([
          createTextNode(content)
        ])
      ]);
    default:
      throw new Error(`Unsupported import format: ${format}`);
  }
};

/**
 * Migrate from old HTML-based page system to JSON document model
 */
export const migrateFromHtmlPages = (htmlPages: string[]): DocumentNode => {
  const content: DocumentNode[] = [];
  
  htmlPages.forEach((html, index) => {
    // Convert HTML to document structure
    const pageDocument = htmlToDocument(html);
    
    // Add page content
    if (pageDocument.content) {
      content.push(...pageDocument.content);
    }
    
    // Add page break between pages (except for the last page)
    if (index < htmlPages.length - 1) {
      content.push(createPageBreakNode(index + 2, false));
    }
  });
  
  return createDocumentNode(content);
};

/**
 * Convert JSON document model back to HTML pages
 */
export const convertToHtmlPages = (document: DocumentNode): string[] => {
  const pages = splitDocumentIntoPages(document);
  return pages.map(page => documentToHtml(page));
};
