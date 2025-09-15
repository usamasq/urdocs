import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/react';
import { usePagination } from '../contexts/PaginationContext';
import { useTheme } from '../contexts/ThemeContext';
import { getPageDimensions, getContentDimensions, getRTLPaddingStyles, getRTLMarginCSSProperties } from '../utils/dimensionUtils';

interface SimplifiedMultiPageEditorProps {
  editor: Editor | null;
  pageLayout: any;
  zoomLevel: number;
  getPageStyles: () => React.CSSProperties;
}

const SimplifiedMultiPageEditor: React.FC<SimplifiedMultiPageEditorProps> = ({
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
    setCurrentPage,
    totalPages
  } = usePagination();
  const { theme } = useTheme();
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

  // Simple overflow detection
  const checkContentOverflow = useCallback(() => {
    if (!editor || !contentRef.current) return;

    const dimensions = calculateDimensions();
    const availableHeight = dimensions.height - dimensions.marginTop - dimensions.marginBottom;
    
    // Get the current page element
    const currentPageElement = pageRefs.current[pages[currentPage]?.id];
    if (!currentPageElement) return;

    const contentHeight = currentPageElement.scrollHeight;
    
    // If content overflows, add a new page
    if (contentHeight > availableHeight) {
      addPage();
      setTimeout(() => {
        setCurrentPage(pages.length);
      }, 100);
    }
  }, [editor, pages, currentPage, getPageDimensions, addPage, setCurrentPage]);

  // Monitor content changes
  useEffect(() => {
    if (!editor) return;

    let timeoutId: NodeJS.Timeout;
    
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkContentOverflow, 300);
    };

    editor.on('update', handleUpdate);
    return () => {
      clearTimeout(timeoutId);
      editor.off('update', handleUpdate);
    };
  }, [editor, checkContentOverflow]);

  // Update page content when editor content changes
  useEffect(() => {
    if (!editor || !pages[currentPage]) return;

    const handleUpdate = () => {
      const content = editor.getHTML();
      updatePageContent(pages[currentPage].id, content);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, pages, currentPage, updatePageContent]);

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
              }`}
              style={{
                ...getPageStyles(),
                // Ensure page maintains fixed dimensions
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                maxHeight: `${dimensions.height}px`,
                overflow: 'hidden',
                position: 'relative',
                // Set RTL-aware CSS custom properties for margin guides
                ...getRTLMarginCSSProperties(pageLayout.margins, true),
                // Print-friendly styles
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              } as React.CSSProperties}
            >
              {/* Page Number */}
              <div className={`absolute bottom-2 right-4 text-xs font-medium ${
                theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'
              }`}>
                {index + 1}
              </div>

              {/* Editor Content Container */}
              <div 
                ref={index === currentPage ? contentRef : null}
                className={`transition-colors duration-200 ${
                  theme === 'dark' ? 'text-foreground' : 'text-gray-900'
                }`}
                style={{
                  minHeight: '100%',
                  width: '100%',
                  ...getRTLPaddingStyles(pageLayout.margins, true), // Use RTL-aware padding
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 2,
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

              {/* Page Controls */}
              {index === currentPage && (
                <div className="absolute bottom-2 left-4 flex gap-2">
                  <button
                    onClick={() => addPage()}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded bg-background/50"
                    title="Add new page"
                  >
                    + Page
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimplifiedMultiPageEditor;
