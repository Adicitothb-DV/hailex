import type { ScreenId } from '../app/navigation/navigation';

const paths: Record<ScreenId, string> = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  'earth-explorer':
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18',
  'climate-intelligence':
    'M4 18h13a4 4 0 0 0 0-8 6 6 0 0 0-11-1 4.5 4.5 0 0 0-2 9 M8 21v1 M14 21v1 M5 3v2 M1 7l2 1',
  'rotation-studio': 'M4 8h14l-4-4 M20 16H6l4 4 M18 8l-4 4 M6 16l4-4',
  'pest-monitor':
    'M12 8v13 M8 10l-4-3 M16 10l4-3 M7 14H3 M17 14h4 M7 18l-3 3 M17 18l3 3 M12 4a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V8a4 4 0 0 0-4-4z',
  'analysis-insights': 'M4 3v18h17 M9 16v-5 M14 16V7 M19 16v-8',
};

export function NavigationIcon({ screen }: { screen: ScreenId }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[screen]} />
    </svg>
  );
}
