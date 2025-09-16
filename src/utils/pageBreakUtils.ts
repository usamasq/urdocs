/**
 * Centralized page break calculation utilities
 * Provides consistent page break detection across all editor components
 */

export interface PageDimensions {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export interface OverflowInfo {
  isOverflowing: boolean;
  overflowAmount: number;
  pageCount: number;
  contentHeight: number;
  availableHeight: number;
  pageBreakPositions: number[];
}

export interface PageBreakOptions {
  bufferHeight?: number;
  minPageHeight?: number;
  maxPageHeight?: number;
}

/**
 * Calculate available content height within page margins
 */
export const calculateAvailableHeight = (
  pageDimensions: PageDimensions
): number => {
  return pageDimensions.height - pageDimensions.marginTop - pageDimensions.marginBottom;
};

/**
 * Calculate accurate content height using multiple measurement methods
 */
export const calculateContentHeight = (editorElement: HTMLElement): number => {
  if (!editorElement) return 0;

  // Use multiple methods for accuracy
  const scrollHeight = editorElement.scrollHeight;
  const clientHeight = editorElement.clientHeight;
  const offsetHeight = editorElement.offsetHeight;
  
  // Use the maximum to ensure we capture all content
  const contentHeight = Math.max(scrollHeight, clientHeight, offsetHeight);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('calculateContentHeight:', {
      scrollHeight,
      clientHeight,
      offsetHeight,
      contentHeight,
      element: editorElement
    });
  }
  
  return contentHeight;
};

/**
 * Calculate comprehensive overflow information
 */
export const calculateOverflowInfo = (
  editorElement: HTMLElement | null,
  pageDimensions: PageDimensions,
  options: PageBreakOptions = {}
): OverflowInfo => {
  const {
    bufferHeight = 20,
    minPageHeight = 200,
    maxPageHeight = 1200
  } = options;

  if (!editorElement) {
    return {
      isOverflowing: false,
      overflowAmount: 0,
      pageCount: 1,
      contentHeight: 0,
      availableHeight: calculateAvailableHeight(pageDimensions),
      pageBreakPositions: []
    };
  }

  const contentHeight = calculateContentHeight(editorElement);
  const availableHeight = calculateAvailableHeight(pageDimensions);
  
  // Add buffer to account for line spacing and margins
  const adjustedContentHeight = contentHeight + bufferHeight;
  
  const isOverflowing = adjustedContentHeight > availableHeight;
  const overflowAmount = Math.max(0, adjustedContentHeight - availableHeight);
  
  // Calculate page count with bounds checking
  const rawPageCount = Math.ceil(adjustedContentHeight / availableHeight);
  const pageCount = Math.max(1, Math.min(rawPageCount, 50)); // Cap at 50 pages
  
  // Calculate page break positions
  const pageBreakPositions = calculatePageBreakPositions(
    pageCount,
    availableHeight,
    pageDimensions.marginTop
  );

  return {
    isOverflowing,
    overflowAmount,
    pageCount,
    contentHeight: adjustedContentHeight,
    availableHeight,
    pageBreakPositions
  };
};

/**
 * Calculate page break positions for navigation
 */
export const calculatePageBreakPositions = (
  pageCount: number,
  availableHeight: number,
  marginTop: number
): number[] => {
  if (pageCount <= 1) return [];

  const positions: number[] = [];
  
  for (let i = 1; i < pageCount; i++) {
    const breakPosition = i * availableHeight + marginTop;
    positions.push(breakPosition);
  }
  
  return positions;
};

/**
 * Calculate scroll position for page navigation
 */
export const calculateScrollPosition = (
  pageIndex: number,
  pageBreakPositions: number[],
  availableHeight: number,
  marginTop: number,
  containerHeight?: number
): number => {
  if (pageIndex < 0) return 0;

  let scrollPosition = 0;

  if (pageIndex === 0) {
    // Scroll to top of document
    scrollPosition = 0;
  } else if (pageIndex <= pageBreakPositions.length) {
    // Use calculated page break positions with offset
    scrollPosition = pageBreakPositions[pageIndex - 1] - 50; // 50px offset
  } else {
    // For pages beyond calculated breaks, scroll to the end
    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      scrollPosition = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    } else {
      // Fallback: calculate based on available height (not container height)
      const pageHeight = availableHeight + marginTop;
      scrollPosition = pageIndex * pageHeight - 50;
    }
  }

  // Ensure scroll position is not negative and not beyond content
  const finalPosition = Math.max(0, scrollPosition);

  if (process.env.NODE_ENV === 'development') {
    console.log('[CalculateScrollPosition]', {
      pageIndex,
      pageBreakPositions,
      availableHeight,
      marginTop,
      containerHeight,
      scrollPosition,
      finalPosition,
      totalPages: pageBreakPositions.length + 1,
      calculationMethod: pageIndex === 0 ? 'top' : 
                        pageIndex <= pageBreakPositions.length ? 'pageBreak' : 'fallback'
    });
  }

  return finalPosition;
};

