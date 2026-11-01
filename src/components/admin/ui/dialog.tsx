"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

import { Button } from "./button";

/**
 * Diálogo modal com `<dialog>` nativo (MDI-D025): o navegador cuida do foco preso,
 * da tecla Esc e de devolver o foco a quem abriu. Sem dependência.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className={`m-auto w-[calc(100%-2rem)] rounded-card border border-border bg-background p-0 text-foreground shadow-overlay backdrop:bg-foreground/40 ${
        wide ? "max-w-content" : "max-w-narrow"
      }`}
    >
      {open ? (
        <div className="flex max-h-[85svh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-body font-semibold">
                {title}
              </h2>
              {description ? (
                <p className="text-caption text-muted">{description}</p>
              ) : null}
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Fechar">
              ✕
            </Button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}

/** Confirmação para ações destrutivas ou sensíveis (excluir, despublicar, trocar papel). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <div className="flex flex-col gap-5">
        <div className="text-body">{message}</div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onCancel}>Cancelar</Button>
          <Button
            variant={danger ? "danger" : "primary"}
            pending={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
