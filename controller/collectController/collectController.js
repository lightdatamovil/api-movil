import mysql from 'mysql';
import { getProdDbConfig, executeQuery } from '../../db.js';

export async function getRoute(company, userId, date) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let hasRoute, routeId, additionalRouteData, client = null;

        const routeQuery = "SELECT id, did, dataRuta FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND fecha = ? AND didChofer = ?";
        const routeResult = await executeQuery(dbConnection, routeQuery, [date, userId]);

        if (routeResult.length > 0) {
            const dataRoute = JSON.parse(routeResult[0].dataRuta);
            hasRoute = true;
            routeId = Number(routeResult[0].did);
            additionalRouteData = {
                evitoAU: dataRoute.evitoAU,
                desde: Number(dataRoute.desde),
                lat: dataRoute.inicioGeo.lat,
                long: dataRoute.inicioGeo.long
            };

            const stopsQuery = `
                SELECT CRP.orden, CRP.didCliente, cld.ilong, cld.ilat, cld.calle, cld.numero, cld.ciudad, cl.nombre_fantasia
                FROM colecta_ruta_paradas AS CRP
                LEFT JOIN clientes AS cl ON cl.superado = 0 AND cl.elim = 0 AND cl.did = CRP.didCliente
                LEFT JOIN clientes_direcciones AS cld ON cld.superado = 0 AND cld.elim = 0 AND cld.cliente = CRP.didCliente
                WHERE CRP.superado = 0 AND CRP.elim = 0 AND CRP.didRuta = ? ORDER BY CRP.orden ASC;
            `;
            const stopsResult = await executeQuery(dbConnection, stopsQuery, [Adata.didRuta]);

            client = stopsResult.map(row => ({
                orden: row.orden ? Number(row.orden) : null,
                didCliente: row.didCliente ? Number(row.didCliente) : null,
                calle: row.calle || "",
                numero: String(row.numero || ""),
                ciudad: row.ciudad || "",
                latitud: row.ilat ? Number(row.ilat) : null,
                longitud: row.ilong ? Number(row.ilong) : null,
                nombreCliente: row.nombre_fantasia || ""
            }));
        } else {

            const assignmentQuery = `
                SELECT ca.didCliente, cd.calle, cd.numero, cd.localidad, cd.ciudad, cd.provincia, cd.ilong, cd.ilat, c.nombre_fantasia
                FROM colecta_asignacion AS ca
                LEFT JOIN clientes_direcciones AS cd ON cd.superado = 0 AND cd.elim = 0 AND cd.cliente = ca.didCliente
                LEFT JOIN clientes AS c ON c.superado = 0 AND c.elim = 0 AND cd.cliente = c.did
                WHERE ca.fecha LIKE ? AND ca.superado = 0 AND ca.elim = 0 AND ca.didChofer = ? GROUP BY ca.didCliente;
            `;
            const assignmentResult = await executeQuery(dbConnection, assignmentQuery, [date, userId]);

            client = assignmentResult.map(row => ({
                orden: null,
                didCliente: row.didCliente ? Number(row.didCliente) : null,
                calle: row.calle || "",
                numero: String(row.numero || ""),
                ciudad: row.ciudad || "",
                localidad: row.localidad || "",
                provincia: row.provincia || "",
                latitud: row.ilat ? Number(row.ilat) : null,
                longitud: row.ilong ? Number(row.ilong) : null,
                nombreCliente: row.nombre_fantasia || ""
            }));
        }

        return {
            hasRote: hasRoute,
            routeId: routeId,
            additionalRouteData: additionalRouteData,
            client: client
        };
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function startRoute(company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();
    return true;
}

