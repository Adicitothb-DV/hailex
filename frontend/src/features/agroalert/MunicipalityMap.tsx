import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { colorFor, gradient } from './mapColors';
import {
  formatValue,
  selectedValue,
  type MoistureData,
  type MunicipalityCollection,
  type Palette,
  type Parameter,
  type Reading,
  type Theme,
} from './types';

maplibregl.setWorkerUrl(workerUrl);

const tiles: Record<Theme, string> = {
  light: 'Canvas/World_Light_Gray_Base',
  satellite: 'World_Imagery',
  topo: 'World_Topo_Map',
  dark: 'Canvas/World_Dark_Gray_Base',
};

interface Props {
  data: MoistureData;
  collection: MunicipalityCollection | null;
  parameter: Parameter;
  palette: Palette;
  theme: Theme;
  labels: boolean;
  landmarks: boolean;
  boundaryLabels: boolean;
  gibs: boolean;
}

export function MunicipalityMap({
  data,
  collection,
  parameter,
  palette,
  theme,
  labels,
  landmarks,
  boundaryLabels,
  gibs,
}: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const latestReadings = useRef<Reading[]>(data.latest_by_cell);
  const currentParameter = useRef<Parameter>(parameter);
  useEffect(() => {
    latestReadings.current = data.latest_by_cell;
  }, [data.latest_by_cell]);
  useEffect(() => {
    currentParameter.current = parameter;
  }, [parameter]);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState(false);
  const [cursor, setCursor] = useState('Mueve el cursor sobre el mapa');
  const [selected, setSelected] = useState<Reading | null>(null);
  const readings = useMemo(
    () => new Map(data.latest_by_cell.map((row) => [row.cell_id, row])),
    [data],
  );
  const mixed = useMemo(() => new Set(data.latest_by_cell.map((row) => row.unit)).size > 1, [data]);
  const comparable = !mixed || parameter.endsWith('PRCNTL');
  const values = useMemo(
    () =>
      comparable
        ? data.latest_by_cell
            .map((row) => selectedValue(row, parameter))
            .filter((v): v is number => v != null && Number.isFinite(v))
        : [],
    [data, parameter, comparable],
  );
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length
    ? ((sorted[Math.floor((sorted.length - 1) / 2)] ?? 0) +
        (sorted[Math.floor(sorted.length / 2)] ?? 0)) /
      2
    : null;
  const unit = parameter.endsWith('PRCNTL') ? '%' : (data.latest_by_cell[0]?.unit ?? '');

  useEffect(() => {
    if (!element.current) return;
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: element.current,
        style: { version: 8, sources: {}, layers: [] },
        center: [-100.2, 20.7],
        zoom: 10,
      });
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl(), 'top-right');
      instance.addControl(new maplibregl.FullscreenControl(), 'top-right');
      instance.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
      instance.on('load', () => setReady(true));
      instance.on('mousemove', (event) =>
        setCursor(`${event.lngLat.lat.toFixed(4)}, ${event.lngLat.lng.toFixed(4)}`),
      );
      instance.on('error', () => setFailure(true));
    } catch {
      queueMicrotask(() => setFailure(true));
      return;
    }
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    const source = instance.getSource('base') as maplibregl.RasterTileSource | undefined;
    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/${tiles[theme]}/MapServer/tile/{z}/{y}/{x}`;
    if (source) source.setTiles([url]);
    else {
      instance.addSource('base', {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
        attribution: 'Esri, Maxar, Earthstar Geographics, OpenStreetMap contributors',
      });
      instance.addLayer({ id: 'base', type: 'raster', source: 'base' });
    }
    if (!instance.getSource('places')) {
      instance.addSource('places', {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'Esri',
      });
      instance.addLayer({ id: 'places', type: 'raster', source: 'places' });
    }
    instance.setLayoutProperty('places', 'visibility', boundaryLabels ? 'visible' : 'none');
  }, [ready, theme, boundaryLabels]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    const date =
      data.latest_by_cell
        .map((row) => row.date)
        .sort()
        .at(-1) ?? data.end_date;
    const layer =
      parameter === 'RZMC' || parameter === 'RZMC_PRCNTL'
        ? 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture'
        : 'SMAP_L4_Analyzed_Surface_Soil_Moisture';
    const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`;
    const existing = instance.getSource('gibs') as maplibregl.RasterTileSource | undefined;
    if (existing) existing.setTiles([url]);
    else {
      instance.addSource('gibs', {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
        maxzoom: 6,
        attribution: 'NASA GIBS',
      });
      instance.addLayer(
        { id: 'gibs', type: 'raster', source: 'gibs', paint: { 'raster-opacity': 0.8 } },
        instance.getLayer('cells-fill') ? 'cells-fill' : undefined,
      );
    }
    instance.setLayoutProperty('gibs', 'visibility', gibs ? 'visible' : 'none');
  }, [ready, gibs, parameter, data]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    if (collection) {
      const neighbours: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: collection.collection.features.filter(
          (feature) => feature.properties?.cvegeo !== data.boundary.properties.cvegeo,
        ),
      };
      const context = instance.getSource('neighbours') as maplibregl.GeoJSONSource | undefined;
      if (context) context.setData(neighbours);
      else {
        instance.addSource('neighbours', { type: 'geojson', data: neighbours, tolerance: 0 });
        instance.addLayer(
          {
            id: 'neighbours-fill',
            type: 'fill',
            source: 'neighbours',
            paint: { 'fill-color': '#8ba89a', 'fill-opacity': 0.12 },
          },
          instance.getLayer('cells-fill') ? 'cells-fill' : undefined,
        );
        instance.addLayer(
          {
            id: 'neighbours-line',
            type: 'line',
            source: 'neighbours',
            paint: { 'line-color': '#607d6c', 'line-width': 1, 'line-opacity': 0.5 },
          },
          instance.getLayer('cells-fill') ? 'cells-fill' : undefined,
        );
      }
    }
    const features: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.cells.map((cell) => {
        const row = readings.get(cell.cell_id);
        const value = row && comparable ? selectedValue(row, parameter) : null;
        return {
          type: 'Feature',
          geometry: cell.clipped_geometry,
          properties: { id: cell.cell_id, color: colorFor(value, min, max, palette) },
        };
      }),
    };
    const cellSource = instance.getSource('cells') as maplibregl.GeoJSONSource | undefined;
    if (cellSource) cellSource.setData(features);
    else {
      instance.addSource('cells', { type: 'geojson', data: features, tolerance: 0 });
      instance.addLayer({
        id: 'cells-fill',
        type: 'fill',
        source: 'cells',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.76 },
      });
      instance.addLayer({
        id: 'cells-border',
        type: 'line',
        source: 'cells',
        paint: { 'line-color': '#ffffff', 'line-width': 1.3 },
      });
      instance.on('click', 'cells-fill', (event) => {
        const id = event.features?.[0]?.properties?.id;
        const row = latestReadings.current.find((item) => item.cell_id === id);
        if (row) setSelected(row);
      });
      instance.on('mouseenter', 'cells-fill', () => {
        instance.getCanvas().style.cursor = 'pointer';
      });
      const tooltip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
      instance.on('mousemove', 'cells-fill', (event) => {
        const row = latestReadings.current.find(
          (item) => item.cell_id === event.features?.[0]?.properties?.id,
        );
        if (!row) return;
        const node = document.createElement('div');
        const variable = currentParameter.current;
        node.textContent = `${row.sector_name} · ${formatValue(selectedValue(row, variable), variable.endsWith('PRCNTL') ? '%' : row.unit)} · ${row.status ?? 'Sin dato'}`;
        tooltip.setLngLat(event.lngLat).setDOMContent(node).addTo(instance);
      });
      instance.on('mouseleave', 'cells-fill', () => {
        instance.getCanvas().style.cursor = '';
        tooltip.remove();
      });
    }
    const boundarySource = instance.getSource('boundary') as maplibregl.GeoJSONSource | undefined;
    if (boundarySource) boundarySource.setData(data.boundary);
    else {
      instance.addSource('boundary', { type: 'geojson', data: data.boundary, tolerance: 0 });
      instance.addLayer({
        id: 'boundary-halo',
        type: 'line',
        source: 'boundary',
        paint: { 'line-color': '#ffffff', 'line-width': 5, 'line-opacity': 0.65 },
      });
      instance.addLayer({
        id: 'boundary-line',
        type: 'line',
        source: 'boundary',
        paint: { 'line-color': '#164e3d', 'line-width': 2 },
      });
    }
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    if (labels)
      for (const cell of data.cells) {
        if (cell.coverage_percent < 18) continue;
        const row = readings.get(cell.cell_id);
        const marker = document.createElement('div');
        marker.className = 'agroalert-map-label';
        marker.textContent =
          row && comparable
            ? `${formatValue(selectedValue(row, parameter), parameter.endsWith('PRCNTL') ? '%' : '')} · ${row.status ?? 'Sin dato'}`
            : 'N/D';
        markers.current.push(
          new maplibregl.Marker({ element: marker })
            .setLngLat([cell.label_longitude, cell.label_latitude])
            .addTo(instance),
        );
      }
    if (landmarks && collection)
      for (const [name, lat, lon] of collection.landmarks[data.municipality]) {
        const node = document.createElement('div');
        node.className = 'agroalert-landmark';
        node.textContent = `● ${name}`;
        markers.current.push(
          new maplibregl.Marker({ element: node }).setLngLat([lon, lat]).addTo(instance),
        );
      }
    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
    };
  }, [
    ready,
    data,
    readings,
    parameter,
    palette,
    labels,
    landmarks,
    collection,
    min,
    max,
    comparable,
  ]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    setSelected(null);
    const points = data.cells.flatMap(
      (cell) =>
        [
          [cell.longitude - 0.045, cell.latitude - 0.045],
          [cell.longitude + 0.045, cell.latitude + 0.045],
        ] as [number, number][],
    );
    if (!points.length) return;
    const bounds = points.reduce(
      (acc, point) => acc.extend(point),
      new maplibregl.LngLatBounds(points[0], points[0]),
    );
    instance.fitBounds(bounds, { padding: 55, duration: 250, maxZoom: 11 });
  }, [ready, data.municipality, data.cells]);

  return (
    <div className="agroalert-map-frame">
      <div
        ref={element}
        className="agroalert-map"
        aria-label="Mapa de celdas municipales de humedad. Los datos tabulares están disponibles en la pestaña Datos."
      />
      {!ready && !failure && (
        <p className="agroalert-map-message" role="status">
          Cargando mapa…
        </p>
      )}
      {failure && (
        <p className="agroalert-map-message" role="status">
          Algunos recursos cartográficos no están disponibles.
        </p>
      )}
      <div className="agroalert-map-head">
        {data.municipality} · {data.cells.length} celdas · última observación{' '}
        {data.latest_by_cell
          .map((r) => r.date)
          .sort()
          .at(-1) ?? 'sin dato'}
      </div>
      <div className="agroalert-map-legend">
        <strong>Escala de las celdas visibles</strong>
        <div style={{ background: gradient(palette), height: 8, borderRadius: 8 }} />
        <div>
          {formatValue(values.length ? min : null, unit)} · {formatValue(median, unit)} ·{' '}
          {formatValue(values.length ? max : null, unit)}
        </div>
        <small>Más seco ← → Más húmedo</small>
      </div>
      <span className="agroalert-coordinates">{cursor}</span>
      {selected && (
        <div
          className="agroalert-popup"
          role="dialog"
          aria-label={`Lectura ${selected.sector_name}`}
        >
          <button
            type="button"
            className="agroalert-popup-close"
            aria-label="Cerrar lectura"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
          <strong>{selected.sector_name}</strong>
          <p>
            {selected.status ?? 'Sin dato'} · {selected.nearest_landmark}
          </p>
          <p>
            Lectura seleccionada:{' '}
            {comparable
              ? formatValue(
                  selectedValue(selected, parameter),
                  parameter.endsWith('PRCNTL') ? '%' : selected.unit,
                )
              : 'Fuentes no comparables'}
          </p>
          <p>
            Superficie: {formatValue(selected[selected.active_surface_parameter], selected.unit)}
            <br />
            Raíces: {formatValue(selected[selected.active_root_parameter], selected.unit)}
          </p>
          {selected.unit === 'm³/m³' && selected.SFMC != null && (
            <p>
              ≈ {Math.round(selected.SFMC * 1000)} litros por m³ de suelo superficial; no es lámina
              de riego.
            </p>
          )}
          <p>
            {selected.source_model} · Observación: {selected.date}
            <br />
            Cobertura municipal: {selected.coverage_percent.toFixed(1)} %<br />
            {selected.cell_id}
          </p>
        </div>
      )}
    </div>
  );
}
