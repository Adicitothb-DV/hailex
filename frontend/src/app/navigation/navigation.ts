export const navigation = [
  { id: 'dashboard', label: 'Dashboard', description: 'Tu espacio de trabajo' },
  { id: 'earth-explorer', label: 'Earth Explorer', description: 'Ubicación y contexto' },
  {
    id: 'climate-intelligence',
    label: 'Climate Intelligence',
    description: 'Clima y observaciones',
  },
  { id: 'rotation-studio', label: 'Rotation Studio', description: 'Explora alternativas' },
  { id: 'analysis-insights', label: 'Analysis & Insights', description: 'Evidencia y explicación' },
] as const;

export type ScreenId = (typeof navigation)[number]['id'];

export function resolveScreen(hash: string) {
  if (hash === '' || hash === '#' || hash === '#/') return navigation[0];
  return navigation.find((item) => `#/${item.id}` === hash) ?? null;
}
