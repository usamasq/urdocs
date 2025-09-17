import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Superscript,
  Subscript,
  Code,
  Highlighter,
  Quote,
  List,
  ListOrdered,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FormattingControlsProps {
  editor: Editor;
}

const FormattingControls: React.FC<FormattingControlsProps> = ({ editor }) => {
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
              variant={editor.isActive('bold') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('bold')}
            >
              <Bold className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'موٹا (Ctrl+B)' : 'Bold (Ctrl+B)'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('italic') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('italic')}
            >
              <Italic className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'ترچھا (Ctrl+I)' : 'Italic (Ctrl+I)'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('underline') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('underline')}
            >
              <Underline className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'نیچے لکیر (Ctrl+U)' : 'Underline (Ctrl+U)'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('strike') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('strike')}
            >
              <Strikethrough className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('toolbar.strikethrough')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Superscript */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('superscript') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('superscript')}
            >
              <Superscript className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'اوپر کی لکیر (Superscript)' : 'Superscript'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Subscript */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('subscript') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('subscript')}
            >
              <Subscript className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'نیچے کی لکیر (Subscript)' : 'Subscript'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Code */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('code') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('code')}
            >
              <Code className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'کوڈ (Code)' : 'Code'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Highlight */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('highlight') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('highlight')}
            >
              <Highlighter className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'ہائی لائٹ (Highlight)' : 'Highlight'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Blockquote */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('blockquote') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('blockquote')}
            >
              <Quote className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'اقتباس (Quote)' : 'Quote'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Bullet List */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('bulletList') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('bulletList')}
            >
              <List className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'بلٹ لسٹ (Bullet List)' : 'Bullet List'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Ordered List */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('orderedList') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('orderedList')}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'نمبر والی لسٹ (Numbered List)' : 'Numbered List'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default FormattingControls;
