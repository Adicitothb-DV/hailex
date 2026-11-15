import type { Ref } from 'react';

export function AppHeader({
  label,
  onOpenMenu,
  menuButtonRef,
}: {
  label: string;
  onOpenMenu: () => void;
  menuButtonRef: Ref<HTMLButtonElement>;
}) {
  return (
    <header className="app-header">
      <div className="header-context">
        <button
          ref={menuButtonRef}
          className="menu-button"
          type="button"
          onClick={onOpenMenu}
          aria-haspopup="dialog"
          aria-controls="mobile-navigation"
        >
          Menú
        </button>
        <span className="header-product">HaiLex</span>
        <span className="header-divider" aria-hidden="true">
          /
        </span>
        <span className="header-page">{label}</span>
      </div>
      <div className="header-status">
        <span className="status-dot" aria-hidden="true" /> Sin datos conectados
      </div>
    </header>
  );
}
