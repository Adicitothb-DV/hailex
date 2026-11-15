export interface StudyLocation {
  label: string;
  latitude: number;
  longitude: number;
  type: 'municipal_reference_point' | 'custom';
}
// Municipal reference points documented in docs/DATA_SOURCES.md; source datum not verified.
export const locations: StudyLocation[] = [
  {
    label: 'La Cañada, El Marqués',
    latitude: 20.60656972,
    longitude: -100.33109667,
    type: 'municipal_reference_point',
  },
  {
    label: 'Colón, Colón',
    latitude: 20.78832639,
    longitude: -100.04543056,
    type: 'municipal_reference_point',
  },
];
