import React, { useState } from 'react';
import { Copy, RefreshCw, Palette } from 'lucide-react';

type ColorFormat = 'hex' | 'rgb' | 'hsl';
type Range = 'low' | 'medium' | 'high';

interface ColorBlock {
  id: string;
  value: string;
}

interface RangeValues {
  low: [number, number];
  medium: [number, number];
  high: [number, number];
}

const SATURATION_RANGES: RangeValues = {
  low: [20, 40],
  medium: [50, 70],
  high: [80, 100],
};

const LIGHTNESS_RANGES: RangeValues = {
  low: [20, 40],
  medium: [45, 65],
  high: [70, 90],
};

function App() {
  const [colors, setColors] = useState<ColorBlock[]>([]);
  const [count, setCount] = useState(5);
  const [baseHue, setBaseHue] = useState(0);
  const [format, setFormat] = useState<ColorFormat>('hex');
  const [opacity, setOpacity] = useState(100);
  const [saturationRange, setSaturationRange] = useState<Range>('medium');
  const [lightnessRange, setLightnessRange] = useState<Range>('medium');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const generateColors = () => {
    const newColors: ColorBlock[] = [];
    for (let i = 0; i < count; i++) {
      const hue = (baseHue + Math.random() * 60 - 30 + 360) % 360;
      const [minSat, maxSat] = SATURATION_RANGES[saturationRange];
      const [minLight, maxLight] = LIGHTNESS_RANGES[lightnessRange];
      
      const saturation = minSat + Math.random() * (maxSat - minSat);
      const lightness = minLight + Math.random() * (maxLight - minLight);
      const alpha = opacity / 100;

      let colorValue = '';
      switch (format) {
        case 'hex':
          const rgbColor = hslToRgb(hue, saturation, lightness);
          colorValue = rgbToHex(...rgbColor, alpha);
          break;
        case 'rgb':
          const [r, g, b] = hslToRgb(hue, saturation, lightness);
          colorValue = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          break;
        case 'hsl':
          colorValue = `hsla(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(
            lightness
          )}%, ${alpha})`;
          break;
      }

      newColors.push({ id: crypto.randomUUID(), value: colorValue });
    }
    setColors(newColors);
  };

  const copyToClipboard = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 1500);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  };

  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4)),
    ];
  };

  const rgbToHex = (r: number, g: number, b: number, a: number): string => {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    const alpha = Math.round(a * 255);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha < 255 ? toHex(alpha) : ''}`;
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      style={{
        backgroundImage: `
          radial-gradient(circle at 100% 0%, rgba(192, 132, 252, 0.1) 0%, transparent 25%),
          radial-gradient(circle at 0% 100%, rgba(244, 114, 182, 0.1) 0%, transparent 25%)
        `
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-3 mb-12 relative">
          <div className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          <Palette className="w-12 h-12 text-purple-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            随机颜色生成器
          </h1>
        </div>
        
        <div className="relative bg-white/70 rounded-2xl shadow-xl p-8 mb-12 backdrop-blur-xl border border-white/50">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生成数量
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={count}
                    onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-3 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    个
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  基础色相
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={baseHue}
                    onChange={(e) => setBaseHue(parseInt(e.target.value))}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, 
                        hsl(0, 70%, 60%),
                        hsl(60, 70%, 60%),
                        hsl(120, 70%, 60%),
                        hsl(180, 70%, 60%),
                        hsl(240, 70%, 60%),
                        hsl(300, 70%, 60%),
                        hsl(360, 70%, 60%))`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0°</span>
                    <span>{baseHue}°</span>
                    <span>360°</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  饱和度范围
                </label>
                <select
                  value={saturationRange}
                  onChange={(e) => setSaturationRange(e.target.value as Range)}
                  className="w-full px-4 py-3 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="low">低饱和度 (20-40%)</option>
                  <option value="medium">中等饱和度 (50-70%)</option>
                  <option value="high">高饱和度 (80-100%)</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  亮度范围
                </label>
                <select
                  value={lightnessRange}
                  onChange={(e) => setLightnessRange(e.target.value as Range)}
                  className="w-full px-4 py-3 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="low">低亮度 (20-40%)</option>
                  <option value="medium">中等亮度 (45-65%)</option>
                  <option value="high">高亮度 (70-90%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  颜色格式
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ColorFormat)}
                  className="w-full px-4 py-3 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="hex">HEX</option>
                  <option value="rgb">RGB</option>
                  <option value="hsl">HSL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  透明度
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(parseInt(e.target.value))}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-200 to-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>{opacity}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={generateColors}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <RefreshCw className="w-6 h-6 mr-2" />
                生成颜色
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => copyToClipboard(color.value)}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: color.value }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl flex items-center space-x-2 shadow-xl transform scale-90 group-hover:scale-100 transition-all duration-300">
                  <Copy className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {copiedColor === color.value ? '已复制！' : '复制'}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-xs font-medium text-gray-800 break-all">
                    {color.value}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;