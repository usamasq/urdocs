/**
 * Professional Layout Engine
 * Implements Microsoft Word-style pagination with precise layout calculations
 * 
 * This engine separates content from layout, providing:
 * - Precise page boundary calculations
 * - Automatic content flow between pages
 * - Professional-grade page break handling
 * - Layout-first approach (not reactive)
 * - Multi-column layouts
 * - Headers and footers
 * - Complex content types (tables, images, charts)
 * - Extensible architecture for future features
 */

import { DocumentNode } from '../document/schema/types';

// Layout primitives
export interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  lineIndex: number;
  columnIndex: number;
  node: DocumentNode;
  parent?: LayoutBox;
  children: LayoutBox[];
  zIndex: number;
  type: LayoutBoxType;
  style?: LayoutStyle;
}

export type LayoutBoxType = 
  | 'content' 
  | 'header' 
  | 'footer' 
  | 'margin' 
  | 'column' 
  | 'table-cell'
  | 'image-container'
  | 'chart-container'
  | 'sidebar'
  | 'annotation';

export interface LayoutStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: ShadowStyle;
  opacity?: number;
}

export interface ShadowStyle {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface LayoutLine {
  boxes: LayoutBox[];
  height: number;
  baseline: number;
  pageIndex: number;
  lineIndex: number;
  columnIndex: number;
  alignment: TextAlignment;
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface LayoutPage {
  index: number;
  width: number;
  height: number;
  margins: PageMargins;
  contentHeight: number;
  lines: LayoutLine[];
  boxes: LayoutBox[];
  columns: LayoutColumn[];
  headers: LayoutRegion[];
  footers: LayoutRegion[];
  sections: LayoutSection[];
}

export interface LayoutColumn {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  contentHeight: number;
  boxes: LayoutBox[];
  lines: LayoutLine[];
  isBalanced: boolean;
}

export interface LayoutRegion {
  type: 'header' | 'footer';
  height: number;
  content: LayoutBox[];
  style?: LayoutStyle;
  repeatOnPages: 'all' | 'odd' | 'even' | 'first' | 'none';
}

export interface LayoutSection {
  index: number;
  startPage: number;
  endPage: number;
  columns: number;
  columnSpacing: number;
  pageLayout: SectionPageLayout;
  headers: LayoutRegion[];
  footers: LayoutRegion[];
}

export interface SectionPageLayout {
  pageSize: 'A4' | 'Letter' | 'Custom';
  orientation: 'portrait' | 'landscape';
  margins: PageMargins;
  customWidth?: number;
  customHeight?: number;
}

export interface PageMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
  header: number;
  footer: number;
  gutter: number;
}

export interface LayoutEngineConfig {
  pageSize: 'A4' | 'Letter' | 'Custom';
  customWidth?: number;
  customHeight?: number;
  orientation: 'portrait' | 'landscape';
  margins: PageMargins;
  columns: ColumnConfig;
  headers: HeaderFooterConfig;
  footers: HeaderFooterConfig;
  typography: TypographyConfig;
  layout: LayoutConfig;
  features: FeatureConfig;
}

export interface ColumnConfig {
  count: number;
  spacing: number;
  balance: boolean;
  separator: ColumnSeparatorConfig;
}

export interface ColumnSeparatorConfig {
  enabled: boolean;
  style: 'line' | 'space' | 'none';
  width: number;
  color: string;
}

export interface HeaderFooterConfig {
  enabled: boolean;
  height: number;
  repeatOnPages: 'all' | 'odd' | 'even' | 'first' | 'none';
  content?: DocumentNode[];
  style?: LayoutStyle;
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  textDirection: 'ltr' | 'rtl';
  textAlign: TextAlignment;
  paragraphSpacing: number;
  characterSpacing: number;
  wordSpacing: number;
  hyphenation: boolean;
  widowControl: number;
  orphanControl: number;
}

export interface LayoutConfig {
  autoPageBreaks: boolean;
  manualPageBreaks: boolean;
  keepTogether: boolean;
  keepWithNext: boolean;
  pageBreakBefore: boolean;
  pageBreakAfter: boolean;
  floatingObjects: boolean;
  textWrapping: TextWrappingConfig;
}

export interface TextWrappingConfig {
  enabled: boolean;
  style: 'square' | 'tight' | 'through' | 'top-bottom' | 'behind-text' | 'in-front-text';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface FeatureConfig {
  tables: boolean;
  images: boolean;
  charts: boolean;
  equations: boolean;
  footnotes: boolean;
  endnotes: boolean;
  citations: boolean;
  tableOfContents: boolean;
  bookmarks: boolean;
  hyperlinks: boolean;
  comments: boolean;
  trackChanges: boolean;
  watermarks: boolean;
  backgrounds: boolean;
  borders: boolean;
  shadows: boolean;
}

export interface LayoutResult {
  pages: LayoutPage[];
  totalPages: number;
  contentHeight: number;
  pageBreaks: PageBreakInfo[];
  flowInfo: ContentFlowInfo;
}

export interface PageBreakInfo {
  position: number;
  pageIndex: number;
  isAutomatic: boolean;
  nodeIndex: number;
  lineIndex?: number;
}

export interface ContentFlowInfo {
  totalContentHeight: number;
  averagePageHeight: number;
  overflowPages: number[];
  widows: number;
  orphans: number;
}

/**
 * Content Handler Interface
 * Extensible system for handling different content types
 */
export interface ContentHandler {
  canHandle(node: DocumentNode): boolean;
  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions;
  layout(node: DocumentNode, context: LayoutContext): LayoutBox[];
  split(node: DocumentNode, context: LayoutContext): SplitResult;
}

export interface LayoutContext {
  pageWidth: number;
  pageHeight: number;
  columnWidth: number;
  columnHeight: number;
  margins: PageMargins;
  typography: TypographyConfig;
  availableSpace: number;
}

export interface Dimensions {
  width: number;
  height: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

export interface SplitResult {
  beforeBreak: DocumentNode;
  afterBreak: DocumentNode;
  splitPosition: number;
  heightBefore: number;
  heightAfter: number;
}

/**
 * Professional Layout Engine
 * Core engine that calculates precise layouts like professional word processors
 */
export class ProfessionalLayoutEngine {
  private config: LayoutEngineConfig;
  private document: DocumentNode;
  private layoutResult: LayoutResult | null = null;
  private isDirty = true;
  private contentHandlers: Map<string, ContentHandler> = new Map();
  private sections: LayoutSection[] = [];

