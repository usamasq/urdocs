/**
 * Document Factory Functions
 * Create any type of document node with proper structure
 */

import { 
  DocumentNode, 
  Mark, 
  NodeType, 
  MarkType,
  UrduTextNode,
  PageBreakNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  ImageNode,
  ListNode,
  ListItemNode,
  CodeBlockNode,
  LinkNode,
  MathNode,
  CitationNode,
  FootnoteNode,
  CommentNode,
  HighlightNode,
  RTLSupport
} from './types';

/**
 * Create a document node with proper structure
 */
export function createNode(
  type: NodeType, 
  content?: DocumentNode[] | string, 
  attrs?: Record<string, any>,
  marks?: Mark[]
): DocumentNode {
  const node: DocumentNode = {
    type,
    attrs: attrs || {}
  };

  if (content) {
    if (typeof content === 'string') {
      node.text = content;
    } else {
      node.content = content;
    }
  }

  if (marks && marks.length > 0) {
    node.marks = marks;
  }

  return node;
}

/**
 * Create a paragraph node
 */
export function createParagraph(
  text?: string, 
  marks?: Mark[], 
  attrs?: Record<string, any>
): DocumentNode {
  const paragraphAttrs: Record<string, any> = {
    dir: 'rtl',
    align: 'right',
    ...attrs
  };

  if (text) {
    return createNode('paragraph', [createTextNode(text, marks)], paragraphAttrs);
  }

  return createNode('paragraph', [], paragraphAttrs);
}

/**
 * Create a text node
 */
export function createTextNode(text: string, marks?: Mark[]): DocumentNode {
  const node: DocumentNode = {
    type: 'text',
    text,
    attrs: {
      direction: 'rtl',
      language: 'ur',
      script: 'arabic'
    }
  };

  if (marks && marks.length > 0) {
    node.marks = marks;
  }

  return node;
}

/**
 * Create a heading node
 */
export function createHeading(
  level: 1 | 2 | 3 | 4 | 5 | 6, 
  text: string, 
  marks?: Mark[],
  attrs?: Record<string, any>
): DocumentNode {
  const headingAttrs: Record<string, any> = {
    level,
    dir: 'rtl',
    align: 'right',
    ...attrs
  };

  return createNode('heading', [createTextNode(text, marks)], headingAttrs);
}

/**
 * Create a page break node
 */
export function createPageBreak(
  pageNumber: number = 1, 
  isManual: boolean = false,
  breakType: 'page' | 'column' | 'section' = 'page'
): DocumentNode {
  const pageBreakAttrs = {
    pageNumber,
    isManual,
    breakType,
    style: 'solid' as const
  };

  return createNode('pageBreak', [], pageBreakAttrs);
}

/**
 * Create a table node
 */
export function createTable(
  rows: number, 
  cols: number, 
  content?: DocumentNode[][],
  attrs?: Record<string, any>
): DocumentNode {
  const tableAttrs: Record<string, any> = {
    rows,
    cols,
    border: true,
    striped: false,
    hover: false,
    ...attrs
  };

  let tableContent: DocumentNode[] = [];
  
  if (content) {
    tableContent = content.map((rowContent, rowIndex) => 
      createTableRow(rowContent, rowIndex, attrs)
    );
  } else {
    // Create empty table
    tableContent = Array.from({ length: rows }, (_, rowIndex) => 
      createTableRow(
        Array.from({ length: cols }, () => createParagraph()),
        rowIndex,
        attrs
      )
    );
  }

  return createNode('table', tableContent, tableAttrs);
}

/**
 * Create a table row node
 */
export function createTableRow(
  cells: DocumentNode[], 
  rowIndex: number,
  attrs?: Record<string, any>
): DocumentNode {
  const rowAttrs: Record<string, any> = {
    rowIndex,
    ...attrs
  };

  const rowContent = cells.map((cellContent, colIndex) => 
    createTableCell(cellContent, rowIndex, colIndex, attrs)
  );

  return createNode('tableRow', rowContent, rowAttrs);
}

