"use client";

import { type ComponentProps, type ReactNode, useId } from "react";

/**
 * Campos de formulário do painel: label, ajuda e erro sempre ligados ao controle
 * (`aria-describedby`, `aria-invalid`), para teclado e leitor de tela.
 */
const CONTROL =
  "w-full rounded-control border border-border bg-background px-3 py-2 text-body text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-[invalid=true]:border-danger disabled:opacity-60";

type FieldShellProps = {
  label: string;
  hint?: ReactNode;
  errors?: string[] | undefined;
  required?: boolean;
  className?: string;
  children: (control: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
    required: boolean | undefined;
  }) => ReactNode;
};

export function FieldShell({
  label,
  hint,
  errors,
  required,
  className = "",
  children,
}: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-ajuda` : undefined;
  const errorId = errors?.length ? `${id}-erro` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-caption font-medium">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": errorId ? true : undefined,
        required: required || undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
      {errorId ? (
        <p id={errorId} className="text-caption text-danger">
          {errors?.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

type CommonProps = {
  label: string;
  hint?: ReactNode;
  errors?: string[] | undefined;
  className?: string;
};

export function TextField({
  label,
  hint,
  errors,
  className,
  required,
  ...props
}: CommonProps & ComponentProps<"input">) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      errors={errors}
      required={required}
      className={className}
    >
      {(control) => <input className={CONTROL} {...props} {...control} />}
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  hint,
  errors,
  className,
  required,
  ...props
}: CommonProps & ComponentProps<"textarea">) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      errors={errors}
      required={required}
      className={className}
    >
      {(control) => (
        <textarea className={`${CONTROL} min-h-28`} {...props} {...control} />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  errors,
  className,
  required,
  options,
  placeholder,
  ...props
}: CommonProps &
  ComponentProps<"select"> & {
    options: { value: string; label: string; disabled?: boolean }[];
    placeholder?: string;
  }) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      errors={errors}
      required={required}
      className={className}
    >
      {(control) => (
        <select className={CONTROL} {...props} {...control}>
          {placeholder !== undefined ? (
            <option value="">{placeholder}</option>
          ) : null}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

/** Valor em reais ("8.999,90"); a conversão para centavos é de `lib/forms`. */
export function MoneyField(props: CommonProps & ComponentProps<"input">) {
  return (
    <TextField
      inputMode="decimal"
      autoComplete="off"
      placeholder="0,00"
      {...props}
    />
  );
}

export function CheckboxField({
  label,
  hint,
  errors,
  className = "",
  ...props
}: CommonProps & ComponentProps<"input">) {
  const id = useId();
  const hintId = hint ? `${id}-ajuda` : undefined;
  const errorId = errors?.length ? `${id}-erro` : undefined;
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          className="size-5 accent-accent focus-visible:outline-2 focus-visible:outline-ring"
          aria-describedby={
            [hintId, errorId].filter(Boolean).join(" ") || undefined
          }
          aria-invalid={errorId ? true : undefined}
          {...props}
        />
        <label htmlFor={id} className="text-body">
          {label}
        </label>
      </div>
      {hint ? (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
      {errorId ? (
        <p id={errorId} className="text-caption text-danger">
          {errors?.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
