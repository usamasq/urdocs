import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  return (
    <div className={`flex items-center gap-2 border rounded-lg p-1 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-300'
    }`}>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
          language === 'en'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : theme === 'dark' 
              ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              : 'text-gray-700 hover:bg-gray-100'
        }`}
        title="English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ur')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 font-nastaliq ${
          language === 'ur'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : theme === 'dark' 
              ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              : 'text-gray-700 hover:bg-gray-100'
        }`}
        title="اردو"
      >
        اردو
      </button>
    </div>
  );
};

export default LanguageToggle;
