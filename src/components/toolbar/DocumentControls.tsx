import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Undo,
  Redo,
  Settings,
  Ruler,
  FileText,
  Printer,
  Layers,
  Zap,
  Minus,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageLayout } from '../../types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DocumentControlsProps {
  editor: Editor;
  onPageSetupClick: () => void;
  pageLayout?: PageLayout;
  onToggleMarginGuides?: () => void;
  // Professional mode is now always enabled
  onPrint: () => void;
}

const DocumentControls: React.FC<DocumentControlsProps> = ({
  editor,
  onPageSetupClick,
  pageLayout,
  onToggleMarginGuides,
  // Professional mode is now always enabled
  onPrint,
}) => {
  const { language, t } = useLanguage();
  const [, forceUpdate] = useState({});


  if (!editor) return null;

  // Force re-render when editor state changes
  useEffect(() => {
    const updateState = () => {
      forceUpdate({});
    };

    editor.on('update', updateState);
    editor.on('selectionUpdate', updateState);
    editor.on('transaction', updateState);

    return () => {
      editor.off('update', updateState);
      editor.off('selectionUpdate', updateState);
      editor.off('transaction', updateState);
    };
  }, [editor]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Undo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'واپس (Ctrl+Z)' : 'Undo (Ctrl+Z)'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'دوبارہ (Ctrl+Y)' : 'Redo (Ctrl+Y)'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPageSetupClick}
              className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('toolbar.page.setup')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Page Break Button - FIXED: Add manual page break functionality */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Insert a manual page break at the current cursor position
                editor.chain().focus().insertContent({
                  type: 'pageBreak',
                  attrs: {
                    pageNumber: 1,
                    isManual: true,
                    breakType: 'page'
                  }
                }).run();
              }}
              className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
            >
              <Minus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'صفحہ توڑ (Ctrl+Enter)' : 'Page Break (Ctrl+Enter)'}</p>
          </TooltipContent>
        </Tooltip>
      
        {onToggleMarginGuides && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={pageLayout?.showMarginGuides ? "default" : "ghost"}
                size="sm"
                onClick={onToggleMarginGuides}
                className="h-8 w-8 p-0 transition-all duration-200"
                aria-pressed={pageLayout?.showMarginGuides}
              >
                <Ruler className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('toolbar.margin.guides')}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Editor mode toggle removed - always using professional multi-page mode */}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrint}
              className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Print (Ctrl+P)</p>
          </TooltipContent>
        </Tooltip>

        {/* Professional Layout Toggle removed - always using professional mode */}
      </div>
    </TooltipProvider>
  );
};

export default DocumentControls;
