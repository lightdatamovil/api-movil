import { connectionsPools, executeQueryFromPool } from "../../db.js";

export async function getCantidadAsignaciones(companyId, userId) {
    const query = `SELECT
                    operador,
                    COUNT(*) AS total_lineas
                    FROM envios_asignaciones
                    WHERE 
                    quien = ?
                    AND quien <> operador
                    AND operador <> 0
                    AND DATE(autofecha) = CURDATE()
                    GROUP BY operador;`;
    const result = await executeQueryFromPool(connectionsPools[companyId], query, [userId]);

    if (result.length === 0) {
        return [];
    }

    const asignaciones = result.map(row => ({
        chofer: row.operador,
        cantidad: row.total_lineas
    }));

    return asignaciones;
}