/**
 * HTML Serialization for Structured Document Model
 * Convert document nodes to/from HTML with proper RTL support
 */

import { 
  DocumentNode, 
  Mark, 
  MarkType,
  NodeType,
  UrduTextNode,
  PageBreakNode,
  TableNode,
  ImageNode,
  ListNode,
  CodeBlockNode,
  LinkNode,
  MathNode,
  CitationNode,
  FootnoteNode,
  CommentNode,
  HighlightNode
} from '../schema/types';

/**
 * Convert document node to HTML
 */
export function documentToHtml(document: DocumentNode): string {
  if (!document || !document.content) {
    return '';
  }

  const htmlParts = document.content.map(node => nodeToHtml(node)).filter(Boolean);
  return htmlParts.join('');
}

/**
 * Convert a single node to HTML
 */
export function nodeToHtml(node: DocumentNode): string {
  if (!node) return '';

  switch (node.type) {
    case 'doc':
      return documentToHtml(node);
    
    case 'paragraph':
      return paragraphToHtml(node);
    
    case 'heading':
      return headingToHtml(node);
    
    case 'text':
      return textToHtml(node);
    
    case 'pageBreak':
      return pageBreakToHtml(node);
    
    case 'table':
      return tableToHtml(node);
    
    case 'tableRow':
      return tableRowToHtml(node);
    
    case 'tableCell':
      return tableCellToHtml(node);
    
    case 'image':
      return imageToHtml(node);
    
    case 'list':
      return listToHtml(node);
    
    case 'listItem':
      return listItemToHtml(node);
    
    case 'blockquote':
      return blockquoteToHtml(node);
    
    case 'codeBlock':
      return codeBlockToHtml(node);
    
    case 'horizontalRule':
      return '<hr>';
    
    case 'hardBreak':
      return '<br>';
    
    case 'math':
      return mathToHtml(node);
    
    case 'citation':
      return citationToHtml(node);
    
    case 'footnote':
      return footnoteToHtml(node);
    
    case 'comment':
      return commentToHtml(node);
    
    default:
      console.warn(`Unknown node type: ${node.type}`);
      return '';
  }
}

/**
 * Convert paragraph to HTML
 */
function paragraphToHtml(node: DocumentNode): string {
  const attrs = getNodeAttributes(node);
  const content = node.content ? node.content.map(nodeToHtml).join('') : '';
  
  return `<p${attrs}>${content}</p>`;
}

/**
 * Convert heading to HTML
 */
function headingToHtml(node: DocumentNode): string {
  const level = node.attrs?.level || 1;
  const attrs = getNodeAttributes(node);
  const content = node.content ? node.content.map(nodeToHtml).join('') : '';
  
  return `<h${level}${attrs}>${content}</h${level}>`;
}

/**
 * Convert text to HTML
 */
function textToHtml(node: DocumentNode): string {
  let text = node.text || '';
  
  // Apply marks
  if (node.marks && node.marks.length > 0) {
    text = applyMarksToText(text, node.marks);
  }
  
  return text;
}

/**
 * Convert page break to HTML
 */
function pageBreakToHtml(node: DocumentNode): string {
  const pageBreakNode = node as PageBreakNode;
  const pageNumber = pageBreakNode.attrs?.pageNumber || 1;
  const isManual = pageBreakNode.attrs?.isManual || false;
  const breakType = pageBreakNode.attrs?.breakType || 'page';
  
  console.log('[pageBreakToHtml] Converting page break to HTML:', { pageNumber, isManual, breakType });
  
  const className = `page-break page-break-${breakType} ${isManual ? 'manual' : 'automatic'}`;
  const dataAttrs = `data-type="page-break" data-page-number="${pageNumber}" data-manual="${isManual}" data-break-type="${breakType}"`;
  
  const html = `<div class="${className}" ${dataAttrs} style="display: none; height: 0; margin: 0; padding: 0; border: none; page-break-after: always;"></div>`;
  console.log('[pageBreakToHtml] Generated HTML:', html);
  
  return html;
}

/**
 * Convert table to HTML
 */
function tableToHtml(node: DocumentNode): string {
  const tableNode = node as TableNode;
  const attrs = getNodeAttributes(node);
  const content = node.content ? node.content.map(nodeToHtml).join('') : '';
  
  return `<table${attrs}>${content}</table>`;
}

/**
 * Convert table row to HTML
 */
function tableRowToHtml(node: DocumentNode): string {
  const attrs = getNodeAttributes(node);
  const content = node.content ? node.content.map(nodeToHtml).join('') : '';
  
  return `<tr${attrs}>${content}</tr>`;
}

