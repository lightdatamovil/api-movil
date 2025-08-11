import CustomException from "../../classes/custom_exception.js";
import { executeQuery, getProdDbConfig } from "../../db.js";
import mysql2 from 'mysql2';
import { getFechaConHoraLocalDePais } from "../../src/funciones/getFechaConHoraLocalByPais.js";

export async function armado(req, company, userId, dbConnection) {
    const { dataEnvios, didCliente } = req.body;

    const [row1] = await executeQuery(dbConnection, 'SELECT MAX(did) AS maxDid FROM fulfillment_movimientos_stock', []);
    let maxDid = (row1.maxDid || 0) + 1;

    const [row2] = await executeQuery(dbConnection, 'SELECT MAX(did) AS maxDidLinea FROM fulfillment_movimientos_stock_lineas', []);
    let maxDidLinea = (row2.maxDidLinea || 0) + 1;

    const lineas = Array.isArray(dataEnvios) ? dataEnvios.length : 0;
    let cantidad = 0;

    for (const item of dataEnvios) {
        const envioId = item.did;
        cantidad += Number(item.cantidad);

        await executeQuery(
            dbConnection, `UPDATE ordenes
         SET fecha_armado = NOW(), armado = 1, quien_armado = ?
         WHERE id = ? AND superado = 0 AND elim = 0`,
            [userId, envioId]
        );

        const descuentoStr = `-${item.cantidad}`;
        await executeQuery(dbConnection,
            `INSERT INTO fulfillment_movimientos_stock_lineas
         (did, didMovimiento, didProducto, tipo, cantidad, quien)
         VALUES (?, ?, ?, 0, ?, ?)`,
            [maxDidLinea, maxDid, item.didProducto, descuentoStr, userId]
        );
        maxDidLinea++;

        const [envRow] = await executeQuery(
            dbConnection, `SELECT didEnvio
         FROM ordenes
         WHERE superado = 0 AND elim = 0 AND id = ?`,
            [envioId]
        );
        const didEnvio = envRow ? envRow.didEnvio : 0;

        if (didEnvio && didEnvio !== 0) {
            await executeQuery(
                dbConnection, `UPDATE envios
           SET elim = 0
           WHERE did = ? AND superado = 0 AND elim = 52`,
                [didEnvio]
            );
        }
    }
    const dateConHora = getFechaConHoraLocalDePais(company.pais);
    await executeQuery(
        dbConnection, `INSERT INTO fulfillment_movimientos_stock
         (did, didCliente, fecha, didConcepto, didArmado, observaciones, lineas, total, quien)
         VALUES (?, ?, ?, -1, ?, '', ?, ?, ?)`,
        [maxDid, didCliente, dateConHora, dataEnvios[dataEnvios.length - 1]?.did, lineas, cantidad, userId]
    );


    return true;

}