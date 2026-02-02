
import { EditSettings, WatermarkSettings, BadgeSettings } from '../types';

export const processImage = async (
  imgElement: HTMLImageElement,
  settings: EditSettings,
  targetWidth?: number
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = imgElement.naturalWidth;
  let sourceHeight = imgElement.naturalHeight;

  // 1. Calculate Crop Bounds
  if (settings.cropRatio !== 'original') {
    const [rw, rh] = settings.cropRatio.split(':').map(Number);
    const targetAspect = rw / rh;
    const currentAspect = sourceWidth / sourceHeight;

    if (currentAspect > targetAspect) {
      const newWidth = sourceHeight * targetAspect;
      sourceX = (sourceWidth - newWidth) / 2;
      sourceWidth = newWidth;
    } else {
      const newHeight = sourceWidth / targetAspect;
      sourceY = (sourceHeight - newHeight) / 2;
      sourceHeight = newHeight;
    }
  }

  // 2. Determine Canvas Output Size
  let canvasWidth = sourceWidth;
  let canvasHeight = sourceHeight;

  if (targetWidth) {
    const ratio = targetWidth / canvasWidth;
    canvasWidth = targetWidth;
    canvasHeight = canvasHeight * ratio;
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // 3. Perspective Correction (Auto-Align)
  if (settings.aligned) {
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    const skew = 0.05; 
    ctx.transform(1, skew, 0, 1, 0, 0); 
    ctx.scale(1.1, 1.1);
    ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
    ctx.drawImage(imgElement, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  } else {
    ctx.drawImage(imgElement, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvasWidth, canvasHeight);
  }

  // 4. Color Enhancement (Optimize)
  if (settings.optimized) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.filter = `brightness(105%) contrast(110%) saturate(112%)`;
      tempCtx.drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }

  // 5. Unsharp Mask
  if (settings.sharpness > 0) {
    const amount = settings.sharpness / 150; 
    const kernel = [0, -amount, 0, -amount, 1 + 4 * amount, -amount, 0, -amount, 0];
    applyConvolution(ctx, canvasWidth, canvasHeight, kernel);
  }

  // 6. Watermark
  if (settings.watermark.enabled) {
    await drawBrandingElement(ctx, canvasWidth, canvasHeight, settings.watermark, 'watermark');
  }

  // 7. Badges (Selos)
  for (const badge of settings.badges) {
    if (badge.enabled && badge.image) {
      await drawBrandingElement(ctx, canvasWidth, canvasHeight, badge, 'badge');
    }
  }

  return canvas.toDataURL('image/jpeg', 0.9);
};

const applyConvolution = (ctx: CanvasRenderingContext2D, w: number, h: number, weights: number[]) => {
  const side = 3;
  const sw = w;
  const sh = h;
  const output = ctx.createImageData(w, h);
  const dst = output.data;
  const src = ctx.getImageData(0, 0, w, h);
  const pixels = src.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dstOff = (y * w + x) * 4;
      let r = 0, g = 0, b = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - 1;
          const scx = x + cx - 1;
          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = (scy * sw + scx) * 4;
            const wt = weights[cy * side + cx];
            r += pixels[srcOff] * wt;
            g += pixels[srcOff + 1] * wt;
            b += pixels[srcOff + 2] * wt;
          }
        }
      }
      dst[dstOff] = Math.min(255, Math.max(0, r));
      dst[dstOff + 1] = Math.min(255, Math.max(0, g));
      dst[dstOff + 2] = Math.min(255, Math.max(0, b));
      dst[dstOff + 3] = pixels[dstOff + 3];
    }
  }
  ctx.putImageData(output, 0, 0);
};

const drawBrandingElement = async (ctx: CanvasRenderingContext2D, w: number, h: number, branding: WatermarkSettings | BadgeSettings, type: 'watermark' | 'badge') => {
  ctx.save();
  ctx.globalAlpha = branding.opacity / 100;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 10;

  const imageSrc = type === 'watermark' ? (branding as WatermarkSettings).logo : (branding as BadgeSettings).image;
  
  if (imageSrc) {
    const elementImg = new Image();
    elementImg.src = imageSrc;
    await new Promise((resolve) => { elementImg.onload = resolve; });
    
    const aspect = elementImg.width / elementImg.height;
    const targetWidth = (w * branding.scale) / 100;
    const targetHeight = targetWidth / aspect;
    
    let x = 0, y = 0;

    switch (branding.position) {
      case 'top-left': x = 0; y = 0; break;
      case 'top-center': x = (w - targetWidth) / 2; y = 0; break;
      case 'top-right': x = w - targetWidth; y = 0; break;
      case 'middle-left': x = 0; y = (h - targetHeight) / 2; break;
      case 'center': x = (w - targetWidth) / 2; y = (h - targetHeight) / 2; break;
      case 'middle-right': x = w - targetWidth; y = (h - targetHeight) / 2; break;
      case 'bottom-left': x = 0; y = h - targetHeight; break;
      case 'bottom-center': x = (w - targetWidth) / 2; y = h - targetHeight; break;
      case 'bottom-right': x = w - targetWidth; y = h - targetHeight; break;
    }

    ctx.drawImage(elementImg, x + (branding.offsetX || 0), y + (branding.offsetY || 0), targetWidth, targetHeight);
  } else if (type === 'watermark' && (branding as WatermarkSettings).text) {
    const textBranding = branding as WatermarkSettings;
    const fontSize = (w * textBranding.scale) / 100;
    ctx.font = `bold ${fontSize}px Inter`;
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'middle';
    
    const textMetrics = ctx.measureText(textBranding.text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    
    let x = 0, y = 0;
    switch (textBranding.position) {
      case 'top-left': x = 0; y = textHeight / 2; break;
      case 'top-center': x = (w - textWidth) / 2; y = textHeight / 2; break;
      case 'top-right': x = w - textWidth; y = textHeight / 2; break;
      case 'middle-left': x = 0; y = h / 2; break;
      case 'center': x = (w - textWidth) / 2; y = h / 2; break;
      case 'middle-right': x = w - textWidth; y = h / 2; break;
      case 'bottom-left': x = 0; y = h - textHeight / 2; break;
      case 'bottom-center': x = (w - textWidth) / 2; y = h - textHeight / 2; break;
      case 'bottom-right': x = w - textWidth; y = h - textHeight / 2; break;
    }

    ctx.fillText(textBranding.text, x + textBranding.offsetX, y + textBranding.offsetY);
  }
  
  ctx.restore();
};
