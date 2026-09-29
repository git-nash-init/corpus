"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

interface FieldShell {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
}

function Shell({ label, hint, error, required, id, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({ label, hint, error, required, ...rest }: FieldShell & ComponentProps<"input">) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} error={error} required={required} id={id}>
      <input
        id={id}
        className="input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </Shell>
  );
}

export function SelectField({ label, hint, error, required, children, ...rest }: FieldShell & ComponentProps<"select">) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} error={error} required={required} id={id}>
      <select
        id={id}
        className="input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      >
        {children}
      </select>
    </Shell>
  );
}
