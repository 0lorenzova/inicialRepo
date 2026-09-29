export function BrandLogo() {
  return (
    <span className="logo" aria-label="Finanzas">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M8 14.5A3.5 3.5 0 0 1 11.5 11H31v21H11.5A3.5 3.5 0 0 1 8 28.5v-14Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M8 16h20.5A3.5 3.5 0 0 1 32 19.5v5a3.5 3.5 0 0 1-3.5 3.5H25" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="27" cy="22" r="1.65" fill="currentColor" />
          <path d="M13 11V8.5A2.5 2.5 0 0 1 15.5 6H29" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-name">Finanzas</span>
    </span>
  );
}
