import { getProdDbConfig, executeQuery } from "../../db.js";
import mysql2 from "mysql2";
import axios from "axios";
import { logPurple, logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";
import { getTokenMLconMasParametros } from "../../src/funciones/getTokenMLconMasParametros.js";
import { getFechaConHoraLocalDePais } from "../../src/funciones/getFechaConHoraLocalByPais.js";

export async function registerVisit(
  company,
  userId,
  shipmentId,
  recieverDNI,
  recieverName,
  latitude,
  longitude,
  shipmentState,
  observation,
  appVersion,
) {
  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {
    const date = getFechaConHoraLocalDePais(company.pais);
    logPurple(`Registering visit for shipment ${shipmentId} at ${date} with user ${userId}`);
    const queryEnviosHistorial =
      "SELECT estado FROM envios_historial WHERE superado = 0 AND elim = 0 AND didEnvio = ?";

    const estadoActualRows = await executeQuery(
      dbConnection,
      queryEnviosHistorial,
      [shipmentId]
    );

    if (estadoActualRows.length == 0) {
      throw new CustomException({
        title: "Error en registro de visita",
        message: "No se encontró el envío",
      });
    }

    const currentShipmentState = estadoActualRows[0].estado;

    if (estadoActualRows.length > 0 && currentShipmentState == 8) {
      throw new CustomException({
        title: "El envío ya fue entregado o cancelado",
        message: "El envío ya fue entregado o cancelado",
      });
    }

    // Para wynflex si esta entregado
    if (
      currentShipmentState == 5 &&
      (company.did == 72 || company.did == 125)
    ) {
      const queryEnvios =
        "SELECT didCliente, didCuenta, flex FROM envios WHERE superado = 0 AND elim = 0 AND did = ?";

      const envioRows = await executeQuery(dbConnection, queryEnvios, [
        shipmentId,
      ]);

      if (envioRows.length > 0 && envioRows[0].flex === 1) {
        const queryMLShipment =
          "SELECT ml_shipment_id FROM envios WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1";

        const mlshipmentRows = await executeQuery(
          dbConnection,
          queryMLShipment,
          [shipmentId]
        );

        if (mlshipmentRows.length > 0) {
          const token = await getTokenMLconMasParametros(
            envioRows[0].didCliente,
            envioRows[0].didCuenta,
            company.did
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

    await executeQuery(dbConnection, queryRuteoParadas, [shipmentId]);

    const queryRuteo =
      "SELECT didRuteo FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didPaquete = ?";

    const rutaRows = await executeQuery(dbConnection, queryRuteo, [shipmentId]);

    if (rutaRows.length > 0) {
      const didRuta = rutaRows[0].didRuteo;

      const queryRuteoParadas =
        "SELECT didPaquete, cerrado FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didRuteo = ?";

      const enviosRutaRows = await executeQuery(
        dbConnection,
        queryRuteoParadas,
        [didRuta]
      );

      const cierroRuta = enviosRutaRows.every((envio) => envio.cerrado === 1);

      if (cierroRuta) {
        const queryRuteo =
          "UPDATE ruteo SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ?";

        await executeQuery(dbConnection, queryRuteo, [didRuta]);
      }
    }

    const queryEnviosRecibe =
      "INSERT INTO envios_recibe (didEnvio, dni, nombre, ilat, ilong, quien) VALUES (?, ?, ?, ?, ?, ?)";

    await executeQuery(dbConnection, queryEnviosRecibe, [
      shipmentId,
      recieverDNI,
      recieverName,
      latitude,
      longitude,
      userId,
    ]);

    const queryEnvios =
      "SELECT choferAsignado, estado_envio FROM envios WHERE superado = 0 AND elim = 0 AND did = ?";
    const choferRows = await executeQuery(dbConnection, queryEnvios, [
      shipmentId,
    ]);

    const assignedDriverId = choferRows[0]?.choferAsignado ?? null;

    const estadoInsert = currentShipmentState == 6 ? 10 : shipmentState;

    const queryInsertEnviosHistorial =
      "INSERT INTO envios_historial (didEnvio, estado, didCadete, fecha, desde, quien) VALUES (?, ?, ?, ?, ?, ?)";
    const historialResult = await executeQuery(
      dbConnection,
      queryInsertEnviosHistorial,
      [shipmentId, estadoInsert, assignedDriverId, date, `APP NUEVA ${appVersion} `, userId], true
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
        values: [estadoInsert, shipmentId],
      },
      {
        query:
          "UPDATE envios_asignaciones SET estado = ? WHERE superado = 0 AND didEnvio = ? AND elim = 0",
        values: [estadoInsert, shipmentId],
      },
    ];

    for (const { query, values } of updates) {
      await executeQuery(dbConnection, query, values);
    }

    if (observation) {
      const queryInsertObservaciones =
        "INSERT INTO envios_observaciones (didEnvio, observacion, quien) VALUES (?, ?, ?)";

      const obsResult = await executeQuery(
        dbConnection,
        queryInsertObservaciones,
        [shipmentId, observation, userId]
      );

      const queryUpdateEnviosObservaciones =
        "UPDATE envios_observaciones SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?";

      await executeQuery(dbConnection, queryUpdateEnviosObservaciones, [
        shipmentId,
        obsResult.insertId,
      ]);
    }

    return {
      lineId: idInsertado,
      shipmentState: estadoInsert,
    };
  } catch (error) {
    logRed(`Error in register visit: ${JSON.stringify(error)}`);
    if (error instanceof CustomException) {
      throw error;
    }
    throw new CustomException({
      title: "Error en registro de visita",
      message: error.message,
      stack: error.stack,
    });
  } finally {
    dbConnection.end();
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
