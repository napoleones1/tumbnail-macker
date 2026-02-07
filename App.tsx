
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Image as ImageIcon, Map as MapIcon, Download, RotateCcw, Sparkles, User, Sword, Move, Maximize, RotateCw, Droplets, Sun, Contrast as ContrastIcon, Zap } from 'lucide-react';
import { ThumbnailState, Transform } from './types';
import { 
  processImageBackground, 
  drawVignette, 
  drawGoldText 
} from './utils/canvasHelpers';

const THUMBNAIL_WIDTH = 1280;
const THUMBNAIL_HEIGHT = 720;

interface LayerBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

const App: React.FC = () => {
  const [state, setState] = useState<ThumbnailState>({
    rulerImage: null,
    backgroundImage: null,
    mapImage: null,
    logoImage: null,
    mainTitle: "PUNCAK EKSPANSI DYNASTY SILIWANGI",
    subtitle: "Kemenangan Besar di France & Eropa Timur",
    episode: "Ep 27",
    chromaKeyColor: { r: 0, g: 255, b: 0 },
    chromaThreshold: 50,
    rulerTransform: { x: -80, y: 80, scale: 1.4, rotation: 0 },
    mapTransform: { x: 550, y: 120, scale: 0.9, rotation: 0 },
    logoTransform: { x: 60, y: 550, scale: 0.6, rotation: 0 },
    bgBlur: 6,
    bgSaturation: 100,
    bgBrightness: 60,
    bgContrast: 110,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [draggingLayer, setDraggingLayer] = useState<'ruler' | 'map' | 'logo' | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const rulerBounds = useRef<LayerBounds>({ x: 0, y: 0, w: 0, h: 0 });
  const mapBounds = useRef<LayerBounds>({ x: 0, y: 0, w: 0, h: 0 });
  const logoBounds = useRef<LayerBounds>({ x: 0, y: 0, w: 0, h: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ThumbnailState) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setState(prev => ({ ...prev, [field]: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTransform = (layer: 'ruler' | 'map' | 'logo', field: keyof Transform, value: number) => {
    const transformKey = layer === 'ruler' ? 'rulerTransform' : layer === 'map' ? 'mapTransform' : 'logoTransform';
    setState(prev => ({
      ...prev,
      [transformKey]: { ...prev[transformKey], [field]: value }
    }));
  };

  const drawThumbnail = useCallback(async (targetCanvas: HTMLCanvasElement | null) => {
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);

    // 1. Draw Background
    if (state.backgroundImage) {
      const bgImg = new Image();
      bgImg.src = state.backgroundImage;
      await new Promise(resolve => bgImg.onload = resolve);
      
      ctx.save();
      // Applying dynamic filters based on user sliders
      ctx.filter = `blur(${state.bgBlur}px) saturate(${state.bgSaturation}%) brightness(${state.bgBrightness}%) contrast(${state.bgContrast}%)`;
      ctx.drawImage(bgImg, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      ctx.restore();

      ctx.save();
      // Add a cinematic red/dark overlay for CK3 feel
      ctx.fillStyle = 'rgba(127, 29, 29, 0.1)'; 
      ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      drawVignette(ctx, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      ctx.restore();
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
    }

    // Function to draw transformed layer
    const drawLayer = (img: HTMLImageElement, transform: Transform, isRuler: boolean, isMap: boolean, isLogo: boolean) => {
      const { x, y, scale, rotation } = transform;
      const dw = img.width * scale;
      const dh = img.height * scale;

      if (isRuler) rulerBounds.current = { x, y, w: dw, h: dh };
      if (isMap) mapBounds.current = { x, y, w: dw, h: dh };
      if (isLogo) logoBounds.current = { x, y, w: dw, h: dh };

      ctx.save();
      ctx.translate(x + dw / 2, y + dh / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-(dw / 2), -(dh / 2));

      if (isRuler || isMap) {
        ctx.shadowColor = isRuler ? 'rgba(254, 240, 138, 0.4)' : 'rgba(251, 191, 36, 0.8)';
        ctx.shadowBlur = isRuler ? 40 : 60;
      }

      if (isLogo) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.shadowBlur = 20;
      }

      ctx.drawImage(img, 0, 0, dw, dh);
      ctx.restore();

      const currentLayer = isRuler ? 'ruler' : isMap ? 'map' : 'logo';
      if (draggingLayer === currentLayer) {
        ctx.save();
        ctx.translate(x + dw / 2, y + dh / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.strokeStyle = '#eab308';
        ctx.setLineDash([10, 5]);
        ctx.lineWidth = 3;
        ctx.strokeRect(-(dw / 2), -(dh / 2), dw, dh);
        ctx.restore();
      }
    };

    if (state.mapImage) {
      const mapImg = new Image();
      mapImg.src = state.mapImage;
      await new Promise(resolve => mapImg.onload = resolve);
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = mapImg.width;
      mapCanvas.height = mapImg.height;
      const mCtx = mapCanvas.getContext('2d', { willReadFrequently: true });
      if (mCtx) {
        mCtx.drawImage(mapImg, 0, 0);
        processImageBackground(mCtx, mapImg.width, mapImg.height, 'white');
        drawLayer(mapCanvas as any, state.mapTransform, false, true, false);
      }
    }

    if (state.rulerImage) {
      const rulerImg = new Image();
      rulerImg.src = state.rulerImage;
      await new Promise(resolve => rulerImg.onload = resolve);
      const rCanvas = document.createElement('canvas');
      rCanvas.width = rulerImg.width;
      rCanvas.height = rulerImg.height;
      const rCtx = rCanvas.getContext('2d', { willReadFrequently: true });
      if (rCtx) {
        rCtx.drawImage(rulerImg, 0, 0);
        processImageBackground(rCtx, rulerImg.width, rulerImg.height, 'green');
        drawLayer(rCanvas as any, state.rulerTransform, true, false, false);
      }
    }

    if (state.logoImage) {
      const logoImg = new Image();
      logoImg.src = state.logoImage;
      await new Promise(resolve => logoImg.onload = resolve);
      drawLayer(logoImg, state.logoTransform, false, false, true);
    } else {
        ctx.save();
        ctx.font = 'bold 36px "Cinzel"';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 8;
        ctx.fillText('CRUSADER KINGS III', 60, THUMBNAIL_HEIGHT - 90);
        ctx.font = '900 24px "Montserrat"';
        ctx.fillStyle = '#eab308';
        ctx.fillText('ALL UNDER HEAVEN', 60, THUMBNAIL_HEIGHT - 60);
        ctx.restore();
    }

    for (let i = 0; i < 40; i++) {
      const px = Math.random() * THUMBNAIL_WIDTH;
      const py = Math.random() * THUMBNAIL_HEIGHT;
      const size = Math.random() * 2.5 + 0.5;
      ctx.fillStyle = `rgba(251, 191, 36, ${Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    drawGoldText(ctx, state.mainTitle, THUMBNAIL_WIDTH / 2, 100, 60, THUMBNAIL_WIDTH - 200);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 34px "Montserrat"';
    ctx.fillStyle = '#fef9c3';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 12;
    ctx.fillText(`${state.subtitle} – ${state.episode}`, THUMBNAIL_WIDTH / 2, 155);
    ctx.restore();
  }, [state, draggingLayer]);

  useEffect(() => {
    const timer = setTimeout(() => {
        drawThumbnail(previewCanvasRef.current);
    }, 16);
    return () => clearTimeout(timer);
  }, [drawThumbnail]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = THUMBNAIL_WIDTH / rect.width;
    const scaleY = THUMBNAIL_HEIGHT / rect.height;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.nativeEvent instanceof TouchEvent ? e.nativeEvent.touches[0].clientX : (e as any).touches[0].clientX;
      clientY = e.nativeEvent instanceof TouchEvent ? e.nativeEvent.touches[0].clientY : (e as any).touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e);
    const rb = rulerBounds.current;
    if (x >= rb.x && x <= rb.x + rb.w && y >= rb.y && y <= rb.y + rb.h) {
      setDraggingLayer('ruler');
      dragOffset.current = { x: x - rb.x, y: y - rb.y };
      return;
    }
    const mb = mapBounds.current;
    if (x >= mb.x && x <= mb.x + mb.w && y >= mb.y && y <= mb.y + mb.h) {
      setDraggingLayer('map');
      dragOffset.current = { x: x - mb.x, y: y - mb.y };
      return;
    }
    const lb = logoBounds.current;
    if (x >= lb.x && x <= lb.x + lb.w && y >= lb.y && y <= lb.y + lb.h) {
      setDraggingLayer('logo');
      dragOffset.current = { x: x - lb.x, y: y - lb.y };
      return;
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingLayer) return;
    const { x, y } = getCanvasCoords(e);
    const newX = x - dragOffset.current.x;
    const newY = y - dragOffset.current.y;
    updateTransform(draggingLayer, 'x', Math.round(newX));
    updateTransform(draggingLayer, 'y', Math.round(newY));
  };

  const handleEnd = () => {
    setDraggingLayer(null);
  };

  const downloadThumbnail = async () => {
    setIsGenerating(true);
    await drawThumbnail(canvasRef.current);
    const link = document.createElement('a');
    link.download = `Siliwangi_Thumbnail_Ep${state.episode.replace(/\D/g,'')}.png`;
    link.href = canvasRef.current?.toDataURL('image/png') || '';
    link.click();
    setIsGenerating(false);
  };

  const TransformControls = ({ label, layer }: { label: string, layer: 'ruler' | 'map' | 'logo' }) => {
    const transform = layer === 'ruler' ? state.rulerTransform : layer === 'map' ? state.mapTransform : state.logoTransform;
    return (
      <div className="space-y-4 bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-yellow-500/90 flex items-center gap-2">
             {label} Transform
          </span>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">{transform.scale.toFixed(2)}x</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">{transform.rotation}°</span>
          </div>
        </div>
        <div className="space-y-4">
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                    <div className="flex items-center gap-1"><Maximize className="w-3 h-3"/> Zoom</div>
                </div>
                <input 
                    type="range" min="0.1" max="4" step="0.01"
                    value={transform.scale}
                    onChange={(e) => updateTransform(layer, 'scale', parseFloat(e.target.value))}
                    className="w-full accent-yellow-600 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                    <div className="flex items-center gap-1"><RotateCw className="w-3 h-3"/> Rotation</div>
                </div>
                <input 
                    type="range" min="-180" max="180" step="1"
                    value={transform.rotation}
                    onChange={(e) => updateTransform(layer, 'rotation', parseInt(e.target.value))}
                    className="w-full accent-yellow-600 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-600/20 p-3 rounded-2xl border border-yellow-600/30">
            <Sword className="w-10 h-10 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-cinzel tracking-widest text-yellow-500">
              TUMBNAIL MACKER CK3 - BY:LORD HAIKAL
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] opacity-80">Professional CK3 Content Suite</p>
          </div>
        </div>
        <button 
          onClick={downloadThumbnail}
          disabled={isGenerating}
          className="flex items-center justify-center gap-3 bg-gradient-to-br from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 disabled:from-slate-700 disabled:to-slate-800 transition-all text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-yellow-900/40 active:scale-95 group text-sm uppercase tracking-wider"
        >
          {isGenerating ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />}
          GENERATE THUMBNAIL
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Editor Controls */}
        <section className="lg:col-span-4 space-y-6 bg-slate-900/90 p-6 rounded-[2rem] border border-slate-800 shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-hide">
          <div className="space-y-6">
            <h2 className="text-xs font-black flex items-center gap-2 text-yellow-500/90 border-b border-slate-800/50 pb-3 uppercase tracking-[0.3em]">
              <Sparkles className="w-4 h-4" /> ASSET SETUP
            </h2>
            
            {/* Background */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">1. Background</label>
              <div className="relative">
                <input type="file" onChange={(e) => handleFileUpload(e, 'backgroundImage')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className={`p-4 border-2 border-dashed ${state.backgroundImage ? 'border-yellow-600/50 bg-yellow-900/10' : 'border-slate-800 hover:border-slate-700'} rounded-2xl transition-all flex items-center gap-4`}>
                  <div className={`p-2 rounded-lg ${state.backgroundImage ? 'bg-yellow-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black truncate uppercase tracking-widest">{state.backgroundImage ? 'Success' : 'Load BG'}</span>
                </div>
              </div>
              
              {/* BG Adjustment Controls */}
              <div className="space-y-4 bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-500/90 flex items-center gap-2">
                    Background FX
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {/* Blur */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                      <div className="flex items-center gap-1"><Droplets className="w-3 h-3"/> Blur</div>
                      <span>{state.bgBlur}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="25" step="1"
                      value={state.bgBlur}
                      onChange={(e) => setState(prev => ({ ...prev, bgBlur: parseInt(e.target.value) }))}
                      className="w-full accent-yellow-600 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                      <div className="flex items-center gap-1"><Zap className="w-3 h-3"/> Saturation</div>
                      <span>{state.bgSaturation}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="250" step="1"
                      value={state.bgSaturation}
                      onChange={(e) => setState(prev => ({ ...prev, bgSaturation: parseInt(e.target.value) }))}
                      className="w-full accent-yellow-600 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  {/* Brightness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                      <div className="flex items-center gap-1"><Sun className="w-3 h-3"/> Brightness</div>
                      <span>{state.bgBrightness}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="200" step="1"
                      value={state.bgBrightness}
                      onChange={(e) => setState(prev => ({ ...prev, bgBrightness: parseInt(e.target.value) }))}
                      className="w-full accent-yellow-600 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                      <div className="flex items-center gap-1"><ContrastIcon className="w-3 h-3"/> Contrast</div>
                      <span>{state.bgContrast}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="250" step="1"
                      value={state.bgContrast}
                      onChange={(e) => setState(prev => ({ ...prev, bgContrast: parseInt(e.target.value) }))}
                      className="w-full accent-yellow-600 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ruler Layer */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">2. Character</label>
              <div className="relative">
                <input type="file" onChange={(e) => handleFileUpload(e, 'rulerImage')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className={`p-4 border-2 border-dashed ${state.rulerImage ? 'border-yellow-600/50 bg-yellow-900/10' : 'border-slate-800 hover:border-slate-700'} rounded-2xl transition-all flex items-center gap-4`}>
                  <div className={`p-2 rounded-lg ${state.rulerImage ? 'bg-yellow-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black truncate uppercase tracking-widest">{state.rulerImage ? 'Ruler Asset Loaded' : 'Load Ruler'}</span>
                </div>
              </div>
              <TransformControls label="Ruler" layer="ruler" />
            </div>

            {/* Map Layer */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">3. Highlight</label>
              <div className="relative">
                <input type="file" onChange={(e) => handleFileUpload(e, 'mapImage')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className={`p-4 border-2 border-dashed ${state.mapImage ? 'border-yellow-600/50 bg-yellow-900/10' : 'border-slate-800 hover:border-slate-700'} rounded-2xl transition-all flex items-center gap-4`}>
                  <div className={`p-2 rounded-lg ${state.mapImage ? 'bg-yellow-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    <MapIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black truncate uppercase tracking-widest">{state.mapImage ? 'Map Asset Loaded' : 'Load Map'}</span>
                </div>
              </div>
              <TransformControls label="Map" layer="map" />
            </div>

            {/* Logo Layer */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">4. Official Logo</label>
              <div className="relative">
                <input type="file" onChange={(e) => handleFileUpload(e, 'logoImage')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className={`p-4 border-2 border-dashed ${state.logoImage ? 'border-yellow-600/50 bg-yellow-900/10' : 'border-slate-800 hover:border-slate-700'} rounded-2xl transition-all flex items-center gap-4`}>
                  <div className={`p-2 rounded-lg ${state.logoImage ? 'bg-yellow-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    <Sword className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black truncate uppercase tracking-widest">{state.logoImage ? 'Logo Ready' : 'Upload Logo Asset'}</span>
                </div>
              </div>
              <TransformControls label="Logo" layer="logo" />
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-xs font-black flex items-center gap-2 text-yellow-500/90 border-b border-slate-800/50 pb-3 uppercase tracking-[0.3em]">
              <ImageIcon className="w-4 h-4" /> TEXT CONFIG
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Main Title</label>
                <textarea 
                  value={state.mainTitle}
                  onChange={(e) => setState(prev => ({ ...prev, mainTitle: e.target.value.toUpperCase() }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-cinzel text-yellow-100 focus:border-yellow-600 outline-none resize-none shadow-inner"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Subtitle</label>
                  <input 
                    type="text"
                    value={state.subtitle}
                    onChange={(e) => setState(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 focus:border-yellow-600 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Episode</label>
                  <input 
                    type="text"
                    value={state.episode}
                    onChange={(e) => setState(prev => ({ ...prev, episode: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-yellow-500 font-black focus:border-yellow-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Preview Area */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl relative group">
            <div className="absolute top-6 left-6 z-20 pointer-events-none flex gap-3">
              <span className="bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest ring-1 ring-white/30 backdrop-blur-md">STUDIO VIEW</span>
              <span className="bg-slate-800/80 text-slate-300 text-[11px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest ring-1 ring-white/10 backdrop-blur-md flex items-center gap-2">
                <Move className="w-3.5 h-3.5" /> DRAG TO MOVE
              </span>
            </div>
            
            <div className="aspect-video w-full relative bg-slate-950 flex items-center justify-center p-0 cursor-move overflow-hidden">
                <canvas 
                    ref={previewCanvasRef} 
                    width={THUMBNAIL_WIDTH} 
                    height={THUMBNAIL_HEIGHT}
                    onMouseDown={handleStart}
                    onMouseMove={handleMove}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={handleMove}
                    onTouchEnd={handleEnd}
                    className="w-full h-full object-contain touch-none"
                />
            </div>

            <canvas ref={canvasRef} width={THUMBNAIL_WIDTH} height={THUMBNAIL_HEIGHT} className="hidden" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm shadow-xl">
              <h3 className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 mb-3">
                <Move className="w-4 h-4" /> COMPOSITION CONTROL
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Drag <strong>Ruler</strong>, <strong>Map</strong>, or <strong>Logo</strong> directly in the preview. Use the sidebar for <strong>Zoom</strong> and <strong>Rotation</strong>.
              </p>
            </div>
            <div className="bg-yellow-950/5 border border-yellow-900/20 p-6 rounded-3xl backdrop-blur-sm shadow-xl">
              <h3 className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 mb-3">
                <Sparkles className="w-4 h-4" /> IMPERIAL STUDIO
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium italic opacity-80">
                Final render by Lord Haikal includes custom logo asset integration and cinematic rotation support for all layers.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
