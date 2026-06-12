import { Router, type IRouter } from "express";
import {
  ADMIN_PASSWORD_HEADER,
  getAdminPassword,
  verifyAdminPassword,
  PANEL_PASSWORD_HEADER,
  getPanelPassword,
  verifyPanelPassword,
} from "../lib/admin-auth";

const router: IRouter = Router();

/**
 * Verify an admin password without performing any write. Used by the admin UI
 * to unlock the protected Configuración page. Accepts the password via the
 * `x-admin-password` header or a `{ password }` JSON body.
 */
router.post("/admin/verify", (req, res): void => {
  if (!getAdminPassword()) {
    res
      .status(503)
      .json({ error: "La protección de administrador no está configurada." });
    return;
  }

  const header = req.header(ADMIN_PASSWORD_HEADER);
  const body =
    typeof req.body?.password === "string" ? req.body.password : undefined;
  const candidate = header ?? body;

  if (!verifyAdminPassword(candidate)) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }

  res.json({ ok: true });
});

/**
 * Verify a panel password without performing any write. Used by the admin
 * dashboard to unlock the guest management panel. Accepts the password via the
 * `x-panel-password` header or a `{ password }` JSON body.
 */
router.post("/panel/verify", (req, res): void => {
  if (!getPanelPassword()) {
    res
      .status(503)
      .json({ error: "La protección del panel no está configurada." });
    return;
  }

  const header = req.header(PANEL_PASSWORD_HEADER);
  const body =
    typeof req.body?.password === "string" ? req.body.password : undefined;
  const candidate = header ?? body;

  if (!verifyPanelPassword(candidate)) {
    res.status(401).json({ error: "Contraseña incorrecta." });
    return;
  }

  res.json({ ok: true });
});

export default router;
