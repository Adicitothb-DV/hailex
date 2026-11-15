import { useState, type FormEvent } from 'react';

const STORAGE_KEY = 'hailex-agricultural-profile-v1';
const emptyProfile = {
  name: '',
  municipality: '',
  locality: '',
  crops: '',
  water: '',
  objective: '',
  restrictions: '',
  notes: '',
};
type Profile = typeof emptyProfile;

function loadProfile(): { profile: Profile; error: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { profile: emptyProfile, error: '' };
    const data: unknown = JSON.parse(raw);
    if (
      !data ||
      typeof data !== 'object' ||
      !('version' in data) ||
      data.version !== 1 ||
      !('profile' in data) ||
      !data.profile ||
      typeof data.profile !== 'object'
    ) {
      throw new Error('Invalid profile');
    }
    const profile = data.profile as Record<string, unknown>;
    if (!Object.keys(emptyProfile).every((key) => typeof profile[key] === 'string')) {
      throw new Error('Invalid fields');
    }
    return {
      profile: Object.fromEntries(
        Object.keys(emptyProfile).map((key) => [key, profile[key]]),
      ) as Profile,
      error: '',
    };
  } catch {
    return {
      profile: emptyProfile,
      error:
        'No se pudo leer el perfil guardado. No se ha sobrescrito; revisa el almacenamiento del navegador.',
    };
  }
}

export function AgriculturalProfile() {
  const [initial] = useState(loadProfile);
  const [profile, setProfile] = useState(initial.profile);
  const [message, setMessage] = useState(initial.error);
  const [locked, setLocked] = useState(Boolean(initial.error));

  function update(key: keyof Profile, value: string) {
    setProfile((previous) => ({ ...previous, [key]: value }));
    setMessage('');
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, profile }));
      setMessage('Perfil guardado en este navegador.');
    } catch {
      setMessage('No se pudo guardar el perfil. El formulario conserva lo que escribiste.');
    }
  }

  function remove() {
    if (
      !window.confirm(
        '¿Eliminar el perfil agrícola guardado en este navegador? No se borrarán geometrías ni análisis.',
      )
    )
      return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      setProfile(emptyProfile);
      setLocked(false);
      setMessage('Perfil eliminado de este navegador.');
    } catch {
      setMessage('No se pudo eliminar el perfil guardado.');
    }
  }

  return (
    <section className="surface agricultural-profile" aria-labelledby="agricultural-profile-title">
      <h2 id="agricultural-profile-title">Mi perfil agrícola</h2>
      <p>
        Todos los campos son opcionales. Se guardan solo en este navegador y dispositivo; evita
        datos personales sensibles.
      </p>
      <form onSubmit={save}>
        <div className="parcel-grid">
          <label className="field">
            Nombre corto de la unidad productiva
            <input
              name="profile-name"
              maxLength={100}
              value={profile.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </label>
          <label className="field">
            Municipio
            <select
              name="profile-municipality"
              value={profile.municipality}
              onChange={(event) => update('municipality', event.target.value)}
            >
              <option value="">No registrado</option>
              <option>El Marqués</option>
              <option>Colón</option>
              <option>Otro</option>
            </select>
          </label>
          <label className="field">
            Localidad o zona general
            <input
              maxLength={150}
              value={profile.locality}
              onChange={(event) => update('locality', event.target.value)}
            />
          </label>
          <label className="field">
            Cultivos actuales declarados
            <input
              maxLength={300}
              value={profile.crops}
              onChange={(event) => update('crops', event.target.value)}
            />
          </label>
          <label className="field">
            Modalidad o disponibilidad de agua declarada
            <input
              maxLength={300}
              value={profile.water}
              onChange={(event) => update('water', event.target.value)}
            />
          </label>
          <label className="field">
            Objetivo principal
            <input
              maxLength={300}
              value={profile.objective}
              onChange={(event) => update('objective', event.target.value)}
            />
          </label>
          <label className="field">
            Restricciones
            <textarea
              maxLength={1000}
              value={profile.restrictions}
              onChange={(event) => update('restrictions', event.target.value)}
            />
          </label>
          <label className="field">
            Comentarios adicionales
            <textarea
              maxLength={1000}
              value={profile.notes}
              onChange={(event) => update('notes', event.target.value)}
            />
          </label>
        </div>
        <div className="monitor-actions">
          <button className="button button-primary" type="submit" disabled={locked}>
            Guardar perfil
          </button>
          <button className="button button-secondary" type="button" onClick={remove}>
            Eliminar perfil
          </button>
        </div>
        {message && <p role="status">{message}</p>}
      </form>
      <p className="fine-print">
        Este perfil es declarado por el usuario. Solo se envía a Groq si lo seleccionas al
        consultar; no modifica parcelas ni análisis.
      </p>
    </section>
  );
}
