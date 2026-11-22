import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../services/api';
import { locations, type StudyLocation } from '../data/locations';
import type { ClimateSeries, Envelope, SourceEntry } from '../types/api';
import type { FieldAnalysis, PolygonGeometry } from '../types/monitoring';

export interface ParcelDraft {
  latitude: string;
  longitude: string;
  municipality: string;
  currentCrop: string;
  soil: string;
  soilSource: 'user_input' | 'cartographic_reference';
  soilReference: string;
  water: 'unknown' | 'rainfed' | 'irrigated';
  restrictions: string;
}

type Connection = 'loading' | 'connected' | 'disconnected';
type ClimateState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  result: Envelope<ClimateSeries> | null;
  error: string;
};
interface ContextValue {
  location: StudyLocation;
  setLocation: (location: StudyLocation) => void;
  connection: Connection;
  sources: SourceEntry[] | null;
  sourcesError: string;
  refreshConnection: () => void;
  climate: ClimateState;
  queryClimate: (start: string, end: string) => Promise<void>;
  selectedCrop: string;
  setSelectedCrop: (value: string) => void;
  selectedCropName: string;
  setSelectedCropName: (value: string) => void;
  parcel: ParcelDraft;
  setParcel: (value: ParcelDraft) => void;
  fieldGeometry: PolygonGeometry | null;
  setFieldGeometry: (value: PolygonGeometry | null) => void;
  fieldAnalysis: FieldAnalysis | null;
  setFieldAnalysis: (value: FieldAnalysis | null) => void;
}
const Context = createContext<ContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<StudyLocation>(locations[0]!);
  const [connection, setConnection] = useState<Connection>('loading');
  const [sources, setSources] = useState<SourceEntry[] | null>(null);
  const [sourcesError, setSourcesError] = useState('');
  const [climate, setClimate] = useState<ClimateState>({ status: 'idle', result: null, error: '' });
  const [refresh, setRefresh] = useState(0);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedCropName, setSelectedCropName] = useState('');
  const [fieldGeometry, setFieldGeometryState] = useState<PolygonGeometry | null>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('hailex-field-geometry') || 'null');
      if (
        value &&
        typeof value === 'object' &&
        'type' in value &&
        value.type === 'Polygon' &&
        'coordinates' in value &&
        Array.isArray(value.coordinates)
      )
        return value as PolygonGeometry;
    } catch {
      /* Storage may be disabled. */
    }
    return null;
  });
  const [fieldAnalysis, setFieldAnalysis] = useState<FieldAnalysis | null>(null);
  const setFieldGeometry = useCallback((value: PolygonGeometry | null) => {
    setFieldGeometryState(value);
    setFieldAnalysis(null);
    try {
      if (value) localStorage.setItem('hailex-field-geometry', JSON.stringify(value));
      else localStorage.removeItem('hailex-field-geometry');
    } catch {
      /* Storage is optional. */
    }
  }, []);
  const [parcel, setParcel] = useState<ParcelDraft>({
    latitude: '',
    longitude: '',
    municipality: '',
    currentCrop: '',
    soil: '',
    soilSource: 'user_input',
    soilReference: '',
    water: 'unknown',
    restrictions: '',
  });
  const activeRequest = useRef<AbortController | null>(null);
  const setLocation = useCallback((next: StudyLocation) => {
    activeRequest.current?.abort();
    setLocationState(next);
    setClimate({ status: 'idle', result: null, error: '' });
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api
      .health(controller.signal)
      .then(({ data }) =>
        setConnection(
          data.status === 'ok' && data.service === 'hailex-api' ? 'connected' : 'disconnected',
        ),
      )
      .catch(() => {
        if (!controller.signal.aborted) setConnection('disconnected');
      });
    api
      .sources(controller.signal)
      .then(({ data }) => {
        setSources(data.sources);
        setSourcesError('');
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSources(null);
          setSourcesError('No se pudo consultar la disponibilidad de fuentes.');
        }
      });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => () => activeRequest.current?.abort(), []);
  const queryClimate = useCallback(
    async (start: string, end: string) => {
      activeRequest.current?.abort();
      const controller = new AbortController();
      activeRequest.current = controller;
      setClimate({ status: 'loading', result: null, error: '' });
      try {
        const result = await api.climate(
          location.latitude,
          location.longitude,
          start,
          end,
          controller.signal,
        );
        if (!controller.signal.aborted) setClimate({ status: 'success', result, error: '' });
      } catch (error) {
        if (!controller.signal.aborted)
          setClimate({
            status: 'error',
            result: null,
            error: error instanceof Error ? error.message : 'No se pudo consultar el clima.',
          });
      }
    },
    [location],
  );
  const refreshConnection = useCallback(() => {
    setConnection('loading');
    setRefresh((n) => n + 1);
  }, []);
  const value = useMemo(
    () => ({
      location,
      setLocation,
      connection,
      sources,
      sourcesError,
      refreshConnection,
      climate,
      queryClimate,
      selectedCrop,
      setSelectedCrop,
      selectedCropName,
      setSelectedCropName,
      parcel,
      setParcel,
      fieldGeometry,
      setFieldGeometry,
      fieldAnalysis,
      setFieldAnalysis,
    }),
    [
      location,
      setLocation,
      connection,
      sources,
      sourcesError,
      refreshConnection,
      climate,
      queryClimate,
      selectedCrop,
      selectedCropName,
      parcel,
      fieldGeometry,
      setFieldGeometry,
      fieldAnalysis,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
// The context hook intentionally shares the provider module to keep its type private.
// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('Falta AppProvider');
  return value;
}
