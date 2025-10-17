import { LightdataORM, executeQuery, getFechaLocalDePais } from "lightdata-tools";

export async function getRoute(dbConnection, req, company) {
    const { userId } = req.user;
    const date = getFechaLocalDePais(company.pais);

    let clients = [];
    let additionalRouteData = null;

    const routeResult = await LightdataORM.select({
        dbConnection,
        table: "colecta_ruta",
        where: { fecha: date, didChofer: userId },
        select: "did, dataRuta, camino"
    });

    if (routeResult.length > 0) {
        const stopsQuery = `
            SELECT CRP.orden, CRP.didCliente, CRP.didDeposito, cld.ilong, cld.ilat, cld.calle, cld.numero, cld.ciudad, cl.nombre_fantasia
            FROM colecta_ruta_paradas AS CRP
            LEFT JOIN clientes AS cl ON cl.superado = 0 AND cl.elim = 0 AND cl.did = CRP.didCliente
            LEFT JOIN clientes_direcciones AS cld ON cld.superado = 0 AND cld.elim = 0 AND cld.did = CRP.didDeposito
            WHERE CRP.superado = 0 AND CRP.elim = 0 AND CRP.didRuta = ?
            ORDER BY CRP.orden ASC;
        `;
        const stopsResult = await executeQuery(dbConnection, stopsQuery, [routeResult[0].did]);

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
        const enviosResult = await LightdataORM.select({
            dbConnection,
            table: "colecta_asignaciones",
            where: { didChofer: userId, fecha: date },
            select: "dataJson"
        });

        if (enviosResult.length === 0) {
            return {
                success: true,
                data: [],
                message: "Colecta obtenida correctamente",
                meta: { total: 0 }
            };
        }

        const dataJson = enviosResult[0].dataJson ? JSON.parse(enviosResult[0].dataJson) : {};
        const clientIds = Object.keys(dataJson).map(k => Number(k));

        const q = `
            SELECT c.did, c.nombre_fantasia,
                   cd.ilong, cd.ilat, cd.calle, cd.numero, cd.ciudad
            FROM clientes AS c
            LEFT JOIN clientes_direcciones AS cd
                ON cd.cliente = c.did
                AND cd.elim = 0
                AND cd.superado = 0
            WHERE c.did IN (?)
              AND c.superado = 0
              AND c.elim = 0;
        `;
        const stopsResult = await executeQuery(dbConnection, q, [clientIds]);

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
        data: {
            hasRoute: routeResult.length > 0,
            routeId: routeResult.length > 0 ? routeResult[0].did : null,
            additionalRouteData: routeResult.length > 0 ? additionalRouteData : null,
            clients,
            camino: routeResult.length > 0 ? JSON.parse(routeResult[0].camino).camino : null
        },
        message: "Ruta obtenida correctamente",
        meta: { totalClients: clients.length }
    };
}
