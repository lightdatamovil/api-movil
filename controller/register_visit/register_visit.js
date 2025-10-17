import axios from "axios";
import { CustomException, executeQuery, sendShipmentStateToStateMicroserviceAPI } from "lightdata-tools";
import { getTokenMLconMasParametros } from "../../src/funciones/getTokenMLconMasParametros.js";
import { axiosInstance } from "../../db.js";

export async function registerVisit(dbConnection, req, company) {
  const {
    shipmentId,
    shipmentState,
    observation,
    recieverDNI,
    recieverName,
    latitude,
    longitude,
  } = req.body;
  const { userId } = req.user;

  // 1️⃣ Validar envío existente y estado actual
  const queryEstadoActual =
    "SELECT estado FROM envios_historial WHERE superado = 0 AND elim = 0 AND didEnvio = ?";
  const estadoActualRows = await executeQuery(dbConnection, queryEstadoActual, [shipmentId]);

  if (estadoActualRows.length === 0) {
    throw new CustomException({
      title: "Error en registro de visita",
      message: "No se encontró el envío",
    });
  }

  const currentShipmentState = estadoActualRows[0].estado;

  if (currentShipmentState == 8) {
    throw new CustomException({
      title: "El envío ya fue cancelado",
      message: "El envío ya fue cancelado",
    });
  }

  // 2️⃣ Validar en MercadoLibre si corresponde (Wynflex)
  if (company.did === 72 || company.did === 125) {
    const queryEnvios =
      "SELECT didCliente, didCuenta, flex FROM envios WHERE superado = 0 AND elim = 0 AND did = ?";
    const envioRows = await executeQuery(dbConnection, queryEnvios, [shipmentId]);

    if (envioRows.length > 0 && envioRows[0].flex === 1) {
      const queryMLShipment =
        "SELECT ml_shipment_id FROM envios WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1";
      const mlshipmentRows = await executeQuery(dbConnection, queryMLShipment, [shipmentId]);

      if (mlshipmentRows.length > 0) {
        const token = await getTokenMLconMasParametros(
          envioRows[0].didCliente,
          envioRows[0].didCuenta,
          company.did
        );

        const dataML = await mlShipment(token, mlshipmentRows[0].ml_shipment_id);

        if (!dataML || dataML.status !== "delivered") {
          throw new CustomException({
            title: "El envío no fue entregado en MercadoLibre",
            message: "El envío no fue entregado en MercadoLibre",
          });
        }
      }
    }
  }

  // 3️⃣ Cerrar parada en ruteo_paradas
  const queryCerrarParada =
    "UPDATE ruteo_paradas SET cerrado = 1 WHERE superado = 0 AND elim = 0 AND didPaquete = ?";
  await executeQuery(dbConnection, queryCerrarParada, [shipmentId]);

  // 4️⃣ Si todas las paradas de la ruta están cerradas, marcar ruteo como superado
  const queryRuta = "SELECT didRuteo FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didPaquete = ?";
  const rutaRows = await executeQuery(dbConnection, queryRuta, [shipmentId]);

  if (rutaRows.length > 0) {
    const didRuta = rutaRows[0].didRuteo;
    const queryParadasRuta =
      "SELECT cerrado FROM ruteo_paradas WHERE superado = 0 AND elim = 0 AND didRuteo = ?";
    const enviosRutaRows = await executeQuery(dbConnection, queryParadasRuta, [didRuta]);

    const cierroRuta = enviosRutaRows.every((envio) => envio.cerrado === 1);
    if (cierroRuta) {
      const queryCerrarRuta = "UPDATE ruteo SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ?";
      await executeQuery(dbConnection, queryCerrarRuta, [didRuta]);
    }
  }

  // 5️⃣ Registrar datos del receptor (envios_recibe)
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


  const queryEstadosPrevios =
    "SELECT estado FROM envios_historial WHERE elim = 0 AND didEnvio = ?";
  const estadosPrevios = await executeQuery(dbConnection, queryEstadosPrevios, [shipmentId]);


  // 7️⃣ Validaciones de empresa
  if (company.did === 4 && currentShipmentState === 5) {
    throw new CustomException({
      title: "El envío ya fue entregado",
      message: "El envío ya fue entregado",
    });
  }

  if (company.did === 167) {
    let contadorEstadoNadie = 0;
    for (const row of estadosPrevios) {
      const estado = Number(row?.estado);
      if (estado === 6 || estado === 9) contadorEstadoNadie++;
      if (contadorEstadoNadie > 2) {
        throw new CustomException({
          title: "Límite de estados 'nadie'",
          message: "No se puede registrar la visita porque hay más de dos estados 'nadie'.",
        });
      }
    }
  }

  // 8️⃣ Determinar estadoInsert
  const hayEstado6 = estadosPrevios.some((r) => Number(r.estado) === 6);
  let estadoInsert;
  if (hayEstado6 && shipmentState === 5) {
    estadoInsert = 9;
  } else if (hayEstado6 && shipmentState === 6) {
    estadoInsert = company.did === 4 ? 6 : 10;
  } else {
    estadoInsert = shipmentState;
  }

  // 9️⃣ Enviar al microservicio de estados
  const response = await sendShipmentStateToStateMicroserviceAPI({
    urlEstadosMicroservice: "http://10.70.0.69:13000/estados",
    axiosInstance,
    company,
    userId,
    estado: estadoInsert,
    shipmentId,
    latitude,
    longitude,
  });

  const idInsertado = response.id;

  // 11️⃣ Actualizar envíos y asignaciones
  const updates = [
    {
      query:
        "UPDATE envios_historial SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?",
      values: [shipmentId, idInsertado],
    },
    {
      query: "UPDATE envios SET estado_envio = ? WHERE superado = 0 AND elim = 0 AND did = ?",
      values: [estadoInsert, shipmentId],
    },
    {
      query:
        "UPDATE envios_asignaciones SET estado = ? WHERE superado = 0 AND elim = 0 AND didEnvio = ? AND elim = 0",
      values: [estadoInsert, shipmentId],
    },
  ];

  for (const { query, values } of updates) {
    await executeQuery(dbConnection, query, values);
  }

  // 12️⃣ Insertar observación si corresponde
  if (observation) {
    const queryInsertObservaciones =
      "INSERT INTO envios_observaciones (didEnvio, observacion, quien) VALUES (?, ?, ?)";
    const obsResult = await executeQuery(dbConnection, queryInsertObservaciones, [
      shipmentId,
      observation,
      userId,
    ]);

    const queryUpdateObservaciones =
      "UPDATE envios_observaciones SET superado = 1 WHERE superado = 0 AND didEnvio = ? AND elim = 0 AND id != ?";
    await executeQuery(dbConnection, queryUpdateObservaciones, [shipmentId, obsResult.insertId]);
  }

  // ✅ Retornar respuesta final
  return {
    body: {
      lineId: idInsertado,
      shipmentState: estadoInsert,
    },
    message: "Visita registrada correctamente",
  };
}

// 🔧 Función auxiliar MercadoLibre
async function mlShipment(token, shipmentId) {
  const url = `https://api.mercadolibre.com/shipments/${shipmentId}?access_token=${token}`;
  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) {
    throw new CustomException({
      title: "Error obteniendo datos de MercadoLibre",
      message: error.message,
      stack: error.stack,
    });
  }
}
