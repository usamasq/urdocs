/**
 * ProseMirror Document Schema Service
 * Defines the document structure with page break support for the Urdu editor
 */

import { Schema } from '@tiptap/pm/model';
import { type DocumentNode, type Mark } from '../document/schema/types';
import { type DocumentSchema } from '../types';

// Custom page break node
const pageBreakNode = {
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,
  attrs: {
    id: { default: null },
    pageNumber: { default: 1 },
    isManual: { default: false }
  },
  parseDOM: [
    {
      tag: 'div[data-page-break]',
      getAttrs: (dom: Element) => ({
        id: dom.getAttribute('data-page-break-id'),
        pageNumber: parseInt(dom.getAttribute('data-page-number') || '1'),
        isManual: dom.getAttribute('data-manual') === 'true'
      })
    }
  ],
  toDOM: (node: any) => [
    'div',
    {
      'data-page-break': 'true',
      'data-page-break-id': node.attrs.id,
      'data-page-number': node.attrs.pageNumber,
      'data-manual': node.attrs.isManual,
      class: 'page-break-node',
      style: 'page-break-after: always; break-after: page; margin: 0; padding: 0; height: 0; border: none;'
    }
  ]
};

// Enhanced paragraph with RTL support
const paragraphNode = {
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  attrs: {
    dir: { default: 'rtl' },
    align: { default: 'right' }
  },
  parseDOM: [
    {
      tag: 'p',
      getAttrs: (dom: Element) => ({
        dir: dom.getAttribute('dir') || 'rtl',
        align: dom.getAttribute('align') || 'right'
      })
    }
  ],
  toDOM: (node: any) => [
    'p',
    {
      dir: node.attrs.dir,
      align: node.attrs.align,
      style: `text-align: ${node.attrs.align}; direction: ${node.attrs.dir};`
    },
    0
  ]
};

// Enhanced heading with RTL support
const headingNode = {
  name: 'heading',
  group: 'block',
  content: 'inline*',
  attrs: {
    level: { default: 1 },
    dir: { default: 'rtl' },
    align: { default: 'right' }
  },
  parseDOM: [
    { tag: 'h1', attrs: { level: 1 } },
    { tag: 'h2', attrs: { level: 2 } },
    { tag: 'h3', attrs: { level: 3 } },
    { tag: 'h4', attrs: { level: 4 } },
    { tag: 'h5', attrs: { level: 5 } },
    { tag: 'h6', attrs: { level: 6 } }
  ],
  toDOM: (node: any) => [
    `h${node.attrs.level}`,
    {
      dir: node.attrs.dir,
      align: node.attrs.align,
      style: `text-align: ${node.attrs.align}; direction: ${node.attrs.dir};`
    },
    0
  ]
};

// Text style mark for font family and size
const textStyleMark = {
  name: 'textStyle',
  attrs: {
    fontFamily: { default: null },
    fontSize: { default: null },
    color: { default: null }
  },
  parseDOM: [
    {
      style: 'font-family',
      getAttrs: (value: string) => ({ fontFamily: value })
    },
    {
      style: 'font-size',
      getAttrs: (value: string) => ({ fontSize: value })
    },
    {
      style: 'color',
      getAttrs: (value: string) => ({ color: value })
    }
  ],
  toDOM: (mark: any) => {
    const styles: string[] = [];
    if (mark.attrs.fontFamily) styles.push(`font-family: ${mark.attrs.fontFamily}`);
    if (mark.attrs.fontSize) styles.push(`font-size: ${mark.attrs.fontSize}`);
    if (mark.attrs.color) styles.push(`color: ${mark.attrs.color}`);
    
    return ['span', { style: styles.join('; ') }, 0];
  }
};