  constructor(config: LayoutEngineConfig) {
    this.config = config;
    this.document = { type: 'doc', content: [] };
    this.initializeContentHandlers();
  }

  /**
   * Set the document to layout
   */
  setDocument(document: DocumentNode): void {
    this.document = document;
    this.isDirty = true;
    this.analyzeSections();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LayoutEngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.isDirty = true;
  }

  /**
   * Register a content handler for specific node types
   */
  registerContentHandler(type: string, handler: ContentHandler): void {
    this.contentHandlers.set(type, handler);
    this.isDirty = true;
  }

  /**
   * Get content handler for a node type
   */
  private getContentHandler(node: DocumentNode): ContentHandler | null {
    return this.contentHandlers.get(node.type) || null;
  }

  /**
   * Initialize default content handlers
   */
  private initializeContentHandlers(): void {
    this.registerContentHandler('paragraph', new ParagraphHandler());
    this.registerContentHandler('heading', new HeadingHandler());
    this.registerContentHandler('table', new TableHandler());
    this.registerContentHandler('image', new ImageHandler());
    this.registerContentHandler('list', new ListHandler());
    this.registerContentHandler('bulletList', new ListHandler());
    this.registerContentHandler('orderedList', new ListHandler());
    this.registerContentHandler('listItem', new ListHandler());
    this.registerContentHandler('blockquote', new BlockquoteHandler());
    this.registerContentHandler('codeBlock', new CodeBlockHandler());
    this.registerContentHandler('code', new CodeBlockHandler());
    this.registerContentHandler('horizontalRule', new HorizontalRuleHandler());
    this.registerContentHandler('hardBreak', new HardBreakHandler());
    this.registerContentHandler('math', new MathHandler());
    this.registerContentHandler('chart', new ChartHandler());
    this.registerContentHandler('equation', new EquationHandler());
    this.registerContentHandler('footnote', new FootnoteHandler());
    this.registerContentHandler('comment', new CommentHandler());
  }

  /**
   * Analyze document sections for complex layouts
   */
  private analyzeSections(): void {
    this.sections = [];
    if (!this.document.content) return;

    let currentSection: LayoutSection | null = null;
    let pageIndex = 0;

    for (let i = 0; i < this.document.content.length; i++) {
      const node = this.document.content[i];
      
      // Check for section breaks
      if (node.type === 'sectionBreak') {
        if (currentSection) {
          currentSection.endPage = pageIndex;
          this.sections.push(currentSection);
        }
        
        currentSection = {
          index: this.sections.length,
          startPage: pageIndex,
          endPage: pageIndex,
          columns: node.attrs?.columns || this.config.columns.count,
          columnSpacing: node.attrs?.columnSpacing || this.config.columns.spacing,
          pageLayout: {
            pageSize: node.attrs?.pageSize || this.config.pageSize,
            orientation: node.attrs?.orientation || this.config.orientation,
            margins: node.attrs?.margins || this.config.margins,
            customWidth: node.attrs?.customWidth,
            customHeight: node.attrs?.customHeight
          },
          headers: node.attrs?.headers || [],
          footers: node.attrs?.footers || []
        };
      } else if (node.type === 'pageBreak') {
        pageIndex++;
      }
    }

    // Add final section if exists
    if (currentSection) {
      currentSection.endPage = pageIndex;
      this.sections.push(currentSection);
    }

    // If no sections found, create default section
    if (this.sections.length === 0) {
      this.sections.push({
        index: 0,
        startPage: 0,
        endPage: 0,
        columns: this.config.columns.count,
        columnSpacing: this.config.columns.spacing,
        pageLayout: {
          pageSize: this.config.pageSize,
          orientation: this.config.orientation,
          margins: this.config.margins,
          customWidth: this.config.customWidth,
          customHeight: this.config.customHeight
        },
        headers: [],
        footers: []
      });
    }
  }

  /**
   * Calculate layout - this is the core method that does all the work
   */
  calculateLayout(): LayoutResult {
    if (!this.isDirty && this.layoutResult) {
      return this.layoutResult;
    }

    try {
      console.log('[LayoutEngine] Calculating professional layout...');

      // Step 1: Create initial pages
      const pages = this.createInitialPages();
      
      // Step 2: Flow content through pages
      const contentFlow = this.flowContent(pages);
      
      // Step 3: Apply professional pagination rules
      const paginatedResult = this.applyPaginationRules(contentFlow);
      
      // Step 4: Finalize layout
      this.layoutResult = this.finalizeLayout(paginatedResult);
      this.isDirty = false;

      console.log('[LayoutEngine] Layout calculated:', {
        totalPages: this.layoutResult.totalPages,
        contentHeight: this.layoutResult.contentHeight,
        pageBreaks: this.layoutResult.pageBreaks.length
      });

      return this.layoutResult;
    } catch (error) {
      console.error('[LayoutEngine] Layout calculation failed:', error);
      // Return a minimal valid layout result to prevent crashes
      this.layoutResult = {
        pages: this.createInitialPages(),
        totalPages: 1,
        contentHeight: 0,
        pageBreaks: [],
        flowInfo: {
          totalContentHeight: 0,
          averagePageHeight: 0,
          overflowPages: [],
          widows: 0,
          orphans: 0
        }
      };
      this.isDirty = false;
      return this.layoutResult;
    }
  }

  /**
   * Get current layout result (cached)
   */
  getLayoutResult(): LayoutResult {
    return this.calculateLayout();
  }

