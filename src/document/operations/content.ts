/**
 * Document Content Operations
 * Advanced content manipulation for structured document model
 */

import { 
  DocumentNode, 
  DocumentOperation, 
  SearchResult, 
  ReplaceOptions,
  NodeType,
  Mark,
  MarkType
} from '../schema/types';

/**
 * Insert content at a specific position
 */
export function insertContent(
  document: DocumentNode, 
  position: number, 
  content: DocumentNode[]
): DocumentNode {
  if (!document.content) {
    return {
      ...document,
      content: content
    };
  }

  const newContent = [...document.content];
  newContent.splice(position, 0, ...content);

  return {
    ...document,
    content: newContent
  };
}

/**
 * Remove content from a specific range
 */
export function removeContent(
  document: DocumentNode, 
  from: number, 
  to: number
): DocumentNode {
  if (!document.content) {
    return document;
  }

  const newContent = [...document.content];
  newContent.splice(from, to - from);

  return {
    ...document,
    content: newContent
  };
}

/**
 * Replace content in a specific range
 */
export function replaceContent(
  document: DocumentNode, 
  from: number, 
  to: number, 
  content: DocumentNode[]
): DocumentNode {
  if (!document.content) {
    return {
      ...document,
      content: content
    };
  }

  const newContent = [...document.content];
  newContent.splice(from, to - from, ...content);

  return {
    ...document,
    content: newContent
  };
}

/**
 * Move content from one position to another
 */
export function moveContent(
  document: DocumentNode, 
  from: number, 
  to: number, 
  target: number
): DocumentNode {
  if (!document.content) {
    return document;
  }

  const newContent = [...document.content];
  const movedContent = newContent.splice(from, to - from);
  newContent.splice(target, 0, ...movedContent);

  return {
    ...document,
    content: newContent
  };
}

/**
 * Duplicate content at a specific position
 */
export function duplicateContent(
  document: DocumentNode, 
  from: number, 
  to: number, 
  target: number
): DocumentNode {
  if (!document.content) {
    return document;
  }

  const newContent = [...document.content];
  const duplicatedContent = newContent.slice(from, to);
  newContent.splice(target, 0, ...duplicatedContent);

  return {
    ...document,
    content: newContent
  };
}

/**
 * Split content at a specific position
 */
export function splitContent(
  document: DocumentNode, 
  position: number
): DocumentNode {
  if (!document.content) {
    return document;
  }

  const newContent = [...document.content];
  const splitContent = newContent.splice(position);

  return {
    ...document,
    content: newContent
  };
}

/**
 * Merge content from multiple positions
 */
export function mergeContent(
  document: DocumentNode, 
  positions: number[]
): DocumentNode {
  if (!document.content) {
    return document;
  }

  const newContent = [...document.content];
  const mergedContent: DocumentNode[] = [];

  // Sort positions in descending order to avoid index shifting
  const sortedPositions = [...positions].sort((a, b) => b - a);

  sortedPositions.forEach(position => {
    if (position >= 0 && position < newContent.length) {
      mergedContent.unshift(newContent[position]);
      newContent.splice(position, 1);
    }
  });

  // Add merged content at the first position
  if (mergedContent.length > 0) {
    newContent.splice(sortedPositions[sortedPositions.length - 1], 0, ...mergedContent);
  }

  return {
    ...document,
    content: newContent
  };
}

/**
 * Wrap content with a specific node type
 */
export function wrapContent(
  document: DocumentNode, 
  from: number, 
  to: number, 
  wrapperType: NodeType,
  wrapperAttrs?: Record<string, any>
): DocumentNode {
  if (!document.content) {
    return document;
  }

  const newContent = [...document.content];
  const wrappedContent = newContent.slice(from, to);
  
  const wrapper: DocumentNode = {
    type: wrapperType,
    content: wrappedContent,
    attrs: wrapperAttrs || {}
  };

  newContent.splice(from, to - from, wrapper);

  return {
    ...document,
    content: newContent
  };
}

/**
 * Unwrap content from a specific node type
 */
export function unwrapContent(
  document: DocumentNode, 
  position: number
): DocumentNode {
  if (!document.content || position >= document.content.length) {
    return document;
  }

  const newContent = [...document.content];
  const nodeToUnwrap = newContent[position];

  if (nodeToUnwrap.content) {
    newContent.splice(position, 1, ...nodeToUnwrap.content);
  }

  return {
    ...document,
    content: newContent
  };
}

