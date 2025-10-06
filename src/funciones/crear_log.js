import { executeQueryFromPool, getHeaders, logGreen, logPurple } from "lightdata-tools";
import { poolLocal } from "../../db.js";

export async function crearLog(req, tiempo, resultado, exito) {
    // ---------- helpers ----------
    const toInt = (v, def = null) => {
        const n = parseInt(v ?? "", 10);
        return Number.isFinite(n) ? n : def;
    };
    const safeParse = (maybeJson, fallback = {}) => {
        if (maybeJson == null) return fallback;
        if (typeof maybeJson === "object") return maybeJson;
        try { return JSON.parse(String(maybeJson)); } catch { return fallback; }
    };

    // ---------- auth (token opcional) ----------
    // Prioridad: token -> headers -> body -> 0
    const userFromToken = req.user || {};
    const bodyRaw = typeof req.body === "string" ? safeParse(req.body, {}) : (req.body || {});
    const companyId =
        toInt(userFromToken.companyId) ??
        toInt(req.get?.("x-company-id")) ??
        toInt(bodyRaw.companyId) ??
        0;
    const userId =
        toInt(userFromToken.userId) ??
        toInt(req.get?.("x-user-id")) ??
        toInt(bodyRaw.userId) ??
        0;
    const profile =
        toInt(userFromToken.profile) ??
        toInt(req.get?.("x-profile")) ??
        toInt(bodyRaw.profile) ??
        0;

    // ---------- normalización de body/resultado ----------
    const endpointClean = String(req.url || "").replace(/"/g, "");
    const resultadoObj = safeParse(resultado, resultado ?? {});
    const bodyObj = { ...safeParse(req.body, {}) };

    // headers de dispositivo (no fallar si getHeaders tira)

    const { appVersion, androidVersion, model, deviceId, brand } = getHeaders(req);
    if (appVersion) bodyObj.appVersion = appVersion;
    if (androidVersion) bodyObj.androidVersion = androidVersion;
    if (model) bodyObj.model = model;
    if (deviceId) bodyObj.deviceId = deviceId;
    if (brand) bodyObj.brand = brand;

    // ---------- mascarado según endpoint ----------
    if (endpointClean === "/company-identification" && (exito ? 1 : 0) === 1) {
        resultadoObj.image = "Imagen eliminada por logs";
    }
    if (endpointClean === "/upload-image" || endpointClean === "/change-profile-picture") {
        bodyObj.image = "Imagen eliminada por logs";
    }

    // ---------- stringify seguro y (opcional) truncado ----------
    const safeStringify = (obj) => {
        try { return JSON.stringify(obj); } catch { return JSON.stringify({ _error: "stringify_failed" }); }
    };
    // Si tu columna es TEXT mediano y te preocupa tamaño, podés truncar:
    const BODY_MAX = 65; // ajustá según tu columna
    const RESULT_MAX = 65;

    let bodyStr = safeStringify(bodyObj);
    if (bodyStr.length > BODY_MAX) bodyStr = bodyStr.slice(0, BODY_MAX - 3) + "...";

    let resultadoStr = safeStringify(resultadoObj);
    if (resultadoStr.length > RESULT_MAX) resultadoStr = resultadoStr.slice(0, RESULT_MAX - 3) + "...";

    // ---------- INSERT ----------
    const sql = `
      INSERT INTO logs_v2
        (empresa, usuario, perfil, body, tiempo, resultado, endpoint, exito)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        companyId,
        userId,
        profile,
        bodyStr,
        tiempo,
        resultadoStr,
        endpointClean,
        exito ? 1 : 0,
    ];

    await executeQueryFromPool(poolLocal, sql, values);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fechaFormateada = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    logGreen(`${fechaFormateada} Log creado correctamente`);
    logGreen(`Endpoint: ${endpointClean} | Usuario: ${userId} | Empresa: ${companyId} | Perfil: ${profile}`);
    logPurple(`En ${tiempo} ms | Éxito: ${exito ? "sí" : "no"}`);
}
