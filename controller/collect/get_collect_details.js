import { LightdataORM, executeQuery } from "lightdata-tools";

export async function getCollectDetails(dbConnection, req) {
    const { userId } = req.user;
    const { date } = req.params;
    let clients = [];

    const routeResult = await LightdataORM.select({
        dbConnection,
        table: "colecta_ruta",
        where: { fecha: date, didChofer: userId },
        select: "did, dataRuta, camino"
    });

    if (routeResult.length > 0) {
        const stopsQuery = `
            SELECT CRP.orden, CRP.didCliente, CRP.didDeposito, cl.nombre_fantasia
            FROM colecta_ruta_paradas AS CRP
            LEFT JOIN clientes AS cl ON cl.superado = 0 AND cl.elim = 0 AND cl.did = CRP.didCliente
            WHERE CRP.superado = 0 AND CRP.elim = 0 AND CRP.didRuta = ? ORDER BY CRP.orden ASC;
        `;
        const stopsResult = await executeQuery({ dbConnection, query: stopsQuery, values: [routeResult[0].did] });
        clients = stopsResult.map(row => ({
            orden: row.orden ? Number(row.orden) : null,
            did: row.didCliente ? Number(row.didCliente) : null,
            nombre_fantasia: row.nombre_fantasia
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
        const clientIds = Object.keys(dataJson).map(id => Number(id));

        const stopsResult = await LightdataORM.select({
            dbConnection,
            table: "clientes",
            where: { did: clientIds },
            select: "did, nombre_fantasia"
        });

        clients = stopsResult.map(row => ({
            orden: null,
            did: row.did ? Number(row.did) : null,
            nombre_fantasia: row.nombre_fantasia
        }));
    }

    return {
        success: true,
        data: clients,
        message: "Ruta obtenida correctamente",
        meta: { total: clients.length }
    };
}
