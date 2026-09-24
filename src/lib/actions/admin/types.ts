export type Fail = { ok: false; error: string };

/** Resultado estándar de las acciones de administración. */
export type ActionResult<T extends object = object> = ({ ok: true } & T) | Fail;