// Create the schema
export const documentSchema = new Schema({
  nodes: {
    doc: {
      content: 'block+',
      attrs: {
        dir: { default: 'rtl' }
      }
    },
    paragraph: paragraphNode,
    heading: headingNode,
    pageBreak: pageBreakNode,
    text: {
      group: 'inline'
    },
    hardBreak: {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM: () => ['br']
    }
  },
  marks: {
    textStyle: textStyleMark,
    bold: {
      parseDOM: [
        { tag: 'strong' },
        { tag: 'b', getAttrs: (node: Element) => node.style.fontWeight !== 'normal' && null },
        { style: 'font-weight', getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null }
      ],
      toDOM: () => ['strong', 0]
    },
    italic: {
      parseDOM: [
        { tag: 'i' },
        { tag: 'em' },
        { style: 'font-style=italic' }
      ],
      toDOM: () => ['em', 0]
    },
    underline: {
      parseDOM: [
        { tag: 'u' },
        { style: 'text-decoration=underline' }
      ],
      toDOM: () => ['u', 0]
    },
    strike: {
      parseDOM: [
        { tag: 's' },
        { tag: 'strike' },
        { style: 'text-decoration=line-through' }
      ],
      toDOM: () => ['s', 0]
    }
  }
});

/**
 * Create a page break node
 */
