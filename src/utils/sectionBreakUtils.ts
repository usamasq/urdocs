/**
 * Section Break Utilities
 * Provides section-based pagination support for different page layouts
 */

import { type DocumentNode } from '../document/schema/types';
import { createPageBreak } from '../document/schema/factory';

// Section break types
export type SectionBreakType = 'page' | 'column' | 'section' | 'continuous';
export type PageNumberingType = 'continuous' | 'restart' | 'restart-from-1';

// Section break interface
export interface SectionBreak {
  id: string;
  type: SectionBreakType;
  pageLayout: SectionPageLayout;
  pageNumbering: PageNumberingType;
  startPageNumber?: number;
  position: number;
  isManual: boolean;
}

// Section page layout
export interface SectionPageLayout {
  pageSize: 'A4' | 'Letter' | 'Custom';
  customWidth?: number;
  customHeight?: number;
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  columns: number;
  columnGap: number;
  headerFooter: {
    hasHeader: boolean;
    hasFooter: boolean;
    headerHeight: number;
    footerHeight: number;
  };
}

// Section break result
export interface SectionBreakResult {
  sections: SectionBreak[];
  totalPages: number;
  pageNumbering: Map<number, number>; // page index -> page number
  sectionBoundaries: number[];
}

/**
 * Create a section break node
 */
export function createSectionBreak(
  type: SectionBreakType = 'page',
  pageLayout?: Partial<SectionPageLayout>,
  pageNumbering: PageNumberingType = 'continuous',
  startPageNumber?: number
): DocumentNode {
  const sectionBreakAttrs = {
    sectionType: type,
    pageLayout: pageLayout || getDefaultSectionPageLayout(),
    pageNumbering,
    startPageNumber: startPageNumber || 1,
    isManual: true,
    breakType: 'section' as const
  };

  return {
    type: 'pageBreak',
    attrs: sectionBreakAttrs
  };
}

/**
 * Get default section page layout
 */
export function getDefaultSectionPageLayout(): SectionPageLayout {
  return {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    },
    columns: 1,
    columnGap: 12,
    headerFooter: {
      hasHeader: false,
      hasFooter: false,
      headerHeight: 0,
      footerHeight: 0
    }
  };
}

/**
 * Parse section breaks from document
 */
export function parseSectionBreaks(document: DocumentNode): SectionBreak[] {
  const sectionBreaks: SectionBreak[] = [];
  
  if (!document.content) {
    return sectionBreaks;
  }

  document.content.forEach((node, index) => {
    if (node.type === 'pageBreak' && node.attrs?.breakType === 'section') {
      sectionBreaks.push({
        id: `section-${index}`,
        type: node.attrs.sectionType || 'page',
        pageLayout: node.attrs.pageLayout || getDefaultSectionPageLayout(),
        pageNumbering: node.attrs.pageNumbering || 'continuous',
        startPageNumber: node.attrs.startPageNumber || 1,
        position: index,
        isManual: node.attrs.isManual || false
      });
    }
  });

  return sectionBreaks;
}

/**
 * Calculate section-based pagination
 */
export function calculateSectionPagination(
  document: DocumentNode,
  basePageDimensions: any
): SectionBreakResult {
  const sectionBreaks = parseSectionBreaks(document);
  const sections: SectionBreak[] = [];
  const pageNumbering = new Map<number, number>();
  const sectionBoundaries: number[] = [];
  
  let currentPageIndex = 0;
  let currentPageNumber = 1;
  let currentSectionStart = 0;

  // If no section breaks, treat entire document as one section
  if (sectionBreaks.length === 0) {
    const defaultSection: SectionBreak = {
      id: 'section-0',
      type: 'page',
      pageLayout: getDefaultSectionPageLayout(),
      pageNumbering: 'continuous',
      position: 0,
      isManual: false
    };
    
    sections.push(defaultSection);
    sectionBoundaries.push(0);
    
    // Calculate pages for the entire document
    const totalPages = calculatePagesForSection(document, defaultSection.pageLayout, basePageDimensions);
    for (let i = 0; i < totalPages; i++) {
      pageNumbering.set(currentPageIndex + i, currentPageNumber + i);
    }
    
    return {
      sections,
      totalPages,
      pageNumbering,
      sectionBoundaries
    };
  }

  // Process each section
  for (let i = 0; i < sectionBreaks.length; i++) {
    const sectionBreak = sectionBreaks[i];
    const nextSectionBreak = sectionBreaks[i + 1];
    
    // Calculate content for this section
    const sectionStart = currentSectionStart;
    const sectionEnd = nextSectionBreak ? nextSectionBreak.position : document.content!.length;
    const sectionContent = document.content!.slice(sectionStart, sectionEnd);
    
    // Create section document
    const sectionDocument: DocumentNode = {
      type: 'doc',
      content: sectionContent
    };
    
    // Calculate pages for this section
    const sectionPages = calculatePagesForSection(
      sectionDocument, 
      sectionBreak.pageLayout, 
      basePageDimensions
    );
    
    // Handle page numbering
    if (sectionBreak.pageNumbering === 'restart') {
      currentPageNumber = sectionBreak.startPageNumber || 1;
    } else if (sectionBreak.pageNumbering === 'restart-from-1') {
      currentPageNumber = 1;
    }
    
    // Set page numbers for this section
    for (let j = 0; j < sectionPages; j++) {
      pageNumbering.set(currentPageIndex + j, currentPageNumber + j);
    }
    
    sections.push(sectionBreak);
    sectionBoundaries.push(currentPageIndex);
    
    currentPageIndex += sectionPages;
    currentPageNumber += sectionPages;
    currentSectionStart = sectionEnd;
  }

  return {
    sections,
    totalPages: currentPageIndex,
    pageNumbering,
    sectionBoundaries
  };
}

