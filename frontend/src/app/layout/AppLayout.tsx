import { useEffect, useRef, type ReactNode } from 'react';
import type { ScreenId } from '../navigation/navigation';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = `${label} | HaiLex`;
    dialogRef.current?.close();
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [label, routeKey]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches && dialogRef.current?.open) {
        dialogRef.current.close();
        mainRef.current?.focus({ preventScroll: true });
      }
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <aside className="desktop-sidebar">
        <Sidebar active={active} />
      </aside>
      <dialog
        id="mobile-navigation"
        className="mobile-navigation"
        ref={dialogRef}
        aria-labelledby="mobile-menu-title"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const items = event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href]',
          );
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          if (document.activeElement === document.body) menuButtonRef.current?.focus();
        }}
      >
        <div className="mobile-menu-heading">
          <h2 id="mobile-menu-title">Navegación</h2>
          <button type="button" className="close-menu" onClick={() => dialogRef.current?.close()}>
            Cerrar
          </button>
        </div>
        <Sidebar active={active} onNavigate={() => dialogRef.current?.close()} />
      </dialog>
      <div className="workspace">
        <AppHeader
          label={label}
          menuButtonRef={menuButtonRef}
          onOpenMenu={() => dialogRef.current?.showModal()}
        />
        <main id="main-content" className="main-content" ref={mainRef} tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <span>HaiLex · Inteligencia agrícola con contexto</span>
          <span>Evaluación exploratoria, no asesoría agronómica.</span>
        </footer>
      </div>
    </div>
  );
}
