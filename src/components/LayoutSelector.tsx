import React from 'react';
import { Keyboard } from 'lucide-react';
import { LayoutType, layoutNames } from '../utils/keyboardLayouts';

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ currentLayout, onLayoutChange }) => {
  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        <div className="relative flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-w-[140px]">
          <Keyboard className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2 flex-shrink-0" />
          <select
            value={currentLayout}
            onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
            className="bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 cursor-pointer flex-1 appearance-none"
          >
            {Object.entries(layoutNames).map(([key, name]) => (
              <option key={key} value={key} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                {name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">{layoutNames[currentLayout]} Active</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LayoutSelector;