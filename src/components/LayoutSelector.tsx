import React from 'react';
import { ChevronDown, Keyboard } from 'lucide-react';
import { LayoutType, layoutNames } from '../utils/keyboardLayouts';

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ currentLayout, onLayoutChange }) => {
  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <Keyboard className="w-4 h-4 text-gray-500" />
          <select
            value={currentLayout}
            onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
            className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer pr-6"
          >
            {Object.entries(layoutNames).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        
        <div className="text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {layoutNames[currentLayout]} Active
          </span>
        </div>
      </div>
    </div>
  );
};

export default LayoutSelector;