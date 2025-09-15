import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { useTheme } from '../contexts/ThemeContext';
import { debugPagination } from '../utils/paginationDebug';
import { getPageDimensions, getContentDimensions, getRTLMarginStyles, getRTLMarginCSSProperties } from '../utils/dimensionUtils';
import Ruler from './Ruler';

interface EnhancedContinuousEditorProps {
  editor: any;
  pageLayout: any;
  zoomLevel: number;
  onPageCountChange?: (pageCount: number) => void;
  onMarginChange?: (side: 'top' | 'bottom' | 'left' | 'right', value: number) => void;
}

const EnhancedContinuousEditor: React.FC<EnhancedContinuousEditorProps> = ({
  editor,
  pageLayout,
  zoomLevel,
  onPageCountChange,
  onMarginChange
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Calculate page dimensions using centralized utilities
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
    
    return {
      ...contentDims,
      widthMm: pageDims.widthMm,
      heightMm: pageDims.heightMm
    };
  }, [pageLayout, zoomLevel]);

  // Simple and effective page count calculation
  const calculatePageCount = useCallback(() => {
    if (!contentRef.current || !editor) return;

    const dimensions = calculateDimensions();
    // Calculate available content area height (page height minus top and bottom margins)
    const contentAreaHeight = dimensions.height - dimensions.marginTop - dimensions.marginBottom;
    
    // Get the editor content element
    const editorElement = contentRef.current.querySelector('.ProseMirror');
    if (!editorElement) return;

    // Calculate content height
    const contentHeight = editorElement.scrollHeight;
    
    // Debug logging
    debugPagination.logPageDimensions(dimensions);
    debugPagination.logContentOverflow(contentHeight, contentAreaHeight);
    
    // Simple calculation: if content exceeds one page, create more pages
    const newPageCount = Math.max(1, Math.ceil(contentHeight / contentAreaHeight));
    const overflowing = contentHeight > contentAreaHeight;
    
    debugPagination.logPageCount(newPageCount, overflowing ? 'Content overflowed' : 'Single page sufficient');
    
    setPageCount(newPageCount);
    setIsOverflowing(overflowing);
    onPageCountChange?.(newPageCount);
  }, [calculateDimensions, onPageCountChange, editor]);

  // Monitor content changes with simple debouncing
  useEffect(() => {
    if (!editor) return;

    let timeoutId: NodeJS.Timeout;
    
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculatePageCount, 200);
    };

    editor.on('update', handleUpdate);
    return () => {
      clearTimeout(timeoutId);
      editor.off('update', handleUpdate);
    };
  }, [editor, calculatePageCount]);

  // Initial calculation
  useEffect(() => {
    calculatePageCount();
  }, [calculatePageCount]);

  const dimensions = calculateDimensions();

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-muted/20 p-8 pb-20"
      style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top center'
      }}
    >
      {/* Consistent Layout Structure */}
      <div className="ruler-container">
        {/* Horizontal Ruler - Always present but conditionally visible */}
        <div className="flex justify-center">
          {/* Vertical ruler space - Always present to maintain layout */}
          <div style={{ 
            width: pageLayout.showMarginGuides ? '30px' : '0px', 
            height: pageLayout.showMarginGuides ? '30px' : '0px',
            transition: 'width 0.2s ease, height 0.2s ease'
          }}></div>
          {pageLayout.showMarginGuides && (
            <Ruler
              type="horizontal"
              pageWidth={dimensions.widthMm}
              pageHeight={dimensions.heightMm}
              margins={pageLayout.margins}
              onMarginChange={onMarginChange || (() => {})}
              zoomLevel={zoomLevel}
              isVisible={pageLayout.showMarginGuides}
              isRTL={true}
            />
          )}
        </div>
        
        {/* Page with Vertical Ruler - Always present */}
        <div className="flex justify-center">
          {/* Vertical Ruler - Always present but conditionally visible */}
          <div style={{ 
            width: pageLayout.showMarginGuides ? '30px' : '0px',
            transition: 'width 0.2s ease'
          }}>
            {pageLayout.showMarginGuides && (
              <Ruler
                type="vertical"
                pageWidth={dimensions.widthMm}
                pageHeight={dimensions.heightMm}
                margins={pageLayout.margins}
                onMarginChange={onMarginChange || (() => {})}
                zoomLevel={zoomLevel}
                isVisible={pageLayout.showMarginGuides}
                isRTL={true}
              />
            )}
          </div>
          
          {/* Single page container - Always centered */}
          <div
            ref={contentRef}
            className={`enhanced-continuous-editor transition-colors duration-200 ${
              theme === 'dark' ? 'bg-card' : 'bg-white'
            } ${pageLayout.showMarginGuides ? 'show-margin-guides' : ''} ${
              isOverflowing ? 'overflow-warning' : ''
            }`}
            data-page="0"
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              margin: '0 auto',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              // Set RTL-aware CSS custom properties for margin guides
              ...getRTLMarginCSSProperties(pageLayout.margins, true)
            } as React.CSSProperties}
          >
        {/* Overflow Warning */}
        {isOverflowing && (
          <div className="overflow-indicator">
            <div className="overflow-warning-badge">
              {pageCount} Page{pageCount > 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Content area */}
        <div 
          className={`editor-content transition-colors duration-200 ${
            theme === 'dark' ? 'text-foreground' : 'text-gray-900'
          }`}
          style={{
            width: '100%',
            height: '100%',
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
              height: '100%',
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

            {/* Single page number */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedContinuousEditor;
