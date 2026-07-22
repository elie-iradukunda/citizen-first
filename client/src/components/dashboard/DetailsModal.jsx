import { useEffect } from 'react';

/**
 * Reusable pop-up used across dashboards for "view details", edit forms, and
 * delete confirmations. `variant="drawer"` renders a right-side slide-over
 * panel (a form-like details view) instead of a centered modal.
 */
function DetailsModal({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  footer,
  widthClass = 'max-w-2xl',
  variant = 'center',
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isDrawer = variant === 'drawer';

  return (
    <div
      className={`fixed inset-0 z-50 bg-ink/60 ${
        isDrawer ? 'flex justify-end' : 'flex items-center justify-center overflow-y-auto px-4 py-8'
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          isDrawer
            ? 'h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl'
            : `max-h-[85vh] w-full ${widthClass} overflow-y-auto rounded-[1.2rem] border border-ink/10 bg-white p-6 shadow-soft`
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className={isDrawer ? 'text-xl font-black text-slate-900' : 'font-display text-2xl font-black text-ink'}>
              {title}
            </h3>
            {subtitle ? <p className="mt-1 text-sm leading-6 text-slate">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-lg font-black text-ink transition hover:bg-ink hover:text-white"
          >
            &times;
          </button>
        </div>

        <div className="mt-5">{children}</div>

        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-ink/10 pt-5">{footer}</div> : null}
      </div>
    </div>
  );
}

export function DetailRow({ label, value }) {
  return (
    <p className="rounded-lg bg-mist px-4 py-3 text-sm text-slate">
      <span className="font-bold text-ink">{label}:</span> {value ?? 'Not provided'}
    </p>
  );
}

export default DetailsModal;
