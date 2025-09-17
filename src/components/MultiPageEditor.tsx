/**
 * Multi-Page Editor Component
 * Renders separate page containers like Word, with proper margin support and JSON document model
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { EditorContent } from '@tiptap/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSimplePagination } from '../contexts/SimplePaginationContext';
import { getPageDimensions, getRTLMarginStyles, getRTLMarginCSSProperties } from '../utils/dimensionUtils';
import RulerSystem from './RulerSystem';
import { cn } from '../lib/utils';
import { documentToHtmlString } from '../document/serialization';
import { type PageLayout } from '../types';
// Simple debounce function fallback
const createSimpleDebounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

interface MultiPageEditorProps {
  editor: any;
  pageLayout: PageLayout;
  zoomLevel: number;
  currentPage?: number;
  onPageCountChange?: (pageCount: number) => void;
  onMarginChange?: (side: 'top' | 'bottom' | 'left' | 'right', value: number) => void;
  onPageChange?: (page: number) => void;
}

const MultiPageEditor: React.FC<MultiPageEditorProps> = ({
  editor,
  pageLayout,
  zoomLevel,
  currentPage: externalCurrentPage,
  onPageCountChange,
  onMarginChange,
  onPageChange
}) => {
  const { language } = useLanguage();
  
  // Use simple pagination context consistently
  const paginationContext = useSimplePagination();
  
  // Simple state management
  
  const { 
    document, 
    getPages,
    getCurrentPageContent,
    getPageContent,
    currentPage: contextCurrentPage,
    totalPages,
    setCurrentPage: setContextCurrentPage,
    updateFromTipTap,
    handleContentOverflow,
    isUpdating
  } = paginationContext;

  // Simplified - no complex text shaping needed
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageRefs, setPageRefs] = useState<React.RefObject<HTMLDivElement>[]>([]);

  // Calculate page dimensions (inline to avoid dependency issues)

  // Get pages from unified document
  const pages = getPages();
  
  // Debug: Log pages when they change (use length to avoid infinite loops)
  useEffect(() => {
    console.log('[MultiPageEditor] Pages updated:', {
      pageCount: pages.length,
      pages: pages.map((page, index) => ({
        index,
        id: page.id,
        hasContent: !!page.content
      }))
    });
  }, [pages.length]); // Only depend on length to avoid infinite loops

  // Debug: Log document changes
  useEffect(() => {
    console.log('[MultiPageEditor] Document updated:', {
      hasContent: !!document.content,
      contentLength: document.content?.length || 0,
      pageBreaks: document.content?.filter(node => node.type === 'pageBreak').length || 0
    });
  }, [document]);

  // Process pages with HarfBuzz text shaping
  const [resolvedPages, setResolvedPages] = useState(() => 
    pages.map((page: any) => ({
      ...page,
      processedBlocks: [],
      isShaped: false,
    }))
  );
  
  // Simplified page processing (use length to avoid infinite loops)
  useEffect(() => {
    setResolvedPages(pages.map((page: any) => ({
      ...page,
      processedBlocks: [],
      isShaped: false,
    })));
  }, [pages.length]); // Only depend on length to avoid infinite loops

  // Initialize page refs when pages change
  useEffect(() => {
    const newPageRefs = resolvedPages.map(() => React.createRef<HTMLDivElement>());
    setPageRefs(newPageRefs);
  }, [resolvedPages.length]);

  // Update page count when pages change
  useEffect(() => {
    console.log('[MultiPageEditor] Page count changed:', totalPages, 'Pages:', pages.length);
    onPageCountChange?.(totalPages);
  }, [totalPages, pages.length]); // Removed onPageCountChange to avoid infinite loops

  // Simple page synchronization
  useEffect(() => {
    if (externalCurrentPage !== undefined && externalCurrentPage !== contextCurrentPage) {
      setContextCurrentPage(externalCurrentPage);
    }
  }, [externalCurrentPage, contextCurrentPage, setContextCurrentPage]);

  useEffect(() => {
    if (onPageChange && contextCurrentPage !== externalCurrentPage) {
      onPageChange(contextCurrentPage);
    }
  }, [contextCurrentPage, externalCurrentPage, onPageChange]);

  // Sync editor content with current page when page changes
  useEffect(() => {
    if (!editor || totalPages === 0) return;

    // If we have multiple pages (page breaks), show the entire document
    // Otherwise, show only the current page content
    if (totalPages > 1) {
      // Show entire document with page breaks
      const htmlContent = documentToHtmlString(document);
      editor.commands.setContent(htmlContent);
      console.log('[MultiPageEditor] Updated editor with full document (multiple pages)');
    } else {
      // Show only current page content
      const pageContent = getCurrentPageContent();
      if (pageContent) {
        const htmlContent = documentToHtmlString(pageContent);
        editor.commands.setContent(htmlContent);
        console.log('[MultiPageEditor] Updated editor with current page content');
      } else {
        editor.commands.setContent('');
      }
    }
  }, [contextCurrentPage, totalPages]); // Removed document and editor to prevent infinite loops

  // Enhanced overflow detection with performance optimization (only for single page)
  useEffect(() => {
    if (!editor) return;
    
    // Only run overflow detection if we have a single page
    if (totalPages > 1) {
      console.log('[MultiPageEditor] Multiple pages detected, skipping overflow detection');
      return () => {}; // Return empty cleanup function
    }

    const checkOverflowAndCreatePages = () => {
      try {
        console.log('[MultiPageEditor] Checking overflow...');
        
        // Validate editor element
        const editorElement = window.document.querySelector('.ProseMirror') as HTMLElement;
        if (!editorElement) {
          console.warn('[MultiPageEditor] No editor element found');
          return;
        }

        // Validate page layout
        if (!pageLayout || !pageLayout.margins) {
          console.warn('[MultiPageEditor] Invalid page layout configuration');
          return;
        }

        // Calculate dimensions inline to avoid dependency issues
        let pageDims;
        try {
          pageDims = getPageDimensions(
            pageLayout?.pageSize || 'A4',
            pageLayout?.customWidth,
            pageLayout?.customHeight,
            pageLayout?.orientation || 'portrait'
          );
        } catch (error) {
          console.error('[MultiPageEditor] Error calculating page dimensions:', error);
          return;
        }
        
        // Validate page dimensions
        if (!pageDims || isNaN(pageDims.width) || isNaN(pageDims.height) || pageDims.width <= 0 || pageDims.height <= 0) {
          console.warn('[MultiPageEditor] Invalid page dimensions:', pageDims);
          return;
        }
        
        // Convert margins with validation
        const marginTop = (pageLayout.margins.top || 0) * 3.7795275591; // mm to px conversion
        const marginBottom = (pageLayout.margins.bottom || 0) * 3.7795275591;
        const marginLeft = (pageLayout.margins.left || 0) * 3.7795275591;
        const marginRight = (pageLayout.margins.right || 0) * 3.7795275591;
        
        // Validate margin calculations
        if (isNaN(marginTop) || isNaN(marginBottom) || isNaN(marginLeft) || isNaN(marginRight)) {
          console.warn('[MultiPageEditor] Invalid margin calculations:', {
            marginTop, marginBottom, marginLeft, marginRight,
            originalMargins: pageLayout.margins
          });
          return;
        }
        
        const pageDimensions = {
          width: pageDims.width,
          height: pageDims.height,
          marginTop,
          marginBottom,
          marginLeft,
          marginRight
        };
        
        // Use unified overflow detection system
        import('../utils/pageBreakUtils').then(({ calculateOverflowInfo }) => {
          try {
            const overflowInfo = calculateOverflowInfo(editorElement, pageDimensions);
            
            // Validate overflow info
            if (!overflowInfo || typeof overflowInfo.isOverflowing !== 'boolean') {
              console.warn('[MultiPageEditor] Invalid overflow info received:', overflowInfo);
              return;
            }
            
            console.log('[MultiPageEditor] Overflow info:', {
              isOverflowing: overflowInfo.isOverflowing,
              pageCount: overflowInfo.pageCount,
              contentHeight: overflowInfo.contentHeight,
              availableHeight: overflowInfo.availableHeight,
              overflowAmount: overflowInfo.overflowAmount
            });
            
            // Handle overflow - allow creating additional page breaks as content grows
            if (overflowInfo.isOverflowing && overflowInfo.pageCount > totalPages) {
              console.log('[MultiPageEditor] Content is overflowing, calling handleContentOverflow...', {
                currentPages: totalPages,
                neededPages: overflowInfo.pageCount,
                isOverflowing: overflowInfo.isOverflowing
              });
              // Call the pagination context's overflow handler
              handleContentOverflow(overflowInfo, pageLayout);
            } else if (overflowInfo.isOverflowing && overflowInfo.pageCount <= totalPages) {
              console.log('[MultiPageEditor] Content is overflowing but page breaks are sufficient', {
                currentPages: totalPages,
                neededPages: overflowInfo.pageCount
              });
            } else {
              console.log('[MultiPageEditor] Content fits within page limits');
            }
          } catch (error) {
            console.error('[MultiPageEditor] Error processing overflow info:', error);
          }
        }).catch((error) => {
          console.error('[MultiPageEditor] Error importing pageBreakUtils:', error);
        });
      } catch (error) {
        console.error('[MultiPageEditor] Error in overflow detection:', error);
      }
    };

    // Create debounced version for performance optimization
    const debouncedCheckOverflow = createSimpleDebounce(
      checkOverflowAndCreatePages,
      300 // 300ms debounce delay
    );

    // Check overflow on editor updates
    const handleUpdate = () => {
      try {
        // Validate editor and editor state
        if (!editor || !editor.state || !editor.state.doc) {
          console.warn('[MultiPageEditor] Invalid editor state in handleUpdate');
          return;
        }

        // Update the unified document using the unified method
        const editorState = editor.state;
        updateFromTipTap(editorState.doc);
        
        // Use debounced overflow check for better performance
        debouncedCheckOverflow();
      } catch (error) {
        console.error('[MultiPageEditor] Error in handleUpdate:', error);
      }
    };

    editor.on('update', handleUpdate);
    
    // Initial check
    const initialTimeout = setTimeout(checkOverflowAndCreatePages, 200);
    
    return () => {
      editor.off('update', handleUpdate);
      clearTimeout(initialTimeout);
    };
  }, [editor, updateFromTipTap, handleContentOverflow, totalPages]); // Added totalPages to prevent overflow handling when pages exist

  // Simple overflow detection trigger - run every 2 seconds to test (only for single page)
  useEffect(() => {
    if (!editor) {
      console.log('[MultiPageEditor] No editor available for overflow detection');
      return;
    }
    
    // Only run periodic overflow detection if we have a single page
    if (totalPages > 1) {
      console.log('[MultiPageEditor] Multiple pages detected, skipping periodic overflow detection');
      return () => {}; // Return empty cleanup function
    }
    
    console.log('[MultiPageEditor] Setting up periodic overflow detection for single page...');
    
    const checkOverflow = () => {
      console.log('[MultiPageEditor] Running periodic overflow check...');
      const editorElement = window.document.querySelector('.ProseMirror') as HTMLElement;
      
      if (!editorElement) {
        console.log('[MultiPageEditor] No editor element found for overflow check');
        return;
      }
      
      console.log('[MultiPageEditor] Editor element found, checking overflow...');
      
      // Calculate dimensions inline to avoid dependency issues
      const pageDims = getPageDimensions(
        pageLayout?.pageSize || 'A4',
        pageLayout?.customWidth,
        pageLayout?.customHeight,
        pageLayout?.orientation || 'portrait'
      );
      
      const marginTop = pageLayout.margins.top * 3.7795275591;
      const marginBottom = pageLayout.margins.bottom * 3.7795275591;
      const marginLeft = pageLayout.margins.left * 3.7795275591;
      const marginRight = pageLayout.margins.right * 3.7795275591;
      
      const pageDimensions = {
        width: pageDims.width,
        height: pageDims.height,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight
      };
      
      import('../utils/pageBreakUtils').then(({ calculateOverflowInfo }) => {
        const overflowInfo = calculateOverflowInfo(editorElement, pageDimensions);
        
        console.log('[MultiPageEditor] Periodic overflow check result:', {
          isOverflowing: overflowInfo.isOverflowing,
          pageCount: overflowInfo.pageCount,
          contentHeight: overflowInfo.contentHeight,
          availableHeight: overflowInfo.availableHeight,
          overflowAmount: overflowInfo.overflowAmount
        });
        
        // Only handle overflow if we don't already have page breaks in the document
        if (overflowInfo.isOverflowing && overflowInfo.pageCount > 1 && totalPages === 1) {
          console.log('[MultiPageEditor] Periodic check detected overflow, calling handleContentOverflow...');
          handleContentOverflow(overflowInfo, pageLayout);
        } else if (overflowInfo.isOverflowing && totalPages > 1) {
          console.log('[MultiPageEditor] Periodic check: overflow detected but page breaks already exist, stopping periodic checks...');
          clearInterval(intervalId);
        }
      }).catch(error => {
        console.error('[MultiPageEditor] Error in periodic overflow check:', error);
      });
    };
    
    // Run immediately
    checkOverflow();
    
    // Run every 2 seconds for testing (only if single page)
    const intervalId = setInterval(checkOverflow, 2000);
    
    return () => {
      console.log('[MultiPageEditor] Cleaning up periodic overflow detection');
      clearInterval(intervalId);
    };
  }, [editor, handleContentOverflow, totalPages]); // Added totalPages to stop periodic checks when pages exist

  // Handle margin changes from ruler
  const handleMarginChange = useCallback((margins: typeof pageLayout.margins) => {
    onMarginChange?.('top', margins.top);
    onMarginChange?.('bottom', margins.bottom);
    onMarginChange?.('left', margins.left);
    onMarginChange?.('right', margins.right);
  }, [onMarginChange]);

  // Handle page click
  const handlePageClick = useCallback((pageIndex: number) => {
    console.log('[MultiPageEditor] Page clicked:', pageIndex, 'Current page:', contextCurrentPage);
    setContextCurrentPage(pageIndex);
    onPageChange?.(pageIndex);
  }, [setContextCurrentPage, onPageChange, contextCurrentPage]);

  // Calculate page dimensions inline to avoid dependency issues
  const dimensions = useMemo(() => {
    return getPageDimensions(
      pageLayout?.pageSize || 'A4',
      pageLayout?.customWidth,
      pageLayout?.customHeight,
      pageLayout?.orientation || 'portrait'
    );
  }, [pageLayout?.pageSize, pageLayout?.customWidth, pageLayout?.customHeight, pageLayout?.orientation]);

  // Calculate page spacing
  const pageSpacing = 40; // Space between pages

  // Calculate total container height
  const totalHeight = useMemo(() => {
    return pages.length * (dimensions.height + pageSpacing) + pageSpacing;
  }, [pages.length, dimensions.height, pageSpacing]);

  // Calculate vertical ruler height (only page content, no spacing)
  const verticalRulerHeight = useMemo(() => {
    return pages.length * dimensions.height;
  }, [pages.length, dimensions.height]);

  // Render individual page
  const renderPage = useCallback((page: any, pageIndex: number) => {
    const isCurrentPage = contextCurrentPage === pageIndex;
    
    // Get page content from document
    const pageContent = getPageContent(pageIndex);
    
    // Debug: Log page rendering
    console.log(`[MultiPageEditor] Rendering page ${pageIndex}:`, {
      isCurrentPage,
      hasPageContent: !!pageContent,
      pageId: page.id
    });
    
    return (
      <div
        key={page.id}
        ref={pageRefs[pageIndex]}
        className={cn(
          "relative cursor-pointer transition-all duration-200",
          "rounded-lg border bg-card shadow-sm",
          isCurrentPage && "ring-2 ring-ring ring-offset-2",
          pageLayout.showMarginGuides && "show-margin-guides"
        )}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          margin: `${pageSpacing / 2}px 0`,
          ...getRTLMarginCSSProperties(pageLayout.margins, true)
        }}
        onClick={() => handlePageClick(pageIndex)}
      >

        {/* Content area - streamlined */}
        <div 
          className="absolute inset-0 z-10 text-foreground"
          style={{
            ...getRTLMarginStyles(pageLayout.margins, true),
            orphans: 2,
            widows: 2,
            overflow: 'hidden'
          }}
        >
          {/* Render page content */}
          {isCurrentPage ? (
            <EditorContent 
              editor={editor} 
              className="h-full w-full overflow-hidden prose-content"
              style={{
                fontFamily: 'Noto Nastaliq Urdu, serif',
                direction: 'rtl',
                textAlign: 'right',
                hyphens: 'auto',
                textRendering: 'optimizeLegibility'
              }}
            />
          ) : pageContent ? (
            <div
              className="h-full w-full overflow-hidden font-nastaliq"
              style={{ direction: 'rtl', textAlign: 'right', hyphens: 'auto' }}
              dangerouslySetInnerHTML={{ __html: documentToHtmlString(pageContent) }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground italic font-nastaliq" style={{ direction: 'rtl' }}>
              {language === 'ur' ? 'لکھنے کے لیے کلک کریں...' : 'Click to start typing...'}
            </div>
          )}
        </div>


        {/* Margin guides */}
        {pageLayout.showMarginGuides && (
          <div className="absolute inset-0 pointer-events-none z-0 show-margin-guides" />
        )}
      </div>
    );
  }, [
    contextCurrentPage, 
    dimensions, 
    pageSpacing, 
    pageLayout, 
    getPageContent, 
    handlePageClick,
    language
  ]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-muted/20 p-8 pb-20"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      {/* Real-time pagination indicator */}
      {isUpdating && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-3 py-1 rounded-full text-sm shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Updating pages...
        </div>
      )}
      {/* Ruler System Container - aligned to match page positioning */}
      <div 
        className="ruler-container mb-4"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center'
        }}
      >
        {/* Horizontal Ruler */}
        <div className="flex justify-center" style={{ marginBottom: '0px', marginTop: `${pageSpacing / 4}px` }}>
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
        <div className="flex justify-center items-start">
          {/* Vertical Ruler */}
          <div style={{ 
            width: '30px', 
            height: `${verticalRulerHeight}px`,
            marginTop: `${pageSpacing / 2}px`, // Align with page margins
            marginRight: '8px' // Add spacing between ruler and page
          }}>
            <RulerSystem
              pageLayout={pageLayout}
              zoomLevel={zoomLevel}
              onMarginChange={handleMarginChange}
              isRTL={true}
              type="vertical"
              {...({ containerHeight: verticalRulerHeight } as any)}
            />
          </div>
          
          {/* Pages Container - positioned to align with rulers */}
          <div
            className="pages-container"
            style={{
              width: `${dimensions.width}px`,
              minHeight: `${totalHeight}px`,
              position: 'relative'
            }}
          >
            {/* Render all pages */}
            {resolvedPages.map((page: any, index: number) => renderPage(page, index))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiPageEditor;
