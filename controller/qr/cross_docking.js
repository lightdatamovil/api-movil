import { getZonesByCompany, getClientsByCompany, connectionsPools, executeQueryFromPool } from "../../db.js";
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from '../../classes/custom_exception.js';

export async function crossDocking(dataQr, companyId) {
    const pool = connectionsPools[companyId];

    try {
        let shipmentId;
        let queryWhereId = '';
        const isLocal = Object.prototype.hasOwnProperty.call(dataQr, "local");

        if (isLocal) {
            shipmentId = dataQr.did;

            if (companyId != dataQr.empresa) {
                const queryEnviosExteriores = `
                    SELECT didLocal
                    FROM envios_exteriores
                    WHERE didExterno = ?
                    AND didEmpresa = ?
                `;
                const resultQueryEnviosExteriores = await executeQueryFromPool(pool, queryEnviosExteriores, [shipmentId, companyId]);

                if (resultQueryEnviosExteriores.length == 0) {
                    throw new CustomException({
                        title: "Error en crossDocking",
                        message: "El envío no pertenece a la empresa"
                    });
                }

                shipmentId = resultQueryEnviosExteriores[0];
            }
            queryWhereId = `WHERE e.did = ${shipmentId} AND e.superado = 0 AND e.elim = 0`;
        } else {
            if (companyId == 211 && !Object.prototype.hasOwnProperty.call(dataQr, "sender_id")) {
                shipmentId = dataQr;
                queryWhereId = `WHERE e.superado=0 AND e.elim=0 AND e.ml_shipment_id = '${shipmentId}'`;
            } else {
                shipmentId = dataQr.id;
                queryWhereId = `WHERE e.superado=0 AND e.elim=0 AND e.ml_shipment_id = ${shipmentId}`;
            }

        }

        const queryEnvios = `
            SELECT
                e.estado_envio AS shipmentState,
                e.didCliente AS clientId,
                e.didEnvioZona AS zoneId,
                DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') AS date,
                CONCAT(su.nombre, ' ', su.apellido) AS driver
            FROM envios AS e
            LEFT JOIN envios_asignaciones AS ea
                ON ea.didEnvio = e.did AND ea.superado = 0 AND ea.elim = 0
            LEFT JOIN sistema_usuarios AS su
                ON ea.operador = su.did AND su.superado = 0 AND su.elim = 0
            ${queryWhereId}
            LIMIT 1
        `;
        const envioData = await executeQueryFromPool(pool, queryEnvios, []);

        if (envioData.length === 0) {
            throw new CustomException({
                title: "Error en crossDocking",
                message: "No se encontró el envío"
            });
        }

        const row = envioData[0];

        const clients = await getClientsByCompany(pool, companyId);

        const zones = await getZonesByCompany(pool, companyId);

        return {
            shipmentState: row.shipmentState,
            date: row.date,
            client: clients[row.clientId]?.nombre || "Desconocido",
            zone: zones[row.zoneId]?.nombre || "Desconocido",
            driver: row.driver ?? "Sin asignar"
        };
    } catch (error) {
        logRed(`Error en crossDocking: ${error.stack}`);
        throw error;
    }
}