/**
 * Convert table cell to HTML
 */
function tableCellToHtml(node: DocumentNode): string {
  const attrs = getNodeAttributes(node);
  const content = node.content ? node.content.map(nodeToHtml).join('') : '';
  
  return `<td${attrs}>${content}</td>`;
}

/**
 * Convert image to HTML
 */
function imageToHtml(node: DocumentNode): string {
  const imageNode = node as ImageNode;
  const src = imageNode.attrs?.src || '';
  const alt = imageNode.attrs?.alt || '';
  const title = imageNode.attrs?.title || '';
  const width = imageNode.attrs?.width;
  const height = imageNode.attrs?.height;
  const float = imageNode.attrs?.float || 'none';
  const border = imageNode.attrs?.border || false;
  const shadow = imageNode.attrs?.shadow || false;
  
  let attrs = `src="${src}" alt="${alt}"`;
  if (title) attrs += ` title="${title}"`;
  if (width) attrs += ` width="${width}"`;
  if (height) attrs += ` height="${height}"`;
  
  let className = 'document-image';
  if (float !== 'none') className += ` float-${float}`;
  if (border) className += ' bordered';
  if (shadow) className += ' shadowed';
  
  return `<img class="${className}" ${attrs} />`;
}

/**
 * Convert list to HTML
 */
function listToHtml(node: DocumentNode): string {
  const listNode = node as ListNode;
  const listType = listNode.attrs?.listType || 'bullet';
  const attrs = getNodeAttributes(node);
  const content = node.content ? node.content.map(nodeToHtml).join('') : '';
  
  const tag = listType === 'ordered' ? 'ol' : 'ul';
  return `<${tag}${attrs}>${content}</${tag}>`;
}

/**
 * Convert list item to HTML
 */
function listItemToHtml(node: DocumentNode): string {
  const attrs = getNodeAttributes(node);
  const content = node.content ? node.content.map(nodeToHtml).join('') : '';
  
  return `<li${attrs}>${content}</li>`;
}

/**
 * Convert blockquote to HTML
 */
function blockquoteToHtml(node: DocumentNode): string {
  const attrs = getNodeAttributes(node);
  const content = node.content ? node.content.map(nodeToHtml).join('') : '';
  
  return `<blockquote${attrs}>${content}</blockquote>`;
}

/**
 * Convert code block to HTML
 */
function codeBlockToHtml(node: DocumentNode): string {
  const codeNode = node as CodeBlockNode;
  const language = codeNode.attrs?.language || '';
  const attrs = getNodeAttributes(node);
  const content = node.content ? node.content.map(nodeToHtml).join('') : '';
  
  if (language) {
    return `<pre${attrs}><code class="language-${language}">${content}</code></pre>`;
  }
  
  return `<pre${attrs}><code>${content}</code></pre>`;
}

/**
 * Convert math to HTML
 */
function mathToHtml(node: DocumentNode): string {
  const mathNode = node as MathNode;
  const formula = mathNode.attrs?.formula || '';
  const display = mathNode.attrs?.display || 'inline';
  const format = mathNode.attrs?.format || 'latex';
  
  const className = `math math-${display} math-${format}`;
  return `<span class="${className}" data-formula="${formula}">${formula}</span>`;
}

/**
 * Convert citation to HTML
 */
function citationToHtml(node: DocumentNode): string {
  const citationNode = node as CitationNode;
  const id = citationNode.attrs?.id || '';
  const style = citationNode.attrs?.style || 'apa';
  const authors = citationNode.attrs?.authors || [];
  const title = citationNode.attrs?.title || '';
  const year = citationNode.attrs?.year || '';
  
  const citationText = formatCitation(authors, title, year, style);
  return `<cite class="citation citation-${style}" data-id="${id}">${citationText}</cite>`;
}

/**
 * Convert footnote to HTML
 */
function footnoteToHtml(node: DocumentNode): string {
  const footnoteNode = node as FootnoteNode;
  const id = footnoteNode.attrs?.id || '';
  const number = footnoteNode.attrs?.number || 1;
  const content = footnoteNode.attrs?.content || '';
  
  return `<sup class="footnote" data-id="${id}" data-number="${number}">${number}</sup>`;
}

/**
 * Convert comment to HTML
 */
function commentToHtml(node: DocumentNode): string {
  const commentNode = node as CommentNode;
  const id = commentNode.attrs?.id || '';
  const author = commentNode.attrs?.author || '';
  const content = commentNode.attrs?.content || '';
  const timestamp = commentNode.attrs?.timestamp || new Date();
  const resolved = commentNode.attrs?.resolved || false;
  
  const className = `comment ${resolved ? 'resolved' : 'unresolved'}`;
  const dataAttrs = `data-id="${id}" data-author="${author}" data-timestamp="${timestamp.toISOString()}"`;
  
  return `<span class="${className}" ${dataAttrs} title="${content}">💬</span>`;
}

