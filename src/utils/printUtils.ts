/**
 * Utility functions for print and PDF export functionality
 */

import { findOptimalTextBreakPoint, findLineEndPosition, findCompleteLineBoundary } from './pageBreakUtils';

// Local function to find the next complete element boundary to avoid splitting content
const findNextElementBoundary = (
  editorElement: HTMLElement,
  targetPosition: number,
  searchRange: number = 150
): number => {
  if (!editorElement) return targetPosition;

  // Get all block-level elements that should not be split
  const blockElements = editorElement.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, blockquote, hr, pre, table');
  
  let nextBoundary = targetPosition;
  let minDistance = Infinity;

  for (const element of blockElements) {
    const rect = element.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const elementTop = rect.top - editorRect.top;
    const elementBottom = rect.bottom - editorRect.top;

    // Check if this element starts after our target position
    if (elementTop > targetPosition && elementTop <= targetPosition + searchRange) {
      const distance = elementTop - targetPosition;
      if (distance < minDistance) {
        minDistance = distance;
        nextBoundary = elementTop;
      }
    }
  }

  return nextBoundary;
};


export interface PrintOptions {
  pageSize?: 'A4' | 'Letter' | 'Custom';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  scale?: number;
}

export const defaultPrintOptions: PrintOptions = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  },
  scale: 1
};

/**
 * Prepare the document for printing by applying print-specific styles
 */
