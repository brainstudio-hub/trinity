import { describe, expect, it } from "vitest";
import { checkUserChange } from "./user-guard";

const admin = { id: "a1", role: "ADMIN" as const, isActive: true };
const student = { id: "s1", role: "STUDENT" as const, isActive: true };

describe("checkUserChange", () => {
  it("permite cambiar el rol de otro usuario", () => {
    expect(checkUserChange({ actorId: "a1", target: student, change: { role: "INSTRUCTOR" }, activeAdminCount: 1 })).toBeNull();
  });

  it("impide suspender la propia cuenta", () => {
    expect(checkUserChange({ actorId: "a1", target: admin, change: { isActive: false }, activeAdminCount: 3 })).toMatch(
      /propia cuenta/
    );
  });

  it("impide que un administrador se quite su propio rol", () => {
    expect(checkUserChange({ actorId: "a1", target: admin, change: { role: "STUDENT" }, activeAdminCount: 3 })).toMatch(
      /propio rol/
    );
  });

  it("impide dejar el sistema sin administradores activos (cambio de rol)", () => {
    expect(
      checkUserChange({ actorId: "x", target: { ...admin, id: "a2" }, change: { role: "INSTRUCTOR" }, activeAdminCount: 1 })
    ).toMatch(/al menos un administrador/);
  });

  it("impide dejar el sistema sin administradores activos (suspensión)", () => {
    expect(
      checkUserChange({ actorId: "x", target: { ...admin, id: "a2" }, change: { isActive: false }, activeAdminCount: 1 })
    ).toMatch(/al menos un administrador/);
  });

  it("permite suspender a un administrador si quedan otros activos", () => {
    expect(
      checkUserChange({ actorId: "a1", target: { ...admin, id: "a2" }, change: { isActive: false }, activeAdminCount: 2 })
    ).toBeNull();
  });

  it("no cuenta a un administrador ya suspendido como el último", () => {
    expect(
      checkUserChange({
        actorId: "a1",
        target: { id: "a2", role: "ADMIN", isActive: false },
        change: { role: "STUDENT" },
        activeAdminCount: 1,
      })
    ).toBeNull();
  });

  it("permite reactivar la propia cuenta sin cambios efectivos", () => {
    expect(checkUserChange({ actorId: "a1", target: admin, change: { isActive: true }, activeAdminCount: 1 })).toBeNull();
    expect(checkUserChange({ actorId: "a1", target: admin, change: { role: "ADMIN" }, activeAdminCount: 1 })).toBeNull();
  });
});
