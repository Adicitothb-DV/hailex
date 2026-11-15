export const navigation = [
  { id: 'dashboard', label: 'Dashboard', description: 'Tu espacio de trabajo' },
  { id: 'earth-explorer', label: 'Earth Explorer', description: 'Ubicación y contexto' },
  {
    id: 'climate-intelligence',
    label: 'Climate Intelligence',
    description: 'Clima y observaciones',
  },
  { id: 'rotation-studio', label: 'Parcel Monitoring', description: 'Monitoreo de parcela' },
  { id: 'pest-monitor', label: 'Monitor fitosanitario', description: 'Plagas y escenarios' },
  { id: 'analysis-insights', label: 'Asesor Agrícola', description: 'Perfil y rotación' },
] as const;

export type ScreenId = (typeof navigation)[number]['id'];

export function resolveScreen(hash: string) {
  if (hash === '' || hash === '#' || hash === '#/') return navigation[0];
  return navigation.find((item) => `#/${item.id}` === hash) ?? null;
}
