import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

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
      error: 'profileReadError',
    };
  }
}

export function AgriculturalProfile() {
  const { t } = useTranslation();
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
      setMessage('profileSaved');
    } catch {
      setMessage('profileSaveError');
    }
  }

  function remove() {
    if (!window.confirm(t('profileDeleteConfirm'))) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      setProfile(emptyProfile);
      setLocked(false);
      setMessage('profileDeleted');
    } catch {
      setMessage('profileDeleteError');
    }
  }

  return (
    <section className="surface agricultural-profile" aria-labelledby="agricultural-profile-title">
      <h2 id="agricultural-profile-title">{t('profileTitle')}</h2>
      <p>{t('profileIntro')}</p>
      <form onSubmit={save}>
        <div className="parcel-grid">
          <label className="field">
            {t('profileName')}
            <input
              name="profile-name"
              maxLength={100}
              value={profile.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </label>
          <label className="field">
            {t('profileMunicipality')}
            <select
              name="profile-municipality"
              value={profile.municipality}
              onChange={(event) => update('municipality', event.target.value)}
            >
              <option value="">{t('profileUnrecorded')}</option>
              <option>El Marqués</option>
              <option>Colón</option>
              <option value="Otro">{t('profileOther')}</option>
            </select>
          </label>
          <label className="field">
            {t('profileLocality')}
            <input
              maxLength={150}
              value={profile.locality}
              onChange={(event) => update('locality', event.target.value)}
            />
          </label>
          <label className="field">
            {t('profileCrops')}
            <input
              maxLength={300}
              value={profile.crops}
              onChange={(event) => update('crops', event.target.value)}
            />
          </label>
          <label className="field">
            {t('profileWater')}
            <input
              maxLength={300}
              value={profile.water}
              onChange={(event) => update('water', event.target.value)}
            />
          </label>
          <label className="field">
            {t('profileObjective')}
            <input
              maxLength={300}
              value={profile.objective}
              onChange={(event) => update('objective', event.target.value)}
            />
          </label>
          <label className="field">
            {t('profileRestrictions')}
            <textarea
              maxLength={1000}
              value={profile.restrictions}
              onChange={(event) => update('restrictions', event.target.value)}
            />
          </label>
          <label className="field">
            {t('profileNotes')}
            <textarea
              maxLength={1000}
              value={profile.notes}
              onChange={(event) => update('notes', event.target.value)}
            />
          </label>
        </div>
        <div className="monitor-actions">
          <button className="button button-primary" type="submit" disabled={locked}>
            {t('profileSave')}
          </button>
          <button className="button button-secondary" type="button" onClick={remove}>
            {t('profileDelete')}
          </button>
        </div>
        {message && <p role="status">{t(message)}</p>}
      </form>
      <p className="fine-print">{t('profileDisclaimer')}</p>
    </section>
  );
}
