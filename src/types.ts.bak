
export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  processedPreview?: string;
  settings: EditSettings;
}

export interface EditSettings {
  optimized: boolean; 
  aligned: boolean;   
  sharpness: number;  
  cropRatio: 'original' | '5:4' | '4:5' | '9:16' | '1:1' | '16:9';
  watermark: WatermarkSettings;
  badges: BadgeSettings[];
  naming: RenameSettings; 
}

export type BrandingPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  logo?: string; 
  scale: number;
  opacity: number;
  position: BrandingPosition;
  offsetX: number;
  offsetY: number;
}

export interface BadgeSettings {
  id: string; 
  enabled: boolean;
  image: string; 
  scale: number;
  opacity: number;
  position: BrandingPosition;
  offsetX: number;
  offsetY: number;
}

export interface RenameSettings {
  format: string;
  position: 'before' | 'after';
  startNumber: number;
}

export enum Tab {
  GALLERY = 'Gallery',
  STUDIO = 'Studio',
  BRANDING = 'Branding',
  EXPORT = 'Export'
}
