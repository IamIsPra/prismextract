/**
 * Color extraction utilities for image processing
 * Uses median cut algorithm for color quantization
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorInfo {
  id: string;
  rgb: RGB;
  hex: string;
  count: number;
}

/**
 * Convert RGB to HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Extract dominant colors from an image using median cut algorithm
 * @param imageFile - The image file to process
 * @param colorCount - Number of colors to extract (default: 6)
 * @returns Promise resolving to an array of exactly colorCount colors
 */
export async function extractColors(
  imageFile: File,
  colorCount: number = 6
): Promise<ColorInfo[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Resize image for faster processing (max 200px)
          const maxSize = 200;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Extract pixels
          const pixels: RGB[] = [];
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            
            // Skip transparent and very light/dark pixels
            if (a > 125 && !(r > 240 && g > 240 && b > 240) && !(r < 15 && g < 15 && b < 15)) {
              pixels.push({ r, g, b });
            }
          }

          // Apply median cut algorithm
          // Calculate depth: 2^depth = colorCount, so depth = log2(colorCount)
          const depth = Math.ceil(Math.log2(colorCount));
          const colors = medianCut(pixels, depth);
          
          // Ensure we have exactly the requested number of colors
          const finalColors = colors.slice(0, colorCount);
          
          // Convert to ColorInfo format
          const colorInfos: ColorInfo[] = finalColors.map((color, index) => ({
            id: crypto.randomUUID(),
            rgb: color,
            hex: rgbToHex(color.r, color.g, color.b),
            count: index
          }));

          resolve(colorInfos);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Median cut algorithm for color quantization
 */
function medianCut(pixels: RGB[], depth: number): RGB[] {
  if (depth === 0 || pixels.length === 0) {
    return [averageColor(pixels)];
  }

  // Find the channel with the greatest range
  const ranges = {
    r: { min: 255, max: 0 },
    g: { min: 255, max: 0 },
    b: { min: 255, max: 0 }
  };

  pixels.forEach(pixel => {
    ranges.r.min = Math.min(ranges.r.min, pixel.r);
    ranges.r.max = Math.max(ranges.r.max, pixel.r);
    ranges.g.min = Math.min(ranges.g.min, pixel.g);
    ranges.g.max = Math.max(ranges.g.max, pixel.g);
    ranges.b.min = Math.min(ranges.b.min, pixel.b);
    ranges.b.max = Math.max(ranges.b.max, pixel.b);
  });

  const rRange = ranges.r.max - ranges.r.min;
  const gRange = ranges.g.max - ranges.g.min;
  const bRange = ranges.b.max - ranges.b.min;

  const maxRange = Math.max(rRange, gRange, bRange);
  let channel: 'r' | 'g' | 'b' = 'r';
  
  if (maxRange === gRange) channel = 'g';
  else if (maxRange === bRange) channel = 'b';

  // Sort by the channel with greatest range
  pixels.sort((a, b) => a[channel] - b[channel]);

  // Split at median
  const mid = Math.floor(pixels.length / 2);
  
  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1)
  ];
}

/**
 * Calculate average color from pixels
 */
function averageColor(pixels: RGB[]): RGB {
  if (pixels.length === 0) {
    return { r: 0, g: 0, b: 0 };
  }

  const sum = pixels.reduce(
    (acc, pixel) => ({
      r: acc.r + pixel.r,
      g: acc.g + pixel.g,
      b: acc.b + pixel.b
    }),
    { r: 0, g: 0, b: 0 }
  );

  return {
    r: Math.round(sum.r / pixels.length),
    g: Math.round(sum.g / pixels.length),
    b: Math.round(sum.b / pixels.length)
  };
}

/**
 * Generate CSS linear gradient from colors
 */
export function generateGradient(
  colors: ColorInfo[],
  angle: number,
  stops: number[]
): string {
  const colorStops = colors
    .map((color, index) => `${color.hex} ${stops[index]}%`)
    .join(', ');
  
  return `linear-gradient(${angle}deg, ${colorStops})`;
}
