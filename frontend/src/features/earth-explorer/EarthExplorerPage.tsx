import { useEffect, useRef, useState, type FormEvent } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useApp } from '../../app/AppContext';
import { LocationSelect } from '../../components/LocationSelect';
import { PageHeading } from '../../components/PageHeading';
import { StatusBadge } from '../../components/Shared';
import { useTranslation } from 'react-i18next';

maplibregl.setWorkerUrl(workerUrl);

export function EarthExplorerPage() {
  const { t } = useTranslation();
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
      setError('coordinateValidation');
      return;
    }
    setError('');
    setLocation({ label: 'Punto personalizado', latitude, longitude, type: 'custom' });
  }
  return (
    <>
      <PageHeading
        eyebrow={t('geoContext')}
        title={t('earth-explorer')}
        description={t('geoDescription')}
      />
      <div className="explorer-v2">
        <section className="map-card">
          <div className="map-heading">
            <div>
              <p className="eyebrow">{t('studyPoint')}</p>
              <h2>{t('exploreTerritory')}</h2>
            </div>
            <StatusBadge variant="info">{t('vectorMap')}</StatusBadge>
          </div>
          <div className="map-wrap">
            <div ref={container} className="map-canvas" aria-label={t('mapAccessible')} />
            {mapStatus === 'loading' && (
              <div className="map-overlay" role="status">
                {t('mapLoading')}
              </div>
            )}
            {mapStatus === 'error' && (
              <div className="map-warning" role="status">
                {t('mapUnavailable')}
              </div>
            )}
          </div>
          <p className="map-caption">{t('mapCaption')}</p>
        </section>
        <aside className="surface location-panel">
          <p className="eyebrow">{t('activeLocation')}</p>
          <h2>{t('pointDetails')}</h2>
          <LocationSelect />
          <form
            key={`${location.latitude},${location.longitude}`}
            onSubmit={submit}
            className="coordinate-form"
          >
            <label className="field">
              {t('latitude')}
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
              {t('longitude')}
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
            {error && <p role="alert">{t(error)}</p>}
            <button className="button button-primary" type="submit">
              {t('useCoordinates')}
            </button>
          </form>
          <dl className="detail-list">
            <div>
              <dt>{t('type')}</dt>
              <dd>{t(location.type === 'custom' ? 'customPoint' : 'municipalReference')}</dd>
            </div>
            <div>
              <dt>{t('marker')}</dt>
              <dd>{t('selectedLocation')}</dd>
            </div>
            <div>
              <dt>{t('scientificLayers')}</dt>
              <dd>{t('notIntegrated')}</dd>
            </div>
          </dl>
          <p className="fine-print">{t('municipalDisclaimer')}</p>
        </aside>
      </div>
    </>
  );
}
