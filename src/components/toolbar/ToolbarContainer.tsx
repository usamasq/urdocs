import React from 'react';
import { Editor } from '@tiptap/react';
import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { EditorToolbarProps } from '../../types';
import DocumentControls from './DocumentControls';
import FontControls from './FontControls';
import FormattingControls from './FormattingControls';
import AlignmentControls from './AlignmentControls';
import ZoomControls from './ZoomControls';
import ExportControls from './ExportControls';
import EnhancedKeyboardLayoutToggle from './EnhancedKeyboardLayoutToggle';

const ToolbarContainer: React.FC<EditorToolbarProps> = ({
  editor,
  currentFont,
  onFontChange,
  currentSize,
  onSizeChange,
  isDarkMode,
  onToggleDarkMode,
  zoomLevel,
  onZoomChange,
  onPageSetupClick,
  pageLayout,
  onToggleMarginGuides,
  useMultiPageEditor = true,
  onToggleEditorMode,
  currentLayout,
  onLayoutChange,
  isKeyboardEnabled,
  onKeyboardToggle,
}) => {
  const { language } = useLanguage();

  const handlePrint = () => {
    try {
      // Check if we're using DynamicPageEditor
      const documentContainer = document.querySelector('.document-container');
      const isDynamicPageEditor = documentContainer && !documentContainer.classList.contains('multi-page-editor');
      
      if (isDynamicPageEditor) {
        // Use the new DynamicPageEditor print system
        const printOptions = {
          pageSize: pageLayout?.pageSize || 'A4',
          orientation: pageLayout?.orientation || 'portrait',
          margins: pageLayout?.margins || { top: 20, bottom: 20, left: 20, right: 20 },
          scale: 1
        };
        
        // Get page break positions from the editor state
        let pageBreakPositions: number[] = [];
        
        // Look for page break positions in the editor's data attributes
        const editorElement = document.querySelector('.ProseMirror');
        if (editorElement) {
          const pageBreaksData = editorElement.getAttribute('data-page-breaks');
          if (pageBreaksData) {
            try {
              pageBreakPositions = JSON.parse(pageBreaksData);
              console.log('Print: Found page break positions from data attribute:', pageBreakPositions);
            } catch (e) {
              console.warn('Failed to parse page break positions:', e);
            }
          }
        }
        
        // If no page breaks found, try to calculate them
        if (pageBreakPositions.length === 0) {
          const contentElement = document.querySelector('.editor-content .ProseMirror') as HTMLElement;
          if (contentElement) {
            const contentHeight = contentElement.scrollHeight;
            const pageHeight = printOptions.pageSize === 'Letter' ? 279 * 3.7795275591 : 297 * 3.7795275591;
            const availableHeight = pageHeight - ((printOptions.margins?.top || 20) + (printOptions.margins?.bottom || 20)) * 3.7795275591;
            
            console.log('Print: Calculating page breaks:', { contentHeight, pageHeight, availableHeight });
            
            // Calculate approximate page breaks
            const pageCount = Math.ceil(contentHeight / availableHeight);
            for (let i = 1; i < pageCount; i++) {
              pageBreakPositions.push(i * availableHeight);
            }
            
            console.log('Print: Calculated page break positions:', pageBreakPositions);
          }
        }
        
        // Import the print utilities dynamically to avoid circular dependencies
        import('../../utils/printUtils').then(({ prepareDynamicPageEditorForPrint }) => {
          // Prepare for print with separate pages
          const cleanup = prepareDynamicPageEditorForPrint(printOptions, pageBreakPositions);
          
          // Get the print pages container
          const printContainer = document.querySelector('.print-pages-container');
          console.log('Print: Print container found:', !!printContainer);
          
          if (printContainer) {
            // Open print window with the prepared pages
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>UrDocs - Print</title>
                    <meta charset="utf-8">
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
                      body { 
                        margin: 0; 
                        padding: 0; 
                        background: white;
                        font-family: 'Noto Nastaliq Urdu', serif;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      .print-pages-container {
                        width: 100%;
                        background: white;
                      }
                      .print-page {
                        margin: 0 auto 10mm auto;
                        background: white; 
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      /* Preserve all original document styling */
                      .document-container {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      .editor-content {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      .ProseMirror {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      .prose-content {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      @media print {
                        body { 
                          padding: 0; 
                          margin: 0; 
                          -webkit-print-color-adjust: exact;
                          print-color-adjust: exact;
                        }
                        .print-page { 
                          margin: 0; 
                          page-break-after: always;
                          -webkit-print-color-adjust: exact;
                          print-color-adjust: exact;
                        }
                        .print-page:last-child {
                          page-break-after: auto;
                        }
                        * {
                          -webkit-print-color-adjust: exact;
                          print-color-adjust: exact;
                        }
                      }
                    </style>
                  </head>
                  <body>
                    ${printContainer.innerHTML}
                    <script>
                      window.onload = function() {
                        setTimeout(function() {
                          window.print();
                        }, 500);
                      };
                    </script>
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.focus();
              
              // Cleanup after printing
              setTimeout(() => {
                cleanup();
              }, 1000);
            }
          } else {
            console.warn('Print: Print container not found, falling back to legacy system');
            // Fallback to legacy system
            handleLegacyPrint();
          }
        }).catch((error) => {
          console.error('Print: Error importing print utilities:', error);
          // Fallback to legacy system
          handleLegacyPrint();
        });
      } else {
        // Use legacy system for other editors
        handleLegacyPrint();
      }
    } catch (error) {
      console.error('Error printing document:', error);
      alert('Failed to print document. Please try again.');
    }
  };

  const handleLegacyPrint = () => {
    try {
      // Create a new window for printing all document pages
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        let pageElements = document.querySelectorAll('.doc-page');
        console.log('Print: Found .doc-page elements:', pageElements.length);
        
        // If no .doc-page elements found, try .document-container (EnhancedEditorWithRuler)
        if (pageElements.length === 0) {
          pageElements = document.querySelectorAll('.document-container');
          console.log('Print: Found .document-container elements:', pageElements.length);
        }
        
        // If still no elements found, try to find editor content directly
        if (pageElements.length === 0) {
          const editorContent = document.querySelector('.editor-content');
          console.log('Print: Found .editor-content element:', !!editorContent);
          if (editorContent) {
            // Create a temporary page container and add it to the document
            const tempPage = document.createElement('div');
            tempPage.className = 'doc-page';
            tempPage.style.position = 'absolute';
            tempPage.style.left = '-9999px';
            tempPage.appendChild(editorContent.cloneNode(true));
            document.body.appendChild(tempPage);
            pageElements = document.querySelectorAll('.doc-page');
            console.log('Print: Created temporary .doc-page element');
          }
        }
        
        if (pageElements.length > 0) {
          console.log(`Found ${pageElements.length} pages to print`);
          let allPagesHTML = '';
          
          // Get page dimensions from layout
          let pageWidth = 210; // A4 default
          let pageHeight = 297; // A4 default
          
          if (pageLayout) {
            if (pageLayout.pageSize === 'Custom') {
              pageWidth = pageLayout.customWidth;
              pageHeight = pageLayout.customHeight;
            } else if (pageLayout.pageSize === 'Letter') {
              pageWidth = 216;
              pageHeight = 279;
            }
          }
          
          pageElements.forEach((pageElement, index) => {
            // Clone the page element with all its styling preserved
            const clonedPage = pageElement.cloneNode(true) as HTMLElement;
            
            // Remove UI elements like page numbers and shadows
            const pageNumber = clonedPage.querySelector('.page-number');
            if (pageNumber) {
              pageNumber.remove();
            }
            
            // Remove overflow indicators
            const overflowIndicator = clonedPage.querySelector('.overflow-indicator');
            if (overflowIndicator) {
              overflowIndicator.remove();
            }
            
            // Preserve the original styling but remove shadows and borders for print
            clonedPage.style.boxShadow = 'none';
            clonedPage.style.borderRadius = '0';
            clonedPage.style.margin = '0';
            clonedPage.style.pageBreakAfter = index < pageElements.length - 1 ? 'always' : 'auto';
            
            // Keep the original dimensions and styling
            clonedPage.style.width = `${pageWidth}mm`;
            clonedPage.style.minHeight = `${pageHeight}mm`;
            clonedPage.style.backgroundColor = '#ffffff';
            clonedPage.style.boxSizing = 'border-box';
            
            allPagesHTML += clonedPage.outerHTML;
          });
          
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>UrDocs - Print</title>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
                  body { 
                    margin: 0; 
                    padding: 0; 
                    background: white;
                  }
                  .print-content { 
                    width: 100%;
                    background: white;
                  }
                  /* Preserve all original styling - don't override */
                  .doc-page, .document-container {
                    margin: 0 auto 10mm auto;
                    background: white; 
                    box-sizing: border-box;
                  }
                  /* Preserve all editor content styling */
                  .editor-content {
                    /* Keep all original styles - don't override */
                  }
                  .ProseMirror {
                    /* Keep all original styles - don't override */
                  }
                  .prose-content {
                    /* Keep all original styles - don't override */
                  }
                  @media print {
                    body { padding: 0; margin: 0; }
                    .doc-page, .document-container { 
                      margin: 0; 
                      page-break-after: always;
                    }
                    .doc-page:last-child, .document-container:last-child {
                      page-break-after: auto;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="print-content">${allPagesHTML}</div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            
            // Clean up any temporary page elements created for fallback
            const tempPages = document.querySelectorAll('.doc-page[style*="-9999px"]');
            tempPages.forEach(page => {
              if (page.parentNode) {
                page.parentNode.removeChild(page);
              }
            });
          }, 500);
        } else {
          alert('No content found to print');
          printWindow.close();
        }
      } else {
        alert('Failed to open print window. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error printing document:', error);
      alert('Failed to print document. Please try again.');
    }
  };

  if (!editor) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-6 max-w-7xl mx-auto">
        {/* Document Controls Group */}
        <div className="flex items-center gap-2">
          <DocumentControls
            editor={editor}
            onPageSetupClick={onPageSetupClick}
            pageLayout={pageLayout}
            onToggleMarginGuides={onToggleMarginGuides}
            useMultiPageEditor={useMultiPageEditor}
            onToggleEditorMode={onToggleEditorMode}
            onPrint={handlePrint}
          />
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-border" />

        {/* Typography Group */}
        <div className="flex items-center gap-2">
          <FontControls
            editor={editor}
            onFontChange={onFontChange}
            onSizeChange={onSizeChange}
          />
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-border" />

        {/* Formatting Group */}
        <div className="flex items-center gap-2">
          <FormattingControls editor={editor} />
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-border" />

        {/* Alignment Group */}
        <div className="flex items-center gap-2">
          <AlignmentControls editor={editor} />
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-border" />

        {/* Keyboard & Input Group */}
        <div className="flex items-center gap-2">
          <EnhancedKeyboardLayoutToggle
            currentLayout={currentLayout}
            onLayoutChange={onLayoutChange}
            isKeyboardEnabled={isKeyboardEnabled}
            onKeyboardToggle={onKeyboardToggle}
          />
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-border" />

        {/* View & Export Group */}
        <div className="flex items-center gap-2">
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomChange={onZoomChange}
          />
          <ExportControls pageLayout={pageLayout} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-md hover:bg-accent transition-all duration-200 hover:scale-105"
            title={isDarkMode ? (language === 'ur' ? 'لائٹ موڈ میں تبدیل کریں' : 'Switch to Light Mode') : (language === 'ur' ? 'ڈارک موڈ میں تبدیل کریں' : 'Switch to Dark Mode')}
            aria-label={isDarkMode ? (language === 'ur' ? 'لائٹ موڈ میں تبدیل کریں' : 'Switch to Light Mode') : (language === 'ur' ? 'ڈارک موڈ میں تبدیل کریں' : 'Switch to Dark Mode')}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolbarContainer;