/**
 * Transform content using a transformation function
 */
export function transformContent(
  document: DocumentNode, 
  from: number, 
  to: number, 
  transformer: (node: DocumentNode) => DocumentNode
): DocumentNode {
  if (!document.content) {
    return document;
  }

  const newContent = [...document.content];
  
  for (let i = from; i < to && i < newContent.length; i++) {
    newContent[i] = transformer(newContent[i]);
  }

  return {
    ...document,
    content: newContent
  };
}

/**
 * Apply marks to content in a specific range
 */
export function applyMarksToContent(
  document: DocumentNode, 
  from: number, 
  to: number, 
  marks: Mark[]
): DocumentNode {
  return transformContent(document, from, to, (node) => {
    if (node.type === 'text') {
      return {
        ...node,
        marks: [...(node.marks || []), ...marks]
      };
    }
    return node;
  });
}

/**
 * Remove marks from content in a specific range
 */
export function removeMarksFromContent(
  document: DocumentNode, 
  from: number, 
  to: number, 
  markTypes: MarkType[]
): DocumentNode {
  return transformContent(document, from, to, (node) => {
    if (node.type === 'text' && node.marks) {
      return {
        ...node,
        marks: node.marks.filter(mark => !markTypes.includes(mark.type))
      };
    }
    return node;
  });
}

/**
 * Update attributes for content in a specific range
 */
export function updateContentAttributes(
  document: DocumentNode, 
  from: number, 
  to: number, 
  attrs: Record<string, any>
): DocumentNode {
  return transformContent(document, from, to, (node) => {
    return {
      ...node,
      attrs: {
        ...node.attrs,
        ...attrs
      }
    };
  });
}

/**
 * Find content by node type
 */
export function findContentByType(
  document: DocumentNode, 
  nodeType: NodeType
): SearchResult[] {
  const results: SearchResult[] = [];
  
  const search = (node: DocumentNode, path: number[]): void => {
    if (node.type === nodeType) {
      results.push({
        from: path[path.length - 1] || 0,
        to: (path[path.length - 1] || 0) + 1,
        text: getNodeText(node),
        node,
        path
      });
    }
    
    if (node.content) {
      node.content.forEach((child, index) => {
        search(child, [...path, index]);
      });
    }
  };
  
  search(document, []);
  return results;
}

/**
 * Find content by text
 */
export function findContentByText(
  document: DocumentNode, 
  query: string, 
  options: ReplaceOptions = {}
): SearchResult[] {
  const results: SearchResult[] = [];
  const { caseSensitive = false, wholeWord = false, regex = false } = options;
  
  let searchPattern: RegExp;
  
  if (regex) {
    try {
      searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
    } catch (e) {
      console.error('Invalid regex pattern:', query);
      return results;
    }
  } else {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
    searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
  }
  
  const search = (node: DocumentNode, path: number[]): void => {
    if (node.type === 'text' && node.text) {
      let match;
      while ((match = searchPattern.exec(node.text)) !== null) {
        results.push({
          from: match.index,
          to: match.index + match[0].length,
          text: match[0],
          node,
          path
        });
      }
    }
    
    if (node.content) {
      node.content.forEach((child, index) => {
        search(child, [...path, index]);
      });
    }
  };
  
  search(document, []);
  return results;
}

/**
 * Find and replace text content
 */
export function findAndReplaceText(
  document: DocumentNode, 
  query: string, 
  replacement: string, 
  options: ReplaceOptions = {}
): DocumentNode {
  const results = findContentByText(document, query, options);
  
  if (results.length === 0) {
    return document;
  }
  
  let newDocument = document;
  
  // Sort results by path in descending order to avoid index shifting
  const sortedResults = results.sort((a, b) => {
    const pathCompare = comparePaths(a.path, b.path);
    if (pathCompare !== 0) return pathCompare;
    return b.from - a.from;
  });
  
  for (const result of sortedResults) {
    newDocument = replaceTextInNode(newDocument, result, replacement, options);
  }
  
  return newDocument;
}

/**
 * Replace text in a specific node
 */
