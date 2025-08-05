import { executeQuery, getProdDbConfig, getZonesByCompany, getClientsByCompany } from "../../db.js";
import mysql2 from 'mysql2';
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from '../../classes/custom_exception.js';
import LogisticaConf from "../../classes/logisticas_conf.js";

export async function crossDocking(dataQr, company, dbConnection) {

    let shipmentId;
    let queryWhereId = '';
    const isLocal = dataQr.hasOwnProperty("local");

    if (isLocal) {
        shipmentId = dataQr.did;

        if (company.did != dataQr.empresa) {
            const queryEnviosExteriores = `
                    SELECT didLocal
                    FROM envios_exteriores
                    WHERE didExterno = ?
                    AND didEmpresa = ?
                `;
            const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, [shipmentId, dataQr.empresa]);

            if (resultQueryEnviosExteriores.length == 0) {
                throw new CustomException({
                    title: "Error en crossDocking",
                    message: "El envío no pertenece a la empresa"
                });
            }

            shipmentId = resultQueryEnviosExteriores[0].didLocal;

        }
        queryWhereId = `WHERE e.did = ${shipmentId} AND e.superado = 0 AND e.elim = 0`;
    } else {
        // tiene habilitado el barcode y es codigo de barra
        if (LogisticaConf.hasBarcodeEnabled(company.did) && !dataQr.hasOwnProperty('sender_id') && !dataQr.hasOwnProperty('t')) {
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
                CONCAT(su.nombre, ' ', su.apellido) AS driver,
                rp.orden
            FROM envios AS e
            LEFT JOIN envios_asignaciones AS ea
                ON ea.didEnvio = e.did AND ea.superado = 0 AND ea.elim = 0
            LEFT JOIN sistema_usuarios AS su
                ON ea.operador = su.did AND su.superado = 0 AND su.elim = 0
            LEFT JOIN ruteo_paradas AS rp
                ON rp.didPaquete = e.did AND rp.superado = 0 AND rp.elim = 0
            ${queryWhereId}
            LIMIT 1
        `;
    const envioData = await executeQuery(dbConnection, queryEnvios, []);

    if (envioData.length === 0) {
        throw new CustomException({
            title: "Error en crossDocking",
            message: "No se encontró el envío"
        });
    }

    const row = envioData[0];

    const clients = await getClientsByCompany(dbConnection, company.did);

    const zones = await getZonesByCompany(dbConnection, company.did);

    return {
        shipmentState: row.shipmentState,
        date: row.date,
        client: clients[row.clientId]?.nombre || "Desconocido",
        zone: zones[row.zoneId]?.nombre || "Desconocido",
        driver: row.driver ?? "Sin asignar",
        order: row.orden ?? null,
    };

}