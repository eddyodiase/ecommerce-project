export function BrandMark({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 28 28" focusable="false">
        <path d="M7.5 10.5h13l1.2 12H6.3l1.2-12Z" />
        <path d="M11 10V8.5a3 3 0 0 1 6 0V10M11 14h6l-6 5h6" />
        <path d="M21.5 4v3M20 5.5h3M5.5 7v2M4.5 8h2" />
      </svg>
    </span>
  );
}
