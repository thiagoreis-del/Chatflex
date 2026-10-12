import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** Campo de formulário acessível: rótulo, dica e erro já traduzidos. */
export function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: (aria: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
  className?: string;
}) {
  const describedBy = [hint ? `${id}-dica` : null, error ? `${id}-erro` : null].filter(Boolean).join(" ");
  return (
    <div className={className ?? "space-y-1.5"}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": !!error, ...(describedBy ? { "aria-describedby": describedBy } : {}) })}
      {hint && (
        <p id={`${id}-dica`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erro`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border bg-card p-5 shadow-soft">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-base font-semibold" aria-hidden>
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
