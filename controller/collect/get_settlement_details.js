import mysql2 from 'mysql2';
import { getProdDbConfig } from '../../db.js';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function getSettlementDetails(company, settlementId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sql = "SELECT idlineas FROM colecta_liquidaciones WHERE superado = 0 AND elim = 0 AND did = ?";
        const result = await executeQuery(dbConnection, sql, [settlementId]);
        const idlineas = result[0]?.idlineas;

        if (!idlineas) {
            throw new CustomException({
                title: 'No se encontraron detalles de la liquidación.',
                message: 'No se encontro la idlineas de la liquidación',
            });
        }

        const sqlDetalle = `
            SELECT eh.didEnvio, e.ml_shipment_id, e.didCliente, c.nombre_fantasia, eh.fecha
            FROM envios_historial AS eh
            LEFT JOIN envios AS e ON e.superado = 0 AND e.elim = 0 AND e.did = eh.didEnvio
            LEFT JOIN clientes AS c ON c.superado = 0 AND c.elim = 0 AND c.did = e.didCliente
            WHERE eh.superado = 0 AND eh.elim = 0 AND eh.id IN (?);
        `;
        const detalleResult = await executeQuery(dbConnection, sqlDetalle, [idlineas]);

        const collectDetails = detalleResult.map(row => ({
            didEnvio: row.didEnvio,
            ml_shipment_id: row.ml_shipment_id,
            cliente: row.nombre_fantasia,
            fecha: row.fecha
        }));

        return collectDetails;
    } catch (error) {
        logRed(`Error en getSettlementDetails: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en obtener detalles de liquidación.',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}