export const prepareForPrint = (options: PrintOptions = defaultPrintOptions) => {
  const body = document.body;
  
  // Add print class to body
  body.classList.add('pdf-export');
  
  // Apply print-specific styles
  const style = document.createElement('style');
  style.id = 'print-styles';
  style.textContent = `
    /* Global print styles - applied immediately */
    .print-hidden {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
    }
    
    div[class*="page-break"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
    }
    
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      
      /* Hide navigation and UI elements */
      .navigation-panel,
      .toolbar,
      .ruler-system,
      .debug-info,
      button,
      .btn,
      .page-break-indicators,
      .page-break-line,
      .page-break-label,
      .page-number,
      .overflow-indicator,
      .overflow-indicator-container,
      .overflow-warning-badge,
      .current-page-indicator,
      .margin-handle,
      .horizontal-ruler,
      .vertical-ruler,
      .ruler-system {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
      
      /* Force hide page break elements with inline styles */
      div[class*="page-break"],
      .print-hidden {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
      
      /* Legacy support for old components */
      .doc-page,
      .multi-page-editor {
        width: ${options.pageSize === 'Letter' ? '216mm' : '210mm'} !important;
        height: ${options.pageSize === 'Letter' ? '279mm' : '297mm'} !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        page-break-after: always;
        transform: scale(${options.scale || 1}) !important;
        transform-origin: top left !important;
      }
      
      .doc-page:last-child,
      .multi-page-editor:last-child {
        page-break-after: auto;
      }
      
      /* New DynamicPageEditor print styles */
      .document-container {
        width: ${options.pageSize === 'Letter' ? '216mm' : '210mm'} !important;
        height: ${options.pageSize === 'Letter' ? '279mm' : '297mm'} !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        page-break-after: always;
        transform: scale(${options.scale || 1}) !important;
        transform-origin: top left !important;
        overflow: visible !important;
        position: relative !important;
      }
      
      .document-container:last-child {
        page-break-after: auto;
      }
      
      /* Print page breaks for DynamicPageEditor */
      .print-page-break {
        page-break-before: always;
        break-before: page;
        height: 0;
        margin: 0;
        padding: 0;
        border: none;
        display: block;
      }
      
      .print-page-break:first-child {
        page-break-before: auto;
        break-before: auto;
      }
      
      .editor-content {
        padding: ${options.margins?.top || 20}mm ${options.margins?.right || 20}mm ${options.margins?.bottom || 20}mm ${options.margins?.left || 20}mm !important;
        height: 100% !important;
        overflow: visible !important;
      }
      
      /* Ensure content flows properly */
      .ProseMirror {
        height: auto !important;
        overflow: visible !important;
      }
    }
  `;
  
  document.head.appendChild(style);
  
  return () => {
    // Cleanup function
    body.classList.remove('pdf-export');
    const existingStyle = document.getElementById('print-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
  };
};

/**
 * Print the current document
 */
export const printDocument = (options: PrintOptions = defaultPrintOptions) => {
  const cleanup = prepareForPrint(options);
  
  // Small delay to ensure styles are applied
  setTimeout(() => {
    window.print();
    
    // Cleanup after printing
    setTimeout(cleanup, 1000);
  }, 100);
};

/**
 * Export to PDF using browser's print to PDF functionality
 */
export const exportToPDF = (filename: string = 'document.pdf', options: PrintOptions = defaultPrintOptions) => {
  const cleanup = prepareForPrint(options);
  
  // Small delay to ensure styles are applied
  setTimeout(() => {
    // Trigger print dialog with PDF option
    window.print();
    
    // Cleanup after printing
    setTimeout(cleanup, 1000);
  }, 100);
};

/**
 * Get page dimensions in pixels for a given page size and orientation
 */
export const getPageDimensions = (pageSize: string, orientation: string, zoomLevel: number = 1) => {
  const mmToPx = 3.7795275591; // 1mm = 3.7795275591px at 96 DPI
  
  let width = 210; // A4 default
  let height = 297;
  
  if (pageSize === 'Letter') {
    width = 216;
    height = 279;
  }
  
  if (orientation === 'landscape') {
    [width, height] = [height, width];
  }
  
  return {
    width: width * mmToPx * zoomLevel,
    height: height * mmToPx * zoomLevel
  };
};

/**
 * Calculate optimal page count based on content height
 */
export const calculateOptimalPageCount = (
  contentHeight: number, 
  pageHeight: number, 
  margins: { top: number; bottom: number }
) => {
  const availableHeight = pageHeight - (margins.top + margins.bottom);
  return Math.max(1, Math.ceil(contentHeight / availableHeight));
};

/**
 * Check if content overflows a page
 */
export const checkContentOverflow = (
  contentHeight: number,
  pageHeight: number,
  margins: { top: number; bottom: number }
) => {
  const availableHeight = pageHeight - (margins.top + margins.bottom);
  return {
    isOverflowing: contentHeight > availableHeight,
    overflowAmount: Math.max(0, contentHeight - availableHeight),
    availableHeight
  };
};

/**
 * Create separate pages for print preview from DynamicPageEditor content
 */
export const createPrintPages = (
  contentElement: HTMLElement,
  pageBreakPositions: number[],
  pageHeight: number,
  margins: { top: number; bottom: number; left: number; right: number },
  pageSize: 'A4' | 'Letter' = 'A4'
) => {
  if (!contentElement) {
    console.warn('createPrintPages: No content element provided');
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('createPrintPages:', {
      contentElement: !!contentElement,
      pageBreakPositions,
      pageHeight,
      margins,
      pageSize,
      contentHeight: contentElement.scrollHeight
    });
  }

  // Create a container for print pages
  const printContainer = document.createElement('div');
  printContainer.className = 'print-pages-container';
  printContainer.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
    z-index: -1;
  `;

  // Get page dimensions
  const mmToPx = 3.7795275591;
  const pageWidth = pageSize === 'Letter' ? 216 : 210;
  const pageHeightMm = pageSize === 'Letter' ? 279 : 297;
  
  const pageWidthPx = pageWidth * mmToPx;
  const pageHeightPx = pageHeightMm * mmToPx;

  // Calculate available content height per page (excluding margins)
  const marginTopPx = margins.top * mmToPx;
  const marginBottomPx = margins.bottom * mmToPx;
  const availableContentHeight = pageHeightPx - marginTopPx - marginBottomPx;

  // Calculate total content height
  const totalContentHeight = contentElement.scrollHeight;
  
  // Calculate how many pages we actually need based on content height
  const calculatedPageCount = Math.max(1, Math.ceil(totalContentHeight / availableContentHeight));
  
  // Use the maximum of calculated pages and provided page break positions
  const totalPages = Math.max(calculatedPageCount, pageBreakPositions.length + 1);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating print pages:', { 
      totalPages, 
      pageBreakPositions, 
      totalContentHeight, 
      availableContentHeight,
      calculatedPageCount 
    });
  }
  
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const pageElement = document.createElement('div');
    pageElement.className = 'document-container print-page';
    
    // Get the original document container to copy its styles
    const originalContainer = document.querySelector('.document-container') as HTMLElement;
    if (originalContainer) {
      // Copy all computed styles from the original container
      const originalStyles = window.getComputedStyle(originalContainer);
      for (let i = 0; i < originalStyles.length; i++) {
        const property = originalStyles[i];
        const value = originalStyles.getPropertyValue(property);
        if (value && value !== 'none' && value !== 'auto') {
          pageElement.style.setProperty(property, value);
        }
      }
    }
    
    // Override only the necessary properties for print
    pageElement.style.cssText += `
      width: ${pageWidthPx}px !important;
      height: ${pageHeightPx}px !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      background: white !important;
      position: relative !important;
      page-break-after: ${pageIndex < totalPages - 1 ? 'always' : 'auto'} !important;
      overflow: hidden !important;
    `;

    // Create content area for this page
    const contentArea = document.createElement('div');
    contentArea.className = 'editor-content print-content';
    
    // Get the original editor content to copy its styles
    const originalContent = document.querySelector('.editor-content') as HTMLElement;
    if (originalContent) {
      // Copy all computed styles from the original content
      const originalStyles = window.getComputedStyle(originalContent);
      for (let i = 0; i < originalStyles.length; i++) {
        const property = originalStyles[i];
        const value = originalStyles.getPropertyValue(property);
        if (value && value !== 'none' && value !== 'auto') {
          contentArea.style.setProperty(property, value);
        }
      }
    }
    
    // Convert margins from mm to pixels for consistent rendering
    const mmToPx = 3.7795275591;
    const marginTopPx = margins.top * mmToPx;
    const marginRightPx = margins.right * mmToPx;
    const marginBottomPx = margins.bottom * mmToPx;
    const marginLeftPx = margins.left * mmToPx;
    
    // Override only the necessary properties for print
    contentArea.style.cssText += `
      width: 100% !important;
      height: 100% !important;
      padding: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      position: relative !important;
    `;

    // Clone the original content with all styles preserved
    let clonedContent = contentElement.cloneNode(true) as HTMLElement;
    
    // Remove UI elements from cloned content
    const uiElementsToRemove = [
      '.page-break-indicators',
      '.page-break-line', 
      '.page-break-label',
      '.page-number',
      '.overflow-indicator',
      '.overflow-indicator-container',
      '.overflow-warning-badge',
      '.current-page-indicator',
      '.margin-handle',
      '.horizontal-ruler',
      '.vertical-ruler',
      '.ruler-system',
      '.print-hidden'
    ];
    
    uiElementsToRemove.forEach(selector => {
      const elements = clonedContent.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    });
    
    // Also remove any elements with page-break in their class name
    const pageBreakElements = clonedContent.querySelectorAll('[class*="page-break"]');
    pageBreakElements.forEach(element => element.remove());
    
    // Remove any elements with inline styles that might be page break indicators
    const allElements = clonedContent.querySelectorAll('*');
    allElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      if (htmlElement.style) {
        const style = htmlElement.style;
        // Check for page break indicator styles
        if (style.background && style.background.includes('linear-gradient') && 
            (style.background.includes('ef4444') || style.background.includes('dc2626') || 
             style.background.includes('3b82f6') || style.background.includes('2563eb'))) {
          element.remove();
        }
      }
    });
    
    // Copy all computed styles from the original element
    const originalStyles = window.getComputedStyle(contentElement);
    
    // Apply all original styles to the cloned content
    for (let i = 0; i < originalStyles.length; i++) {
      const property = originalStyles[i];
      const value = originalStyles.getPropertyValue(property);
      if (value && value !== 'none' && value !== 'auto') {
        clonedContent.style.setProperty(property, value);
      }
    }
    
  // Calculate content positioning for this page with smart text-aware breaks
  let startPosition = 0;
  let endPosition = totalContentHeight;
  
  if (totalPages > 1) {
    // Multi-page document - calculate positions based on available height
    startPosition = pageIndex * availableContentHeight;
    endPosition = Math.min((pageIndex + 1) * availableContentHeight, totalContentHeight);
    
    // If we have specific page break positions, use them EXACTLY as they are
    // This ensures print preview matches editor indicators perfectly
    if (pageBreakPositions.length > 0) {
      if (pageIndex === 0) {
        startPosition = 0;
        endPosition = pageBreakPositions[0];
      } else if (pageIndex < pageBreakPositions.length) {
        startPosition = pageBreakPositions[pageIndex - 1];
        endPosition = pageBreakPositions[pageIndex];
      } else {
        startPosition = pageBreakPositions[pageBreakPositions.length - 1];
        endPosition = totalContentHeight;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Print Page ${pageIndex}] Using exact page break positions:`, {
          startPosition,
          endPosition,
          pageBreakPositions
        });
      }
    } else {
      // Apply smart text-aware breaks even when no explicit page breaks are provided
      const rawStartPosition = pageIndex * availableContentHeight;
      const rawEndPosition = Math.min((pageIndex + 1) * availableContentHeight, totalContentHeight);
      
      // Find optimal break points for both start and end positions
      startPosition = findOptimalTextBreakPoint(contentElement, rawStartPosition, 100);
      endPosition = findOptimalTextBreakPoint(contentElement, rawEndPosition, 100);
      
      // For the end position, be more aggressive about pushing content to next page
      // Find the end of the complete line to avoid splitting lines
      const lineEndPosition = findCompleteLineBoundary(contentElement, endPosition, 100);
      if (lineEndPosition > endPosition && lineEndPosition <= rawEndPosition + 150) {
        endPosition = lineEndPosition;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Print Page ${pageIndex}] Pushed line to next page:`, {
            originalEnd: rawEndPosition,
            lineEnd: lineEndPosition,
            adjustment: lineEndPosition - rawEndPosition
          });
        }
      }
      
      // Additional safety check: if the end position is very close to the raw position,
      // push it further to ensure we don't split content
      const minPushDistance = 20; // Minimum pixels to push content to next page
      if (endPosition - rawEndPosition < minPushDistance && endPosition < rawEndPosition + 150) {
        // Find the next complete element boundary
        const nextElementBoundary = findNextElementBoundary(contentElement, endPosition, 150);
        if (nextElementBoundary > endPosition) {
          endPosition = nextElementBoundary;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Print Page ${pageIndex}] Pushed to next element boundary:`, {
              originalEnd: rawEndPosition,
              elementBoundary: nextElementBoundary,
              adjustment: nextElementBoundary - rawEndPosition
            });
          }
        }
      }
      
      // Ensure we don't go backwards or create invalid ranges
      if (startPosition > rawStartPosition && pageIndex > 0) {
        startPosition = rawStartPosition; // Don't go backwards on start
      }
      if (endPosition < rawEndPosition && pageIndex < totalPages - 1) {
        endPosition = rawEndPosition; // Don't go forwards on end unless it's the last page
      }
    }
  }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Page ${pageIndex}:`, { 
        startPosition, 
        endPosition, 
        totalContentHeight,
        availableContentHeight,
        contentForThisPage: endPosition - startPosition
      });
    }
    
    // Use a simpler approach: create a viewport that shows only the content for this page
    // This prevents content repetition and ensures clean page boundaries
    const contentHeight = endPosition - startPosition;
    
    // Create a viewport container that will show only the relevant content
    const viewport = document.createElement('div');
    viewport.className = 'content-viewport';
    viewport.style.cssText = `
      width: 100% !important;
      height: ${contentHeight}px !important;
      overflow: hidden !important;
      position: relative !important;
      margin: 0 !important;
      padding: 0 !important;
    `;
    
    // Position the cloned content to show only the relevant portion
    clonedContent.style.cssText += `
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
      position: absolute !important;
      top: ${-startPosition}px !important;
      left: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    `;
    
    // Add the content to the viewport
    viewport.appendChild(clonedContent);
    
    // Use the viewport instead of the raw content
    clonedContent = viewport;
    
    // Ensure the content area shows the full height of this page's content
    // Account for the padding (margins) in the content area
    contentArea.style.height = `${contentHeight}px`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Print Page ${pageIndex}] Margin and positioning:`, {
        margins: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
        marginPx: `${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px`,
        contentHeight,
        startPosition,
        endPosition,
        translateY: -startPosition
      });
    }

    contentArea.appendChild(clonedContent);
    pageElement.appendChild(contentArea);
    printContainer.appendChild(pageElement);
  }

  return printContainer;
};

