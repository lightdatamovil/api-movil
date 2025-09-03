import { executeQuery, getFechaConHoraLocalDePais } from 'lightdata-tools';


// este no preguntar a GONZALO

export async function getRoute(dbConnection, req, company) {
    const { userId } = req.user;
    let hasRoute, routeId, additionalRouteData, client = null;
    const date = getFechaConHoraLocalDePais(company.pais);
    const routeQuery = "SELECT id, did, dataRuta FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND fecha = ? AND didChofer = ?";
    const routeResult = await executeQuery(dbConnection, routeQuery, [date, userId]);

    if (routeResult.length > 0) {
        const dataRoute = JSON.parse(routeResult[0].dataRuta);
        hasRoute = true;
        routeId = Number(routeResult[0].did);
        additionalRouteData = {
            evitoAU: dataRoute.evitoAU,
            desde: Number(dataRoute.desde),
            lat: dataRoute.inicioGeo.lat,
            long: dataRoute.inicioGeo.long
        };

        const stopsQuery = `
                SELECT CRP.orden, CRP.didCliente, cld.ilong, cld.ilat, cld.calle, cld.numero, cld.ciudad, cl.nombre_fantasia
                FROM colecta_ruta_paradas AS CRP
                LEFT JOIN clientes AS cl ON cl.superado = 0 AND cl.elim = 0 AND cl.did = CRP.didCliente
                LEFT JOIN clientes_direcciones AS cld ON cld.superado = 0 AND cld.elim = 0 AND cld.cliente = CRP.didCliente
                WHERE CRP.superado = 0 AND CRP.elim = 0 AND CRP.didRuta = ? ORDER BY CRP.orden ASC;
            `;
        const stopsResult = await executeQuery(dbConnection, stopsQuery, [dataRoute.didRuta]);

        client = stopsResult.map(row => ({
            orden: row.orden ? Number(row.orden) : null,
            didCliente: row.didCliente ? Number(row.didCliente) : null,
            calle: row.calle || "",
            numero: String(row.numero || ""),
            ciudad: row.ciudad || "",
            latitud: row.ilat ? Number(row.ilat) : null,
            longitud: row.ilong ? Number(row.ilong) : null,
            nombreCliente: row.nombre_fantasia || ""
        }));
    } else {

        const assignmentQuery = `
                SELECT ca.didCliente, cd.calle, cd.numero, cd.localidad, cd.ciudad, cd.provincia, cd.ilong, cd.ilat, c.nombre_fantasia
                FROM colecta_asignacion AS ca
                LEFT JOIN clientes_direcciones AS cd ON cd.superado = 0 AND cd.elim = 0 AND cd.cliente = ca.didCliente
                LEFT JOIN clientes AS c ON c.superado = 0 AND c.elim = 0 AND cd.cliente = c.did
                WHERE ca.fecha LIKE ? AND ca.superado = 0 AND ca.elim = 0 AND ca.didChofer = ? GROUP BY ca.didCliente;
            `;
        const assignmentResult = await executeQuery(dbConnection, assignmentQuery, [date, userId]);

        client = assignmentResult.map(row => ({
            orden: null,
            didCliente: row.didCliente ? Number(row.didCliente) : null,
            calle: row.calle || "",
            numero: String(row.numero || ""),
            ciudad: row.ciudad || "",
            localidad: row.localidad || "",
            provincia: row.provincia || "",
            latitud: row.ilat ? Number(row.ilat) : null,
            longitud: row.ilong ? Number(row.ilong) : null,
            nombreCliente: row.nombre_fantasia || ""
        }));
    }

    return {
        body: {
            hasRoute: hasRoute ?? false,
            routeId: routeId,
            additionalRouteData: additionalRouteData,
            client: client
        },
        message: "Ruta obtenida correctamente"
    };
}