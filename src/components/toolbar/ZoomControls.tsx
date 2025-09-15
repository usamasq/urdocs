import React, { memo } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { validateZoom } from '../../utils/dimensionUtils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = memo(({ zoomLevel, onZoomChange }) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange(validateZoom(zoomLevel - 0.1))}
              className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>
        
        <span className="px-2 text-sm font-medium min-w-[3rem] text-center text-foreground">
          {Math.round(zoomLevel * 100)}%
        </span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onZoomChange(validateZoom(zoomLevel + 0.1))}
              className="h-8 w-8 p-0 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

ZoomControls.displayName = 'ZoomControls';

export default ZoomControls;