  /**
   * Create initial page structure
   */
  private createInitialPages(): LayoutPage[] {
    const pageDimensions = this.getPageDimensions();
    const pages: LayoutPage[] = [];

    // Create at least one page
    pages.push(this.createEmptyPage(0, pageDimensions));

    return pages;
  }

  /**
   * Flow content through pages with precise calculations
   */
  private flowContent(pages: LayoutPage[]): LayoutResult {
    if (!this.document.content || this.document.content.length === 0) {
      console.log('[LayoutEngine] No document content to process');
      return {
        pages: pages,
        totalPages: 1,
        contentHeight: 0,
        pageBreaks: [],
        flowInfo: {
          totalContentHeight: 0,
          averagePageHeight: 0,
          overflowPages: [],
          widows: 0,
          orphans: 0
        }
      };
    }

    console.log('[LayoutEngine] Processing document content:', {
      contentLength: this.document.content.length,
      contentTypes: this.document.content.map(node => node.type),
      sampleNodes: this.document.content.slice(0, 3).map(node => ({
        type: node.type,
        hasText: !!node.text,
        textLength: node.text?.length || 0,
        hasContent: !!node.content,
        contentLength: node.content?.length || 0
      }))
    });

    let currentPage = pages[0];
    let currentY = this.config.margins.top;
    const pageBreaks: PageBreakInfo[] = [];
    let nodeIndex = 0;
    let totalContentHeight = 0;

    // Process each content node
    for (const node of this.document.content) {
      if (node.type === 'pageBreak') {
        // Handle manual page break
        pageBreaks.push({
          position: nodeIndex,
          pageIndex: currentPage.index,
          isAutomatic: false,
          nodeIndex
        });

        // Create new page
        const newPage = this.createEmptyPage(pages.length, this.getPageDimensions());
        pages.push(newPage);
        currentPage = newPage;
        currentY = this.config.margins.top;
        nodeIndex++;
        continue;
      }

      // Calculate node dimensions
      const nodeHeight = this.calculateNodeHeight(node);
      const nodeBox = this.createLayoutBox(node, 0, currentY, nodeHeight, currentPage.index, nodeIndex);

      // Check if node fits on current page
      // Bottom margin is the page break point, not clipping space
      const availableHeight = currentPage.height - currentY - this.config.margins.bottom;
      
      if (nodeHeight > availableHeight && nodeHeight < (currentPage.height - this.config.margins.top - this.config.margins.bottom)) {
        // Node doesn't fit, but it's not too large for a single page
        // Create automatic page break
        pageBreaks.push({
          position: nodeIndex,
          pageIndex: currentPage.index,
          isAutomatic: true,
          nodeIndex,
          lineIndex: currentPage.lines.length
        });

        // Insert page break node into document content
        this.insertPageBreakAt(nodeIndex);

        // Create new page
        const newPage = this.createEmptyPage(pages.length, this.getPageDimensions());
        pages.push(newPage);
        currentPage = newPage;
        currentY = this.config.margins.top;

        // Place node on new page
        nodeBox.y = currentY;
        nodeBox.pageIndex = currentPage.index;
        currentPage.boxes.push(nodeBox);
        currentY += nodeHeight;
      } else if (nodeHeight > (currentPage.height - this.config.margins.top - this.config.margins.bottom)) {
        // Node is too large for a single page - split it
        const splitResult = this.splitNodeAcrossPages(node, currentPage, currentY, pages);
        currentPage = splitResult.finalPage;
        currentY = splitResult.finalY;
        pageBreaks.push(...splitResult.pageBreaks);
      } else {
        // Node fits on current page
        currentPage.boxes.push(nodeBox);
        currentY += nodeHeight;
      }

      totalContentHeight += nodeHeight;
      
      // Debug logging for content height calculation
      if (nodeHeight === 0) {
        console.log('[LayoutEngine] Node height is 0:', {
          nodeType: node.type,
          nodeText: node.text?.substring(0, 50) || 'no text',
          nodeContent: node.content?.length || 0
        });
      }
      
      nodeIndex++;
    }

    // Update page content heights
    pages.forEach(page => {
      if (page.boxes.length > 0) {
        page.contentHeight = Math.max(...page.boxes.map(box => box.y + box.height)) - this.config.margins.top;
      } else {
        page.contentHeight = 0;
      }
    });

    return {
      pages,
      totalPages: pages.length,
      contentHeight: isNaN(totalContentHeight) ? 0 : totalContentHeight,
      pageBreaks,
      flowInfo: this.calculateFlowInfo(pages, pageBreaks)
    };
  }

  /**
   * Apply professional pagination rules (widows, orphans, etc.)
   */
  private applyPaginationRules(result: LayoutResult): LayoutResult {
    // Apply widow/orphan control
    const adjustedResult = this.applyWidowOrphanControl(result);
    
    // Apply keep-with-next rules
    const keepTogetherResult = this.applyKeepTogetherRules(adjustedResult);
    
    // Optimize page breaks
    const optimizedResult = this.optimizePageBreaks(keepTogetherResult);

    return optimizedResult;
  }

  /**
   * Apply widow and orphan control
   */
  private applyWidowOrphanControl(result: LayoutResult): LayoutResult {
    const minOrphans = 2;
    const minWidows = 2;
    const adjustedPageBreaks: PageBreakInfo[] = [];

    for (let i = 0; i < result.pageBreaks.length; i++) {
      const pageBreak = result.pageBreaks[i];
      const page = result.pages[pageBreak.pageIndex];
      const nextPage = result.pages[pageBreak.pageIndex + 1];

      if (!nextPage) continue;

      // Check for orphans (few lines at start of page)
      const nextPageLines = this.countParagraphLines(nextPage);
      if (nextPageLines > 0 && nextPageLines < minOrphans) {
        // Move page break up to include more lines
        const adjustedBreak = this.adjustPageBreakUp(pageBreak, minOrphans - nextPageLines);
        if (adjustedBreak) {
          adjustedPageBreaks.push(adjustedBreak);
          continue;
        }
      }

      // Check for widows (few lines at end of page)
      const currentPageLines = this.countParagraphLines(page);
      if (currentPageLines > 0 && currentPageLines < minWidows) {
        // Move page break down to include more lines
        const adjustedBreak = this.adjustPageBreakDown(pageBreak, minWidows - currentPageLines);
        if (adjustedBreak) {
          adjustedPageBreaks.push(adjustedBreak);
          continue;
        }
      }

      adjustedPageBreaks.push(pageBreak);
    }

    return {
      ...result,
      pageBreaks: adjustedPageBreaks
    };
  }

