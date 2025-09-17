/**
 * Comprehensive Document Schema Types
 * Professional-grade structured document model for Urdu editor
 */

// Base document node interface
export interface DocumentNode {
  type: NodeType;
  content?: DocumentNode[];
  attrs?: Record<string, any>;
  marks?: Mark[];
  text?: string;
}

// All supported node types
export type NodeType = 
  | 'doc'           // Document root
  | 'paragraph'     // Text paragraph
  | 'heading'       // Heading (h1-h6)
  | 'text'          // Text content
  | 'pageBreak'     // Page break
  | 'table'         // Table
  | 'tableRow'      // Table row
  | 'tableCell'     // Table cell
  | 'image'         // Image
  | 'list'          // List container
  | 'listItem'      // List item
  | 'blockquote'    // Blockquote
  | 'codeBlock'     // Code block
  | 'horizontalRule' // Horizontal rule
  | 'hardBreak'     // Line break
  | 'mention'       // User mention
  | 'link'          // Link
  | 'math'          // Mathematical expression
  | 'citation'      // Citation
  | 'footnote'      // Footnote
  | 'comment'       // Comment
  | 'highlight'     // Highlighted text
  | 'strike'        // Strikethrough text
  | 'subscript'     // Subscript
  | 'superscript';  // Superscript

// Mark types for inline formatting
export type MarkType = 
  | 'bold'          // Bold text
  | 'italic'        // Italic text
  | 'underline'     // Underlined text
  | 'strike'        // Strikethrough text
  | 'code'          // Inline code
  | 'link'          // Link
  | 'highlight'     // Highlighted text
  | 'fontSize'      // Font size
  | 'fontFamily'    // Font family
  | 'color'         // Text color
  | 'backgroundColor' // Background color
  | 'subscript'     // Subscript
  | 'superscript'   // Superscript
  | 'textDirection' // Text direction (LTR/RTL)
  | 'textAlign'     // Text alignment
  | 'lineHeight'    // Line height
  | 'letterSpacing' // Letter spacing
  | 'wordSpacing';  // Word spacing

// Mark interface for inline formatting
export interface Mark {
  type: MarkType;
  attrs?: Record<string, any>;
}

// Document schema definition
export interface DocumentSchema {
  nodes: Record<string, NodeSpec>;
  marks: Record<string, MarkSpec>;
}

// Node specification
export interface NodeSpec {
  content?: string;
  group?: string;
  inline?: boolean;
  atom?: boolean;
  attrs?: Record<string, AttrSpec>;
  parseDOM?: ParseRule[];
  toDOM?: (node: DocumentNode) => DOMOutputSpec;
}

// Mark specification
export interface MarkSpec {
  attrs?: Record<string, AttrSpec>;
  parseDOM?: ParseRule[];
  toDOM?: (mark: Mark) => DOMOutputSpec;
  excludes?: string;
}

// Attribute specification
export interface AttrSpec {
  default?: any;
  computed?: boolean;
}

// Parse rule for DOM parsing
export interface ParseRule {
  tag?: string;
  style?: string;
  getAttrs?: (node: Element | string) => any;
  priority?: number;
}

// DOM output specification
export type DOMOutputSpec = 
  | string 
  | [string, ...any] 
  | { dom: Element; contentDOM?: Element };

// Document statistics
export interface DocumentStats {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  paragraphCount: number;
  headingCount: number;
  pageCount: number;
  readingTime: number; // in minutes
  lastModified: Date;
  created: Date;
  version: string;
}

// Search result
export interface SearchResult {
  from: number;
  to: number;
  text: string;
  node: DocumentNode;
  path: number[];
}

// Replace options
export interface ReplaceOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  preserveCase?: boolean;
}

// Document operation
export interface DocumentOperation {
  type: 'insert' | 'delete' | 'replace' | 'move' | 'format';
  from: number;
  to?: number;
  content?: DocumentNode[];
  attrs?: Record<string, any>;
  marks?: Mark[];
  timestamp: Date;
  userId?: string;
}

// Document history entry
export interface HistoryEntry {
  document: DocumentNode;
  operation: DocumentOperation;
  timestamp: Date;
  userId?: string;
}

// Document template
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: DocumentNode;
  variables: TemplateVariable[];
  preview?: string;
  tags: string[];
  created: Date;
  modified: Date;
}

// Template variable
export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  label: string;
  description?: string;
  defaultValue?: any;
  options?: { value: any; label: string }[];
  required: boolean;
}

// Export format
export type ExportFormat = 
  | 'html' 
  | 'pdf' 
  | 'docx' 
  | 'markdown' 
  | 'plaintext' 
  | 'json' 
  | 'xml';

// Import format
export type ImportFormat = 
  | 'html' 
  | 'markdown' 
  | 'docx' 
  | 'plaintext' 
  | 'json' 
  | 'xml';

// Document metadata
export interface DocumentMetadata {
  title: string;
  author: string;
  description?: string;
  keywords?: string[];
  language: string;
  created: Date;
  modified: Date;
  version: string;
  tags: string[];
  collaborators?: string[];
  permissions?: DocumentPermissions;
}

// Document permissions
export interface DocumentPermissions {
  read: string[];
  write: string[];
  admin: string[];
  public: boolean;
}

// Collaborative operation
export interface CollaborativeOperation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  length: number;
  content?: DocumentNode[];
  attributes?: Record<string, any>;
  timestamp: Date;
  userId: string;
  version: number;
}

