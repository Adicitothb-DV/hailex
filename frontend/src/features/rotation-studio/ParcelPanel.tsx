import { useApp, type ParcelDraft } from '../../app/AppContext';

export function ParcelPanel() {
  const { parcel, setParcel } = useApp();
  function update<K extends keyof ParcelDraft>(key: K, value: ParcelDraft[K]) {
    setParcel({ ...parcel, [key]: value });
  }
  const coordValid =
    parcel.latitude.trim() &&
    parcel.longitude.trim() &&
    Number.isFinite(Number(parcel.latitude)) &&
    Number.isFinite(Number(parcel.longitude)) &&
    Math.abs(Number(parcel.latitude)) <= 90 &&
    Math.abs(Number(parcel.longitude)) <= 180;
  return (
    <section className="surface parcel-panel" aria-labelledby="parcel-title">
      <p className="eyebrow">DATOS DEL USUARIO · SIN PERSISTENCIA</p>
      <h2 id="parcel-title">Perfil de parcela</h2>
      <p>
        Opcional y guardado solo durante esta sesión. Los datos declarados requieren validación; no
        se infieren desde el punto del mapa.
      </p>
      <div className="parcel-grid">
        <label className="field">
          Latitud declarada
          <input
            type="number"
            min="-90"
            max="90"
            step="any"
            value={parcel.latitude}
            onChange={(e) => update('latitude', e.target.value)}
          />
          <small>Usuario · {coordValid ? 'requires_validation' : 'Desconocida o incompleta'}</small>
        </label>
        <label className="field">
          Longitud declarada
          <input
            type="number"
            min="-180"
            max="180"
            step="any"
            value={parcel.longitude}
            onChange={(e) => update('longitude', e.target.value)}
          />
          <small>Usuario · {coordValid ? 'requires_validation' : 'Desconocida o incompleta'}</small>
        </label>
        <label className="field">
          Municipio o región
          <input
            value={parcel.municipality}
            onChange={(e) => update('municipality', e.target.value)}
          />
          <small>
            Usuario · {parcel.municipality.trim() ? 'requires_validation' : 'Desconocido'}
          </small>
        </label>
        <label className="field">
          Cultivo actual declarado
          <input
            value={parcel.currentCrop}
            onChange={(e) => update('currentCrop', e.target.value)}
          />
          <small>
            Usuario · {parcel.currentCrop.trim() ? 'requires_validation' : 'Desconocido'}
          </small>
        </label>
        <label className="field">
          Suelo o clasificación
          <input value={parcel.soil} onChange={(e) => update('soil', e.target.value)} />
          <small>{parcel.soil.trim() ? 'requires_validation' : 'Desconocido'}</small>
        </label>
        <label className="field">
          Origen del dato de suelo
          <select
            value={parcel.soilSource}
            onChange={(e) => update('soilSource', e.target.value as ParcelDraft['soilSource'])}
          >
            <option value="user_input">Declarado por usuario</option>
            <option value="cartographic_reference">Referencia cartográfica aportada</option>
          </select>
        </label>
        {parcel.soilSource === 'cartographic_reference' && (
          <label className="field">
            Referencia cartográfica
            <input
              value={parcel.soilReference}
              onChange={(e) => update('soilReference', e.target.value)}
            />
            <small>
              {parcel.soilReference.trim()
                ? 'Fuente aportada por usuario · provisional'
                : 'Fuente no aportada · requires_validation'}
            </small>
          </label>
        )}
        <label className="field">
          Régimen de agua
          <select
            value={parcel.water}
            onChange={(e) => update('water', e.target.value as ParcelDraft['water'])}
          >
            <option value="unknown">Desconocido</option>
            <option value="irrigated">Riego</option>
            <option value="rainfed">Temporal</option>
          </select>
          <small>{parcel.water === 'unknown' ? 'Sin dato' : 'Usuario · requires_validation'}</small>
        </label>
        <label className="field">
          Restricciones declaradas
          <textarea
            rows={2}
            value={parcel.restrictions}
            onChange={(e) => update('restrictions', e.target.value)}
          />
          <small>
            {parcel.restrictions.trim()
              ? 'Usuario · requiere revisión'
              : 'No aportadas; no implica ausencia'}
          </small>
        </label>
      </div>
      <p className="notice">
        Cartografía INEGI: referencia territorial, no análisis de laboratorio ni muestreo de suelo.
        No se ha asignado una clase cartográfica automáticamente.
      </p>
    </section>
  );
}