  /**
   * Apply keep-together rules for related content
   */
  private applyKeepTogetherRules(result: LayoutResult): LayoutResult {
    // This would implement rules like keeping headings with their first paragraph
    // For now, return as-is
    return result;
  }

  /**
   * Optimize page breaks for better visual balance
   */
  private optimizePageBreaks(result: LayoutResult): LayoutResult {
    // This would implement algorithms to balance page content
    // For now, return as-is
    return result;
  }

  /**
   * Finalize layout calculations
   */
  private finalizeLayout(result: LayoutResult): LayoutResult {
    // Update flow info with final calculations
    const finalFlowInfo = this.calculateFlowInfo(result.pages, result.pageBreaks);
    
    return {
      ...result,
      flowInfo: finalFlowInfo
    };
  }

  /**
   * Create an empty page with columns and regions
   */
  private createEmptyPage(index: number, dimensions: { width: number; height: number }, section?: LayoutSection): LayoutPage {
    const page: LayoutPage = {
      index,
      width: dimensions.width,
      height: dimensions.height,
      margins: section?.pageLayout.margins || this.config.margins,
      contentHeight: 0,
      lines: [],
      boxes: [],
      columns: [],
      headers: [],
      footers: [],
      sections: []
    };

    // Create columns
    const columnCount = section?.columns || this.config.columns.count;
    const columnSpacing = section?.columnSpacing || this.config.columns.spacing;
    const availableWidth = dimensions.width - page.margins.left - page.margins.right;
    const columnWidth = (availableWidth - (columnCount - 1) * columnSpacing) / columnCount;

    for (let i = 0; i < columnCount; i++) {
      const column: LayoutColumn = {
        index: i,
        x: page.margins.left + i * (columnWidth + columnSpacing),
        y: page.margins.top + (this.config.headers.enabled ? this.config.headers.height : 0),
        width: columnWidth,
        height: dimensions.height - page.margins.top - page.margins.bottom - 
                (this.config.headers.enabled ? this.config.headers.height : 0) -
                (this.config.footers.enabled ? this.config.footers.height : 0),
        contentHeight: 0,
        boxes: [],
        lines: [],
        isBalanced: this.config.columns.balance
      };
      page.columns.push(column);
    }

    // Create headers and footers
    if (this.config.headers.enabled) {
      page.headers.push({
        type: 'header',
        height: this.config.headers.height,
        content: [],
        repeatOnPages: this.config.headers.repeatOnPages
      });
    }

    if (this.config.footers.enabled) {
      page.footers.push({
        type: 'footer',
        height: this.config.footers.height,
        content: [],
        repeatOnPages: this.config.footers.repeatOnPages
      });
    }

    return page;
  }

  /**
   * Create a layout box for a node
   */
  private createLayoutBox(
    node: DocumentNode, 
    x: number, 
    y: number, 
    height: number, 
    pageIndex: number, 
    nodeIndex: number
  ): LayoutBox {
    return {
      x,
      y,
      width: this.getPageDimensions().width - this.config.margins.left - this.config.margins.right,
      height,
      pageIndex,
      lineIndex: 0,
      node,
      children: []
    };
  }

  /**
   * Calculate height of a node
   */
  private calculateNodeHeight(node: DocumentNode): number {
    switch (node.type) {
      case 'paragraph':
        return this.calculateParagraphHeight(node);
      case 'heading':
        return this.calculateHeadingHeight(node);
      case 'table':
        return this.calculateTableHeight(node);
      case 'image':
        return this.calculateImageHeight(node);
      default:
        return this.config.lineHeight;
    }
  }

  /**
   * Calculate paragraph height based on content and formatting
   */
  private calculateParagraphHeight(node: DocumentNode): number {
    try {
      const text = this.extractTextFromNode(node);
      const lines = this.calculateTextLines(text);
      
      // Ensure lineHeight is a valid number with proper validation
      let lineHeight = this.config.lineHeight;
      if (!lineHeight || isNaN(lineHeight) || lineHeight <= 0) {
        lineHeight = 20; // Safe fallback
        console.warn('[LayoutEngine] Invalid lineHeight in config, using fallback:', lineHeight);
      }
      
      // Ensure lines is valid
      const validLines = Math.max(1, lines || 1);
      const paragraphSpacing = lineHeight * 0.5;
      const height = (validLines * lineHeight) + paragraphSpacing;
      
      // Validate final height
      if (isNaN(height) || height <= 0) {
        console.warn('[LayoutEngine] Invalid paragraph height calculated, using fallback:', {
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          textLength: text.length,
          lines: validLines,
          lineHeight,
          paragraphSpacing,
          calculatedHeight: height
        });
        return lineHeight; // Return safe fallback
      }
      
      return height;
    } catch (error) {
      console.error('[LayoutEngine] Error calculating paragraph height:', error);
      return 20; // Safe fallback
    }
  }

  /**
   * Calculate heading height
   */
  private calculateHeadingHeight(node: DocumentNode): number {
    const level = node.attrs?.level || 1;
    const scaleFactor = Math.max(0.8, 1.2 - (level - 1) * 0.1);
    return this.config.lineHeight * scaleFactor;
  }

  /**
   * Calculate table height
   */
  private calculateTableHeight(node: DocumentNode): number {
    const rows = node.content?.length || 0;
    return rows * this.config.lineHeight * 1.5;
  }