function replaceTextInNode(
  document: DocumentNode, 
  result: SearchResult, 
  replacement: string, 
  options: ReplaceOptions
): DocumentNode {
  const { preserveCase = false } = options;
  
  if (result.node.type !== 'text' || !result.node.text) {
    return document;
  }
  
  let newText = result.node.text;
  let newReplacement = replacement;
  
  if (preserveCase) {
    newReplacement = preserveCaseReplacement(result.text, replacement);
  }
  
  newText = newText.substring(0, result.from) + newReplacement + newText.substring(result.to);
  
  const newNode: DocumentNode = {
    ...result.node,
    text: newText
  };
  
  return replaceNodeAtPath(document, result.path, newNode);
}

/**
 * Replace node at a specific path
 */
function replaceNodeAtPath(
  document: DocumentNode, 
  path: number[], 
  newNode: DocumentNode
): DocumentNode {
  if (path.length === 0) {
    return newNode;
  }
  
  if (!document.content) {
    return document;
  }
  
  const newContent = [...document.content];
  const [index, ...restPath] = path;
  
  if (restPath.length === 0) {
    newContent[index] = newNode;
  } else {
    newContent[index] = replaceNodeAtPath(newContent[index], restPath, newNode);
  }
  
  return {
    ...document,
    content: newContent
  };
}

/**
 * Preserve case in replacement text
 */
function preserveCaseReplacement(original: string, replacement: string): string {
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  
  if (original === original.toLowerCase()) {
    return replacement.toLowerCase();
  }
  
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
  }
  
  return replacement;
}

/**
 * Compare two paths for sorting
 */
function comparePaths(path1: number[], path2: number[]): number {
  const minLength = Math.min(path1.length, path2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (path1[i] !== path2[i]) {
      return path2[i] - path1[i]; // Descending order
    }
  }
  
  return path2.length - path1.length;
}

/**
 * Get text content from a node
 */
function getNodeText(node: DocumentNode): string {
  if (node.text) {
    return node.text;
  }
  
  if (node.content) {
    return node.content.map(getNodeText).join('');
  }
  
  return '';
}

/**
 * Create a document operation
 */
export function createDocumentOperation(
  type: DocumentOperation['type'],
  from: number,
  to?: number,
  content?: DocumentNode[],
  attrs?: Record<string, any>,
  marks?: Mark[],
  userId?: string
): DocumentOperation {
  return {
    type,
    from,
    to,
    content,
    attrs,
    marks,
    timestamp: new Date(),
    userId
  };
}

/**
 * Apply a document operation to a document
 */
export function applyDocumentOperation(
  document: DocumentNode, 
  operation: DocumentOperation
): DocumentNode {
  switch (operation.type) {
    case 'insert':
      if (operation.content) {
        return insertContent(document, operation.from, operation.content);
      }
      break;
    
    case 'delete':
      if (operation.to !== undefined) {
        return removeContent(document, operation.from, operation.to);
      }
      break;
    
    case 'replace':
      if (operation.to !== undefined && operation.content) {
        return replaceContent(document, operation.from, operation.to, operation.content);
      }
      break;
    
    case 'move':
      if (operation.to !== undefined) {
        return moveContent(document, operation.from, operation.to, operation.from);
      }
      break;
    
    case 'format':
      if (operation.marks) {
        return applyMarksToContent(document, operation.from, operation.to || operation.from, operation.marks);
      }
      if (operation.attrs) {
        return updateContentAttributes(document, operation.from, operation.to || operation.from, operation.attrs);
      }
      break;
  }
  
  return document;
}

/**
 * Invert a document operation
 */
export function invertDocumentOperation(
  document: DocumentNode, 
  operation: DocumentOperation
): DocumentOperation {
  switch (operation.type) {
    case 'insert':
      return {
        ...operation,
        type: 'delete',
        to: operation.from + (operation.content?.length || 0)
      };
    
    case 'delete':
      return {
        ...operation,
        type: 'insert',
        content: document.content?.slice(operation.from, operation.to) || []
      };
    
    case 'replace':
      return {
        ...operation,
        content: document.content?.slice(operation.from, operation.to) || []
      };
    
    case 'move':
      return {
        ...operation,
        from: operation.to || operation.from,
        to: operation.from + (operation.to || operation.from) - operation.from
      };
    
    case 'format':
      // Format operations are typically not invertible without additional context
      return operation;
  }
  
  return operation;
}

/**
 * Export all functions
 */
export * from './content';
