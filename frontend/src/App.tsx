export default function App() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <section aria-labelledby="app-title" className="w-full max-w-2xl">
        <p className="mb-4 text-sm font-semibold tracking-widest text-emerald-300 uppercase">
          Base del frontend
        </p>
        <h1 id="app-title" className="text-5xl font-bold tracking-tight sm:text-6xl">
          HaiLex
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-200">
          Plataforma de apoyo a decisiones agrícolas.
        </p>
        <p className="mt-4 leading-relaxed text-slate-300">
          La aplicación React está lista. Los módulos, las fuentes de datos y el análisis de
          rotaciones todavía no están implementados.
        </p>
        <p className="mt-8 rounded-lg border border-amber-300/40 bg-amber-950/30 p-4 text-sm leading-relaxed text-amber-100">
          Estado: configuración inicial. Esta pantalla no muestra datos agrícolas ni resultados.
        </p>
      </section>
    </main>
  );
}