  /**
   * Calculate image height
   */
  private calculateImageHeight(node: DocumentNode): number {
    const height = node.attrs?.height;
    const width = node.attrs?.width;
    const aspectRatio = node.attrs?.aspectRatio;

    if (height) return height;
    if (width && aspectRatio) return width / aspectRatio;
    
    // Default image height
    return 200;
  }

  /**
   * Extract text content from a node
   */
  private extractTextFromNode(node: DocumentNode): string {
    if (node.text) return node.text;
    if (node.content) {
      return node.content.map(child => this.extractTextFromNode(child)).join('');
    }
    return '';
  }

  /**
   * Calculate number of lines for text
   */
  private calculateTextLines(text: string): number {
    try {
      if (!text || typeof text !== 'string') return 1;
      
      const pageDimensions = this.getPageDimensions();
      const margins = this.config.margins;
      
      // Validate page dimensions and margins
      if (!pageDimensions || !margins) {
        console.warn('[LayoutEngine] Invalid page dimensions or margins, using fallback');
        return Math.max(1, Math.ceil(text.length / 50)); // Rough estimate
      }
      
      const pageWidth = pageDimensions.width - margins.left - margins.right;
      
      // Validate page width
      if (isNaN(pageWidth) || pageWidth <= 0) {
        console.warn('[LayoutEngine] Invalid page width calculated:', pageWidth);
        return Math.max(1, Math.ceil(text.length / 50)); // Rough estimate
      }
      
      // More accurate calculation for Urdu text
      // Urdu characters are typically wider than Latin characters
      let fontSize = this.config.fontSize;
      if (!fontSize || isNaN(fontSize) || fontSize <= 0) {
        fontSize = 16; // Safe fallback
        console.warn('[LayoutEngine] Invalid fontSize in config, using fallback:', fontSize);
      }
      
      const avgCharWidth = fontSize * 0.7; // More accurate for Urdu text
      const charsPerLine = Math.max(1, Math.floor(pageWidth / avgCharWidth)); // Ensure at least 1
      
      // Account for line breaks in the text
      const explicitLineBreaks = (text.match(/\n/g) || []).length;
      const wrappedLines = Math.max(1, Math.ceil(text.length / charsPerLine));
      
      const totalLines = explicitLineBreaks + wrappedLines;
      
      // Validate final result
      if (isNaN(totalLines) || totalLines <= 0) {
        console.warn('[LayoutEngine] Invalid total lines calculated:', {
          text: text.substring(0, 50),
          textLength: text.length,
          pageWidth,
          fontSize,
          avgCharWidth,
          charsPerLine,
          explicitLineBreaks,
          wrappedLines,
          totalLines
        });
        return 1; // Safe fallback
      }
      
      return totalLines;
    } catch (error) {
      console.error('[LayoutEngine] Error calculating text lines:', error);
      return 1; // Safe fallback
    }
  }

  /**
   * Split a large node across multiple pages
   */
  private splitNodeAcrossPages(
    node: DocumentNode, 
    currentPage: LayoutPage, 
    currentY: number, 
    pages: LayoutPage[]
  ): { finalPage: LayoutPage; finalY: number; pageBreaks: PageBreakInfo[] } {
    const pageBreaks: PageBreakInfo[] = [];
    let finalPage = currentPage;
    let finalY = currentY;

    // For now, create a simple split
    // In a full implementation, this would handle text wrapping, table splitting, etc.
    
    const nodeHeight = this.calculateNodeHeight(node);
    // Bottom margin is the page break point, not clipping space
    const availableHeight = currentPage.height - currentY - this.config.margins.bottom;
    
    if (nodeHeight > availableHeight) {
      // Create new page
      const newPage = this.createEmptyPage(pages.length, this.getPageDimensions());
      pages.push(newPage);
      finalPage = newPage;
      finalY = this.config.margins.top + nodeHeight;
      
      pageBreaks.push({
        position: 0, // This would be the actual node index
        pageIndex: currentPage.index,
        isAutomatic: true,
        nodeIndex: 0
      });
    } else {
      finalY += nodeHeight;
    }

    return { finalPage, finalY, pageBreaks };
  }

  /**
   * Count lines in a page's paragraphs
   */
  private countParagraphLines(page: LayoutPage): number {
    return page.boxes.filter(box => box.node.type === 'paragraph').length;
  }

  /**
   * Adjust page break up to include more lines
   */
  private adjustPageBreakUp(pageBreak: PageBreakInfo, linesToMove: number): PageBreakInfo | null {
    // This would implement the logic to move page break up
    // For now, return the original break
    return pageBreak;
  }

  /**
   * Adjust page break down to include more lines
   */
  private adjustPageBreakDown(pageBreak: PageBreakInfo, linesToMove: number): PageBreakInfo | null {
    // This would implement the logic to move page break down
    // For now, return the original break
    return pageBreak;
  }

  /**
   * Calculate flow information
   */
  private calculateFlowInfo(pages: LayoutPage[], pageBreaks: PageBreakInfo[]): ContentFlowInfo {
    try {
      if (!pages || pages.length === 0) {
        return {
          totalContentHeight: 0,
          averagePageHeight: 0,
          overflowPages: [],
          widows: 0,
          orphans: 0
        };
      }

      const totalContentHeight = pages.reduce((sum, page) => {
        const pageHeight = page.contentHeight;
        if (isNaN(pageHeight) || pageHeight < 0) {
          console.warn('[LayoutEngine] Invalid page content height:', pageHeight);
          return sum;
        }
        return sum + pageHeight;
      }, 0);

      const averagePageHeight = pages.length > 0 ? totalContentHeight / pages.length : 0;
      const overflowPages: number[] = [];
      
      // Find pages with content overflow
      pages.forEach((page, index) => {
        try {
          const pageHeight = page.height;
          const margins = page.margins;
          
          if (!pageHeight || !margins || isNaN(pageHeight) || isNaN(margins.top) || isNaN(margins.bottom)) {
            console.warn('[LayoutEngine] Invalid page dimensions for overflow check:', { pageHeight, margins });
            return;
          }
          
          const availableHeight = pageHeight - margins.top - margins.bottom;
          if (page.contentHeight > availableHeight) {
            overflowPages.push(index);
          }
        } catch (error) {
          console.error('[LayoutEngine] Error checking page overflow:', error);
        }
      });

      return {
        totalContentHeight: isNaN(totalContentHeight) ? 0 : totalContentHeight,
        averagePageHeight: isNaN(averagePageHeight) ? 0 : averagePageHeight,
        overflowPages,
        widows: 0, // Would be calculated based on actual content
        orphans: 0 // Would be calculated based on actual content
      };
    } catch (error) {
      console.error('[LayoutEngine] Error calculating flow info:', error);
      return {
        totalContentHeight: 0,
        averagePageHeight: 0,
        overflowPages: [],
        widows: 0,
        orphans: 0
      };
    }
  }

