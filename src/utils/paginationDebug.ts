/**
 * Debug utilities for pagination system
 */

export const debugPagination = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Pagination Debug] ${message}`, data);
    }
  },
  
  logPageDimensions: (dimensions: any) => {
    debugPagination.log('Page Dimensions:', {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      margins: {
        top: `${dimensions.marginTop}px`,
        bottom: `${dimensions.marginBottom}px`,
        left: `${dimensions.marginLeft}px`,
        right: `${dimensions.marginRight}px`
      }
    });
  },
  
  logContentOverflow: (contentHeight: number, availableHeight: number) => {
    const isOverflowing = contentHeight > availableHeight;
    const overflowAmount = Math.max(0, contentHeight - availableHeight);
    
    debugPagination.log('Content Overflow Check:', {
      contentHeight: `${contentHeight}px`,
      availableHeight: `${availableHeight}px`,
      isOverflowing,
      overflowAmount: `${overflowAmount}px`
    });
  },
  
  logPageCount: (pageCount: number, reason: string) => {
    debugPagination.log(`Page Count Updated: ${pageCount} pages`, { reason });
  }
};
