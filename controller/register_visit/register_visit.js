import { executeQueryFromPool, connectionsPools } from "../../db.js";
import axios from "axios";
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";
import { getTokenMLconMasParametros } from "../../src/funciones/getTokenMLconMasParametros.js";

export async function registerVisit(
  companyId,
  userId,
  shipmentId,
  recieverDNI,
  recieverName,
  latitude,
  longitude,
  shipmentState,
  observation,
  date,
) {
  const pool = connectionsPools[companyId];
  try {
    const queryEnviosHistorial =
      "SELECT estado FROM envios_historial WHERE superado = 0 AND elim = 0 AND didEnvio = ?";

    const estadoActualRows = await executeQueryFromPool(
      pool,
      queryEnviosHistorial,
      [shipmentId]
    );

    if (estadoActualRows.length == 0) {
      throw new CustomException({
        title: "Error en registro de visita",
        message: "No se encontró el envío",
      });
    }

    if (estadoActualRows.length > 0 && estadoActualRows[0].estado == 8) {
      throw new CustomException({
        title: "El envío ya fue entregado o cancelado",
        message: "El envío ya fue entregado o cancelado",
      });
    }

    const currentShipmentState = estadoActualRows[0].estado;

    // Para wynflex si esta entregado
    if (
      currentShipmentState == 5 &&
      (companyId == 72 || companyId == 125)
    ) {
      const queryEnvios =
        "SELECT didCliente, didCuenta, flex FROM envios WHERE superado = 0 AND elim = 0 AND did = ?";

      const envioRows = await executeQueryFromPool(pool, queryEnvios, [
        shipmentId,
      ]);

      if (envioRows.length > 0 && envioRows[0].flex === 1) {
        const queryMLShipment =
          "SELECT ml_shipment_id FROM envios WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1";

        const mlshipmentRows = await executeQueryFromPool(
          pool,
          queryMLShipment,
          [shipmentId]
        );

        if (mlshipmentRows.length > 0) {
          const token = await getTokenMLconMasParametros(
            envioRows[0].didCliente,
            envioRows[0].didCuenta,
            companyId
          );

          const dataML = await mlShipment(
            token,
            mlshipmentRows[0].ml_shipment_id
          );

          if (!dataML || dataML.status !== "delivered") {
            throw new CustomException({
              title: "El envío no fue entregado en MercadoLibre",
              message: "El envío no fue entregado en MercadoLibre",
            });
          }
        }
      }
    }

    const queryRuteoParadas =
      "UPDATE ruteo_paradas SET cerrado = 1 WHERE superado = 0 AND elim = 0 AND didPaquete = ?";

    await executeQueryFromPool(pool, queryRuteoParadas, [shipmentId]);

    const queryRuteo =
      "SELECT didRuteo FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didPaquete = ?";

    const rutaRows = await executeQueryFromPool(pool, queryRuteo, [shipmentId]);

    if (rutaRows.length > 0) {
      const didRuta = rutaRows[0].didRuteo;

      const queryRuteoParadas =
        "SELECT didPaquete, cerrado FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didRuteo = ?";

      const enviosRutaRows = await executeQueryFromPool(pool, queryRuteoParadas, [didRuta]);

      const cierroRuta = enviosRutaRows.every((envio) => envio.cerrado === 1);

      if (cierroRuta) {
        const queryRuteo =
          "UPDATE ruteo SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ?";

        await executeQueryFromPool(pool, queryRuteo, [didRuta]);
      }
    }

    const queryEnviosRecibe =
      "INSERT INTO envios_recibe (didEnvio, dni, nombre, ilat, ilong, quien) VALUES (?, ?, ?, ?, ?, ?)";

    await executeQueryFromPool(pool, queryEnviosRecibe, [
      shipmentId,
      recieverDNI,
      recieverName,
      latitude,
      longitude,
      userId,
    ]);

    const queryEnvios =
      "SELECT choferAsignado, estado_envio FROM envios WHERE superado = 0 AND elim = 0 AND did = ?";

    const choferRows = await executeQueryFromPool(pool, queryEnvios, [
      shipmentId,
    ]);

    const assignedDriverId = choferRows[0]?.choferAsignado ?? null;

    const queryInsertEnviosHistorial =
      "INSERT INTO envios_historial (didEnvio, estado, didCadete, fecha, desde, quien) VALUES (?, ?, ?, ?, 'APP NUEVA', ?)";

    const historialResult = await executeQueryFromPool(
      pool,
      queryInsertEnviosHistorial,
      [shipmentId, shipmentState, assignedDriverId, date, userId]
    );

    const idInsertado = historialResult.insertId;

    const updates = [
      {
        query:
          "UPDATE envios_historial SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?",
        values: [shipmentId, idInsertado],
      },
      {
        query:
          "UPDATE envios SET estado_envio = ? WHERE superado = 0 AND did = ? AND elim = 0",
        values: [shipmentState, shipmentId],
      },
      {
        query:
          "UPDATE envios_asignaciones SET estado = ? WHERE superado = 0 AND didEnvio = ? AND elim = 0",
        values: [shipmentState, shipmentId],
      },
    ];

    for (const { query, values } of updates) {
      await executeQueryFromPool(pool, query, values);
    }

    if (observation) {
      const queryInsertObservaciones =
        "INSERT INTO envios_observaciones (didEnvio, observacion, quien) VALUES (?, ?, ?)";

      const obsResult = await executeQueryFromPool(
        pool,
        queryInsertObservaciones,
        [shipmentId, observation, userId]
      );

      const queryUpdateEnviosObservaciones =
        "UPDATE envios_observaciones SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?";

      await executeQueryFromPool(pool, queryUpdateEnviosObservaciones, [
        shipmentId,
        obsResult.insertId,
      ]);
    }

    return {
      lineId: idInsertado,
      shipmentState: shipmentState,
    };
  } catch (error) {
    logRed(`Error in register visit: ${error.stack}`);
    if (error instanceof CustomException) {
      throw error;
    }
    throw new CustomException({
      title: "Error en registro de visita",
      message: error.message,
      stack: error.stack,
    });
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
    logRed(`Error obteniendo datos de MercadoLibre: ${error.stack}`);
    if (error instanceof CustomException) {
      throw error;
    }
    throw new CustomException({
      title: "Error obteniendo datos de MercadoLibre",
      message: error.message,
      stack: error.stack,
    });
  }
}
