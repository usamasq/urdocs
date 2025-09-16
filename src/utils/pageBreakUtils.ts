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
  
  // Calculate page break positions with smart text-aware breaks
  const pageBreakPositions = calculatePageBreakPositions(
    pageCount,
    availableHeight,
    pageDimensions.marginTop,
    editorElement
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
 * Find the end of a complete line to avoid splitting lines
 */
export const findLineEndPosition = (
  editorElement: HTMLElement,
  targetPosition: number,
  searchRange: number = 50
): number => {
  if (!editorElement) return targetPosition;

  // Get all text elements that might contain lines
  const textElements = editorElement.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, blockquote');
  
  let bestLineEnd = targetPosition;
  let minDistance = Infinity;

  for (const element of textElements) {
    const rect = element.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const elementTop = rect.top - editorRect.top;
    const elementBottom = rect.bottom - editorRect.top;

    // Check if this element intersects with our target position
    if (elementTop <= targetPosition + searchRange && elementBottom >= targetPosition - searchRange) {
      // If the target position is within this element, find the end of the line
      if (targetPosition >= elementTop && targetPosition <= elementBottom) {
        // Look for line breaks within this element
        const lineBreaks = element.querySelectorAll('br');
        for (const br of lineBreaks) {
          const brRect = br.getBoundingClientRect();
          const brTop = brRect.top - editorRect.top;
          
          if (brTop > targetPosition && brTop <= targetPosition + searchRange) {
            const distance = brTop - targetPosition;
            if (distance < minDistance) {
              minDistance = distance;
              bestLineEnd = brTop;
            }
          }
        }
        
        // If no line breaks found, use the element bottom
        if (minDistance === Infinity) {
          const distance = elementBottom - targetPosition;
          if (distance < searchRange) {
            minDistance = distance;
            bestLineEnd = elementBottom;
          }
        }
      }
    }
  }

  return bestLineEnd;
};

/**
 * Enhanced function to detect if a position would split a line and find the complete line boundary
 */
export const findCompleteLineBoundary = (
  editorElement: HTMLElement,
  targetPosition: number,
  searchRange: number = 100
): number => {
  if (!editorElement) return targetPosition;

  // Get all text elements that might contain lines
  const textElements = editorElement.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, blockquote');
  
  let bestLineEnd = targetPosition;
  let minDistance = Infinity;

  for (const element of textElements) {
    const rect = element.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const elementTop = rect.top - editorRect.top;
    const elementBottom = rect.bottom - editorRect.top;

    // Check if this element intersects with our target position
    if (elementTop <= targetPosition + searchRange && elementBottom >= targetPosition - searchRange) {
      // If the target position is within this element, we need to find the complete line
      if (targetPosition >= elementTop && targetPosition <= elementBottom) {
        // Calculate the line height for this element
        const computedStyle = window.getComputedStyle(element);
        const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
        
        // Find which line the target position is on
        const relativePosition = targetPosition - elementTop;
        const lineNumber = Math.floor(relativePosition / lineHeight);
        const lineStart = elementTop + (lineNumber * lineHeight);
        const lineEnd = elementTop + ((lineNumber + 1) * lineHeight);
        
        // If the target position is in the middle of a line, push to the end of the line
        if (targetPosition > lineStart && targetPosition < lineEnd) {
          const distance = lineEnd - targetPosition;
          if (distance < minDistance && distance <= searchRange) {
            minDistance = distance;
            bestLineEnd = lineEnd;
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Line Boundary] Found line split at position ${targetPosition}:`, {
                element: element.tagName,
                lineStart,
                lineEnd,
                lineHeight,
                lineNumber,
                distance,
                adjustment: lineEnd - targetPosition
              });
            }
          }
        }
        
        // Also check for explicit line breaks
        const lineBreaks = element.querySelectorAll('br');
        for (const br of lineBreaks) {
          const brRect = br.getBoundingClientRect();
          const brTop = brRect.top - editorRect.top;
          
          if (brTop > targetPosition && brTop <= targetPosition + searchRange) {
            const distance = brTop - targetPosition;
            if (distance < minDistance) {
              minDistance = distance;
              bestLineEnd = brTop;
            }
          }
        }
        
        // If no line breaks found and no line split detected, use the element bottom
        if (minDistance === Infinity) {
          const distance = elementBottom - targetPosition;
          if (distance < searchRange) {
            minDistance = distance;
            bestLineEnd = elementBottom;
          }
        }
      }
    }
  }

  return bestLineEnd;
};

/**
 * Find optimal text break points to avoid splitting text in the middle
 */
export const findOptimalTextBreakPoint = (
  editorElement: HTMLElement,
  targetPosition: number,
  searchRange: number = 100
): number => {
  if (!editorElement) return targetPosition;

  // Get all text-containing elements in order of preference for breaks
  const textElements = editorElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, li, blockquote, hr');
  
  let bestBreakPoint = targetPosition;
  let minDistance = Infinity;
  let bestPriority = 0; // Higher priority = better break point

  // Priority system: headings > paragraphs > divs > other elements
  const getElementPriority = (tagName: string): number => {
    switch (tagName.toLowerCase()) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return 4;
      case 'hr': return 3;
      case 'p': return 2;
      case 'div': return 1;
      case 'li': case 'blockquote': return 1;
      default: return 0;
    }
  };

  // Search for the best text boundary within the search range
  for (const element of textElements) {
    const rect = element.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const elementTop = rect.top - editorRect.top;
    const elementBottom = rect.bottom - editorRect.top;
    const elementPriority = getElementPriority(element.tagName);

    // Check if this element is within our search range
    if (elementTop <= targetPosition + searchRange && elementBottom >= targetPosition - searchRange) {
      const distanceToStart = Math.abs(elementTop - targetPosition);
      const distanceToEnd = Math.abs(elementBottom - targetPosition);

      // Prefer element starts over ends, and higher priority elements
      const isStartBetter = distanceToStart <= distanceToEnd;
      const distance = isStartBetter ? distanceToStart : distanceToEnd;
      const breakPoint = isStartBetter ? elementTop : elementBottom;

      // Choose this break point if:
      // 1. It's closer than our current best, OR
      // 2. It's the same distance but has higher priority, OR
      // 3. It's within reasonable distance and has much higher priority
      const isBetter = (
        distance < minDistance ||
        (distance === minDistance && elementPriority > bestPriority) ||
        (distance <= searchRange * 0.5 && elementPriority > bestPriority + 1)
      );

      if (isBetter) {
        minDistance = distance;
        bestBreakPoint = breakPoint;
        bestPriority = elementPriority;
      }
    }
  }

  // If we found a good break point within reasonable distance, use it
  if (minDistance < searchRange) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Smart Break] Found optimal break at ${bestBreakPoint} (distance: ${minDistance}, priority: ${bestPriority})`);
    }
    return bestBreakPoint;
  }

  // Fallback: try to find line breaks within the content
  const lines = editorElement.querySelectorAll('br');
  for (const line of lines) {
    const rect = line.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const lineTop = rect.top - editorRect.top;
    const distance = Math.abs(lineTop - targetPosition);

    if (distance < minDistance && distance < searchRange) {
      minDistance = distance;
      bestBreakPoint = lineTop;
      bestPriority = 1; // Line breaks have medium priority
    }
  }

  // Final fallback: try to find word boundaries using text nodes
  if (minDistance >= searchRange) {
    const textNodes = getTextNodesInRange(editorElement, targetPosition - searchRange, targetPosition + searchRange);
    for (const textNode of textNodes) {
      const rect = textNode.getBoundingClientRect();
      const editorRect = editorElement.getBoundingClientRect();
      const nodeTop = rect.top - editorRect.top;
      const distance = Math.abs(nodeTop - targetPosition);

      if (distance < minDistance && distance < searchRange) {
        minDistance = distance;
        bestBreakPoint = nodeTop;
        bestPriority = 0; // Text nodes have lowest priority
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Smart Break] Final break point: ${bestBreakPoint} (distance: ${minDistance}, priority: ${bestPriority})`);
  }

  return bestBreakPoint;
};

/**
 * Get text nodes within a specific range for word boundary detection
 */
const getTextNodesInRange = (
  container: HTMLElement,
  startY: number,
  endY: number
): Text[] => {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node: Node | null;
  while (node = walker.nextNode()) {
    const textNode = node as Text;
    if (textNode.textContent && textNode.textContent.trim().length > 0) {
      const rect = textNode.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const nodeTop = rect.top - containerRect.top;
      
      if (nodeTop >= startY && nodeTop <= endY) {
        textNodes.push(textNode);
      }
    }
  }

  return textNodes;
};

/**
 * Find the next complete element boundary to avoid splitting content
 */
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

/**
 * Calculate page break positions for navigation with smart text-aware breaks
 */
export const calculatePageBreakPositions = (
  pageCount: number,
  availableHeight: number,
  marginTop: number,
  editorElement?: HTMLElement
): number[] => {
  if (pageCount <= 1) return [];

  const positions: number[] = [];
  
  for (let i = 1; i < pageCount; i++) {
    const rawBreakPosition = i * availableHeight + marginTop;
    
    // If we have access to the editor element, find optimal text break point
    let breakPosition = rawBreakPosition;
    if (editorElement) {
      breakPosition = findOptimalTextBreakPoint(editorElement, rawBreakPosition, 80);
      
      // Be more aggressive about pushing content to the next page
      // Find the end of the complete line to avoid splitting lines
      const lineEndPosition = findCompleteLineBoundary(editorElement, breakPosition, 100);
      if (lineEndPosition > breakPosition && lineEndPosition <= rawBreakPosition + 150) {
        breakPosition = lineEndPosition;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Smart Page Break] Page ${i} - Pushed line to next page:`, {
            rawPosition: rawBreakPosition,
            optimizedPosition: breakPosition,
            lineEnd: lineEndPosition,
            adjustment: breakPosition - rawBreakPosition
          });
        }
      }
      
      // Additional safety check: if the break position is very close to the raw position,
      // push it further to ensure we don't split content
      const minPushDistance = 20; // Minimum pixels to push content to next page
      if (breakPosition - rawBreakPosition < minPushDistance && breakPosition < rawBreakPosition + 150) {
        // Find the next complete element boundary
        const nextElementBoundary = findNextElementBoundary(editorElement, breakPosition, 150);
        if (nextElementBoundary > breakPosition) {
          breakPosition = nextElementBoundary;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Smart Page Break] Page ${i} - Pushed to next element boundary:`, {
              rawPosition: rawBreakPosition,
              elementBoundary: nextElementBoundary,
              adjustment: nextElementBoundary - rawBreakPosition
            });
          }
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Smart Page Break] Page ${i} - Final:`, {
          rawPosition: rawBreakPosition,
          finalPosition: breakPosition,
          totalAdjustment: breakPosition - rawBreakPosition
        });
      }
    }
    
    positions.push(breakPosition);
  }
  
  // Post-process to ensure we don't create overlapping or invalid page ranges
  return adjustPageBreakPositions(positions, availableHeight, marginTop);
};

