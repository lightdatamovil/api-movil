import { executeQuery } from "lightdata-tools";

export async function getCantidadAsignaciones({ db, req }) {
    const { userId, profile } = req.user;

    const query = `SELECT
                    operador,
                    COUNT(*) AS total_lineas
                    FROM envios_asignaciones
                    WHERE 
                    quien = ?
                    AND quien ${profile === 3 ? "=" : "<>"} operador
                    AND operador <> 0
                    AND DATE(autofecha) = CURDATE()
                    AND superado = 0
                    AND elim = 0
                    GROUP BY operador;`;
    const result = await executeQuery(db, query, [userId], true);

    if (result.length === 0) {
        return [];
    }

    const asignaciones = result.map(row => ({
        chofer: row.operador,
        cantidad: row.total_lineas
    }));

    return {
        body: asignaciones,
        message: "Datos obtenidos correctamente",
        success: true,
    };
}