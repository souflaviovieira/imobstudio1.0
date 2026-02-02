
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Camera,
  LayoutGrid,
  Wand2,
  Stamp,
  Download,
  Plus,
  Trash2,
  ChevronRight,
  Sun,
  Moon,
  CheckCircle2,
  Info,
  Grid2X2,
  Grid3X3,
  StretchHorizontal,
  ArrowRight,
  Upload,
  Type,
  Image as ImageIcon,
  Settings,
  X,
  Maximize2,
  Star,
  Edit2,
  FileText,
  ChevronDown,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowLeft,
  Maximize,
  ArrowRight as ArrowRightIcon,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
  Square,
  Check
} from 'lucide-react';
import JSZip from 'jszip';
import { ImageFile, Tab, EditSettings, WatermarkSettings, BadgeSettings, RenameSettings, BrandingPosition } from '../types';
import { processImage } from '../services/imageProcessor';
import ComparisonSlider from '../components/ComparisonSlider';

const DEFAULT_SETTINGS: EditSettings = {
  optimized: true,
  aligned: false,
  sharpness: 30,
  cropRatio: 'original',
  watermark: {
    enabled: true,
    text: '',
    scale: 15,
    opacity: 60,
    position: 'bottom-right',
    offsetX: 0,
    offsetY: 0
  },
  badges: [],
  naming: {
    format: 'IMOBI',
    position: 'after',
    startNumber: 1
  }
};

type GridDensity = 'compact' | 'normal' | 'wide';