/**
 * Create a table cell node
 */
export function createTableCell(
  content: DocumentNode, 
  rowIndex: number, 
  colIndex: number,
  attrs?: Record<string, any>
): DocumentNode {
  const cellAttrs: Record<string, any> = {
    rowIndex,
    colIndex,
    align: 'right',
    border: true,
    ...attrs
  };

  return createNode('tableCell', [content], cellAttrs);
}

/**
 * Create an image node
 */
export function createImage(
  src: string, 
  alt?: string, 
  title?: string,
  attrs?: Record<string, any>
): DocumentNode {
  const imageAttrs: Record<string, any> = {
    src,
    alt: alt || '',
    title: title || '',
    float: 'none',
    border: false,
    shadow: false,
    ...attrs
  };

  return createNode('image', [], imageAttrs);
}

/**
 * Create a list node
 */
export function createList(
  items: string[], 
  listType: 'bullet' | 'ordered' | 'task' = 'bullet',
  attrs?: Record<string, any>
): DocumentNode {
  const listAttrs: Record<string, any> = {
    listType,
    tight: false,
    ...attrs
  };

  const listContent = items.map((item, index) => 
    createListItem(createParagraph(item), index, listType === 'task' ? { checked: false } : {})
  );

  return createNode('list', listContent, listAttrs);
}

/**
 * Create a list item node
 */
export function createListItem(
  content: DocumentNode, 
  index: number,
  attrs?: Record<string, any>
): DocumentNode {
  const itemAttrs: Record<string, any> = {
    level: 0,
    ...attrs
  };

  return createNode('listItem', [content], itemAttrs);
}

/**
 * Create a blockquote node
 */
export function createBlockquote(
  content: DocumentNode[], 
  attrs?: Record<string, any>
): DocumentNode {
  const blockquoteAttrs: Record<string, any> = {
    dir: 'rtl',
    ...attrs
  };

  return createNode('blockquote', content, blockquoteAttrs);
}

/**
 * Create a code block node
 */
export function createCodeBlock(
  code: string, 
  language?: string,
  attrs?: Record<string, any>
): DocumentNode {
  const codeAttrs: Record<string, any> = {
    language: language || '',
    theme: 'light',
    lineNumbers: false,
    wrap: true,
    ...attrs
  };

  return createNode('codeBlock', [createTextNode(code)], codeAttrs);
}

/**
 * Create a link node
 */
export function createLink(
  href: string, 
  text: string, 
  target?: '_blank' | '_self' | '_parent' | '_top',
  attrs?: Record<string, any>
): DocumentNode {
  const linkAttrs: Record<string, any> = {
    href,
    target: target || '_blank',
    ...attrs
  };

  const linkMark: Mark = {
    type: 'link',
    attrs: linkAttrs
  };

  return createTextNode(text, [linkMark]);
}

/**
 * Create a math node
 */
export function createMath(
  formula: string, 
  display: 'inline' | 'block' = 'inline',
  format: 'latex' | 'mathml' | 'asciimath' = 'latex'
): DocumentNode {
  const mathAttrs = {
    formula,
    display,
    format
  };

  return createNode('math', [], mathAttrs);
}

/**
 * Create a citation node
 */
export function createCitation(
  id: string,
  authors: string[],
  title: string,
  year: number,
  attrs?: Record<string, any>
): DocumentNode {
  const citationAttrs: Record<string, any> = {
    id,
    style: 'apa',
    authors,
    title,
    year,
    ...attrs
  };

  return createNode('citation', [], citationAttrs);
}

/**
 * Create a footnote node
 */
export function createFootnote(
  id: string,
  number: number,
  content: string
): DocumentNode {
  const footnoteAttrs = {
    id,
    number,
    content
  };

  return createNode('footnote', [], footnoteAttrs);
}

/**
 * Create a comment node
 */
