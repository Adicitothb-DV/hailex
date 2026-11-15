import { useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import type { AdvisorResponse } from '../../types/monitoring';

type Props = { region: string; crop: string; water: string; analysisId: string };
type Profile = {
  municipality: string;
  locality: string;
  crops: string;
  water: string;
  objective: string;
  restrictions: string;
  notes: string;
};

function readProfile(): Profile | null {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem('hailex-agricultural-profile-v1') || 'null',
    );
    if (
      !data ||
      typeof data !== 'object' ||
      !('version' in data) ||
      data.version !== 1 ||
      !('profile' in data) ||
      !data.profile ||
      typeof data.profile !== 'object'
    )
      return null;
    const value = data.profile as Record<string, unknown>;
    const keys = [
      'municipality',
      'locality',
      'crops',
      'water',
      'objective',
      'restrictions',
      'notes',
    ] as const;
    if (!keys.every((key) => typeof value[key] === 'string')) return null;
    return Object.fromEntries(keys.map((key) => [key, value[key]])) as Profile;
  } catch {
    return null;
  }
}

export function AdvisorChat({ region, crop, water, analysisId }: Props) {
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(true);
  const [siap, setSiap] = useState(true);
  const [climate, setClimate] = useState(true);
  const [moisture, setMoisture] = useState(true);
  const [satellite, setSatellite] = useState(true);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<AdvisorResponse | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || !consent) return;
    setStatus('loading');
    setError('');
    setResult(null);
    try {
      const response = await api.advisorChat({
        message: message.trim(),
        region: region || null,
        crop: crop || null,
        water_regime: water,
        analysis_id: satellite && analysisId ? analysisId : null,
        profile: profile ? readProfile() : null,
        include_siap: siap,
        include_climate: climate,
        include_moisture: moisture,
        include_satellite: satellite,
      });
      setResult(response.data);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar al asesor.');
      setStatus('error');
    }
  }
  return (
    <section className="surface advisor-chat">
      <h2>Consulta al asesor</h2>
      <p>
        Describe tu problema o pega una lista. La IA es apoyo informativo, no sustituye una visita
        técnica.
      </p>
      <form onSubmit={submit}>
        <label className="field">
          Tu consulta
          <textarea
            required
            maxLength={4000}
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <fieldset>
          <legend>Contexto a compartir</legend>
          <label>
            <input
              type="checkbox"
              checked={profile}
              onChange={(e) => setProfile(e.target.checked)}
            />{' '}
            Perfil guardado (sin nombre)
          </label>
          {' · '}
          <label>
            <input type="checkbox" checked={siap} onChange={(e) => setSiap(e.target.checked)} />{' '}
            SIAP local
          </label>
          {' · '}
          <label>
            <input
              type="checkbox"
              checked={climate}
              onChange={(e) => setClimate(e.target.checked)}
            />{' '}
            NASA clima
          </label>
          {' · '}
          <label>
            <input
              type="checkbox"
              checked={moisture}
              onChange={(e) => setMoisture(e.target.checked)}
            />{' '}
            NASA humedad
          </label>
          {' · '}
          <label>
            <input
              type="checkbox"
              checked={satellite}
              onChange={(e) => setSatellite(e.target.checked)}
            />{' '}
            Análisis satelital
          </label>
        </fieldset>
        <p>
          Selección anterior: {region || 'municipio no registrado'} ·{' '}
          {crop || 'cultivo no registrado'} ·{' '}
          {water === 'unknown'
            ? 'modalidad desconocida'
            : water === 'rainfed'
              ? 'temporal'
              : 'riego'}{' '}
          ·{' '}
          {analysisId && satellite
            ? `análisis ${analysisId.slice(0, 8)}`
            : 'sin análisis satelital'}
          .
        </p>
        <p>
          La pregunta y los datos seleccionados salen del equipo y se procesan con Groq. No incluyas
          datos personales sensibles. No se consultan precios actuales en la web.
        </p>
        <label>
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />{' '}
          Acepto enviar esta consulta y el contexto seleccionado a Groq.
        </label>
        <div className="monitor-actions">
          <button className="button button-primary" disabled={status === 'loading'}>
            Consultar al asesor
          </button>
        </div>
      </form>
      {status === 'loading' && <p role="status">Consultando fuentes seleccionadas y analizando…</p>}
      {error && <p role="alert">{error}</p>}
      {result && (
        <div aria-live="polite">
          <h3>Conclusión</h3>
          <p>{result.answer.conclusion}</p>
          <h3>Interpretación</h3>
          <p>{result.answer.interpretation}</p>
          {result.answer.actions.length > 0 && (
            <>
              <h3>Qué revisar primero</h3>
              <ul>
                {result.answer.actions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}
          {result.answer.limitations.length > 0 && (
            <>
              <h3>Limitaciones</h3>
              <ul>
                {result.answer.limitations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}
          {result.answer.follow_up_questions.length > 0 && (
            <>
              <h3>Información que ayudaría</h3>
              <ul>
                {result.answer.follow_up_questions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}
          <p>
            <strong>Pronóstico:</strong> no confiable; sin modelo validado. La respuesta puede
            contener errores: verifica cifras y recomendaciones.
          </p>
          <details>
            <summary>Ver datos y procedencia usados</summary>
            <pre className="advisor-context">{JSON.stringify(result.context, null, 2)}</pre>
          </details>
        </div>
      )}
    </section>
  );
}
