/* ========================================
   PAGE LOADER — the dashboard content-area
   fallback while a page's code downloads.

   Only the content area shows it: the
   sidebar and header stay put. A thin
   progress bar runs along the top and a
   page-shaped skeleton holds the layout so
   nothing jumps when the page arrives. It
   fades in after a short delay, so fast
   loads never flash it at all.
========================================= */

function PageLoader() {
  return (
    <div className="admin-page-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="admin-progress" aria-hidden>
        <span />
      </div>

      <div className="space-y-6 animate-pulse" aria-hidden>
        <div className="space-y-3">
          <div className="h-7 w-56 rounded-full bg-surface" />
          <div className="h-4 w-80 max-w-full rounded-full bg-surface" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-surface" />
              <div className="h-4 w-24 rounded-full bg-surface" />
              <div className="h-6 w-16 rounded-full bg-surface" />
            </div>
          ))}
        </div>

        <div className="card h-72" />
      </div>
    </div>
  );
}

export default PageLoader;
