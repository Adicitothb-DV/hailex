import { ArrowUpRight, CloudSun, Database, MapPin, Thermometer, Droplets, Sun } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { navigation } from '../../app/navigation/navigation';
import { NavigationIcon } from '../../components/NavigationIcon';
import { PageHeading } from '../../components/PageHeading';
import { StatusBadge } from '../../components/Shared';
import type { VariableId } from '../../types/api';
import { useTranslation } from 'react-i18next';

export function DashboardPage() {
  const { t } = useTranslation();
  const { location, connection, sources, sourcesError, climate, fieldGeometry, fieldAnalysis } =
    useApp();
  const data = climate.result?.data;
  function latest(id: VariableId) {
    const point = data?.series
      .slice()
      .reverse()
      .find((item) => item[id] !== null);
    const meta = data?.variables.find((item) => item.id === id);
    return point ? `${point[id]} ${meta?.unit ?? ''} · ${point.date}` : t('notAvailable');
  }
  return (
    <>
      <PageHeading
        eyebrow={t('overview')}
        title={t('dashboardTitle')}
        description={t('dashboardDescription')}
      />
      <section className="hero-v2 topographic">
        <div>
          <StatusBadge variant="info">{t('explainable')}</StatusBadge>
          <h2>{t('heroTitle')}</h2>
          <p>{t('heroDescription')}</p>
          <a className="button button-primary" href="#/rotation-studio">
            {t('monitorParcel')} <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-inner">
            <img src="/logo-HaiLex.png" alt="" width="135" height="135" />
          </div>
        </div>
        <div className="hero-location">
          <MapPin size={17} />
          <span>
            <small>{t('studyLocation')}</small>
            <strong>{location.type === 'custom' ? t('customPoint') : location.label}</strong>
            <small>
              {location.latitude}, {location.longitude}
            </small>
          </span>
          <a href="#/earth-explorer" aria-label={t('changeLocation')}>
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <div className="metric-grid">
        {(
          [
            { label: t('temperature'), id: 'T2M', Icon: Thermometer },
            { label: t('precipitation'), id: 'PRECTOTCORR', Icon: Droplets },
            { label: t('solarRadiation'), id: 'ALLSKY_SFC_SW_DWN', Icon: Sun },
          ] as const
        ).map(({ label, id, Icon }) => (
          <article className="surface metric" key={id}>
            <div className="metric-heading">
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{latest(id)}</strong>
            <small>
              {data ? t('lastValid', { mode: data.retrieval.retrieval_mode }) : t('noClimate')}
            </small>
          </article>
        ))}
        <article className="surface metric">
          <div className="metric-heading">
            <span>{t('backendStatus')}</span>
            <Database size={19} />
          </div>
          <strong>
            {connection === 'connected'
              ? t('available')
              : connection === 'loading'
                ? t('checkingShort')
                : t('disconnectedShort')}
          </strong>
          <small>{t('healthNote')}</small>
        </article>
      </div>
      <div className="dashboard-bottom">
        <section className="surface">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('provenance')}</p>
              <h2>{t('dataSources')}</h2>
            </div>
            <CloudSun size={22} />
          </div>
          {sourcesError && <p>{sourcesError}</p>}
          {sources === null && !sourcesError && <p>{t('loadingSources')}</p>}
          {sources?.length === 0 && <p>{t('emptySources')}</p>}
          {sources?.map((source) => (
            <div className="source-row" key={source.id}>
              <span>
                <strong>{source.organization}</strong>
                <small>{source.product}</small>
              </span>
              <StatusBadge variant={source.status === 'implemented' ? 'success' : 'warning'}>
                {source.status}
              </StatusBadge>
            </div>
          ))}
          <small>{t('sourceStatusNote')}</small>
        </section>
        <section className="surface session-panel-v2">
          <p className="eyebrow">{t('yourWorkspace')}</p>
          <h2>{t('parcelMonitoring')}</h2>
          <p>{fieldGeometry ? t('polygonAvailable') : t('polygonEmpty')}</p>
          <p>
            {fieldAnalysis?.acquired_at
              ? t('latestScene', { date: fieldAnalysis.acquired_at, status: fieldAnalysis.status })
              : t('noAnalysis')}
          </p>
          <a href="#/rotation-studio" className="text-link">
            {t('openMonitoring')}
          </a>
          <p>{t('sessionNote')}</p>
          <a href="#/earth-explorer" className="text-link">
            {t('openExplorer')}
          </a>
        </section>
      </div>
      <section className="explore-section">
        <div className="section-heading">
          <h2>{t('exploreWorkspace')}</h2>
          <span className="muted">{t('locationToExplanation')}</span>
        </div>
        <div className="quick-links">
          {navigation
            .slice(1)
            .filter((item) => item.id !== 'pest-monitor')
            .map((item) => (
              <a key={item.id} href={`#/${item.id}`}>
                <NavigationIcon screen={item.id} />
                <strong>{t(item.id)}</strong>
                <span>{t(`${item.id}-description`)}</span>
                <span className="quick-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
        </div>
      </section>
    </>
  );
}