/**
 * Apply marks to text
 */
function applyMarksToText(text: string, marks: Mark[]): string {
  let result = text;
  
  // Sort marks by priority (some marks should be applied first)
  const sortedMarks = marks.sort((a, b) => getMarkPriority(a.type) - getMarkPriority(b.type));
  
  for (const mark of sortedMarks) {
    result = applyMarkToText(result, mark);
  }
  
  return result;
}

/**
 * Apply a single mark to text
 */
function applyMarkToText(text: string, mark: Mark): string {
  const { type, attrs } = mark;
  
  switch (type) {
    case 'bold':
      return `<strong>${text}</strong>`;
    
    case 'italic':
      return `<em>${text}</em>`;
    
    case 'underline':
      return `<u>${text}</u>`;
    
    case 'strike':
      return `<s>${text}</s>`;
    
    case 'code':
      return `<code>${text}</code>`;
    
    case 'link':
      const href = attrs?.href || '#';
      const target = attrs?.target || '_blank';
      return `<a href="${href}" target="${target}">${text}</a>`;
    
    case 'highlight':
      const color = attrs?.color || 'yellow';
      const opacity = attrs?.opacity || 0.3;
      return `<mark style="background-color: ${color}; opacity: ${opacity};">${text}</mark>`;
    
    case 'fontSize':
      const size = attrs?.size || 16;
      return `<span style="font-size: ${size}px;">${text}</span>`;
    
    case 'fontFamily':
      const family = attrs?.family || 'inherit';
      return `<span style="font-family: ${family};">${text}</span>`;
    
    case 'color':
      const textColor = attrs?.color || '#000000';
      return `<span style="color: ${textColor};">${text}</span>`;
    
    case 'backgroundColor':
      const bgColor = attrs?.color || 'transparent';
      return `<span style="background-color: ${bgColor};">${text}</span>`;
    
    case 'subscript':
      return `<sub>${text}</sub>`;
    
    case 'superscript':
      return `<sup>${text}</sup>`;
    
    case 'textDirection':
      const direction = attrs?.direction || 'rtl';
      return `<span dir="${direction}">${text}</span>`;
    
    case 'textAlign':
      const align = attrs?.align || 'right';
      return `<span style="text-align: ${align};">${text}</span>`;
    
    case 'lineHeight':
      const lineHeight = attrs?.height || 1.5;
      return `<span style="line-height: ${lineHeight};">${text}</span>`;
    
    case 'letterSpacing':
      const letterSpacing = attrs?.spacing || 0;
      return `<span style="letter-spacing: ${letterSpacing}px;">${text}</span>`;
    
    case 'wordSpacing':
      const wordSpacing = attrs?.spacing || 0;
      return `<span style="word-spacing: ${wordSpacing}px;">${text}</span>`;
    
    default:
      console.warn(`Unknown mark type: ${type}`);
      return text;
  }
}

/**
 * Get mark priority for sorting
 */
function getMarkPriority(markType: MarkType): number {
  const priorities: Record<MarkType, number> = {
    'bold': 1,
    'italic': 2,
    'underline': 3,
    'strike': 4,
    'code': 5,
    'link': 6,
    'highlight': 7,
    'fontSize': 8,
    'fontFamily': 9,
    'color': 10,
    'backgroundColor': 11,
    'subscript': 12,
    'superscript': 13,
    'textDirection': 14,
    'textAlign': 15,
    'lineHeight': 16,
    'letterSpacing': 17,
    'wordSpacing': 18
  };
  
  return priorities[markType] || 999;
}

/**
 * Get node attributes as HTML string
 */
