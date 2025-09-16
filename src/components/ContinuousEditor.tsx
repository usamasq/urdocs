import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { useTheme } from '../contexts/ThemeContext';
import { usePagination } from '../contexts/PaginationContext';
import { getPageDimensions, getContentDimensions, getRTLPaddingStyles } from '../utils/dimensionUtils';
import { calculateOverflowInfo, type PageDimensions } from '../utils/pageBreakUtils';

interface ContinuousEditorProps {
  editor: any;
  pageLayout: any;
  zoomLevel: number;
  onPageCountChange?: (pageCount: number) => void;
}

const ContinuousEditor: React.FC<ContinuousEditorProps> = ({
  editor,
  pageLayout,
  zoomLevel,
  onPageCountChange
}) => {
  const { theme } = useTheme();
  const { } = usePagination();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [overflowAmount, setOverflowAmount] = useState(0);

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
    
    return contentDims;
  }, [pageLayout, zoomLevel]);

  // Enhanced page count calculation with intelligent overflow detection
  const calculatePageCount = useCallback(() => {
    if (!contentRef.current || !editor) return;

    const dimensions = calculateDimensions();
    
    // Get the editor content element
    const editorElement = contentRef.current.querySelector('.ProseMirror') as HTMLElement;
    if (!editorElement) return;

    // Use centralized overflow calculation
    const pageDimensions: PageDimensions = {
      width: dimensions.width,
      height: dimensions.height,
      marginTop: dimensions.marginTop,
      marginBottom: dimensions.marginBottom,
      marginLeft: dimensions.marginLeft,
      marginRight: dimensions.marginRight
    };

    const overflowInfo = calculateOverflowInfo(editorElement, pageDimensions);
    
    setIsOverflowing(overflowInfo.isOverflowing);
    setOverflowAmount(overflowInfo.overflowAmount);
    setPageCount(overflowInfo.pageCount);
    onPageCountChange?.(overflowInfo.pageCount);
    
    // Update pagination context with overflow information
    // Note: checkPageOverflow is not available in this context
  }, [calculateDimensions, onPageCountChange, editor]);


  // Debounced content monitoring for better performance
  useEffect(() => {
    if (!editor) return;

    let timeoutId: NodeJS.Timeout;
    
    const handleUpdate = () => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce the calculation to avoid excessive recalculations
      timeoutId = setTimeout(() => {
        calculatePageCount();
      }, 150);
    };

    // Listen to multiple editor events for comprehensive monitoring
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
  }, [editor, calculatePageCount]);

  // Initial calculation and resize observer
  useEffect(() => {
    calculatePageCount();
    
    // Set up ResizeObserver for more accurate measurements
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculatePageCount, 100);
    });
    
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
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
      {/* Multi-page layout using CSS columns */}
      <div
        ref={contentRef}
        className={`multi-page-editor transition-colors duration-200 ${
          theme === 'dark' ? 'bg-card' : 'bg-white'
        } ${pageLayout.showMarginGuides ? 'show-margin-guides' : ''} ${
          isOverflowing ? 'overflow-warning' : ''
        }`}
        data-page="0"
        style={{
          width: `${dimensions.width * pageCount}px`,
          height: `${dimensions.height}px`,
          margin: '0 auto',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          // Use CSS columns to create page-like layout
          columnCount: pageCount,
          columnGap: '0px',
          columnFill: 'auto',
          // Print-friendly styles
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        {/* Overflow Warning */}
        {isOverflowing && (
          <div className="overflow-indicator">
            <div className="overflow-warning-badge">
              Content Overflow: {Math.round(overflowAmount)}px
            </div>
          </div>
        )}

        {/* Content area with proper margins */}
        <div 
          className={`editor-content transition-colors duration-200 ${
            theme === 'dark' ? 'text-foreground' : 'text-gray-900'
          }`}
          style={{
            width: '100%',
            height: '100%',
            ...getRTLPaddingStyles(pageLayout.margins, true), // Use RTL-aware padding
            boxSizing: 'border-box',
            overflow: 'visible',
            position: 'relative',
            // Ensure content flows properly in columns
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
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
              overflow: 'visible',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              // Enhanced print-friendly styles
              hyphens: 'auto',
              WebkitHyphens: 'auto',
              MozHyphens: 'auto',
              msHyphens: 'auto',
              // Better text rendering
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale'
            }}
          />
        </div>

        {/* Add page numbers for each column */}
        {Array.from({ length: pageCount }, (_, pageIndex) => (
          <div
            key={pageIndex}
            className="page-number"
            style={{
              position: 'absolute',
              bottom: '10px',
              right: `${15 + (pageIndex * dimensions.width)}px`,
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
            {pageIndex + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContinuousEditor;
