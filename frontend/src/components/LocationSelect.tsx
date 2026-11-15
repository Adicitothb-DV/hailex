import { useApp } from '../app/AppContext';
import { locations } from '../data/locations';

export function LocationSelect() {
  const { location, setLocation } = useApp();
  const selected = locations.findIndex(
    (item) => item.latitude === location.latitude && item.longitude === location.longitude,
  );
  return (
    <label className="field">
      Ubicación
      <select
        value={selected < 0 ? 'custom' : String(selected)}
        onChange={(event) => {
          const item = locations[Number(event.target.value)];
          if (event.target.value !== 'custom' && item) setLocation(item);
        }}
      >
        {locations.map((item, index) => (
          <option key={item.label} value={index}>
            {item.label}
          </option>
        ))}
        {selected < 0 && <option value="custom">Punto personalizado</option>}
      </select>
    </label>
  );
}
