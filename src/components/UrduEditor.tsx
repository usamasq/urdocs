import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { FileText } from 'lucide-react';
import { useUrduKeyboard } from '../hooks/useUrduKeyboard';
import { LayoutType } from '../utils/keyboardLayouts';
import LayoutSelector from './LayoutSelector';
import EditorToolbar from './EditorToolbar';

const UrduEditor: React.FC = () => {
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('phonetic');
  const [currentFont, setCurrentFont] = useState<string>('nastaliq');
  const [currentSize, setCurrentSize] = useState<string>('18');

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: `
      <p>اردو میں خوش آمدید</p>
      <p>یہ ایک جدید اردو ایڈیٹر ہے جو نستعلیق فونٹ میں تحریر کی سہولت فراہم کرتا ہے۔</p>
      <p>آپ یہاں اردو میں تحریر کر سکتے ہیں۔</p>
      <p><strong>مختلف کی بورڈ لے آؤٹ</strong> استعمال کریں: <em>Phonetic</em>، <u>InPage</u>، یا CRULP</p>
      <p>اب آپ <strong>موٹے</strong>، <em>ترچھے</em>، اور <u>خط کشیدہ</u> متن لکھ سکتے ہیں!</p>
    `,
    editorProps: {
      attributes: {
        class: `editor-content font-${currentFont} min-h-[400px] p-6 focus:outline-none prose prose-lg max-w-none`,
        style: `font-size: ${currentSize}px;`,
      },
    },
  });

  // Use the Urdu keyboard hook
  useUrduKeyboard(editor, currentLayout);

  // Update editor font and size when changed
  React.useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      editorElement.className = `editor-content font-${currentFont} min-h-[400px] p-6 focus:outline-none prose prose-lg max-w-none`;
      editorElement.style.fontSize = `${currentSize}px`;
    }
  }, [editor, currentFont, currentSize]);
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">اردو ایڈیٹر</h1>
            <p className="text-gray-600 mt-1">Modern Urdu Document Editor</p>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 rounded-full"></div>
      </div>

      {/* Layout Selector */}
      <LayoutSelector 
        currentLayout={currentLayout}
        onLayoutChange={setCurrentLayout}
      />

      {/* Editor Container */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <EditorToolbar
          editor={editor}
          currentFont={currentFont}
          onFontChange={setCurrentFont}
          currentSize={currentSize}
          onSizeChange={setCurrentSize}
        />

        {/* Editor */}
        <div className="bg-white min-h-[500px]">
          <EditorContent 
            editor={editor} 
            className="h-full"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Multiple Urdu fonts available • Text formatting enabled • Keyboard layouts available
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            RTL Support
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Font Switching
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Text Formatting
          </span>
        </div>
      </div>
    </div>
  );
};

export default UrduEditor;