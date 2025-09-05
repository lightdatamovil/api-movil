import { CustomException, executeQuery, getFechaConHoraLocalDePais, sendShipmentStateToStateMicroservice } from "lightdata-tools";
import { queueEstados, rabbitUrl } from "../../db";

export async function enterFlex(dbConnection, req, company) {
    const { dataQr } = req.body;
    const { userId, profile } = req.user;

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
        throw new CustomException({
            title: 'Error ingresando al Flex',
            message: 'No se encontró el cliente asociado al vendedor',
        });
    }

    const envioQuery = `
            SELECT did, estado FROM envios 
            WHERE superado = 0 AND elim = 0 AND ml_shipment_id = ? AND ml_vendedor_id = ?
            `;

    const envioResult = await executeQuery(dbConnection, envioQuery, [mlShipmentId, mlSellerId]);

    let isLoaded = envioResult.length > 0;

    const nowInHours = new Date().getHours();
    const fecha_despacho = await setDispatchDate(dbConnection, clientId, nowInHours);

    const fecha_inicio = getFechaConHoraLocalDePais(company.pais);

    if (!isLoaded) {
        const fechaunix = Math.floor(Date.now() / 1000);

        let shipmentId = 0;

        const insertEnvioQuery = `
                INSERT INTO envios(did, ml_shipment_id, ml_vendedor_id, didCliente, quien, lote, fecha_despacho, didCuenta, ml_qr_seguridad,
                 fecha_inicio, fechaunix) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

        const insertResult = await executeQuery(dbConnection, insertEnvioQuery, [
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
        await executeQuery(dbConnection, updateEnvioQuery, [shipmentId, shipmentId, mlSellerId, mlShipmentId]);

        let shipmentState = 0;

        if (profile === 2) {
            shipmentState = 7;
        }

        await sendShipmentStateToStateMicroservice(queueEstados, rabbitUrl, 'apimovil', company, userId, shipmentState, shipmentId);

        if (profile === 3) {
            await updateWhoPickedUp(dbConnection, userId, shipmentId);
        }

        return { message: "Datos obtenidos correctamente" };

    } else {
        throw new CustomException({
            title: 'Error ingresando al Flex',
            message: 'El envío ya está cargado'
        });
    }
}

async function setDispatchDate(dbConnection, clientId) {
    let closeHour = 16;

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
}

async function updateWhoPickedUp(dbConnection, userId, driverId) {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const query = `
            UPDATE envios 
            SET quien_retiro = ?, quien_retiro_fecha = ?
            WHERE superado = 0 AND elim = 0 AND did = ?
                `;

    await executeQuery(dbConnection, query, [userId, now, driverId]);

}