export function createComment(
  id: string,
  author: string,
  content: string,
  attrs?: Record<string, any>
): DocumentNode {
  const commentAttrs: Record<string, any> = {
    id,
    author,
    content,
    timestamp: new Date(),
    resolved: false,
    ...attrs
  };

  return createNode('comment', [], commentAttrs);
}

/**
 * Create a highlight node
 */
export function createHighlight(
  text: string,
  color: string = 'yellow',
  attrs?: Record<string, any>
): DocumentNode {
  const highlightAttrs: Record<string, any> = {
    color,
    opacity: 0.3,
    ...attrs
  };

  const highlightMark: Mark = {
    type: 'highlight',
    attrs: highlightAttrs
  };

  return createTextNode(text, [highlightMark]);
}

/**
 * Create mark for formatting
 */
export function createMark(
  type: MarkType, 
  attrs?: Record<string, any>
): Mark {
  return {
    type,
    attrs: attrs || {}
  };
}

/**
 * Create bold mark
 */
export function createBoldMark(): Mark {
  return createMark('bold');
}

/**
 * Create italic mark
 */
export function createItalicMark(): Mark {
  return createMark('italic');
}

/**
 * Create underline mark
 */
export function createUnderlineMark(): Mark {
  return createMark('underline');
}

/**
 * Create strikethrough mark
 */
export function createStrikeMark(): Mark {
  return createMark('strike');
}

/**
 * Create font size mark
 */
export function createFontSizeMark(size: number): Mark {
  return createMark('fontSize', { size });
}

/**
 * Create font family mark
 */
export function createFontFamilyMark(family: string): Mark {
  return createMark('fontFamily', { family });
}

/**
 * Create color mark
 */
export function createColorMark(color: string): Mark {
  return createMark('color', { color });
}

/**
 * Create background color mark
 */
export function createBackgroundColorMark(color: string): Mark {
  return createMark('backgroundColor', { color });
}

/**
 * Create subscript mark
 */
export function createSubscriptMark(): Mark {
  return createMark('subscript');
}

/**
 * Create superscript mark
 */
export function createSuperscriptMark(): Mark {
  return createMark('superscript');
}

/**
 * Create text direction mark
 */
export function createTextDirectionMark(direction: 'ltr' | 'rtl'): Mark {
  return createMark('textDirection', { direction });
}

/**
 * Create text alignment mark
 */
export function createTextAlignMark(align: 'left' | 'center' | 'right' | 'justify'): Mark {
  return createMark('textAlign', { align });
}

/**
 * Create line height mark
 */
export function createLineHeightMark(height: number): Mark {
  return createMark('lineHeight', { height });
}

/**
 * Create letter spacing mark
 */
export function createLetterSpacingMark(spacing: number): Mark {
  return createMark('letterSpacing', { spacing });
}

/**
 * Create word spacing mark
 */
export function createWordSpacingMark(spacing: number): Mark {
  return createMark('wordSpacing', { spacing });
}

/**
 * Create an empty document
 */
export function createEmptyDocument(): DocumentNode {
  return createNode('doc', [createParagraph()]);
}

/**
 * Create a document with initial content
 */
export function createDocument(content: DocumentNode[]): DocumentNode {
  return createNode('doc', content);
}

/**
 * Create a document from text
 */
export function createDocumentFromText(text: string): DocumentNode {
  const paragraphs = text.split('\n\n').map(paragraphText => 
    createParagraph(paragraphText.trim())
  );
  
  return createDocument(paragraphs);
}

/**
 * Create a document with RTL support
 */
export function createRTLDocument(content: DocumentNode[]): DocumentNode {
  const rtlContent = content.map(node => {
    if (node.type === 'paragraph' || node.type === 'heading') {
      return {
        ...node,
        attrs: {
          ...node.attrs,
          dir: 'rtl',
          align: 'right'
        }
      };
    }
    return node;
  });

  return createDocument(rtlContent);
}

/**
 * Create a document with Urdu text
 */
