import { useEffect, useRef, useState, type FormEvent } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useApp } from '../../app/AppContext';
import { LocationSelect } from '../../components/LocationSelect';
import { PageHeading } from '../../components/PageHeading';
import { StatusBadge } from '../../components/Shared';

maplibregl.setWorkerUrl(workerUrl);

export function EarthExplorerPage() {
  const { location, setLocation } = useApp();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  useEffect(() => {
    marker.current?.setLngLat([location.longitude, location.latitude]);
    map.current?.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 9,
      essential: false,
    });
  }, [location]);
  useEffect(() => {
    if (!container.current) return;
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [location.longitude, location.latitude],
        zoom: 9,
      });
      map.current = instance;
      marker.current = new maplibregl.Marker({ color: '#315944' })
        .setLngLat([location.longitude, location.latitude])
        .addTo(instance);
      instance.addControl(new maplibregl.NavigationControl(), 'top-right');
      instance.on('load', () => setMapStatus('ready'));
      instance.on('error', () => setMapStatus('error'));
      instance.on('click', (event) =>
        setLocation({
          label: 'Punto personalizado',
          latitude: Number(event.lngLat.lat.toFixed(8)),
          longitude: Number(event.lngLat.lng.toFixed(8)),
          type: 'custom',
        }),
      );
    } catch {
      queueMicrotask(() => setMapStatus('error'));
      return;
    }
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // Map is created once; the location synchronization effect updates its marker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLocation]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lat = String(form.get('latitude') ?? ''),
      lon = String(form.get('longitude') ?? '');
    const latitude = Number(lat),
      longitude = Number(lon);
    if (
      !lat.trim() ||
      !lon.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      setError('Introduce latitud entre -90 y 90 y longitud entre -180 y 180.');
      return;
    }
    setError('');
    setLocation({ label: 'Punto personalizado', latitude, longitude, type: 'custom' });
  }
  return (
    <>
      <PageHeading
        eyebrow="CONTEXTO GEOESPACIAL"
        title="Earth Explorer"
        description="Selecciona un punto para explorar el contexto climático. No representa una parcela medida."
      />
      <div className="explorer-v2">
        <section className="map-card">
          <div className="map-heading">
            <div>
              <p className="eyebrow">PUNTO DE ESTUDIO</p>
              <h2>Explora el territorio</h2>
            </div>
            <StatusBadge variant="info">Mapa vectorial</StatusBadge>
          </div>
          <div className="map-wrap">
            <div
              ref={container}
              className="map-canvas"
              aria-label="Mapa de selección de ubicación. También puedes introducir coordenadas manualmente."
            />
            {mapStatus === 'loading' && (
              <div className="map-overlay" role="status">
                Cargando mapa…
              </div>
            )}
            {mapStatus === 'error' && (
              <div className="map-warning" role="status">
                Mapa o recurso cartográfico no disponible. Puedes introducir coordenadas
                manualmente.
              </div>
            )}
          </div>
          <p className="map-caption">
            Haz clic en el mapa para seleccionar un punto. Cartografía: OpenFreeMap y OpenStreetMap;
            atribución completa dentro del mapa. No son imágenes satelitales.
          </p>
        </section>
        <aside className="surface location-panel">
          <p className="eyebrow">UBICACIÓN ACTIVA</p>
          <h2>Detalles del punto</h2>
          <LocationSelect />
          <form
            key={`${location.latitude},${location.longitude}`}
            onSubmit={submit}
            className="coordinate-form"
          >
            <label className="field">
              Latitud
              <input
                name="latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                defaultValue={location.latitude}
                required
              />
            </label>
            <label className="field">
              Longitud
              <input
                name="longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                defaultValue={location.longitude}
                required
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button className="button button-primary" type="submit">
              Usar coordenadas
            </button>
          </form>
          <dl className="detail-list">
            <div>
              <dt>Tipo</dt>
              <dd>{location.type === 'custom' ? 'Punto personalizado' : 'Referencia municipal'}</dd>
            </div>
            <div>
              <dt>Marcador</dt>
              <dd>Ubicación seleccionada</dd>
            </div>
            <div>
              <dt>Capas científicas</dt>
              <dd>No integradas</dd>
            </div>
          </dl>
          <p className="fine-print">
            Las cabeceras son referencias municipales, no parcelas. El datum de las coordenadas de
            origen no está verificado.
          </p>
        </aside>
      </div>
    </>
  );
}
