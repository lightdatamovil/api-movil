import { executeQuery } from 'lightdata-tools';

export async function getCollectDetails(dbConnection, req) {
    const { userId } = req.user;
    const { date } = req.params;
    console.log('Request params:', req.params);
    const q2 = `
    SELECT did 
    FROM colecta_ruta
    WHERE elim = 0 AND superado = 0 AND didChofer = ? AND fecha = ?
    `;
    const routeResult = await executeQuery(dbConnection, q2, [userId, date], true);
    const enviosResult = await executeQuery(
        dbConnection,
        `SELECT dataJson
         FROM colecta_asignaciones
         WHERE superado = 0 AND elim = 0 AND didChofer = ? AND fecha = ?
         `,
        [userId, date], true
    );

    const res = Object.keys(enviosResult[0].dataJson).map(k => k);

    const q = `
    SELECT c.did, c.nombre_fantasia, crp.orden
    FROM clientes as c
    LEFT JOIN colecta_ruta_paradas as crp ON (c.did = crp.didCliente AND crp.elim = 0 and crp.superado = 0)
    WHERE c.did IN (?) and c.superado = 0 AND c.elim = 0 and crp.didRuta = ?
    `;
    const clientes = await executeQuery(dbConnection, q, [res, routeResult[0].did], true);

    return { body: clientes, message: "Colecta obtenida correctamente" };
}