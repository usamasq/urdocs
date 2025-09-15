import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignRight,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Download,
  FileText,
  Loader2,
  Undo,
  Redo,
  Printer,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Sun,
  Moon,
  Settings,
  Ruler
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { useLanguage } from '../contexts/LanguageContext';
import { validateZoom, MM_TO_PX } from '../utils/dimensionUtils';

interface EditorToolbarProps {
  editor: Editor | null;
  currentFont: string;
  onFontChange: (font: string) => void;
  currentSize: string;
  onSizeChange: (size: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onPageSetupClick: () => void;
  pageLayout?: any; // PageLayout type from PageSetupSidebar
  onToggleMarginGuides?: () => void;
  useMultiPageEditor?: boolean;
  onToggleEditorMode?: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
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
  onToggleEditorMode
}) => {
  const { language, t } = useLanguage();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDOCX, setIsExportingDOCX] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Function to get font family CSS value from font key
  const getFontFamily = (fontKey: string): string => {
    switch (fontKey) {
      case 'nastaliq': return 'Noto Nastaliq Urdu, serif';
      case 'gulzar': return 'Gulzar, serif';
      case 'jameel-noori': return 'Jameel Noori Nastaleeq, serif';
      case 'al-qalam': return 'Al Qalam Taj Nastaleeq, serif';
      case 'alvi-nastaleeq': return 'Alvi Nastaleeq, serif';
      case 'nafees-nastaleeq': return 'Nafees Nastaleeq, serif';
      case 'fajer-noori': return 'Fajer Noori Nastalique, serif';
      case 'aasar-unicode': return 'Aasar Unicode, serif';
      case 'naskh': return 'Noto Naskh Arabic, serif';
      case 'naskh-sans': return 'Noto Sans Arabic, sans-serif';
      case 'naskh-serif': return 'Noto Serif Arabic, serif';
      case 'paktype-naskh': return 'PakType Naskh Basic, serif';
      case 'amiri': return 'Amiri, serif';
      case 'amiri-quran': return 'Amiri Quran, serif';
      case 'scheherazade': return 'Scheherazade New, serif';
      case 'scheherazade-old': return 'Scheherazade, serif';
      case 'cairo': return 'Cairo, sans-serif';
      case 'tajawal': return 'Tajawal, sans-serif';
      case 'ibm-sans-arabic': return 'IBM Plex Sans Arabic, sans-serif';
      case 'ibm-serif-arabic': return 'IBM Plex Serif, serif';
      case 'changa': return 'Changa, sans-serif';
      case 'el-messiri': return 'El Messiri, serif';
      case 'harmattan': return 'Harmattan, serif';
      case 'lalezar': return 'Lalezar, serif';
      case 'mada': return 'Mada, sans-serif';
      case 'mirza': return 'Mirza, serif';
      case 'noto-kufi': return 'Noto Kufi Arabic, sans-serif';
      case 'rakkas': return 'Rakkas, serif';
      case 'vazirmatn': return 'Vazirmatn, sans-serif';
      case 'estedad': return 'Estedad, sans-serif';
      case 'reem-kufi': return 'Reem Kufi, sans-serif';
      case 'markazi': return 'Markazi Text, serif';
      case 'baloo-2': return 'Baloo 2, sans-serif';
      case 'baloo-bhaijaan': return 'Baloo Bhaijaan 2, sans-serif';
      case 'baloo-tamma': return 'Baloo Tamma 2, sans-serif';
      case 'baloo-thambi': return 'Baloo Thambi 2, sans-serif';
      case 'rubik': return 'Rubik, sans-serif';
      case 'oswald': return 'Oswald, sans-serif';
      case 'quicksand': return 'Quicksand, sans-serif';
      case 'source-sans': return 'Source Sans 3, sans-serif';
      case 'source-serif': return 'Source Serif 4, serif';
      case 'work-sans': return 'Work Sans, sans-serif';
      case 'sameer-tasmeem': return 'Sameer Tasmeem Bold, serif';
      case 'sameer-rafiya': return 'Sameer Rafiya Unicode, serif';
      case 'sameer-qamri': return 'Sameer Qamri, serif';
      default: return 'Noto Nastaliq Urdu, serif';
    }
  };

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

  if (!editor) return null;

  const exportPDF = async () => {
    if (isExportingPDF) return;
    
    setIsExportingPDF(true);
    try {
      // Find all document page elements
      const docPageElements = document.querySelectorAll('.doc-page');
      if (docPageElements.length === 0) {
        throw new Error('Document pages not found');
      }

      // Get page dimensions from layout
      let pageWidth = 210; // A4 default
      let pageHeight = 297; // A4 default
      let orientation = 'portrait';
      
      if (pageLayout) {
        if (pageLayout.pageSize === 'Custom') {
          pageWidth = pageLayout.customWidth;
          pageHeight = pageLayout.customHeight;
        } else if (pageLayout.pageSize === 'Letter') {
          pageWidth = 216;
          pageHeight = 279;
        }
        
        if (pageLayout.orientation === 'landscape') {
          orientation = 'landscape';
          [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
      }

      // Configure html2pdf options
      const opt = {
        margin: pageLayout?.margins ? [
          pageLayout.margins.top,
          pageLayout.margins.right,
          pageLayout.margins.bottom,
          pageLayout.margins.left
        ] : [20, 20, 20, 20],
        filename: 'urdocs.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
          logging: false,
          width: pageWidth * MM_TO_PX, // Convert mm to pixels using centralized constant
          height: pageHeight * MM_TO_PX
        },
        jsPDF: { 
          unit: 'mm', 
          format: pageLayout?.pageSize === 'Letter' ? 'letter' : 'a4', 
          orientation: orientation as 'portrait' | 'landscape',
          compress: true
        }
      };

      // Create a temporary container for all pages
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.classList.add('light'); // Force light mode for export
      
      // Process each page
      docPageElements.forEach((pageElement) => {
        const pageContainer = document.createElement('div');
        pageContainer.style.width = `${pageWidth}mm`;
        pageContainer.style.minHeight = `${pageHeight}mm`;
        pageContainer.style.backgroundColor = '#ffffff';
        pageContainer.style.padding = `${pageLayout?.margins?.top || 20}mm ${pageLayout?.margins?.right || 20}mm ${pageLayout?.margins?.bottom || 20}mm ${pageLayout?.margins?.left || 20}mm`;
        pageContainer.style.fontFamily = 'inherit';
        pageContainer.style.fontSize = 'inherit';
        pageContainer.style.lineHeight = 'inherit';
        pageContainer.style.color = '#000000';
        pageContainer.style.direction = 'rtl';
        pageContainer.style.textAlign = 'right';
        pageContainer.style.marginBottom = '10mm'; // Space between pages
        pageContainer.style.pageBreakAfter = 'always';
        
        // Clone the page content
        const pageContent = pageElement.cloneNode(true) as HTMLElement;
        pageContent.style.boxShadow = 'none';
        pageContent.style.borderRadius = '0';
        pageContent.style.margin = '0';
        pageContent.style.padding = '0';
        
        // Remove page number and other UI elements
        const pageNumber = pageContent.querySelector('[class*="absolute bottom-2"]');
        if (pageNumber) {
          pageNumber.remove();
        }
        
        pageContainer.appendChild(pageContent);
        tempContainer.appendChild(pageContainer);
      });
      
      document.body.appendChild(tempContainer);

      // Generate PDF with multiple pages
      await html2pdf().set(opt).from(tempContainer).save();
      
      // Clean up
      document.body.removeChild(tempContainer);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };


  const exportDOCX = async () => {
    if (isExportingDOCX) return;
    
    setIsExportingDOCX(true);
    try {
      // Find all page elements
      const pageElements = document.querySelectorAll('.doc-page');
      if (pageElements.length === 0) {
        throw new Error('Document pages not found');
      }

      // Collect content from all pages
      let allContent = '';
      pageElements.forEach((pageElement, index) => {
        const editorContent = pageElement.querySelector('.ProseMirror');
        if (editorContent) {
          allContent += (editorContent as HTMLElement).innerHTML;
          // Add page break between pages (except for the last page)
          if (index < pageElements.length - 1) {
            allContent += '<div style="page-break-before: always;"></div>';
          }
        }
      });
      
      // Parse HTML and convert to DOCX paragraphs
      const convertHTMLToDocx = (html: string) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const paragraphs: Paragraph[] = [];
        
        // Process each paragraph
        const pElements = tempDiv.querySelectorAll('p');
        pElements.forEach((p) => {
          const text = p.textContent || '';
          if (text.trim()) {
            // Get paragraph styles
            const pStyle = window.getComputedStyle(p);
            const fontSize = parseInt(pStyle.fontSize) || 18;
            const isBold = pStyle.fontWeight === 'bold' || !!p.querySelector('strong');
            const isItalic = pStyle.fontStyle === 'italic' || !!p.querySelector('em');
            const isUnderline = !!p.querySelector('u');
            const textAlign = pStyle.textAlign;
            
            // Convert alignment
            let alignment = AlignmentType.RIGHT; // Default for Urdu
            if (textAlign === 'left') alignment = AlignmentType.LEFT as any;
            else if (textAlign === 'center') alignment = AlignmentType.CENTER as any;
            else if (textAlign === 'justify') alignment = AlignmentType.JUSTIFIED as any;
            
            // Create text run with formatting
            const textRun = new TextRun({
              text: text,
              font: "Noto Nastaliq Urdu",
              size: Math.round(fontSize * 2), // DOCX uses half-points
              bold: isBold,
              italics: isItalic,
              underline: isUnderline ? {} : undefined,
            });
            
            // Create paragraph
            const paragraph = new Paragraph({
              children: [textRun],
              alignment: alignment,
            });
            
            paragraphs.push(paragraph);
          }
        });
        
        return paragraphs;
      };

      const docxParagraphs = convertHTMLToDocx(allContent);

      // Create DOCX document
      const doc = new Document({
        sections: [{
          children: docxParagraphs,
        }],
      });

      // Generate and download DOCX
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'urdocs.docx';
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      alert('Failed to export DOCX. Please try again.');
    } finally {
      setIsExportingDOCX(false);
    }
  };

  const fontOptions = [
    // Urdu Nasta'liq Fonts
    { value: 'nastaliq', label: 'Noto Nastaliq Urdu', urduName: 'نوٹو نستعلیق اردو', preview: 'نستعلیق', category: t('font.category.nastaliq') },
    { value: 'gulzar', label: 'Gulzar', urduName: 'گلزار', preview: 'گلزار', category: t('font.category.nastaliq') },
    { value: 'jameel-noori', label: 'Jameel Noori Nastaleeq', urduName: 'جمیل نوری نستعلیق', preview: 'جمیل نوری', category: t('font.category.nastaliq') },
    { value: 'al-qalam', label: 'Al Qalam Taj Nastaleeq', urduName: 'القلم تاج نستعلیق', preview: 'القلم', category: t('font.category.nastaliq') },
    { value: 'alvi-nastaleeq', label: 'Alvi Nastaleeq', urduName: 'علوی نستعلیق', preview: 'الوی', category: t('font.category.nastaliq') },
    { value: 'nafees-nastaleeq', label: 'Nafees Nastaleeq', urduName: 'نفیس نستعلیق', preview: 'نفیس', category: t('font.category.nastaliq') },
    { value: 'fajer-noori', label: 'Fajer Noori Nastalique', urduName: 'فجر نوری نستعلیق', preview: 'فجر نوری', category: t('font.category.nastaliq') },
    { value: 'aasar-unicode', label: 'Aasar Unicode', urduName: 'آثار یونیکوڈ', preview: 'آثار', category: t('font.category.nastaliq') },
    
    // Arabic Naskh Fonts
    { value: 'naskh', label: 'Noto Naskh Arabic', urduName: 'نوٹو نسخ عربی', preview: 'نسخ', category: t('font.category.naskh') },
    { value: 'naskh-sans', label: 'Noto Sans Arabic', urduName: 'نوٹو سانس عربی', preview: 'نسخ سانز', category: t('font.category.naskh') },
    { value: 'naskh-serif', label: 'Noto Serif Arabic', urduName: 'نوٹو سریف عربی', preview: 'نسخ سریف', category: t('font.category.naskh') },
    { value: 'paktype-naskh', label: 'PakType Naskh Basic', urduName: 'پاک ٹائپ نسخ بیسک', preview: 'پاک ٹائپ', category: t('font.category.naskh') },
    
    // Traditional Arabic Fonts
    { value: 'amiri', label: 'Amiri', urduName: 'امیری', preview: 'امیری', category: t('font.category.traditional') },
    { value: 'amiri-quran', label: 'Amiri Quran', urduName: 'امیری قرآن', preview: 'امیری قرآن', category: t('font.category.traditional') },
    { value: 'scheherazade', label: 'Scheherazade New', urduName: 'شہرزاد نیو', preview: 'شہرزاد', category: t('font.category.traditional') },
    { value: 'scheherazade-old', label: 'Scheherazade', urduName: 'شہرزاد', preview: 'شہرزاد قدیم', category: t('font.category.traditional') },
    
    // Modern Arabic Fonts
    { value: 'cairo', label: 'Cairo', urduName: 'قاہرہ', preview: 'قاہرہ', category: t('font.category.modern') },
    { value: 'tajawal', label: 'Tajawal', urduName: 'تجوال', preview: 'تجوال', category: t('font.category.modern') },
    { value: 'ibm-sans-arabic', label: 'IBM Plex Sans Arabic', urduName: 'آئی بی ایم پلیکس سانس عربی', preview: 'آئی بی ایم', category: t('font.category.modern') },
    { value: 'ibm-serif-arabic', label: 'IBM Plex Serif', urduName: 'آئی بی ایم پلیکس سریف', preview: 'آئی بی ایم سریف', category: t('font.category.modern') },
    { value: 'changa', label: 'Changa', urduName: 'چنگا', preview: 'چنگا', category: t('font.category.modern') },
    { value: 'el-messiri', label: 'El Messiri', urduName: 'ال مسیری', preview: 'ال مسیری', category: t('font.category.modern') },
    { value: 'harmattan', label: 'Harmattan', urduName: 'ہرماٹن', preview: 'ہرماٹن', category: t('font.category.modern') },
    { value: 'lalezar', label: 'Lalezar', urduName: 'لالہ زار', preview: 'لالہ زار', category: t('font.category.modern') },
    { value: 'mada', label: 'Mada', urduName: 'مدا', preview: 'مدا', category: t('font.category.modern') },
    { value: 'mirza', label: 'Mirza', urduName: 'مرزا', preview: 'مرزا', category: t('font.category.modern') },
    { value: 'noto-kufi', label: 'Noto Kufi Arabic', urduName: 'نوٹو کوفی عربی', preview: 'نوٹو کوفی', category: t('font.category.modern') },
    { value: 'rakkas', label: 'Rakkas', urduName: 'رکاس', preview: 'رکاس', category: t('font.category.modern') },
    
    // Persian Fonts
    { value: 'vazirmatn', label: 'Vazirmatn', urduName: 'وزیرمتن', preview: 'وزیرمتن', category: t('font.category.persian') },
    { value: 'estedad', label: 'Estedad', urduName: 'استداد', preview: 'استداد', category: t('font.category.persian') },
    
    // Calligraphic Fonts
    { value: 'reem-kufi', label: 'Reem Kufi', urduName: 'ریم کوفی', preview: 'ریم کوفی', category: t('font.category.calligraphic') },
    { value: 'markazi', label: 'Markazi Text', urduName: 'مرکزی ٹیکسٹ', preview: 'مرکزی', category: t('font.category.calligraphic') },
    
    // Baloo Font Family
    { value: 'baloo-2', label: 'Baloo 2', urduName: 'بالو 2', preview: 'بالو ۲', category: t('font.category.baloo') },
    { value: 'baloo-bhaijaan', label: 'Baloo Bhaijaan 2', urduName: 'بالو بھائی جان 2', preview: 'بالو بھائی جان', category: t('font.category.baloo') },
    { value: 'baloo-tamma', label: 'Baloo Tamma 2', urduName: 'بالو تمما 2', preview: 'بالو تمما', category: t('font.category.baloo') },
    { value: 'baloo-thambi', label: 'Baloo Thambi 2', urduName: 'بالو تھمبی 2', preview: 'بالو تھمبی', category: t('font.category.baloo') },
    
    // Modern UI Fonts
    { value: 'rubik', label: 'Rubik', urduName: 'روبک', preview: 'روبک', category: t('font.category.modern.ui') },
    { value: 'oswald', label: 'Oswald', urduName: 'آسوالڈ', preview: 'آسوالڈ', category: t('font.category.modern.ui') },
    { value: 'quicksand', label: 'Quicksand', urduName: 'کوئک سینڈ', preview: 'کوئک سینڈ', category: t('font.category.modern.ui') },
    { value: 'source-sans', label: 'Source Sans 3', urduName: 'سورس سانس 3', preview: 'سورس سانس', category: t('font.category.modern.ui') },
    { value: 'source-serif', label: 'Source Serif 4', urduName: 'سورس سریف 4', preview: 'سورس سیرف', category: t('font.category.modern.ui') },
    { value: 'work-sans', label: 'Work Sans', urduName: 'ورک سانس', preview: 'ورک سانس', category: t('font.category.modern.ui') },
    
    // Sameer Font Family
    { value: 'sameer-tasmeem', label: 'Sameer Tasmeem Bold', urduName: 'سمیر تصمیم بولڈ', preview: 'سمیر تصمیم', category: t('font.category.sameer') },
    { value: 'sameer-rafiya', label: 'Sameer Rafiya Unicode', urduName: 'سمیر رفیہ یونیکوڈ', preview: 'سمیر رفیہ', category: t('font.category.sameer') },
    { value: 'sameer-qamri', label: 'Sameer Qamri', urduName: 'سمیر قمری', preview: 'سمیر قمری', category: t('font.category.sameer') },
  ];

  const sizeOptions = [
    { value: '8', label: '8px' },
    { value: '9', label: '9px' },
    { value: '10', label: '10px' },
    { value: '11', label: '11px' },
    { value: '12', label: '12px' },
    { value: '14', label: '14px' },
    { value: '16', label: '16px' },
    { value: '18', label: '18px' },
    { value: '20', label: '20px' },
    { value: '22', label: '22px' },
    { value: '24', label: '24px' },
    { value: '26', label: '26px' },
    { value: '28', label: '28px' },
    { value: '30', label: '30px' },
    { value: '32', label: '32px' },
    { value: '36', label: '36px' },
    { value: '40', label: '40px' },
    { value: '44', label: '44px' },
    { value: '48', label: '48px' },
    { value: '54', label: '54px' },
    { value: '60', label: '60px' },
    { value: '72', label: '72px' },
    { value: '96', label: '96px' },
  ];

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 max-w-7xl mx-auto">
        {/* Document Controls */}
        <div className="flex items-center gap-1 border-r border-border pr-3 mr-3">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-md hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            title={language === 'ur' ? 'واپس (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
          >
            <Undo className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-md hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            title={language === 'ur' ? 'دوبارہ (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
          >
            <Redo className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={onPageSetupClick}
            className="p-2 rounded-md hover:bg-accent transition-colors duration-150"
            title={t('toolbar.page.setup')}
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          {onToggleMarginGuides && (
            <button
              onClick={onToggleMarginGuides}
              className={`p-1.5 rounded-md transition-colors duration-150 ${
                pageLayout?.showMarginGuides
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title={t('toolbar.margin.guides')}
            >
              <Ruler className="w-4 h-4" />
            </button>
          )}
          {onToggleEditorMode && (
            <button
              onClick={onToggleEditorMode}
              className={`p-1.5 rounded-md transition-colors duration-150 ${
                useMultiPageEditor
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title={useMultiPageEditor ? 'Switch to Continuous Mode' : 'Switch to Multi-Page Mode'}
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              // Create a new window for printing all document pages
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                const pageElements = document.querySelectorAll('.doc-page');
                if (pageElements.length > 0) {
                  let allPagesHTML = '';
                  pageElements.forEach((pageElement, index) => {
                    // Clone the page element
                    const clonedPage = pageElement.cloneNode(true) as HTMLElement;
                    
                    // Remove UI elements like page numbers and shadows
                    const pageNumber = clonedPage.querySelector('[class*="absolute bottom-2"]');
                    if (pageNumber) {
                      pageNumber.remove();
                    }
                    
                    // Remove shadows and borders for print
                    clonedPage.style.boxShadow = 'none';
                    clonedPage.style.borderRadius = '0';
                    clonedPage.style.margin = '0';
                    clonedPage.style.pageBreakAfter = index < pageElements.length - 1 ? 'always' : 'auto';
                    
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
                            font-family: 'Noto Nastaliq Urdu', serif; 
                            direction: rtl; 
                            text-align: right;
                            background: white;
                          }
                          .print-content { 
                            width: 100%;
                            background: white;
                          }
                          .doc-page {
                            width: 210mm;
                            min-height: 297mm;
                            margin: 0 auto 10mm auto;
                            background: white; 
                            padding: 20mm; 
                            box-sizing: border-box;
                          }
                          @media print {
                            body { padding: 0; margin: 0; }
                            .doc-page { 
                              margin: 0; 
                              page-break-after: always;
                            }
                            .doc-page:last-child {
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
                  }, 500);
                }
              }
            }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            title="Print (Ctrl+P)"
          >
            <Printer className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Font Family */}
        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
          <select
            value={currentFont}
            onChange={(e) => onFontChange(e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-[250px] text-gray-900 dark:text-gray-100"
            style={{ fontFamily: getFontFamily(currentFont) }}
          >
            {fontOptions.map((font) => (
              <option 
                key={font.value} 
                value={font.value}
                style={{ fontFamily: getFontFamily(font.value) }}
              >
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size - Combobox */}
        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
          <div className="relative">
            <input
              type="number"
            value={currentSize}
              onChange={(e) => {
                const value = e.target.value;
                if (value && parseInt(value) >= 1 && parseInt(value) <= 200) {
                  onSizeChange(value);
                }
              }}
              onFocus={() => setShowSizeDropdown(true)}
              onBlur={() => setTimeout(() => setShowSizeDropdown(false), 150)}
              placeholder={language === 'ur' ? 'سائز' : 'Size'}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-20 text-gray-900 dark:text-gray-100"
              min="1"
              max="200"
              title={language === 'ur' ? 'فونٹ سائز درج کریں یا ڈراپ ڈاؤن سے منتخب کریں (1-200px)' : 'Enter font size or select from dropdown (1-200px)'}
            />
            
            {/* Custom Dropdown */}
            {showSizeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {sizeOptions.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => {
                      onSizeChange(size.value);
                      setShowSizeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150 ${
                      currentSize === size.value ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                {size.label}
                  </button>
            ))}
              </div>
            )}
          </div>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md transition-colors duration-150 ${
              editor.isActive('bold')
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={language === 'ur' ? 'موٹا (Ctrl+B)' : 'Bold (Ctrl+B)'}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-md transition-colors duration-150 ${
              editor.isActive('italic')
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={language === 'ur' ? 'ترچھا (Ctrl+I)' : 'Italic (Ctrl+I)'}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-md transition-colors duration-150 ${
              editor.isActive('underline')
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={language === 'ur' ? 'نیچے لکیر (Ctrl+U)' : 'Underline (Ctrl+U)'}
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-md transition-colors duration-150 ${
              editor.isActive('strike')
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={t('toolbar.strikethrough')}
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded-md transition-colors duration-150 ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={language === 'ur' ? 'دائیں ترتیب (اردو کے لیے ڈیفالٹ)' : 'Align Right (Default for Urdu)'}
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded-md transition-colors duration-150 ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={t('toolbar.align.center')}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded-md transition-colors duration-150 ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={t('toolbar.align.left')}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded-md transition-colors duration-150 ${
              editor.isActive({ textAlign: 'justify' })
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={language === 'ur' ? 'برابر ترتیب (اردو کے لیے دائیں ترتیب)' : 'Justify (Right-aligned for Urdu)'}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
          <button
            onClick={() => onZoomChange(validateZoom(zoomLevel - 0.1))}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="px-2 text-sm font-medium min-w-[3rem] text-center text-gray-700 dark:text-gray-300">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(validateZoom(zoomLevel + 0.1))}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Export Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-150 text-sm font-medium"
            title="Export Document"
          >
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showExportDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 min-w-[160px] overflow-hidden">
              <button
                onClick={() => {
                  exportPDF();
                  setShowExportDropdown(false);
                }}
                disabled={isExportingPDF || isExportingDOCX}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100 transition-colors duration-150"
              >
                {isExportingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <FileText className="w-4 h-4 text-red-600" />
                )}
                {isExportingPDF ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                onClick={() => {
                  exportDOCX();
                  setShowExportDropdown(false);
                }}
                disabled={isExportingPDF || isExportingDOCX}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100 transition-colors duration-150"
              >
                {isExportingDOCX ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-600" />
                )}
                {isExportingDOCX ? 'Exporting...' : 'Export DOCX'}
              </button>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ml-auto transition-colors duration-150"
          title={isDarkMode ? (language === 'ur' ? 'لائٹ موڈ میں تبدیل کریں' : 'Switch to Light Mode') : (language === 'ur' ? 'ڈارک موڈ میں تبدیل کریں' : 'Switch to Dark Mode')}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-yellow-500" />
          ) : (
            <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;