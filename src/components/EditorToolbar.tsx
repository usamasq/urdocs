import React from 'react';
import { EditorToolbarProps } from '../types';
import ToolbarContainer from './toolbar/ToolbarContainer';

const EditorToolbar: React.FC<EditorToolbarProps> = (props) => {
  return <ToolbarContainer {...props} />;
};

export default EditorToolbar;
