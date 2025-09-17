import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Loader2, Zap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageLayout } from '../../types';
import { withErrorHandling } from '../../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
// HarfBuzz imports removed - UI elements cleaned up
// PDF generator imports removed - simplified export

interface ExportControlsProps {
  pageLayout?: PageLayout;
}

const ExportControls: React.FC<ExportControlsProps> = ({ pageLayout }) => {
  const { language } = useLanguage();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // HarfBuzz context removed - UI elements cleaned up

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

  // Enhanced PDF export removed - HarfBuzz UI elements cleaned up

  const exportPDF = async () => {
    if (isExportingPDF) return;
    
    console.log('Starting standard PDF export...');
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
        // Always use the professional multi-page editor export system
        // Use the legacy system for professional multi-page editor
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
            console.log(`Found ${pageElements.length} pages to export`);
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
                  <title>UrDocs - Export</title>
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
            throw new Error('No content found to export as PDF');
          }
        } else {
          throw new Error('Failed to open PDF export window. Please check your browser settings.');
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
      }, 1000);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1" ref={dropdownRef}>
        <DropdownMenu open={showExportDropdown} onOpenChange={setShowExportDropdown}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isExportingPDF}
                  className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === 'ur' ? 'ڈاؤن لوڈ' : 'Export'}</p>
            </TooltipContent>
          </Tooltip>
          
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                console.log('PDF export button clicked');
                exportPDF();
                setShowExportDropdown(false);
              }}
              disabled={isExportingPDF}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'ur' ? 'PDF ایکسپورٹ' : 'Export PDF'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {isExportingPDF && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span>{Math.round(exportProgress)}%</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ExportControls;