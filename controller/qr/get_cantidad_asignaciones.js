import { executeQuery, getProdDbConfig } from "../../db.js";
import mysql2 from "mysql2";
import { logRed } from "../../src/funciones/logsCustom.js";

export async function getCantidadAsignaciones(company, userId, profile) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();
    try {
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