  /**
   * Insert page break node into document content at specified position
   */
  private insertPageBreakAt(position: number): void {
    if (!this.document.content) return;
    
    const pageBreakNode = {
      type: 'pageBreak',
      attrs: {
        pageNumber: 1,
        isManual: false,
        breakType: 'page'
      }
    };
    
    // Insert page break before the node at the specified position
    this.document.content.splice(position, 0, pageBreakNode);
  }

  /**
   * Get page dimensions based on configuration
   */
  private getPageDimensions(): { width: number; height: number } {
    switch (this.config.pageSize) {
      case 'A4':
        return {
          width: this.config.orientation === 'portrait' ? 595 : 842, // A4 in points
          height: this.config.orientation === 'portrait' ? 842 : 595
        };
      case 'Letter':
        return {
          width: this.config.orientation === 'portrait' ? 612 : 792, // Letter in points
          height: this.config.orientation === 'portrait' ? 792 : 612
        };
      case 'Custom':
        return {
          width: this.config.customWidth || 595,
          height: this.config.customHeight || 842
        };
      default:
        return { width: 595, height: 842 };
    }
  }
}

/**
 * Content Handler Implementations
 */

export class ParagraphHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean {
    return node.type === 'paragraph';
  }

  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions {
    const text = this.extractText(node);
    const lines = this.calculateLines(text, context.columnWidth, context.typography);
    const height = lines * context.typography.lineHeight + context.typography.paragraphSpacing;
    
    return {
      width: context.columnWidth,
      height: Math.max(height, context.typography.lineHeight)
    };
  }

  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] {
    const dimensions = this.calculateDimensions(node, context);
    
    return [{
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      pageIndex: 0,
      lineIndex: 0,
      columnIndex: 0,
      node,
      children: [],
      zIndex: 0,
      type: 'content'
    }];
  }

  split(node: DocumentNode, context: LayoutContext): SplitResult {
    // Implement paragraph splitting logic
    const text = this.extractText(node);
    const maxLines = Math.floor(context.availableSpace / context.typography.lineHeight);
    const splitPoint = this.findSplitPoint(text, maxLines, context.columnWidth, context.typography);
    
    return {
      beforeBreak: { ...node, text: text.substring(0, splitPoint) },
      afterBreak: { ...node, text: text.substring(splitPoint) },
      splitPosition: splitPoint,
      heightBefore: 0,
      heightAfter: 0
    };
  }

  private extractText(node: DocumentNode): string {
    if (node.text) return node.text;
    if (node.content) {
      return node.content.map(child => this.extractText(child)).join('');
    }
    return '';
  }

  private calculateLines(text: string, width: number, typography: TypographyConfig): number {
    // Implement text wrapping calculation
    const avgCharWidth = typography.fontSize * 0.6;
    const charsPerLine = Math.floor(width / avgCharWidth);
    return Math.max(1, Math.ceil(text.length / charsPerLine));
  }

  private findSplitPoint(text: string, maxLines: number, width: number, typography: TypographyConfig): number {
    // Find optimal split point for paragraph
    const avgCharWidth = typography.fontSize * 0.6;
    const charsPerLine = Math.floor(width / avgCharWidth);
    const targetChars = maxLines * charsPerLine;
    
    // Try to split at word boundary
    const words = text.split(/\s+/);
    let currentLength = 0;
    let splitIndex = 0;
    
    for (const word of words) {
      if (currentLength + word.length + 1 > targetChars) {
        break;
      }
      currentLength += word.length + 1;
      splitIndex += word.length + 1;
    }
    
    return Math.max(0, Math.min(splitIndex, text.length - 1));
  }
}

export class HeadingHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean {
    return node.type === 'heading';
  }

  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions {
    const level = node.attrs?.level || 1;
    const scaleFactor = Math.max(0.8, 1.5 - (level - 1) * 0.1);
    const height = context.typography.lineHeight * scaleFactor + context.typography.paragraphSpacing;
    
    return {
      width: context.columnWidth,
      height
    };
  }

  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] {
    const dimensions = this.calculateDimensions(node, context);
    
    return [{
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      pageIndex: 0,
      lineIndex: 0,
      columnIndex: 0,
      node,
      children: [],
      zIndex: 0,
      type: 'content'
    }];
  }

  split(node: DocumentNode, context: LayoutContext): SplitResult {
    // Headings generally shouldn't be split
    return {
      beforeBreak: node,
      afterBreak: node,
      splitPosition: 0,
      heightBefore: 0,
      heightAfter: 0
    };
  }
}

export class TableHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean {
    return node.type === 'table';
  }

  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions {
    const rows = node.content?.length || 0;
    const cols = node.attrs?.cols || 1;
    const rowHeight = context.typography.lineHeight * 1.5;
    const totalHeight = rows * rowHeight;
    
    return {
      width: context.columnWidth,
      height: totalHeight,
      minWidth: cols * 50 // Minimum column width
    };
  }

  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] {
    const dimensions = this.calculateDimensions(node, context);
    
    return [{
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      pageIndex: 0,
      lineIndex: 0,
      columnIndex: 0,
      node,
      children: [],
      zIndex: 0,
      type: 'content'
    }];
  }

  split(node: DocumentNode, context: LayoutContext): SplitResult {
    // Implement table splitting logic
    const rows = node.content || [];
    const maxRows = Math.floor(context.availableSpace / (context.typography.lineHeight * 1.5));
    const splitPoint = Math.min(maxRows, rows.length - 1);
    
    return {
      beforeBreak: { ...node, content: rows.slice(0, splitPoint) },
      afterBreak: { ...node, content: rows.slice(splitPoint) },
      splitPosition: splitPoint,
      heightBefore: 0,
      heightAfter: 0
    };
  }
}