/**
 * Adjust page break positions to ensure valid page ranges and prevent overlaps
 */
export const adjustPageBreakPositions = (
  positions: number[],
  availableHeight: number,
  marginTop: number
): number[] => {
  if (positions.length === 0) return positions;

  const adjustedPositions: number[] = [];
  let lastPosition = marginTop; // Start from the top margin

  for (let i = 0; i < positions.length; i++) {
    const currentPosition = positions[i];
    
    // Ensure minimum page height (at least 50% of available height)
    const minPageHeight = availableHeight * 0.5;
    const minPosition = lastPosition + minPageHeight;
    
    // Ensure maximum page height (not more than 150% of available height)
    const maxPageHeight = availableHeight * 1.5;
    const maxPosition = lastPosition + maxPageHeight;
    
    // Adjust position to be within valid bounds
    let adjustedPosition = Math.max(minPosition, Math.min(currentPosition, maxPosition));
    
    // Ensure we don't go backwards
    if (adjustedPosition <= lastPosition) {
      adjustedPosition = lastPosition + minPageHeight;
    }
    
    adjustedPositions.push(adjustedPosition);
    lastPosition = adjustedPosition;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Page Break Adjustment] Page ${i + 1}:`, {
        original: currentPosition,
        adjusted: adjustedPosition,
        minPosition,
        maxPosition,
        pageHeight: adjustedPosition - (i === 0 ? marginTop : adjustedPositions[i - 1])
      });
    }
  }
  
  return adjustedPositions;
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
