import { executeQuery, CustomException, Status } from 'lightdata-tools';

export async function getCollectList(dbConnection, req) {
    const { userId } = req.user;

    // Tomo de params y limpio por si vienen como "from=2025-09-29"
    let from = String(req.params.from ?? '').replace(/^from=/i, '').trim();
    let to = String(req.params.to ?? '').replace(/^to=/i, '').trim();

    if (!from || !to) {
        throw new CustomException({
            title: 'Parámetros inválidos',
            message: 'Debes enviar fechas en la URL: /get-collect-list/:from/:to',
            status: Status.badRequest,
        });
    }

    // Validación formato YYYY-MM-DD
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDate.test(from) || !isoDate.test(to)) {
        throw new CustomException({
            title: 'Formato de fecha inválido',
            message: 'Usa YYYY-MM-DD en from y to (ej: 2025-09-29)',
            status: Status.badRequest,
        });
    }

    // Aseguro orden del rango
    if (from > to) [from, to] = [to, from];

    // Si "fecha" es DATETIME, este patrón incluye todo el día "to"
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

    // OJO: sin comillas en los placeholders
    const rows = await executeQuery(dbConnection, sql, [userId, from, to]);

    const body = rows.map(r => ({ fecha: r.fecha.toISOString().split('T')[0] }));

    return {
        body,
        message: 'Listado de colectas obtenido correctamente',
    };
}
