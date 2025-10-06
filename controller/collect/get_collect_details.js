import { executeQuery } from 'lightdata-tools';

export async function getCollectDetails(dbConnection, req) {
    const { userId } = req.user;
    const { date } = req.params;
    let clients = null;

    const routeQuery = "SELECT did, dataRuta, camino FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND fecha = ? AND didChofer = ?";
    const routeResult = await executeQuery(dbConnection, routeQuery, [date, userId], true);
    // start de dataruta
    // 0 ubicacion del chofer
    // 1 casa del chofer
    // 2 deposito
    if (routeResult.length > 0) {

        const stopsQuery = `
                   SELECT CRP.orden, CRP.didCliente, CRP.didDeposito, cl.nombre_fantasia
                   FROM colecta_ruta_paradas AS CRP
                   LEFT JOIN clientes AS cl ON cl.superado = 0 AND cl.elim = 0 AND cl.did = CRP.didCliente
                   WHERE CRP.superado = 0 AND CRP.elim = 0 AND CRP.didRuta = ? ORDER BY CRP.orden ASC;
               `;
        const stopsResult = await executeQuery(dbConnection, stopsQuery, [routeResult[0].did], true);
        clients = stopsResult.map(row => ({
            orden: row.orden ? Number(row.orden) : null,
            did: row.didCliente ? Number(row.didCliente) : null,
            nombre_fantasia: row.nombre_fantasia
        }));
    } else {

        const enviosResult = await executeQuery(
            dbConnection,
            `SELECT dataJson
            FROM colecta_asignaciones
            WHERE superado = 0 AND elim = 0 AND didChofer = ? AND fecha = ?
            `,
            [userId, date], true
        );
        if (enviosResult.length == 0) {
            return { body: [], message: "Colecta obtenida correctamente" };
        }
        const res = Object.keys(enviosResult[0].dataJson).map(k => k);

        const q = `
               SELECT  c.did, c.nombre_fantasia
               FROM clientes AS c
               WHERE c.did IN (?)
               AND c.superado = 0
               AND c.elim = 0;
           `;
        const stopsResult = await executeQuery(dbConnection, q, [res], true);

        clients = stopsResult.map(row => ({
            orden: null,
            did: row.did ? Number(row.did) : null,
            nombre_fantasia: row.nombre_fantasia
        }));
    }

    return {
        success: true,
        body: clients,
        message: "Ruta obtenida correctamente"
    };
}