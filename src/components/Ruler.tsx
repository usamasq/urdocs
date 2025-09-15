import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MM_TO_PX } from '../utils/dimensionUtils';

interface RulerProps {
  type: 'horizontal' | 'vertical';
  pageWidth: number;
  pageHeight: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  onMarginChange: (side: 'top' | 'bottom' | 'left' | 'right', value: number) => void;
  zoomLevel: number;
  isVisible: boolean;
  isRTL?: boolean;
}

const Ruler: React.FC<RulerProps> = ({
  type,
  pageWidth,
  pageHeight,
  margins,
  onMarginChange,
  zoomLevel,
  isVisible,
  isRTL = true
}) => {
  const { theme } = useTheme();
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<number>(0);
  const [initialMargin, setInitialMargin] = useState<number>(0);

  // Convert mm to pixels for display using centralized constant
  const rulerWidth = type === 'horizontal' ? pageWidth * MM_TO_PX * zoomLevel : 30;
  const rulerHeight = type === 'vertical' ? pageHeight * MM_TO_PX * zoomLevel : 30;
  
  // Calculate content area boundaries (where text actually starts)
  const contentLeft = margins.left * MM_TO_PX * zoomLevel;
  const contentRight = (pageWidth - margins.right) * MM_TO_PX * zoomLevel;
  const contentTop = margins.top * MM_TO_PX * zoomLevel;
  const contentBottom = (pageHeight - margins.bottom) * MM_TO_PX * zoomLevel;

  // Generate tick marks
  const generateTicks = useCallback(() => {
    const ticks = [];
    const majorInterval = 50; // 50mm major ticks
    const minorInterval = 10; // 10mm minor ticks
    
    if (type === 'horizontal') {
      for (let i = 0; i <= pageWidth; i += minorInterval) {
        const isMajor = i % majorInterval === 0;
        const x = (i * MM_TO_PX * zoomLevel);
        ticks.push({
          x,
          isMajor,
          value: i
        });
      }
    } else {
      for (let i = 0; i <= pageHeight; i += minorInterval) {
        const isMajor = i % majorInterval === 0;
        const y = (i * MM_TO_PX * zoomLevel);
        ticks.push({
          y,
          isMajor,
          value: i
        });
      }
    }
    
    return ticks;
  }, [type, pageWidth, pageHeight, zoomLevel]);

  const ticks = generateTicks();

  // Handle mouse events for dragging margins
  const handleMouseDown = useCallback((e: React.MouseEvent, marginType: string) => {
    e.preventDefault();
    setIsDragging(marginType);
    setDragStart(type === 'horizontal' ? e.clientX : e.clientY);
    
    // Set initial margin value
    switch (marginType) {
      case 'left':
        setInitialMargin(margins.left);
        break;
      case 'right':
        setInitialMargin(margins.right);
        break;
      case 'top':
        setInitialMargin(margins.top);
        break;
      case 'bottom':
        setInitialMargin(margins.bottom);
        break;
    }
  }, [type, margins]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !rulerRef.current) return;

    const currentPos = type === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - dragStart;
    const deltaMm = delta / (MM_TO_PX * zoomLevel);
    
    let newValue;
    if (isDragging === 'right') {
      // For right margin, dragging left should increase margin, dragging right should decrease
      newValue = Math.max(0, Math.min(100, initialMargin - deltaMm));
    } else if (isDragging === 'bottom') {
      // For bottom margin, dragging up should increase margin, dragging down should decrease
      newValue = Math.max(0, Math.min(100, initialMargin - deltaMm));
    } else {
      // For left and top margins, normal behavior
      newValue = Math.max(0, Math.min(100, initialMargin + deltaMm));
    }

    onMarginChange(isDragging as 'top' | 'bottom' | 'left' | 'right', newValue);
  }, [isDragging, dragStart, initialMargin, type, zoomLevel, onMarginChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Debug logging to ensure margins are being passed correctly
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Ruler margins updated:', margins);
    }
  }, [margins]);

  if (!isVisible) return null;

  return (
    <div
      ref={rulerRef}
      className={`ruler ${type}-ruler ${
        theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'
      }`}
      style={{
        width: `${rulerWidth}px`,
        height: `${rulerHeight}px`,
        position: 'relative',
        border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
        fontSize: '10px',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Tick marks */}
      {ticks.map((tick, index) => (
        <div
          key={index}
          className={`tick ${tick.isMajor ? 'major' : 'minor'} ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
          style={{
            position: 'absolute',
            ...(type === 'horizontal' 
              ? {
                  left: `${tick.x}px`,
                  top: tick.isMajor ? '0px' : '5px',
                  height: tick.isMajor ? '15px' : '10px',
                  borderLeft: `1px solid ${theme === 'dark' ? '#6b7280' : '#9ca3af'}`,
                  paddingLeft: '2px',
                  paddingTop: tick.isMajor ? '2px' : '0px'
                }
              : {
                  top: `${tick.y}px`,
                  left: tick.isMajor ? '0px' : '5px',
                  width: tick.isMajor ? '15px' : '10px',
                  borderTop: `1px solid ${theme === 'dark' ? '#6b7280' : '#9ca3af'}`,
                  paddingTop: '2px',
                  paddingLeft: tick.isMajor ? '2px' : '0px',
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed'
                }
            )
          }}
        >
          {tick.isMajor && tick.value}
        </div>
      ))}

      {/* Margin indicators and draggable handles */}
      {type === 'horizontal' ? (
        <>
          {/* Left margin - for RTL, this controls the right edge of text */}
          <div
            className="margin-indicator left"
            style={{
              position: 'absolute',
              left: isRTL 
                ? `${(pageWidth - margins.left) * MM_TO_PX * zoomLevel}px`  // RTL: left margin controls right edge
                : `${margins.left * MM_TO_PX * zoomLevel}px`,               // LTR: normal behavior
              top: '0',
              width: '2px',
              height: '100%',
              background: '#3b82f6',
              cursor: 'ew-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleMouseDown(e, 'left')}
          />
          
          {/* Right margin - for RTL, this controls the left edge of text */}
          <div
            className="margin-indicator right"
            style={{
              position: 'absolute',
              left: isRTL 
                ? `${margins.right * MM_TO_PX * zoomLevel}px`               // RTL: right margin controls left edge
                : `${(pageWidth - margins.right) * MM_TO_PX * zoomLevel}px`, // LTR: normal behavior
              top: '0',
              width: '2px',
              height: '100%',
              background: '#3b82f6',
              cursor: 'ew-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleMouseDown(e, 'right')}
          />
        </>
      ) : (
        <>
          {/* Top margin */}
          <div
            className="margin-indicator top"
            style={{
              position: 'absolute',
              top: `${margins.top * MM_TO_PX * zoomLevel}px`,
              left: '0',
              height: '2px',
              width: '100%',
              background: '#3b82f6',
              cursor: 'ns-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleMouseDown(e, 'top')}
          />
          
          {/* Bottom margin */}
          <div
            className="margin-indicator bottom"
            style={{
              position: 'absolute',
              top: `${(pageHeight - margins.bottom) * MM_TO_PX * zoomLevel}px`,
              left: '0',
              height: '2px',
              width: '100%',
              background: '#3b82f6',
              cursor: 'ns-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleMouseDown(e, 'bottom')}
          />
        </>
      )}
    </div>
  );
};

export default Ruler;