// Conflict resolution
export interface Conflict {
  id: string;
  operations: CollaborativeOperation[];
  resolved: boolean;
  resolution?: CollaborativeOperation;
  timestamp: Date;
}

// Document plugin interface
export interface DocumentPlugin {
  name: string;
  version: string;
  description: string;
  dependencies?: string[];
  install(editor: DocumentEditor): void;
  uninstall(): void;
  commands?: Record<string, (editor: DocumentEditor, ...args: any[]) => void>;
  keymaps?: Record<string, string>;
}

// Document editor interface
export interface DocumentEditor {
  document: DocumentNode;
  schema: DocumentSchema;
  history: DocumentHistory;
  plugins: DocumentPlugin[];
  selection: Selection;
  commands: Record<string, (...args: any[]) => void>;
  updateDocument(document: DocumentNode): void;
  getDocument(): DocumentNode;
  executeCommand(command: string, ...args: any[]): void;
  canExecuteCommand(command: string): boolean;
}

// Document history interface
export interface DocumentHistory {
  entries: HistoryEntry[];
  currentIndex: number;
  maxSize: number;
  push(document: DocumentNode, operation: DocumentOperation): void;
  undo(): DocumentNode | null;
  redo(): DocumentNode | null;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
  getEntries(): HistoryEntry[];
}

// Selection interface
export interface Selection {
  from: number;
  to: number;
  anchor: number;
  head: number;
  empty: boolean;
  node: DocumentNode | null;
  marks: Mark[];
}

// RTL support types
export interface RTLSupport {
  direction: 'ltr' | 'rtl' | 'auto';
  textAlign: 'left' | 'right' | 'center' | 'justify';
  writingMode: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr';
}

// Urdu-specific types
export interface UrduTextNode extends DocumentNode {
  type: 'text';
  text: string;
  marks?: UrduMark[];
  attrs?: {
    direction: 'rtl';
    language: 'ur';
    script: 'arabic';
  };
}

export interface UrduMark extends Mark {
  type: MarkType;
  attrs?: {
    fontFamily?: 'Noto Nastaliq Urdu' | 'Gulzar' | 'Noto Naskh Arabic';
    fontSize?: number;
    color?: string;
    direction?: 'rtl';
  };
}

// Page break specific types
export interface PageBreakNode extends DocumentNode {
  type: 'pageBreak';
  attrs: {
    pageNumber: number;
    isManual: boolean;
    breakType: 'page' | 'column' | 'section';
    style?: 'solid' | 'dashed' | 'dotted';
  };
}

// Table specific types
export interface TableNode extends DocumentNode {
  type: 'table';
  attrs: {
    rows: number;
    cols: number;
    width?: number;
    height?: number;
    border?: boolean;
    striped?: boolean;
    hover?: boolean;
  };
}

export interface TableRowNode extends DocumentNode {
  type: 'tableRow';
  attrs: {
    rowIndex: number;
    height?: number;
    backgroundColor?: string;
  };
}

export interface TableCellNode extends DocumentNode {
  type: 'tableCell';
  attrs: {
    rowIndex: number;
    colIndex: number;
    colspan?: number;
    rowspan?: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    border?: boolean;
    align?: 'left' | 'center' | 'right' | 'justify';
  };
}

// Image specific types
export interface ImageNode extends DocumentNode {
  type: 'image';
  attrs: {
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
    caption?: string;
    float?: 'left' | 'right' | 'none';
    border?: boolean;
    shadow?: boolean;
  };
}

// List specific types
export interface ListNode extends DocumentNode {
  type: 'list';
  attrs: {
    listType: 'bullet' | 'ordered' | 'task';
    start?: number;
    tight?: boolean;
    marker?: string;
  };
}

export interface ListItemNode extends DocumentNode {
  type: 'listItem';
  attrs: {
    checked?: boolean;
    level?: number;
    marker?: string;
  };
}

// Code block specific types
export interface CodeBlockNode extends DocumentNode {
  type: 'codeBlock';
  attrs: {
    language?: string;
    theme?: 'light' | 'dark';
    lineNumbers?: boolean;
    wrap?: boolean;
    maxHeight?: number;
  };
}

// Link specific types
export interface LinkNode extends DocumentNode {
  type: 'link';
  attrs: {
    href: string;
    target?: '_blank' | '_self' | '_parent' | '_top';
    rel?: string;
    title?: string;
  };
}

// Math specific types
export interface MathNode extends DocumentNode {
  type: 'math';
  attrs: {
    formula: string;
    display?: 'inline' | 'block';
    format?: 'latex' | 'mathml' | 'asciimath';
  };
}

// Citation specific types
export interface CitationNode extends DocumentNode {
  type: 'citation';
  attrs: {
    id: string;
    style: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee';
    authors: string[];
    title: string;
    year: number;
    journal?: string;
    volume?: string;
    pages?: string;
    doi?: string;
    url?: string;
  };
}

// Footnote specific types
export interface FootnoteNode extends DocumentNode {
  type: 'footnote';
  attrs: {
    id: string;
    number: number;
    content: string;
  };
}

// Comment specific types
export interface CommentNode extends DocumentNode {
  type: 'comment';
  attrs: {
    id: string;
    author: string;
    content: string;
    timestamp: Date;
    resolved: boolean;
    replies?: CommentNode[];
  };
}

// Highlight specific types
export interface HighlightNode extends DocumentNode {
  type: 'highlight';
  attrs: {
    color: string;
    opacity?: number;
    author?: string;
    timestamp?: Date;
  };
}

// Export all types
export * from './types';
