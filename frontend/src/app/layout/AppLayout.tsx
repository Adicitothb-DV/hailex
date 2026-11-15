import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import type { ScreenId } from '../navigation/navigation';
import { Sidebar } from './Sidebar';
import { useApp } from '../AppContext';

export function AppLayout({
  children,
  active,
  label,
  routeKey,
}: {
  children: ReactNode;
  active: ScreenId | null;
  label: string;
  routeKey: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const main = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { connection, location, refreshConnection } = useApp();
  useEffect(() => {
    document.title = `${label} | HaiLex`;
    dialog.current?.close();
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [label, routeKey]);
  function close() {
    dialog.current?.close();
  }
  return (
    <div className={`v2-shell ${open ? 'drawer-open' : ''}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <dialog
        ref={dialog}
        id="navigation-drawer"
        className="v2-drawer"
        aria-labelledby="drawer-title"
        onClose={() => {
          setOpen(false);
          if (document.activeElement === document.body) button.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="drawer-inner">
          <div className="drawer-title">
            <h2 id="drawer-title">Explorar HaiLex</h2>
            <button
              className="icon-button drawer-close"
              type="button"
              aria-label="Cerrar menú"
              onClick={close}
            >
              <X size={20} />
            </button>
          </div>
          <Sidebar active={active} onNavigate={close} />
        </div>
      </dialog>
      <div className="v2-workspace">
        <header className="v2-header">
          <div className="header-context">
            <button
              ref={button}
              type="button"
              className="menu-trigger"
              aria-label="Abrir menú"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="navigation-drawer"
              onClick={() => {
                dialog.current?.showModal();
                setOpen(true);
              }}
            >
              <Menu size={21} />
            </button>
            <span className="header-product">HaiLex</span>
            <span aria-hidden="true">/</span>
            <span className="header-page">{label}</span>
          </div>
          <div className="header-actions">
            <span className="header-location">{location.label}</span>
            <button
              type="button"
              className={`connection connection-${connection}`}
              onClick={refreshConnection}
              title="Volver a comprobar el backend"
            >
              <span className="connection-dot" />
              {connection === 'connected'
                ? 'Backend conectado'
                : connection === 'loading'
                  ? 'Comprobando backend'
                  : 'Backend desconectado'}
            </button>
          </div>
        </header>
        <main id="main-content" className="v2-main" ref={main} tabIndex={-1}>
          {children}
        </main>
        <footer className="v2-footer">
          <span>HaiLex · Earth & agriculture</span>
          <span>Evaluación exploratoria, no asesoría agronómica.</span>
        </footer>
      </div>
    </div>
  );
}