export function createUrduDocument(content: DocumentNode[]): DocumentNode {
  const urduContent = content.map(node => {
    if (node.type === 'paragraph' || node.type === 'heading') {
      return {
        ...node,
        attrs: {
          ...node.attrs,
          dir: 'rtl',
          align: 'right',
          language: 'ur'
        }
      };
    }
    return node;
  });

  return createDocument(urduContent);
}

/**
 * Create a document with page breaks
 */
export function createDocumentWithPageBreaks(
  content: DocumentNode[], 
  pageBreakPositions: number[]
): DocumentNode {
  const result: DocumentNode[] = [];
  let currentPosition = 0;

  content.forEach((node, index) => {
    result.push(node);
    currentPosition++;

    // Check if we need to insert a page break after this node
    if (pageBreakPositions.includes(currentPosition)) {
      result.push(createPageBreak(result.length + 1, false));
    }
  });

  return createDocument(result);
}

/**
 * Create a document template
 */
export function createDocumentTemplate(
  name: string,
  structure: DocumentNode,
  variables: any[] = []
): DocumentNode {
  return createNode('doc', [structure], {
    template: true,
    templateName: name,
    variables
  });
}

/**
 * Utility function to check if a node is empty
 */
export function isEmptyNode(node: DocumentNode): boolean {
  if (node.text) {
    return node.text.trim().length === 0;
  }
  
  if (node.content) {
    return node.content.length === 0 || node.content.every(isEmptyNode);
  }
  
  return true;
}

/**
 * Utility function to get text content from a node
 */
export function getNodeText(node: DocumentNode): string {
  if (node.text) {
    return node.text;
  }
  
  if (node.content) {
    return node.content.map(getNodeText).join('');
  }
  
  return '';
}

/**
 * Utility function to get all text content from a document
 */
export function getDocumentText(document: DocumentNode): string {
  return getNodeText(document);
}

/**
 * Utility function to count nodes of a specific type
 */
export function countNodes(document: DocumentNode, nodeType: NodeType): number {
  let count = 0;
  
  if (document.type === nodeType) {
    count++;
  }
  
  if (document.content) {
    count += document.content.reduce((sum, child) => sum + countNodes(child, nodeType), 0);
  }
  
  return count;
}

/**
 * Utility function to find nodes of a specific type
 */
export function findNodes(document: DocumentNode, nodeType: NodeType): DocumentNode[] {
  const result: DocumentNode[] = [];
  
  if (document.type === nodeType) {
    result.push(document);
  }
  
  if (document.content) {
    document.content.forEach(child => {
      result.push(...findNodes(child, nodeType));
    });
  }
  
  return result;
}

/**
 * Get page break positions from document
 */
export function getPageBreakPositions(document: DocumentNode): number[] {
  const positions: number[] = [];
  
  const traverse = (node: DocumentNode, path: number[]): void => {
    if (node.type === 'pageBreak') {
      positions.push(path[path.length - 1] || 0);
    }
    
    if (node.content) {
      node.content.forEach((child, index) => {
        traverse(child, [...path, index]);
      });
    }
  };
  
  traverse(document, []);
  return positions;
}

/**
 * Split document into pages based on page breaks
 */
export function splitDocumentIntoPages(document: DocumentNode): DocumentNode[] {
  if (!document.content) {
    return [document];
  }
  
  const pages: DocumentNode[] = [];
  let currentPageContent: DocumentNode[] = [];
  
  for (const node of document.content) {
    if (node.type === 'pageBreak') {
      // End current page and start new one
      if (currentPageContent.length > 0) {
        pages.push(createDocument(currentPageContent));
        currentPageContent = [];
      }
    } else {
      currentPageContent.push(node);
    }
  }
  
  // Add remaining content as last page
  if (currentPageContent.length > 0) {
    pages.push(createDocument(currentPageContent));
  }
  
  // If no page breaks found, return the entire document as one page
  if (pages.length === 0) {
    pages.push(document);
  }
  
  return pages;
}

/**
 * Export all factory functions
 */
export * from './factory';
