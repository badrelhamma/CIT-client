import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/base/Badge";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { Dialog } from "@/components/base/Dialog";
import { EmptyState } from "@/components/base/EmptyState";
import { ErrorState } from "@/components/base/ErrorState";
import { Field } from "@/components/base/Field";
import { LoadingState } from "@/components/base/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/services/api";
import { ADM_EMAIL_DOMAIN, isAdmEmail } from "@/services/email";
import type {
  AdminPermissionCatalog,
  AdminUserPayload,
  AuthUser,
  PermissionKey,
  Role,
} from "@/types";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-base text-ink shadow-sm transition-colors placeholder:text-ink-faint focus:border-adm-500 focus:outline-none disabled:bg-paper disabled:text-ink-faint";

function sortUsers(users: AuthUser[]): AuthUser[] {
  return [...users].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) ||
      a.name.localeCompare(b.name, "fr"),
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleTone(role: Role): "adm" | "warn" | "neutral" {
  if (role === "Manager principal") return "adm";
  if (role === "Directeur") return "warn";
  return "neutral";
}

export function AdminScreen() {
  const { user: currentUser, refresh } = useAuth();
  const { notify } = useToast();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [catalog, setCatalog] = useState<AdminPermissionCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AuthUser | "new" | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, permissionCatalog] = await Promise.all([
        api.adminUsers(),
        api.adminPermissions(),
      ]);
      setUsers(sortUsers(list));
      setCatalog(permissionCatalog);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Chargement impossible.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const permissionLabels = useMemo(() => {
    const labels: Partial<Record<PermissionKey, string>> = {};
    for (const permission of catalog?.permissions ?? []) {
      labels[permission.key] = permission.label;
    }
    return labels;
  }, [catalog]);

  const activeCount = users.filter((u) => u.active).length;

  function handleSaved(saved: AuthUser, isNew: boolean) {
    setUsers((prev) =>
      sortUsers(
        isNew
          ? [...prev, saved]
          : prev.map((user) => (user.id === saved.id ? saved : user)),
      ),
    );
    setEditing(null);
    notify(isNew ? "Compte créé." : "Compte mis à jour.", "ok");
    if (saved.id === currentUser?.id) void refresh({ silent: true });
  }

  async function toggleActive(target: AuthUser) {
    const action = target.active ? "désactiver" : "réactiver";
    if (
      !window.confirm(
        `Voulez-vous ${action} le compte de ${target.name} (${target.identifier}) ?`,
      )
    ) {
      return;
    }

    setTogglingId(target.id);
    try {
      const updated = await api.adminUpdateUser(target.id, {
        active: !target.active,
      });
      setUsers((prev) =>
        sortUsers(prev.map((user) => (user.id === updated.id ? updated : user))),
      );
      notify(
        target.active ? "Compte désactivé." : "Compte réactivé.",
        "ok",
      );
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Mise à jour impossible.",
        "error",
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section aria-label="Administration" className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-adm-700 uppercase">
            Manager principal
          </p>
          <h2 className="mt-1 font-display text-3xl tracking-wide text-ink">
            Comptes & permissions
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {users.length} compte{users.length > 1 ? "s" : ""} ·{" "}
            {activeCount} actif{activeCount > 1 ? "s" : ""}. Les rôles sont
            accordés nominativement ; les droits sont vérifiés côté serveur à
            chaque requête.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            Actualiser
          </Button>
          <Button size="sm" onClick={() => setEditing("new")} disabled={!catalog}>
            Nouveau compte
          </Button>
        </div>
      </div>

      <div className="mt-5">
        {loading && (
          <Card>
            <LoadingState label="Chargement des comptes…" />
          </Card>
        )}

        {!loading && error && (
          <Card>
            <ErrorState message={error} onRetry={() => void load()} />
          </Card>
        )}

        {!loading && !error && users.length === 0 && (
          <Card>
            <EmptyState
              title="Aucun compte"
              description="Créez le premier compte pour ouvrir l'accès à l'application."
            />
          </Card>
        )}

        {!loading && !error && users.length > 0 && (
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-line">
              {users.map((account) => {
                const isSelf = account.id === currentUser?.id;
                const canToggle = !isSelf && togglingId !== account.id;
                return (
                  <li
                    key={account.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          account.active
                            ? "bg-adm-100 text-adm-800"
                            : "bg-paper text-ink-faint"
                        }`}
                      >
                        {initials(account.name) || "?"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-ink">
                            {account.name}
                            {isSelf && (
                              <span className="ml-1.5 text-xs font-medium text-ink-faint">
                                (vous)
                              </span>
                            )}
                          </p>
                          <Badge tone={roleTone(account.role)}>
                            {account.role}
                          </Badge>
                          <Badge tone={account.active ? "ok" : "neutral"} dot>
                            {account.active ? "Actif" : "Désactivé"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-ink-faint">
                          {account.identifier}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {account.email}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {account.role === "Manager principal"
                            ? "Tous les droits (rôle principal)"
                            : account.permissions.length === 0
                              ? "Aucune permission accordée"
                              : account.permissions
                                  .map(
                                    (key) => permissionLabels[key] ?? key,
                                  )
                                  .join(" · ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditing(account)}
                        disabled={!catalog}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant={account.active ? "ghost" : "primary"}
                        size="sm"
                        onClick={() => void toggleActive(account)}
                        disabled={!canToggle}
                        title={
                          isSelf
                            ? "Impossible de désactiver votre propre compte."
                            : undefined
                        }
                      >
                        {togglingId === account.id
                          ? "…"
                          : account.active
                            ? "Désactiver"
                            : "Réactiver"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      {editing && catalog && (
        <AccountDialog
          target={editing === "new" ? null : editing}
          catalog={catalog}
          currentUserId={currentUser?.id}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}

interface AccountDialogProps {
  target: AuthUser | null;
  catalog: AdminPermissionCatalog;
  currentUserId?: string;
  onClose: () => void;
  onSaved: (user: AuthUser, isNew: boolean) => void;
}

function AccountDialog({
  target,
  catalog,
  currentUserId,
  onClose,
  onSaved,
}: AccountDialogProps) {
  const isEdit = target !== null;
  const isSelf = target !== null && target.id === currentUserId;
  const [name, setName] = useState(target?.name ?? "");
  const [identifier, setIdentifier] = useState(target?.identifier ?? "");
  const [email, setEmail] = useState(target?.email ?? "");
  const [role, setRole] = useState<Role>(target?.role ?? "Manager");
  const [permissions, setPermissions] = useState<PermissionKey[]>(
    target?.permissions ?? [],
  );
  const [active, setActive] = useState(target?.active ?? true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, { key: PermissionKey; label: string }[]>();
    for (const permission of catalog.permissions) {
      const list = map.get(permission.group) ?? [];
      list.push({ key: permission.key, label: permission.label });
      map.set(permission.group, list);
    }
    return Array.from(map.entries());
  }, [catalog]);

  function togglePermission(key: PermissionKey) {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  }

  function changeRole(next: Role) {
    setRole(next);
    if (next === "Manager principal") setPermissions([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!isAdmEmail(email)) {
      setError(`L'adresse email doit se terminer par ${ADM_EMAIL_DOMAIN}.`);
      return;
    }
    setSaving(true);
    try {
      const payload: AdminUserPayload = {
        name: name.trim(),
        identifier: identifier.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        role,
        active,
        permissions: role === "Manager principal" ? [] : permissions,
      };
      if (password) payload.password = password;

      const saved = isEdit
        ? await api.adminUpdateUser(target.id, payload)
        : await api.adminCreateUser(payload);
      onSaved(saved, !isEdit);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enregistrement impossible.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      title={isEdit ? "Modifier le compte" : "Nouveau compte"}
      onClose={saving ? () => undefined : onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet" htmlFor="account-name">
            <input
              id="account-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className={inputClass}
              placeholder="Prénom Nom"
            />
          </Field>

          <Field label="Identifiant de connexion" htmlFor="account-identifier">
            <input
              id="account-identifier"
              type="text"
              required
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={saving}
              className={inputClass}
              placeholder="prenom.nom"
            />
          </Field>
        </div>

        <Field label="Adresse email professionnelle" htmlFor="account-email">
          <input
            id="account-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            className={inputClass}
            placeholder={`prenom.nom${ADM_EMAIL_DOMAIN}`}
          />
          <p className="mt-1 text-xs text-ink-faint">
            Utilisée pour recevoir un nouveau mot de passe.
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rôle" htmlFor="account-role">
            <select
              id="account-role"
              value={role}
              onChange={(e) => changeRole(e.target.value as Role)}
              disabled={saving}
              className={inputClass}
            >
              {catalog.roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={isEdit ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
            htmlFor="account-password"
          >
            <div className="relative">
              <input
                id="account-password"
                type={showPassword ? "text" : "password"}
                required={!isEdit}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={saving}
                className={`${inputClass} pr-20`}
                placeholder={isEdit ? "Laisser vide pour conserver" : "12 caractères minimum"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md px-2 py-1 text-xs font-bold text-adm-700 transition-colors hover:bg-adm-50"
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-paper px-3.5 py-2.5">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={saving || isSelf}
            className="size-4 accent-adm-700"
          />
          <span className="text-sm font-medium text-ink">
            Compte actif (peut se connecter)
            {isSelf && (
              <span className="ml-1 text-xs font-normal text-ink-faint">
                — votre propre compte ne peut pas être désactivé ici
              </span>
            )}
          </span>
        </label>

        <div className="rounded-lg border border-line bg-paper p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-ink">Permissions</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {role === "Manager principal"
                  ? "Ce rôle dispose automatiquement de toutes les permissions."
                  : "Cochez les pages et actions accessibles à ce compte."}
              </p>
            </div>
            {role !== "Manager principal" && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setPermissions(
                      catalog.permissions.map((permission) => permission.key),
                    )
                  }
                  disabled={saving}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-adm-700 transition-colors hover:bg-adm-50 disabled:opacity-50"
                >
                  Tout cocher
                </button>
                <button
                  type="button"
                  onClick={() => setPermissions([])}
                  disabled={saving}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-adm-50 disabled:opacity-50"
                >
                  Tout retirer
                </button>
              </div>
            )}
          </div>

          {role !== "Manager principal" && (
            <div className="mt-3 space-y-3">
              {groups.map(([group, definitions]) => (
                <div key={group}>
                  <p className="text-[11px] font-bold tracking-wide text-ink-faint uppercase">
                    {group}
                  </p>
                  <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                    {definitions.map((permission) => (
                      <label
                        key={permission.key}
                        className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm text-ink transition-colors hover:bg-card"
                      >
                        <input
                          type="checkbox"
                          checked={permissions.includes(permission.key)}
                          onChange={() => togglePermission(permission.key)}
                          disabled={saving}
                          className="mt-0.5 size-4 accent-adm-700"
                        />
                        <span>{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red/30 bg-red/5 px-3.5 py-2.5 text-sm font-medium text-red-deep"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={
              saving ||
              !name.trim() ||
              !identifier.trim() ||
              !isAdmEmail(email) ||
              (!isEdit && !password)
            }
          >
            {saving
              ? "Enregistrement…"
              : isEdit
                ? "Enregistrer"
                : "Créer le compte"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
