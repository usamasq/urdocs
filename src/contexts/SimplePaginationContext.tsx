/**
 * Simple Pagination Context
 * Provides basic pagination with performance improvements
 * No external dependencies on enhanced features
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { type OverflowInfo } from '../utils/pageBreakUtils';
import { type Page, type DocumentNode } from '../document/schema/types';
import { 
  serializeDocument,
  deserializeDocument,
  documentToHtmlString,
  htmlStringToDocument,
  createEmptyDocumentNode
} from '../document/serialization';
import { 
  getPageBreakPositions,
  splitDocumentIntoPages,
  createPageBreak,
  createEmptyDocument,
  createDocumentFromText
} from '../document/schema/factory';
// Import removed - using local implementations for overflow detection

// Local implementations for overflow detection
const detectUnifiedOverflow = (editorElement: HTMLElement, document: DocumentNode, pageDimensions: any, existingPageBreaks: any[]) => {
  try {
    if (!editorElement || !pageDimensions) {
      console.warn('[SimplePaginationContext] Invalid parameters for overflow detection');
      return {
        isOverflowing: false,
        pageCount: 1,
        overflowAmount: 0,
        shouldCreatePageBreaks: false,
        newPageBreaks: []
      };
    }

    // Get actual content height within margins
    const contentHeight = editorElement.scrollHeight;
    const pageHeight = pageDimensions.height;
    const marginTop = pageDimensions.marginTop || 0;
    const marginBottom = pageDimensions.marginBottom || 0;
    
    // Calculate available content height (page height minus margins)
    const availableHeight = pageHeight - marginTop - marginBottom;
    
    // Validate dimensions
    if (isNaN(contentHeight) || isNaN(availableHeight) || availableHeight <= 0) {
      console.warn('[SimplePaginationContext] Invalid dimensions for overflow detection:', {
        contentHeight,
        pageHeight,
        marginTop,
        marginBottom,
        availableHeight
      });
      return {
        isOverflowing: false,
        pageCount: 1,
        overflowAmount: 0,
        shouldCreatePageBreaks: false,
        newPageBreaks: []
      };
    }
    
    const isOverflowing = contentHeight > availableHeight;
    const pageCount = Math.max(1, Math.ceil(contentHeight / availableHeight));
    const overflowAmount = isOverflowing ? contentHeight - availableHeight : 0;
    
    // Determine if we need to create page breaks
    const existingPageBreakCount = existingPageBreaks?.length || 0;
    const shouldCreatePageBreaks = isOverflowing && pageCount > (existingPageBreakCount + 1);
    
    return {
      isOverflowing,
      pageCount,
      overflowAmount,
      shouldCreatePageBreaks,
      newPageBreaks: shouldCreatePageBreaks ? [{ position: Math.floor(contentHeight / 2) }] : []
    };
  } catch (error) {
    console.error('[SimplePaginationContext] Error in overflow detection:', error);
    return {
      isOverflowing: false,
      pageCount: 1,
      overflowAmount: 0,
      shouldCreatePageBreaks: false,
      newPageBreaks: []
    };
  }
};

const insertPageBreaksIntoDocument = (document: DocumentNode, pageBreaks: any[]) => {
  // Simple page break insertion
  return document; // Return unchanged for now
};

const syncDocumentWithOverflow = (document: DocumentNode, overflowInfo: any) => {
  // Simple sync - return document unchanged
  return document;
};

const needsPageBreakUpdate = (document: DocumentNode, overflowInfo: any) => {
  // Simple check - always return true to allow updates
  return true;
};

const getDocumentPageCount = (document: DocumentNode) => {
  // Count existing page breaks + 1
  const pageBreakCount = document.content?.filter(node => node.type === 'pageBreak').length || 0;
  return pageBreakCount + 1;
};

const validatePageBreakConsistency = (document: DocumentNode) => {
  // Simple validation - always return true
  return true;
};

interface OverflowStatus {
  isOverflowing: boolean;
  overflowAmount: number;
  breakPoint?: number;
}

interface PageLayout {
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
  showMarginGuides: boolean;
}

interface SimplePaginationContextType {
  // Unified document management
  document: DocumentNode;
  currentPage: number;
  totalPages: number;
  
  // Document operations
  updateDocument: (document: DocumentNode) => void;
  getDocument: () => DocumentNode;
  serializeDocument: () => string;
  deserializeDocument: (jsonString: string) => void;
  
  // TipTap integration
  convertProseMirrorToJson: (proseMirrorDoc: any) => DocumentNode;
  convertJsonToProseMirror: (jsonDoc: DocumentNode) => any;
  updateFromTipTap: (proseMirrorDoc: any) => void;
  getDocumentAsHtml: () => string;
  updateFromHtml: (html: string) => void;
  
  // Page view operations
  getPages: () => Page[];
  getCurrentPageContent: () => DocumentNode;
  getPageContent: (pageIndex: number) => DocumentNode;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  
  // Page break management
  insertPageBreak: (position: number) => void;
  removePageBreak: (pageBreakId: string) => void;
  getPageBreakPositions: () => number[];
  
  // Content operations
  addContent: (content: DocumentNode) => void;
  removeContent: (position: number) => void;
  updateContent: (position: number, content: DocumentNode) => void;
  
  // Automatic page break management
  handleContentOverflow: (overflowInfo: any, pageLayout?: PageLayout) => void;
  
  // Initialization
  initializeWithDefaultContent: () => void;

  // Simple performance features
  isUpdating: boolean;
  lastUpdateTime: number;
  updateCount: number;
}

const SimplePaginationContext = createContext<SimplePaginationContextType | undefined>(undefined);

// Simple debounce function
const createSimpleDebounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const SimplePaginationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with empty document
  const [document, setDocument] = useState<DocumentNode>(createEmptyDocumentNode());
  const [currentPage, setCurrentPage] = useState(0);
  
  // Simple performance state
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);

  // Calculate total pages based on page breaks in the document
  const totalPages = useMemo(() => {
    const pageBreaks = getPageBreakPositions(document);
    console.log('[SimplePaginationContext] Calculating totalPages:', {
      pageBreakCount: pageBreaks.length,
      totalPages: pageBreaks.length + 1,
      documentContentLength: document.content?.length || 0
    });
    return pageBreaks.length + 1;
  }, [document]);

  // Document operations
  const updateDocument = useCallback((newDocument: DocumentNode) => {
    setDocument(newDocument);
    setLastUpdateTime(Date.now());
    setUpdateCount(prev => prev + 1);
  }, []);

  const getDocument = useCallback(() => {
    return document;
  }, [document]);

  const serializeDocumentContext = useCallback(() => {
    return serializeDocument(document);
  }, [document]);

  const deserializeDocumentContext = useCallback((jsonString: string) => {
    try {
      const newDocument = deserializeDocument(jsonString);
      setDocument(newDocument);
    } catch (error) {
      console.error('Failed to deserialize document:', error);
    }
  }, []);

  // TipTap integration methods
  const convertProseMirrorToJson = useCallback((proseMirrorDoc: any): DocumentNode => {
    const convertNode = (node: any): DocumentNode => {
      const result: DocumentNode = {
        type: node.type.name,
        attrs: node.attrs || {}
      };
      
      if (node.textContent) {
        // Filter out console error messages and debug output
        const text = node.textContent;
        const isConsoleOutput = text.includes('Error: Can\'t find the actor ID') ||
                               text.includes('[MultiPageEditor]') ||
                               text.includes('[SimplePaginationContext]') ||
                               text.includes('calculateContentHeight:') ||
                               text.includes('pageBreakUtils.ts:') ||
                               text.includes('MultiPageEditor.tsx:');
        
        if (!isConsoleOutput && text.trim().length > 0) {
          result.text = text;
        }
      }
      
      if (node.content && node.content.size > 0) {
        result.content = [];
        node.content.forEach((child: any) => {
          const convertedChild = convertNode(child);
          // Only add nodes that have meaningful content
          if (convertedChild.text || convertedChild.content || convertedChild.type === 'pageBreak') {
            result.content!.push(convertedChild);
          }
        });
      }
      
      if (node.marks && node.marks.length > 0) {
        result.marks = node.marks.map((mark: any) => ({
          type: mark.type.name,
          attrs: mark.attrs || {}
        }));
      }
      
      return result;
    };
    
    return convertNode(proseMirrorDoc);
  }, []);

  const convertJsonToProseMirror = useCallback((jsonDoc: DocumentNode): any => {
    return documentToHtmlString(jsonDoc);
  }, []);

  const updateFromTipTap = useCallback((proseMirrorDoc: any) => {
    try {
      const jsonDocument = convertProseMirrorToJson(proseMirrorDoc);
      console.log('[SimplePaginationContext] updateFromTipTap - Document updated:', {
        contentLength: jsonDocument.content?.length || 0,
        pageBreakCount: jsonDocument.content?.filter(node => node.type === 'pageBreak').length || 0,
        hasTextContent: jsonDocument.content?.some(node => 
          node.type === 'paragraph' && node.content && node.content.some(textNode => 
            textNode.type === 'text' && textNode.text && textNode.text.trim().length > 0
          )
        ) || false
      });
      
      // FIXED: Only update if document actually has meaningful content
      if (jsonDocument.content && jsonDocument.content.length > 0) {
        setDocument(jsonDocument);
        setLastUpdateTime(Date.now());
        setUpdateCount(prev => prev + 1);
      } else {
        console.log('[SimplePaginationContext] Skipping update - no meaningful content');
      }
    } catch (error) {
      console.error('Failed to update document from TipTap:', error);
    }
  }, [convertProseMirrorToJson]);

  const getDocumentAsHtml = useCallback(() => {
    return documentToHtmlString(document);
  }, [document]);

  const updateFromHtml = useCallback((html: string) => {
    try {
      const jsonDocument = htmlStringToDocument(html);
      setDocument(jsonDocument);
    } catch (error) {
      console.error('Failed to update document from HTML:', error);
    }
  }, []);

  // Initialize with default content
  const initializeWithDefaultContent = useCallback(() => {
    const defaultText = `اردو میں خوش آمدید

یہ ایک جدید اردو ایڈیٹر ہے جو نستعلیق فونٹ میں تحریر کی سہولت فراہم کرتا ہے۔

آپ یہاں اردو میں تحریر کر سکتے ہیں۔

**مختلف کی بورڈ لے آؤٹ** استعمال کریں: *Phonetic*، _InPage_، یا CRULP

اب آپ **موٹے**، *ترچھے*، اور _خط کشیدہ_ متن لکھ سکتے ہیں!`;
    
    const defaultDocument = createDocumentFromText(defaultText);
    setDocument(defaultDocument);
  }, []);

  // Page view operations
  const getPages = useCallback((): Page[] => {
    const pages = splitDocumentIntoPages(document);
    return pages.map((pageContent, index) => ({
      id: `page-${index + 1}`,
      content: pageContent,
      height: 0
    }));
  }, [document]);

  const getCurrentPageContent = useCallback((): DocumentNode => {
    const pages = splitDocumentIntoPages(document);
    return pages[currentPage] || createEmptyDocument();
  }, [document, currentPage]);

  const getPageContent = useCallback((pageIndex: number): DocumentNode => {
    const pages = splitDocumentIntoPages(document);
    return pages[pageIndex] || createEmptyDocument();
  }, [document]);

  const setCurrentPageContext = useCallback((page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const canGoNext = currentPage < totalPages - 1;
  const canGoPrev = currentPage > 0;

  // Page break management
  const insertPageBreakContext = useCallback((position: number) => {
    const pageBreak = createPageBreak(totalPages + 1, false);
    const newContent = [...(document.content || [])];
    newContent.splice(position, 0, pageBreak);
    setDocument({ ...document, content: newContent });
  }, [document, totalPages]);

  const removePageBreakContext = useCallback((pageBreakId: string) => {
    const newContent = (document.content || []).filter(node => 
      !(node.type === 'pageBreak' && node.attrs?.id === pageBreakId)
    );
    setDocument({ ...document, content: newContent });
  }, [document]);

  const getPageBreakPositionsContext = useCallback(() => {
    return getPageBreakPositions(document);
  }, [document]);

  // Content operations
  const addContent = useCallback((content: DocumentNode) => {
    const newDocument = {
      ...document,
      content: [...(document.content || []), content]
    };
    setDocument(newDocument);
  }, [document]);

  const removeContent = useCallback((position: number) => {
    if (!document.content || position < 0 || position >= document.content.length) return;
    
    const newContent = [...document.content];
    newContent.splice(position, 1);
    
    const newDocument = {
      ...document,
      content: newContent
    };
    setDocument(newDocument);
  }, [document]);

  const updateContent = useCallback((position: number, content: DocumentNode) => {
    if (!document.content || position < 0 || position >= document.content.length) return;
    
    const newContent = [...document.content];
    newContent[position] = content;
    
    const newDocument = {
      ...document,
      content: newContent
    };
    setDocument(newDocument);
  }, [document]);

  // Enhanced automatic page break management with debouncing
  const handleContentOverflow = useCallback((overflowInfo: any, pageLayout?: PageLayout) => {
    console.log('[SimplePaginationContext] handleContentOverflow called with:', overflowInfo);
    
    if (!overflowInfo.isOverflowing) {
      console.log('[SimplePaginationContext] Not overflowing, skipping');
      return;
    }
    
    // Prevent infinite loops by checking if we're already updating
    if (isUpdating) {
      console.log('[SimplePaginationContext] Already updating, skipping overflow handling');
      return;
    }
    
    // Allow creating additional page breaks when content continues to grow
    const pageBreakCount = document.content?.filter(node => node.type === 'pageBreak').length || 0;
    const currentPageCount = pageBreakCount + 1;
    
    // Only skip if we already have enough pages for the current content
    if (currentPageCount >= overflowInfo.pageCount) {
      console.log('[SimplePaginationContext] Sufficient page breaks exist', {
        currentPages: currentPageCount,
        neededPages: overflowInfo.pageCount
      });
      return;
    }
    
    setIsUpdating(true);
    
    // Check if document needs page break updates
    if (!needsPageBreakUpdate(document, overflowInfo)) {
      setIsUpdating(false);
      return;
    }
    
    // Get current page break positions in the document
    const existingPageBreaks = getPageBreakPositions(document);
    
    // If no pageBreakPositions provided, create a simple page break in the middle of content
    if (!overflowInfo.pageBreakPositions || overflowInfo.pageBreakPositions.length === 0) {
      console.log('[SimplePaginationContext] No pageBreakPositions provided, creating simple page break');
      
      // Create a simple page break at the middle of the content
      const contentLength = document.content?.length || 0;
      if (contentLength > 1) {
        const pageBreakPosition = Math.floor(contentLength / 2);
        const pageBreak = createPageBreak(2, false);
        const newContent = [...(document.content || [])];
        newContent.splice(pageBreakPosition, 0, pageBreak);
        
        const newDocument = {
          ...document,
          content: newContent
        };
        
        console.log('[SimplePaginationContext] Created simple page break at position:', pageBreakPosition);
        setDocument(newDocument);
        
        // The editor will be updated through the normal document change flow
        
        setIsUpdating(false);
        return;
      }
    }
    
    // Use the unified overflow detection system
    const editorElement = window.document.querySelector('.ProseMirror') as HTMLElement;
    if (!editorElement) {
      console.warn('Editor element not found for overflow detection');
      setIsUpdating(false);
      return;
    }
    
    // Create page dimensions for overflow detection
    let pageDimensions;
    if (pageLayout) {
      import('../utils/dimensionUtils').then(({ getPageDimensions }) => {
        const dimensions = getPageDimensions(
          pageLayout.pageSize || 'A4',
          pageLayout.customWidth,
          pageLayout.customHeight,
          pageLayout.orientation || 'portrait'
        );
        
        const marginTop = pageLayout.margins.top * 3.7795275591;
        const marginBottom = pageLayout.margins.bottom * 3.7795275591;
        const marginLeft = pageLayout.margins.left * 3.7795275591;
        const marginRight = pageLayout.margins.right * 3.7795275591;
        
        pageDimensions = {
          width: dimensions.width,
          height: dimensions.height,
          marginTop,
          marginBottom,
          marginLeft,
          marginRight
        };
        
        // Detect overflow and get page breaks to create
        const overflowResult = detectUnifiedOverflow(editorElement, document, pageDimensions, existingPageBreaks);
        console.log('[SimplePaginationContext] Overflow detection result:', overflowResult);
        
        if (overflowResult.shouldCreatePageBreaks && overflowResult.newPageBreaks.length > 0) {
          // Create a simple page break in the middle of the content
          console.log('[SimplePaginationContext] Creating simple page break...');
          
          // Get current content
          const currentContent = document.content || [];
          
          console.log('[SimplePaginationContext] Original content before page break:', currentContent);
          
          // Create a simple page break node
          const pageBreakNode = {
            type: 'pageBreak',
            attrs: {
              pageNumber: 2,
              isManual: true,
              breakType: 'page'
            }
          };
          
          // Insert page break at the optimal position to split content
          // Use a more intelligent approach based on content length and page breaks needed
          const pagesNeeded = Math.max(2, overflowInfo.pageCount);
          const contentPerPage = Math.ceil(currentContent.length / pagesNeeded);
          
          // Find the best position that doesn't split paragraphs in the middle
          let insertIndex = Math.max(1, contentPerPage);
          
          // Try to find a paragraph boundary near the calculated position
          for (let i = insertIndex; i < currentContent.length && i < insertIndex + 3; i++) {
            const node = currentContent[i];
            if (node.type === 'paragraph' || node.type === 'heading') {
              insertIndex = i + 1; // Insert after the paragraph
              break;
            }
          }
          
          const newContent = [
            ...currentContent.slice(0, insertIndex),
            pageBreakNode,
            ...currentContent.slice(insertIndex)
          ];
          
          console.log('[SimplePaginationContext] New content after page break:', newContent);
          
          const updatedDocument = {
            ...document,
            content: newContent
          };
          
          console.log('[SimplePaginationContext] Updated document with simple page break:', updatedDocument);
          
          // Convert to HTML to see what the editor will receive
          import('../document/serialization').then(({ documentToHtmlString }) => {
            const htmlContent = documentToHtmlString(updatedDocument);
            console.log('[SimplePaginationContext] Document as HTML:', htmlContent);
          });
          
          setDocument(updatedDocument);
          
          console.log(`Created ${overflowResult.newPageBreaks.length} new page breaks with custom margins`);
        } else {
          console.log('[SimplePaginationContext] No page breaks to create:', {
            shouldCreatePageBreaks: overflowResult.shouldCreatePageBreaks,
            newPageBreaksLength: overflowResult.newPageBreaks?.length || 0
          });
        }
        
        setIsUpdating(false);
      });
    } else {
      // Use default A4 dimensions with standard margins
      pageDimensions = {
        width: 794,
        height: 1123,
        marginTop: 75.6,
        marginBottom: 75.6,
        marginLeft: 75.6,
        marginRight: 75.6
      };
      
      // Detect overflow and get page breaks to create
      const overflowResult = detectUnifiedOverflow(editorElement, document, pageDimensions, existingPageBreaks);
      
      if (overflowResult.shouldCreatePageBreaks && overflowResult.newPageBreaks.length > 0) {
        // Create a simple page break in the middle of the content
        console.log('[SimplePaginationContext] Creating simple page break (fallback)...');
        
        // Get current content
        const currentContent = document.content || [];
        
        console.log('[SimplePaginationContext] Original content before page break (fallback):', currentContent);
        
        // Create a simple page break node
        const pageBreakNode = {
          type: 'pageBreak',
          attrs: {
            pageNumber: 2,
            isManual: true,
            breakType: 'page'
          }
        };
        
        // Insert page break at the optimal position to split content
        // Use a more intelligent approach based on content length and page breaks needed
        const pagesNeeded = Math.max(2, overflowInfo.pageCount);
        const contentPerPage = Math.ceil(currentContent.length / pagesNeeded);
        
        // Find the best position that doesn't split paragraphs in the middle
        let insertIndex = Math.max(1, contentPerPage);
        
        // Try to find a paragraph boundary near the calculated position
        for (let i = insertIndex; i < currentContent.length && i < insertIndex + 3; i++) {
          const node = currentContent[i];
          if (node.type === 'paragraph' || node.type === 'heading') {
            insertIndex = i + 1; // Insert after the paragraph
            break;
          }
        }
        
        const newContent = [
          ...currentContent.slice(0, insertIndex),
          pageBreakNode,
          ...currentContent.slice(insertIndex)
        ];
        
        console.log('[SimplePaginationContext] New content after page break (fallback):', newContent);
        
        const updatedDocument = {
          ...document,
          content: newContent
        };
        
        setDocument(updatedDocument);
        
        console.log(`Created ${overflowResult.newPageBreaks.length} new page breaks with default margins`);
      }
      
      setIsUpdating(false);
    }
  }, [document, totalPages, getPageBreakPositions]);

  return (
    <SimplePaginationContext.Provider value={{
      // Unified document management
      document,
      currentPage,
      totalPages,
      
      // Document operations
      updateDocument,
      getDocument,
      serializeDocument: serializeDocumentContext,
      deserializeDocument: deserializeDocumentContext,
      
      // TipTap integration
      convertProseMirrorToJson,
      convertJsonToProseMirror,
      updateFromTipTap,
      getDocumentAsHtml,
      updateFromHtml,
      
      // Page view operations
      getPages,
      getCurrentPageContent,
      getPageContent,
      setCurrentPage: setCurrentPageContext,
      nextPage,
      prevPage,
      canGoNext,
      canGoPrev,
      
      // Page break management
      insertPageBreak: insertPageBreakContext,
      removePageBreak: removePageBreakContext,
      getPageBreakPositions: getPageBreakPositionsContext,
      
      // Content operations
      addContent,
      removeContent,
      updateContent,
      
      // Automatic page break management
      handleContentOverflow,
      
      // Initialization
      initializeWithDefaultContent,

      // Simple performance features
      isUpdating,
      lastUpdateTime,
      updateCount
    }}>
      {children}
    </SimplePaginationContext.Provider>
  );
};

export const useSimplePagination = () => {
  const context = useContext(SimplePaginationContext);
  if (context === undefined) {
    throw new Error('useSimplePagination must be used within a SimplePaginationProvider');
  }
  return context;
};

// Backward compatibility - export the original hook as well
export const usePagination = useSimplePagination;
