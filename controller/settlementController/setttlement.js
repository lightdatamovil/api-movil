import { executeQuery, getProdDbConfig, getZones, getZonesByCompany } from "../../db.js";
import mysql from 'mysql';

export async function getSettlementList(company, userId, from, to) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const dateFrom = new Date(from).toISOString().split('T')[0];
        const dateTo = new Date(to).toISOString().split('T')[0];

        const query = `
            SELECT l.did, l.total, DATE_FORMAT(l.autofecha, '%d-%m-%Y') AS fecha,
                   CONCAT(u.nombre, ' ', u.apellido) AS quienLiquido
            FROM liquidaciones AS l
            JOIN sistema_usuarios AS u ON (u.elim = 0 AND u.superado = 0 AND u.did = l.quien)
            WHERE l.superado = 0 AND l.elim = 0 AND l.didQuien = ?
            AND l.autofecha BETWEEN ? AND ?
        `;

        const values = [
            userId,
            `${dateFrom} 00:00:00`,
            `${dateTo} 23:59:59`
        ];

        const rows = await executeQuery(dbConnection, query, values);

        return rows.map(row => ({
            total: row.total * 1,
            fecha: row.fecha,
            quienLiquido: row.quienLiquido,
            did: row.did * 1
        }));
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}


export async function getSettlementDetails(company, settlementId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const zones = await getZonesByCompany(company.did);

        const queryLines = "SELECT idlineas FROM liquidaciones WHERE superado=0 AND elim=0 AND did = ?";

        const resultQueryLine = await executeQuery(dbConnection, queryLines, [settlementId]);

        const idLine = resultQueryLine.length > 0 ? resultQueryLine[0].idlineas : "";

        const sql = `SELECT e.ml_shipment_id, e.didEnvioZona, e.flex, ce.chofer, e.did, 
                        DATE_FORMAT(eh.fecha, '%d/%m/%Y') as fecha, eh.estado
                 FROM envios_historial AS eh 
                 JOIN envios AS e ON e.elim=0 AND e.superado=0 AND e.did = eh.didEnvio
                 JOIN costos_envios AS ce ON ce.elim=0 AND ce.superado=0 AND ce.didEnvio = e.did
                 WHERE eh.id IN (${idLine})`;

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
        throw error;
    }
}
export async function getSettlementShipmentDetails(company, shipmentId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const zones = await getZonesByCompany(company.did);

        const sql = `
        SELECT e.did, ce.chofer, e.estado_envio, e.flex, e.didEnvioZona, 
               DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha, cl.razon_social, 
               edd.cp, CONCAT(edd.address_line, ' ', edd.localidad) as direccion, 
               edd.destination_comments 
        FROM envios AS e 
        LEFT JOIN costos_envios AS ce ON (ce.elim=0 AND ce.superado=0 AND ce.didEnvio = e.did) 
        LEFT JOIN clientes AS cl ON (cl.elim=0 AND cl.superado=0 AND cl.did = e.didCliente) 
        LEFT JOIN envios_direcciones_destino AS edd ON (edd.elim=0 AND edd.superado=0 AND edd.didEnvio = e.did) 
        WHERE e.superado=0 AND e.elim=0 AND e.did = ?`;

        const resultados = await executeQuery(dbConnection, sql, [shipmentId]);

        if (resultados.length > 0) {
            const row = resultados[0];
            return {
                total: row.chofer ? parseInt(row.chofer) : 0,
                didEnvio: parseInt(row.did),
                direccion: row.direccion || "",
                vendedor: row.razon_social || "",
                estado: parseInt(row.estado_envio),
                fecha: row.fecha || "",
                tracking: "test01",
                origen: parseInt(row.flex),
                zona: zones[row.didEnvioZona] || "Zona no encontrada",
                cp: row.cp || "",
                obs: row.destination_comments || ""
            };
        } else {
            throw new Error("No se encontraron datos para el envío");
        }

    } catch (error) {
        throw error;
    }
}
