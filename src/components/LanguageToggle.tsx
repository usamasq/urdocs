import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card transition-colors duration-200">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={language === 'en' ? "default" : "ghost"}
              size="sm"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                language === 'en'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              EN
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>English</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={language === 'ur' ? "default" : "ghost"}
              size="sm"
              onClick={() => setLanguage('ur')}
              className={`px-3 py-1.5 text-sm font-medium font-nastaliq transition-all duration-200 ${
                language === 'ur'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              اردو
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>اردو</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default LanguageToggle;
