/**
 * Document Schema Validation System
 * Ensures document integrity and RTL compliance
 */

import { 
  DocumentNode, 
  NodeType, 
  MarkType, 
  DocumentSchema, 
  Mark,
  RTLSupport,
  UrduTextNode,
  PageBreakNode,
  TableNode,
  ImageNode
} from './types';

// Validation error types
export interface ValidationError {
  type: 'error' | 'warning' | 'info';
  message: string;
  node?: DocumentNode;
  path?: number[];
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
}

// Document schema validator
export class DocumentValidator {
  private schema: DocumentSchema;
  private rtlRequired: boolean;

  constructor(schema: DocumentSchema, rtlRequired: boolean = true) {
    this.schema = schema;
    this.rtlRequired = rtlRequired;
  }

  /**
   * Validate a complete document
   */
  validateDocument(document: DocumentNode): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Validate document structure
    this.validateNode(document, [], errors, warnings, info);

    // Validate RTL compliance
    if (this.rtlRequired) {
      this.validateRTLCompliance(document, errors, warnings);
    }

    // Validate document integrity
    this.validateDocumentIntegrity(document, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  /**
   * Validate a single node
   */
  private validateNode(
    node: DocumentNode, 
    path: number[], 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ): void {
    // Validate node type
    if (!this.isValidNodeType(node.type)) {
      errors.push({
        type: 'error',
        message: `Invalid node type: ${node.type}`,
        node,
        path,
        code: 'INVALID_NODE_TYPE'
      });
      return;
    }

    // Validate node structure
    this.validateNodeStructure(node, path, errors, warnings, info);

    // Validate node attributes
    this.validateNodeAttributes(node, path, errors, warnings, info);

    // Validate marks
    if (node.marks) {
      this.validateMarks(node.marks, path, errors, warnings, info);
    }

    // Validate content
    if (node.content) {
      node.content.forEach((child, index) => {
        this.validateNode(child, [...path, index], errors, warnings, info);
      });
    }
  }

  /**
   * Validate node structure
   */
  private validateNodeStructure(
    node: DocumentNode, 
    path: number[], 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ): void {
    const nodeSpec = this.schema.nodes[node.type];
    if (!nodeSpec) {
      errors.push({
        type: 'error',
        message: `Unknown node type: ${node.type}`,
        node,
        path,
        code: 'UNKNOWN_NODE_TYPE'
      });
      return;
    }

    // Validate content structure
    if (nodeSpec.content && node.content) {
      const contentValid = this.validateContentStructure(node.content, nodeSpec.content);
      if (!contentValid) {
        errors.push({
          type: 'error',
          message: `Invalid content structure for ${node.type}`,
          node,
          path,
          code: 'INVALID_CONTENT_STRUCTURE'
        });
      }
    }

    // Validate inline vs block
    if (nodeSpec.inline && node.content && node.content.length > 0) {
      const hasBlockContent = node.content.some(child => !this.schema.nodes[child.type]?.inline);
      if (hasBlockContent) {
        errors.push({
          type: 'error',
          message: `Inline node ${node.type} contains block content`,
          node,
          path,
          code: 'INLINE_CONTAINS_BLOCK'
        });
      }
    }
  }

  /**
   * Validate node attributes
   */
  private validateNodeAttributes(
    node: DocumentNode, 
    path: number[], 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ): void {
    const nodeSpec = this.schema.nodes[node.type];
    if (!nodeSpec || !nodeSpec.attrs) return;

    // Check required attributes
    Object.entries(nodeSpec.attrs).forEach(([attrName, attrSpec]) => {
      if (attrSpec.default === undefined && !(node.attrs && attrName in node.attrs)) {
        errors.push({
          type: 'error',
          message: `Missing required attribute: ${attrName}`,
          node,
          path,
          code: 'MISSING_REQUIRED_ATTR'
        });
      }
    });

    // Validate attribute values
    if (node.attrs) {
      Object.entries(node.attrs).forEach(([attrName, attrValue]) => {
        if (!(attrName in nodeSpec.attrs)) {
          warnings.push({
            type: 'warning',
            message: `Unknown attribute: ${attrName}`,
            node,
            path,
            code: 'UNKNOWN_ATTR'
          });
        }
      });
    }
  }

  /**
   * Validate marks
   */
  private validateMarks(
    marks: Mark[], 
    path: number[], 
    errors: ValidationError[], 
    warnings: ValidationError[], 
    info: ValidationError[]
  ): void {
    marks.forEach((mark, index) => {
      if (!this.isValidMarkType(mark.type)) {
        errors.push({
          type: 'error',
          message: `Invalid mark type: ${mark.type}`,
          node: { type: 'text', text: '', marks: [mark] },
          path: [...path, index],
          code: 'INVALID_MARK_TYPE'
        });
      }

      // Validate mark attributes
      const markSpec = this.schema.marks[mark.type];
      if (markSpec && markSpec.attrs && mark.attrs) {
        Object.entries(mark.attrs).forEach(([attrName, attrValue]) => {
          if (!(attrName in markSpec.attrs)) {
            warnings.push({
              type: 'warning',
              message: `Unknown mark attribute: ${attrName}`,
              node: { type: 'text', text: '', marks: [mark] },
              path: [...path, index],
              code: 'UNKNOWN_MARK_ATTR'
            });
          }
        });
      }
    });
  }

  /**
   * Validate RTL compliance
   */
  private validateRTLCompliance(
    document: DocumentNode, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    this.traverseDocument(document, (node, path) => {
      // Check text nodes for RTL compliance
      if (node.type === 'text' && node.text) {
        const urduTextNode = node as UrduTextNode;
        
        // Ensure RTL direction for Urdu text
        if (this.containsUrduText(node.text) && urduTextNode.attrs?.direction !== 'rtl') {
          warnings.push({
            type: 'warning',
            message: 'Urdu text should have RTL direction',
            node,
            path,
            code: 'URDU_TEXT_RTL_DIRECTION'
          });
        }
      }

      // Check paragraph alignment for RTL
      if (node.type === 'paragraph' && node.attrs) {
        const align = node.attrs.align;
        if (align && align !== 'right' && this.containsUrduText(this.getNodeText(node))) {
          warnings.push({
            type: 'warning',
            message: 'Urdu paragraphs should be right-aligned',
            node,
            path,
            code: 'URDU_PARAGRAPH_ALIGNMENT'
          });
        }
      }
    });
  }

  /**
   * Validate document integrity
   */
  private validateDocumentIntegrity(
    document: DocumentNode, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    // Check for orphaned nodes
    this.checkOrphanedNodes(document, errors);

    // Check for circular references
    this.checkCircularReferences(document, errors);

    // Check for empty containers
    this.checkEmptyContainers(document, warnings);

    // Validate page breaks
    this.validatePageBreaks(document, errors, warnings);
  }

  /**
   * Check for orphaned nodes
   */
  private checkOrphanedNodes(document: DocumentNode, errors: ValidationError[]): void {
    const nodeIds = new Set<string>();
    
    this.traverseDocument(document, (node) => {
      if (node.attrs?.id) {
        if (nodeIds.has(node.attrs.id)) {
          errors.push({
            type: 'error',
            message: `Duplicate node ID: ${node.attrs.id}`,
            node,
            code: 'DUPLICATE_NODE_ID'
          });
        }
        nodeIds.add(node.attrs.id);
      }
    });
  }

  /**
   * Check for circular references
   */
  private checkCircularReferences(document: DocumentNode, errors: ValidationError[]): void {
    const visited = new Set<DocumentNode>();
    
    const checkNode = (node: DocumentNode, path: number[]): void => {
      if (visited.has(node)) {
        errors.push({
          type: 'error',
          message: 'Circular reference detected',
          node,
          path,
          code: 'CIRCULAR_REFERENCE'
        });
        return;
      }
      
      visited.add(node);
      
      if (node.content) {
        node.content.forEach((child, index) => {
          checkNode(child, [...path, index]);
        });
      }
      
      visited.delete(node);
    };
    
    checkNode(document, []);
  }

  /**
   * Check for empty containers
   */
  private checkEmptyContainers(document: DocumentNode, warnings: ValidationError[]): void {
    this.traverseDocument(document, (node, path) => {
      if (node.type === 'paragraph' && (!node.content || node.content.length === 0)) {
        warnings.push({
          type: 'warning',
          message: 'Empty paragraph detected',
          node,
          path,
          code: 'EMPTY_PARAGRAPH'
        });
      }
      
      if (node.type === 'table' && (!node.content || node.content.length === 0)) {
        warnings.push({
          type: 'warning',
          message: 'Empty table detected',
          node,
          path,
          code: 'EMPTY_TABLE'
        });
      }
    });
  }

  /**
   * Validate page breaks
   */
  private validatePageBreaks(
    document: DocumentNode, 
    errors: ValidationError[], 
    warnings: ValidationError[]
  ): void {
    let pageBreakCount = 0;
    
    this.traverseDocument(document, (node, path) => {
      if (node.type === 'pageBreak') {
        pageBreakCount++;
        const pageBreakNode = node as PageBreakNode;
        
        // Validate page break attributes
        if (!pageBreakNode.attrs?.pageNumber || pageBreakNode.attrs.pageNumber < 1) {
          errors.push({
            type: 'error',
            message: 'Page break must have valid page number',
            node,
            path,
            code: 'INVALID_PAGE_BREAK_NUMBER'
          });
        }
        
        if (pageBreakNode.attrs?.isManual === undefined) {
          warnings.push({
            type: 'warning',
            message: 'Page break should specify if it is manual or automatic',
            node,
            path,
            code: 'PAGE_BREAK_MANUAL_UNDEFINED'
          });
        }
      }
    });
    
    // Check for reasonable page break count
    if (pageBreakCount > 100) {
      warnings.push({
        type: 'warning',
        message: `Document has ${pageBreakCount} page breaks, which seems excessive`,
        node: document,
        code: 'EXCESSIVE_PAGE_BREAKS'
      });
    }
  }

  /**
   * Helper methods
   */
  private isValidNodeType(type: string): type is NodeType {
    return Object.keys(this.schema.nodes).includes(type);
  }

  private isValidMarkType(type: string): type is MarkType {
    return Object.keys(this.schema.marks).includes(type);
  }

  private validateContentStructure(content: DocumentNode[], spec: string): boolean {
    // Simplified content validation - in a real implementation,
    // you'd parse the content spec and validate against it
    return true;
  }

  private containsUrduText(text: string): boolean {
    // Check if text contains Urdu/Arabic characters
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  }

  private getNodeText(node: DocumentNode): string {
    if (node.text) return node.text;
    if (node.content) {
      return node.content.map(child => this.getNodeText(child)).join('');
    }
    return '';
  }

  private traverseDocument(
    node: DocumentNode, 
    callback: (node: DocumentNode, path: number[]) => void,
    path: number[] = []
  ): void {
    callback(node, path);
    
    if (node.content) {
      node.content.forEach((child, index) => {
        this.traverseDocument(child, callback, [...path, index]);
      });
    }
  }
}

/**
 * Create a document validator with default schema
 */
export function createDocumentValidator(rtlRequired: boolean = true): DocumentValidator {
  const defaultSchema: DocumentSchema = {
    nodes: {
      doc: {
        content: 'block+'
      },
      paragraph: {
        content: 'inline*',
        attrs: {
          dir: { default: 'rtl' },
          align: { default: 'right' }
        }
      },
      heading: {
        content: 'inline*',
        attrs: {
          level: { default: 1 }
        }
      },
      text: {
        group: 'inline'
      },
      pageBreak: {
        group: 'block',
        attrs: {
          pageNumber: { default: 1 },
          isManual: { default: false },
          breakType: { default: 'page' }
        }
      },
      table: {
        content: 'tableRow+',
        attrs: {
          rows: { default: 1 },
          cols: { default: 1 }
        }
      },
      tableRow: {
        content: 'tableCell+'
      },
      tableCell: {
        content: 'block+'
      },
      image: {
        attrs: {
          src: {},
          alt: { default: '' },
          title: { default: '' }
        }
      },
      list: {
        content: 'listItem+',
        attrs: {
          listType: { default: 'bullet' }
        }
      },
      listItem: {
        content: 'block+'
      },
      blockquote: {
        content: 'block+'
      },
      codeBlock: {
        content: 'text*',
        attrs: {
          language: { default: '' }
        }
      }
    },
    marks: {
      bold: {},
      italic: {},
      underline: {},
      strike: {},
      code: {},
      link: {
        attrs: {
          href: {}
        }
      },
      highlight: {
        attrs: {
          color: { default: 'yellow' }
        }
      },
      fontSize: {
        attrs: {
          size: { default: 16 }
        }
      },
      fontFamily: {
        attrs: {
          family: { default: 'Noto Nastaliq Urdu' }
        }
      },
      color: {
        attrs: {
          color: { default: '#000000' }
        }
      }
    }
  };

  return new DocumentValidator(defaultSchema, rtlRequired);
}

/**
 * Quick validation function
 */
export function validateDocument(document: DocumentNode, rtlRequired: boolean = true): ValidationResult {
  const validator = createDocumentValidator(rtlRequired);
  return validator.validateDocument(document);
}
