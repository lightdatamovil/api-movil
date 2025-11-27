import { getProdDbConfig, executeQuery, axiosInstance } from "../../db.js";
import mysql2 from "mysql2";
import axios from "axios";
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";
import { getTokenMLconMasParametros } from "../../src/funciones/getTokenMLconMasParametros.js";
import { getFechaConHoraLocalDePais } from "../../src/funciones/getFechaConHoraLocalByPais.js";
import { logOrange, sendShipmentStateToStateMicroserviceAPI } from "lightdata-tools";
export function generarTokenFechaHoy(country) {
  const fechaLocal = getFechaLocalDePais(country);
  const [anio, mes, dia] = fechaLocal.split('-');

  const fechaString = `${dia}${mes}${anio}`;
  const hash = crypto.createHash('sha256').update(fechaString).digest('hex');

  return hash;
}

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
) {
  if (shipmentState == 0 || shipmentState == null || shipmentState == undefined) {
    throw new CustomException({
      title: "No es posible registrar visita",
      message: "Estado no valido"
    });
  }
  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {
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
        title: "El envío ya fue cancelado",
        message: "El envío ya fue cancelado",
      });
    }

    if (currentShipmentState == 5 || currentShipmentState == 9) {
      throw new CustomException({
        title: "El envío ya fue entregado",
        message: "El envío ya fue entregado",
      });
    }
    if (company.did == 20 && currentShipmentState == 17) {
      throw new CustomException({
        title: "El envío ya fue entregado",
        message: "El envío ya fue entregado",
      });
    }
    // Para wynflex si esta entregado
    if (company.did == 72 || company.did == 125 || company.did == 350) {
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

    const queryEnviosNoEntregado =
      "SELECT estado FROM envios_historial WHERE  elim = 0 AND didEnvio = ?";
    const choferRows2 = await executeQuery(dbConnection, queryEnviosNoEntregado, [
      shipmentId
    ]);

    let estadoInsert;

    // Verifica si existe al menos un registro con estado == 6
    let hayEstado6 = Array.isArray(choferRows2) && choferRows2.some(r => Number(r?.estado) === 6);

    if (company.did == 167) {
      let contadorEstadoNadie = 0;
      for (const row of choferRows2) {
        const estado = Number(row?.estado);
        if (estado === 6 || estado === 9) {
          contadorEstadoNadie++;
          if (contadorEstadoNadie > 2) {
            throw new CustomException({
              title: "Alcanzaste el limite de estados nadie",
              message: "No se puede registrar la visita porque hay más de dos estados nadie.",
            });
          }
        }
      }
    }

    // si el currentShipmentState es nadie (6) estadoInert = 10 sino shipmentState
    if (hayEstado6 && shipmentState == 5) {
      estadoInsert = 9;
    } else if (hayEstado6 && shipmentState == 6) {
      // excepcion pocurrier
      estadoInsert = (company.did == 4) ? 6 : 10;
    } else { estadoInsert = shipmentState; }
    const message = {
      didempresa: company.did,
      didenvio: shipmentId,
      estado: estadoInsert,
      subestado: null,
      estadoML: null,
      fecha: getFechaConHoraLocalDePais(company.pais),
      quien: userId,
      operacion: `APP NUEVA Registro de visita`,
      latitud: latitude,
      longitud: longitude,
      desde: `APP NUEVA Registro de visita`,
      tkn: generarTokenFechaHoy(company.pais),
    };
    const response = await axiosInstance.post("http://10.70.0.69:13000/estados", message);

    console.log("Registro de visita enviado a microservicio de estados:", message);
    const idInsertado = response.id;
    const queryUpdate = "UPDATE envios_asignaciones SET estado = ? WHERE superado = 0 AND didEnvio = ? AND elim = 0";

    await executeQuery(dbConnection, queryUpdate, [estadoInsert, shipmentId]);


    if (observation) {
      const queryInsertObservaciones =
        "INSERT INTO envios_observaciones (didEnvio, observacion, quien) VALUES (?, ?, ?)";

      const obsResult = await executeQuery(
        dbConnection,
        queryInsertObservaciones,
        [shipmentId, observation, userId]
      );

      await executeQuery(dbConnection, "UPDATE envios_observaciones SET did = ? WHERE id = ?", [
        obsResult.insertId,
        obsResult.insertId
      ]);

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
    logRed(`Error in register visit: ${JSON.stringify(error)} `);
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
