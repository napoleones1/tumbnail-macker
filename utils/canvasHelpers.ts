
/**
 * Removes background color from an image (Chroma Keying or White removal)
 */
export const processImageBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: 'green' | 'white',
  threshold: number = 50
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (mode === 'green') {
      // Basic Green Screen removal
      if (g > 100 && g > r * 1.2 && g > b * 1.2) {
        data[i + 3] = 0;
      }
    } else if (mode === 'white') {
      // White Background removal
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Draws a glowing outline around a non-transparent shape
 */
export const drawGlowOutline = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color: string,
  blur: number = 15,
  thickness: number = 5
) => {
  ctx.save();
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;
  
  // We use a trick: draw the image multiple times as a shadow
  // Since we only want the outline, we'll use destination-out to clear the center later if needed,
  // or just draw the main image on top.
  ctx.restore();
};

/**
 * Applies a cinematic vignette
 */
export const drawVignette = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, width / 4,
    width / 2, height / 2, width / 1.2
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

/**
 * Renders metallic gold text with bevel effect
 */
export const drawGoldText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  maxWidth: number
) => {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `900 ${fontSize}px "Cinzel"`;
  
  // Main Gold Gradient
  const grad = ctx.createLinearGradient(x, y - fontSize, x, y);
  grad.addColorStop(0, '#fef08a'); // text-yellow-200
  grad.addColorStop(0.5, '#eab308'); // text-yellow-500
  grad.addColorStop(1, '#a16207'); // text-yellow-800
  
  // Outer Shadow for readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  
  // Text Stroke
  ctx.strokeStyle = '#422006';
  ctx.lineWidth = 4;
  ctx.strokeText(text, x, y, maxWidth);
  
  // Fill Text
  ctx.fillStyle = grad;
  ctx.fillText(text, x, y, maxWidth);
  
  // Inner Shine (Fake Bevel)
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText(text, x, y - 2, maxWidth);

  ctx.restore();
};
