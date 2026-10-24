"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "number" | "datetime-local" | "password";
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  step?: string;
  min?: string;
  max?: string;
}

export type FormValues = Record<string, string | boolean | null>;

/**
 * Form modal admin generik — mendukung field text/textarea/select/checkbox/
 * number/datetime. Nilai awal diisi dari row (saat edit) atau default.
 */
export function AdminFormModal({
  open,
  title,
  fields,
  initialValues,
  onSubmit,
  onClose,
  submitting,
  error,
}: {
  open: boolean;
  title: string;
  fields: FieldDef[];
  initialValues?: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const defaults: FormValues = React.useMemo(() => {
    const base: FormValues = {};
    for (const f of fields) {
      const v = initialValues?.[f.name];
      if (f.type === "checkbox") base[f.name] = Boolean(v);
      else if (v === undefined || v === null) base[f.name] = f.type === "select" && f.options?.[0] ? f.options[0].value : "";
      else base[f.name] = String(v);
    }
    return base;
  }, [fields, initialValues]);

  const [values, setValues] = React.useState<FormValues>(defaults);
  React.useEffect(() => {
    if (open) setValues(defaults);
  }, [open, defaults]);

  if (!open) return null;

  const set = (name: string, v: string | boolean) => setValues((s) => ({ ...s, [name]: v }));

  const inputCls =
    "w-full rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-60";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-text-faint transition-colors hover:bg-surface-2 hover:text-text"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
          className="space-y-4"
        >
          {fields.map((f) => (
            <div key={f.name}>
              {f.type === "checkbox" ? (
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={Boolean(values[f.name])}
                    onChange={(e) => set(f.name, e.target.checked)}
                    className="h-4 w-4 accent-brand"
                    disabled={submitting}
                  />
                  {f.label}
                </label>
              ) : (
                <>
                  <label htmlFor={`field-${f.name}`} className="mb-1.5 block text-sm font-medium text-text">
                    {f.label}
                    {f.required && <span className="ml-1 text-danger">*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      id={`field-${f.name}`}
                      value={String(values[f.name] ?? "")}
                      onChange={(e) => set(f.name, e.target.value)}
                      rows={f.rows ?? 4}
                      required={f.required}
                      placeholder={f.placeholder}
                      disabled={submitting}
                      className={inputCls}
                    />
                  ) : f.type === "select" ? (
                    <select
                      id={`field-${f.name}`}
                      value={String(values[f.name] ?? "")}
                      onChange={(e) => set(f.name, e.target.value)}
                      required={f.required}
                      disabled={submitting}
                      className={`${inputCls} cursor-pointer`}
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`field-${f.name}`}
                      type={f.type}
                      value={String(values[f.name] ?? "")}
                      onChange={(e) => set(f.name, e.target.value)}
                      required={f.required}
                      placeholder={f.placeholder}
                      disabled={submitting}
                      step={f.step}
                      min={f.min}
                      max={f.max}
                      className={inputCls}
                    />
                  )}
                </>
              )}
              {f.help && <p className="mt-1 text-xs text-text-faint">{f.help}</p>}
            </div>
          ))}

          {error && (
            <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-10 items-center rounded-xl border border-border-strong px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Konversi values form → payload API (number/boolean/null sesuai tipe field). */
export function buildPayload(fields: FieldDef[], values: FormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "checkbox") out[f.name] = Boolean(v);
    else if (f.type === "number") out[f.name] = v === "" || v === null ? null : Number(v);
    else if (f.type === "datetime-local") out[f.name] = v ? new Date(String(v)).toISOString() : null;
    else out[f.name] = v === "" ? null : v;
  }
  return out;
}