export const createPageBreakNode = (pageNumber: number, isManual: boolean = false): DocumentNode => ({
  type: 'pageBreak',
  attrs: {
    id: `page-break-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    pageNumber,
    isManual
  }
});

/**
 * Create a paragraph node with RTL support
 */
export const createParagraphNode = (content: DocumentNode[] = [], attrs: Record<string, any> = {}): DocumentNode => ({
  type: 'paragraph',
  content,
  attrs: {
    dir: 'rtl',
    align: 'right',
    ...attrs
  }
});

/**
 * Create a text node with optional marks
 */
export const createTextNode = (text: string, marks: Mark[] = []): DocumentNode => ({
  type: 'text',
  text,
  marks
});

/**
 * Create a heading node
 */
export const createHeadingNode = (level: number, content: DocumentNode[] = [], attrs: Record<string, any> = {}): DocumentNode => ({
  type: 'heading',
  content,
  attrs: {
    level,
    dir: 'rtl',
    align: 'right',
    ...attrs
  }
});

/**
 * Create a document node
 */
export const createDocumentNode = (content: DocumentNode[] = []): DocumentNode => ({
  type: 'doc',
  content,
  attrs: {
    dir: 'rtl'
  }
});

/**
 * Check if a node is a page break
 */
export const isPageBreakNode = (node: DocumentNode): boolean => {
  return node.type === 'pageBreak';
};

/**
 * Get all page break positions in a document
 */
export const getPageBreakPositions = (document: DocumentNode): number[] => {
  const positions: number[] = [];
  
  const traverse = (nodes: DocumentNode[], currentPos: number = 0): number => {
    for (const node of nodes) {
      if (isPageBreakNode(node)) {
        positions.push(currentPos);
      }
      
      if (node.content) {
        currentPos = traverse(node.content, currentPos);
      } else if (node.text) {
        currentPos += node.text.length;
      }
    }
    
    return currentPos;
  };
  
  if (document.content) {
    traverse(document.content);
  }
  
  return positions;
};

/**
 * Split document at page break positions
 */
export const splitDocumentIntoPages = (document: DocumentNode): DocumentNode[] => {
  if (!document.content) {
    return [document];
  }
  
  const pages: DocumentNode[] = [];
  let currentPageContent: DocumentNode[] = [];
  
  for (const node of document.content) {
    if (isPageBreakNode(node)) {
      // End current page and start new one
      if (currentPageContent.length > 0) {
        pages.push(createDocumentNode(currentPageContent));
        currentPageContent = [];
      }
    } else {
      currentPageContent.push(node);
    }
  }
  
  // Add remaining content as last page
  if (currentPageContent.length > 0) {
    pages.push(createDocumentNode(currentPageContent));
  }
  
  // If no page breaks found, return the entire document as one page
  if (pages.length === 0) {
    pages.push(document);
  }
  
  return pages;
};

/**
 * Insert page break at specific position
 */
export const insertPageBreak = (document: DocumentNode, position: number, pageNumber: number): DocumentNode => {
  if (!document.content) {
    return document;
  }
  
  const pageBreak = createPageBreakNode(pageNumber, true);
  const newContent = [...document.content];
  
  // Insert page break at the specified position
  newContent.splice(position, 0, pageBreak);
  
  return {
    ...document,
    content: newContent
  };
};

/**
 * Remove page break by ID
 */
export const removePageBreak = (document: DocumentNode, pageBreakId: string): DocumentNode => {
  if (!document.content) {
    return document;
  }
  
  const newContent = document.content.filter(node => 
    !(isPageBreakNode(node) && node.attrs?.id === pageBreakId)
  );
  
  return {
    ...document,
    content: newContent
  };
};

/**
 * Convert HTML string to document node structure
 */
export const htmlToDocumentNode = (html: string): DocumentNode => {
  // This is a simplified conversion - in a real implementation,
  // you'd use ProseMirror's HTML parser
  const tempDiv = window.document.createElement('div');
  tempDiv.innerHTML = html;
  
  const content: DocumentNode[] = [];
  
  // Convert paragraphs
  const paragraphs = tempDiv.querySelectorAll('p');
  paragraphs.forEach(p => {
    const textContent = p.textContent || '';
    const marks: Mark[] = [];
    
    // Extract formatting from HTML
    if (p.querySelector('strong, b')) marks.push({ type: 'bold' });
    if (p.querySelector('em, i')) marks.push({ type: 'italic' });
    if (p.querySelector('u')) marks.push({ type: 'underline' });
    if (p.querySelector('s, strike')) marks.push({ type: 'strike' });
    
    // Extract font styles
    const style = p.getAttribute('style') || '';
    if (style.includes('font-family')) {
      const fontMatch = style.match(/font-family:\s*([^;]+)/);
      if (fontMatch) marks.push({ type: 'textStyle', attrs: { fontFamily: fontMatch[1].trim() } });
    }
    if (style.includes('font-size')) {
      const sizeMatch = style.match(/font-size:\s*([^;]+)/);
      if (sizeMatch) marks.push({ type: 'textStyle', attrs: { fontSize: sizeMatch[1].trim() } });
    }
    
    if (textContent.trim()) {
      content.push(createParagraphNode([createTextNode(textContent, marks)]));
    }
  });
  
  return createDocumentNode(content);
};

/**
 * Convert document node structure to HTML string
 */
export const documentNodeToHtml = (document: DocumentNode): string => {
  if (!document.content) {
    return '';
  }
  
  const htmlParts: string[] = [];
  
  const processNode = (node: DocumentNode): string => {
    switch (node.type) {
      case 'doc':
        return node.content?.map(processNode).join('') || '';
        
      case 'paragraph':
        const pContent = node.content?.map(processNode).join('') || '';
        const pAttrs = node.attrs || {};
        const pStyle = `text-align: ${pAttrs.align || 'right'}; direction: ${pAttrs.dir || 'rtl'};`;
        return `<p style="${pStyle}">${pContent}</p>`;
        
      case 'heading':
        const hContent = node.content?.map(processNode).join('') || '';
        const hLevel = node.attrs?.level || 1;
        const hAttrs = node.attrs || {};
        const hStyle = `text-align: ${hAttrs.align || 'right'}; direction: ${hAttrs.dir || 'rtl'};`;
        return `<h${hLevel} style="${hStyle}">${hContent}</h${hLevel}>`;
        
      case 'text':
        let textContent = node.text || '';
        
        // Apply marks
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                textContent = `<strong>${textContent}</strong>`;
                break;
              case 'italic':
                textContent = `<em>${textContent}</em>`;
                break;
              case 'underline':
                textContent = `<u>${textContent}</u>`;
                break;
              case 'strike':
                textContent = `<s>${textContent}</s>`;
                break;
              case 'textStyle':
                const attrs = mark.attrs || {};
                const styles: string[] = [];
                if (attrs.fontFamily) styles.push(`font-family: ${attrs.fontFamily}`);
                if (attrs.fontSize) styles.push(`font-size: ${attrs.fontSize}`);
                if (attrs.color) styles.push(`color: ${attrs.color}`);
                if (styles.length > 0) {
                  textContent = `<span style="${styles.join('; ')}">${textContent}</span>`;
                }
                break;
            }
          }
        }
        
        return textContent;
        
      case 'pageBreak':
        return `<div data-page-break="true" data-page-break-id="${node.attrs?.id}" data-page-number="${node.attrs?.pageNumber}" data-manual="${node.attrs?.isManual}" class="page-break-node" style="page-break-after: always; break-after: page; margin: 0; padding: 0; height: 0; border: none;"></div>`;
        
      default:
        return '';
    }
  };
  
  return document.content.map(processNode).join('');
};
