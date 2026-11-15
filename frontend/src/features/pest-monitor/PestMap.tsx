import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Evaluation, Region, Sector } from './types';

maplibregl.setWorkerUrl(workerUrl);
const styles = {
  light: 'Canvas/World_Light_Gray_Base',
  satellite: 'World_Imagery',
  relief: 'World_Topo_Map',
};

export function PestMap({
  region,
  neighbor,
  evaluations,
  selected,
  layer,
  onSelect,
  onNeighbor,
}: {
  region: Region;
  neighbor: Region | null;
  evaluations: Evaluation[];
  selected: string;
  layer: keyof typeof styles;
  onSelect: (id: string) => void;
  onNeighbor: () => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelect);
  const neighborRef = useRef(onNeighbor);
  const [error, setError] = useState(false);
  useEffect(() => {
    selectRef.current = onSelect;
    neighborRef.current = onNeighbor;
  }, [onSelect, onNeighbor]);
  useEffect(() => {
    const first = region.sectors[0];
    if (!element.current || !first) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: element.current,
        center: [first.lon, first.lat],
        zoom: 9.5,
        style: {
          version: 8,
          sources: {
            base: {
              type: 'raster',
              tiles: [
                `https://server.arcgisonline.com/ArcGIS/rest/services/${styles[layer]}/MapServer/tile/{z}/{y}/{x}`,
              ],
              tileSize: 256,
              attribution: 'Tiles © Esri',
            },
          },
          layers: [{ id: 'base', type: 'raster', source: 'base' }],
        },
      });
    } catch {
      queueMicrotask(() => setError(true));
      return;
    }
    map.addControl(new maplibregl.NavigationControl());
    const markers: maplibregl.Marker[] = [];
    map.on('load', () => {
      if (neighbor) {
        map.addSource('neighbor', { type: 'geojson', data: neighbor.boundary });
        map.addLayer({
          id: 'neighbor-fill',
          type: 'fill',
          source: 'neighbor',
          paint: { 'fill-color': '#627a70', 'fill-opacity': 0.16 },
        });
        map.addLayer({
          id: 'neighbor-line',
          type: 'line',
          source: 'neighbor',
          paint: { 'line-color': '#596d65', 'line-width': 2, 'line-dasharray': [3, 2] },
        });
        map.on('click', 'neighbor-fill', () => neighborRef.current());
      }
      const data: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: region.sectors
          .filter((s): s is Sector & { geometry: GeoJSON.Geometry } => s.geometry !== null)
          .map((s) => {
            const score = evaluations.find((e) => e.id === s.id)?.overall;
            return {
              type: 'Feature',
              geometry: s.geometry,
              properties: {
                id: s.id,
                color:
                  score == null
                    ? '#8b9991'
                    : score >= 70
                      ? '#c84c50'
                      : score >= 40
                        ? '#d09a31'
                        : '#43886a',
              },
            };
          }),
      };
      map.addSource('sectors', { type: 'geojson', data });
      map.addLayer({
        id: 'sector-fill',
        type: 'fill',
        source: 'sectors',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.43 },
      });
      map.addLayer({
        id: 'sector-line',
        type: 'line',
        source: 'sectors',
        paint: { 'line-color': '#ffffff', 'line-width': 1.4 },
      });
      map.addSource('boundary', { type: 'geojson', data: region.boundary });
      map.addLayer({
        id: 'boundary-line',
        type: 'line',
        source: 'boundary',
        paint: { 'line-color': '#163d32', 'line-width': 3 },
      });
      map.on('click', 'sector-fill', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === 'string') selectRef.current(id);
      });
      region.sectors.forEach((sector) => {
        const button = document.createElement('button');
        button.className = `pest-map-pin${sector.id === selected ? ' selected' : ''}`;
        const score = evaluations.find((e) => e.id === sector.id)?.overall;
        button.textContent = `${sector.name} · ${score == null ? 'Sin evaluar' : score}`;
        button.addEventListener('click', () => selectRef.current(sector.id));
        markers.push(
          new maplibregl.Marker({ element: button }).setLngLat([sector.lon, sector.lat]).addTo(map),
        );
      });
      const bounds = region.sectors.reduce(
        (b, s) => b.extend([s.lon, s.lat]),
        new maplibregl.LngLatBounds([first.lon, first.lat], [first.lon, first.lat]),
      );
      map.fitBounds(bounds, { padding: 70, maxZoom: 10, duration: 0 });
    });
    map.on('error', () => setError(true));
    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
    };
  }, [region, neighbor, evaluations, selected, layer]);
  return (
    <>
      <div
        ref={element}
        className="pest-map"
        aria-label="Mapa ilustrativo de localidades; también puedes seleccionarlas en la lista"
      />
      {error && (
        <p role="status">
          Algunos recursos del mapa no están disponibles; usa la lista de localidades.
        </p>
      )}
    </>
  );
}
