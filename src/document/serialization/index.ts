/**
 * Enhanced Document Serialization Service
 * Handles conversion between structured document model and various formats
 */

import { DocumentNode } from '../schema/types';
import { documentToHtml, htmlToDocument } from './html';
import { createEmptyDocument } from '../schema/factory';
import { validateDocument } from '../schema/validation';
import { getDocumentStats } from '../operations/analysis';

/**
 * Serialize document to JSON string
 */
export function serializeDocument(document: DocumentNode): string {
  try {
    // Validate document before serialization
    const validation = validateDocument(document);
    if (!validation.valid) {
      console.warn('Document validation failed:', validation.errors);
    }
    
    return JSON.stringify(document, null, 2);
  } catch (error) {
    console.error('Failed to serialize document:', error);
    throw new Error('Document serialization failed');
  }
}

/**
 * Deserialize document from JSON string
 */
export function deserializeDocument(jsonString: string): DocumentNode {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate document structure
    const validation = validateDocument(parsed);
    if (!validation.valid) {
      console.warn('Document validation failed:', validation.errors);
      // Return a basic valid document if validation fails
      return createEmptyDocument();
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to deserialize document:', error);
    throw new Error('Document deserialization failed');
  }
}

/**
 * Convert document to HTML
 */
export function documentToHtmlString(document: DocumentNode): string {
  try {
    return documentToHtml(document);
  } catch (error) {
    console.error('Failed to convert document to HTML:', error);
    return '<p>Error converting document to HTML</p>';
  }
}

/**
 * Convert HTML to document
 */
export function htmlStringToDocument(html: string): DocumentNode {
  try {
    return htmlToDocument(html);
  } catch (error) {
    console.error('Failed to convert HTML to document:', error);
    return createEmptyDocument();
  }
}

/**
 * Create empty document
 */
export function createEmptyDocumentNode(): DocumentNode {
  return createEmptyDocument();
}

/**
 * Get document statistics
 */
export function getDocumentStatistics(document: DocumentNode) {
  return getDocumentStats(document);
}

/**
 * Validate document
 */
export function validateDocumentStructure(document: DocumentNode) {
  return validateDocument(document);
}

/**
 * Export all serialization functions
 */
export * from './html';
export * from '../schema/factory';
export * from '../schema/validation';
export * from '../operations/analysis';
