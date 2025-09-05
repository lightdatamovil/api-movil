import axios from 'axios';
import { executeQuery, getFechaConHoraLocalDePais, logGreen, logRed } from 'lightdata-tools';

export async function startRoute(dbConnection, req) {
    const { company, userId, deviceFrom } = req.body;

    const dateConHora = getFechaConHoraLocalDePais(company.pais);
    const hour = dateConHora.split(' ')[1];
    const sqlInsertMovimiento = "INSERT INTO cadetes_movimientos (didCadete, tipo,desde) VALUES (?, ?,?)";
    await executeQuery(dbConnection, sqlInsertMovimiento, [userId, 0, 3]);

    const sqlUpdateRuteo = "UPDATE ruteo SET hs_inicioApp = ? WHERE superado=0 AND elim=0 AND didChofer = ?";
    await executeQuery(dbConnection, sqlUpdateRuteo, [hour, userId]);

    const dias = 3;

    const queryEnviosAsignadosHoy = `
            SELECT didEnvio, estado
            FROM envios_asignaciones
            WHERE superado=0
            AND elim=0
            AND operador=?
            AND estado NOT IN (5, 8, 9)
            AND didEnvio IS NOT NULL
            AND DATE(autofecha) BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND CURDATE()
        `;
    let shipmentIds = [];

    const envios = await executeQuery(dbConnection, queryEnviosAsignadosHoy, [userId, dias]);

    if (envios.length > 0) {
        shipmentIds = envios.map(envio => envio.didEnvio); const q = `SELECT did, estado_envio FROM envios WHERE superado=0 and elim=0 and estado_envio not in (?) and did in (?)`;
        const enviosPendientes = await executeQuery(dbConnection, q, [[5, 7, 8, 9, 14], shipmentIds]);

        let enCaminoIds = enviosPendientes
            .filter(e => e.estado_envio == 2)
            .map(e => e.did);

        let pendientesIds = enviosPendientes
            .filter(e => e.estado_envio != 2)
            .map(e => e.did);


        // distinciones why --  porque se hace esta distincion
        if ((company.did == 22 || company.did == 20) && enCaminoIds.length > 0) {
            await fsetestadoMasivoMicroservicio(company.did, enCaminoIds, deviceFrom, dateConHora, userId, 11);
        }
        if (pendientesIds.length > 0) {
            await fsetestadoMasivoMicroservicio(company.did, pendientesIds, deviceFrom, dateConHora, userId, 2);
        }
    }
    return { message: 'Ruta comenzada exitosamente' };
}

async function fsetestadoMasivoMicroservicio(companyId, shipmentIds, deviceFrom, dateConHora, userId, onTheWayState) {
    try {
        const message = {
            didempresa: companyId,
            estado: onTheWayState,
            subestado: null,
            estadoML: null,
            fecha: dateConHora,
            quien: userId,
            latitud: null,
            longitud: null,
            operacion: "masivo",
            didenvios: shipmentIds
        };
        const url = "https://serverestado.lightdata.app/estados/lote";
        const response = await axios.post(url, message);
        logGreen(`✅ Enviado por HTTP con status ${response.status}`);
    } catch (error) {
        logRed(`❌ Falló el envío por HTTP: ${error.message}`);
        throw error;
    }
}