/**
 * Prepare DynamicPageEditor for print with separate pages
 */
export const prepareDynamicPageEditorForPrint = (
  options: PrintOptions = defaultPrintOptions,
  pageBreakPositions: number[] = []
) => {
  const body = document.body;
  
  // Add print class to body
  body.classList.add('pdf-export');
  
  // Find the document container
  const documentContainer = document.querySelector('.document-container') as HTMLElement;
  const contentElement = document.querySelector('.editor-content .ProseMirror') as HTMLElement;
  
  // Ensure we're using the same content element that the editor uses for page break calculations
  let finalContentElement = contentElement;
  if (!finalContentElement) {
    console.warn('Could not find .editor-content .ProseMirror element, trying alternative selectors');
    finalContentElement = document.querySelector('.ProseMirror') as HTMLElement;
    if (finalContentElement) {
      console.log('Using alternative ProseMirror element');
    }
  }
  
  if (!documentContainer || !finalContentElement) {
    console.warn('Could not find document container or content element for print');
    return () => {};
  }

  const pageHeight = options.pageSize === 'Letter' ? 279 * 3.7795275591 : 297 * 3.7795275591;
  
  // If no page break positions provided, try to get them from the editor's data attribute
  let finalPageBreakPositions = pageBreakPositions;
  if (finalPageBreakPositions.length === 0) {
    const pageBreaksData = finalContentElement.getAttribute('data-page-breaks');
    if (pageBreaksData) {
      try {
        finalPageBreakPositions = JSON.parse(pageBreaksData);
        console.log('Using page break positions from data attribute:', finalPageBreakPositions);
      } catch (e) {
        console.warn('Failed to parse page break positions from data attribute:', e);
      }
    }
  }
  
  // Use the provided page break positions exactly as they are
  // This ensures print preview matches editor indicators perfectly
  if (finalPageBreakPositions.length > 0) {
    console.log('Using provided page break positions for print preview:', finalPageBreakPositions);
    console.log('Content element height:', finalContentElement.scrollHeight);
    console.log('Content element client height:', finalContentElement.clientHeight);
    console.log('Content element offset height:', finalContentElement.offsetHeight);
  } else {
    // Only recalculate if no positions are provided
    const currentContentHeight = finalContentElement.scrollHeight;
    const availableContentHeight = pageHeight - (options.margins?.top || 20) * 3.7795275591 - (options.margins?.bottom || 20) * 3.7795275591;
    
    const newPageCount = Math.max(1, Math.ceil(currentContentHeight / availableContentHeight));
    finalPageBreakPositions = [];
    for (let i = 1; i < newPageCount; i++) {
      finalPageBreakPositions.push(i * availableContentHeight);
    }
    
    // Apply smart text-aware breaks
    finalPageBreakPositions = finalPageBreakPositions.map(pos => {
      const optimalPos = findOptimalTextBreakPoint(finalContentElement, pos, 80);
      // Also apply line boundary detection to prevent line splitting
      const lineBoundary = findCompleteLineBoundary(finalContentElement, optimalPos, 100);
      return lineBoundary > optimalPos ? lineBoundary : optimalPos;
    });
    
    console.log('Calculated new page break positions:', finalPageBreakPositions);
  }
  
  // Create print pages with the provided page break positions
  const printContainer = createPrintPages(
    finalContentElement,
    finalPageBreakPositions,
    pageHeight,
    options.margins || defaultPrintOptions.margins!,
    options.pageSize
  );

  if (printContainer) {
    body.appendChild(printContainer);
  }

  // Apply print-specific styles
  const style = document.createElement('style');
  style.id = 'print-styles';
  style.textContent = `
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      
      /* Hide navigation and UI elements */
      .navigation-panel,
      .toolbar,
      .ruler-system,
      .debug-info,
      button,
      .btn,
      .page-break-indicators,
      .page-break-line,
      .page-break-label,
      .page-number,
      .overflow-indicator,
      .overflow-indicator-container,
      .overflow-warning-badge,
      .current-page-indicator,
      .margin-handle,
      .horizontal-ruler,
      .vertical-ruler {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
      
      /* Force hide page break elements with inline styles */
      div[class*="page-break"],
      .print-hidden {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
      
      /* Hide original document container */
      .document-container:not(.print-page) {
        display: none !important;
      }
      
      /* Show print pages */
      .print-pages-container {
        position: static !important;
        top: auto !important;
        left: auto !important;
        width: auto !important;
        height: auto !important;
        overflow: visible !important;
        z-index: auto !important;
      }
      
      .print-page {
        width: ${options.pageSize === 'Letter' ? '216mm' : '210mm'} !important;
        height: ${options.pageSize === 'Letter' ? '279mm' : '297mm'} !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        page-break-after: always !important;
        transform: scale(${options.scale || 1}) !important;
        transform-origin: top left !important;
        overflow: hidden !important;
        position: relative !important;
        background: white !important;
      }
      
      .print-page:last-child {
        page-break-after: auto !important;
      }
      
      .print-content {
        padding: ${options.margins?.top || 20}mm ${options.margins?.right || 20}mm ${options.margins?.bottom || 20}mm ${options.margins?.left || 20}mm !important;
        height: 100% !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        margin: 0 !important;
      }
      
      /* Ensure content is visible in print */
      .print-content .ProseMirror {
        overflow: visible !important;
        height: auto !important;
        min-height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Ensure proper font rendering in print */
      .print-content * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Ensure consistent margins across all print pages */
      .print-page .print-content {
        padding: ${options.margins?.top || 20}mm ${options.margins?.right || 20}mm ${options.margins?.bottom || 20}mm ${options.margins?.left || 20}mm !important;
      }
    }
  `;
  
  document.head.appendChild(style);
  
  return () => {
    // Cleanup function
    body.classList.remove('pdf-export');
    const existingStyle = document.getElementById('print-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    if (printContainer) {
      printContainer.remove();
    }
  };
};
