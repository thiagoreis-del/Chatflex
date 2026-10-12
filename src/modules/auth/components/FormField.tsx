import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  name: string;
};

export const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  { label, error, id, name, ...rest },
  ref,
) {
  const { t } = useTranslation("auth");
  const fieldId = id ?? name;
  const errId = `${fieldId}-erro`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        ref={ref}
        id={fieldId}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
        {...rest}
      />
      {error && (
        <p id={errId} className="text-sm text-destructive">
          {t(error)}
        </p>
      )}
    </div>
  );
});
