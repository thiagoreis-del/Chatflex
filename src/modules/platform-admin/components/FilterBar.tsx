import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FilterBar({ children, onClear }: { children: ReactNode; onClear?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-w-0 grid-cols-1 items-end gap-3 rounded-lg border bg-card p-3 sm:flex sm:flex-wrap sm:p-4">
      {children}
      {onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t("actions.clearFilters")}
        </Button>
      )}
    </div>
  );
}

const ALL = "__all__";

export function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0 space-y-1.5 sm:min-w-40">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("states.all")}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TextFilter({
  id,
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string | undefined;
  type?: "text" | "date" | "search";
  placeholder?: string;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5 sm:min-w-40">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </div>
  );
}
