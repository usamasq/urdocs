import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MM_TO_PX } from '../utils/dimensionUtils';

interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface PageLayout {
  pageSize: 'A4' | 'Letter' | 'Custom';
  customWidth?: number;
  customHeight?: number;
  orientation: 'portrait' | 'landscape';
  margins: Margins;
  showMarginGuides: boolean;
}

interface RulerSystemProps {
  pageLayout: PageLayout;
  zoomLevel: number;
  onMarginChange: (margins: Margins) => void;
  isRTL?: boolean;
  type?: 'horizontal' | 'vertical' | 'both';
  containerHeight?: number;
}

interface TickMark {
  position: number;
  value: number;
  isMajor: boolean;
}

const RulerSystem: React.FC<RulerSystemProps> = ({
  pageLayout,
  zoomLevel,
  onMarginChange,
  isRTL = true,
  type = 'both',
  containerHeight
}) => {
  const { theme } = useTheme();
  const horizontalRulerRef = useRef<HTMLDivElement>(null);
  const verticalRulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialMargins, setInitialMargins] = useState<Margins>(pageLayout.margins);
  const lastUpdateTime = useRef<number>(0);

  // Calculate page dimensions in mm
  const pageDimensions = useMemo(() => {
    let width = 210; // A4 default
    let height = 297;
    
    if (pageLayout.pageSize === 'Letter') {
      width = 216;
      height = 279;
    } else if (pageLayout.pageSize === 'Custom') {
      width = pageLayout.customWidth || 210;
      height = pageLayout.customHeight || 297;
    }
    
    if (pageLayout.orientation === 'landscape') {
      [width, height] = [height, width];
    }
    
    return { width, height };
  }, [pageLayout.pageSize, pageLayout.customWidth, pageLayout.customHeight, pageLayout.orientation]);

  // Calculate ruler dimensions in pixels (base dimensions - CSS transform handles scaling)
  const rulerDimensions = useMemo(() => {
    const width = pageDimensions.width * MM_TO_PX;
    const height = pageDimensions.height * MM_TO_PX;
    return { width, height };
  }, [pageDimensions]);

  // Generate tick marks for horizontal ruler
  const horizontalTicks = useMemo((): TickMark[] => {
    const ticks: TickMark[] = [];
    const majorInterval = 50; // 50mm major ticks
    const minorInterval = 10; // 10mm minor ticks
    
    for (let i = 0; i <= pageDimensions.width; i += minorInterval) {
      const isMajor = i % majorInterval === 0;
      const position = (i * MM_TO_PX);
      ticks.push({
        position,
        value: i,
        isMajor
      });
    }
    
    return ticks;
  }, [pageDimensions.width]);

  // Generate tick marks for vertical ruler
  const verticalTicks = useMemo((): TickMark[] => {
    const ticks: TickMark[] = [];
    const majorInterval = 50; // 50mm major ticks
    const minorInterval = 10; // 10mm minor ticks
    
    // Use container height if provided, otherwise use page height
    const maxHeight = containerHeight ? containerHeight / MM_TO_PX : pageDimensions.height;
    
    for (let i = 0; i <= maxHeight; i += minorInterval) {
      const isMajor = i % majorInterval === 0;
      const position = (i * MM_TO_PX);
      ticks.push({
        position,
        value: i,
        isMajor
      });
    }
    
    return ticks;
  }, [pageDimensions.height, containerHeight]);

  // Calculate margin positions in pixels (base dimensions - CSS transform handles scaling)
  const marginPositions = useMemo(() => {
    const { margins } = pageLayout;
    const mmToPx = MM_TO_PX;
    
    if (isRTL) {
      // For RTL text (right-justified), invert the margin controls:
      // "Right" margin controls the left side (where text starts)
      // "Left" margin controls the right side (where text ends)
      return {
        left: margins.right * mmToPx,  // Right margin value controls left visual position
        right: (pageDimensions.width - margins.left) * mmToPx,  // Left margin value controls right visual position
        top: margins.top * mmToPx,
        bottom: (pageDimensions.height - margins.bottom) * mmToPx
      };
    } else {
      // For LTR text, normal margin positioning
      return {
        left: margins.left * mmToPx,
        right: (pageDimensions.width - margins.right) * mmToPx,
        top: margins.top * mmToPx,
        bottom: (pageDimensions.height - margins.bottom) * mmToPx
      };
    }
  }, [pageLayout.margins, pageDimensions, isRTL]);

  // Handle margin dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, marginType: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(marginType);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialMargins({ ...pageLayout.margins });
  }, [pageLayout.margins]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const now = performance.now();
    // Throttle updates to 60fps (16.67ms) for smoother performance
    if (now - lastUpdateTime.current < 16.67) return;
    lastUpdateTime.current = now;

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const deltaMmX = deltaX / (MM_TO_PX * zoomLevel);
      const deltaMmY = deltaY / (MM_TO_PX * zoomLevel);

      const newMargins = { ...initialMargins };

      switch (isDragging) {
        case 'left':
          if (isRTL) {
            // In RTL, the "left" handle controls the right margin value (left side of text)
            newMargins.right = Math.max(0, Math.min(100, initialMargins.right + deltaMmX));
          } else {
            // In LTR, left handle controls left margin
            newMargins.left = Math.max(0, Math.min(100, initialMargins.left + deltaMmX));
          }
          break;
        case 'right':
          if (isRTL) {
            // In RTL, the "right" handle controls the left margin value (right side of text)
            newMargins.left = Math.max(0, Math.min(100, initialMargins.left - deltaMmX));
          } else {
            // In LTR, right handle controls right margin
            newMargins.right = Math.max(0, Math.min(100, initialMargins.right + deltaMmX));
          }
          break;
        case 'top':
          newMargins.top = Math.max(0, Math.min(100, initialMargins.top + deltaMmY));
          break;
        case 'bottom':
          newMargins.bottom = Math.max(0, Math.min(100, initialMargins.bottom - deltaMmY));
          break;
      }

      onMarginChange(newMargins);
    });
  }, [isDragging, dragStart, initialMargins, zoomLevel, isRTL, onMarginChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Set up global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      // Use passive: false for mousemove to allow preventDefault if needed
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: true });
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!pageLayout.showMarginGuides) {
    return null;
  }

  const renderHorizontalRuler = () => (
    <div
      ref={horizontalRulerRef}
      className={`horizontal-ruler ${theme === 'dark' ? 'dark' : 'light'}`}
      style={{
        width: `${rulerDimensions.width}px`,
        height: '30px',
        position: 'relative',
        border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
        backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
        fontSize: '10px',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Tick marks */}
      {horizontalTicks.map((tick, index) => (
        <div
          key={index}
          className={`tick ${tick.isMajor ? 'major' : 'minor'}`}
          style={{
            position: 'absolute',
            left: `${tick.position}px`,
            top: tick.isMajor ? '0px' : '5px',
            height: tick.isMajor ? '15px' : '10px',
            borderLeft: `1px solid ${theme === 'dark' ? '#6b7280' : '#9ca3af'}`,
            paddingLeft: '2px',
            paddingTop: tick.isMajor ? '2px' : '0px',
            color: theme === 'dark' ? '#d1d5db' : '#374151',
            fontWeight: tick.isMajor ? '500' : '400'
          }}
        >
          {tick.isMajor && tick.value}
        </div>
      ))}

      {/* Margin handles */}
      {/* Left margin handle */}
      <div
        className="margin-handle left"
        style={{
          position: 'absolute',
          left: `${marginPositions.left}px`,
          top: '0',
          width: '4px',
          height: '100%',
          backgroundColor: '#3b82f6',
          cursor: 'ew-resize',
          zIndex: 10,
          borderRadius: '2px',
          // Add visual indicator for RTL
          ...(isRTL && { 
            borderLeft: '2px solid #1d4ed8',
            borderRight: '1px solid #60a5fa'
          })
        }}
        onMouseDown={(e) => handleMouseDown(e, 'left')}
        title={isRTL ? 'Right margin (controls left edge of text)' : 'Left margin'}
      />
      
      {/* Right margin handle */}
      <div
        className="margin-handle right"
        style={{
          position: 'absolute',
          left: `${marginPositions.right}px`,
          top: '0',
          width: '4px',
          height: '100%',
          backgroundColor: '#3b82f6',
          cursor: 'ew-resize',
          zIndex: 10,
          borderRadius: '2px',
          // Add visual indicator for RTL
          ...(isRTL && { 
            borderRight: '2px solid #1d4ed8',
            borderLeft: '1px solid #60a5fa'
          })
        }}
        onMouseDown={(e) => handleMouseDown(e, 'right')}
        title={isRTL ? 'Left margin (controls right edge of text)' : 'Right margin'}
      />
    </div>
  );

  const renderVerticalRuler = () => (
    <div
      ref={verticalRulerRef}
      className={`vertical-ruler ${theme === 'dark' ? 'dark' : 'light'}`}
      style={{
        width: '30px',
        height: containerHeight ? `${containerHeight}px` : `${rulerDimensions.height}px`,
        position: 'relative',
        border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
        backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
        fontSize: '10px',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Tick marks */}
      {verticalTicks.map((tick, index) => (
        <div
          key={index}
          className={`tick ${tick.isMajor ? 'major' : 'minor'}`}
          style={{
            position: 'absolute',
            top: `${tick.position}px`,
            left: tick.isMajor ? '0px' : '5px',
            width: tick.isMajor ? '15px' : '10px',
            borderTop: `1px solid ${theme === 'dark' ? '#6b7280' : '#9ca3af'}`,
            paddingTop: '2px',
            paddingLeft: tick.isMajor ? '2px' : '0px',
            color: theme === 'dark' ? '#d1d5db' : '#374151',
            fontWeight: tick.isMajor ? '500' : '400',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
        >
          {tick.isMajor && tick.value}
        </div>
      ))}

      {/* Margin handles */}
      {/* Top margin handle */}
      <div
        className="margin-handle top"
        style={{
          position: 'absolute',
          top: `${marginPositions.top}px`,
          left: '0',
          height: '4px',
          width: '100%',
          backgroundColor: '#3b82f6',
          cursor: 'ns-resize',
          zIndex: 10,
          borderRadius: '2px'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'top')}
        title="Top margin"
      />
      
      {/* Bottom margin handle */}
      <div
        className="margin-handle bottom"
        style={{
          position: 'absolute',
          top: `${marginPositions.bottom}px`,
          left: '0',
          height: '4px',
          width: '100%',
          backgroundColor: '#3b82f6',
          cursor: 'ns-resize',
          zIndex: 10,
          borderRadius: '2px'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
        title="Bottom margin"
      />
    </div>
  );

  if (!pageLayout.showMarginGuides) {
    return null;
  }

  return (
    <div className="ruler-system">
      {type === 'horizontal' || type === 'both' ? renderHorizontalRuler() : null}
      {type === 'vertical' || type === 'both' ? renderVerticalRuler() : null}
    </div>
  );
};

export default RulerSystem;
