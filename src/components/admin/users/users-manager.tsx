"use client";

import { useCallback, useEffect, useState } from "react";

import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/auth/roles";
import {
  grantAdminProfileAction,
  updateAdminProfileAction,
} from "@/services/admin/actions";
import type { AdminUser } from "@/services/admin/queries";

import { ActionMessage } from "../forms/action-message";
import { useActionForm, useActionRunner } from "../forms/use-action-form";
import { Button } from "../ui/button";
import { ConfirmDialog, Dialog } from "../ui/dialog";
import { Badge } from "../ui/feedback";
import { SelectField, TextField } from "../ui/fields";

const ROLE_OPTIONS = (Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map(
  (role) => ({
    value: role,
    label: `${ADMIN_ROLE_LABELS[role]} (${role})`,
  }),
);

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function GrantForm({ onDone }: { onDone: () => void }) {
  const { state, formAction, pending, errors } = useActionForm(
    grantAdminProfileAction,
    {
      email: "text",
      displayName: "text",
      role: "text",
    },
  );
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-caption text-muted">
        <li>
          Crie o login da pessoa no Supabase: Authentication → Users → Add user
          (marque Auto Confirm).
        </li>
        <li>Informe aqui o mesmo e-mail, o nome e o papel.</li>
      </ol>
      <TextField
        label="E-mail do login"
        name="email"
        type="email"
        required
        autoComplete="off"
        errors={errors("email")}
      />
      <TextField
        label="Nome de exibição"
        name="displayName"
        required
        maxLength={120}
        errors={errors("displayName")}
      />
      <SelectField
        label="Papel"
        name="role"
        required
        defaultValue="ADMIN"
        options={ROLE_OPTIONS}
        errors={errors("role")}
      />
      {state && !state.ok ? <ActionMessage result={state} /> : null}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancelar</Button>
        <Button type="submit" variant="primary" pending={pending}>
          Conceder acesso
        </Button>
      </div>
    </form>
  );
}

type Change = { user: AdminUser; role?: AdminRole; isActive?: boolean };

/** Usuários do painel (Brain §23; MDI-D027). Só o OWNER altera; o banco impede ficar sem OWNER. */
export function UsersManager({
  users,
  canManage,
  currentUserId,
}: {
  users: AdminUser[];
  canManage: boolean;
  currentUserId: string;
}) {
  const { pending, result, run } = useActionRunner();
  const [granting, setGranting] = useState(false);
  const [change, setChange] = useState<Change | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<string, AdminRole>>({});
  const close = useCallback(() => setGranting(false), []);

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setGranting(true)}>
            Adicionar administrador
          </Button>
        </div>
      ) : (
        <p className="text-caption text-muted">
          Somente o proprietário (OWNER) altera usuários.
        </p>
      )}
      <ActionMessage result={result} success="Usuário atualizado." />

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[44rem] text-left text-caption">
          <caption className="sr-only">Usuários do painel</caption>
          <thead className="border-b border-border bg-surface">
            <tr>
              {[
                "Nome",
                "E-mail",
                "Papel",
                "Situação",
                "Último acesso",
                ...(canManage ? ["Ações"] : []),
              ].map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-3 py-2 font-semibold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const self = user.userId === currentUserId;
              const draft = roleDraft[user.userId] ?? user.role;
              return (
                <tr key={user.userId}>
                  <th scope="row" className="px-3 py-2 font-medium">
                    {user.displayName}
                    {self ? <span className="text-muted"> (você)</span> : null}
                  </th>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    {canManage && !self ? (
                      <div className="flex items-center gap-1">
                        <label
                          className="sr-only"
                          htmlFor={`papel-${user.userId}`}
                        >
                          Papel de {user.displayName}
                        </label>
                        <select
                          id={`papel-${user.userId}`}
                          value={draft}
                          onChange={(event) =>
                            setRoleDraft((current) => ({
                              ...current,
                              [user.userId]: event.target.value as AdminRole,
                            }))
                          }
                          className="min-h-9 rounded-control border border-border bg-background px-2"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {ADMIN_ROLE_LABELS[option.value]}
                            </option>
                          ))}
                        </select>
                        {draft !== user.role ? (
                          <Button
                            className="min-h-9"
                            onClick={() => setChange({ user, role: draft })}
                          >
                            Aplicar
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      ADMIN_ROLE_LABELS[user.role]
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={user.isActive ? "success" : "neutral"}>
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    {user.lastSignInAt
                      ? dateFormat.format(new Date(user.lastSignInAt))
                      : "—"}
                  </td>
                  {canManage ? (
                    <td className="px-3 py-2">
                      {self ? (
                        "—"
                      ) : (
                        <Button
                          className="min-h-9"
                          onClick={() =>
                            setChange({ user, isActive: !user.isActive })
                          }
                        >
                          {user.isActive ? "Desativar" : "Reativar"}
                        </Button>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={granting} onClose={close} title="Adicionar administrador">
        {granting ? <GrantForm onDone={close} /> : null}
      </Dialog>

      <ConfirmDialog
        open={change !== null}
        title={
          change?.role
            ? "Trocar papel?"
            : change?.isActive
              ? "Reativar acesso?"
              : "Desativar acesso?"
        }
        message={
          change?.role
            ? `${change.user.displayName} passará a ser ${ADMIN_ROLE_LABELS[change.role]}.`
            : change?.isActive
              ? `${change?.user.displayName ?? ""} volta a acessar o painel.`
              : `${change?.user.displayName ?? ""} perde o acesso ao painel imediatamente.`
        }
        confirmLabel="Confirmar"
        danger={change?.isActive === false}
        pending={pending}
        onConfirm={() => {
          if (change) {
            run(updateAdminProfileAction, {
              userId: change.user.userId,
              ...(change.role ? { role: change.role } : {}),
              ...(change.isActive !== undefined
                ? { isActive: change.isActive }
                : {}),
            });
          }
          setChange(null);
        }}
        onCancel={() => setChange(null)}
      />
    </div>
  );
}
