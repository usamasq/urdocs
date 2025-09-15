import React, { useState } from 'react';
import { Keyboard, Check, Eye, EyeOff, Settings } from 'lucide-react';
import { LayoutType, layoutNames, layouts } from '../../utils/keyboardLayouts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '../../contexts/LanguageContext';

interface EnhancedKeyboardLayoutToggleProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  isKeyboardEnabled: boolean;
  onKeyboardToggle: (enabled: boolean) => void;
}

const layoutDescriptions = {
  phonetic: 'Type Urdu phonetically using English letters (e.g., "salam" → "سلام")',
  inpage: 'Traditional InPage keyboard layout used in Pakistan',
  crulp: 'CRULP research-based layout for academic writing',
};

const EnhancedKeyboardLayoutToggle: React.FC<EnhancedKeyboardLayoutToggleProps> = ({
  currentLayout,
  onLayoutChange,
  isKeyboardEnabled,
  onKeyboardToggle,
}) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showKeymap, setShowKeymap] = useState(false);

  const KeymapViewer = () => {
    const currentLayoutMap = layouts[currentLayout];
    const layoutEntries = Object.entries(currentLayoutMap);
    
    // Group by keyboard rows for better visualization
    const rows = {
      numbers: layoutEntries.filter(([key]) => /[0-9`~!@#$%^&*()_+=\-\[\]\\|;':",./<>?]/.test(key)),
      qwerty: layoutEntries.filter(([key]) => /[qwertyuiop\[\]\\]/.test(key)),
      asdf: layoutEntries.filter(([key]) => /[asdfghjkl;'"]/.test(key)),
      zxcv: layoutEntries.filter(([key]) => /[zxcvbnm,./]/.test(key)),
      space: layoutEntries.filter(([key]) => key === ' '),
    };

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">{layoutNames[currentLayout]} Layout</h3>
          <p className="text-sm text-muted-foreground">
            {layoutDescriptions[currentLayout]}
          </p>
        </div>
        
        {/* Numbers Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Numbers & Symbols</h4>
          <div className="grid grid-cols-10 gap-1">
            {rows.numbers.slice(0, 20).map(([key, urdu]) => (
              <div key={key} className="text-center p-2 border rounded bg-muted/50">
                <div className="text-xs text-muted-foreground">{key}</div>
                <div className="text-lg font-nastaliq">{urdu}</div>
              </div>
            ))}
          </div>
        </div>

        {/* QWERTY Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Q W E R T Y Row</h4>
          <div className="grid grid-cols-10 gap-1">
            {rows.qwerty.map(([key, urdu]) => (
              <div key={key} className="text-center p-2 border rounded bg-muted/50">
                <div className="text-xs text-muted-foreground">{key}</div>
                <div className="text-lg font-nastaliq">{urdu}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ASDF Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">A S D F Row</h4>
          <div className="grid grid-cols-10 gap-1">
            {rows.asdf.map(([key, urdu]) => (
              <div key={key} className="text-center p-2 border rounded bg-muted/50">
                <div className="text-xs text-muted-foreground">{key}</div>
                <div className="text-lg font-nastaliq">{urdu}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ZXCV Row */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Z X C V Row</h4>
          <div className="grid grid-cols-10 gap-1">
            {rows.zxcv.map(([key, urdu]) => (
              <div key={key} className="text-center p-2 border rounded bg-muted/50">
                <div className="text-xs text-muted-foreground">{key}</div>
                <div className="text-lg font-nastaliq">{urdu}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Space */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Space</h4>
          <div className="text-center p-4 border rounded bg-muted/50">
            <div className="text-xs text-muted-foreground">Space</div>
            <div className="text-lg font-nastaliq"> </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 gap-2 relative"
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {isKeyboardEnabled ? layoutNames[currentLayout] : 'English'}
          </span>
          <Badge variant={isKeyboardEnabled ? "default" : "secondary"} className="h-4 px-1.5 text-xs">
            {isKeyboardEnabled ? 'Urdu' : 'EN'}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="px-2 py-1.5">
            <h4 className="text-sm font-medium">Keyboard Settings</h4>
            <p className="text-xs text-muted-foreground">
              Configure your typing experience
            </p>
          </div>
          
          <Separator />
          
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between px-2 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="keyboard-toggle" className="text-sm font-medium">
                Urdu Keyboard
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable Urdu typing or use default English
              </p>
            </div>
            <Switch
              id="keyboard-toggle"
              checked={isKeyboardEnabled}
              onCheckedChange={onKeyboardToggle}
            />
          </div>

          {isKeyboardEnabled && (
            <>
              <Separator />
              
              {/* Layout Selection */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium px-2">Layout Options</h5>
                <div className="space-y-1">
                  {Object.entries(layoutNames).map(([key, name]) => (
                    <Button
                      key={key}
                      variant={currentLayout === key ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => onLayoutChange(key as LayoutType)}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{name}</span>
                            {currentLayout === key && (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground text-left mt-1">
                            {layoutDescriptions[key as LayoutType]}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Keymap Viewer */}
              <div className="px-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="h-3.5 w-3.5" />
                      View Keymap
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Keyboard Layout Reference</DialogTitle>
                    </DialogHeader>
                    <KeymapViewer />
                  </DialogContent>
                </Dialog>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EnhancedKeyboardLayoutToggle;
