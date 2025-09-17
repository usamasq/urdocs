import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from '@tiptap/extension-font-size';
import { Underline } from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { TextAlign } from '@tiptap/extension-text-align';
import { FileText, Loader2 } from 'lucide-react';
import { useUrduKeyboard } from '../hooks/useUrduKeyboard';
// useTextShaping removed - HarfBuzz UI elements cleaned up
import { LayoutType } from '../utils/keyboardLayouts';
import EditorToolbar from './EditorToolbar';
import PageSetupSidebar, { PageLayout } from './PageSetupSidebar';
import LanguageToggle from './LanguageToggle';
import EnhancedNavigationPanel from './EnhancedNavigationPanel';
import MultiPageEditor from './MultiPageEditor';
// TextShapingIndicator removed - HarfBuzz UI elements cleaned up
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSimplePagination } from '../contexts/SimplePaginationContext';
// HarfBuzzExtension removed - HarfBuzz UI elements cleaned up
import PageBreakExtension from '../extensions/PageBreakExtension';
import { DocumentNode } from '../document/schema/types';

/**
 * Main Urdu Document Editor Component
 * 
 * This is the primary component that orchestrates the entire Urdu document editing experience.
 * It provides a rich text editor with RTL support, multiple keyboard layouts, advanced typography,
 * and professional document formatting capabilities.
 * 
 * @component
 * @example
 * ```tsx
 * <UrduEditor />
 * ```
 * 
 * @returns {JSX.Element} The main editor interface with toolbar, editor area, and controls
 */

