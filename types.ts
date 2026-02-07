
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number; // in degrees
}

export interface ThumbnailState {
  rulerImage: string | null;
  backgroundImage: string | null;
  mapImage: string | null;
  logoImage: string | null;
  mainTitle: string;
  subtitle: string;
  episode: string;
  chromaKeyColor: { r: number; g: number; b: number };
  chromaThreshold: number;
  rulerTransform: Transform;
  mapTransform: Transform;
  logoTransform: Transform;
  bgBlur: number;
  bgSaturation: number;
  bgBrightness: number;
  bgContrast: number;
}

export enum LayerType {
  BACKGROUND = 'BACKGROUND',
  MAP = 'MAP',
  RULER = 'RULER',
  TEXT = 'TEXT',
  LOGO = 'LOGO'
}
