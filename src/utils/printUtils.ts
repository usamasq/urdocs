/**
 * Utility functions for print and PDF export functionality
 */

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
      .btn {
        display: none !important;
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

  // Create individual pages
  // For single-page documents, pageBreakPositions will be empty, so we create 1 page
  // For multi-page documents, we create pageBreakPositions.length + 1 pages
  const totalPages = Math.max(1, pageBreakPositions.length + 1);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating print pages:', { totalPages, pageBreakPositions });
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
    
    // Override only the necessary properties for print
    contentArea.style.cssText += `
      width: 100% !important;
      height: 100% !important;
      padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      position: relative !important;
    `;

    // Clone the original content with all styles preserved
    const clonedContent = contentElement.cloneNode(true) as HTMLElement;
    
    // Copy all computed styles from the original element
    const originalStyles = window.getComputedStyle(contentElement);
    const clonedStyles = window.getComputedStyle(clonedContent);
    
    // Apply all original styles to the cloned content
    for (let i = 0; i < originalStyles.length; i++) {
      const property = originalStyles[i];
      const value = originalStyles.getPropertyValue(property);
      if (value && value !== 'none' && value !== 'auto') {
        clonedContent.style.setProperty(property, value);
      }
    }
    
    // Override only the necessary properties for print
    clonedContent.style.cssText += `
      width: 100% !important;
      height: 100% !important;
      overflow: hidden !important;
      position: relative !important;
      transform: none !important;
    `;

    // Calculate content positioning for this page
    let startPosition = 0;
    let endPosition = contentElement.scrollHeight;
    
    if (pageBreakPositions.length > 0) {
      // Multi-page document
      if (pageIndex === 0) {
        // First page starts at 0
        startPosition = 0;
        endPosition = pageBreakPositions[0];
      } else if (pageIndex < pageBreakPositions.length) {
        // Middle pages start after the previous page break
        startPosition = pageBreakPositions[pageIndex - 1];
        endPosition = pageBreakPositions[pageIndex];
      } else {
        // Last page starts after the last page break
        startPosition = pageBreakPositions[pageBreakPositions.length - 1];
        endPosition = contentElement.scrollHeight;
      }
    } else {
      // Single-page document - show all content
      startPosition = 0;
      endPosition = contentElement.scrollHeight;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Page ${pageIndex}:`, { startPosition, endPosition, contentHeight: contentElement.scrollHeight });
    }
    
    // Apply transform to show only the content for this page
    // Move content up by the start position to show the correct portion
    const translateY = -startPosition;
    clonedContent.style.transform = `translateY(${translateY}px)`;
    clonedContent.style.height = `${endPosition - startPosition}px`;
    
    // Ensure the content area shows the full height of this page's content
    contentArea.style.height = `${endPosition - startPosition}px`;

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
  
  if (!documentContainer || !contentElement) {
    console.warn('Could not find document container or content element for print');
    return () => {};
  }

  const pageHeight = options.pageSize === 'Letter' ? 279 * 3.7795275591 : 297 * 3.7795275591;
  
  // Create print pages with the provided page break positions
  const printContainer = createPrintPages(
    contentElement,
    pageBreakPositions,
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
      .btn {
        display: none !important;
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
