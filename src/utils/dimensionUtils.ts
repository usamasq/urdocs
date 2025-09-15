/**
 * Centralized dimension and conversion utilities
 */

// Standard conversion factor: 1mm = 3.7795275591px at 96 DPI
export const MM_TO_PX = 3.7795275591;
export const PX_TO_MM = 1 / MM_TO_PX;

// Unit conversion constants
export const MM_TO_INCHES = 1 / 25.4;
export const INCHES_TO_MM = 25.4;

/**
 * Convert millimeters to pixels with zoom level
 */
export const mmToPx = (mm: number, zoomLevel: number = 1): number => {
  return mm * MM_TO_PX * zoomLevel;
};

/**
 * Convert pixels to millimeters with zoom level
 */
export const pxToMm = (px: number, zoomLevel: number = 1): number => {
  return px * PX_TO_MM / zoomLevel;
};

/**
 * Convert millimeters to inches with precision
 */
export const mmToInches = (mm: number): number => {
  return Math.round((mm * MM_TO_INCHES) * 1000) / 1000;
};

/**
 * Convert inches to millimeters with precision
 */
export const inchesToMm = (inches: number): number => {
  return Math.round((inches * INCHES_TO_MM) * 100) / 100;
};

/**
 * Format value for display based on unit
 */
export const formatDimension = (value: number, unit: 'mm' | 'in'): string => {
  return unit === 'in' ? value.toFixed(3) : Math.round(value).toString();
};

/**
 * Validate margin value within bounds
 */
export const validateMargin = (value: number, unit: 'mm' | 'in'): number => {
  const minMargin = 0;
  const maxMargin = unit === 'mm' ? 50 : 2; // 50mm or 2 inches max
  return Math.max(minMargin, Math.min(maxMargin, value));
};

/**
 * Validate zoom level
 */
export const validateZoom = (zoom: number): number => {
  return Math.max(0.25, Math.min(3, zoom)); // 25% to 300% zoom range
};

/**
 * Get page dimensions based on page size and orientation
 */
export interface PageDimensions {
  width: number;
  height: number;
  widthMm: number;
  heightMm: number;
}

export const getPageDimensions = (
  pageSize: 'A4' | 'Letter' | 'Custom',
  customWidth?: number,
  customHeight?: number,
  orientation: 'portrait' | 'landscape' = 'portrait'
): PageDimensions => {
  let width = 210; // A4 default in mm
  let height = 297;
  
  if (pageSize === 'Letter') {
    width = 216;
    height = 279;
  } else if (pageSize === 'Custom' && customWidth && customHeight) {
    width = customWidth;
    height = customHeight;
  }
  
  if (orientation === 'landscape') {
    [width, height] = [height, width];
  }
  
  return {
    width: width * MM_TO_PX,
    height: height * MM_TO_PX,
    widthMm: width,
    heightMm: height
  };
};

/**
 * Calculate content area dimensions (page minus margins)
 */
export interface ContentDimensions {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export const getContentDimensions = (
  pageDimensions: PageDimensions,
  margins: { top: number; bottom: number; left: number; right: number },
  zoomLevel: number = 1
): ContentDimensions => {
  return {
    width: pageDimensions.width * zoomLevel,
    height: pageDimensions.height * zoomLevel,
    marginTop: margins.top * MM_TO_PX * zoomLevel,
    marginBottom: margins.bottom * MM_TO_PX * zoomLevel,
    marginLeft: margins.left * MM_TO_PX * zoomLevel,
    marginRight: margins.right * MM_TO_PX * zoomLevel
  };
};

/**
 * Get RTL-aware margin styles for editor content
 * For RTL text with text-align: right, we need to use padding instead of margins
 * to properly control the text positioning
 */
export const getRTLMarginStyles = (
  margins: { top: number; bottom: number; left: number; right: number },
  isRTL: boolean = true
): React.CSSProperties => {
  if (!isRTL) {
    // For LTR text, use normal margin logic
    return {
      marginTop: `${margins.top}mm`,
      marginLeft: `${margins.left}mm`,
      marginRight: `${margins.right}mm`,
      marginBottom: `${margins.bottom}mm`
    };
  }
  
  // For RTL text with text-align: right, use padding to control text positioning
  // UI "left margin" should control space from right edge (where text starts)
  // UI "right margin" should control space from left edge (where text ends)
  return {
    paddingTop: `${margins.top}mm`,
    paddingLeft: `${margins.right}mm`,  // UI "right margin" becomes left padding (controls left edge in RTL)
    paddingRight: `${margins.left}mm`,  // UI "left margin" becomes right padding (controls right edge in RTL)
    paddingBottom: `${margins.bottom}mm`,
    boxSizing: 'border-box'
  };
};

/**
 * Get RTL-aware CSS custom properties for margin guides
 * This ensures margin guides align with RTL text flow
 */
export const getRTLMarginCSSProperties = (
  margins: { top: number; bottom: number; left: number; right: number },
  isRTL: boolean = true
): Record<string, string> => {
  if (!isRTL) {
    return {
      '--margin-top': `${margins.top}mm`,
      '--margin-bottom': `${margins.bottom}mm`,
      '--margin-start': `${margins.left}mm`,  // Start = left in LTR
      '--margin-end': `${margins.right}mm`    // End = right in LTR
    };
  }
  
  // For RTL text, we need to map UI margins to visual positions correctly
  // UI "left margin" should control the right edge (where text starts)
  // UI "right margin" should control the left edge (where text ends)
  return {
    '--margin-top': `${margins.top}mm`,
    '--margin-bottom': `${margins.bottom}mm`,
    '--margin-start': `${margins.left}mm`,   // UI "left margin" = visual right edge (start of RTL text)
    '--margin-end': `${margins.right}mm`     // UI "right margin" = visual left edge (end of RTL text)
  };
};

/**
 * Get RTL-aware padding styles for content containers
 * This is now the same as getRTLMarginStyles for RTL text
 */
export const getRTLPaddingStyles = (
  margins: { top: number; bottom: number; left: number; right: number },
  isRTL: boolean = true
): React.CSSProperties => {
  // Use the same logic as getRTLMarginStyles for consistency
  return getRTLMarginStyles(margins, isRTL);
};

/**
 * Unified margin management system for editor components
 * This function provides both CSS variables and inline styles for consistent RTL support
 */
export const getUnifiedMarginStyles = (
  margins: { top: number; bottom: number; left: number; right: number },
  isRTL: boolean = true,
  includeCSSVariables: boolean = true,
  includeInlineStyles: boolean = true
): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (includeCSSVariables) {
    Object.assign(styles, getRTLMarginCSSProperties(margins, isRTL));
  }
  
  if (includeInlineStyles) {
    Object.assign(styles, getRTLMarginStyles(margins, isRTL));
  }
  
  return styles;
};
