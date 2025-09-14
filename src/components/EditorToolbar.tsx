import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Type, 
  Palette,
  AlignRight,
  AlignLeft,
  AlignCenter
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  currentFont: string;
  onFontChange: (font: string) => void;
  currentSize: string;
  onSizeChange: (size: string) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  currentFont,
  onFontChange,
  currentSize,
  onSizeChange,
}) => {
  if (!editor) return null;

  const fontOptions = [
    { value: 'nastaliq', label: 'Noto Nastaliq Urdu', preview: 'نستعلیق' },
    { value: 'naskh', label: 'Noto Naskh Arabic', preview: 'نسخ' },
    { value: 'amiri', label: 'Amiri', preview: 'امیری' },
    { value: 'scheherazade', label: 'Scheherazade New', preview: 'شہرزاد' },
  ];

  const sizeOptions = [
    { value: '14', label: '14px' },
    { value: '16', label: '16px' },
    { value: '18', label: '18px' },
    { value: '20', label: '20px' },
    { value: '24', label: '24px' },
    { value: '28', label: '28px' },
    { value: '32', label: '32px' },
    { value: '36', label: '36px' },
  ];

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-md transition-colors ${
              editor.isActive('bold')
                ? 'bg-blue-100 text-blue-600 border border-blue-200'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-md transition-colors ${
              editor.isActive('italic')
                ? 'bg-blue-100 text-blue-600 border border-blue-200'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded-md transition-colors ${
              editor.isActive('underline')
                ? 'bg-blue-100 text-blue-600 border border-blue-200'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Font Selection */}
        <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
          <Type className="w-4 h-4 text-gray-500" />
          <select
            value={currentFont}
            onChange={(e) => onFontChange(e.target.value)}
            className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
          >
            {fontOptions.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label} ({font.preview})
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
          <Palette className="w-4 h-4 text-gray-500" />
          <select
            value={currentSize}
            onChange={(e) => onSizeChange(e.target.value)}
            className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sizeOptions.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded-md transition-colors ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-blue-100 text-blue-600 border border-blue-200'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded-md transition-colors ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-blue-100 text-blue-600 border border-blue-200'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded-md transition-colors ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-blue-100 text-blue-600 border border-blue-200'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;