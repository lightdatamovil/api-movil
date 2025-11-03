
import { executeQuery, getFechaLocalDePais, LightdataORM } from 'lightdata-tools';

export async function saveRoute({ db, req, company }) {
    const { userId } = req.user;
    const { additionalRouteData, clients, cantidad, distancia, total_km, total_minutos, camino } = req.body;

    const date = getFechaLocalDePais(company.pais);

    const [didAsuperar] = LightdataORM.insert({
        db,
        table: "colecta_ruta",
        data: {
            desde: 2,
            fechaOperativa: date,
            didChofer: userId,
            fecha: date,
            cantidad,
            distancia,
            total_km,
            total_minutos,
            dataRuta: JSON.stringify(additionalRouteData),
            quien: userId,
            camino: JSON.stringify({ camino })
        }
    });

    const rows2 = clients.map(({ orden, cliente, ordenLlegada }) => [
        didAsuperar,      // didRuta
        cliente,          // didCliente
        orden,            // orden
        ordenLlegada,     // demora
        date,             // fecha_colectado (yyyy-mm-dd)
        userId,           // quien
    ]);

    // 2) Armo el derived table como SELECT ... UNION ALL ...
    const rowSelects = rows2
        .map(() => "SELECT ? AS didRuta, ? AS didCliente, ? AS orden, ? AS demora, ? AS fecha_colectado, ? AS quien")
        .join(" UNION ALL ");

    const params = rows2.flat();

    // 3) INSERT ... SELECT joineando con clientes_direcciones para resolver didDeposito
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
            MIN(cd.did) AS didDeposito   -- elegimos una dirección válida por cliente
        FROM clientes_direcciones cd
        WHERE cd.superado = 0 AND cd.elim = 0
        GROUP BY cd.cliente
        ) a ON a.didCliente = r.didCliente
        -- Si querés forzar que exista depósito:
        -- WHERE a.didDeposito IS NOT NULL
        `;

    await executeQuery({ db, query: sql, values: params });



    return { message: "Ruta guardada correctamente" };
}