import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  AlignRight,
  AlignLeft,
  AlignCenter,
  AlignJustify,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AlignmentControlsProps {
  editor: Editor;
}

const AlignmentControls: React.FC<AlignmentControlsProps> = ({ editor }) => {
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
              variant={editor.isActive({ textAlign: 'left' }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive({ textAlign: 'left' })}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('toolbar.align.left')}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive({ textAlign: 'center' }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive({ textAlign: 'center' })}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('toolbar.align.center')}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive({ textAlign: 'right' }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive({ textAlign: 'right' })}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'دائیں ترتیب (اردو کے لیے ڈیفالٹ)' : 'Align Right (Default for Urdu)'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive({ textAlign: 'justify' }) ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive({ textAlign: 'justify' })}
            >
              <AlignJustify className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'برابر ترتیب' : 'Justify'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default AlignmentControls;
