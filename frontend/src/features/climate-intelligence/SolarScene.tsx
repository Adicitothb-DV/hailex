import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Approximate solar elevation from UTC time and geographic coordinates; not a weather forecast.
function solarElevation(latitude: number, longitude: number, instant: Date) {
  const rad = Math.PI / 180;
  const day = Math.floor((instant.getTime() - Date.UTC(instant.getUTCFullYear(), 0, 0)) / 86400000);
  const hour =
    instant.getUTCHours() + instant.getUTCMinutes() / 60 + instant.getUTCSeconds() / 3600;
  const gamma = ((2 * Math.PI) / 365) * (day - 1 + (hour - 12) / 24);
  const equation =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const angle = ((hour * 60 + equation + 4 * longitude) / 4 - 180) * rad;
  const sine =
    Math.sin(latitude * rad) * Math.sin(declination) +
    Math.cos(latitude * rad) * Math.cos(declination) * Math.cos(angle);
  return Math.asin(Math.max(-1, Math.min(1, sine))) / rad;
}
export function SolarScene({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label: string;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  const day = solarElevation(latitude, longitude, now) > 0;
  return (
    <section className={`solar-scene ${day ? 'solar-day' : 'solar-night'}`}>
      <div>
        <p className="eyebrow">PERSPECTIVA SOLAR</p>
        <h2>{day ? 'Sobre el horizonte' : 'Bajo el horizonte'}</h2>
        <p>
          {label} · {day ? 'Día' : 'Noche'}
        </p>
        <small>
          {now.toISOString().slice(0, 16).replace('T', ' ')} UTC
          <br />
          Cálculo astronómico aproximado, no pronóstico.
        </small>
      </div>
      <div className="solar-orb" aria-hidden="true">
        {day ? <Sun size={53} strokeWidth={1.3} /> : <Moon size={48} strokeWidth={1.3} />}
      </div>
    </section>
  );
}
