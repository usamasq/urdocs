import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  RotateCcw, 
  RotateCw, 
  Ruler,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { mmToInches, inchesToMm, formatDimension, validateMargin } from '../utils/dimensionUtils';

export interface PageLayout {
  pageSize: 'A4' | 'Letter' | 'Custom';
  customWidth: number;
  customHeight: number;
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  showMarginGuides: boolean;
}

interface PageSetupSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pageLayout: PageLayout;
  onPageLayoutChange: (layout: PageLayout) => void;
  isDarkMode: boolean;
}

type Unit = 'mm' | 'in';

const PageSetupSidebar: React.FC<PageSetupSidebarProps> = ({
  isOpen,
  onClose,
  pageLayout,
  onPageLayoutChange,
  isDarkMode,
}) => {
  const { language, t } = useLanguage();
  const [localLayout, setLocalLayout] = useState<PageLayout>(pageLayout);
  const [unit, setUnit] = useState<Unit>('mm');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['pageSize', 'orientation', 'margins', 'guides']));

  // Sync local state with prop changes
  useEffect(() => {
    setLocalLayout(pageLayout);
  }, [pageLayout]);

  const handleLayoutChange = (updates: Partial<PageLayout>) => {
    const newLayout = { ...localLayout, ...updates };
    setLocalLayout(newLayout);
    onPageLayoutChange(newLayout);
  };

  const handleMarginChange = (side: keyof PageLayout['margins'], value: number) => {
    // Validate margin values using centralized utility
    const clampedValue = validateMargin(value, unit);
    
    const newMargins = { ...localLayout.margins, [side]: clampedValue };
    handleLayoutChange({ margins: newMargins });
  };

  // Unit conversion utilities using centralized functions
  const convertValue = (value: number, fromUnit: Unit, toUnit: Unit) => {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'mm' && toUnit === 'in') return mmToInches(value);
    if (fromUnit === 'in' && toUnit === 'mm') return inchesToMm(value);
    return value;
  };

  const formatValue = (value: number, unit: Unit) => {
    return formatDimension(value, unit);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const pageSizeOptions = [
    { 
      value: 'A4', 
      label: unit === 'mm' ? 'A4 (210 × 297 mm)' : 'A4 (8.27 × 11.69 in)', 
      width: unit === 'mm' ? 210 : 8.27, 
      height: unit === 'mm' ? 297 : 11.69 
    },
    { 
      value: 'Letter', 
      label: unit === 'mm' ? 'Letter (216 × 279 mm)' : 'Letter (8.5 × 11 in)', 
      width: unit === 'mm' ? 216 : 8.5, 
      height: unit === 'mm' ? 279 : 11 
    },
    { value: 'Custom', label: 'Custom Size', width: 0, height: 0 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`absolute right-0 top-0 h-full w-96 max-w-[90vw] transform transition-transform duration-200 flex flex-col ${
        isDarkMode ? 'bg-gray-800 border-l border-gray-700' : 'bg-white border-l border-gray-200'
      } shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Settings className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            <h2 className={`text-lg font-semibold font-nastaliq ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('page.setup.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Toggle */}
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('page.setup.unit')}
            </span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <button
                onClick={() => setUnit('mm')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors duration-150 ${
                  unit === 'mm'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                mm
              </button>
              <button
                onClick={() => setUnit('in')}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors duration-150 ${
                  unit === 'in'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                in
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Page Size Section */}
          <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => toggleSection('pageSize')}
              className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className="font-medium">{t('page.setup.page.size')}</span>
              </div>
              {expandedSections.has('pageSize') ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.has('pageSize') && (
              <div className="px-4 pb-4 space-y-3">
                <div className="space-y-2">
                  {pageSizeOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <input
                        type="radio"
                        name="pageSize"
                        value={option.value}
                        checked={localLayout.pageSize === option.value}
                        onChange={(e) => {
                          const newSize = e.target.value as PageLayout['pageSize'];
                          handleLayoutChange({ 
                            pageSize: newSize,
                            customWidth: option.width,
                            customHeight: option.height
                          });
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
                
                {/* Custom Size Inputs */}
                {localLayout.pageSize === 'Custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Width ({unit})
                      </label>
                      <input
                        type="number"
                        value={formatValue(convertValue(localLayout.customWidth, 'mm', unit), unit)}
                        onChange={(e) => {
                          const value = convertValue(Number(e.target.value), unit, 'mm');
                          handleLayoutChange({ customWidth: value });
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        min={unit === 'mm' ? "50" : "2"}
                        max={unit === 'mm' ? "500" : "20"}
                        step={unit === 'in' ? "0.1" : "1"}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Height ({unit})
                      </label>
                      <input
                        type="number"
                        value={formatValue(convertValue(localLayout.customHeight, 'mm', unit), unit)}
                        onChange={(e) => {
                          const value = convertValue(Number(e.target.value), unit, 'mm');
                          handleLayoutChange({ customHeight: value });
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        min={unit === 'mm' ? "50" : "2"}
                        max={unit === 'mm' ? "800" : "32"}
                        step={unit === 'in' ? "0.1" : "1"}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Orientation Section */}
          <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => toggleSection('orientation')}
              className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {localLayout.orientation === 'portrait' ? (
                  <RotateCcw className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                ) : (
                  <RotateCw className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
                <span className="font-medium">Orientation</span>
              </div>
              {expandedSections.has('orientation') ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.has('orientation') && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleLayoutChange({ orientation: 'portrait' })}
                    className={`p-4 rounded-lg border-2 transition-all duration-150 ${
                      localLayout.orientation === 'portrait'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300'
                        : `border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-10 mx-auto mb-2 border-2 border-current rounded-sm"></div>
                      <span className="text-sm font-medium">Portrait</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleLayoutChange({ orientation: 'landscape' })}
                    className={`p-4 rounded-lg border-2 transition-all duration-150 ${
                      localLayout.orientation === 'landscape'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300'
                        : `border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-10 h-8 mx-auto mb-2 border-2 border-current rounded-sm"></div>
                      <span className="text-sm font-medium">Landscape</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Margins Section */}
          <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => toggleSection('margins')}
              className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ruler className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className="font-medium">Margins</span>
              </div>
              {expandedSections.has('margins') ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.has('margins') && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Top ({unit})
                    </label>
                    <input
                      type="number"
                      value={formatValue(convertValue(localLayout.margins.top, 'mm', unit), unit)}
                      onChange={(e) => {
                        const value = convertValue(Number(e.target.value), unit, 'mm');
                        handleMarginChange('top', value);
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      min="0"
                      max={unit === 'mm' ? "50" : "2"}
                      step={unit === 'in' ? "0.1" : "1"}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Bottom ({unit})
                    </label>
                    <input
                      type="number"
                      value={formatValue(convertValue(localLayout.margins.bottom, 'mm', unit), unit)}
                      onChange={(e) => {
                        const value = convertValue(Number(e.target.value), unit, 'mm');
                        handleMarginChange('bottom', value);
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      min="0"
                      max={unit === 'mm' ? "50" : "2"}
                      step={unit === 'in' ? "0.1" : "1"}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {language === 'ur' ? `دائیں کنارہ (${unit})` : `Right Edge (${unit})`}
                    </label>
                    <input
                      type="number"
                      value={formatValue(convertValue(localLayout.margins.left, 'mm', unit), unit)}
                      onChange={(e) => {
                        const value = convertValue(Number(e.target.value), unit, 'mm');
                        handleMarginChange('left', value);
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      min="0"
                      max={unit === 'mm' ? "50" : "2"}
                      step={unit === 'in' ? "0.1" : "1"}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {language === 'ur' ? 'متن کے دائیں کنارے سے فاصلہ' : 'Distance from right edge of text'}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {language === 'ur' ? `بائیں کنارہ (${unit})` : `Left Edge (${unit})`}
                    </label>
                    <input
                      type="number"
                      value={formatValue(convertValue(localLayout.margins.right, 'mm', unit), unit)}
                      onChange={(e) => {
                        const value = convertValue(Number(e.target.value), unit, 'mm');
                        handleMarginChange('right', value);
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      min="0"
                      max={unit === 'mm' ? "50" : "2"}
                      step={unit === 'in' ? "0.1" : "1"}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {language === 'ur' ? 'متن کے بائیں کنارے سے فاصلہ' : 'Distance from left edge of text'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Margin Guides Section */}
          <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => toggleSection('guides')}
              className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ruler className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className="font-medium">Margin Guides</span>
              </div>
              {expandedSections.has('guides') ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections.has('guides') && (
              <div className="px-4 pb-4">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <input
                    type="checkbox"
                    checked={localLayout.showMarginGuides}
                    onChange={(e) => handleLayoutChange({ showMarginGuides: e.target.checked })}
                    className="text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Show margin guides
                  </span>
                </label>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Display subtle lines showing page margins for better layout reference
                </p>
              </div>
            )}
          </div>

          {/* Bottom padding to ensure last section is fully visible */}
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
};

export default PageSetupSidebar;