function getNodeAttributes(node: DocumentNode): string {
  if (!node.attrs) return '';
  
  const attrs: string[] = [];
  
  // Handle common attributes
  if (node.attrs.dir) {
    attrs.push(`dir="${node.attrs.dir}"`);
  }
  
  if (node.attrs.align) {
    attrs.push(`style="text-align: ${node.attrs.align};"`);
  }
  
  if (node.attrs.class) {
    attrs.push(`class="${node.attrs.class}"`);
  }
  
  if (node.attrs.id) {
    attrs.push(`id="${node.attrs.id}"`);
  }
  
  // Handle RTL-specific attributes
  if (node.attrs.language === 'ur') {
    attrs.push('lang="ur"');
  }
  
  // Handle table-specific attributes
  if (node.type === 'tableCell' && node.attrs.colspan) {
    attrs.push(`colspan="${node.attrs.colspan}"`);
  }
  
  if (node.type === 'tableCell' && node.attrs.rowspan) {
    attrs.push(`rowspan="${node.attrs.rowspan}"`);
  }
  
  // Handle list-specific attributes
  if (node.type === 'list' && node.attrs.listType === 'ordered' && node.attrs.start) {
    attrs.push(`start="${node.attrs.start}"`);
  }
  
  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

/**
 * Format citation based on style
 */
function formatCitation(authors: string[], title: string, year: number, style: string): string {
  switch (style) {
    case 'apa':
      return `${authors.join(', ')} (${year}). ${title}.`;
    
    case 'mla':
      return `${authors.join(', ')}. "${title}." ${year}.`;
    
    case 'chicago':
      return `${authors.join(', ')}. ${title}. ${year}.`;
    
    case 'harvard':
      return `${authors.join(', ')} ${year}, ${title}.`;
    
    case 'ieee':
      return `${authors.join(', ')}, "${title}," ${year}.`;
    
    default:
      return `${authors.join(', ')} (${year}). ${title}.`;
  }
}

/**
 * Convert HTML to document node
 */
export function htmlToDocument(html: string): DocumentNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const content: DocumentNode[] = [];
  
  // Process all top-level elements
  Array.from(doc.body.children).forEach(element => {
    const node = elementToNode(element);
    if (node) {
      content.push(node);
    }
  });
  
  return {
    type: 'doc',
    content: content.length > 0 ? content : [createEmptyParagraph()]
  };
}

/**
 * Convert HTML element to document node
 */
function elementToNode(element: Element): DocumentNode | null {
  const tagName = element.tagName.toLowerCase();
  
  switch (tagName) {
    case 'p':
      return paragraphFromElement(element);
    
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return headingFromElement(element);
    
    case 'table':
      return tableFromElement(element);
    
    case 'ul':
    case 'ol':
      return listFromElement(element);
    
    case 'blockquote':
      return blockquoteFromElement(element);
    
    case 'pre':
      return codeBlockFromElement(element);
    
    case 'img':
      return imageFromElement(element);
    
    case 'hr':
      return { type: 'horizontalRule' };
    
    case 'br':
      return { type: 'hardBreak' };
    
    default:
      // Try to parse as paragraph
      return paragraphFromElement(element);
  }
}

/**
 * Convert paragraph element to document node
 */
function paragraphFromElement(element: Element): DocumentNode {
  const content = parseInlineContent(element);
  const attrs: Record<string, any> = {};
  
  // Extract attributes
  if (element.getAttribute('dir')) {
    attrs.dir = element.getAttribute('dir');
  }
  
  if (element.style.textAlign) {
    attrs.align = element.style.textAlign;
  }
  
  return {
    type: 'paragraph',
    content,
    attrs
  };
}

/**
 * Convert heading element to document node
 */
