import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
  en: {
    // Toolbar
    'toolbar.bold': 'Bold',
    'toolbar.italic': 'Italic',
    'toolbar.underline': 'Underline',
    'toolbar.strikethrough': 'Strikethrough',
    'toolbar.font': 'Font',
    'toolbar.size': 'Size',
    'toolbar.color': 'Color',
    'toolbar.highlight': 'Highlight',
    'toolbar.align.left': 'Align Left',
    'toolbar.align.center': 'Align Center',
    'toolbar.align.right': 'Align Right',
    'toolbar.align.justify': 'Justify',
    'toolbar.list.bullet': 'Bullet List',
    'toolbar.list.numbered': 'Numbered List',
    'toolbar.indent.increase': 'Increase Indent',
    'toolbar.indent.decrease': 'Decrease Indent',
    'toolbar.page.setup': 'Page Setup',
    'toolbar.margin.guides': 'Margin Guides',
    'toolbar.export.pdf': 'Export PDF',
    'toolbar.export.docx': 'Export DOCX',
    'toolbar.export.svg': 'Export SVG',
    'toolbar.dark.mode': 'Dark Mode',
    
    // Page Setup
    'page.setup.title': 'Page Setup',
    'page.setup.page.size': 'Page Size',
    'page.setup.orientation': 'Orientation',
    'page.setup.margins': 'Margins',
    'page.setup.margin.guides': 'Margin Guides',
    'page.setup.unit': 'Unit',
    'page.setup.portrait': 'Portrait',
    'page.setup.landscape': 'Landscape',
    'page.setup.a4': 'A4',
    'page.setup.letter': 'Letter',
    'page.setup.custom': 'Custom',
    'page.setup.width': 'Width',
    'page.setup.height': 'Height',
    'page.setup.top': 'Top',
    'page.setup.bottom': 'Bottom',
    'page.setup.left': 'Left',
    'page.setup.right': 'Right',
    'page.setup.show': 'Show',
    'page.setup.hide': 'Hide',
    'page.setup.mm': 'mm',
    'page.setup.in': 'in',
    
    // Font Names
    'font.nastaliq': 'Noto Nastaliq Urdu',
    'font.gulzar': 'Gulzar',
    'font.jameel.noori': 'Jameel Noori Nastaleeq',
    'font.al.qalam': 'Al Qalam Taj Nastaleeq',
    'font.alvi.nastaleeq': 'Alvi Nastaleeq',
    'font.nafees.nastaleeq': 'Nafees Nastaleeq',
    'font.fajer.noori': 'Fajer Noori Nastalique',
    'font.aasar.unicode': 'Aasar Unicode',
    'font.naskh': 'Noto Naskh Arabic',
    'font.naskh.sans': 'Noto Sans Arabic',
    'font.naskh.serif': 'Noto Serif Arabic',
    'font.paktype.naskh': 'PakType Naskh Basic',
    'font.amiri': 'Amiri',
    'font.amiri.quran': 'Amiri Quran',
    'font.scheherazade': 'Scheherazade New',
    'font.scheherazade.old': 'Scheherazade',
    'font.cairo': 'Cairo',
    'font.tajawal': 'Tajawal',
    'font.ibm.sans.arabic': 'IBM Plex Sans Arabic',
    'font.ibm.serif.arabic': 'IBM Plex Serif',
    'font.changa': 'Changa',
    'font.el.messiri': 'El Messiri',
    'font.harmattan': 'Harmattan',
    'font.lalezar': 'Lalezar',
    'font.mada': 'Mada',
    'font.mirza': 'Mirza',
    'font.noto.kufi': 'Noto Kufi Arabic',
    'font.rakkas': 'Rakkas',
    'font.vazirmatn': 'Vazirmatn',
    'font.estedad': 'Estedad',
    'font.reem.kufi': 'Reem Kufi',
    'font.markazi': 'Markazi Text',
    'font.baloo.2': 'Baloo 2',
    'font.baloo.bhaijaan': 'Baloo Bhaijaan 2',
    'font.baloo.tamma': 'Baloo Tamma 2',
    'font.baloo.thambi': 'Baloo Thambi 2',
    'font.rubik': 'Rubik',
    'font.oswald': 'Oswald',
    'font.quicksand': 'Quicksand',
    'font.source.sans': 'Source Sans 3',
    'font.source.serif': 'Source Serif 4',
    'font.work.sans': 'Work Sans',
    'font.sameer.tasmeem': 'Sameer Tasmeem Bold',
    'font.sameer.rafiya': 'Sameer Rafiya Unicode',
    'font.sameer.qamri': 'Sameer Qamri',
    
    // Font Categories
    'font.category.nastaliq': 'Nasta\'liq Fonts',
    'font.category.naskh': 'Naskh Fonts',
    'font.category.traditional': 'Traditional Arabic',
    'font.category.modern': 'Modern Arabic',
    'font.category.persian': 'Persian Fonts',
    'font.category.calligraphic': 'Calligraphic',
    'font.category.baloo': 'Baloo Family',
    'font.category.modern.ui': 'Modern UI Fonts',
    'font.category.sameer': 'Sameer Family',
    
    // Common
    'common.close': 'Close',
    'common.apply': 'Apply',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.reset': 'Reset',
    'common.preview': 'Preview',
  },
  ur: {
    // Toolbar
    'toolbar.bold': 'موٹا',
    'toolbar.italic': 'ترچھا',
    'toolbar.underline': 'نیچے لکیر',
    'toolbar.strikethrough': 'درمیان لکیر',
    'toolbar.font': 'فونٹ',
    'toolbar.size': 'سائز',
    'toolbar.color': 'رنگ',
    'toolbar.highlight': 'ہائی لائٹ',
    'toolbar.align.left': 'بائیں ترتیب',
    'toolbar.align.center': 'درمیان ترتیب',
    'toolbar.align.right': 'دائیں ترتیب',
    'toolbar.align.justify': 'برابر ترتیب',
    'toolbar.list.bullet': 'بلٹ لسٹ',
    'toolbar.list.numbered': 'نمبر لسٹ',
    'toolbar.indent.increase': 'انڈینٹ بڑھائیں',
    'toolbar.indent.decrease': 'انڈینٹ کم کریں',
    'toolbar.page.setup': 'صفحہ سیٹ اپ',
    'toolbar.margin.guides': 'مارجن گائیڈز',
    'toolbar.export.pdf': 'پی ڈی ایف ایکسپورٹ',
    'toolbar.export.docx': 'ڈاکس ایکسپورٹ',
    'toolbar.export.svg': 'ایس وی جی ایکسپورٹ',
    'toolbar.dark.mode': 'ڈارک موڈ',
    
    // Page Setup
    'page.setup.title': 'صفحہ سیٹ اپ',
    'page.setup.page.size': 'صفحہ کا سائز',
    'page.setup.orientation': 'سمت',
    'page.setup.margins': 'مارجنز',
    'page.setup.columns': 'کالم',
    'page.setup.margin.guides': 'مارجن گائیڈز',
    'page.setup.unit': 'یونٹ',
    'page.setup.portrait': 'عمودی',
    'page.setup.landscape': 'افقی',
    'page.setup.a4': 'اے ۴',
    'page.setup.letter': 'لیٹر',
    'page.setup.custom': 'اپنی مرضی',
    'page.setup.width': 'چوڑائی',
    'page.setup.height': 'اونچائی',
    'page.setup.top': 'اوپر',
    'page.setup.bottom': 'نیچے',
    'page.setup.left': 'بائیں',
    'page.setup.right': 'دائیں',
    'page.setup.show': 'دکھائیں',
    'page.setup.hide': 'چھپائیں',
    'page.setup.mm': 'ملی میٹر',
    'page.setup.in': 'انچ',
    
    // Font Names (in Urdu)
    'font.nastaliq': 'نوٹو نستعلیق اردو',
    'font.gulzar': 'گلزار',
    'font.jameel.noori': 'جمیل نوری نستعلیق',
    'font.al.qalam': 'القلم تاج نستعلیق',
    'font.alvi.nastaleeq': 'الوی نستعلیق',
    'font.nafees.nastaleeq': 'نفیس نستعلیق',
    'font.fajer.noori': 'فجر نوری نستعلیق',
    'font.aasar.unicode': 'آثار یونیکوڈ',
    'font.naskh': 'نوٹو نسخ عربی',
    'font.naskh.sans': 'نوٹو سانس عربی',
    'font.naskh.serif': 'نوٹو سیرف عربی',
    'font.paktype.naskh': 'پاک ٹائپ نسخ بیسک',
    'font.amiri': 'امیری',
    'font.amiri.quran': 'امیری قرآن',
    'font.scheherazade': 'شہرزاد نیو',
    'font.scheherazade.old': 'شہرزاد',
    'font.cairo': 'قاہرہ',
    'font.tajawal': 'تجاول',
    'font.ibm.sans.arabic': 'آئی بی ایم پلیکس سانس عربی',
    'font.ibm.serif.arabic': 'آئی بی ایم پلیکس سیرف',
    'font.changa': 'چنگا',
    'font.el.messiri': 'ال مسیری',
    'font.harmattan': 'ہرماٹن',
    'font.lalezar': 'لالہ زار',
    'font.mada': 'مدا',
    'font.mirza': 'مرزا',
    'font.noto.kufi': 'نوٹو کوفی عربی',
    'font.rakkas': 'رکاس',
    'font.vazirmatn': 'وزیر متین',
    'font.estedad': 'استداد',
    'font.reem.kufi': 'ریم کوفی',
    'font.markazi': 'مرکزی ٹیکسٹ',
    'font.baloo.2': 'بالو ۲',
    'font.baloo.bhaijaan': 'بالو بھائی جان ۲',
    'font.baloo.tamma': 'بالو تمما ۲',
    'font.baloo.thambi': 'بالو تھمبی ۲',
    'font.rubik': 'روبک',
    'font.oswald': 'آسوالڈ',
    'font.quicksand': 'کوئک سینڈ',
    'font.source.sans': 'سورس سانس ۳',
    'font.source.serif': 'سورس سیرف ۴',
    'font.work.sans': 'ورک سانس',
    'font.sameer.tasmeem': 'سمیر تصمیم بولڈ',
    'font.sameer.rafiya': 'سمیر رفیہ یونیکوڈ',
    'font.sameer.qamri': 'سمیر قمری',
    
    // Font Categories
    'font.category.nastaliq': 'نستعلیق فونٹس',
    'font.category.naskh': 'نسخ فونٹس',
    'font.category.traditional': 'روایتی عربی',
    'font.category.modern': 'جدید عربی',
    'font.category.persian': 'فارسی فونٹس',
    'font.category.calligraphic': 'خطاطی',
    'font.category.baloo': 'بالو فیملی',
    'font.category.modern.ui': 'جدید یو آئی فونٹس',
    'font.category.sameer': 'سمیر فیملی',
    
    // Common
    'common.close': 'بند کریں',
    'common.apply': 'لاگو کریں',
    'common.cancel': 'منسوخ',
    'common.save': 'محفوظ',
    'common.reset': 'ری سیٹ',
    'common.preview': 'پیش منظر',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ur'); // Default to Urdu

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
