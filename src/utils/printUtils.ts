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
      
      .editor-content {
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
