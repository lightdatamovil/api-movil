import { executeQuery, CustomException, Status } from "lightdata-tools";

export async function getCollectList(dbConnection, req) {
    const { userId } = req.user;

    let from = String(req.params.from ?? "").replace(/^from=/i, "").trim();
    let to = String(req.params.to ?? "").replace(/^to=/i, "").trim();

    if (!from || !to) {
        throw new CustomException({
            title: "Parámetros inválidos",
            message: "Debes enviar fechas en la URL: /get-collect-list/:from/:to",
            status: Status.badRequest
        });
    }

    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDate.test(from) || !isoDate.test(to)) {
        throw new CustomException({
            title: "Formato de fecha inválido",
            message: "Usa YYYY-MM-DD en from y to (ej: 2025-09-29)",
            status: Status.badRequest
        });
    }

    if (from > to) [from, to] = [to, from];

    const sql = `
        SELECT DATE(fecha) AS fecha
        FROM colecta_asignaciones
        WHERE superado = 0
          AND elim = 0
          AND didChofer = ?
          AND fecha >= ?
          AND fecha < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY DATE(fecha)
        ORDER BY fecha DESC
    `;

    const rows = await executeQuery({ dbConnection, query: sql, values: [userId, from, to] });

    const data = rows.map(r => ({ fecha: r.fecha.toISOString().split("T")[0] }));

    return {
        success: true,
        data,
        message: "Listado de colectas obtenido correctamente",
        meta: { total: data.length }
    };
}
