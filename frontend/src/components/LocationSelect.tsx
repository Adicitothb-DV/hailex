import { useApp } from '../app/AppContext';
import { locations } from '../data/locations';
import { useTranslation } from 'react-i18next';

export function LocationSelect() {
  const { t } = useTranslation();
  const { location, setLocation } = useApp();
  const selected = locations.findIndex(
    (item) => item.latitude === location.latitude && item.longitude === location.longitude,
  );
  return (
    <label className="field">
      {t('location')}
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
        {selected < 0 && <option value="custom">{t('customPoint')}</option>}
      </select>
    </label>
  );
}