export class ImageHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean {
    return node.type === 'image';
  }

  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions {
    const width = node.attrs?.width || context.columnWidth;
    const height = node.attrs?.height || 200;
    const aspectRatio = node.attrs?.aspectRatio;
    
    if (aspectRatio && width) {
      return {
        width: Math.min(width, context.columnWidth),
        height: width / aspectRatio,
        aspectRatio
      };
    }
    
    return {
      width: Math.min(width, context.columnWidth),
      height
    };
  }

  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] {
    const dimensions = this.calculateDimensions(node, context);
    
    return [{
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      pageIndex: 0,
      lineIndex: 0,
      columnIndex: 0,
      node,
      children: [],
      zIndex: 1,
      type: 'image-container'
    }];
  }

  split(node: DocumentNode, context: LayoutContext): SplitResult {
    // Images generally shouldn't be split
    return {
      beforeBreak: node,
      afterBreak: node,
      splitPosition: 0,
      heightBefore: 0,
      heightAfter: 0
    };
  }
}

export class ListHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean {
    return node.type === 'list';
  }

  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions {
    const items = node.content?.length || 0;
    const height = items * context.typography.lineHeight * 1.2;
    
    return {
      width: context.columnWidth,
      height
    };
  }

  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] {
    const dimensions = this.calculateDimensions(node, context);
    
    return [{
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      pageIndex: 0,
      lineIndex: 0,
      columnIndex: 0,
      node,
      children: [],
      zIndex: 0,
      type: 'content'
    }];
  }

  split(node: DocumentNode, context: LayoutContext): SplitResult {
    const items = node.content || [];
    const maxItems = Math.floor(context.availableSpace / (context.typography.lineHeight * 1.2));
    const splitPoint = Math.min(maxItems, items.length - 1);
    
    return {
      beforeBreak: { ...node, content: items.slice(0, splitPoint) },
      afterBreak: { ...node, content: items.slice(splitPoint) },
      splitPosition: splitPoint,
      heightBefore: 0,
      heightAfter: 0
    };
  }
}

export class BlockquoteHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean {
    return node.type === 'blockquote';
  }

  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions {
    const text = this.extractText(node);
    const lines = this.calculateLines(text, context.columnWidth - 40, context.typography); // Account for indentation
    const height = lines * context.typography.lineHeight + context.typography.paragraphSpacing;
    
    return {
      width: context.columnWidth,
      height: Math.max(height, context.typography.lineHeight)
    };
  }

  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] {
    const dimensions = this.calculateDimensions(node, context);
    
    return [{
      x: 20, // Indentation
      y: 0,
      width: dimensions.width - 40,
      height: dimensions.height,
      pageIndex: 0,
      lineIndex: 0,
      columnIndex: 0,
      node,
      children: [],
      zIndex: 0,
      type: 'content'
    }];
  }

  split(node: DocumentNode, context: LayoutContext): SplitResult {
    const text = this.extractText(node);
    const maxLines = Math.floor(context.availableSpace / context.typography.lineHeight);
    const splitPoint = this.findSplitPoint(text, maxLines, context.columnWidth - 40, context.typography);
    
    return {
      beforeBreak: { ...node, content: [{ ...node, text: text.substring(0, splitPoint) }] },
      afterBreak: { ...node, content: [{ ...node, text: text.substring(splitPoint) }] },
      splitPosition: splitPoint,
      heightBefore: 0,
      heightAfter: 0
    };
  }

  private extractText(node: DocumentNode): string {
    if (node.text) return node.text;
    if (node.content) {
      return node.content.map(child => this.extractText(child)).join('');
    }
    return '';
  }

  private calculateLines(text: string, width: number, typography: TypographyConfig): number {
    const avgCharWidth = typography.fontSize * 0.6;
    const charsPerLine = Math.floor(width / avgCharWidth);
    return Math.max(1, Math.ceil(text.length / charsPerLine));
  }

  private findSplitPoint(text: string, maxLines: number, width: number, typography: TypographyConfig): number {
    const avgCharWidth = typography.fontSize * 0.6;
    const charsPerLine = Math.floor(width / avgCharWidth);
    const targetChars = maxLines * charsPerLine;
    
    const words = text.split(/\s+/);
    let currentLength = 0;
    let splitIndex = 0;
    
    for (const word of words) {
      if (currentLength + word.length + 1 > targetChars) {
        break;
      }
      currentLength += word.length + 1;
      splitIndex += word.length + 1;
    }
    
    return Math.max(0, Math.min(splitIndex, text.length - 1));
  }
}

export class CodeBlockHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean {
    return node.type === 'codeBlock';
  }

  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions {
    const text = this.extractText(node);
    const lines = text.split('\n').length;
    const height = lines * context.typography.lineHeight * 1.2 + 20; // Extra padding
    
    return {
      width: context.columnWidth,
      height
    };
  }

  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] {
    const dimensions = this.calculateDimensions(node, context);
    
    return [{
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      pageIndex: 0,
      lineIndex: 0,
      columnIndex: 0,
      node,
      children: [],
      zIndex: 0,
      type: 'content',
      style: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 4
      }
    }];
  }

  split(node: DocumentNode, context: LayoutContext): SplitResult {
    const text = this.extractText(node);
    const lines = text.split('\n');
    const maxLines = Math.floor(context.availableSpace / (context.typography.lineHeight * 1.2));
    const splitPoint = Math.min(maxLines, lines.length - 1);
    
    return {
      beforeBreak: { ...node, content: [{ ...node, text: lines.slice(0, splitPoint).join('\n') }] },
      afterBreak: { ...node, content: [{ ...node, text: lines.slice(splitPoint).join('\n') }] },
      splitPosition: splitPoint,
      heightBefore: 0,
      heightAfter: 0
    };
  }

  private extractText(node: DocumentNode): string {
    if (node.text) return node.text;
    if (node.content) {
      return node.content.map(child => this.extractText(child)).join('');
    }
    return '';
  }
}

