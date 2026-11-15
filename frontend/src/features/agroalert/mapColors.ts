import type { Palette } from './types';

const palettes: Record<Palette, [number, string][]> = {
  agro: [
    [0, '#dc2626'],
    [0.24, '#f97316'],
    [0.48, '#facc15'],
    [0.72, '#10b981'],
    [0.88, '#0ea5e9'],
    [1, '#1d4ed8'],
  ],
  thermal: [
    [0, '#dc2626'],
    [0.25, '#ea580c'],
    [0.5, '#eab308'],
    [0.75, '#16a34a'],
    [1, '#2563eb'],
  ],
  nasa_smap: [
    [0, '#b4691e'],
    [0.25, '#dfc27d'],
    [0.48, '#f5f5dc'],
    [0.7, '#5ec4b6'],
    [0.88, '#018571'],
    [1, '#084594'],
  ],
  vivid: [
    [0, '#be123c'],
    [0.25, '#f97316'],
    [0.5, '#facc15'],
    [0.75, '#06b6d4'],
    [1, '#4338ca'],
  ],
};

export function gradient(palette: Palette): string {
  return `linear-gradient(90deg, ${palettes[palette].map(([position, color]) => `${color} ${position * 100}%`).join(', ')})`;
}

export function colorFor(value: number | null, min: number, max: number, palette: Palette): string {
  if (value == null) return '#94a3b8';
  const x = max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const stops = palettes[palette];
  const index = Math.min(
    stops.findIndex(([p]) => p >= x),
    stops.length - 1,
  );
  if (index <= 0) return stops[0]?.[1] ?? '#94a3b8';
  const [a, ca] = stops[index - 1] ?? [0, '#94a3b8'],
    [b, cb] = stops[index] ?? [1, '#94a3b8'];
  const fraction = (x - a) / (b - a);
  const channels = [1, 3, 5].map((offset) => {
    const start = parseInt(ca.slice(offset, offset + 2), 16);
    const end = parseInt(cb.slice(offset, offset + 2), 16);
    return Math.round(start + (end - start) * fraction)
      .toString(16)
      .padStart(2, '0');
  });
  return `#${channels.join('')}`;
}