/**
 * Detect current page based on cursor position
 */
export const detectCurrentPageByCursor = (
  editorElement: HTMLElement,
  pageBreakPositions: number[],
  availableHeight: number,
  marginTop: number
): number => {
  if (!editorElement || pageBreakPositions.length === 0) {
    return 0;
  }

  // Get the cursor position
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return 0;
  }

  const range = selection.getRangeAt(0);
  const cursorRect = range.getBoundingClientRect();
  const editorRect = editorElement.getBoundingClientRect();
  
  // Calculate cursor position relative to editor
  const cursorTop = cursorRect.top - editorRect.top;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Cursor Page Detection]', {
      cursorTop,
      pageBreakPositions,
      availableHeight,
      marginTop
    });
  }

  // Find which page the cursor is on (0-based indexing)
  for (let i = 0; i < pageBreakPositions.length; i++) {
    if (cursorTop < pageBreakPositions[i]) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cursor Page Detection] Cursor on page ${i} (0-based)`);
      }
      return i;
    }
  }

  // If cursor is beyond all page breaks, it's on the last page (0-based)
  const lastPage = pageBreakPositions.length;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Cursor Page Detection] Cursor on last page ${lastPage} (0-based)`);
  }
  return lastPage;
};

/**
 * Detect current page based on scroll position
 */
export const detectCurrentPage = (
  scrollTop: number,
  pageBreakPositions: number[],
  containerHeight: number,
  totalScrollHeight: number,
  threshold: number = 150
): number => {
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Page Detection]', {
      scrollTop,
      pageBreakPositions,
      containerHeight,
      totalScrollHeight,
      threshold
    });
  }

  // Check if we're at the very top (first page)
  if (scrollTop < threshold) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Page Detection] At top, returning page 0');
    }
    return 0;
  }

  // Check each page break position
  let detectedPage = 0;
  for (let i = 0; i < pageBreakPositions.length; i++) {
    const breakPosition = pageBreakPositions[i];
    
    // If we're past this break point, we're on the next page
    if (scrollTop >= breakPosition - threshold) {
      detectedPage = i + 1;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Page Detection] Past break ${i} at ${breakPosition}, detected page ${detectedPage}`);
      }
    }
  }
  
  // If we're near the bottom, we might be on the last page
  if (scrollTop + containerHeight >= totalScrollHeight - threshold) {
    const lastPage = Math.max(detectedPage, pageBreakPositions.length);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Page Detection] Near bottom, detected page ${lastPage}`);
    }
    detectedPage = lastPage;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Page Detection] Final detected page: ${detectedPage}`);
  }
  
  return detectedPage;
};

/**
 * Validate page index bounds
 */
export const validatePageIndex = (pageIndex: number, pageCount: number): number => {
  if (pageIndex < 0) return 0;
  if (pageIndex >= pageCount) return pageCount - 1;
  return pageIndex;
};

/**
 * Debounce utility for performance optimization
 */
export const createDebouncedFunction = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

/**
 * Safe DOM query utility
 */
export const safeQuerySelector = (selector: string): Element | null => {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.warn(`Failed to query selector: ${selector}`, error);
    return null;
  }
};

/**
 * Get scroll container safely
 */
export const getScrollContainer = (): Element | null => {
  // Try multiple common selectors
  const selectors = [
    '.flex-1.overflow-y-auto',
    '.overflow-y-auto',
    '.scroll-container',
    'main',
    'body'
  ];
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[GetScrollContainer] Searching for scroll container...');
  }
  
  for (const selector of selectors) {
    const element = safeQuerySelector(selector);
    if (element) {
      const hasScroll = element.scrollHeight > element.clientHeight;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[GetScrollContainer] Found element with selector "${selector}":`, {
          element,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          hasScroll
        });
      }
      // Return the first valid container, even if it doesn't currently have scrollable content
      // This allows scroll functionality to work even when content doesn't overflow
      if (process.env.NODE_ENV === 'development') {
        console.log(`[GetScrollContainer] Using scroll container: ${selector}`);
      }
      return element;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[GetScrollContainer] No element found for selector: ${selector}`);
      }
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('[GetScrollContainer] No scroll container found!');
  }
  return null;
};
