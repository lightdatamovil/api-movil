import { CustomException, executeQuery, getFechaLocalDePais, LogisticaConfig } from "lightdata-tools";
import { companiesService } from "../../db.js";

export async function crossDocking(dbConnection, req, company) {
    const { dataQr } = req.body;
    let shipmentId;
    let queryWhereId = '';
    const isLocal = Object.prototype.hasOwnProperty.call(dataQr, "local");

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
        if (LogisticaConfig.hasBarcodeEnabled(company.did) && !Object.prototype.hasOwnProperty.call(dataQr, 'sender_id') && !Object.prototype.hasOwnProperty.call(dataQr, 't')) {
            shipmentId = dataQr;
            queryWhereId = `WHERE e.superado=0 AND e.elim=0 AND e.ml_shipment_id = '${shipmentId}'`;
        } else {
            shipmentId = dataQr.id;
            queryWhereId = `WHERE e.superado=0 AND e.elim=0 AND e.ml_shipment_id = ${shipmentId}`;
        }

    }

    const date = getFechaLocalDePais(company.pais);
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
            LEFT JOIN ruteo AS r ON(
                r.elim = 0
                AND r.superado = 0
                AND r.fechaOperativa = CURDATE() AND r.didChofer = e.choferAsignado
            )
            LEFT JOIN ruteo_paradas AS rp ON(
                rp.superado = 0
                AND rp.elim = 0
                AND rp.didPaquete = e.did
                AND rp.didRuteo = r.did
                AND rp.autofecha like '${date}%'
            )
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

    const clients = await companiesService.getClientsByCompany(dbConnection, company.did);

    const zones = await companiesService.getZonesByCompany(dbConnection, company.did);

    return {
        body: {
            shipmentState: row.shipmentState,
            date: row.date,
            client: clients[row.clientId]?.nombre || "Desconocido",
            zone: zones[row.zoneId]?.nombre || "Desconocido",
            driver: row.driver ?? "Sin asignar",
            order: row.orden ?? null,
        }, message: "Datos obtenidos correctamente", success: true
    };
}