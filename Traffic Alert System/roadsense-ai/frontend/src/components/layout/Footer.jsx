export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-bg-secondary/50 py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center text-sm text-txt-secondary sm:flex-row sm:text-left lg:px-8">
        <p>© {new Date().getFullYear()} RoadSense AI. Built for safer mobility.</p>
        <p className="font-mono text-xs">OpenStreetMap · Nominatim · Leaflet</p>
      </div>
    </footer>
  );
}
