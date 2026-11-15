import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import { useApp } from '../../app/AppContext';
import { LocationSelect } from '../../components/LocationSelect';
import { PageHeading } from '../../components/PageHeading';
import { api, apiBase } from '../../services/api';
import type { FieldMetrics, PolygonGeometry, SavedAnalysis, Scene } from '../../types/monitoring';
import type { ClimateSeries, VariableId } from '../../types/api';

maplibregl.setWorkerUrl(workerUrl);

function day(delta: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function MonitoringPage() {
  const { location, fieldGeometry, setFieldGeometry, fieldAnalysis, setFieldAnalysis } = useApp();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const draw = useRef<TerraDraw | null>(null);
  const initialGeometry = useRef(fieldGeometry);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [metrics, setMetrics] = useState<FieldMetrics | null>(null);
  const [name, setName] = useState('Parcela de prueba');
  const [crop, setCrop] = useState('');
  const [start, setStart] = useState(() => day(-90));
  const [end, setEnd] = useState(() => day(-1));
  const [cloud, setCloud] = useState(40);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState('');
  const [layer, setLayer] = useState('true-color');
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');
  const [climate, setClimate] = useState<ClimateSeries | null>(null);
  const [climateMessage, setClimateMessage] = useState('');
  const [saved, setSaved] = useState<SavedAnalysis[]>([]);
  const [savedId, setSavedId] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const inspectionMarkers = useRef<maplibregl.Marker[]>([]);

  async function refreshSaved() {
    try {
      const result = await api.savedAnalyses();
      setSaved(result.data);
      setSavedMessage(result.data.length ? '' : 'No hay resultados archivados en este equipo.');
    } catch (error) {
      setSavedMessage(
        error instanceof Error ? error.message : 'No se pudo consultar el historial.',
      );
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    api
      .savedAnalyses(controller.signal)
      .then((result) => {
        setSaved(result.data);
        setSavedMessage(result.data.length ? '' : 'No hay resultados archivados en este equipo.');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setSavedMessage(
            error instanceof Error ? error.message : 'No se pudo consultar el historial.',
          );
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!container.current) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [location.longitude, location.latitude],
      zoom: 15,
    });
    map.current = instance;
    instance.addControl(new maplibregl.NavigationControl(), 'top-right');
    instance.on('load', () => {
      const tool = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map: instance }),
        modes: [
          new TerraDrawPolygonMode(),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: true,
                  coordinates: { draggable: true, midpoints: true, deletable: true },
                },
              },
            },
          }),
        ],
      });
      draw.current = tool;
      tool.start();
      if (initialGeometry.current)
        tool.addFeatures([
          { type: 'Feature', geometry: initialGeometry.current, properties: { mode: 'polygon' } },
        ]);
      tool.setMode('select');
      const update = () => {
        setMetrics(null);
        setClimate(null);
        setClimateMessage('');
        const feature = tool
          .getSnapshot()
          .find((f) => f.geometry.type === 'Polygon' && f.properties.mode === 'polygon');
        if (feature?.geometry.type === 'Polygon')
          setFieldGeometry(feature.geometry as PolygonGeometry);
        else setFieldGeometry(null);
        setScenes([]);
        setSelectedScene('');
      };
      tool.on('finish', () => {
        update();
        tool.setMode('select');
      });
      tool.on('change', (_ids, type) => {
        if (tool.getMode() === 'select' && (type === 'update' || type === 'delete')) update();
      });
      setMapReady(true);
      setMapFailed(false);
    });
    instance.on('error', () => {
      if (!instance.loaded()) setMapFailed(true);
      setMessage('Algún recurso del mapa no está disponible. Verifica tu conexión.');
    });
    return () => {
      draw.current?.stop();
      draw.current = null;
      instance.remove();
      map.current = null;
    };
    // The map is created once; the active point is synced separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFieldGeometry]);

  useEffect(() => {
    if (mapReady) map.current?.flyTo({ center: [location.longitude, location.latitude], zoom: 15 });
  }, [location, mapReady]);
  useEffect(() => {
    if (!fieldGeometry) return;
    let active = true;
    api
      .validateField(fieldGeometry)
      .then((r) => {
        if (active) {
          setMetrics(r.data);
          setMessage('');
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setMetrics(null);
          setMessage(e instanceof Error ? e.message : 'Geometría inválida');
        }
      });
    return () => {
      active = false;
    };
  }, [fieldGeometry]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !mapReady) return;
    if (instance.getLayer('field-overlay')) instance.removeLayer('field-overlay');
    if (instance.getSource('field-overlay')) instance.removeSource('field-overlay');
    if (!fieldAnalysis?.bbox || !fieldAnalysis.layers?.[layer]) return;
    const [w, s, e, n] = fieldAnalysis.bbox;
    instance.addSource('field-overlay', {
      type: 'image',
      url: `${apiBase}${fieldAnalysis.layers[layer]}`,
      coordinates: [
        [w, n],
        [e, n],
        [e, s],
        [w, s],
      ],
    });
    instance.addLayer({
      id: 'field-overlay',
      type: 'raster',
      source: 'field-overlay',
      paint: { 'raster-opacity': 0.85 },
    });
  }, [fieldAnalysis, layer, mapReady]);
  useEffect(() => {
    inspectionMarkers.current.forEach((marker) => marker.remove());
    inspectionMarkers.current = [];
    const instance = map.current;
    if (!instance || !mapReady || fieldAnalysis?.status !== 'success') return;
    for (const point of fieldAnalysis.inspection?.points ?? []) {
      const marker = new maplibregl.Marker({ color: '#b94c25' })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(
          new maplibregl.Popup().setText(
            `Punto ${point.id}: NDVI ${point.ndvi.toFixed(3)}. Verificar en campo.`,
          ),
        )
        .addTo(instance);
      inspectionMarkers.current.push(marker);
    }
    return () => {
      inspectionMarkers.current.forEach((marker) => marker.remove());
      inspectionMarkers.current = [];
    };
  }, [fieldAnalysis, mapReady]);

  async function openSaved() {
    if (!savedId) return;
    setSavedMessage('Abriendo resultado archivado…');
    try {
      const result = await api.savedAnalysis(savedId);
      const geometry = result.data.aoi?.geometry;
      if (!geometry || geometry.type !== 'Polygon')
        throw new Error('Este resultado no contiene un polígono compatible.');
      const tool = draw.current;
      if (!tool || !mapReady)
        throw new Error('Espera a que cargue el mapa para abrir el resultado.');
      tool.clear();
      const added = tool.addFeatures([
        { type: 'Feature', geometry, properties: { mode: 'polygon' } },
      ]);
      if (added.some((entry) => !entry.valid))
        throw new Error('El polígono archivado no se puede mostrar.');
      tool.setMode('select');
      setFieldGeometry(geometry);
      setFieldAnalysis(result.data);
      setClimate(null);
      setClimateMessage('');
      setScenes([]);
      setSelectedScene('');
      setName(result.data.aoi?.name || 'Parcela');
      setCrop(result.data.aoi?.crop || '');
      if (result.data.bbox) {
        const [west, south, east, north] = result.data.bbox;
        map.current?.fitBounds(
          [
            [west, south],
            [east, north],
          ],
          { padding: 60, maxZoom: 17 },
        );
      }
      setSavedMessage('Resultado histórico archivado localmente; no es una consulta en vivo.');
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : 'No se pudo abrir el resultado.');
    }
  }

  const payload = () => ({
    geometry: fieldGeometry,
    start_date: start,
    end_date: end,
    max_cloud: cloud,
    name,
    municipality: location.label,
    crop,
    item_id: selectedScene || null,
  });
  async function search() {
    if (!fieldGeometry || !metrics) return;
    setState('searching');
    setMessage('');
    setScenes([]);
    setSelectedScene('');
    setFieldAnalysis(null);
    try {
      const result = await api.scenes({ ...payload(), item_id: null });
      setScenes(result.data);
      setSelectedScene(result.data[0]?.item_id || '');
      setState('idle');
      if (!result.data.length)
        setMessage('No hay escenas aptas con esos filtros; amplía el periodo o la nubosidad.');
    } catch (e) {
      setState('error');
      setMessage(e instanceof Error ? e.message : 'No se pudo consultar Sentinel-2.');
    }
  }
  async function analyze() {
    if (!fieldGeometry || !metrics || !selectedScene) return;
    setState('processing');
    setMessage('');
    setFieldAnalysis(null);
    setClimate(null);
    setClimateMessage('');
    try {
      const result = await api.analyzeField(payload());
      setFieldAnalysis(result.data);
      setState(result.data.status);
      if (result.data.analysis_id) void refreshSaved();
      if (result.data.message) setMessage(result.data.message);
    } catch (e) {
      setState('error');
      setMessage(e instanceof Error ? e.message : 'No se pudo procesar la escena.');
    }
  }
  async function loadClimate() {
    if (!fieldAnalysis?.bbox || !fieldAnalysis.acquired_at) return;
    const [west, south, east, north] = fieldAnalysis.bbox;
    const endDate = fieldAnalysis.acquired_at.slice(0, 10);
    const startDate = new Date(`${endDate}T00:00:00Z`);
    startDate.setUTCDate(startDate.getUTCDate() - 29);
    setClimateMessage('Consultando NASA POWER…');
    setClimate(null);
    try {
      const result = await api.climate(
        (south + north) / 2,
        (west + east) / 2,
        startDate.toISOString().slice(0, 10),
        endDate,
      );
      setClimate(result.data);
      setClimateMessage(result.warnings.join(' '));
    } catch (error) {
      setClimateMessage(error instanceof Error ? error.message : 'Clima no disponible.');
    }
  }
  const busy = state === 'searching' || state === 'processing';
  return (
    <>
      <PageHeading
        eyebrow="SENTINEL-2 · PARCELA"
        title="Parcel Monitoring"
        description="Dibuja una parcela aproximada, consulta una escena y explora la variabilidad espectral. No es un diagnóstico."
      />
      <div className="explorer-v2">
        <section className="map-card">
          <div className="map-heading">
            <div>
              <p className="eyebrow">DIBUJO Y CAPAS</p>
              <h2>Parcela de estudio</h2>
            </div>
          </div>
          <div className="map-wrap">
            <div
              ref={container}
              className="map-canvas"
              aria-label="Mapa interactivo para dibujar la parcela"
            />
            {!mapReady && (
              <div className="map-overlay">
                {mapFailed
                  ? 'Mapa no disponible. Revisa tu conexión y vuelve a abrir la pantalla.'
                  : 'Cargando mapa…'}
              </div>
            )}
          </div>
          <div className="monitor-actions">
            <button
              className="button button-primary"
              disabled={!mapReady}
              onClick={() => {
                draw.current?.clear();
                setFieldGeometry(null);
                setMetrics(null);
                draw.current?.setMode('polygon');
                setMessage(
                  'Haz clic para añadir vértices y cierra el polígono en el primer punto.',
                );
              }}
            >
              Dibujar parcela
            </button>
            <button
              className="button"
              disabled={!mapReady}
              onClick={() => draw.current?.setMode('select')}
            >
              Editar vértices
            </button>
            <button
              className="button"
              disabled={!mapReady}
              onClick={() => {
                draw.current?.clear();
                setFieldGeometry(null);
                setMetrics(null);
                setScenes([]);
              }}
            >
              Borrar
            </button>
          </div>
          <p className="map-caption">
            Cierra el polígono pulsando el primer vértice. Para editar, selecciona la parcela y
            arrastra sus vértices. El dibujo es aproximado, no un linde legal. Mapa: OpenFreeMap y
            OpenStreetMap.
          </p>
          {fieldAnalysis?.layers && (
            <div className="monitor-actions">
              <span>Capa:</span>
              {['true-color', 'ndvi', 'ndmi'].map((id) => (
                <button
                  className="button"
                  aria-pressed={layer === id}
                  key={id}
                  onClick={() => setLayer(id)}
                >
                  {id === 'true-color' ? 'RGB' : id.toUpperCase()}
                </button>
              ))}
              {layer !== 'true-color' && (
                <span>Leyenda: rojo −1 → verde +1; transparente = sin datos</span>
              )}
            </div>
          )}
        </section>
        <aside className="surface location-panel">
          <p className="eyebrow">CONFIGURACIÓN</p>
          <LocationSelect />
          <details>
            <summary>Resultados históricos de esta computadora</summary>
            <p>Recupera análisis archivados sin consultar nuevamente el catálogo satelital.</p>
            <label className="field">
              Resultado guardado
              <select value={savedId} onChange={(event) => setSavedId(event.target.value)}>
                <option value="">Seleccionar…</option>
                {saved.map((item) => (
                  <option key={item.analysis_id} value={item.analysis_id}>
                    {item.name || 'Parcela'} ·{' '}
                    {item.acquired_at?.slice(0, 10) || 'fecha desconocida'} · {item.status}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" disabled={!savedId || !mapReady} onClick={openSaved}>
              Abrir resultado archivado
            </button>
            <button className="button" onClick={refreshSaved}>
              Actualizar historial
            </button>
            {savedMessage && <p role="status">{savedMessage}</p>}
          </details>
          <label className="field">
            Nombre
            <input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            Cultivo declarado
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="">Sin especificar</option>
              <option>Maíz forrajero en verde</option>
              <option>Alfalfa verde</option>
              <option>Cebada grano</option>
              <option>Sorgo forrajero en verde</option>
            </select>
          </label>
          <p>
            {metrics
              ? `${metrics.area_ha.toFixed(2)} ha · perímetro ${metrics.perimeter_m.toFixed(0)} m`
              : 'Dibuja y valida una parcela (máximo 500 ha).'}
          </p>
          {fieldGeometry && (
            <details>
              <summary>GeoJSON WGS84 / EPSG:4326</summary>
              <pre className="geojson-display">{JSON.stringify(fieldGeometry, null, 2)}</pre>
            </details>
          )}
          <label className="field">
            Desde
            <input
              type="date"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setScenes([]);
              }}
            />
          </label>
          <label className="field">
            Hasta
            <input
              type="date"
              value={end}
              max={day(0)}
              onChange={(e) => {
                setEnd(e.target.value);
                setScenes([]);
              }}
            />
          </label>
          <label className="field">
            Nubes máximas de escena (%)
            <input
              type="number"
              min="0"
              max="100"
              value={cloud}
              onChange={(e) => {
                setCloud(Number(e.target.value));
                setScenes([]);
              }}
            />
          </label>
          <button className="button button-primary" disabled={!metrics || busy} onClick={search}>
            Buscar escenas
          </button>
          {scenes.length > 0 && (
            <>
              <label className="field">
                Escena
                <select value={selectedScene} onChange={(e) => setSelectedScene(e.target.value)}>
                  {scenes.map((s) => (
                    <option key={s.item_id} value={s.item_id}>
                      {s.acquired_at.slice(0, 10)} · {s.cloud_cover_scene_percent.toFixed(1)}% nubes
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button-primary" disabled={busy} onClick={analyze}>
                Analizar parcela
              </button>
            </>
          )}
          {busy && (
            <p role="status">
              {state === 'searching'
                ? 'Buscando escenas…'
                : 'Procesando bandas y máscara de nubes…'}
            </p>
          )}
          {message && <p role="status">{message}</p>}
        </aside>
      </div>
      {fieldAnalysis?.indices && (
        <section className="surface monitoring-result">
          <p className="eyebrow">
            REPORTE DE CAMPO ·{' '}
            {fieldAnalysis.status === 'success' ? 'COBERTURA DISPONIBLE' : 'DATOS INSUFICIENTES'}
          </p>
          <h2>{fieldAnalysis.aoi?.name}</h2>
          <p>
            Municipio declarado: {fieldAnalysis.aoi?.municipality_label || 'No especificado'} ·
            Cultivo declarado: {fieldAnalysis.aoi?.crop || 'No especificado'}. No se verifica
            pertenencia municipal.
          </p>
          <p>
            Sentinel-2 L2A · {fieldAnalysis.acquired_at} · {fieldAnalysis.item_id}
          </p>
          <p>
            Nubes en escena: {fieldAnalysis.cloud_cover_scene_percent?.toFixed(1)}% · Cobertura
            válida NDVI: {fieldAnalysis.valid_pixel_percent_in_aoi?.toFixed(1)}% · NDMI:{' '}
            {fieldAnalysis.ndmi_valid_pixel_percent_in_aoi?.toFixed(1)}%
          </p>
          <div className="insights-grid">
            {(['ndvi', 'ndmi'] as const).map((id) => {
              const v = fieldAnalysis.indices?.[id];
              return (
                <div key={id}>
                  <strong>
                    {id.toUpperCase()} · {id === 'ndvi' ? '10 m' : '20 m aproximados'}
                  </strong>
                  <p>
                    {v
                      ? `Mediana ${v.median.toFixed(3)} · media ${v.mean.toFixed(3)} · P10 ${v.p10.toFixed(3)} · P90 ${v.p90.toFixed(3)} · ${v.count} píxeles`
                      : 'Sin píxeles válidos'}
                  </p>
                </div>
              );
            })}
          </div>
          {fieldAnalysis.status === 'success' ? (
            <p>
              La capa muestra diferencias relativas dentro del área. Revisa en campo las zonas de
              valores relativamente bajos y contrasta con el estado del cultivo; no se identifica
              una causa automáticamente.
            </p>
          ) : (
            <p>Cobertura insuficiente: no se priorizan zonas de inspección.</p>
          )}
          <section aria-label="Puntos de inspección orientativos">
            <h3>Puntos orientativos para inspección</h3>
            {!fieldAnalysis.inspection ? (
              <p>
                Este resultado anterior no incluye puntos de inspección; ejecuta un análisis nuevo
                para generarlos.
              </p>
            ) : (
              <>
                <p>{fieldAnalysis.inspection.reason}</p>
                {fieldAnalysis.inspection.points.length > 0 && (
                  <>
                    <p>
                      Se seleccionan hasta tres centros de píxel con NDVI dentro del 20 % inferior
                      del área válida, separados al menos 30 m. Son prioridades relativas, no
                      límites de zonas ni diagnósticos.
                    </p>
                    <ol>
                      {fieldAnalysis.inspection.points.map((point) => (
                        <li key={point.id}>
                          Punto {point.id}: {point.latitude.toFixed(6)},{' '}
                          {point.longitude.toFixed(6)} · NDVI {point.ndvi.toFixed(3)}{' '}
                          <button
                            className="button"
                            onClick={() =>
                              map.current?.flyTo({
                                center: [point.longitude, point.latitude],
                                zoom: 18,
                              })
                            }
                          >
                            Ver en mapa
                          </button>
                        </li>
                      ))}
                    </ol>
                    <p>
                      En la visita, observa la vegetación y el manejo local; compara con otras
                      partes de la parcela antes de tomar decisiones.
                    </p>
                  </>
                )}
              </>
            )}
          </section>
          {[...(fieldAnalysis.warnings || []), ...(fieldAnalysis.limitations || [])].map((w) => (
            <p className="fine-print" key={w}>
              {w}
            </p>
          ))}
          <p>
            NASA POWER describe contexto regional en el centro aproximado del área, no mediciones de
            parcela.
          </p>
          <button className="button" onClick={loadClimate}>
            Consultar clima de los 30 días previos a la escena
          </button>
          {climateMessage && <p role="status">{climateMessage}</p>}
          {climate && (
            <div>
              <p>
                NASA POWER · {climate.period.start_date} a {climate.period.end_date} ·{' '}
                {climate.retrieval.retrieval_mode} · recuperado{' '}
                {climate.retrieval.retrieved_at ?? 'fecha no disponible'}
              </p>
              {climate.variables.map((variable) => {
                const id = variable.id as VariableId;
                const point = climate.series
                  .slice()
                  .reverse()
                  .find((item) => item[id] != null);
                return (
                  <p key={id}>
                    {id}:{' '}
                    {point ? `${point[id]} ${variable.unit ?? ''} · ${point.date}` : 'Sin dato'} ·
                    resolución {variable.spatial_resolution ?? 'no disponible'} · faltantes{' '}
                    {variable.missing_count}
                  </p>
                );
              })}
            </div>
          )}
          <a className="text-link" href="#/climate-intelligence">
            Consultar clima →
          </a>
          <button
            className="button"
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify({ ...fieldAnalysis, climate_context: climate }, null, 2)],
                {
                  type: 'application/json',
                },
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'hailex-reporte.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Exportar reporte JSON
          </button>
        </section>
      )}
    </>
  );
}
