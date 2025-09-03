import { executeQuery, getProdDbConfig, getZonesByCompany } from "../../db.js";
import mysql2 from 'mysql2';
import CustomException from "../../classes/custom_exception.js";

export async function getSettlementDetails(company, settlementId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const zones = await getZonesByCompany(company.did);

        const queryLines = "SELECT idlineas FROM liquidaciones WHERE superado=0 AND elim=0 AND did = ?";

        const resultQueryLine = await executeQuery(dbConnection, queryLines, [settlementId]);

        if (resultQueryLine.length === 0) {
            throw new CustomException({
                title: 'Error en liquidación',
                message: 'No se encontró la liquidación',
            });
        }

        const idLine = resultQueryLine.length > 0 ? resultQueryLine[0].idlineas : "";

        const sql = `SELECT e.ml_shipment_id, e.didEnvioZona, e.flex, ce.chofer, e.did,
            DATE_FORMAT(eh.fecha, '%d/%m/%Y') as fecha, eh.estado
                 FROM envios_historial AS eh 
                 JOIN envios AS e ON e.elim = 0 AND e.superado = 0 AND e.did = eh.didEnvio
                 JOIN costos_envios AS ce ON ce.elim = 0 AND ce.superado = 0 AND ce.didEnvio = e.did
                 WHERE eh.id IN(${idLine})`;

        const results = await executeQuery(dbConnection, sql, []);

        return results.map(row => ({
            total: row.chofer * 1,
            didEnvio: row.did * 1,
            estado: row.estado * 1,
            fecha: row.fecha,
            tracking: row.ml_shipment_id,
            zona: zones[row.didEnvioZona] || "Zona desconocida"
        }));
    } catch (error) {
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo detalles de liquidación',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}