"use client";

import { useId, useState } from "react";

export function PasswordField({
  name,
  autoComplete,
  required = true,
  minLength,
  label = "Senha"
}: {
  name: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  label?: string;
}) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="field password-field">
      <span>{label}</span>
      <div className="password-field-wrap">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          className="password-field-toggle"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-controls={inputId}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </label>
  );
}
