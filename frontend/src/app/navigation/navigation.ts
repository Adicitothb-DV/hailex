export const navigation = [
  { id: 'dashboard', label: 'Dashboard', description: 'Tu espacio de trabajo' },
  { id: 'earth-explorer', label: 'Earth Explorer', description: 'Ubicación y contexto' },
  {
    id: 'climate-intelligence',
    label: 'Climate Intelligence',
    description: 'Clima y observaciones',
  },
  { id: 'rotation-studio', label: 'Parcel Monitoring', description: 'Monitoreo de parcela' },
  { id: 'analysis-insights', label: 'Agricultural Context', description: 'Historial agrícola' },
] as const;

export type ScreenId = (typeof navigation)[number]['id'];

export function resolveScreen(hash: string) {
  if (hash === '' || hash === '#' || hash === '#/') return navigation[0];
  return navigation.find((item) => `#/${item.id}` === hash) ?? null;
}
