import { LightdataORM, executeQuery, getFechaLocalDePais } from "lightdata-tools";

export async function getRoute({ db, req, company }) {
    const { userId } = req.user;
    const date = getFechaLocalDePais(company.pais);

    let clients = [];
    let additionalRouteData = null;

    const routeResult = await LightdataORM.select({
        db,
        table: "colecta_ruta",
        where: { fecha: date, didChofer: userId },
        select: "did, dataRuta, camino",
    });

    if (routeResult.length > 0) {
        const stopsQuery = `
       SELECT cr.didRuta ,cr.didCliente, cr.orden ,cd.ilong,cd.ilat,c.nombre_fantasia , cd.calle,  cd.numero,cd.localidad , CONCAT(cd.calle, ' ', cd.numero, ', ', cd.ciudad) AS direccion_completa
FROM colecta_ruta_paradas as cr 
LEFT JOIN clientes_direcciones as cd on (cd.superado=0 and cd.elim=0 and cr.didCliente=cd.cliente and cr.didDeposito=cd.did ) 
LEFT JOIN clientes as c on (c.elim=0 and c.superado=0 and c.did=cr.didCliente) 
where cr.superado=0 and cr.elim=0 and cr.didRuta in (?);
        `;
        const stopsResult = await executeQuery({
            db,
            query: stopsQuery,
            values: [routeResult[0].did],
        });

        additionalRouteData = JSON.parse(routeResult[0].dataRuta);
        additionalRouteData.evitoAU = Boolean(additionalRouteData.evitoAU);
        additionalRouteData.start = Number(additionalRouteData.start);

        clients = stopsResult.map(row => ({
            orden: row.orden ? Number(row.orden) : null,
            didRuta: row.didRuta ? Number(row.didRuta) : null,
            didCliente: row.didCliente ? Number(row.didCliente) : null,
            didDeposito: row.didDeposito ? Number(row.didDeposito) : null,
            calle: row.calle,
            numero: row.numero,
            ciudad: row.ciudad,
            direccion: row.direccion_completa,
            latitud: row.ilat ? Number(row.ilat) : null,
            longitud: row.ilong ? Number(row.ilong) : null,
            nombreCliente: row.nombre_fantasia,
        }));

    } else {
        const enviosResult = await LightdataORM.select({
            db,
            table: "colecta_asignaciones",
            where: { didChofer: userId, fecha: date },
            select: "dataJson",
        });

        if (enviosResult.length === 0) {
            return {
                success: true,
                data: {
                    hasRoute: false,
                    routeId: null,
                    additionalRouteData: null,
                    clients: [],
                    camino: null
                },
                message: "Colecta obtenida correctamente",
                meta: { total: 0 }
            };
        }
        const arr = Array.isArray(enviosResult[0]?.dataJson) ? enviosResult[0].dataJson : [];

        const clientIds = arr
            .map(it => Number(it.cliente))
            .filter(Number.isFinite);

        if (clientIds.length === 0) {
            return { success: true, message: "Sin clientes válidos", data: [] };
        }

        const q = `
            SELECT c.did, c.nombre_fantasia,
            cd.ilong, cd.ilat, cd.calle, cd.numero, cd.ciudad, cd.did as didDeposito
            FROM clientes AS c
            LEFT JOIN clientes_direcciones AS cd
                ON cd.cliente = c.did
                AND cd.elim = 0
                AND cd.superado = 0
            WHERE c.did IN(?)
              AND c.superado = 0
              AND c.elim = 0;
        `;
        const stopsResult = await executeQuery({ db, query: q, values: [clientIds] });

        clients = stopsResult.map(row => ({
            orden: null,
            didCliente: row.did ? Number(row.did) : null,
            didDeposito: row.didDeposito ? Number(row.didDeposito) : null,
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
            camino: routeResult.length > 0 ? JSON.parse(routeResult[0].camino) : null
        },
        message: "Ruta obtenida correctamente",
        meta: { totalClients: clients.length }
    };
}
