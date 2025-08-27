import { getProdDbConfig, executeQuery } from "../../db.js";
import mysql2 from "mysql2";
import axios from "axios";
import { logPurple, logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";
import { getTokenMLconMasParametros } from "../../src/funciones/getTokenMLconMasParametros.js";
import { getFechaConHoraLocalDePais } from "../../src/funciones/getFechaConHoraLocalByPais.js";
import { sendToShipmentStateMicroServiceAPI } from "../../src/funciones/sendToShipmentStateMicroService.js";

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
      [shipmentId], true
    );

    if (estadoActualRows.length == 0) {
      throw new CustomException({
        title: "Error en registro de visita",
        message: "No se encontró el envío",
      });
    }
    console.log("llegue a estado actual")

    const currentShipmentState = estadoActualRows[0].estado;

    if (estadoActualRows.length > 0 && currentShipmentState == 8) {
      throw new CustomException({
        title: "El envío ya fue cancelado",
        message: "El envío ya fue cancelado",
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
          console.log("llegue a estado 1")

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
    console.log("llegue a estado ")
    // if (currentShipmentState == 5 || currentShipmentState == 9 || currentShipmentState == 14 || currentShipmentState == 17) {
    //   throw new CustomException({
    //     title: "No es posible registrar visita",
    //     message: "El envío ya fue entregado o devuelto al cliente",
    //   });
    // }

    const queryRuteoParadas =
      "UPDATE ruteo_paradas SET cerrado = 1 WHERE superado = 0 AND elim = 0 AND didPaquete = ?";

    await executeQuery(dbConnection, queryRuteoParadas, [shipmentId]);

    const queryRuteo =
      "SELECT didRuteo FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didPaquete = ?";

    const rutaRows = await executeQuery(dbConnection, queryRuteo, [shipmentId]);
    console.log("llegue a estado 3")

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
    console.log("llegue a estado 4")

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
    console.log("llegue a estado 5")

    const queryEnviosNoEntregado =
      "SELECT estado FROM envios_historial WHERE  elim = 0 AND didEnvio = ?";
    const choferRows2 = await executeQuery(dbConnection, queryEnviosNoEntregado, [
      shipmentId
    ], true);



    const assignedDriverId = choferRows[0]?.choferAsignado ?? null;
    let estadoInsert;

    //verificar si el estado es nadie (6) y se entrego en 2da visita (9)

    if (company.did == 12) {
      const row = choferRows2.find(r => r.estado == 6);
      if (row && currentShipmentState == 6) {
        currentShipmentState == 6
        estadoInsert = 10; // directamente, porque encontramos un estado 6 en historial
      }
    }
    console.log("llegue a estado 6")

    if (company.did == 4) {
      if (currentShipmentState == 5) {
        throw new CustomException({
          title: "El envío ya fue entregado",
          message: "El envío ya fue entregado",
        });
      }
    }

    // si el currentShipmentState es nadie (6) estadoInert = 10 sino shipmentState
    if (currentShipmentState == 6 && shipmentState == 5) {
      estadoInsert = 9;
    } else {
      estadoInsert = currentShipmentState == 6 ? 10 : shipmentState;
    }

    if (company.did == 4) {
      estadoInsert = currentShipmentState == 6 ? 6 : shipmentState;
    }
    console.log("casi llegue")

    const historialResult = await sendToShipmentStateMicroServiceAPI(
      company,
      userId,
      shipmentId,
      latitude,
      longitude,
      estadoInsert
    );
    console.log(`Resultado de historial: ${JSON.stringify(historialResult)}`);

    const idInsertado = 0;
    /** 
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
    
        */

    if (observation) {
      const queryInsertObservaciones =
        "INSERT INTO envios_observaciones (didEnvio, observacion, quien) VALUES (?, ?, ?)";

      const obsResult = await executeQuery(
        dbConnection,
        queryInsertObservaciones,
        [shipmentId, observation, userId]
      );
      console.log("llegue a estado 7")

      const queryUpdateEnviosObservaciones =
        "UPDATE envios_observaciones SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?";

      await executeQuery(dbConnection, queryUpdateEnviosObservaciones, [
        shipmentId,
        obsResult.insertId,
      ]);
    }

    return {
      lineId: idInsertado ?? 0,
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