function headingFromElement(element: Element): DocumentNode {
  const level = parseInt(element.tagName.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6;
  const content = parseInlineContent(element);
  const attrs: Record<string, any> = { level };
  
  // Extract attributes
  if (element.getAttribute('dir')) {
    attrs.dir = element.getAttribute('dir');
  }
  
  if (element.style.textAlign) {
    attrs.align = element.style.textAlign;
  }
  
  return {
    type: 'heading',
    content,
    attrs
  };
}

/**
 * Parse inline content from element
 */
function parseInlineContent(element: Element): DocumentNode[] {
  const content: DocumentNode[] = [];
  
  const processNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        content.push({
          type: 'text',
          text,
          attrs: {
            direction: 'rtl',
            language: 'ur',
            script: 'arabic'
          }
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const text = el.textContent?.trim();
      if (text) {
        const marks = parseMarksFromElement(el);
        content.push({
          type: 'text',
          text,
          marks,
          attrs: {
            direction: 'rtl',
            language: 'ur',
            script: 'arabic'
          }
        });
      }
    }
  };
  
  Array.from(element.childNodes).forEach(processNode);
  
  return content;
}

/**
 * Parse marks from element
 */
function parseMarksFromElement(element: Element): Mark[] {
  const marks: Mark[] = [];
  
  // Check for common formatting
  if (element.tagName === 'strong' || element.tagName === 'b') {
    marks.push({ type: 'bold' });
  }
  
  if (element.tagName === 'em' || element.tagName === 'i') {
    marks.push({ type: 'italic' });
  }
  
  if (element.tagName === 'u') {
    marks.push({ type: 'underline' });
  }
  
  if (element.tagName === 's') {
    marks.push({ type: 'strike' });
  }
  
  if (element.tagName === 'code') {
    marks.push({ type: 'code' });
  }
  
  if (element.tagName === 'a') {
    const href = element.getAttribute('href');
    if (href) {
      marks.push({ type: 'link', attrs: { href } });
    }
  }
  
  if (element.tagName === 'mark') {
    const color = element.style.backgroundColor || 'yellow';
    marks.push({ type: 'highlight', attrs: { color } });
  }
  
  if (element.tagName === 'sub') {
    marks.push({ type: 'subscript' });
  }
  
  if (element.tagName === 'sup') {
    marks.push({ type: 'superscript' });
  }
  
  // Check for inline styles
  if (element.style.fontSize) {
    const size = parseInt(element.style.fontSize);
    if (!isNaN(size)) {
      marks.push({ type: 'fontSize', attrs: { size } });
    }
  }
  
  if (element.style.fontFamily) {
    marks.push({ type: 'fontFamily', attrs: { family: element.style.fontFamily } });
  }
  
  if (element.style.color) {
    marks.push({ type: 'color', attrs: { color: element.style.color } });
  }
  
  if (element.style.backgroundColor) {
    marks.push({ type: 'backgroundColor', attrs: { color: element.style.backgroundColor } });
  }
  
  return marks;
}

/**
 * Convert table element to document node
 */
function tableFromElement(element: Element): DocumentNode {
  const rows = Array.from(element.querySelectorAll('tr')).map(row => tableRowFromElement(row));
  
  return {
    type: 'table',
    content: rows,
    attrs: {
      rows: rows.length,
      cols: rows[0]?.content?.length || 0,
      border: true
    }
  };
}

/**
 * Convert table row element to document node
 */
function tableRowFromElement(element: Element): DocumentNode {
  const cells = Array.from(element.querySelectorAll('td, th')).map(cell => tableCellFromElement(cell));
  
  return {
    type: 'tableRow',
    content: cells,
    attrs: {
      rowIndex: 0 // This would need to be calculated properly
    }
  };
}

/**
 * Convert table cell element to document node
 */
function tableCellFromElement(element: Element): DocumentNode {
  const content = parseInlineContent(element);
  
  return {
    type: 'tableCell',
    content,
    attrs: {
      rowIndex: 0, // This would need to be calculated properly
      colIndex: 0, // This would need to be calculated properly
      align: 'right'
    }
  };
}

/**
 * Convert list element to document node
 */
function listFromElement(element: Element): DocumentNode {
  const items = Array.from(element.querySelectorAll('li')).map(item => listItemFromElement(item));
  const listType = element.tagName === 'ol' ? 'ordered' : 'bullet';
  
  return {
    type: 'list',
    content: items,
    attrs: {
      listType
    }
  };
}

/**
 * Convert list item element to document node
 */
function listItemFromElement(element: Element): DocumentNode {
  const content = parseInlineContent(element);
  
  return {
    type: 'listItem',
    content,
    attrs: {
      level: 0
    }
  };
}

/**
 * Convert blockquote element to document node
 */
function blockquoteFromElement(element: Element): DocumentNode {
  const content = parseInlineContent(element);
  
  return {
    type: 'blockquote',
    content,
    attrs: {
      dir: 'rtl'
    }
  };
}

/**
 * Convert code block element to document node
 */
function codeBlockFromElement(element: Element): DocumentNode {
  const codeElement = element.querySelector('code');
  const text = codeElement?.textContent || element.textContent || '';
  const language = codeElement?.className.match(/language-(\w+)/)?.[1] || '';
  
  return {
    type: 'codeBlock',
    content: [{
      type: 'text',
      text,
      attrs: {
        direction: 'ltr', // Code is usually LTR
        language: 'en'
      }
    }],
    attrs: {
      language
    }
  };
}

/**
 * Convert image element to document node
 */
function imageFromElement(element: Element): DocumentNode {
  const src = element.getAttribute('src') || '';
  const alt = element.getAttribute('alt') || '';
  const title = element.getAttribute('title') || '';
  const width = element.getAttribute('width');
  const height = element.getAttribute('height');
  
  const attrs: Record<string, any> = {
    src,
    alt,
    title
  };
  
  if (width) attrs.width = parseInt(width);
  if (height) attrs.height = parseInt(height);
  
  return {
    type: 'image',
    attrs
  };
}

/**
 * Create empty paragraph
 */
function createEmptyParagraph(): DocumentNode {
  return {
    type: 'paragraph',
    content: [],
    attrs: {
      dir: 'rtl',
      align: 'right'
    }
  };
}

/**
 * Export functions
 */
export * from './html';
