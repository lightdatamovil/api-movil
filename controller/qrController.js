import { executeQuery, getProdDbConfig, getDbConfig, getZonesByCompany, getClientsByCompany, getDriversByCompany } from "../db.js";
import mysql2 from 'mysql';
import axios from 'axios';
import { logRed } from "../src/funciones/logsCustom.js";

export async function crossDocking(dataQr, company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
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
                const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, [shipmentId, company.did]);

                if (resultQueryEnviosExteriores.length == 0) {
                    return { message: "El envío no pertenece a la empresa", success: false };
                }

                shipmentId = resultQueryEnviosExteriores[0];
            }
            queryWhereId = `WHERE e.did = ${shipmentId} AND e.superado = 0 AND e.elim = 0`;
        } else {
            shipmentId = dataQr.id;
            queryWhereId = 'WHERE e.superado = 0 AND e.elim = 0 AND e.ml_shipment_id =' + shipmentId;
        }

        const queryEnvios = `
            SELECT e.estado_envio AS shipmentState, e.didCliente AS clientId, e.didEnvioZona AS zoneId, DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') AS date, 
            CONCAT(su.nombre, ' ', su.apellido) AS driver
            FROM envios AS e
            LEFT JOIN sistema_usuarios AS su ON su.did = e.choferAsignado
            ${queryWhereId} LIMIT 1
        `;
        const envioData = await executeQuery(dbConnection, queryEnvios, [], true);

        if (envioData.length === 0) {
            return { message: "No se encontró el envío", success: false };
        }

        const row = envioData[0];

        const clients = await getClientsByCompany(dbConnection, company.did);

        const zones = await getZonesByCompany(dbConnection, company.did);

        return {
            body: {
                shipmentState: row.shipmentState,
                date: row.date,
                client: clients[row.clientId]?.nombre || "Desconocido",
                zone: zones[row.zoneId]?.nombre || "Desconocido",
                driver: row.driver ?? "Sin asignar"
            },
            message: "Datos obtenidos correctamente",
            success: true,
        };
    } catch (error) {
        logRed(`Error en crossDocking: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getShipmentIdFromQr(dataQr, company) {
    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        let shipmentId;

        const isLocal = dataQr.hasOwnProperty("local");

        if (isLocal) {
            shipmentId = dataQr.did;

            if (company.did != dataQr.empresa) {
                const queryEnviosExteriores = `SELECT didLocal FROM envios_exteriores WHERE didExterno = ${shipmentId} AND didEmpresa = ${company.did}`;

                const resultQueryEnviosExteriores = await executeQuery(dbConnection, queryEnviosExteriores, []);

                if (resultQueryEnviosExteriores.length == 0) {
                    return { message: "El envío no pertenece a la empresa", success: false };
                }

                shipmentId = resultQueryEnviosExteriores[0];
            }
        } else {
            const sellerId = dataQr.sender_id;
            const mlShipmentId = dataQr.sender_id;
            const queryEnvios = `SELECT did FROM envios WHERE shipmentid = ${mlShipmentId} AND seller_id = ${sellerId}`;

            const resultQueryEnvios = await executeQuery(dbConnection, queryEnvios, []);

            if (resultQueryEnvios.length == 0) {
                throw new Error("No se encontró el envío");
            }

            shipmentId = resultQueryEnvios[0];
        }

        return shipmentId;
    } catch (error) {
        logRed(`Error en getShipmentIdFromQr: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function driverList(company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        var driverList = [];

        const query = `
            SELECT u.did, concat(u.nombre, ' ', u.apellido) as nombre
            FROM sistema_usuarios as u JOIN sistema_usuarios_accesos as a on(a.elim = 0 and a.superado = 0 and a.usuario = u.did)
            where u.elim = 0 and u.superado = 0 and a.perfil IN(3, 6)
            ORDER BY nombre ASC
            `;

        const results = await executeQuery(dbConnection, query, []);

        for (let i = 0; i < results.length; i++) {
            const row = results[i];

            const driver = {
                "id": row.did,
                "nombre": row.nombre
            }

            driverList.push(driver);
        }

        return driverList;
    } catch (error) {
        logRed(`Error en driverList: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function enterFlex(company, dataQr, userId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

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

        const clientResult = await executeQuery(dbConnection, clienteQuery, [mlSellerId]);

        if (clientResult.length > 0) {
            clientId = clientResult[0].didCliente;
            accountId = clientResult[0].did;
        } else {
            throw new Error("No se encontró el cliente asociado al vendedor");
        }

        const envioQuery = `
            SELECT did, estado FROM envios 
            WHERE superado = 0 AND elim = 0 AND ml_shipment_id = ? AND ml_vendedor_id = ?
            `;

        const envioResult = await executeQuery(dbConnection, envioQuery, [mlShipmentId, mlSellerId]);

        let isLoaded = envioResult.length > 0;
        let shipmentData = envioResult.length ? envioResult[0] : {};

        const nowInHours = new Date().getHours();
        const fecha_despacho = await setDispatchDate(dbConnection, clientId, nowInHours);
        const fecha_inicio = new Date().toISOString().slice(0, 19).replace("T", " ");

        if (!isLoaded) {
            const fechaunix = Math.floor(Date.now() / 1000);

            let shipmentId = 0;

            const insertEnvioQuery = `
                INSERT INTO envios(did, ml_shipment_id, ml_vendedor_id, didCliente, quien, lote, fecha_despacho, didCuenta, ml_qr_seguridad, fecha_inicio, fechaunix) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

            const insertResult = await executeQuery(dbConnection, insertEnvioQuery, [
                shipmentId, mlShipmentId, mlSellerId, clientId, userId, lote, fecha_despacho, accountId, ml_qr_seguridad, fecha_inicio, fechaunix
            ]);

            if (!insertResult.insertId) {
                throw new Error("Existió un error al querer guardar los datos.");
            }

            shipmentId = insertResult.insertId;
            pudeguardar = true;

            const updateEnvioQuery = `
                    UPDATE envios SET did = ?
            WHERE superado = 0 AND elim = 0 AND id = ? AND ml_vendedor_id = ? AND ml_shipment_id = ?
                LIMIT 1
            `;

            await executeQuery(dbConnection, updateEnvioQuery, [shipmentId, shipmentId, mlSellerId, mlShipmentId]);

            let shipmentState = 0;

            const perfilQuery = `
                    SELECT perfil FROM sistema_usuarios_accesos 
                    WHERE superado = 0 AND elim = 0 AND usuario = ?
            `;

            const perfilResult = await executeQuery(dbConnection, perfilQuery, [userId]);

            let queperfil = 0;
            if (perfilResult.length > 0) {
                if (perfilResult[0].perfil === 2) {
                    shipmentState = 7;
                }
                queperfil = perfilResult[0].perfil;
            }

            await setShipmentState(dbConnection, shipmentId, shipmentState, "");

            if (queperfil === 3) {
                await updateWhoPickedUp(dbConnection, userId, shipmentId);
            }

            if (autoasigna && perfil === 3) {
                await asignarOperador(dbConnection, userId, [shipmentId]);
            }

            return;

        } else {
            if (shipmentData.estado === 7) {
                const shipmentId = shipmentData.did;

                await updateWhoPickedUp(dbConnection, userId, shipmentId);
                await setShipmentState(dbConnection, shipmentId, 0, "");

                return;
            } else {
                throw new Error("El envío ya está cargado");
            }
        }
    } catch (error) {
        logRed(`Error en enterFlex: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

async function setShipmentState(dbConnection, shipmentId, shipmentState, userId) {
    try {

        const estadoActualQuery = `
            SELECT estado FROM envios_historial 
            WHERE didEnvio = ? AND superado = 0 AND elim = 0 
            LIMIT 1
            `;

        const estadoActualResult = await executeQuery(dbConnection, estadoActualQuery, [shipmentId]);

        const currentShipmentState = estadoActualResult.length ? estadoActualResult[0].estado : -1;

        if (currentShipmentState !== shipmentState) {
            const updateHistorialQuery = `
                UPDATE envios_historial 
                SET superado = 1 
                WHERE superado = 0 AND elim = 0 AND didEnvio = ?
            `;

            await executeQuery(dbConnection, updateHistorialQuery, [shipmentId]);

            const updateEnviosQuery = `
                UPDATE envios 
                SET estado_envio = ?
            WHERE superado = 0 AND did = ?
                `;

            await executeQuery(dbConnection, updateEnviosQuery, [shipmentState, shipmentId]);

            const operadorQuery = `
                SELECT operador FROM envios_asignaciones 
                WHERE didEnvio = ? AND superado = 0 AND elim = 0
            `;

            const operadorResult = await executeQuery(dbConnection, operadorQuery, [shipmentId]);

            const driverId = operadorResult.length ? operadorResult[0].operador : 0;

            const date = new Date().toISOString().slice(0, 19);

            const insertHistorialQuery = `
                INSERT INTO envios_historial(didEnvio, estado, quien, fecha, didCadete) 
                VALUES(?, ?, ?, ?, ?)
                `;

            await executeQuery(dbConnection, insertHistorialQuery, [shipmentId, shipmentState, userId, date, driverId]);
        }

        return;
    } catch (error) {
        logRed(`Error en setShipmentState: ${error.stack}`);
        throw error;
    }
}

async function setDispatchDate(dbConnection, clientId) {
    let closeHour = 16;

    try {
        const configRows = await executeQuery(
            dbConnection,
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

        const clienteRows = await executeQuery(
            dbConnection,
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
        throw error;
    }
}

async function updateWhoPickedUp(dbConnection, userId, driverId) {
    try {
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");

        const query = `
            UPDATE envios 
            SET quien_retiro = ?, quien_retiro_fecha = ?
            WHERE superado = 0 AND elim = 0 AND did = ?
                `;

        await executeQuery(dbConnection, query, [userId, now, driverId]);

    } catch (error) {
        logRed(`Error en updateWhoPickedUp: ${error.stack}`);
        throw error;
    }
}

export async function getProductsFromShipment(dataQr) {
    try {
        const shipmentId = dataQr.id;

        const senderid = dataQr.sender_id;

        const token = await getToken(senderid);

        const Ashipment = await getShipmentDetails(shipmentId, token);

        if (Ashipment.receiver_id) {
            const Aventa = await getSaleDetails(Ashipment.order_id, token);
            const Aorder_items = Aventa.order_items || [];

            const Aitems = [];
            for (const Aitem of Aorder_items) {
                const itemdata = Aitem.item;
                const cantidadpedida = Aitem.quantity;
                const descripcion = itemdata.title;
                const sku = itemdata.seller_sku;
                const iditem = itemdata.id;
                const variation_id = itemdata.variation_id;

                let stock = 0;
                let imagen = '';

                if (variation_id) {
                    const dataitem = await getItemData(iditem, token);
                    const Avariations = dataitem.variations;
                    for (const variant of Avariations) {
                        if (variant.id === variation_id) {
                            stock = variant.available_quantity;
                            imagen = variant.pictures[0]?.secure_url || '';
                        }
                    }
                } else {
                    const dataitem = await getItemData(iditem, token);
                    imagen = dataitem.pictures[0]?.secure_url || '';
                    stock = dataitem.available_quantity;
                }

                Aitems.push({ imagen, stock, cantidadpedida, descripcion, variacion: "", sku });
            }

            return Aitems;
        } else {
            throw new Error("No se encontró el receptor del envío");
        }
    } catch (error) {
        throw error;
    }

}

async function getToken(sellerid) {
    const dia = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://lightdatas2.com.ar/getTokens.php?keysi=${dia}&sellerid=${sellerid}`;
    const response = await axios.get(url);
    return response.data[sellerid];
}

async function getShipmentDetails(shipmentId, token) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}?access_token=${token}`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        logRed(`Error obteniendo detalles del envío: ${error.stack}`);
        throw error;
    }
}

async function getSaleDetails(idventa, token) {
    const url = `https://api.mercadolibre.com/orders/${idventa}?access_token=${token}`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
}

async function getItemData(iditem, token) {
    const url = `https://api.mercadolibre.com/items/${iditem}?access_token=${token}`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
}