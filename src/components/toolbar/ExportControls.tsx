import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageLayout } from '../../types';
import { withErrorHandling } from '../../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { prepareDynamicPageEditorForPrint, type PrintOptions } from '../../utils/printUtils';

interface ExportControlsProps {
  pageLayout?: PageLayout;
}

const ExportControls: React.FC<ExportControlsProps> = ({ pageLayout }) => {
  const { language } = useLanguage();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to copy computed styles from one element to another
  const copyComputedStyles = (source: HTMLElement, target: HTMLElement) => {
    const computedStyle = window.getComputedStyle(source);
    const styleProps = [
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
      'color', 'textAlign', 'direction', 'padding', 'margin', 'border',
      'backgroundColor', 'textDecoration', 'letterSpacing', 'wordSpacing',
      'textIndent', 'whiteSpace', 'overflow', 'overflowWrap', 'wordWrap',
      'hyphens', 'textRendering', 'fontSmoothing'
    ];
    
    styleProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'initial' && value !== 'inherit') {
        target.style.setProperty(prop, value);
      }
    });
  };

  const exportPDF = async () => {
    if (isExportingPDF) return;
    
    setIsExportingPDF(true);
    setExportProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    try {
      await withErrorHandling(async () => {
        // Check if we're using DynamicPageEditor
        const documentContainer = document.querySelector('.document-container');
        const isDynamicPageEditor = documentContainer && !documentContainer.classList.contains('multi-page-editor');
        
        if (isDynamicPageEditor) {
          // Use the new DynamicPageEditor print system
          const printOptions: PrintOptions = {
            pageSize: pageLayout?.pageSize || 'A4',
            orientation: pageLayout?.orientation || 'portrait',
            margins: pageLayout?.margins || { top: 20, bottom: 20, left: 20, right: 20 },
            scale: 1
          };
          
          // Get page break positions from the editor state
          // Try to find page break positions from the editor's data attributes or state
          let pageBreakPositions: number[] = [];
          
          // Look for page break positions in the editor's data attributes
          const editorElement = document.querySelector('.ProseMirror');
          if (editorElement) {
            const pageBreaksData = editorElement.getAttribute('data-page-breaks');
            if (pageBreaksData) {
              try {
                pageBreakPositions = JSON.parse(pageBreaksData);
                console.log('Found page break positions from data attribute:', pageBreakPositions);
              } catch (e) {
                console.warn('Failed to parse page break positions:', e);
              }
            }
          }
          
          // If no page breaks found, try to calculate them based on content height
          if (pageBreakPositions.length === 0) {
            const contentElement = document.querySelector('.editor-content .ProseMirror') as HTMLElement;
            if (contentElement) {
              const contentHeight = contentElement.scrollHeight;
              const pageHeight = printOptions.pageSize === 'Letter' ? 279 * 3.7795275591 : 297 * 3.7795275591;
              const marginTopPx = (printOptions.margins?.top || 20) * 3.7795275591;
              const marginBottomPx = (printOptions.margins?.bottom || 20) * 3.7795275591;
              const availableHeight = pageHeight - marginTopPx - marginBottomPx;
              
              console.log('Calculating page breaks:', { 
                contentHeight, 
                pageHeight, 
                availableHeight, 
                marginTopPx, 
                marginBottomPx 
              });
              
              // Calculate page breaks based on available height per page
              if (contentHeight > availableHeight) {
                const pageCount = Math.ceil(contentHeight / availableHeight);
                for (let i = 1; i < pageCount; i++) {
                  pageBreakPositions.push(i * availableHeight);
                }
              }
              
              console.log('Calculated page break positions:', pageBreakPositions);
            }
          }
          
          // Force recalculation of page breaks to handle font size changes
          // This ensures that font size changes are properly reflected in print preview
          const contentElement = document.querySelector('.editor-content .ProseMirror') as HTMLElement;
          if (contentElement && pageBreakPositions.length > 0) {
            const currentContentHeight = contentElement.scrollHeight;
            const pageHeight = printOptions.pageSize === 'Letter' ? 279 * 3.7795275591 : 297 * 3.7795275591;
            const marginTopPx = (printOptions.margins?.top || 20) * 3.7795275591;
            const marginBottomPx = (printOptions.margins?.bottom || 20) * 3.7795275591;
            const availableHeight = pageHeight - marginTopPx - marginBottomPx;
            
            // Check if content height has changed significantly (indicating font size change)
            const expectedContentHeight = pageBreakPositions[pageBreakPositions.length - 1] || availableHeight;
            const heightDifference = Math.abs(currentContentHeight - expectedContentHeight);
            
            if (heightDifference > 50) { // 50px threshold for significant change
              console.log('Font size change detected, recalculating page breaks:', {
                currentHeight: currentContentHeight,
                expectedHeight: expectedContentHeight,
                difference: heightDifference
              });
              
              // Recalculate page breaks based on current content
              pageBreakPositions.length = 0; // Clear existing positions
              if (currentContentHeight > availableHeight) {
                const pageCount = Math.ceil(currentContentHeight / availableHeight);
                for (let i = 1; i < pageCount; i++) {
                  pageBreakPositions.push(i * availableHeight);
                }
              }
              
              console.log('Recalculated page break positions for font size change:', pageBreakPositions);
            }
          }
          
          // Prepare for print with separate pages
          const cleanup = prepareDynamicPageEditorForPrint(printOptions, pageBreakPositions);
          
          // Get the print pages container
          const printContainer = document.querySelector('.print-pages-container');
          console.log('Print container found:', !!printContainer);
          
          if (printContainer) {
            // Open print window with the prepared pages
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>UrDocs - PDF Export</title>
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
                        .print-content {
                          padding: ${printOptions.margins?.top || 20}mm ${printOptions.margins?.right || 20}mm ${printOptions.margins?.bottom || 20}mm ${printOptions.margins?.left || 20}mm !important;
                          box-sizing: border-box !important;
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
            console.warn('Print container not found, falling back to legacy system');
            // Fallback to legacy system if print container creation failed
            throw new Error('Failed to create print pages');
          }
        } else {
          // Use the legacy system for other editors
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            let pageElements = document.querySelectorAll('.doc-page');
            console.log('PDF Export: Found .doc-page elements:', pageElements.length);
            
            // If no .doc-page elements found, try .document-container (EnhancedEditorWithRuler)
            if (pageElements.length === 0) {
              pageElements = document.querySelectorAll('.document-container');
              console.log('PDF Export: Found .document-container elements:', pageElements.length);
            }
            
            // If still no elements found, try to find editor content directly
            if (pageElements.length === 0) {
              const editorContent = document.querySelector('.editor-content');
              console.log('PDF Export: Found .editor-content element:', !!editorContent);
              if (editorContent) {
                // Create a temporary page container and add it to the document
                const tempPage = document.createElement('div');
                tempPage.className = 'doc-page';
                tempPage.style.position = 'absolute';
                tempPage.style.left = '-9999px';
                tempPage.appendChild(editorContent.cloneNode(true));
                document.body.appendChild(tempPage);
                pageElements = document.querySelectorAll('.doc-page');
                console.log('PDF Export: Created temporary .doc-page element');
              }
            }
            
            if (pageElements.length > 0) {
            console.log(`PDF Export: Processing ${pageElements.length} pages`);
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
              
              // Remove UI elements like page numbers, shadows, and debug elements
              const pageNumber = clonedPage.querySelector('.page-number');
              if (pageNumber) {
                pageNumber.remove();
              }
              
              // Remove overflow indicators
              const overflowIndicator = clonedPage.querySelector('.overflow-indicator');
              if (overflowIndicator) {
                overflowIndicator.remove();
              }
              
              // Remove page break indicators
              const pageBreakIndicators = clonedPage.querySelector('.page-break-indicators');
              if (pageBreakIndicators) {
                pageBreakIndicators.remove();
              }
              
              // Remove current page indicator
              const currentPageIndicator = clonedPage.querySelector('.current-page-indicator');
              if (currentPageIndicator) {
                currentPageIndicator.remove();
              }
              
              // Remove ruler system
              const rulerSystem = clonedPage.querySelector('.ruler-system');
              if (rulerSystem) {
                rulerSystem.remove();
              }
              
              // Remove margin handles
              const marginHandles = clonedPage.querySelectorAll('.margin-handle');
              marginHandles.forEach(handle => handle.remove());
              
              // Remove debug information
              const debugInfo = clonedPage.querySelector('[style*="rgba(0, 0, 0, 0.8)"]');
              if (debugInfo) {
                debugInfo.remove();
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
              
              // Copy exact computed styles from original element
              copyComputedStyles(pageElement as HTMLElement, clonedPage);
              
              // Ensure the editor content preserves its original styling
              const originalEditorContent = pageElement.querySelector('.editor-content');
              const clonedEditorContent = clonedPage.querySelector('.editor-content');
              if (originalEditorContent && clonedEditorContent) {
                copyComputedStyles(originalEditorContent as HTMLElement, clonedEditorContent as HTMLElement);
                // Only remove shadows/borders for print
                (clonedEditorContent as HTMLElement).style.boxShadow = 'none';
                (clonedEditorContent as HTMLElement).style.borderRadius = '0';
              }
              
              // Preserve ProseMirror styling exactly
              const originalProseMirror = pageElement.querySelector('.ProseMirror');
              const clonedProseMirror = clonedPage.querySelector('.ProseMirror');
              if (originalProseMirror && clonedProseMirror) {
                copyComputedStyles(originalProseMirror as HTMLElement, clonedProseMirror as HTMLElement);
                // Only remove shadows/borders for print
                (clonedProseMirror as HTMLElement).style.boxShadow = 'none';
                (clonedProseMirror as HTMLElement).style.borderRadius = '0';
              }
              
              allPagesHTML += clonedPage.outerHTML;
            });
            
            // Create the PDF export window with perfect styling
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>UrDocs - PDF Export</title>
                  <meta charset="utf-8">
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
                    body { 
                      margin: 0; 
                      padding: 0; 
                      background: white;
                      font-family: 'Noto Nastaliq Urdu', serif;
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
                      body { 
                        padding: 0; 
                        margin: 0; 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      .doc-page, .document-container { 
                        margin: 0; 
                        page-break-after: always;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      .doc-page:last-child, .document-container:last-child {
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
                  <div class="print-content">${allPagesHTML}</div>
                  <script>
                    // Auto-trigger print dialog after page loads
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
            
            // Clean up any temporary page elements created for fallback
            setTimeout(() => {
              const tempPages = document.querySelectorAll('.doc-page[style*="-9999px"]');
              tempPages.forEach(page => {
                if (page.parentNode) {
                  page.parentNode.removeChild(page);
                }
              });
            }, 1000);
            
            } else {
              throw new Error('No content found to export as PDF');
            }
          } else {
            throw new Error('Failed to open PDF export window. Please check your browser settings.');
          }
        }
      }, 'PDFExport');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setExportProgress(100);
      setTimeout(() => {
        setIsExportingPDF(false);
        setExportProgress(0);
      }, 500);
    }
  };

  return (
    <TooltipProvider>
      <DropdownMenu open={showExportDropdown} onOpenChange={setShowExportDropdown}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="h-8 px-3 transition-all duration-200 relative overflow-hidden"
                disabled={isExportingPDF}
              >
                {isExportingPDF && (
                  <div 
                    className="absolute inset-0 bg-primary/20 transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                )}
                {isExportingPDF ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1.5" />
                )}
                {isExportingPDF ? `Exporting ${Math.round(exportProgress)}%` : 'Export'}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export Document</p>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              exportPDF();
              setShowExportDropdown(false);
            }}
            disabled={isExportingPDF}
            className="cursor-pointer"
          >
            {isExportingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {isExportingPDF ? 'Exporting...' : 'Export PDF'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default ExportControls;
