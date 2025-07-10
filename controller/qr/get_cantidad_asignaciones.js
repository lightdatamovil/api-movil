import { executeQuery } from "../../db.js";

export async function getCantidadAsignaciones(companyId, userId) {
    const dbConfig = getProdDbConfig(companyId);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();
    try {
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
        const result = await executeQuery(dbConnection, query, [userId]);

        if (result.length === 0) {
            return [];
        }

        const asignaciones = result.map(row => ({
            chofer: row.operador,
            cantidad: row.total_lineas
        }));

        return asignaciones;
    } catch (error) {
        logRed(`Error en driverList: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}