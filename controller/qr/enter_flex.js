import { connectionsPools, executeQuery, executeQueryFromPool, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql2';
import { logRed, logYellow } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";
import { sendToShipmentStateMicroService } from "../../src/funciones/sendToShipmentStateMicroService.js";

export async function enterFlex(company, dataQr, userId, profile) {
    const pool = connectionsPools[company.did];

    try {
        const mlShipmentId = dataQr.id;

        const mlSellerId = dataQr.sender_id;

        let clientId = 0;
        let accountId = 0;

        const clienteQuery = `
            SELECT didCliente, did FROM clientes_cuentas 
            WHERE superado = 0 AND elim = 0 AND tipoCuenta = 1 AND ML_id_vendedor = ?
            ORDER BY didCliente ASC
            `;

        const clientResult = await executeQueryFromPool(pool, clienteQuery, [mlSellerId]);

        if (clientResult.length > 0) {
            clientId = clientResult[0].didCliente;
            accountId = clientResult[0].did;
        } else {
            throw new CustomException({
                title: 'Error ingresando al Flex',
                message: 'No se encontró el cliente asociado al vendedor',
            });
        }

        const envioQuery = `
            SELECT did, estado FROM envios 
            WHERE superado = 0 AND elim = 0 AND ml_shipment_id = ? AND ml_vendedor_id = ?
            `;

        const envioResult = await executeQueryFromPool(pool, envioQuery, [mlShipmentId, mlSellerId]);

        let isLoaded = envioResult.length > 0;

        const nowInHours = new Date().getHours();
        const fecha_despacho = await setDispatchDate(pool, clientId, nowInHours);
        const fecha_inicio = new Date().toISOString().slice(0, 19).replace("T", " ");

        if (!isLoaded) {
            const fechaunix = Math.floor(Date.now() / 1000);

            let shipmentId = 0;

            const insertEnvioQuery = `
                INSERT INTO envios(did, ml_shipment_id, ml_vendedor_id, didCliente, quien, lote, fecha_despacho, didCuenta, ml_qr_seguridad, fecha_inicio, fechaunix) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

            const insertResult = await executeQueryFromPool(pool, insertEnvioQuery, [
                shipmentId, mlShipmentId, mlSellerId, clientId, userId, '', fecha_despacho, accountId, JSON.stringify(dataQr), fecha_inicio, fechaunix
            ]);

            if (!insertResult.insertId) {
                throw new CustomException({
                    title: 'Error ingresando al Flex',
                    message: 'No se pudo guardar el envío en la base de datos',
                });
            }

            shipmentId = insertResult.insertId;

            const updateEnvioQuery = `
                    UPDATE envios SET did = ?
            WHERE superado = 0 AND elim = 0 AND id = ? AND ml_vendedor_id = ? AND ml_shipment_id = ?
                LIMIT 1
            `;
            await executeQueryFromPool(pool, updateEnvioQuery, [shipmentId, shipmentId, mlSellerId, mlShipmentId]);

            let shipmentState = 0;

            if (profile === 2) {
                shipmentState = 7;
            }

            await sendToShipmentStateMicroService(company.did, userId, shipmentState, shipmentId);
            // await setShipmentState(dbConnection, shipmentId, shipmentState, "");

            if (profile === 3) {
                await updateWhoPickedUp(pool, userId, shipmentId);
            }

            return;

        } else {

            throw new CustomException({
                title: 'Error ingresando al Flex',
                message: 'El envío ya está cargado'
            });

        }
    } catch (error) {
        logRed(`Error en enterFlex: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error ingresando al Flex',
            message: error.message,
            stack: error.stack
        });
    }
}
async function setShipmentState(pool, shipmentId, shipmentState, userId) {
    try {

        const estadoActualQuery = `
            SELECT estado FROM envios_historial 
            WHERE didEnvio = ? AND superado = 0 AND elim = 0 
            LIMIT 1
            `;

        const estadoActualResult = await executeQueryFromPool(pool, estadoActualQuery, [shipmentId]);

        const currentShipmentState = estadoActualResult.length ? estadoActualResult[0].estado : -1;

        if (currentShipmentState !== shipmentState) {
            const updateHistorialQuery = `
                UPDATE envios_historial 
                SET superado = 1 
                WHERE superado = 0 AND elim = 0 AND didEnvio = ?
            `;

            await executeQueryFromPool(pool, updateHistorialQuery, [shipmentId]);

            const updateEnviosQuery = `
                UPDATE envios 
                SET estado_envio = ?
            WHERE superado = 0 AND did = ?
                `;

            await executeQueryFromPool(pool, updateEnviosQuery, [shipmentState, shipmentId]);

            const operadorQuery = `
                SELECT operador FROM envios_asignaciones 
                WHERE didEnvio = ? AND superado = 0 AND elim = 0
            `;

            const operadorResult = await executeQueryFromPool(pool, operadorQuery, [shipmentId]);

            const driverId = operadorResult.length ? operadorResult[0].operador : 0;

            const date = new Date().toISOString().slice(0, 19);

            const insertHistorialQuery = `
                INSERT INTO envios_historial(didEnvio, estado, quien, fecha, didCadete) 
                VALUES(?, ?, ?, ?, ?)
                `;

            await executeQueryFromPool(pool, insertHistorialQuery, [shipmentId, shipmentState, userId, date, driverId]);
        }

        return;
    } catch (error) {
        logRed(`Error en setShipmentState: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error poniendo estado al envío',
            message: error.message,
            stack: error.stack
        });
    }
}

async function setDispatchDate(pool, clientId) {
    let closeHour = 16;

    try {
        const configRows = await executeQueryFromPool(
            pool,
            "SELECT config FROM `sistema_config` WHERE superado=0 AND elim=0",
            []
        );

        if (configRows.length > 0) {
            const strconfig = configRows[0].config;
            const Aconfig = JSON.parse(strconfig);
            if (Aconfig.hora_cierre) {
                closeHour = parseInt(Aconfig.hora_cierre);
            }
        }

        const clienteRows = await executeQueryFromPool(
            pool,
            "SELECT hora FROM `clientes_cierre_ingreso` WHERE superado=0 AND elim=0 AND didcliente = ? LIMIT 1",
            [clientId]
        );

        if (clienteRows.length > 0) {
            const htemp = clienteRows[0].hora;
            if (htemp !== 0) {
                closeHour = parseInt(htemp);
            }
        }

        const nowInHour = new Date().getHours();

        const now = new Date();

        if (nowInHour >= closeHour) {
            now.setDate(now.getDate() + 1);
        }

        return now.toISOString().split("T")[0];
    } catch (error) {
        logRed(`Error en setDispatchDate: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error poniendo fecha de despacho',
            message: error.message,
            stack: error.stack
        });
    }
}

async function updateWhoPickedUp(pool, userId, driverId) {
    try {
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");

        const query = `
            UPDATE envios 
            SET quien_retiro = ?, quien_retiro_fecha = ?
            WHERE superado = 0 AND elim = 0 AND did = ?
                `;

        await executeQueryFromPool(pool, query, [userId, now, driverId]);

    } catch (error) {
        logRed(`Error en updateWhoPickedUp: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error actualizando quien retiró',
            message: error.message,
            stack: error.stack
        });
    }
}