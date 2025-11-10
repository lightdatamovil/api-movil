
import { executeQuery, getFechaLocalDePais, LightdataORM } from 'lightdata-tools';

export async function saveRoute({ db, req, company }) {
    const { userId } = req.user;
    const { additionalRouteData, clients, cantidad, distancia, total_km, total_minutos, camino } = req.body;

    const date = getFechaLocalDePais(company.pais);

    const [didRuta] = await LightdataORM.insert({
        db,
        table: "colecta_ruta",
        data: {
            desde: 2,
            fechaOperativa: date,
            didChofer: userId,
            fecha: date,
            cantidad,
            distancia,
            terminada: 0,
            total_km,
            total_minutos,
            dataRuta: JSON.stringify(additionalRouteData),
            quien: userId,
            camino: JSON.stringify(camino)
        },
        quien: userId,
    });

    const rows2 = clients.map(({ orden, cliente, ordenLlegada }) => [
        didRuta,
        cliente,
        orden,
        ordenLlegada,
        date,
        userId,
    ]);

    // 2) Armo el derived table como SELECT ... UNION ALL ...
    const rowSelects = rows2
        .map(() => "SELECT ? AS didRuta, ? AS didCliente, ? AS orden, ? AS demora, ? AS fecha_colectado, ? AS quien")
        .join(" UNION ALL ");

    const params = rows2.flat();

    const sql = `
        INSERT INTO colecta_ruta_paradas
        (didRuta, didCliente, didDeposito, orden, demora, fecha_colectado, quien)
        SELECT
        r.didRuta,
        r.didCliente,
        a.didDeposito,
        r.orden,
        r.demora,
        r.fecha_colectado,
        r.quien
        FROM (
        ${rowSelects}
        ) AS r
        LEFT JOIN (
        SELECT
            cd.cliente AS didCliente,
            MIN(cd.did) AS didDeposito
        FROM clientes_direcciones cd
        WHERE cd.superado = 0 AND cd.elim = 0
        GROUP BY cd.cliente
        ) a ON a.didCliente = r.didCliente
        `;

    await executeQuery({ db, query: sql, values: params });

    return { message: "Ruta guardada correctamente" };
}