export async function saveRoute(company, date, userId, additionalRouteData, orders) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const fechaOpeFormatted = date.split('/').reverse().join('-');

        const fecha = new Date().toISOString().split('T')[0];

        let didAsuperar = 0;

        const rows = await executeQuery(
            dbConnection,
            "SELECT did FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND didChofer = ?",
            [userId]
        );

        if (rows.length == 0) {
            throw new Error("No se encontró una ruta para superar.");
        }

        didAsuperar = rows[0].did;

        await executeQuery(
            dbConnection,
            "UPDATE colecta_ruta SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1",
            [didAsuperar]
        );

        await executeQuery(
            dbConnection,
            "UPDATE colecta_ruta_paradas SET superado = 1 WHERE superado = 0 AND elim = 0 AND didRuta = ?",
            [didAsuperar]
        );

        const result = await executeQuery(
            dbConnection,
            "INSERT INTO colecta_ruta (desde, fecha, fechaOperativa, didChofer, quien, dataRuta) VALUES (?, ?, ?, ?, ?, ?)",
            [2, fecha, fechaOpeFormatted, userId, userId, JSON.stringify(additionalRouteData)]
        );

        const newId = result.insertId;

        if (orders.length === 0) {
            throw new Error("No se encontraron paradas para la ruta.");
        }

        const insertParadas = orders.map(({ orden, cliente, ordenLlegada }) =>
            executeQuery(
                dbConnection,
                "INSERT INTO colecta_ruta_paradas (didRuta, didCliente, orden, demora, fecha_colectado, quien) VALUES (?, ?, ?, ?, ?, ?)",
                [newId, cliente, orden, ordenLlegada, fechaOpeFormatted, userId]
            )
        );

        await Promise.all(insertParadas);

        return;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getCollectDetails(company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const clientesResult = await executeQuery(
            dbConnection,
            "SELECT did, nombre_fantasia FROM clientes WHERE superado=0 AND elim=0"
        );

        let Aclientes = {};

        clientesResult.forEach(row => {
            Aclientes[row.did] = row.nombre_fantasia;
        });

        const enviosResult = await executeQuery(
            dbConnection,
            `SELECT didCliente, didEnvio 
             FROM colecta_asignacion 
             WHERE superado=0 AND elim=0 AND didChofer = ? AND fecha = ?`,
            [userId, date]
        );

        let collectDetails = {};

        enviosResult.forEach(row => {
            if (!collectDetails[row.didCliente]) {
                collectDetails[row.didCliente] = {
                    nombre_fantasia: Aclientes[row.didCliente] || "Cliente desconocido",
                    total: 0
                };
            }
            collectDetails[row.didCliente].total += 1;
        });

        let respuesta = Object.entries(collectDetails).map(([id, data]) => ({
            id,
            ...data
        }));

        return respuesta;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function shipmentsFromClient(company, date, clientId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sql = `
            SELECT ca.didEnvio, e.ml_shipment_id, e.ml_venta_id, e.flex
            FROM colecta_asignacion AS ca
            JOIN envios AS e ON e.did = ca.didEnvio AND e.superado = 0 AND e.elim = 0
            WHERE ca.superado = 0 AND ca.elim = 0 AND ca.fecha = ? AND ca.didCliente = ?
        `;

        const result = await executeQuery(dbConnection, sql, [date, clientId]);

        let shipmentsFromClient = result.map(row => ({
            didEnvio: Number(row.didEnvio),
            flex: Number(row.flex),
            ml_shipment_id: row.ml_shipment_id || null,
            ml_venta_id: row.ml_venta_id || null
        }));

        return shipmentsFromClient;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getCollectList(company, userId, from, to) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const query = `
            SELECT fecha, COUNT(didEnvio) as total 
            FROM colecta_asignacion 
            WHERE superado = 0 AND didChofer = ? AND elim = 0 AND fecha BETWEEN ? AND ? 
            GROUP BY fecha
        `;

        const results = await executeQuery(dbConnection, query, [userId, from, to]);

        const collectList = results.map(row => ({ fecha: row.fecha, total: row.total }));

        return collectList
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getSettlementList(company, from, to) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sql = `
            SELECT did, DATE_FORMAT(desde, '%d/%m/%Y') AS desde, total, 
                   DATE_FORMAT(hasta, '%d/%m/%Y') AS hasta, DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha
            FROM colecta_liquidaciones
            WHERE superado = 0 AND elim = 0 AND tipo = 2
            AND fecha BETWEEN ? AND ?
        `;

        const result = await executeQuery(dbConnection, sql, [from, to]);

        const settlementList = result.map(row => ({
            did: Number(row.did),
            total: Number(row.total),
            desde: row.desde,
            hasta: row.hasta,
            fecha: row.fecha
        }));

        return settlementList;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getCollectDetails(company, settlementId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sql = "SELECT idlineas FROM colecta_liquidaciones WHERE superado = 0 AND elim = 0 AND did = ?";
        const result = await executeQuery(dbConnection, sql, [settlementId]);
        const idlineas = result[0]?.idlineas;

        if (!idlineas) {
            throw new Error("No se encontraron detalles de la liquidación.");
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
        throw error;
    } finally {
        dbConnection.end();
    }
}