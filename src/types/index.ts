/**
 * Centralized type definitions for the Urdu Document Editor
 */

// Language and Theme Types
export type Language = 'en' | 'ur';
export type Theme = 'light' | 'dark';
export type LayoutType = 'phonetic' | 'inpage' | 'crulp';
export type Unit = 'mm' | 'in';

// Page Layout Types
export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PageLayout {
  pageSize: 'A4' | 'Letter' | 'Custom';
  customWidth: number;
  customHeight: number;
  orientation: 'portrait' | 'landscape';
  margins: Margins;
  showMarginGuides: boolean;
}

// Dimension Types
export interface PageDimensions {
  width: number;
  height: number;
  widthMm: number;
  heightMm: number;
}

export interface ContentDimensions {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

// Pagination Types
export interface Page {
  id: string;
  content: string;
  height: number;
}

export interface OverflowStatus {
  isOverflowing: boolean;
  overflowAmount: number;
  breakPoint?: number;
}

// Font Types
export interface FontOption {
  value: string;
  label: string;
  urduName: string;
  preview: string;
  category: string;
}

export interface SizeOption {
  value: string;
  label: string;
}

// User Preferences Types
export interface UserPreferences {
  keyboardLayout: LayoutType;
  isKeyboardEnabled: boolean;
  preferredFont: string;
  theme: Theme;
  language: Language;
}

// Component Props Types
export interface EditorToolbarProps {
  editor: any;
  onFontChange: (font: string) => void;
  onSizeChange: (size: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onPageSetupClick: () => void;
  pageLayout?: PageLayout;
  onToggleMarginGuides?: () => void;
  useMultiPageEditor?: boolean;
  onToggleEditorMode?: () => void;
  // New props for keyboard control
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  isKeyboardEnabled: boolean;
  onKeyboardToggle: (enabled: boolean) => void;
}

export interface PageSetupSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pageLayout: PageLayout;
  onPageLayoutChange: (layout: PageLayout) => void;
  isDarkMode: boolean;
}

export interface RulerSystemProps {
  pageLayout: PageLayout;
  zoomLevel: number;
  onMarginChange: (margins: Margins) => void;
  isRTL?: boolean;
  type?: 'horizontal' | 'vertical' | 'both';
}

export interface EnhancedEditorWithRulerProps {
  editor: any;
  pageLayout: PageLayout;
  zoomLevel: number;
  onPageCountChange?: (pageCount: number) => void;
  onMarginChange?: (side: 'top' | 'bottom' | 'left' | 'right', value: number) => void;
}

// Context Types
export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export interface PaginationContextType {
  pages: Page[];
  currentPage: number;
  totalPages: number;
  addPage: () => void;
  removePage: (pageId: string) => void;
  updatePageContent: (pageId: string, content: string) => void;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  getPageContent: (pageId: string) => string;
  setPageHeight: (pageId: string, height: number) => void;
  checkAndManagePages: () => void;
}

// Utility Types
export interface TickMark {
  position: number;
  value: number;
  isMajor: boolean;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  context?: string;
  timestamp: Date;
}

// Export/Import Types
export interface ExportOptions {
  format: 'pdf' | 'docx' | 'svg';
  includeMargins: boolean;
  includePageNumbers: boolean;
  quality: 'draft' | 'standard' | 'high';
}
