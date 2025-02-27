import { getProdDbConfig, executeQuery } from "../db.js";
import mysql from "mysql";
import axios from "axios";

export async function uploadImage(company, shipmentId, userId, shipmentState, image, lineId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect()

    try {
        const companyId = company.did;
        const reqBody = { image, shipmentId, userId, companyId, shipmentState, lineId };
        const server = 1;
        const url = 'https://files.lightdata.app/upload.php';

        const response = await axios.post(url, reqBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data) {
            throw new Error("Error servidor files");
        }

        const insertQuery = "INSERT INTO envios_fotos (didEnvio, nombre, server, quien, id_estado, estado) VALUES (?, ?, ?, ?, ?, ?)";

        await executeQuery(dbConnection, insertQuery, [shipmentId, response.data, server, userId, lineId, shipmentState]);
    } catch (error) {
        console.error("Error en uploadImage:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function registerVisit(company, userId, shipmentId, recieverDNI, recieverName, latitude, longitude, shipmentState, observation) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect()

    try {
        const queryEnviosHistorial = "SELECT estado FROM envios_historial WHERE superado = 0 AND elim = 0 AND didEnvio = ?";

        const estadoActualRows = await executeQuery(dbConnection, queryEnviosHistorial, [shipmentId]);

        if (estadoActualRows.length == 0) {
            throw new Error("No se encontró el envío");
        }

        if (estadoActualRows.length > 0 && estadoActualRows[0].estado == 8) {
            throw new Error("El envío fue cancelado");
        }

        const shipmentState = estadoActualRows[0].estado;

        // Para wynflex si esta entregado
        if (shipmentState == 5 && company.did == 72) {
            const queryEnvios = "SELECT didCliente, didCuenta, flex FROM envios WHERE superado = 0 AND elim = 0 AND did = ?";

            const envioRows = await executeQuery(dbConnection, queryEnvios, [shipmentId]);

            if (envioRows.length > 0 && envioRows[0].flex === 1) {
                const queryMLShipment = "SELECT ml_shipment_id FROM envios WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1";

                const mlshipmentRows = await executeQuery(dbConnection, queryMLShipment, [shipmentId]);

                if (mlshipmentRows.length > 0) {
                    const token = await getToken(envioRows[0].didCliente, envioRows[0].didCuenta, idEmpresa);

                    const dataML = await mlShipment(token, mlshipmentRows[0].ml_shipment_id);

                    if (!dataML || dataML.status !== "delivered") {
                        throw new Error("Debe ser entregado en MercadoLibre");
                    }
                }
            }
        }

        const queryRuteoParadas = "UPDATE ruteo_paradas SET cerrado = 1 WHERE superado = 0 AND elim = 0 AND didPaquete = ?";

        await executeQuery(dbConnection, queryRuteoParadas, [shipmentId]);

        const queryRuteo = "SELECT didRuteo FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didPaquete = ?";

        const rutaRows = await executeQuery(dbConnection, queryRuteo, [shipmentId]);

        if (rutaRows.length > 0) {
            const didRuta = rutaRows[0].didRuteo;

            const queryRuteoParadas = "SELECT didPaquete, cerrado FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didRuteo = ?";

            const enviosRutaRows = await executeQuery(dbConnection, queryRuteoParadas, [didRuta]);

            const cierroRuta = enviosRutaRows.every(envio => envio.cerrado === 1);

            if (cierroRuta) {
                const queryRuteo = "UPDATE ruteo SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ?";

                await executeQuery(dbConnection, queryRuteo, [didRuta]);
            }
        }

        const queryEnviosRecibe = "INSERT INTO envios_recibe (didEnvio, dni, nombre, ilat, ilong, quien) VALUES (?, ?, ?, ?, ?, ?)";

        await executeQuery(dbConnection, queryEnviosRecibe, [shipmentId, recieverDNI, recieverName, latitude, longitude, userId]);

        const queryEnvios = "SELECT choferAsignado, estado_envio FROM envios WHERE superado = 0 AND elim = 0 AND did = ?";

        const choferRows = await executeQuery(dbConnection, queryEnvios, [shipmentId]);

        const assignedDriverId = choferRows[0]?.choferAsignado ?? null;

        const queryInsertEnviosHistorial = "INSERT INTO envios_historial (didEnvio, estado, didCadete, fecha, desde, quien) VALUES (?, ?, ?, NOW(), 'MOVIL', ?)";

        const historialResult = await executeQuery(dbConnection, queryInsertEnviosHistorial, [shipmentId, shipmentState, assignedDriverId, userId]);

        const idInsertado = historialResult.insertId;

        const updates = [
            { query: "UPDATE envios_historial SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?", values: [shipmentId, idInsertado] },
            { query: "UPDATE envios SET estado_envio = ? WHERE superado = 0 AND did = ? AND elim = 0", values: [shipmentState, shipmentId] },
            { query: "UPDATE envios_asignaciones SET estado = ? WHERE superado = 0 AND didEnvio = ? AND elim = 0", values: [shipmentState, shipmentId] }
        ];

        for (const { query, values } of updates) {
            await executeQuery(dbConnection, query, values);
        }

        if (observation) {
            const queryInsertObservaciones = "INSERT INTO envios_observaciones (didEnvio, observacion, quien) VALUES (?, ?, ?)";

            const obsResult = await executeQuery(dbConnection, queryInsertObservaciones, [shipmentId, observation, quien]);

            const queryUpdateEnviosObservaciones = "UPDATE envios_observaciones SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?";

            await executeQuery(dbConnection, queryUpdateEnviosObservaciones, [shipmentId, obsResult.insertId]);
        };

        return idInsertado;
    } catch (error) {
        console.error("Error in register visit:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

async function getToken(clientId, accountId, companyId) {
    const url = `https://cuentasarg.lightdata.com.ar/getTokenML.php?dc=${clientId}&dc2=${accountId}&didEmpresa=${companyId}&ventaflex=0`;

    try {
        const { data } = await axios.get(url);

        return data.trim();
    } catch (error) {
        console.error("Error obteniendo token:", error);
        throw error;
    }
}

async function mlShipment(token, shipmentId) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}?access_token=${token}`;

    try {
        const { data } = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return data;
    } catch (error) {
        console.error("Error obteniendo datos de MercadoLibre:", error);
        throw error;
    }
}
