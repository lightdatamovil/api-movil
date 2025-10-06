import { executeQuery, getFechaLocalDePais, logCyan } from 'lightdata-tools';


// este no preguntar a GONZALO

export async function getRoute(dbConnection, req, company) {
    const { userId } = req.user;

    let clients, additionalRouteData = null;

    const date = getFechaLocalDePais(company.pais);

    const routeQuery = "SELECT did, dataRuta, camino FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND fecha = ? AND didChofer = ?";
    const routeResult = await executeQuery(dbConnection, routeQuery, [date, userId], true);
    // start de dataruta
    // 0 ubicacion del chofer
    // 1 casa del chofer
    // 2 deposito
    if (routeResult.length > 0) {

        const stopsQuery = `
                SELECT CRP.orden, CRP.didCliente, CRP.didDeposito, cld.ilong, cld.ilat, cld.calle, cld.numero, cld.ciudad, cl.nombre_fantasia
                FROM colecta_ruta_paradas AS CRP
                LEFT JOIN clientes AS cl ON cl.superado = 0 AND cl.elim = 0 AND cl.did = CRP.didCliente
                LEFT JOIN clientes_direcciones AS cld ON cld.superado = 0 AND cld.elim = 0 AND cld.did = CRP.didDeposito
                WHERE CRP.superado = 0 AND CRP.elim = 0 AND CRP.didRuta = ? ORDER BY CRP.orden ASC;
            `;
        const stopsResult = await executeQuery(dbConnection, stopsQuery, [routeResult[0].did], true);
        additionalRouteData = JSON.parse(routeResult[0].dataRuta);
        additionalRouteData.evitoAU = Boolean(additionalRouteData.evitoAU);
        additionalRouteData.start = Number(additionalRouteData.start);
        clients = stopsResult.map(row => ({
            orden: row.orden ? Number(row.orden) : null,
            didCliente: row.didCliente ? Number(row.didCliente) : null,
            didDeposito: row.didDeposito ? Number(row.didDeposito) : null,
            calle: row.calle,
            numero: row.numero,
            ciudad: row.ciudad,
            latitud: row.ilat ? Number(row.ilat) : null,
            longitud: row.ilong ? Number(row.ilong) : null,
            nombreCliente: row.nombre_fantasia
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
            logCyan('No route or no envios found');
            return { body: [], message: "Colecta obtenida correctamente" };
        }
        const res = Object.keys(enviosResult[0].dataJson).map(k => k);

        const q = `
            SELECT  c.did, c.nombre_fantasia,
                cd.ilong, cd.ilat, cd.calle, cd.numero, cd.ciudad
            FROM clientes AS c
            LEFT JOIN clientes_direcciones AS cd
                ON cd.cliente = c.did
                AND cd.elim = 0
                AND cd.superado = 0
            WHERE c.did IN (14,17,23,31,90,96)
            AND c.superado = 0
            AND c.elim = 0;
        `;
        const stopsResult = await executeQuery(dbConnection, q, [res], true);

        clients = stopsResult.map(row => ({
            orden: null,
            didCliente: row.did ? Number(row.did) : null,
            calle: row.calle,
            numero: row.numero,
            ciudad: row.ciudad,
            latitud: row.ilat ? Number(row.ilat) : null,
            longitud: row.ilong ? Number(row.ilong) : null,
            nombreCliente: row.nombre_fantasia
        }));
    }

    return {
        success: true,
        body: {
            hasRoute: routeResult.length > 0,
            routeId: routeResult.length > 0 ? routeResult[0].did : null,
            additionalRouteData: routeResult.length > 0 ? additionalRouteData : null,
            clients,
            camino: routeResult.length > 0 ? JSON.parse(routeResult[0].camino).camino : null,
        },
        message: "Ruta obtenida correctamente"
    };
}