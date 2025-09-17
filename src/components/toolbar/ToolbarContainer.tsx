import React from 'react';
import { Editor } from '@tiptap/react';
import { Sun, Moon, FileText, Layers, Zap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { EditorToolbarProps } from '../../types';
import DocumentControls from './DocumentControls';
import FontControls from './FontControls';
import FormattingControls from './FormattingControls';
import AdvancedFormattingControls from './AdvancedFormattingControls';
import AlignmentControls from './AlignmentControls';
import ZoomControls from './ZoomControls';
import ExportControls from './ExportControls';
import EnhancedKeyboardLayoutToggle from './EnhancedKeyboardLayoutToggle';
// HarfBuzz imports removed - UI elements cleaned up

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
  currentLayout,
  onLayoutChange,
  isKeyboardEnabled,
  onKeyboardToggle,
}) => {
  const { language } = useLanguage();
  
  // HarfBuzz status removed - UI elements cleaned up

  const handlePrint = () => {
    // Always use the professional multi-page editor print system
        handleLegacyPrint();
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
    <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm shadow-sm">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 max-w-7xl mx-auto">
        {/* Document Controls Group */}
        <div className="flex items-center gap-2">
          <DocumentControls
            editor={editor}
            onPageSetupClick={onPageSetupClick}
            pageLayout={pageLayout}
            onToggleMarginGuides={onToggleMarginGuides}
            // Professional mode is now always enabled
            onPrint={handlePrint}
          />
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border/60" />

        {/* Typography Group */}
        <div className="flex items-center gap-2">
          <FontControls
            editor={editor}
            onFontChange={onFontChange}
            onSizeChange={onSizeChange}
          />
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border/60" />

        {/* Formatting Group */}
        <div className="flex items-center gap-2">
          <FormattingControls editor={editor} />
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border/60" />

        {/* Advanced Formatting Group */}
        <div className="flex items-center gap-2">
          <AdvancedFormattingControls editor={editor} />
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border/60" />

        {/* Alignment Group */}
        <div className="flex items-center gap-2">
          <AlignmentControls editor={editor} />
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border/60" />

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
        <div className="w-px h-6 bg-border/60" />

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

        {/* HarfBuzz Status removed - UI elements cleaned up */}

        {/* Separator */}
        <div className="w-px h-6 bg-border/60" />

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
