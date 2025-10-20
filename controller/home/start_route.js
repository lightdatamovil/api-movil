import { executeQuery, getFechaConHoraLocalDePais, LightdataORM, sendShipmentStateToStateMicroserviceLoteAPI } from 'lightdata-tools';
import { urlEstadosMicroserviceLote, axiosInstance } from '../../db.js';

export async function startRoute(dbConnection, req, company) {
    const { userId } = req.user;

    const dateConHora = getFechaConHoraLocalDePais(company.pais);
    const hour = dateConHora.split(' ')[1];
    await LightdataORM.insert({
        dbConnection,
        table: "cadetes_movimientos",
        data: {
            didCadete: userId,
            tipo: 0,
            desde: 3
        }
    });

    await LightdataORM.update({
        table: "ruteo",
        dbConnection,
        data: { hs_inicioApp: hour },
        where: { didChofer: userId }
    });

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
        shipmentIds = envios.map(envio => envio.didEnvio);
        const q = `SELECT did, estado_envio 
        FROM envios 
        WHERE superado=0 and elim=0 and estado_envio not in (?) and did in (?)`;
        const enviosPendientes = await executeQuery(dbConnection, q, [[5, 7, 8, 9, 14], shipmentIds]);

        let enCaminoIds = enviosPendientes
            .filter(e => e.estado_envio == 2)
            .map(e => e.did);

        let pendientesIds = enviosPendientes
            .filter(e => e.estado_envio != 2)
            .map(e => e.did);


        // distinciones why --  porque se hace esta distincion
        if ((company.did == 22 || company.did == 20) && enCaminoIds.length > 0) {
            await sendShipmentStateToStateMicroserviceLoteAPI({
                urlEstadosMicroservice: urlEstadosMicroserviceLote,
                axiosInstance,
                company,
                userId,
                shipmentsDids: enCaminoIds,
                estado: 11,
                desde: "Iniciar Ruta Api Movil"
            });
        }
        if (pendientesIds.length > 0) {
            await sendShipmentStateToStateMicroserviceLoteAPI({
                urlEstadosMicroservice: urlEstadosMicroserviceLote,
                axiosInstance,
                company,
                userId,
                shipmentsDids: pendientesIds,
                estado: 2,
                desde: "Iniciar Ruta Api Movil"
            });
        }
    }
    return { message: 'Ruta comenzada exitosamente' };
}