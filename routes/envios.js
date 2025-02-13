const mysql = require('mysql');
const envios = require('express').Router();
const verifyToken = require('../src/funciones/verifyToken');
const { buscarEmpresaById } = require('../db');

envios.post("/obtener-envio", verifyToken, async (req, res) => {
  try {
    const { idEmpresa, perfil, diduser, idenvio } = req.body;
    const empresa = buscarEmpresaById(idEmpresa);
    if (!empresa) {
      return res
        .status(400)
        .json({
          estadoRespuesta: false,
          body: "",
          mensaje: "Empresa no encontrada",
        });
    }

    var sqldidenvio = " AND e.did = " + idenvio;
    var dataEnvio = new Object();
    dataEnvio["historial"] = [];
    dataEnvio["observaciones"] = [];
    dataEnvio["imagenes"] = [];

    let dbConfig = {
      host: "149.56.182.49",
      user: "ue" + empresa.id,
      password: "78451296",
      database: "e" + empresa.id,
      port: 44339
    };

    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();
    const query =
      "SELECT e.did, e.flex, e.ml_shipment_id, e.didCliente, e.destination_latitude, e.destination_longitude, e.destination_shipping_zip_code, e.destination_city_name ,e.ml_venta_id,e.destination_shipping_address_line, e.estado_envio, e.destination_comments, date_format (e.fecha_inicio,'%d/%m/%Y') as fecha , e.destination_receiver_name, e.destination_receiver_phone, e.didCliente, e.choferAsignado, ec.valor as monto_a_cobrar FROM envios as e LEFT JOIN envios_cobranzas as ec on ( ec.elim=0 and ec.superado=0 and ec.didCampoCobranza = 4 and e.did = ec.didEnvio) WHERE e.elim=0 and e.superado=0 " +
      sqldidenvio;
    const results = await executeQuery(dbConnection, query, []);
    var datatemp = results[0];

    lat = 0;
    long = 0;
    if (datatemp.destination_latitude != 0) {
      lat = datatemp.destination_latitude * 1;
      long = datatemp.destination_longitude * 1;
    }
    let asignado = await verificarAsignacion(dbConnection, idenvio, diduser);

    dataEnvio["nombreDestinatario"] = datatemp.destination_receiver_name;
    dataEnvio["nombreCliente"] = "";
    dataEnvio["didCliente"] = datatemp.didCliente * 1;
    dataEnvio["domicilio1"] = datatemp.destination_shipping_address_line;
    dataEnvio["domicilio2"] = "CP " + datatemp.destination_shipping_zip_code + ", " + datatemp.destination_city_name;
    dataEnvio["telefono"] = datatemp.destination_receiver_phone;
    dataEnvio["observacionDomicilio"] = datatemp.destination_comments;
    dataEnvio["estadoActual"] = datatemp.estado_envio;
    dataEnvio["id_venta"] = datatemp.ml_venta_id;
    dataEnvio["id_envio"] = datatemp.ml_shipment_id;
    dataEnvio["cobranza"] = 0;
    dataEnvio["latitud"] = lat;
    dataEnvio["longitud"] = long;
    dataEnvio["monto_a_cobrar"] = (datatemp.monto_a_cobrar ?? 0).toString();
    dataEnvio["asignado"] = asignado;

    const queryH =
      "SELECT estado, date_format(fecha,'%d/%m/%Y %H:%i:%s') as fecha FROM envios_historial where elim=0 and didEnvio = " +
      idenvio +
      " ORDER BY fecha ASC ";
    const resultsH = await executeQuery(dbConnection, queryH, []);
    for (i = 0; i < resultsH.length; i++) {
      var row = resultsH[i];
      dataEnvio["historial"].push({ estado: row.estado, fecha: row.fecha });
    }

    const queryN =
      "SELECT observacion,date_format(autofecha,'%d/%m/%Y %H:%i:%s') as fecha FROM `envios_observaciones` where elim=0 and didEnvio= " +
      idenvio +
      "  ORDER BY `id` ASC";
    const resultsN = await executeQuery(dbConnection, queryN, []);
    for (i = 0; i < resultsN.length; i++) {
      var row = resultsN[i];
      dataEnvio["observaciones"].push({
        observacion: row.observacion,
        fecha: row.fecha,
      });
    }

    const queryF =
      "SELECT didEnvio,nombre,server FROM `envios_fotos` Where superado=0 and elim=0 and didEnvio = " +
      idenvio +
      "   ORDER BY `id` DESC";
    const resultsF = await executeQuery(dbConnection, queryF, []);
    for (i = 0; i < resultsF.length; i++) {
      var row = resultsF[i];
      dataEnvio["imagenes"].push({
        server: row.server,
        imagen: row.nombre,
        didenvio: row.didEnvio,
      });
    }

    dbConnection.end();
    res
      .status(200)
      .json({ estadoRespuesta: true, body: dataEnvio, mensaje: "" });
  } catch (error) {
    dbConnection.end();
    console.error("Error al obtener el cliente:", error);
    res
      .status(500)
      .json({
        estadoRespuesta: false,
        body: "",
        mensaje: "Error interno del servidor" + error,
      });
  }
});

module.exports = envios;