// Placeholder handlers for future content types
export class MathHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean { return node.type === 'math'; }
  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions { return { width: 100, height: 50 }; }
  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] { return []; }
  split(node: DocumentNode, context: LayoutContext): SplitResult { return { beforeBreak: node, afterBreak: node, splitPosition: 0, heightBefore: 0, heightAfter: 0 }; }
}

export class ChartHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean { return node.type === 'chart'; }
  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions { return { width: 200, height: 150 }; }
  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] { return []; }
  split(node: DocumentNode, context: LayoutContext): SplitResult { return { beforeBreak: node, afterBreak: node, splitPosition: 0, heightBefore: 0, heightAfter: 0 }; }
}

export class EquationHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean { return node.type === 'equation'; }
  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions { return { width: 100, height: 50 }; }
  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] { return []; }
  split(node: DocumentNode, context: LayoutContext): SplitResult { return { beforeBreak: node, afterBreak: node, splitPosition: 0, heightBefore: 0, heightAfter: 0 }; }
}

export class FootnoteHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean { return node.type === 'footnote'; }
  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions { return { width: context.columnWidth, height: 50 }; }
  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] { return []; }
  split(node: DocumentNode, context: LayoutContext): SplitResult { return { beforeBreak: node, afterBreak: node, splitPosition: 0, heightBefore: 0, heightAfter: 0 }; }
}

export class CommentHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean { return node.type === 'comment'; }
  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions { return { width: context.columnWidth, height: 30 }; }
  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] { return []; }
  split(node: DocumentNode, context: LayoutContext): SplitResult { return { beforeBreak: node, afterBreak: node, splitPosition: 0, heightBefore: 0, heightAfter: 0 }; }
}

export class HorizontalRuleHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean { return node.type === 'horizontalRule'; }
  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions { return { width: context.columnWidth, height: 20 }; }
  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] { 
    return [{
      x: 0,
      y: 0,
      width: context.columnWidth,
      height: 20,
      pageIndex: 0,
      lineIndex: 0,
      columnIndex: 0,
      node,
      children: [],
      zIndex: 0,
      type: 'content'
    }];
  }
  split(node: DocumentNode, context: LayoutContext): SplitResult { return { beforeBreak: node, afterBreak: node, splitPosition: 0, heightBefore: 0, heightAfter: 0 }; }
}

export class HardBreakHandler implements ContentHandler {
  canHandle(node: DocumentNode): boolean { return node.type === 'hardBreak'; }
  calculateDimensions(node: DocumentNode, context: LayoutContext): Dimensions { return { width: 0, height: context.typography.lineHeight }; }
  layout(node: DocumentNode, context: LayoutContext): LayoutBox[] { 
    return [{
      x: 0,
      y: 0,
      width: 0,
      height: context.typography.lineHeight,
      pageIndex: 0,
      lineIndex: 0,
      columnIndex: 0,
      node,
      children: [],
      zIndex: 0,
      type: 'content'
    }];
  }
  split(node: DocumentNode, context: LayoutContext): SplitResult { return { beforeBreak: node, afterBreak: node, splitPosition: 0, heightBefore: 0, heightAfter: 0 }; }
}

/**
 * Layout Engine Factory
 */
export class LayoutEngineFactory {
  static create(config: LayoutEngineConfig): ProfessionalLayoutEngine {
    try {
      // Validate config before creating engine
      if (!config || !config.pageSize) {
        throw new Error('Invalid layout engine configuration: missing pageSize');
      }
      
      if (!config.margins || typeof config.margins.top !== 'number') {
        throw new Error('Invalid layout engine configuration: missing or invalid margins');
      }
      
      return new ProfessionalLayoutEngine(config);
    } catch (error) {
      console.error('Failed to create layout engine:', error);
      // Return engine with default config as fallback
      return new ProfessionalLayoutEngine(LayoutEngineFactory.createDefaultConfig());
    }
  }

  static createDefaultConfig(): LayoutEngineConfig {
    return {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72,
        header: 36,
        footer: 36,
        gutter: 0
      },
      columns: {
        count: 1,
        spacing: 12,
        balance: true,
        separator: {
          enabled: false,
          style: 'space',
          width: 1,
          color: '#000000'
        }
      },
      headers: {
        enabled: false,
        height: 36,
        repeatOnPages: 'all'
      },
      footers: {
        enabled: false,
        height: 36,
        repeatOnPages: 'all'
      },
      typography: {
        fontFamily: 'Noto Nastaliq Urdu',
        fontSize: 12,
        lineHeight: 14.4,
        textDirection: 'rtl',
        textAlign: 'right',
        paragraphSpacing: 6,
        characterSpacing: 0,
        wordSpacing: 0,
        hyphenation: true,
        widowControl: 2,
        orphanControl: 2
      },
      layout: {
        autoPageBreaks: true,
        manualPageBreaks: true,
        keepTogether: true,
        keepWithNext: false,
        pageBreakBefore: false,
        pageBreakAfter: false,
        floatingObjects: true,
        textWrapping: {
          enabled: true,
          style: 'square',
          margin: { top: 6, right: 6, bottom: 6, left: 6 }
        }
      },
      features: {
        tables: true,
        images: true,
        charts: true,
        equations: true,
        footnotes: true,
        endnotes: false,
        citations: true,
        tableOfContents: false,
        bookmarks: false,
        hyperlinks: true,
        comments: true,
        trackChanges: false,
        watermarks: false,
        backgrounds: true,
        borders: true,
        shadows: true
      }
    };
  }
}

export default ProfessionalLayoutEngine;
