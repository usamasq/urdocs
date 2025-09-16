import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { EditorContent } from '@tiptap/react';
import { useTheme } from '../contexts/ThemeContext';
import { getPageDimensions, getRTLMarginStyles, getRTLMarginCSSProperties } from '../utils/dimensionUtils';
import RulerSystem from './RulerSystem';
import { 
  calculateOverflowInfo, 
  calculateScrollPosition, 
  detectCurrentPage,
  detectCurrentPageByCursor, 
  validatePageIndex,
  createDebouncedFunction,
  getScrollContainer,
  type PageDimensions, 
  type OverflowInfo 
} from '../utils/pageBreakUtils';
import { prepareDynamicPageEditorForPrint, type PrintOptions } from '../utils/printUtils';

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

interface DynamicPageEditorProps {
  editor: any;
  pageLayout: PageLayout;
  zoomLevel: number;
  onPageCountChange?: (pageCount: number) => void;
  onMarginChange?: (side: 'top' | 'bottom' | 'left' | 'right', value: number) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onOverflowInfoChange?: (info: any) => void;
  showPageBreaks?: boolean;
}

// Using OverflowInfo from pageBreakUtils

const DynamicPageEditor: React.FC<DynamicPageEditorProps> = ({
  editor,
  pageLayout,
  zoomLevel,
  onPageCountChange,
  onMarginChange,
  currentPage = 0,
  onPageChange,
  onOverflowInfoChange,
  showPageBreaks = true
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflowInfo, setOverflowInfo] = useState<OverflowInfo>({
    isOverflowing: false,
    overflowAmount: 0,
    pageCount: 1,
    contentHeight: 0,
    availableHeight: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [pageBreakPositions, setPageBreakPositions] = useState<number[]>([]);
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);
  const [isCursorScroll, setIsCursorScroll] = useState(false);
  const [lastCursorPosition, setLastCursorPosition] = useState<number>(0);

  // Calculate page dimensions using centralized utilities
  const calculateDimensions = useCallback(() => {
    const pageDims = getPageDimensions(
      pageLayout?.pageSize || 'A4',
      pageLayout?.customWidth,
      pageLayout?.customHeight,
      pageLayout?.orientation || 'portrait'
    );
    
    return {
      ...pageDims,
      width: pageDims.width,
      height: pageDims.height
    };
  }, [pageLayout]);

  // Enhanced overflow detection with detailed information using centralized utility
  const calculateOverflowInfoCallback = useCallback((): OverflowInfo => {
    if (!contentRef.current || !editor) {
      return {
        isOverflowing: false,
        overflowAmount: 0,
        pageCount: 1,
        contentHeight: 0,
        availableHeight: 0,
        pageBreakPositions: []
      };
    }

    const dimensions = calculateDimensions();
    const marginTop = pageLayout.margins.top * 3.7795275591; // mm to px
    const marginBottom = pageLayout.margins.bottom * 3.7795275591;
    
    // Get the editor content element
    const editorElement = contentRef.current.querySelector('.ProseMirror') as HTMLElement;
    if (!editorElement) {
      const availableHeight = dimensions.height - marginTop - marginBottom;
      return {
        isOverflowing: false,
        overflowAmount: 0,
        pageCount: 1,
        contentHeight: 0,
        availableHeight,
        pageBreakPositions: []
      };
    }

    // Use centralized overflow calculation
    const pageDimensions: PageDimensions = {
      width: dimensions.width,
      height: dimensions.height,
      marginTop,
      marginBottom,
      marginLeft: pageLayout.margins.left * 3.7795275591,
      marginRight: pageLayout.margins.right * 3.7795275591
    };

    return calculateOverflowInfo(editorElement, pageDimensions);
  }, [calculateDimensions, editor, pageLayout.margins]);

  // Page break positions are now calculated in the centralized utility

  // Update overflow information
  const updateOverflowInfo = useCallback(() => {
    const newOverflowInfo = calculateOverflowInfoCallback();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Overflow Update]', {
        isOverflowing: newOverflowInfo.isOverflowing,
        pageCount: newOverflowInfo.pageCount,
        contentHeight: newOverflowInfo.contentHeight,
        availableHeight: newOverflowInfo.availableHeight,
        pageBreakPositions: newOverflowInfo.pageBreakPositions
      });
    }
    
    setOverflowInfo(newOverflowInfo);
    onPageCountChange?.(newOverflowInfo.pageCount);
    onOverflowInfoChange?.(newOverflowInfo);
    
    // Page break positions are already calculated in the centralized utility
    setPageBreakPositions(newOverflowInfo.pageBreakPositions);
    
    // Store page break positions in data attribute for print system access
    const editorElement = document.querySelector('.ProseMirror');
    if (editorElement) {
      editorElement.setAttribute('data-page-breaks', JSON.stringify(newOverflowInfo.pageBreakPositions));
      console.log('Stored page break positions:', newOverflowInfo.pageBreakPositions);
    }
    
    // Force a re-render to update page break indicators
    // This ensures indicators are positioned correctly after font size changes
    if (process.env.NODE_ENV === 'development') {
      console.log('[Page Break Indicators] Updated positions:', newOverflowInfo.pageBreakPositions);
    }
  }, [calculateOverflowInfoCallback, onPageCountChange, onOverflowInfoChange]);

  // Scroll to specific page using centralized utility
  const scrollToPage = useCallback((pageIndex: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ScrollToPage] Called with pageIndex:', pageIndex);
    }

    const validatedPageIndex = validatePageIndex(pageIndex, overflowInfo.pageCount);
    if (!containerRef.current || validatedPageIndex < 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ScrollToPage] Validation failed:', { validatedPageIndex, containerRef: !!containerRef.current });
      }
      return;
    }

    const scrollContainer = getScrollContainer();
    if (!scrollContainer) {
      console.warn('No scroll container found for page navigation');
      return;
    }

    // Check if content is actually scrollable
    const canScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
    // Scroll check - always attempt to scroll

    if (process.env.NODE_ENV === 'development') {
      console.log('[ScrollToPage] Scroll container found:', scrollContainer);
    }

    // Set flag to prevent scroll detection during programmatic scroll
    setIsProgrammaticScroll(true);

    const marginTop = pageLayout.margins.top * 3.7795275591;
    const scrollPosition = calculateScrollPosition(
      validatedPageIndex,
      pageBreakPositions,
      overflowInfo.availableHeight,
      marginTop,
      scrollContainer.clientHeight
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('[ScrollToPage] Calculated scroll position:', {
        validatedPageIndex,
        pageBreakPositions,
        availableHeight: overflowInfo.availableHeight,
        marginTop,
        containerHeight: scrollContainer.clientHeight,
        scrollPosition,
        overflowInfo: {
          isOverflowing: overflowInfo.isOverflowing,
          pageCount: overflowInfo.pageCount,
          contentHeight: overflowInfo.contentHeight
        }
      });
    }

    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      scrollContainer.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      
      // Reset programmatic scroll flag after animation completes
      setTimeout(() => {
        setIsProgrammaticScroll(false);
      }, 1000); // Allow time for smooth scroll to complete
    });
  }, [overflowInfo, pageBreakPositions, pageLayout.margins.top]);

  // Print function for DynamicPageEditor
  const printDocument = useCallback((options: PrintOptions = {}) => {
    const printOptions: PrintOptions = {
      pageSize: pageLayout.pageSize,
      orientation: pageLayout.orientation,
      margins: pageLayout.margins,
      scale: zoomLevel,
      ...options
    };

    // Create a custom print preparation that includes page break positions
    const cleanup = prepareDynamicPageEditorForPrint(printOptions, pageBreakPositions);
    
    // Override the page break positions in the print preparation
    const printContainer = document.querySelector('.print-pages-container') as HTMLElement;
    if (printContainer && pageBreakPositions.length > 0) {
      // Update the print container with actual page break positions
      const contentElement = document.querySelector('.editor-content .ProseMirror') as HTMLElement;
      if (contentElement) {
        // Remove existing print pages
        printContainer.innerHTML = '';
        
        // Create new print pages with actual page break positions
        const totalPages = pageBreakPositions.length + 1;
        const mmToPx = 3.7795275591;
        const pageWidth = printOptions.pageSize === 'Letter' ? 216 : 210;
        const pageHeightMm = printOptions.pageSize === 'Letter' ? 279 : 297;
        
        const pageWidthPx = pageWidth * mmToPx;
        const pageHeightPx = pageHeightMm * mmToPx;

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          const pageElement = document.createElement('div');
          pageElement.className = 'document-container print-page';
          pageElement.style.cssText = `
            width: ${pageWidthPx}px;
            height: ${pageHeightPx}px;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border: none;
            border-radius: 0;
            background: white;
            position: relative;
            page-break-after: ${pageIndex < totalPages - 1 ? 'always' : 'auto'};
            overflow: hidden;
          `;

          const contentArea = document.createElement('div');
          contentArea.className = 'editor-content print-content';
          contentArea.style.cssText = `
            width: 100%;
            height: 100%;
            padding: ${printOptions.margins?.top || 20}mm ${printOptions.margins?.right || 20}mm ${printOptions.margins?.bottom || 20}mm ${printOptions.margins?.left || 20}mm;
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
          `;

          const clonedContent = contentElement.cloneNode(true) as HTMLElement;
          clonedContent.style.cssText = `
            width: 100%;
            height: 100%;
            overflow: hidden;
            position: relative;
          `;

          // Calculate content positioning for this page
          const startPosition = pageIndex === 0 ? 0 : pageBreakPositions[pageIndex - 1];
          const endPosition = pageIndex < pageBreakPositions.length ? pageBreakPositions[pageIndex] : contentElement.scrollHeight;
          
          // Apply transform to show only the content for this page
          const translateY = -startPosition;
          clonedContent.style.transform = `translateY(${translateY}px)`;
          clonedContent.style.height = `${endPosition - startPosition}px`;

          contentArea.appendChild(clonedContent);
          pageElement.appendChild(contentArea);
          printContainer.appendChild(pageElement);
        }
      }
    }

    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();
      
      // Cleanup after printing
      setTimeout(cleanup, 1000);
    }, 100);
  }, [pageLayout, zoomLevel, pageBreakPositions]);

  // Handle page change from pagination controls - scroll to the page
  // DISABLED: Page change effect - scroll to new page when currentPage changes
  // Only update page number, don't auto-scroll while user is working
  // useEffect(() => {
  //   if (currentPage !== undefined) {
  //     if (process.env.NODE_ENV === 'development') {
  //       console.log('[Page Change Effect] Current page changed to:', currentPage);
  //     }
  //     scrollToPage(currentPage);
  //   }
  // }, [currentPage, scrollToPage]);

  // Auto-detect current page based on cursor position
  useEffect(() => {
    const debouncedHandleCursorChange = createDebouncedFunction(() => {
      // Don't detect during programmatic scroll or cursor scroll
      if (isProgrammaticScroll || isCursorScroll) {
        return;
      }

      if (!editor || !containerRef.current) return;

      const editorElement = containerRef.current.querySelector('.ProseMirror') as HTMLElement;
      if (!editorElement) return;

      // Always detect page for single page (page 0) or when overflowing
      if (overflowInfo.pageCount <= 1) {
        // For single page, always return page 0
        if (currentPage !== 0 && onPageChange) {
          onPageChange(0);
        }
        return;
      }

      if (!overflowInfo.isOverflowing) {
        return;
      }

      const detectedPage = detectCurrentPageByCursor(
        editorElement,
        pageBreakPositions,
        overflowInfo.availableHeight,
        pageLayout.margins.top * 3.7795275591
      );

      if (detectedPage !== currentPage && onPageChange) {
        // Get current cursor position for comparison
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const cursorRect = range.getBoundingClientRect();
          const editorRect = editorElement.getBoundingClientRect();
          const currentCursorPosition = cursorRect.top - editorRect.top;
          
          // Only auto-scroll if cursor moved significantly (indicating active editing)
          const cursorMovement = Math.abs(currentCursorPosition - lastCursorPosition);
          const shouldAutoScroll = cursorMovement > 50; // 50px threshold
          
          // DISABLED: Auto-scroll to cursor's page to prevent interference with page navigation
          // if (shouldAutoScroll) {
          //   // Auto-scroll to cursor's page when actively editing
          //   setIsCursorScroll(true);
          //   scrollToPage(detectedPage);
          //   setTimeout(() => {
          //     setIsCursorScroll(false);
          //   }, 1000);
          // }
          
          setLastCursorPosition(currentCursorPosition);
        }
        
        // Always update the page number
        onPageChange(detectedPage);
      }
    }, 100);

    const handleSelectionChange = () => {
      debouncedHandleCursorChange();
    };

    const handleCursorMove = () => {
      debouncedHandleCursorChange();
    };

    // Listen for cursor/selection changes
    document.addEventListener('selectionchange', handleSelectionChange);
    
    // Also listen for editor updates
    if (editor) {
      editor.on('selectionUpdate', handleCursorMove);
      editor.on('update', handleCursorMove);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (editor) {
        editor.off('selectionUpdate', handleCursorMove);
        editor.off('update', handleCursorMove);
      }
    };
  }, [editor, overflowInfo, pageBreakPositions, currentPage, onPageChange, pageLayout.margins.top, isProgrammaticScroll, isCursorScroll, lastCursorPosition]);

  // Auto-detect current page based on scroll position using centralized utility
  useEffect(() => {
    const debouncedHandleScroll = createDebouncedFunction((scrollTop: number, containerHeight: number, totalScrollHeight: number) => {
      // Don't detect page changes during programmatic scrolling
      if (isProgrammaticScroll) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Page Detection] Skipping - programmatic scroll');
        }
        return;
      }
      
      // Always detect page for single page (page 0) or when overflowing
      if (overflowInfo.pageCount <= 1) {
        // For single page, always return page 0
        if (currentPage !== 0 && onPageChange) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Page Detection] Single page, setting to page 0');
          }
          onPageChange(0);
        }
        return;
      }

      if (!overflowInfo.isOverflowing) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Page Detection] Not overflowing, skipping detection');
        }
        return;
      }

      // Use centralized page detection
      const detectedPage = detectCurrentPage(
        scrollTop,
        pageBreakPositions,
        containerHeight,
        totalScrollHeight,
        150 // threshold
      );
      
      // Update current page if it changed
      if (detectedPage !== currentPage && onPageChange) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Page Detection] Page changed from ${currentPage} to ${detectedPage}`);
        }
        onPageChange(detectedPage);
      }
    }, 150); // Debounce delay
    
    const handleScroll = () => {
      const scrollContainer = getScrollContainer();
      if (!scrollContainer) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Page Detection] No scroll container found');
        }
        return;
      }

      const scrollTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;
      const totalScrollHeight = scrollContainer.scrollHeight;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Page Detection] Scroll event:', {
          scrollTop,
          containerHeight,
          totalScrollHeight,
          overflowInfo: {
            isOverflowing: overflowInfo.isOverflowing,
            pageCount: overflowInfo.pageCount,
            pageBreakPositions
          }
        });
      }
      
      debouncedHandleScroll(scrollTop, containerHeight, totalScrollHeight);
    };

    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [overflowInfo, pageBreakPositions, currentPage, onPageChange, isProgrammaticScroll]);

  // Monitor content changes with debouncing using centralized utility
  useEffect(() => {
    if (!editor) return;

    const debouncedUpdate = createDebouncedFunction(updateOverflowInfo, 150);
    const immediateUpdate = () => updateOverflowInfo(); // For critical changes like font size
    
    const handleUpdate = () => {
      debouncedUpdate();
    };

    const handleSelectionUpdate = () => {
      // Check if this is a font size change by looking at the current selection
      const selection = editor.state.selection;
      if (selection && !selection.empty) {
        const attrs = editor.getAttributes('textStyle');
        if (attrs.fontSize) {
          // Font size change detected - update immediately
          immediateUpdate();
        } else {
          debouncedUpdate();
        }
      } else {
        debouncedUpdate();
      }
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleSelectionUpdate);
    
    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, updateOverflowInfo]);

  // Initial calculation and resize observer
  useEffect(() => {
    updateOverflowInfo();
    
    // Set up ResizeObserver for more accurate overflow detection
    const resizeObserver = new ResizeObserver(() => {
      updateOverflowInfo();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateOverflowInfo]);

  // Handle margin changes from ruler
  const handleMarginChange = useCallback((margins: typeof pageLayout.margins) => {
    onMarginChange?.('top', margins.top);
    onMarginChange?.('bottom', margins.bottom);
    onMarginChange?.('left', margins.left);
    onMarginChange?.('right', margins.right);
  }, [onMarginChange]);

  const dimensions = calculateDimensions();

  // Calculate dynamic container height
  const containerHeight = useMemo(() => {
    if (!overflowInfo.isOverflowing) {
      return dimensions.height;
    }
    
    // When overflowing, extend the container to show all content
    const marginTop = pageLayout.margins.top * 3.7795275591;
    const marginBottom = pageLayout.margins.bottom * 3.7795275591;
    const baseHeight = dimensions.height;
    const contentHeight = overflowInfo.contentHeight;
    
    // Add some padding for visual breathing room
    const extendedHeight = contentHeight + marginTop + marginBottom + 40;
    
    return Math.max(baseHeight, extendedHeight);
  }, [dimensions.height, overflowInfo, pageLayout.margins]);


  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-muted/20 p-8 pb-20"
      style={{ height: 'calc(100vh - 200px)' }} // Fixed height to create overflow
    >
      {/* Ruler System Container */}
      <div 
        className="ruler-container mb-4"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center'
        }}
      >
        {/* Horizontal Ruler */}
        <div className="flex justify-center mb-2">
          <div style={{ width: '30px' }}></div> {/* Spacer for vertical ruler */}
          <RulerSystem
            pageLayout={pageLayout}
            zoomLevel={zoomLevel}
            onMarginChange={handleMarginChange}
            isRTL={true}
            type="horizontal"
          />
        </div>
        
        {/* Document with Vertical Ruler */}
        <div className="flex justify-center">
          {/* Vertical Ruler */}
          <div style={{ width: '30px' }}>
            <RulerSystem
              pageLayout={pageLayout}
              zoomLevel={zoomLevel}
              onMarginChange={handleMarginChange}
              isRTL={true}
              type="vertical"
            />
          </div>
          
          {/* Document Container with Dynamic Height */}
          <div
            ref={documentRef}
            className={`document-container transition-all duration-300 ease-in-out ${
              theme === 'dark' ? 'bg-card' : 'bg-white'
            } ${pageLayout.showMarginGuides ? 'show-margin-guides' : ''}`}
            style={{
              width: `${dimensions.width}px`,
              height: `${containerHeight}px`,
              margin: '0 auto',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '12px',
              overflow: 'visible', // Allow content to extend beyond container
              position: 'relative',
              // Set RTL-aware CSS custom properties for margin guides
              ...getRTLMarginCSSProperties(pageLayout.margins, true)
            } as React.CSSProperties}
          >


            {/* Content area with dynamic height */}
            <div 
              ref={contentRef}
              className={`editor-content transition-colors duration-200 ${
                theme === 'dark' ? 'text-foreground' : 'text-gray-900'
              }`}
              style={{
                width: '100%',
                minHeight: '100%',
                height: overflowInfo.isOverflowing ? 'auto' : '100%',
                position: 'relative',
                zIndex: 2,
                // Print-friendly styles
                orphans: 2,
                widows: 2
              }}
            >
              <EditorContent 
                editor={editor} 
                className="w-full prose-content"
                style={{
                  width: '100%',
                  minHeight: '100%',
                  ...getRTLMarginStyles(pageLayout.margins, true), // Use RTL-aware margins
                  overflow: 'visible',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  // Enhanced print-friendly styles
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                  MozHyphens: 'auto',
                  msHyphens: 'auto',
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale'
                }}
              />
            </div>

            {/* Page number - only show on first page or when not overflowing */}
            {(!overflowInfo.isOverflowing || overflowInfo.pageCount === 1) && (
              <div
                className="page-number"
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '15px',
                  background: theme === 'dark' ? '#374151' : '#f3f4f6',
                  color: theme === 'dark' ? '#d1d5db' : '#6b7280',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                  zIndex: 11,
                  pointerEvents: 'none'
                }}
              >
                1
              </div>
            )}

            {/* Page break indicators for multi-page content */}
            {showPageBreaks && overflowInfo.isOverflowing && overflowInfo.pageCount > 1 && (
              <div 
                className="page-break-indicators print-hidden"
                key={`page-breaks-${pageBreakPositions.join('-')}`} // Force re-render when positions change
              >
                {Array.from({ length: overflowInfo.pageCount - 1 }, (_, index) => {
                  // Use the actual page break positions instead of calculated positions
                  // This ensures indicators match the smart page breaks used in print preview
                  const marginTop = pageLayout.margins.top * 3.7795275591;
                  let breakPosition;
                  
                  if (pageBreakPositions && pageBreakPositions.length > index) {
                    // Use the smart page break position
                    breakPosition = pageBreakPositions[index];
                  } else {
                    // Fallback to calculated position
                    breakPosition = (index + 1) * overflowInfo.availableHeight + marginTop;
                  }
                  
                  const isCurrentPageBreak = currentPage === index + 1;
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`[Page Break Indicator ${index}]`, {
                      smartPosition: pageBreakPositions[index],
                      calculatedPosition: (index + 1) * overflowInfo.availableHeight + marginTop,
                      finalPosition: breakPosition,
                      isCurrentPageBreak
                    });
                  }
                  
                  return (
                    <div
                      key={index}
                      className="page-break-line print-hidden"
                      style={{
                        position: 'absolute',
                        top: `${breakPosition}px`,
                        left: '0',
                        right: '0',
                        height: isCurrentPageBreak ? '4px' : '3px',
                        background: `linear-gradient(90deg, 
                          transparent 0%, 
                          ${isCurrentPageBreak 
                            ? (theme === 'dark' ? '#3b82f6' : '#2563eb')
                            : (theme === 'dark' ? '#ef4444' : '#dc2626')
                          } 10%, 
                          ${isCurrentPageBreak 
                            ? (theme === 'dark' ? '#3b82f6' : '#2563eb')
                            : (theme === 'dark' ? '#ef4444' : '#dc2626')
                          } 90%, 
                          transparent 100%)`,
                        zIndex: 15,
                        pointerEvents: 'none',
                        boxShadow: `0 0 ${isCurrentPageBreak ? '12px' : '8px'} ${
                          isCurrentPageBreak 
                            ? (theme === 'dark' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(37, 99, 235, 0.4)')
                            : (theme === 'dark' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.3)')
                        }`
                      }}
                    >
                      <div
                        className="page-break-label print-hidden"
                        style={{
                          position: 'absolute',
                          right: '15px',
                          top: '-12px',
                          background: isCurrentPageBreak 
                            ? (theme === 'dark' ? '#3b82f6' : '#2563eb')
                            : (theme === 'dark' ? '#ef4444' : '#dc2626'),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          transform: isCurrentPageBreak ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Page {index + 2}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPageEditor;
