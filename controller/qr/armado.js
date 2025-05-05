import CustomException from "../../classes/custom_exception.js";

export async function armado(company, modal, userId, dataEnvios, didClienteBody, insumos, fecha) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        // 1) Obtener maxDid y maxDidLinea
        const [row1] = await executeQuery('SELECT MAX(did) AS maxDid FROM fulfillment_movimientos_stock');
        let maxDid = (row1.maxDid || 0) + 1;

        const [row2] = await executeQuery('SELECT MAX(did) AS maxDidLinea FROM fulfillment_movimientos_stock_lineas');
        let maxDidLinea = (row2.maxDidLinea || 0) + 1;

        const lineas = Array.isArray(dataEnvios) ? dataEnvios.length : 0;
        let cantidad = 0;

        // 2) Recorremos los envíos
        for (const item of dataEnvios) {
            const envioId = item.did;
            cantidad += Number(item.cantidad);

            // a) Actualizar ordenes
            await executeQuery(
                `UPDATE ordenes
         SET fecha_armado = NOW(), armado = 1, quien_armado = ?
         WHERE id = ? AND superado = 0 AND elim = 0`,
                [userId, envioId]
            );

            // b) Insertar línea de movimiento stock (descuento sobre producto)
            const descuentoStr = `-${item.cantidad}`;
            await executeQuery(
                `INSERT INTO fulfillment_movimientos_stock_lineas
         (did, didMovimiento, didProducto, tipo, cantidad, quien)
         VALUES (?, ?, ?, 0, ?, ?)`,
                [maxDidLinea, maxDid, item.didProducto, descuentoStr, userId]
            );
            maxDidLinea++;

            // c) Obtener didEnvio de la orden
            const [envRow] = await executeQuery(
                `SELECT didEnvio
         FROM ordenes
         WHERE superado = 0 AND elim = 0 AND id = ?`,
                [envioId]
            );
            const didEnvio = envRow ? envRow.didEnvio : 0;

            // d) Si existe, reactivar envío
            if (didEnvio && didEnvio !== 0) {
                await executeQuery(
                    `UPDATE envios
           SET elim = 0
           WHERE did = ? AND superado = 0 AND elim = 52`,
                    [didEnvio]
                );
            }

            // e) Si modal == 1, inserto el encabezado de movimiento (por cada iteración,
            //    como en tu PHP original)
            if (modal == 1) {
                // si en el body vienen clientes distintos por envío, uso item.cliente
                const didCliente = item.cliente ?? didClienteBody;
                await executeQuery(
                    `INSERT INTO fulfillment_movimientos_stock
           (did, didCliente, fecha, didConcepto, didArmado, observaciones, lineas, total, quien)
           VALUES (?, ?, ?, -1, ?, '', ?, ?, ?)`,
                    [maxDid, didCliente, fecha, envioId, lineas, cantidad, userId]
                );
            }
        }

        // 3) Recorro insumos (son productos “extras” con tipo = 1)
        for (const [didProd, descVal] of Object.entries(insumos)) {
            const descuentoStr = `-${descVal}`;
            await executeQuery(
                `INSERT INTO fulfillment_movimientos_stock_lineas
         (did, didMovimiento, didProducto, tipo, cantidad, quien)
         VALUES (?, ?, ?, 1, ?, ?)`,
                [maxDidLinea, maxDid, didProd, descuentoStr, userId]
            );
            maxDidLinea++;
        }

        // 4) Si modal == 0, inserto un único encabezado de movimiento al final
        if (modal == 0) {
            await executeQuery(
                `INSERT INTO fulfillment_movimientos_stock
         (did, didCliente, fecha, didConcepto, didArmado, observaciones, lineas, total, quien)
         VALUES (?, ?, ?, -1, ?, '', ?, ?, ?)`,
                [maxDid, didClienteBody, fecha, dataEnvios[dataEnvios.length - 1]?.did, lineas, cantidad, userId]
            );
        }

        return true;
    } catch (error) {
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error haciendo armado',
            message: error.message,
            stack: error.stack
        });
    }
}