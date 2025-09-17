import { Node, mergeAttributes } from '@tiptap/core';

// Page break extension for TipTap
export const PageBreakExtension = Node.create({
  name: 'pageBreak',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      pageNumber: {
        default: 1,
        parseHTML: element => element.getAttribute('data-page-number'),
        renderHTML: attributes => ({
          'data-page-number': attributes.pageNumber,
        }),
      },
      isManual: {
        default: false,
        parseHTML: element => element.getAttribute('data-manual') === 'true',
        renderHTML: attributes => ({
          'data-manual': attributes.isManual,
        }),
      },
      breakType: {
        default: 'page',
        parseHTML: element => element.getAttribute('data-break-type') || 'page',
        renderHTML: attributes => ({
          'data-break-type': attributes.breakType,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'page-break',
      class: 'page-break-line',
      style: 'width: 100%; height: 1px; background-color: #e0e0e0; margin: 10px 0; position: relative; display: block;'
    })];
  },
});

export default PageBreakExtension;