const UrduEditor: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { 
    document, 
    updateDocument, 
    updateFromTipTap, 
    getDocumentAsHtml,
    initializeWithDefaultContent 
  } = useSimplePagination();

  // Text shaping removed - HarfBuzz UI elements cleaned up

  const [currentLayout, setCurrentLayout] = useState<LayoutType>('phonetic');
  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState<boolean>(true);
  const [, setCurrentFont] = useState<string>('nastaliq');
  const [, setCurrentSize] = useState<string>('18');

  // Initialize document with default content if empty
  useEffect(() => {
    // Check if document is truly empty (no content nodes)
    const hasContent = document.content && document.content.some(node => 
      node.type === 'paragraph' && node.content && node.content.some(textNode => 
        textNode.type === 'text' && textNode.text && textNode.text.trim().length > 0
      )
    );
    
    if (!hasContent) {
      console.log('[UrduEditor] Document is empty, initializing with default content');
      initializeWithDefaultContent();
    }
  }, [document, initializeWithDefaultContent]);

  // Debug: Log document changes
  useEffect(() => {
    console.log('[UrduEditor] Document updated:', {
      hasContent: !!document.content,
      contentLength: document.content?.length || 0,
      contentTypes: document.content?.map(node => node.type) || []
    });
  }, [document]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isPageSetupOpen, setIsPageSetupOpen] = useState<boolean>(false);
  const [pageCount, setPageCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showPageBreaks, setShowPageBreaks] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [overflowInfo, setOverflowInfo] = useState<any>(null);
  // Always use professional multi-page editor
  // showShapingDetails removed - HarfBuzz UI elements cleaned up
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
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'right',
      }),
      // HarfBuzzExtension removed - HarfBuzz UI elements cleaned up
      PageBreakExtension,
    ],
    content: getDocumentAsHtml(),
    onUpdate: ({ editor }) => {
      try {
        // Update document state when editor content changes using unified method
        const editorState = editor.state;
        updateFromTipTap(editorState.doc);
        
        // Text shaping removed - HarfBuzz UI elements cleaned up
      } catch (error) {
        console.warn('Editor update error:', error);
      }
    },
    editorProps: {
      attributes: {
        class: `editor-content min-h-[400px] p-6 focus:outline-none prose prose-lg max-w-none`,
        style: `font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; text-align: right;`,
      },
    },
  });

  // Load saved preferences on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('urdocs-preferences');
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences);
      setCurrentLayout(prefs.keyboardLayout);
      setIsKeyboardEnabled(prefs.isKeyboardEnabled);
      setCurrentFont(prefs.preferredFont);
      setTheme(prefs.theme);
      setLanguage(prefs.language);
    }
    
    // Multi-page mode is now always enabled (professional mode)
    
    // Clean up old welcome screen localStorage
    localStorage.removeItem('urdocs-setup-completed');
  }, []);

  // Multi-page mode is now always enabled, no need to save preference

  // Use the Urdu keyboard hook only if enabled
  useUrduKeyboard(editor, isKeyboardEnabled ? currentLayout : null);


  /**
   * Handles font family changes in the editor
   * 
   * @param {string} font - The font key to apply
   * @example
   * handleFontChange('nastaliq') // Applies Noto Nastaliq Urdu font
   */
  const handleFontChange = useCallback((font: string) => {
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
  }, [editor]);

  /**
   * Handles font size changes in the editor
   * 
   * @param {string} size - The font size in pixels
   * @example
   * handleSizeChange('18') // Sets font size to 18px
   */
  const handleSizeChange = useCallback((size: string) => {
    setCurrentSize(size);
    if (editor) {
      editor.chain().focus().setFontSize(`${size}px`).run();
    }
  }, [editor]);

  // Handle page layout changes
  const handlePageLayoutChange = useCallback((newLayout: PageLayout) => {
    setPageLayout(newLayout);
  }, []);

  // Handle margin guides toggle
  const handleToggleMarginGuides = useCallback(() => {
    setPageLayout(prev => ({
      ...prev,
      showMarginGuides: !prev.showMarginGuides
    }));
  }, []);

  // Handle page breaks toggle
  const handleTogglePageBreaks = useCallback(() => {
    setShowPageBreaks(!showPageBreaks);
  }, [showPageBreaks]);

  // Handle fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle overflow info updates
  const handleOverflowInfoChange = useCallback((info: any) => {
    setOverflowInfo(info);
  }, []);

  // Handle margin changes from rulers (for legacy system)
  const handleMarginChange = useCallback((side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    setPageLayout(prev => ({
      ...prev,
      margins: {
        ...prev.margins,
        [side]: value
      }
    }));
  }, []);


  if (!editor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-nastaliq">
            {language === 'ur' ? 'ایڈیٹر لوڈ ہو رہا ہے...' : 'Loading editor...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' ? 'bg-background' : 'bg-muted/30'
    }`}>
      {/* Header */}
      <div className="border-b border-border bg-card transition-colors duration-200 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg transition-colors duration-200 hover-lift ${
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
            <div className="animate-slide-in-right">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-col gap-2">
          <EditorToolbar
            editor={editor}
            onFontChange={handleFontChange}
            onSizeChange={handleSizeChange}
            isDarkMode={theme === 'dark'}
            onToggleDarkMode={toggleTheme}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onPageSetupClick={() => setIsPageSetupOpen(true)}
            pageLayout={pageLayout}
            onToggleMarginGuides={handleToggleMarginGuides}
            useMultiPageEditor={true}
            onToggleEditorMode={undefined}
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
            isKeyboardEnabled={isKeyboardEnabled}
            onKeyboardToggle={setIsKeyboardEnabled}
          />
          
          {/* Text Shaping Indicator removed - HarfBuzz UI elements cleaned up */}
        </div>
      </div>

      {/* Document Area */}
      <div className="flex-1 p-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="max-w-7xl mx-auto">
          {/* Professional Multi-Page Editor */}
          <MultiPageEditor
            editor={editor}
            pageLayout={pageLayout}
            zoomLevel={zoomLevel}
            currentPage={currentPage}
            onPageCountChange={setPageCount}
            onMarginChange={handleMarginChange}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Enhanced Navigation Panel */}
      <EnhancedNavigationPanel
        pageCount={pageCount}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        overflowInfo={overflowInfo}
        isOverflowing={overflowInfo?.isOverflowing || false}
        onTogglePageBreaks={handleTogglePageBreaks}
        showPageBreaks={showPageBreaks}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
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