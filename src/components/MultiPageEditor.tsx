import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/react';
import { usePagination } from '../contexts/PaginationContext';
import { useTheme } from '../contexts/ThemeContext';
import { getPageDimensions, getContentDimensions, getRTLMarginStyles, getRTLMarginCSSProperties } from '../utils/dimensionUtils';

interface MultiPageEditorProps {
  editor: Editor | null;
  pageLayout: any;
  zoomLevel: number;
  getPageStyles: () => React.CSSProperties;
}

const MultiPageEditor: React.FC<MultiPageEditorProps> = ({
  editor,
  pageLayout,
  zoomLevel,
  getPageStyles
}) => {
  const { 
    pages, 
    currentPage, 
    updatePageContent, 
    addPage, 
    setPageHeight, 
    checkAndManagePages, 
    setCurrentPage,
    checkPageOverflow,
    getOverflowStatus,
    splitContentAtOverflow,
    reflowContent
  } = usePagination();
  const { theme } = useTheme();
  const [pageHeights, setPageHeights] = useState<{ [key: string]: number }>({});
  const pageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Get page dimensions in pixels using centralized utilities
  const calculateDimensions = useCallback(() => {
    const pageDims = getPageDimensions(
      pageLayout?.pageSize || 'A4',
      pageLayout?.customWidth,
      pageLayout?.customHeight,
      pageLayout?.orientation || 'portrait'
    );
    
    const contentDims = getContentDimensions(
      pageDims,
      pageLayout?.margins || { top: 20, bottom: 20, left: 20, right: 20 },
      zoomLevel
    );
    
    return contentDims;
  }, [pageLayout, zoomLevel]);

  // Enhanced overflow detection with intelligent content splitting
  const checkContentOverflow = useCallback(() => {
    if (!editor || !contentRef.current) return;

    const dimensions = calculateDimensions();
    const availableHeight = dimensions.height - dimensions.marginTop - dimensions.marginBottom;
    
    // Get the current page element
    const currentPageId = pages[currentPage]?.id;
    if (!currentPageId) return;
    
    const currentPageElement = pageRefs.current[currentPageId];
    if (!currentPageElement) return;

    const contentHeight = currentPageElement.scrollHeight;
    
    // Update overflow status in pagination context
    checkPageOverflow(currentPageId, contentHeight, availableHeight);
    
    if (contentHeight > availableHeight) {
      // Content overflows - try to find optimal break point
      const breakPoint = findOptimalBreakPoint(currentPageElement, contentHeight - availableHeight);
      
      if (breakPoint) {
        // Split content at the optimal break point
        splitContentAtOverflow(currentPageId, breakPoint);
      } else {
        // Fallback: create new page and move cursor
        if (currentPage === pages.length - 1) {
          addPage();
          setTimeout(() => {
            setCurrentPage(pages.length);
          }, 100);
        } else {
          setCurrentPage(currentPage + 1);
        }
      }
    }
  }, [editor, pages, currentPage, getPageDimensions, addPage, setCurrentPage, checkPageOverflow, splitContentAtOverflow]);

  // Find optimal break point for content splitting
  const findOptimalBreakPoint = useCallback((pageElement: HTMLElement, overflowAmount: number) => {
    const contentElement = pageElement.querySelector('.ProseMirror');
    if (!contentElement) return null;

    // Try to find paragraph boundaries first
    const paragraphs = contentElement.querySelectorAll('p');
    let accumulatedHeight = 0;
    
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const paragraph = paragraphs[i] as HTMLElement;
      const paragraphHeight = paragraph.offsetHeight;
      
      if (accumulatedHeight + paragraphHeight > overflowAmount) {
        // This paragraph causes overflow, try to split it
        return findBreakPointInParagraph(paragraph, overflowAmount - accumulatedHeight);
      }
      
      accumulatedHeight += paragraphHeight;
    }
    
    return null;
  }, []);

  // Find break point within a paragraph
  const findBreakPointInParagraph = useCallback((paragraph: HTMLElement, maxHeight: number) => {
    const text = paragraph.textContent || '';
    const words = text.split(/\s+/);
    
    // Simple heuristic: split at word boundary
    const splitIndex = Math.floor(words.length * 0.7);
    return splitIndex;
  }, []);

  // Enhanced content monitoring with ResizeObserver
  useEffect(() => {
    if (!editor) return;

    let timeoutId: NodeJS.Timeout;
    
    const handleUpdate = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce the overflow check
      timeoutId = setTimeout(() => {
        checkContentOverflow();
      }, 150);
    };

    // Listen to multiple editor events
    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor, checkContentOverflow]);

  // Set up ResizeObserver for page elements
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const pageId = entry.target.getAttribute('data-page-id');
        if (pageId) {
          const dimensions = calculateDimensions();
          const availableHeight = dimensions.height - dimensions.marginTop - dimensions.marginBottom;
          checkPageOverflow(pageId, entry.contentRect.height, availableHeight);
        }
      });
    });

    // Observe all page elements
    pages.forEach(page => {
      const pageElement = pageRefs.current[page.id];
      if (pageElement) {
        resizeObserver.observe(pageElement);
      }
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [pages, getPageDimensions, checkPageOverflow]);

  // Update page heights when content changes
  useEffect(() => {
    const updateHeights = () => {
      const newHeights: { [key: string]: number } = {};
      pages.forEach(page => {
        const pageElement = pageRefs.current[page.id];
        if (pageElement) {
          const height = pageElement.scrollHeight;
          newHeights[page.id] = height;
          setPageHeight(page.id, height);
        }
      });
      setPageHeights(newHeights);
    };

    const timeoutId = setTimeout(updateHeights, 100);
    return () => clearTimeout(timeoutId);
  }, [pages, setPageHeight]);

  if (!editor) return null;

  const dimensions = calculateDimensions();

  return (
    <div className="flex-1 overflow-y-auto bg-muted/20 p-8 pb-20">
      <div 
        className="mx-auto"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center'
        }}
      >
        {/* Render all pages */}
        {pages.map((page, index) => (
          <div key={page.id} className="mb-8 last:mb-0">
            <div 
              ref={(el) => { pageRefs.current[page.id] = el; }}
              data-page={index}
              data-page-id={page.id}
              className={`doc-page shadow-2xl transition-colors duration-200 ${
                theme === 'dark' ? 'bg-card' : 'bg-white'
              } ${pageLayout.showMarginGuides ? 'show-margin-guides' : ''} ${
                index === currentPage ? 'ring-1 ring-primary/20' : ''
              } ${page.isOverflowing ? 'ring-2 ring-red-500/50' : ''}`}
              style={{
                ...getPageStyles(),
                // Ensure page maintains fixed dimensions
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                maxHeight: `${dimensions.height}px`,
                overflow: 'hidden', // Prevent content from expanding the page
                position: 'relative',
                // Print-friendly styles
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }}
            >
              {/* Page Number */}
              <div className={`absolute bottom-2 right-4 text-xs font-medium ${
                theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'
              }`}>
                {page.pageNumber || index + 1}
              </div>

              {/* Overflow Warning */}
              {page.isOverflowing && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                  Overflow
                </div>
              )}

              {/* Editor Content Container */}
              <div 
                ref={index === currentPage ? contentRef : null}
                className={`transition-colors duration-200 ${
                  theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                }`}
                style={{
                  minHeight: '100%',
                  width: '100%',
                  padding: `${dimensions.marginTop}px ${dimensions.marginRight}px ${dimensions.marginBottom}px ${dimensions.marginLeft}px`,
                  boxSizing: 'border-box',
                  overflow: 'hidden', // Prevent content from expanding the page
                  position: 'relative',
                  // Print-friendly styles
                  orphans: 2,
                  widows: 2
                }}
              >
                {index === currentPage ? (
                  <EditorContent 
                    editor={editor} 
                    className="w-full prose-content"
                    style={{
                      minHeight: '100%',
                      width: '100%',
                      overflow: 'hidden',
                      // Apply RTL-aware margins
                      ...getRTLMarginStyles(pageLayout.margins, true),
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
                ) : (
                  <div 
                    className="w-full prose-content"
                    style={{
                      minHeight: '100%',
                      width: '100%',
                      overflow: 'hidden',
                      // Apply RTL-aware margins
                      ...getRTLMarginStyles(pageLayout.margins, true),
                      // Enhanced print-friendly styles
                      hyphens: 'auto',
                      WebkitHyphens: 'auto',
                      MozHyphens: 'auto',
                      msHyphens: 'auto',
                      textRendering: 'optimizeLegibility',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale'
                    }}
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                )}
              </div>

              {/* Smart Page Controls */}
              {index === currentPage && (
                <div className="absolute bottom-2 left-4 flex gap-2">
                  <button
                    onClick={() => addPage()}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded bg-background/50"
                    title="Add new page"
                  >
                    + Page
                  </button>
                  {page.isOverflowing && (
                    <button
                      onClick={() => splitContentAtOverflow(page.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded bg-red-500/10"
                      title="Split content at overflow"
                    >
                      Split
                    </button>
                  )}
                  {index > 0 && (
                    <button
                      onClick={() => reflowContent()}
                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors px-2 py-1 rounded bg-blue-500/10"
                      title="Reflow content across pages"
                    >
                      Reflow
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiPageEditor;
