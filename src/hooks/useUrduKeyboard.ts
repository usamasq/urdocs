import { useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { layouts, LayoutType } from '../utils/keyboardLayouts';

export const useUrduKeyboard = (editor: Editor | null, layout: LayoutType) => {
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is holding Ctrl, Alt, or Cmd (for shortcuts)
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      // Don't intercept special keys
      if (event.key.length > 1 && event.key !== ' ') {
        return;
      }

      const currentLayout = layouts[layout];
      const urduChar = currentLayout[event.key];

      if (urduChar) {
        event.preventDefault();
        
        // Insert the Urdu character at the current cursor position
        editor.chain().focus().insertContent(urduChar).run();
      }
    };

    // Get the editor's DOM element
    const editorElement = editor.view.dom;
    
    // Add event listener to the editor element
    editorElement.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, layout]);
};