/**
 * Calculate pages for a specific section
 */
function calculatePagesForSection(
  sectionDocument: DocumentNode,
  pageLayout: SectionPageLayout,
  basePageDimensions: any
): number {
  // This is a simplified calculation
  // In a full implementation, you would:
  // 1. Calculate content height based on page layout
  // 2. Account for margins, headers, footers
  // 3. Handle column layouts
  // 4. Consider font sizes and line heights
  
  const contentLength = getDocumentTextLength(sectionDocument);
  const averageCharsPerPage = 2000; // Rough estimate
  const pages = Math.ceil(contentLength / averageCharsPerPage);
  
  return Math.max(1, pages);
}

/**
 * Get text length from document
 */
function getDocumentTextLength(document: DocumentNode): number {
  let length = 0;
  
  if (document.text) {
    length += document.text.length;
  }
  
  if (document.content) {
    document.content.forEach(child => {
      length += getDocumentTextLength(child);
    });
  }
  
  return length;
}

/**
 * Insert section break at position
 */
export function insertSectionBreak(
  document: DocumentNode,
  position: number,
  sectionBreak: SectionBreak
): DocumentNode {
  const newContent = [...(document.content || [])];
  const sectionBreakNode = createSectionBreak(
    sectionBreak.type,
    sectionBreak.pageLayout,
    sectionBreak.pageNumbering,
    sectionBreak.startPageNumber
  );
  
  newContent.splice(position, 0, sectionBreakNode);
  
  return {
    ...document,
    content: newContent
  };
}

/**
 * Remove section break by ID
 */
export function removeSectionBreak(
  document: DocumentNode,
  sectionBreakId: string
): DocumentNode {
  const newContent = (document.content || []).filter((node, index) => {
    if (node.type === 'pageBreak' && node.attrs?.breakType === 'section') {
      return `section-${index}` !== sectionBreakId;
    }
    return true;
  });
  
  return {
    ...document,
    content: newContent
  };
}

/**
 * Update section break
 */
export function updateSectionBreak(
  document: DocumentNode,
  sectionBreakId: string,
  updates: Partial<SectionBreak>
): DocumentNode {
  const newContent = (document.content || []).map((node, index) => {
    if (node.type === 'pageBreak' && node.attrs?.breakType === 'section' && `section-${index}` === sectionBreakId) {
      return {
        ...node,
        attrs: {
          ...node.attrs,
          ...updates
        }
      };
    }
    return node;
  });
  
  return {
    ...document,
    content: newContent
  };
}

/**
 * Get section for a specific page
 */
export function getSectionForPage(
  sectionResult: SectionBreakResult,
  pageIndex: number
): SectionBreak | null {
  for (let i = sectionResult.sections.length - 1; i >= 0; i--) {
    const section = sectionResult.sections[i];
    const sectionStart = sectionResult.sectionBoundaries[i];
    const sectionEnd = i < sectionResult.sections.length - 1 
      ? sectionResult.sectionBoundaries[i + 1] 
      : sectionResult.totalPages;
    
    if (pageIndex >= sectionStart && pageIndex < sectionEnd) {
      return section;
    }
  }
  
  return null;
}

/**
 * Get page number for a specific page index
 */
export function getPageNumber(
  sectionResult: SectionBreakResult,
  pageIndex: number
): number {
  return sectionResult.pageNumbering.get(pageIndex) || pageIndex + 1;
}

/**
 * Validate section break consistency
 */
export function validateSectionBreaks(document: DocumentNode): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const sectionBreaks = parseSectionBreaks(document);
  
  // Check for duplicate section breaks at same position
  const positions = sectionBreaks.map(sb => sb.position);
  const duplicates = positions.filter((pos, index) => positions.indexOf(pos) !== index);
  
  if (duplicates.length > 0) {
    issues.push(`Duplicate section breaks at positions: ${duplicates.join(', ')}`);
  }
  
  // Check for invalid page numbering
  sectionBreaks.forEach((sectionBreak, index) => {
    if (sectionBreak.pageNumbering === 'restart' && !sectionBreak.startPageNumber) {
      issues.push(`Section break ${index} has restart numbering but no start page number`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
