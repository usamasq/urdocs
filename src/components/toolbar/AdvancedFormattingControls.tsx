import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Type,
  Palette,
  AlignJustify,
  Indent,
  Outdent,
  Link,
  Image,
  Table,
  Minus,
  Plus,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface AdvancedFormattingControlsProps {
  editor: Editor;
}

const AdvancedFormattingControls: React.FC<AdvancedFormattingControlsProps> = ({ editor }) => {
  const { language } = useLanguage();
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

  // Get current text color
  const currentColor = editor.getAttributes('textStyle').color || '#000000';

  // Handle text color change
  const handleColorChange = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  // Handle heading level change
  const handleHeadingChange = (level: string) => {
    if (level === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: parseInt(level) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    }
  };

  // Get current heading level
  const currentHeading = editor.isActive('heading') 
    ? editor.getAttributes('heading').level 
    : 'paragraph';

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Heading Level */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select value={currentHeading.toString()} onValueChange={handleHeadingChange}>
                <SelectTrigger className="w-32 h-8 transition-all duration-200 hover:border-primary/50 focus:border-primary">
                  <SelectValue placeholder="Heading" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraph">
                    {language === 'ur' ? 'پیراگراف' : 'Paragraph'}
                  </SelectItem>
                  <SelectItem value="1">H1</SelectItem>
                  <SelectItem value="2">H2</SelectItem>
                  <SelectItem value="3">H3</SelectItem>
                  <SelectItem value="4">H4</SelectItem>
                  <SelectItem value="5">H5</SelectItem>
                  <SelectItem value="6">H6</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'ہیڈنگ لیول' : 'Heading Level'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Text Color */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 p-0 border-0 cursor-pointer"
                title={language === 'ur' ? 'ٹیکسٹ کا رنگ' : 'Text Color'}
              />
              <Palette className="w-4 h-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'ٹیکسٹ کا رنگ' : 'Text Color'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Indent */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              disabled={!editor.can().sinkListItem('listItem')}
            >
              <Indent className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'انڈینٹ بڑھائیں' : 'Increase Indent'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Outdent */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().liftListItem('listItem').run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              disabled={!editor.can().liftListItem('listItem')}
            >
              <Outdent className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'انڈینٹ کم کریں' : 'Decrease Indent'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Horizontal Rule */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'افقی لکیر' : 'Horizontal Rule'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('link') ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                const url = window.prompt(language === 'ur' ? 'لنک کا یو آر ایل درج کریں' : 'Enter URL');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('link')}
            >
              <Link className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'لنک شامل کریں' : 'Add Link'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Image */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = window.prompt(language === 'ur' ? 'تصویر کا یو آر ایل درج کریں' : 'Enter Image URL');
                if (url) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              }}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Image className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'تصویر شامل کریں' : 'Add Image'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Table */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor.isActive('table') ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-pressed={editor.isActive('table')}
            >
              <Table className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'ٹیبل شامل کریں' : 'Add Table'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default AdvancedFormattingControls;
