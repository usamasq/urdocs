/**
 * Enhanced Export Controls with HarfBuzz Integration
 * 
 * This component provides advanced PDF export capabilities using HarfBuzz WASM
 * for superior text shaping and typography, especially for Urdu and other RTL languages.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, ChevronDown, FileText, Loader2, Settings, Zap, BookOpen } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageLayout } from '../../types';
import { withErrorHandling } from '../../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { harfbuzzService } from '../../services/harfbuzzService';
import { useHarfBuzz } from '../../contexts/HarfBuzzContext';
import { pdfGenerator, PDFExportOptions } from '../../services/pdfGenerator';
import { urduTextProcessor, TextProcessingOptions } from '../../services/urduTextProcessor';

interface EnhancedExportControlsProps {
  pageLayout?: PageLayout;
}

interface ExportSettings {
  useHarfBuzz: boolean;
  textShaping: boolean;
  fontEmbedding: boolean;
  highQuality: boolean;
  preserveFormatting: boolean;
  normalizeText: boolean;
  handleBidirectional: boolean;
  fontSize: number;
  lineHeight: number;
  compression: 'low' | 'medium' | 'high';
}

const EnhancedExportControls: React.FC<EnhancedExportControlsProps> = ({ pageLayout }) => {
  const { language } = useLanguage();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  // Use centralized HarfBuzz context
  const { isInitialized, isHarfBuzzAvailable } = useHarfBuzz();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    useHarfBuzz: true,
    textShaping: true,
    fontEmbedding: true,
    highQuality: true,
    preserveFormatting: true,
    normalizeText: true,
    handleBidirectional: true,
    fontSize: 16,
    lineHeight: 24,
    compression: 'medium'
  });

  // HarfBuzz initialization is now handled by the centralized context

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

  // Enhanced PDF export with HarfBuzz
  const exportPDFWithHarfBuzz = useCallback(async () => {
    if (isExportingPDF) return;
    
    setIsExportingPDF(true);
    setExportProgress(0);
    setExportStatus('Initializing...');
    
    try {
      await withErrorHandling(async () => {
        // Get editor content
        const editorElement = document.querySelector('.ProseMirror');
        if (!editorElement) {
          throw new Error('No editor content found');
        }

        const htmlContent = editorElement.innerHTML;
        setExportProgress(10);
        setExportStatus('Processing text...');

        // Prepare PDF options
        const pdfOptions: PDFExportOptions = {
          pageSize: pageLayout?.pageSize || 'A4',
          orientation: pageLayout?.orientation || 'portrait',
          margins: pageLayout?.margins || { top: 20, bottom: 20, left: 20, right: 20 },
          fontSize: exportSettings.fontSize,
          lineHeight: exportSettings.lineHeight,
          fontFamily: 'Noto Nastaliq Urdu, serif',
          textColor: '#000000',
          backgroundColor: '#ffffff'
        };

        setExportProgress(20);
        setExportStatus('Shaping text with HarfBuzz...');

        let pdfBytes: Uint8Array;

        if (exportSettings.useHarfBuzz && isInitialized) {
          // Use HarfBuzz for advanced text shaping
          const processingOptions: TextProcessingOptions = {
            normalizeText: exportSettings.normalizeText,
            handleBidirectional: exportSettings.handleBidirectional,
            preserveFormatting: exportSettings.preserveFormatting,
            detectScript: true,
            shapeText: exportSettings.textShaping,
            fontSize: exportSettings.fontSize,
            lineHeight: exportSettings.lineHeight,
            fontFamily: 'Noto Nastaliq Urdu, serif'
          };

          // Process HTML content
          const processedBlocks = await urduTextProcessor.processHtmlContent(htmlContent, processingOptions);
          
          setExportProgress(40);
          setExportStatus('Generating PDF...');

          // Generate PDF with HarfBuzz
          pdfBytes = await pdfGenerator.processHtmlContent(htmlContent, pdfOptions);
        } else {
          // Fallback to standard PDF generation
          setExportStatus('Using standard PDF generation...');
          pdfBytes = await pdfGenerator.processHtmlContent(htmlContent, pdfOptions);
        }

        setExportProgress(80);
        setExportStatus('Finalizing PDF...');

        // Download the PDF
        const filename = `urdocs-export-${new Date().toISOString().split('T')[0]}.pdf`;
        await pdfGenerator.downloadPDF(pdfBytes, filename);

        setExportProgress(100);
        setExportStatus('Export completed successfully!');
        
        // Reset status after a delay
        setTimeout(() => {
          setExportStatus('');
        }, 2000);

      }, 'HarfBuzzPDFExport');
    } catch (error) {
      console.error('Error exporting PDF with HarfBuzz:', error);
      setExportStatus('Export failed. Please try again.');
      setTimeout(() => {
        setExportStatus('');
      }, 3000);
    } finally {
      setIsExportingPDF(false);
      setExportProgress(0);
    }
  }, [isExportingPDF, pageLayout, exportSettings, isInitialized]);

  // Standard PDF export (fallback)
  const exportPDFStandard = useCallback(async () => {
    if (isExportingPDF) return;
    
    setIsExportingPDF(true);
    setExportProgress(0);
    setExportStatus('Exporting with standard method...');
    
    try {
      // Use the existing export logic as fallback
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const editorElement = document.querySelector('.ProseMirror');
        if (editorElement) {
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
                    padding: 20px; 
                    background: white;
                    font-family: 'Noto Nastaliq Urdu', serif;
                    direction: rtl;
                    text-align: right;
                  }
                  @media print {
                    body { margin: 0; padding: 0; }
                  }
                </style>
              </head>
              <body>
                ${editorElement.innerHTML}
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
        }
      }
      
      setExportStatus('Standard export completed!');
      setTimeout(() => {
        setExportStatus('');
      }, 2000);
    } catch (error) {
      console.error('Error with standard PDF export:', error);
      setExportStatus('Export failed. Please try again.');
      setTimeout(() => {
        setExportStatus('');
      }, 3000);
    } finally {
      setIsExportingPDF(false);
      setExportProgress(0);
    }
  }, [isExportingPDF]);

  const handleExportSettingsChange = (key: keyof ExportSettings, value: any) => {
    setExportSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <TooltipProvider>
      <div ref={dropdownRef} className="relative">
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
              <p>Export Document with Advanced Typography</p>
            </TooltipContent>
          </Tooltip>
          
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem
              onClick={() => {
                exportPDFWithHarfBuzz();
                setShowExportDropdown(false);
              }}
              disabled={isExportingPDF}
              className="cursor-pointer"
            >
              {isExportingPDF ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              <div className="flex flex-col">
                <span>Export PDF (HarfBuzz)</span>
                <span className="text-xs text-muted-foreground">
                  {isInitialized ? 'Advanced typography' : 'Initializing...'}
                </span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => {
                exportPDFStandard();
                setShowExportDropdown(false);
              }}
              disabled={isExportingPDF}
              className="cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2" />
              <div className="flex flex-col">
                <span>Export PDF (Standard)</span>
                <span className="text-xs text-muted-foreground">Basic export</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => {
                setShowSettingsDialog(true);
                setShowExportDropdown(false);
              }}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              Export Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Export Settings
              </DialogTitle>
              <DialogDescription>
                Configure advanced PDF export options with HarfBuzz text shaping
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* HarfBuzz Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  HarfBuzz Text Shaping
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useHarfBuzz"
                      checked={exportSettings.useHarfBuzz}
                      onCheckedChange={(checked) => handleExportSettingsChange('useHarfBuzz', checked)}
                      disabled={!isInitialized}
                    />
                    <Label htmlFor="useHarfBuzz" className="text-sm">
                      Enable HarfBuzz
                      {!isInitialized && <span className="text-muted-foreground ml-1">(Not available)</span>}
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="textShaping"
                      checked={exportSettings.textShaping}
                      onCheckedChange={(checked) => handleExportSettingsChange('textShaping', checked)}
                      disabled={!exportSettings.useHarfBuzz}
                    />
                    <Label htmlFor="textShaping" className="text-sm">Advanced Text Shaping</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="normalizeText"
                      checked={exportSettings.normalizeText}
                      onCheckedChange={(checked) => handleExportSettingsChange('normalizeText', checked)}
                    />
                    <Label htmlFor="normalizeText" className="text-sm">Normalize Text</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="handleBidirectional"
                      checked={exportSettings.handleBidirectional}
                      onCheckedChange={(checked) => handleExportSettingsChange('handleBidirectional', checked)}
                    />
                    <Label htmlFor="handleBidirectional" className="text-sm">Bidirectional Text</Label>
                  </div>
                </div>
              </div>

              {/* Typography Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Typography
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fontSize" className="text-sm">Font Size</Label>
                    <div className="px-3">
                      <Slider
                        id="fontSize"
                        min={8}
                        max={72}
                        step={1}
                        value={[exportSettings.fontSize]}
                        onValueChange={([value]) => handleExportSettingsChange('fontSize', value)}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        {exportSettings.fontSize}px
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lineHeight" className="text-sm">Line Height</Label>
                    <div className="px-3">
                      <Slider
                        id="lineHeight"
                        min={12}
                        max={48}
                        step={1}
                        value={[exportSettings.lineHeight]}
                        onValueChange={([value]) => handleExportSettingsChange('lineHeight', value)}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        {exportSettings.lineHeight}px
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Quality & Compression</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="highQuality"
                      checked={exportSettings.highQuality}
                      onCheckedChange={(checked) => handleExportSettingsChange('highQuality', checked)}
                    />
                    <Label htmlFor="highQuality" className="text-sm">High Quality</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="compression" className="text-sm">Compression</Label>
                    <Select
                      value={exportSettings.compression}
                      onValueChange={(value) => handleExportSettingsChange('compression', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Large file)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (Small file)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowSettingsDialog(false)}>
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Status */}
        {exportStatus && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-background border rounded-md shadow-lg text-sm">
            {exportStatus}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default EnhancedExportControls;
