export type GuardRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export type UserChangeInput = {
  actorId: string;
  target: { id: string; role: GuardRole; isActive: boolean };
  change: { role?: GuardRole; isActive?: boolean };
  /** Administradores activos en el sistema (incluido el destino si aplica). */
  activeAdminCount: number;
};

/**
 * Reglas para cambios de rol o estado de una cuenta.
 * Devuelve un mensaje de error amigable o null si el cambio es válido.
 */
export function checkUserChange({ actorId, target, change, activeAdminCount }: UserChangeInput): string | null {
  const isSelf = actorId === target.id;
  const losesAdmin = change.role !== undefined && change.role !== "ADMIN" && target.role === "ADMIN";
  const deactivates = change.isActive === false && target.isActive;

  if (isSelf && deactivates) return "No puedes suspender tu propia cuenta.";
  if (isSelf && losesAdmin) return "No puedes quitarte tu propio rol de administrador.";

  const isActiveAdmin = target.role === "ADMIN" && target.isActive;
  if (isActiveAdmin && (losesAdmin || deactivates) && activeAdminCount <= 1) {
    return "Debe quedar al menos un administrador activo en el campus.";
  }
  return null;
}
