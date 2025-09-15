import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { useTheme } from '../contexts/ThemeContext';
import { getPageDimensions, getRTLMarginStyles, getRTLMarginCSSProperties } from '../utils/dimensionUtils';
import RulerSystem from './RulerSystem';

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

interface EnhancedEditorWithRulerProps {
  editor: any;
  pageLayout: PageLayout;
  zoomLevel: number;
  onPageCountChange?: (pageCount: number) => void;
  onMarginChange?: (side: 'top' | 'bottom' | 'left' | 'right', value: number) => void;
}

const EnhancedEditorWithRuler: React.FC<EnhancedEditorWithRulerProps> = ({
  editor,
  pageLayout,
  zoomLevel,
  onPageCountChange,
  onMarginChange
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
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
    
    return {
      ...pageDims,
      width: pageDims.width * zoomLevel,
      height: pageDims.height * zoomLevel
    };
  }, [pageLayout, zoomLevel]);

  // Simple and effective page count calculation
  const calculatePageCount = useCallback(() => {
    if (!contentRef.current || !editor) return;

    const dimensions = calculateDimensions();
    const contentAreaHeight = dimensions.height - (pageLayout.margins.top + pageLayout.margins.bottom) * 3.7795275591 * zoomLevel;
    
    // Get the editor content element
    const editorElement = contentRef.current.querySelector('.ProseMirror');
    if (!editorElement) return;

    // Calculate content height
    const contentHeight = editorElement.scrollHeight;
    
    // Simple calculation: if content exceeds one page, create more pages
    const newPageCount = Math.max(1, Math.ceil(contentHeight / contentAreaHeight));
    const overflowing = contentHeight > contentAreaHeight;
    
    setPageCount(newPageCount);
    setIsOverflowing(overflowing);
    onPageCountChange?.(newPageCount);
  }, [calculateDimensions, onPageCountChange, editor, pageLayout.margins, zoomLevel]);

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

  // Handle margin changes from ruler
  const handleMarginChange = useCallback((margins: typeof pageLayout.margins) => {
    onMarginChange?.('top', margins.top);
    onMarginChange?.('bottom', margins.bottom);
    onMarginChange?.('left', margins.left);
    onMarginChange?.('right', margins.right);
  }, [onMarginChange]);

  const dimensions = calculateDimensions();

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-muted/20 p-8 pb-20"
    >
      {/* Ruler System Container */}
      <div className="ruler-container mb-4">
        {/* Horizontal Ruler */}
        <div className="flex justify-center mb-2">
          <div style={{ width: '30px' }}></div> {/* Spacer for vertical ruler */}
          <RulerSystem
            documentRef={documentRef}
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
              documentRef={documentRef}
              pageLayout={pageLayout}
              zoomLevel={zoomLevel}
              onMarginChange={handleMarginChange}
              isRTL={true}
              type="vertical"
            />
          </div>
          
          {/* Document Container */}
          <div
            ref={documentRef}
            className={`document-container transition-colors duration-200 ${
              theme === 'dark' ? 'bg-card' : 'bg-white'
            } ${pageLayout.showMarginGuides ? 'show-margin-guides' : ''} ${
              isOverflowing ? 'overflow-warning' : ''
            }`}
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
              ref={contentRef}
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

            {/* Page number */}
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

export default EnhancedEditorWithRuler;
