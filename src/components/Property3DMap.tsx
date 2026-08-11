import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Building2, Satellite, RotateCw, Compass } from 'lucide-react';

type Props = {
  lat: number;
  lng: number;
  title: string;
  zoom?: number;
};

const STREET_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const satelliteStyle = (): maplibregl.StyleSpecification => ({
  version: 8,
  sources: {
    sat: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    terrain: {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      tileSize: 256,
      encoding: 'terrarium',
      maxzoom: 15,
    },
  },
  layers: [{ id: 'sat', type: 'raster', source: 'sat' }],
  terrain: { source: 'terrain', exaggeration: 1.2 },
});

/** Interactive 3D map (tilt, rotate, extruded buildings) for a property location. */
export const Property3DMap = ({ lat, lng, title, zoom = 17 }: Props) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const spinning = useRef(false);
  const [mode, setMode] = useState<'3d' | 'satellite'>('3d');

  useEffect(() => {
    if (!container.current || map.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: STREET_STYLE,
      center: [lng, lat],
      zoom,
      pitch: 60,
      bearing: -20,
      attributionControl: { compact: true },
    });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    m.addControl(new maplibregl.FullscreenControl(), 'top-right');

    const marker = new maplibregl.Marker({ color: '#0b5ed7' })
      .setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ offset: 24 }).setText(title))
      .addTo(m);

    const addBuildings = () => {
      if (m.getLayer('3d-buildings') || !m.getSource('openmaptiles')) return;
      m.addLayer({
        id: '3d-buildings',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': '#c9d3e3',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.85,
        },
      });
    };
    m.on('load', addBuildings);
    m.on('styledata', addBuildings);

    return () => {
      marker.remove();
      m.remove();
      map.current = null;
    };
  }, [lat, lng, title, zoom]);

  const switchMode = (next: '3d' | 'satellite') => {
    const m = map.current;
    if (!m || next === mode) return;
    setMode(next);
    m.setStyle(next === '3d' ? STREET_STYLE : satelliteStyle(), { diff: false });
    m.once('styledata', () => {
      m.easeTo({ pitch: 65, bearing: m.getBearing(), duration: 600 });
    });
  };

  const orbit = () => {
    const m = map.current;
    if (!m) return;
    spinning.current = !spinning.current;
    const step = () => {
      if (!spinning.current || !map.current) return;
      map.current.setBearing(map.current.getBearing() + 0.35);
      requestAnimationFrame(step);
    };
    if (spinning.current) requestAnimationFrame(step);
  };

  const reset = () => {
    spinning.current = false;
    map.current?.easeTo({ center: [lng, lat], zoom, pitch: 60, bearing: -20, duration: 800 });
  };

  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border bg-muted">
      <div ref={container} className="absolute inset-0" />
      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
        <Button size="sm" variant={mode === '3d' ? 'default' : 'secondary'} onClick={() => switchMode('3d')}>
          <Building2 className="h-3.5 w-3.5" /> 3D
        </Button>
        <Button size="sm" variant={mode === 'satellite' ? 'default' : 'secondary'} onClick={() => switchMode('satellite')}>
          <Satellite className="h-3.5 w-3.5" /> Satellite
        </Button>
        <Button size="sm" variant="secondary" onClick={orbit} aria-label="Orbit around property">
          <RotateCw className="h-3.5 w-3.5" /> Orbit
        </Button>
        <Button size="sm" variant="secondary" onClick={reset} aria-label="Reset view">
          <Compass className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>
    </div>
  );
};

export default Property3DMap;
