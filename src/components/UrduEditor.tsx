import React, { useState, useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from '@tiptap/extension-font-size';
import { Underline } from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { TextAlign } from '@tiptap/extension-text-align';
import { FileText } from 'lucide-react';
import { useUrduKeyboard } from '../hooks/useUrduKeyboard';
import { LayoutType } from '../utils/keyboardLayouts';
import LayoutSelector from './LayoutSelector';
import EditorToolbar from './EditorToolbar';
import PageSetupSidebar, { PageLayout } from './PageSetupSidebar';
import LanguageToggle from './LanguageToggle';
import PaginationControls from './PaginationControls';
import EnhancedEditorWithRuler from './EnhancedEditorWithRuler';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const UrduEditor: React.FC = () => {
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('phonetic');
  const [currentFont, setCurrentFont] = useState<string>('nastaliq');
  const [currentSize, setCurrentSize] = useState<string>('18');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isPageSetupOpen, setIsPageSetupOpen] = useState<boolean>(false);
  const [pageCount, setPageCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageLayout, setPageLayout] = useState<PageLayout>({
    pageSize: 'A4',
    customWidth: 210,
    customHeight: 297,
    orientation: 'portrait',
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
    },
    showMarginGuides: true,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable underline and strike from StarterKit to avoid duplicates
        strike: false,
        underline: false,
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Underline,
      Strike,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: `
      <p style="text-align: right; font-family: 'Noto Nastaliq Urdu', serif; font-size: 18px;">اردو میں خوش آمدید</p>
      <p style="text-align: right; font-family: 'Noto Nastaliq Urdu', serif; font-size: 18px;">یہ ایک جدید اردو ایڈیٹر ہے جو نستعلیق فونٹ میں تحریر کی سہولت فراہم کرتا ہے۔</p>
      <p style="text-align: right; font-family: 'Noto Nastaliq Urdu', serif; font-size: 18px;">آپ یہاں اردو میں تحریر کر سکتے ہیں۔</p>
      <p style="text-align: right; font-family: 'Noto Nastaliq Urdu', serif; font-size: 18px;"><strong>مختلف کی بورڈ لے آؤٹ</strong> استعمال کریں: <em>Phonetic</em>، <u>InPage</u>، یا CRULP</p>
      <p style="text-align: right; font-family: 'Noto Nastaliq Urdu', serif; font-size: 18px;">اب آپ <strong>موٹے</strong>، <em>ترچھے</em>، اور <u>خط کشیدہ</u> متن لکھ سکتے ہیں!</p>
    `,
    editorProps: {
      attributes: {
        class: `editor-content min-h-[400px] p-6 focus:outline-none prose prose-lg max-w-none`,
        style: `font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; text-align: right;`,
      },
    },
  });

  // Use the Urdu keyboard hook
  useUrduKeyboard(editor, currentLayout);

  // Dark mode effect
  useEffect(() => {
    // Theme is now handled by ThemeProvider
  }, [theme]);

  // Handle font family changes
  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    if (editor) {
      let fontFamily = '';
      
      switch (font) {
        // Urdu Nasta'liq Fonts
        case 'nastaliq':
          fontFamily = 'Noto Nastaliq Urdu, serif';
          break;
        case 'gulzar':
          fontFamily = 'Gulzar, serif';
          break;
        
        // Arabic Naskh Fonts
        case 'naskh':
          fontFamily = 'Noto Naskh Arabic, serif';
          break;
        case 'naskh-sans':
          fontFamily = 'Noto Sans Arabic, sans-serif';
          break;
        case 'naskh-serif':
          fontFamily = 'Noto Serif Arabic, serif';
          break;
        
        // Traditional Arabic Fonts
        case 'amiri':
          fontFamily = 'Amiri, serif';
          break;
        case 'amiri-quran':
          fontFamily = 'Amiri Quran, serif';
          break;
        case 'scheherazade':
          fontFamily = 'Scheherazade New, serif';
          break;
        case 'scheherazade-old':
          fontFamily = 'Scheherazade, serif';
          break;
        
        // Modern Arabic Fonts
        case 'cairo':
          fontFamily = 'Cairo, sans-serif';
          break;
        case 'tajawal':
          fontFamily = 'Tajawal, sans-serif';
          break;
        case 'ibm-sans-arabic':
          fontFamily = 'IBM Plex Sans Arabic, sans-serif';
          break;
        case 'ibm-serif-arabic':
          fontFamily = 'IBM Plex Serif, serif';
          break;
        
        // Persian Fonts
        case 'vazirmatn':
          fontFamily = 'Vazirmatn, sans-serif';
          break;
        case 'estedad':
          fontFamily = 'Estedad, sans-serif';
          break;
        
        // Calligraphic Fonts
        case 'reem-kufi':
          fontFamily = 'Reem Kufi, sans-serif';
          break;
        case 'markazi':
          fontFamily = 'Markazi Text, serif';
          break;
        
        default:
          fontFamily = 'Noto Nastaliq Urdu, serif';
      }
      
      editor.chain().focus().setFontFamily(fontFamily).run();
    }
  };

  // Handle font size changes
  const handleSizeChange = (size: string) => {
    setCurrentSize(size);
    if (editor) {
      editor.chain().focus().setFontSize(`${size}px`).run();
    }
  };

  // Handle page layout changes
  const handlePageLayoutChange = (newLayout: PageLayout) => {
    setPageLayout(newLayout);
  };

  // Handle margin guides toggle
  const handleToggleMarginGuides = () => {
    setPageLayout(prev => ({
      ...prev,
      showMarginGuides: !prev.showMarginGuides
    }));
  };

  // Handle margin changes from rulers
  const handleMarginChange = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    setPageLayout(prev => ({
      ...prev,
      margins: {
        ...prev.margins,
        [side]: value
      }
    }));
  };


  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' ? 'bg-background' : 'bg-muted/30'
    }`}>
      {/* Header */}
      <div className="border-b border-border bg-card transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg transition-colors duration-200 ${
                theme === 'dark' ? 'bg-primary/20' : 'bg-primary/10'
              }`}>
                <FileText className={`w-6 h-6 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-primary' : 'text-primary'
                }`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold font-nastaliq transition-colors duration-200 ${
                  theme === 'dark' ? 'text-foreground' : 'text-foreground'
                }`}>
                  {language === 'ur' ? 'اردو ایڈیٹر' : 'Urdu Editor'}
                </h1>
                <p className={`text-sm transition-colors duration-200 ${
                  theme === 'dark' ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}>
                  {language === 'ur' ? 'پروفیشنل اردو دستاویز ایڈیٹر' : 'Professional Urdu Document Editor'}
                </p>
              </div>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        currentFont={currentFont}
        onFontChange={handleFontChange}
        currentSize={currentSize}
        onSizeChange={handleSizeChange}
        isDarkMode={theme === 'dark'}
        onToggleDarkMode={toggleTheme}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onPageSetupClick={() => setIsPageSetupOpen(true)}
        pageLayout={pageLayout}
        onToggleMarginGuides={handleToggleMarginGuides}
      />

      {/* Layout Selector */}
      <div className="border-b border-border bg-card transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <LayoutSelector 
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
          />
        </div>
      </div>

      {/* Document Area */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          {/* New Enhanced Editor with Ruler System */}
          <EnhancedEditorWithRuler
            editor={editor}
            pageLayout={pageLayout}
            zoomLevel={zoomLevel}
            onPageCountChange={setPageCount}
            onMarginChange={handleMarginChange}
          />
        </div>
      </div>

      {/* Pagination Controls */}
      <PaginationControls 
        pageCount={pageCount} 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />

      {/* Page Setup Sidebar */}
      <PageSetupSidebar
        isOpen={isPageSetupOpen}
        onClose={() => setIsPageSetupOpen(false)}
        pageLayout={pageLayout}
        onPageLayoutChange={handlePageLayoutChange}
        isDarkMode={theme === 'dark'}
      />
    </div>
  );
};

export default UrduEditor;