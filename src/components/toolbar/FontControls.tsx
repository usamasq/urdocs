import React, { useState, useEffect, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FONT_FAMILY_MAP, FONT_SIZES } from '../../constants';
import { FontOption, SizeOption } from '../../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FontControlsProps {
  editor: Editor;
  onFontChange: (font: string) => void;
  onSizeChange: (size: string) => void;
}

const FontControls: React.FC<FontControlsProps> = ({
  editor,
  onFontChange,
  onSizeChange,
}) => {
  const { language, t } = useLanguage();
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

  // Get current font and size from editor state
  const currentFont = editor.getAttributes('textStyle').fontFamily || 'Noto Nastaliq Urdu, serif';
  const currentSize = editor.getAttributes('textStyle').fontSize || '18px';

  // Memoize font options to prevent recreation on every render
  const fontOptions = useMemo((): FontOption[] => [
    // Urdu Nasta'liq Fonts
    { value: 'nastaliq', label: 'Noto Nastaliq Urdu', urduName: 'نوٹو نستعلیق اردو', preview: 'نستعلیق', category: t('font.category.nastaliq') },
    { value: 'gulzar', label: 'Gulzar', urduName: 'گلزار', preview: 'گلزار', category: t('font.category.nastaliq') },
    { value: 'jameel-noori', label: 'Jameel Noori Nastaleeq', urduName: 'جمیل نوری نستعلیق', preview: 'جمیل نوری', category: t('font.category.nastaliq') },
    { value: 'al-qalam', label: 'Al Qalam Taj Nastaleeq', urduName: 'القلم تاج نستعلیق', preview: 'القلم', category: t('font.category.nastaliq') },
    { value: 'alvi-nastaleeq', label: 'Alvi Nastaleeq', urduName: 'علوی نستعلیق', preview: 'الوی', category: t('font.category.nastaliq') },
    { value: 'nafees-nastaleeq', label: 'Nafees Nastaleeq', urduName: 'نفیس نستعلیق', preview: 'نفیس', category: t('font.category.nastaliq') },
    { value: 'fajer-noori', label: 'Fajer Noori Nastalique', urduName: 'فجر نوری نستعلیق', preview: 'فجر نوری', category: t('font.category.nastaliq') },
    { value: 'aasar-unicode', label: 'Aasar Unicode', urduName: 'آثار یونیکوڈ', preview: 'آثار', category: t('font.category.nastaliq') },
    
    // Arabic Naskh Fonts
    { value: 'naskh', label: 'Noto Naskh Arabic', urduName: 'نوٹو نسخ عربی', preview: 'نسخ', category: t('font.category.naskh') },
    { value: 'naskh-sans', label: 'Noto Sans Arabic', urduName: 'نوٹو سانس عربی', preview: 'نسخ سانز', category: t('font.category.naskh') },
    { value: 'naskh-serif', label: 'Noto Serif Arabic', urduName: 'نوٹو سریف عربی', preview: 'نسخ سریف', category: t('font.category.naskh') },
    { value: 'paktype-naskh', label: 'PakType Naskh Basic', urduName: 'پاک ٹائپ نسخ بیسک', preview: 'پاک ٹائپ', category: t('font.category.naskh') },
    
    // Traditional Arabic Fonts
    { value: 'amiri', label: 'Amiri', urduName: 'امیری', preview: 'امیری', category: t('font.category.traditional') },
    { value: 'amiri-quran', label: 'Amiri Quran', urduName: 'امیری قرآن', preview: 'امیری قرآن', category: t('font.category.traditional') },
    { value: 'scheherazade', label: 'Scheherazade New', urduName: 'شہرزاد نیو', preview: 'شہرزاد', category: t('font.category.traditional') },
    { value: 'scheherazade-old', label: 'Scheherazade', urduName: 'شہرزاد', preview: 'شہرزاد قدیم', category: t('font.category.traditional') },
    
    // Modern Arabic Fonts
    { value: 'cairo', label: 'Cairo', urduName: 'قاہرہ', preview: 'قاہرہ', category: t('font.category.modern') },
    { value: 'tajawal', label: 'Tajawal', urduName: 'تجوال', preview: 'تجوال', category: t('font.category.modern') },
    { value: 'ibm-sans-arabic', label: 'IBM Plex Sans Arabic', urduName: 'آئی بی ایم پلیکس سانس عربی', preview: 'آئی بی ایم', category: t('font.category.modern') },
    { value: 'ibm-serif-arabic', label: 'IBM Plex Serif', urduName: 'آئی بی ایم پلیکس سریف', preview: 'آئی بی ایم سریف', category: t('font.category.modern') },
    { value: 'changa', label: 'Changa', urduName: 'چنگا', preview: 'چنگا', category: t('font.category.modern') },
    { value: 'el-messiri', label: 'El Messiri', urduName: 'ال مسیری', preview: 'ال مسیری', category: t('font.category.modern') },
    { value: 'harmattan', label: 'Harmattan', urduName: 'ہرماٹن', preview: 'ہرماٹن', category: t('font.category.modern') },
    { value: 'lalezar', label: 'Lalezar', urduName: 'لالہ زار', preview: 'لالہ زار', category: t('font.category.modern') },
    { value: 'mada', label: 'Mada', urduName: 'مدا', preview: 'مدا', category: t('font.category.modern') },
    { value: 'mirza', label: 'Mirza', urduName: 'مرزا', preview: 'مرزا', category: t('font.category.modern') },
    { value: 'noto-kufi', label: 'Noto Kufi Arabic', urduName: 'نوٹو کوفی عربی', preview: 'نوٹو کوفی', category: t('font.category.modern') },
    { value: 'rakkas', label: 'Rakkas', urduName: 'رکاس', preview: 'رکاس', category: t('font.category.modern') },
    
    // Persian Fonts
    { value: 'vazirmatn', label: 'Vazirmatn', urduName: 'وزیرمتن', preview: 'وزیرمتن', category: t('font.category.persian') },
    { value: 'estedad', label: 'Estedad', urduName: 'استداد', preview: 'استداد', category: t('font.category.persian') },
    
    // Calligraphic Fonts
    { value: 'reem-kufi', label: 'Reem Kufi', urduName: 'ریم کوفی', preview: 'ریم کوفی', category: t('font.category.calligraphic') },
    { value: 'markazi', label: 'Markazi Text', urduName: 'مرکزی ٹیکسٹ', preview: 'مرکزی', category: t('font.category.calligraphic') },
    
    // Baloo Font Family
    { value: 'baloo-2', label: 'Baloo 2', urduName: 'بالو 2', preview: 'بالو ۲', category: t('font.category.baloo') },
    { value: 'baloo-bhaijaan', label: 'Baloo Bhaijaan 2', urduName: 'بالو بھائی جان 2', preview: 'بالو بھائی جان', category: t('font.category.baloo') },
    { value: 'baloo-tamma', label: 'Baloo Tamma 2', urduName: 'بالو تمما 2', preview: 'بالو تمما', category: t('font.category.baloo') },
    { value: 'baloo-thambi', label: 'Baloo Thambi 2', urduName: 'بالو تھمبی 2', preview: 'بالو تھمبی', category: t('font.category.baloo') },
    
    // Modern UI Fonts
    { value: 'rubik', label: 'Rubik', urduName: 'روبک', preview: 'روبک', category: t('font.category.modern.ui') },
    { value: 'oswald', label: 'Oswald', urduName: 'آسوالڈ', preview: 'آسوالڈ', category: t('font.category.modern.ui') },
    { value: 'quicksand', label: 'Quicksand', urduName: 'کوئک سینڈ', preview: 'کوئک سینڈ', category: t('font.category.modern.ui') },
    { value: 'source-sans', label: 'Source Sans 3', urduName: 'سورس سانس 3', preview: 'سورس سانس', category: t('font.category.modern.ui') },
    { value: 'source-serif', label: 'Source Serif 4', urduName: 'سورس سریف 4', preview: 'سورس سیرف', category: t('font.category.modern.ui') },
    { value: 'work-sans', label: 'Work Sans', urduName: 'ورک سانس', preview: 'ورک سانس', category: t('font.category.modern.ui') },
    
    // Sameer Font Family
    { value: 'sameer-tasmeem', label: 'Sameer Tasmeem Bold', urduName: 'سمیر تصمیم بولڈ', preview: 'سمیر تصمیم', category: t('font.category.sameer') },
    { value: 'sameer-rafiya', label: 'Sameer Rafiya Unicode', urduName: 'سمیر رفیہ یونیکوڈ', preview: 'سمیر رفیہ', category: t('font.category.sameer') },
    { value: 'sameer-qamri', label: 'Sameer Qamri', urduName: 'سمیر قمری', preview: 'سمیر قمری', category: t('font.category.sameer') },
  ], [t]);

  // Memoize size options
  const sizeOptions = useMemo((): SizeOption[] => FONT_SIZES, []);

  // Function to get font family CSS value from font key
  const getFontFamily = (fontKey: string): string => {
    return FONT_FAMILY_MAP[fontKey as keyof typeof FONT_FAMILY_MAP] || 'Noto Nastaliq Urdu, serif';
  };

  // Function to get font key from font family CSS value
  const getFontKeyFromFamily = (fontFamily: string): string => {
    const entry = Object.entries(FONT_FAMILY_MAP).find(([_, value]) => value === fontFamily);
    return entry ? entry[0] : 'nastaliq';
  };

  return (
    <TooltipProvider>
      {/* Font Family */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Select value={getFontKeyFromFamily(currentFont)} onValueChange={onFontChange}>
              <SelectTrigger className="w-[200px] h-8 transition-all duration-200 hover:border-primary/50 focus:border-primary">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: getFontFamily(font.value) }}>
                        {font.preview}
                      </span>
                      <span className="text-sm">{font.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('toolbar.font')}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              type="number"
              value={parseInt(currentSize.replace('px', ''))}
              onChange={(e) => {
                const value = e.target.value;
                if (value && parseInt(value) >= 1 && parseInt(value) <= 200) {
                  onSizeChange(value);
                }
              }}
              placeholder={language === 'ur' ? 'سائز' : 'Size'}
              className="w-20 h-8 transition-all duration-200 hover:border-primary/50 focus:border-primary"
              min="1"
              max="200"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ur' ? 'فونٹ سائز درج کریں (1-200px)' : 'Enter font size (1-200px)'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default FontControls;
