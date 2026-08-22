import React from 'react';
import { ArrowRight } from 'lucide-react';

export function AuthButton({ children, loading = false, showArrow = true, ...rest }) {
  return (
    <button className="auth-btn" disabled={loading} {...rest}>
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          <span>Processing…</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {showArrow && (
            <span className="btn-arrow" aria-hidden="true">
              <ArrowRight size={14} strokeWidth={2.5} />
            </span>
          )}
        </>
      )}
    </button>
  );
}
