
export async function uploadImage(company, shipmentId, userId, didEstado, didLine, image) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect()

    try {
        const companyId = company.did;
        const reqBody = { image, shipmentId, userId, companyId, didEstado, didLine };
        const server = 1;
        const url = 'https://files.lightdata.app/upload.php';

        const response = await axios.post(url, reqBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data) {
            throw new Error("Error servidor files");
        }

        const insertQuery = "INSERT INTO envios_fotos (didEnvio, nombre, server, quien, id_estado, estado) VALUES (?, ?, ?, ?, ?, ?)";

        await executeQuery(dbConnection, insertQuery, [
            shipmentId,
            response.data,
            server,
            userId,
            lineId,
            shipmentState
        ]);

        return;
    } catch (error) {
        console.error("Error en uploadImage:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function registerVisit(company, shipmentId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect()

    try {
        const queryEnviosHistorial = "SELECT estado FROM envios_historial WHERE superado = 0 AND elim = 0 AND didEnvio = ?";

        const estadoActualRows = await executeQuery(dbConnection, queryEnviosHistorial, [shipmentId]);

        if (estadoActualRows.length > 0 && estadoActualRows[0].estado == 8) {
            throw new Error("El envío fue cancelado");
        }

        const shipmentState = estadoActualRows[0].estado;

        // Para winflex si esta entregado
        if (shipmentState == 5 && company.did == 72) {
            const queryEnvios = "SELECT didCliente, didCuenta, flex FROM envios WHERE superado = 0 AND elim = 0 AND did = ?";

            const envioRows = await executeQuery(dbConnection, queryEnvios, [shipmentId]);

            if (envioRows.length > 0 && envioRows[0].flex === 1) {
                const queryMLShipment = "SELECT ml_shipment_id FROM envios WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1";

                const mlshipmentRows = await executeQuery(dbConnection, queryMLShipment, [shipmentId]);

                if (mlshipmentRows.length > 0) {
                    const token = await getToken(envioRows[0].didCliente, envioRows[0].didCuenta, idEmpresa);

                    const dataML = await mlShipment(token, mlshipmentRows[0].ml_shipment_id);

                    if (!dataML || dataML.status !== "delivered") {
                        throw new Error("Debe ser entregado en MercadoLibre");
                    }
                }
            }
        }

        const queryRuteoParadas = "UPDATE ruteo_paradas SET cerrado = 1 WHERE superado = 0 AND elim = 0 AND didPaquete = ?";

        await executeQuery(dbConnection, queryRuteoParadas, [shipmentId]);

        const queryRuteo = "SELECT didRuteo FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didPaquete = ?";

        const rutaRows = await executeQuery(dbConnection, queryRuteo, [shipmentId]);

        if (rutaRows.length > 0) {
            const didRuta = rutaRows[0].didRuteo;

            const queryRuteoParadas = "SELECT didPaquete, cerrado FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didRuteo = ?";

            const enviosRutaRows = await executeQuery(dbConnection, queryRuteoParadas, [didRuta]);

            const cierroRuta = enviosRutaRows.every(envio => envio.cerrado === 1);

            if (cierroRuta) {
                const queryRuteo = "UPDATE ruteo SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ?";

                await executeQuery(dbConnection, queryRuteo, [didRuta]);
            }
        }

        const queryEnviosRecibe = "INSERT INTO envios_recibe (didEnvio, dni, nombre, ilat, ilong, quien) VALUES (?, ?, ?, ?, ?, ?)";

        await executeQuery(dbConnection, queryEnviosRecibe[shipmentId, dnirecibe, nombrerecibe, ilat, ilong, quien]);

        const queryEnvios = "SELECT choferAsignado, estado_envio FROM envios WHERE superado = 0 AND elim = 0 AND did = ?";

        const choferRows = await executeQuery(dbConnection, queryEnvios, [shipmentId]);

        const choferAsignado = choferRows[0]?.choferAsignado ?? null;

        const queryInsertEnviosHistorial = "INSERT INTO envios_historial (didEnvio, estado, didCadete, fecha, desde, quien) VALUES (?, ?, ?, NOW(), 'MOVIL', ?)";

        const historialResult = await executeQuery(dbConnection, queryInsertEnviosHistorial, [shipmentId, estado, choferAsignado, quien]);

        const idInsertado = historialResult.insertId;

        const updates = [
            { query: "UPDATE envios_historial SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?", values: [shipmentId, idInsertado] },
            { query: "UPDATE envios SET estado_envio = ? WHERE superado = 0 AND did = ? AND elim = 0", values: [estado, shipmentId] },
            { query: "UPDATE envios_asignaciones SET estado = ? WHERE superado = 0 AND didEnvio = ? AND elim = 0", values: [estado, shipmentId] }
        ];

        for (const { query, values } of updates) {
            await executeQuery(dbConnection, query, values);
        }

        if (observacion) {
            const queryInsertObservaciones = "INSERT INTO envios_observaciones (didEnvio, observacion, quien) VALUES (?, ?, ?)";

            const obsResult = await executeQuery(dbConnection, queryInsertObservaciones, [shipmentId, observacion, quien]);

            const queryUpdateEnviosObservaciones = "UPDATE envios_observaciones SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?";

            await executeQuery(dbConnection, queryUpdateEnviosObservaciones, [shipmentId, obsResult.insertId]);
        }

        return { message: "Visita registrada" };

    } catch (error) {
        console.error("Error in register visit:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}

async function getToken(clientId, accountId, companyId) {
    const url = `https://cuentasarg.lightdata.com.ar/getTokenML.php?dc=${clientId}&dc2=${accountId}&didEmpresa=${companyId}&ventaflex=0`;

    try {
        const { data } = await axios.get(url);

        return data.trim();
    } catch (error) {
        console.error("Error obteniendo token:", error);
        throw error;
    }
}

async function mlShipment(token, shipmentId) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}?access_token=${token}`;

    try {
        const { data } = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return data;
    } catch (error) {
        console.error("Error obteniendo datos de MercadoLibre:", error);
        throw error;
    }
}