const Dashboard: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GALLERY);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [gridDensity, setGridDensity] = useState<GridDensity>('normal');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'watermark' | 'badge'>('watermark');
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);

  const [croppedOriginal, setCroppedOriginal] = useState<string | null>(null);

  const selectedImage = images[selectedIndex];

  // Auto-select new uploads for export
  useEffect(() => {
    if (images.length > 0 && selectedForExport.size === 0) {
      setSelectedForExport(new Set(images.map(img => img.id)));
    }
  }, [images.length]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = (Array.from(e.target.files) as File[]).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
    }));
    setImages(prev => [...prev, ...newFiles]);
  };

  const updateProcessedPreview = useCallback(async (index: number) => {
    const imgFile = images[index];
    if (!imgFile) return;

    const img = new Image();
    img.src = imgFile.preview;
    img.onload = async () => {
      const processed = await processImage(img, imgFile.settings);

      if (index === selectedIndex) {
        const cropOnlySettings: EditSettings = {
          ...DEFAULT_SETTINGS,
          optimized: false,
          aligned: false,
          sharpness: 0,
          cropRatio: imgFile.settings.cropRatio,
          watermark: { ...DEFAULT_SETTINGS.watermark, enabled: false },
          badges: []
        };
        const beforeCropped = await processImage(img, cropOnlySettings);
        setCroppedOriginal(beforeCropped);
      }

      setImages(prev => prev.map((item, i) =>
        i === index ? { ...item, processedPreview: processed } : item
      ));
    };
  }, [images, selectedIndex]);

  useEffect(() => {
    if ((activeTab === Tab.STUDIO || activeTab === Tab.BRANDING) && selectedImage) {
      updateProcessedPreview(selectedIndex);
    }
  }, [activeTab, selectedIndex, selectedImage?.settings]);

  // Special effect to update all processed previews when entering Export tab
  useEffect(() => {
    if (activeTab === Tab.EXPORT) {
      images.forEach((_, i) => updateProcessedPreview(i));
    }
  }, [activeTab]);

  const updateSettings = (updates: Partial<EditSettings>) => {
    setImages(prev => prev.map((img, i) =>
      (isSyncing || i === selectedIndex) ? { ...img, settings: { ...img.settings, ...updates } } : img
    ));
  };

  const updateWatermarkGlobal = (updates: Partial<WatermarkSettings>) => {
    setImages(prev => prev.map((img) => ({
      ...img,
      settings: {
        ...img.settings,
        watermark: { ...img.settings.watermark, ...updates }
      }
    })));
  };

  const updateBadgeGlobal = (badgeId: string, updates: Partial<BadgeSettings>) => {
    setImages(prev => prev.map((img) => ({
      ...img,
      settings: {
        ...img.settings,
        badges: img.settings.badges.map(b => b.id === badgeId ? { ...b, ...updates } : b)
      }
    })));
  };

  const updateNamingGlobal = (updates: Partial<RenameSettings>) => {
    setImages(prev => prev.map(img => ({
      ...img,
      settings: {
        ...img.settings,
        naming: { ...img.settings.naming, ...updates }
      }
    })));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateWatermarkGlobal({ logo: base64, enabled: true });
      setModalMode('watermark');
      setIsBrandingModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    updateWatermarkGlobal({ logo: undefined });
  };

  const handleBadgeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newBadge: BadgeSettings = {
        id: Math.random().toString(36).substr(2, 9),
        enabled: true,
        image: base64,
        scale: 15,
        opacity: 100,
        position: 'top-left',
        offsetX: 0,
        offsetY: 0
      };
      setImages(prev => prev.map(img => ({
        ...img,
        settings: {
          ...img.settings,
          badges: [...img.settings.badges, newBadge]
        }
      })));
      setActiveBadgeId(newBadge.id);
      setModalMode('badge');
      setIsBrandingModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const removeBadge = (badgeId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      settings: {
        ...img.settings,
        badges: img.settings.badges.filter(b => b.id !== badgeId)
      }
    })));
  };

  const handleBatchExport = async () => {
    const imagesToExport = images.filter(img => selectedForExport.has(img.id));
    if (imagesToExport.length === 0) return;

    setIsProcessing(true);
    setExportProgress(0);
    const zip = new JSZip();

    for (let i = 0; i < imagesToExport.length; i++) {
      const img = imagesToExport[i];
      const imgEl = new Image();
      imgEl.src = img.preview;

      await new Promise(resolve => {
        imgEl.onload = async () => {
          const dataUrl = await processImage(imgEl, img.settings, 3840);
          const base64Data = dataUrl.split(',')[1];

          const { format, position, startNumber } = img.settings.naming;
          const currentNum = startNumber + i;
          const fileName = position === 'after'
            ? `${format} ${currentNum}.jpeg`
            : `${currentNum} ${format}.jpeg`;

          zip.file(fileName, base64Data, { base64: true });
          setExportProgress(((i + 1) / imagesToExport.length) * 100);
          resolve(true);
        };
      });
    }

    const content = await zip.generateAsync({ type: 'blob' }) as Blob;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `ImobiEdit_Export_${Date.now()}.zip`;
    link.click();
    setIsProcessing(false);
  };

  const toggleExportSelection = (id: string) => {
    setSelectedForExport(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllForExport = (select: boolean) => {
    if (select) setSelectedForExport(new Set(images.map(img => img.id)));
    else setSelectedForExport(new Set());
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newImages = [...images];
    const item = newImages.splice(draggedIndex, 1)[0];
    newImages.splice(index, 0, item);
    setImages(newImages);
    setDraggedIndex(index);
    if (selectedIndex === draggedIndex) setSelectedIndex(index);
    else if (selectedIndex === index) setSelectedIndex(draggedIndex);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  const getGridCols = () => {
    switch (gridDensity) {
      case 'compact': return 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6';
      case 'wide': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
      default: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  const getBrandingPositionStyles = (pos: BrandingPosition, scale: number, opacity: number) => {
    const base = {
      position: 'absolute' as const,
      opacity: opacity / 100,
      width: `${scale}%`,
      pointerEvents: 'none' as const,
      zIndex: 10
    };

    switch (pos) {
      case 'top-left': return { ...base, top: 0, left: 0 };
      case 'top-center': return { ...base, top: 0, left: '50%', transform: 'translateX(-50%)' };
      case 'top-right': return { ...base, top: 0, right: 0, textAlign: 'right' as const };
      case 'middle-left': return { ...base, top: '50%', left: 0, transform: 'translateY(-50%)' };
      case 'center': return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' as const };
      case 'middle-right': return { ...base, top: '50%', right: 0, transform: 'translateY(-50%)', textAlign: 'right' as const };
      case 'bottom-left': return { ...base, bottom: 0, left: 0 };
      case 'bottom-center': return { ...base, bottom: 0, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right': return { ...base, bottom: 0, right: 0, textAlign: 'right' as const };
      default: return base;
    }
  };

  const POSITIONS_GRID: { id: BrandingPosition, icon: any, label: string }[] = [
    { id: 'top-left', icon: ArrowUpLeft, label: 'Superior Esquerdo' },
    { id: 'top-center', icon: ArrowUp, label: 'Superior Centro' },
    { id: 'top-right', icon: ArrowUpRight, label: 'Superior Direito' },
    { id: 'middle-left', icon: ArrowLeft, label: 'Meio Esquerdo' },
    { id: 'center', icon: Maximize, label: 'Centro' },
    { id: 'middle-right', icon: ArrowRightIcon, label: 'Meio Direito' },
    { id: 'bottom-left', icon: ArrowDownLeft, label: 'Inferior Esquerdo' },
    { id: 'bottom-center', icon: ArrowDown, label: 'Inferior Centro' },
    { id: 'bottom-right', icon: ArrowDownRight, label: 'Inferior Direito' },
  ];

  const getAspectClass = (ratio: string) => {
    switch (ratio) {
      case '5:4': return 'aspect-[5/4]';
      case '4:5': return 'aspect-[4/5]';
      case '9:16': return 'aspect-[9/16]';
      case '1:1': return 'aspect-square';
      case '16:9': return 'aspect-video';
      default: return 'aspect-auto';
    }
  };

  const currentModalBadge = modalMode === 'badge' ? selectedImage?.settings.badges.find(b => b.id === activeBadgeId) : null;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#0E1117] text-white' : 'bg-gray-50 text-slate-900'}`}>

      <header className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-[#1E293B]' : 'border-gray-200'} sticky top-0 z-50 backdrop-blur-md bg-opacity-80`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00FFAA] flex items-center justify-center"><Camera size={18} className="text-[#0E1117]" /></div>
          <h1 className="text-xl font-bold tracking-tight">ImobStudio <span className="text-[#00FFAA]">Pro</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#161B22]' : 'hover:bg-gray-200'}`}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 font-medium px-3 py-1 bg-white/5 rounded-full border border-white/10 uppercase">v2.0 Beta</div>
        </div>
      </header>

      <nav className={`flex justify-around md:justify-start md:gap-8 px-6 py-3 border-b ${isDarkMode ? 'border-[#1E293B] bg-[#161B22]' : 'border-gray-200 bg-white'}`}>
        {Object.values(Tab).map((tab) => {
          const Icon = tab === Tab.GALLERY ? LayoutGrid : tab === Tab.STUDIO ? Wand2 : tab === Tab.BRANDING ? Stamp : Download;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 py-2 px-1 text-sm font-medium transition-all relative ${activeTab === tab ? 'text-[#00FFAA]' : isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
              <Icon size={18} />
              <span className="hidden sm:inline">{tab}</span>
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FFAA] rounded-full shadow-[0_0_8px_#00FFAA]" />}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
        {activeTab === Tab.GALLERY && (
          <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
              <div className="flex-1"><h2 className="text-2xl font-bold mb-1">Galeria de Fotos</h2><p className="text-slate-500 text-sm">Organize as fotos do lote.</p></div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center p-1 rounded-xl ${isDarkMode ? 'bg-[#161B22] border border-[#1E293B]' : 'bg-white border border-gray-200'}`}>
                  <button onClick={() => setGridDensity('wide')} className={`p-2 rounded-lg ${gridDensity === 'wide' ? 'bg-[#00FFAA] text-[#0E1117]' : 'text-slate-500'}`}><StretchHorizontal size={18} /></button>
                  <button onClick={() => setGridDensity('normal')} className={`p-2 rounded-lg ${gridDensity === 'normal' ? 'bg-[#00FFAA] text-[#0E1117]' : 'text-slate-500'}`}><Grid2X2 size={18} /></button>
                  <button onClick={() => setGridDensity('compact')} className={`p-2 rounded-lg ${gridDensity === 'compact' ? 'bg-[#00FFAA] text-[#0E1117]' : 'text-slate-500'}`}><Grid3X3 size={18} /></button>
                </div>
                <label className="flex items-center gap-2 bg-[#00FFAA] hover:bg-[#00e699] text-[#0E1117] px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer shadow-lg active:scale-95"><Plus size={20} /><span>Adicionar Fotos</span><input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" /></label>
              </div>
            </div>
            {images.length === 0 ? (
              <div className={`w-full h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'border-[#1E293B] bg-[#161B22]' : 'border-gray-300 bg-white'}`}><LayoutGrid size={32} className="text-slate-500" /><p className="text-slate-500">Nenhuma imagem carregada.</p></div>
            ) : (
              <div className={`grid ${getGridCols()} gap-4`}>
                {images.map((img, i) => (
                  <div key={img.id} draggable onDragStart={() => handleDragStart(i)} onDragOver={(e) => handleDragOver(e, i)} onDragEnd={handleDragEnd} className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-move aspect-square ${selectedIndex === i ? 'border-[#00FFAA]' : 'border-transparent'}`} onClick={() => setSelectedIndex(i)}>
                    <img src={img.preview} alt="Room" className="w-full h-full object-cover pointer-events-none" />
                    <button onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter(item => item.id !== img.id)); }} className="absolute top-2 left-2 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                    {selectedIndex === i && <div className="absolute top-2 right-2 bg-[#00FFAA] text-[#0E1117] p-1 rounded-full"><CheckCircle2 size={14} /></div>}
                  </div>
                ))}
              </div>
            )}
            {images.length > 0 && (
              <div className="mt-8 flex justify-center"><button onClick={() => setActiveTab(Tab.STUDIO)} className="flex items-center gap-3 bg-[#161B22] border border-[#1E293B] hover:border-[#00FFAA] text-white px-8 py-3 rounded-xl font-bold transition-all">Próxima Etapa: Estúdio <ChevronRight size={18} /></button></div>
            )}
          </div>
        )}

        {activeTab === Tab.STUDIO && selectedImage && (
          <div className="w-full max-w-4xl space-y-6 animate-in fade-in duration-500">
            <ComparisonSlider before={croppedOriginal || selectedImage.preview} after={selectedImage.processedPreview || selectedImage.preview} />
            <div className={`p-3 rounded-2xl flex gap-3 overflow-x-auto scrollbar-hide ${isDarkMode ? 'bg-[#161B22]/60' : 'bg-gray-100'}`}>
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setSelectedIndex(i)} className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all border-2 ${selectedIndex === i ? 'border-[#00FFAA] scale-105 shadow-lg shadow-[#00FFAA]/20' : 'border-transparent opacity-60'}`}><img src={img.preview} alt="Thumb" className="w-full h-full object-cover" /></button>
              ))}
            </div>
            <div className={`p-6 md:p-8 rounded-3xl space-y-8 ${isDarkMode ? 'bg-[#161B22] border border-[#1E293B]' : 'bg-white border border-gray-200 shadow-xl'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3"><Wand2 size={24} className="text-[#00FFAA]" /><h3 className="text-xl font-bold">Ajustes Pro</h3></div>
                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 w-full md:w-auto pt-2 md:pt-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 whitespace-nowrap">Aplicar a Todas</span>
                  <button onClick={() => setIsSyncing(!isSyncing)} className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${isSyncing ? 'bg-[#00FFAA] shadow-[0_0_15px_rgba(0,255,170,0.4)]' : 'bg-slate-700'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${isSyncing ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="flex flex-col gap-2"><div className="flex items-center justify-between mb-1"><span className="font-bold text-sm uppercase tracking-wider text-slate-300">Otimizar</span><button onClick={() => updateSettings({ optimized: !selectedImage.settings.optimized })} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${selectedImage.settings.optimized ? 'bg-[#00FFAA]' : 'bg-slate-700'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${selectedImage.settings.optimized ? 'translate-x-5' : 'translate-x-0'}`} /></button></div><p className="text-[10px] text-slate-500 uppercase font-light leading-relaxed">Ajuste automático de brilho e luxo.</p></div>
                <div className="flex flex-col gap-2"><div className="flex items-center justify-between mb-1"><span className="font-bold text-sm uppercase tracking-wider text-slate-300">Alinhar</span><button onClick={() => updateSettings({ aligned: !selectedImage.settings.aligned })} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${selectedImage.settings.aligned ? 'bg-[#00FFAA]' : 'bg-slate-700'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${selectedImage.settings.aligned ? 'translate-x-5' : 'translate-x-0'}`} /></button></div><p className="text-[10px] text-slate-500 uppercase font-light leading-relaxed">Correção vertical profissional.</p></div>
                <div className="flex flex-col gap-3"><span className="font-bold text-sm uppercase tracking-wider text-slate-300">Cortar</span><div className="grid grid-cols-3 gap-1.5">{['original', '5:4', '4:5', '9:16', '1:1', '16:9'].map(ratio => (<button key={ratio} onClick={() => updateSettings({ cropRatio: ratio as any })} className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${selectedImage.settings.cropRatio === ratio ? 'bg-[#00FFAA] border-[#00FFAA] text-[#0E1117]' : 'border-white/10 text-slate-500 hover:border-white/20'}`}>{ratio}</button>))}</div></div>
              </div>
            </div>
            <div className="pt-6 flex justify-center w-full"><button onClick={() => setActiveTab(Tab.BRANDING)} className={`w-full max-w-md py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg border ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-[#00FFAA]' : 'bg-white border-slate-200 text-slate-900 hover:border-[#00FFAA]'}`}>Próxima Etapa: Branding <ArrowRight size={18} /></button></div>
          </div>
        )}

        {activeTab === Tab.BRANDING && selectedImage && (
          <div className="w-full max-w-md space-y-6 animate-in fade-in duration-500 px-4 md:px-0">
            {/* Seção Marca d'Água */}
            <div className={`p-6 rounded-3xl space-y-8 ${isDarkMode ? 'bg-[#161B22] border border-[#1E293B]' : 'bg-white border border-gray-200 shadow-xl'}`}>
              <div className="flex items-center gap-3 border-b border-white/5 pb-4"><Stamp size={20} className="text-[#00FFAA]" /><h3 className="text-lg font-bold">Marca d'água</h3></div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2"><Type size={14} className="text-[#00FFAA]" /><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Texto Customizado</label></div>
                  <div className="flex gap-2">
                    <input type="text" value={selectedImage.settings.watermark.text} onChange={(e) => updateWatermarkGlobal({ text: e.target.value })} className="flex-1 bg-[#0E1117] border border-white/10 rounded-xl p-3 text-sm focus:border-[#00FFAA] outline-none transition-colors" placeholder="Sua Marca Aqui" />
                    <button onClick={() => { setModalMode('watermark'); setIsBrandingModalOpen(true); }} className="bg-[#00FFAA] text-[#0E1117] px-5 rounded-xl font-bold text-xs hover:bg-[#00e699] transition-all">OK</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2"><ImageIcon size={14} className="text-[#00FFAA]" /><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logotipo (PNG/SVG)</label></div>

                  {selectedImage.settings.watermark.logo ? (
                    <div className="flex items-center justify-between p-3 bg-[#0E1117] border border-white/5 rounded-2xl group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
                          <img src={selectedImage.settings.watermark.logo} className="w-full h-full object-contain" alt="Logo" />
                        </div>
                        <span className="text-xs font-bold text-slate-400">Logotipo Carregado</span>
                      </div>
                      <div className="flex items-center gap-2 transition-opacity">
                        <button onClick={() => { setModalMode('watermark'); setIsBrandingModalOpen(true); }} className="p-2.5 bg-white/5 rounded-xl text-[#00FFAA] hover:bg-[#00FFAA]/10 transition-colors border border-white/5"><Edit2 size={16} /></button>
                        <button onClick={removeLogo} className="p-2.5 bg-white/5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors border border-white/5"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-3 w-full bg-[#0E1117] border-2 border-dashed border-white/10 rounded-xl p-3 text-sm cursor-pointer hover:border-[#00FFAA] hover:bg-[#00FFAA]/5 transition-all group overflow-hidden">
                      <Upload size={18} className="text-[#00FFAA] group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-slate-500 group-hover:text-slate-300">Selecionar Logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Seção Selos de Qualidade */}
            <div className={`p-6 rounded-3xl space-y-8 ${isDarkMode ? 'bg-[#161B22] border border-[#1E293B]' : 'bg-white border border-gray-200 shadow-xl'}`}>
              <div className="flex items-center gap-3 border-b border-white/5 pb-4"><Star size={20} className="text-[#00FFAA]" /><h3 className="text-lg font-bold">Selos de Qualidade</h3></div>

              {selectedImage.settings.badges.length > 0 && (
                <div className="space-y-3">
                  {selectedImage.settings.badges.map((badge, idx) => (
                    <div key={badge.id} className="flex items-center justify-between p-3 bg-[#0E1117] border border-white/5 rounded-2xl group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
                          <img src={badge.image} className="w-full h-full object-contain" alt={`Badge ${idx + 1}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-400">Selo #{idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-2 transition-opacity">
                        <button onClick={() => { setActiveBadgeId(badge.id); setModalMode('badge'); setIsBrandingModalOpen(true); }} className="p-2.5 bg-white/5 rounded-xl text-[#00FFAA] hover:bg-[#00FFAA]/10 transition-colors border border-white/5"><Edit2 size={16} /></button>
                        <button onClick={() => removeBadge(badge.id)} className="p-2.5 bg-white/5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors border border-white/5"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2"><ImageIcon size={14} className="text-[#00FFAA]" /><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Novo Selo (PNG)</label></div>
                <label className="flex items-center justify-center gap-3 w-full bg-[#0E1117] border-2 border-dashed border-white/10 rounded-xl p-3 text-sm cursor-pointer hover:border-[#00FFAA] hover:bg-[#00FFAA]/5 transition-all group overflow-hidden">
                  <Upload size={18} className="text-[#00FFAA] group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-500 group-hover:text-slate-300">Adicionar Selo</span>
                  <input type="file" accept="image/*" onChange={handleBadgeUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Nova Seção: Renomear Arquivo */}
            <div className={`p-6 rounded-3xl space-y-8 ${isDarkMode ? 'bg-[#161B22] border border-[#1E293B]' : 'bg-white border border-gray-200 shadow-xl'}`}>
              <div className="flex items-center gap-3 border-b border-white/5 pb-4"><FileText size={20} className="text-[#00FFAA]" /><h3 className="text-lg font-bold">Renomear Arquivo</h3></div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">FORMATO PADRÃO</label>
                  <input
                    type="text"
                    value={selectedImage.settings.naming.format}
                    onChange={(e) => updateNamingGlobal({ format: e.target.value.toUpperCase() })}
                    className="w-full bg-[#0E1117] border border-white/10 rounded-xl p-4 text-sm font-bold text-[#00FFAA] focus:border-[#00FFAA] outline-none transition-colors"
                    placeholder="IMOBI"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">POSIÇÃO</label>
                    <div className="relative">
                      <select
                        value={selectedImage.settings.naming.position}
                        onChange={(e) => updateNamingGlobal({ position: e.target.value as any })}
                        className="w-full bg-[#0E1117] border border-white/10 rounded-xl p-4 text-sm font-bold appearance-none outline-none focus:border-[#00FFAA] transition-colors"
                      >
                        <option value="after">Depois do nome</option>
                        <option value="before">Antes do nome</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">INICIAR EM</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedImage.settings.naming.startNumber}
                      onChange={(e) => updateNamingGlobal({ startNumber: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#0E1117] border border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#00FFAA] transition-colors"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0E1117]/50 border border-[#00FFAA]/10 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">RESULTADO ESPERADO</label>
                  <div className="text-lg font-mono font-bold text-[#00FFAA]">
                    {selectedImage.settings.naming.position === 'after'
                      ? `${selectedImage.settings.naming.format} ${selectedImage.settings.naming.startNumber}.jpeg`
                      : `${selectedImage.settings.naming.startNumber} ${selectedImage.settings.naming.format}.jpeg`}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-center w-full">
              <button
                onClick={() => setActiveTab(Tab.EXPORT)}
                className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg border ${isDarkMode
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-[#00FFAA]'
                  : 'bg-white border-slate-200 text-slate-900 hover:border-[#00FFAA]'
                  }`}
              >
                Ir para Exportar <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {activeTab === Tab.EXPORT && (
          <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">Revisão de Exportação</h2>
                <p className="text-slate-500 text-sm">Confira o resultado final e selecione o que baixar.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selecionar Todas</span>
                  <button
                    onClick={() => selectAllForExport(selectedForExport.size !== images.length)}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${selectedForExport.size === images.length ? 'bg-[#00FFAA]' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${selectedForExport.size === images.length ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className={`flex items-center p-1 rounded-xl ${isDarkMode ? 'bg-[#161B22] border border-[#1E293B]' : 'bg-white border border-gray-200'}`}>
                  <button onClick={() => setGridDensity('wide')} className={`p-2 rounded-lg ${gridDensity === 'wide' ? 'bg-[#00FFAA] text-[#0E1117]' : 'text-slate-500'}`}><StretchHorizontal size={18} /></button>
                  <button onClick={() => setGridDensity('normal')} className={`p-2 rounded-lg ${gridDensity === 'normal' ? 'bg-[#00FFAA] text-[#0E1117]' : 'text-slate-500'}`}><Grid2X2 size={18} /></button>
                  <button onClick={() => setGridDensity('compact')} className={`p-2 rounded-lg ${gridDensity === 'compact' ? 'bg-[#00FFAA] text-[#0E1117]' : 'text-slate-500'}`}><Grid3X3 size={18} /></button>
                </div>
              </div>
            </div>

            {images.length === 0 ? (
              <div className={`w-full h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'border-[#1E293B] bg-[#161B22]' : 'border-gray-300 bg-white'}`}>
                <Download size={32} className="text-slate-500" />
                <p className="text-slate-500">Nenhuma imagem para exportar.</p>
              </div>
            ) : (
              <>
                <div className={`grid ${getGridCols()} gap-6 mb-48`}>
                  {images.map((img, i) => {
                    const isSelected = selectedForExport.has(img.id);
                    const aspectClass = getAspectClass(img.settings.cropRatio);
                    return (
                      <div
                        key={img.id}
                        className={`relative group rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${aspectClass} ${isSelected ? 'border-[#00FFAA] shadow-[0_0_20px_rgba(0,255,170,0.15)] scale-[1.02]' : isDarkMode ? 'border-[#1E293B]' : 'border-gray-200'}`}
                        onClick={() => toggleExportSelection(img.id)}
                      >
                        <img
                          src={img.processedPreview || img.preview}
                          alt="Processed Result"
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-black/40 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                        <div className={`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-[#00FFAA] scale-100' : 'bg-white/20 scale-75 opacity-0 group-hover:opacity-100 backdrop-blur-sm'}`}>
                          {isSelected && <Check size={16} className="text-[#0E1117] stroke-[3]" />}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold text-white truncate border border-white/10 uppercase tracking-tighter">
                            {img.settings.naming.position === 'after'
                              ? `${img.settings.naming.format} ${img.settings.naming.startNumber + i}.jpeg`
                              : `${img.settings.naming.startNumber + i} ${img.settings.naming.format}.jpeg`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-[60] animate-in slide-in-from-bottom-10 duration-500`}>
                  <div className={`p-1.5 rounded-[2.5rem] border shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black/40 backdrop-blur-2xl ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    {isProcessing ? (
                      <div className="px-6 py-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#00FFAA] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00FFAA]">Processando Lote</span>
                          </div>
                          <span className="text-xs font-black text-white">{Math.round(exportProgress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00FFAA] to-[#00E6FF] shadow-[0_0_20px_rgba(0,255,170,0.5)] transition-all duration-300"
                            style={{ width: `${exportProgress}%` }}
                          />
                        </div>
                        <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">Renderizando em 4K UHD...</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleBatchExport}
                        disabled={selectedForExport.size === 0}
                        className="group relative w-full overflow-hidden bg-[#00FFAA] hover:bg-[#00ffcc] text-[#0E1117] rounded-[2.1rem] transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-6 p-4 md:p-5"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-black/10 flex items-center justify-center transition-transform group-hover:scale-110">
                          <Download size={32} className="stroke-[2.5]" />
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight">
                            BAIXAR {selectedForExport.size} FOTOS SELECIONADAS
                          </span>
                          <span className="text-xs font-bold opacity-60 tracking-[0.2em]">(.ZIP)</span>
                        </div>

                        {/* Subte Glow Effect */}
                        <div className="absolute -inset-x-20 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Branding Adjustment Modal (Watermark & Selo) */}
      {isBrandingModalOpen && selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={`w-full max-w-4xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#0E1117] border border-[#1E293B]' : 'bg-white'}`}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00FFAA]/10 flex items-center justify-center text-[#00FFAA]"><Settings size={20} /></div>
                <div><h2 className="text-lg font-bold">Ajuste de {modalMode === 'watermark' ? 'Marca d\'Água' : 'Selo de Qualidade'}</h2><p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">POSICIONAMENTO DE PRECISÃO</p></div>
              </div>
              <button onClick={() => setIsBrandingModalOpen(false)} className="p-2 rounded-full hover:bg-white/5 transition-colors text-slate-400"><X size={24} /></button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="h-2/5 md:h-1/2 p-6 flex flex-col items-center justify-center bg-black/40 relative border-b border-white/5 overflow-hidden">
                <div className="relative inline-block h-full max-w-full shadow-2xl rounded-lg overflow-hidden bg-black">
                  <img src={selectedImage.preview} alt="Base" className="h-full w-auto object-contain block" id="preview-image-node" />

                  {/* Watermark Preview */}
                  {selectedImage.settings.watermark.enabled && (
                    <div style={getBrandingPositionStyles(selectedImage.settings.watermark.position, selectedImage.settings.watermark.scale, selectedImage.settings.watermark.opacity)}>
                      {selectedImage.settings.watermark.logo ? (
                        <img src={selectedImage.settings.watermark.logo} alt="Logo" className="w-full h-auto drop-shadow-2xl" />
                      ) : (
                        <span className="text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] break-all text-xs md:text-sm lg:text-base leading-tight">{selectedImage.settings.watermark.text}</span>
                      )}
                    </div>
                  )}

                  {/* Badges Preview */}
                  {selectedImage.settings.badges.map(badge => (
                    <div key={badge.id} style={getBrandingPositionStyles(badge.position, badge.scale, badge.opacity)}>
                      <img src={badge.image} alt="Badge" className="w-full h-auto drop-shadow-2xl" />
                    </div>
                  ))}
                </div>
              </div>

              <div className={`flex-1 p-6 space-y-6 overflow-y-auto ${isDarkMode ? 'bg-[#161B22]' : 'bg-gray-50'}`}>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">POSICIONAMENTO</label>
                  <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
                    {POSITIONS_GRID.map(pos => {
                      const Icon = pos.icon;
                      const currentPos = modalMode === 'watermark' ? selectedImage.settings.watermark.position : currentModalBadge?.position;
                      const isActive = currentPos === pos.id;
                      return (
                        <button
                          key={pos.id}
                          title={pos.label}
                          onClick={() => modalMode === 'watermark' ? updateWatermarkGlobal({ position: pos.id }) : updateBadgeGlobal(activeBadgeId!, { position: pos.id })}
                          className={`aspect-square w-14 rounded-2xl flex items-center justify-center transition-all border ${isActive
                            ? 'bg-[#00FFAA] border-[#00FFAA] text-[#0E1117] shadow-[0_0_15px_rgba(0,255,170,0.3)]'
                            : 'bg-[#0E1117] border-white/5 text-slate-500 hover:border-white/20'
                            }`}
                        >
                          <Icon size={isActive ? 22 : 18} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ESCALA DE TAMANHO PROPORCIONAL</label>
                      <span className="text-xs font-bold text-[#00FFAA]">{modalMode === 'watermark' ? selectedImage.settings.watermark.scale : currentModalBadge?.scale}%</span>
                    </div>
                    <input type="range" min="5" max="90" value={modalMode === 'watermark' ? selectedImage.settings.watermark.scale : currentModalBadge?.scale || 15} onChange={(e) => modalMode === 'watermark' ? updateWatermarkGlobal({ scale: parseInt(e.target.value) }) : updateBadgeGlobal(activeBadgeId!, { scale: parseInt(e.target.value) })} className="w-full h-1.5 bg-[#0E1117] rounded-full appearance-none accent-[#00FFAA] cursor-pointer" />
                    <div className="flex justify-between text-[8px] text-slate-500 font-bold"><span>MÍN (5%)</span><span>MÁX (90%)</span></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">OPACIDADE MASTER</label>
                      <span className="text-xs font-bold text-[#00FFAA]">{modalMode === 'watermark' ? selectedImage.settings.watermark.opacity : currentModalBadge?.opacity}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={modalMode === 'watermark' ? selectedImage.settings.watermark.opacity : currentModalBadge?.opacity || 100} onChange={(e) => modalMode === 'watermark' ? updateWatermarkGlobal({ opacity: parseInt(e.target.value) }) : updateBadgeGlobal(activeBadgeId!, { opacity: parseInt(e.target.value) })} className="w-full h-1.5 bg-[#0E1117] rounded-full appearance-none accent-[#00FFAA] cursor-pointer" />
                    <div className="flex justify-between text-[8px] text-slate-500 font-bold"><span>INVISÍVEL</span><span>SÓLIDO</span></div>
                  </div>
                </div>

                <div className="pt-6 flex justify-center"><button onClick={() => setIsBrandingModalOpen(false)} className="w-full max-w-sm bg-[#00FFAA] text-[#0E1117] py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 hover:bg-[#00e699] transition-all">Confirmar Ajustes</button></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="py-8 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em] px-6">
        Desenvolvido por Amigo Corretor 2025 ImobStudio
      </footer>
    </div>
  );
};

export default Dashboard;
