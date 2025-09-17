/**
 * Test file for JSON Document Model implementation
 */

import { 
  createEmptyDocument,
  serializeDocument,
  deserializeDocument,
  documentToHtml,
  htmlToDocument,
  getDocumentStats,
  findAndReplaceInDocument
} from '../services/documentSerializer';
import { 
  createParagraphNode,
  createTextNode,
  createHeadingNode,
  createPageBreakNode,
  createDocumentNode,
  isPageBreakNode,
  getPageBreakPositions,
  insertPageBreak,
  removePageBreak,
  splitDocumentIntoPages
} from '../services/documentSchema';

describe('JSON Document Model', () => {
  test('should create an empty document', () => {
    const doc = createEmptyDocument();
    expect(doc.type).toBe('doc');
    expect(doc.content).toBeDefined();
    expect(doc.content?.length).toBeGreaterThan(0);
  });

  test('should create paragraph nodes', () => {
    const paragraph = createParagraphNode([
      createTextNode('Hello World')
    ]);
    
    expect(paragraph.type).toBe('paragraph');
    expect(paragraph.content).toBeDefined();
    expect(paragraph.content?.[0].text).toBe('Hello World');
    expect(paragraph.attrs?.dir).toBe('rtl');
    expect(paragraph.attrs?.align).toBe('right');
  });

  test('should create heading nodes', () => {
    const heading = createHeadingNode(1, [
      createTextNode('Main Title')
    ]);
    
    expect(heading.type).toBe('heading');
    expect(heading.attrs?.level).toBe(1);
    expect(heading.content?.[0].text).toBe('Main Title');
  });

  test('should create page break nodes', () => {
    const pageBreak = createPageBreakNode(2, true);
    
    expect(pageBreak.type).toBe('pageBreak');
    expect(pageBreak.attrs?.pageNumber).toBe(2);
    expect(pageBreak.attrs?.isManual).toBe(true);
    expect(isPageBreakNode(pageBreak)).toBe(true);
  });

  test('should serialize and deserialize documents', () => {
    const originalDoc = createEmptyDocument();
    const serialized = serializeDocument(originalDoc);
    const deserialized = deserializeDocument(serialized);
    
    expect(deserialized.type).toBe(originalDoc.type);
    expect(deserialized.content).toHaveLength(originalDoc.content?.length || 0);
    // Check that the first paragraph has the expected text
    expect(deserialized.content?.[0]?.content?.[0]?.text).toBe('اردو میں خوش آمدید');
  });

  test('should convert document to HTML', () => {
    const doc = createDocumentNode([
      createParagraphNode([
        createTextNode('اردو میں خوش آمدید')
      ])
    ]);
    
    const html = documentToHtml(doc);
    expect(html).toContain('<p');
    expect(html).toContain('اردو میں خوش آمدید');
    expect(html).toContain('text-align: right');
    expect(html).toContain('direction: rtl');
  });

  test('should convert HTML to document', () => {
    const html = '<p style="text-align: right; direction: rtl;">اردو میں خوش آمدید</p>';
    const doc = htmlToDocument(html);
    
    expect(doc.type).toBe('doc');
    expect(doc.content).toBeDefined();
    expect(doc.content?.[0].type).toBe('paragraph');
  });

  test('should split document into pages', () => {
    const doc = createDocumentNode([
      createParagraphNode([createTextNode('Page 1 content')]),
      createPageBreakNode(2, false),
      createParagraphNode([createTextNode('Page 2 content')])
    ]);
    
    const pages = splitDocumentIntoPages(doc);
    expect(pages).toHaveLength(2);
    expect(pages[0].content?.[0].content?.[0].text).toBe('Page 1 content');
    expect(pages[1].content?.[0].content?.[0].text).toBe('Page 2 content');
  });

  test('should get page break positions', () => {
    const doc = createDocumentNode([
      createParagraphNode([createTextNode('Content 1')]),
      createPageBreakNode(2, false),
      createParagraphNode([createTextNode('Content 2')]),
      createPageBreakNode(3, false),
      createParagraphNode([createTextNode('Content 3')])
    ]);
    
    const positions = getPageBreakPositions(doc);
    expect(positions).toHaveLength(2);
  });

  test('should insert page breaks', () => {
    const doc = createDocumentNode([
      createParagraphNode([createTextNode('Content 1')]),
      createParagraphNode([createTextNode('Content 2')])
    ]);
    
    const newDoc = insertPageBreak(doc, 1, 2);
    expect(newDoc.content).toHaveLength(3);
    expect(isPageBreakNode(newDoc.content?.[1]!)).toBe(true);
  });

  test('should remove page breaks', () => {
    const pageBreak = createPageBreakNode(2, false);
    const doc = createDocumentNode([
      createParagraphNode([createTextNode('Content 1')]),
      pageBreak,
      createParagraphNode([createTextNode('Content 2')])
    ]);
    
    const newDoc = removePageBreak(doc, pageBreak.attrs?.id!);
    expect(newDoc.content).toHaveLength(2);
    expect(newDoc.content?.every(node => !isPageBreakNode(node))).toBe(true);
  });

  test('should get document statistics', () => {
    const doc = createDocumentNode([
      createHeadingNode(1, [createTextNode('Title')]),
      createParagraphNode([createTextNode('Paragraph 1')]),
      createParagraphNode([createTextNode('Paragraph 2')]),
      createPageBreakNode(2, false)
    ]);
    
    const stats = getDocumentStats(doc);
    expect(stats.totalNodes).toBeGreaterThan(0);
    expect(stats.totalText).toBeGreaterThan(0);
    expect(stats.headings).toBe(1);
    expect(stats.paragraphs).toBe(2);
    expect(stats.pageBreaks).toBe(1);
  });

  test('should find and replace text', () => {
    const doc = createDocumentNode([
      createParagraphNode([createTextNode('Hello World')]),
      createParagraphNode([createTextNode('Hello Universe')])
    ]);
    
    const newDoc = findAndReplaceInDocument(doc, 'Hello', 'Hi', false);
    const html = documentToHtml(newDoc);
    expect(html).toContain('Hi World');
    expect(html).toContain('Hi Universe');
  });
});
