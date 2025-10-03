
import { executeQuery, getFechaLocalDePais } from 'lightdata-tools';

export async function saveRoute(dbConnection, req, company) {
    const { userId } = req.user;
    const { additionalRouteData, clients, cantidad, distancia, total_km, total_minutos, camino } = req.body;

    const date = getFechaLocalDePais(company.pais);

    let didAsuperar = 0;

    const rows = await executeQuery(
        dbConnection,
        "SELECT did FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND didChofer = ?",
        [userId]
    );

    if (rows.length == 0) {
        const queryInsert = `INSERT INTO colecta_ruta (desde, fechaOperativa, didChofer, fecha, cantidad, distancia, total_km, total_minutos, dataRuta, quien, camino) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const result = await executeQuery(
            dbConnection,
            queryInsert,
            [2, date, userId, date, cantidad, distancia, total_km, total_minutos, JSON.stringify(additionalRouteData), userId, JSON.stringify({ camino: camino })]
        );
        didAsuperar = result.insertId;

        const updateQuery = `UPDATE colecta_ruta SET did = ? WHERE id = ?`;
        await executeQuery(dbConnection, updateQuery, [didAsuperar, didAsuperar]);
    } else {
        didAsuperar = rows[0].did;

        await executeQuery(
            dbConnection,
            "UPDATE colecta_ruta SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1",
            [didAsuperar]
        );

        await executeQuery(
            dbConnection,
            "UPDATE colecta_ruta_paradas SET superado = 1 WHERE superado = 0 AND elim = 0 AND didRuta = ?",
            [didAsuperar]
        );
        //* EL 2 SIGNIFICA APP
        const idn = await executeQuery(
            dbConnection,
            "INSERT INTO colecta_ruta (desde, fechaOperativa, didChofer, fecha, cantidad, distancia, total_km, total_minutos, dataRuta, quien, camino) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [2, date, userId, date, cantidad, distancia, total_km, total_minutos, JSON.stringify(additionalRouteData), userId, JSON.stringify({ camino: camino })]
        );

        const updateQuery = `UPDATE colecta_ruta SET did = ? WHERE id = ?`;
        await executeQuery(dbConnection, updateQuery, [didAsuperar, idn.insertId]);
    }

    // 1) Armo las tuplas base (sin didDeposito)
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

    await executeQuery(dbConnection, sql, params);



    return { message: "Ruta guardada correctamente" };
}