import { getProdDbConfig, executeQuery } from "../../db.js";
import mysql2 from "mysql2";
import axios from "axios";
import { logCyan, logRed, logYellow } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";


export async function altaEnvioFoto(company, req) {
  const { image, userId, address, driverId, appVersion, brand, model, androidVersion, deviceId, deviceFrom, profile } = req.body;

  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {

    // ajustar a endpoint
    const url = `https://altaenvios.lightdata.com.ar/api/altaEnvio`;
    const companyId = company.did;
    const enviosDireccionesDestino = { calle: address };

    // ajustar parametros a envio foto (usuario foto)
    const reqBody = {
      "data": { idEmpresa: companyId, quien: userId, enviosDireccionesDestino: enviosDireccionesDestino, elim: 69, lote: "envioFoto" },
    };

    const response = await axios.post(url, reqBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data) {
      throw new CustomException({
        title: 'Error en altaEnvioFoto',
        message: 'No se pudo registrar el envio de foto',
      });
    } else {
      const shipmentId = response.data.did;
      const server = 1;

      const reqBody = { image, shipmentId, companyId };
      const url = 'https://files.lightdata.app/upload_foto_envios.php';

      const res = await axios.post(url, reqBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      logCyan(`Response de subida de imagen: ${JSON.stringify(res.data)}`);
      if (!res.data) {
        throw new CustomException({
          title: 'Error en subida de imagen',
          message: 'No se pudo subir la imagen',
        });
      }

      const insertQuery = "INSERT INTO envios_fotos (elim, didEnvio, nombre, server, quien ) VALUES ( 69, ?, ?, ?, ?)";

      await executeQuery(dbConnection, insertQuery, [shipmentId, res.data, server, userId]);
      logYellow(`Imagen subida correctamente para el envio: ${shipmentId}`);

      const url_assignment = `https://asignaciones.lightdata.app/api/asignaciones/asignar-web`;

      const companyId2 = parseInt(company.did, 10);
      const req_body_asignar = {
        shipmentId: shipmentId,
        userId: userId,
        driverId: driverId,
        deviceFrom: deviceFrom,
        profile: profile,
        companyId: companyId2,
        appVersion: appVersion,
        brand: brand,
        model: model,
        androidVersion: androidVersion,
        deviceId: deviceId
      };

      logCyan(`ReqBody Asignar: ${JSON.stringify(req_body_asignar)}`);
      const response_assign = await axios.post(url_assignment, req_body_asignar, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response_assign.data) {
        throw new CustomException({
          title: 'Error en asignacion de envio',
          message: 'No se pudo asignar el envio',
        });
      }
      return shipmentId;
    }
  } catch (error) {
    logRed(`Error en altaEnvioFoto: ${error.message}`);
    throw new CustomException({
      title: 'Error en altaEnvioFoto',
      message: error.message,
    });

  } finally {
    dbConnection.end();

  }

}

