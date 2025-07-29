import { getProdDbConfig, executeQuery } from "../../db.js";
import mysql2 from "mysql2";
import axios from "axios";
import { logCyan, logPurple, logRed, logYellow } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";


export async function altaEnvioFoto(company, req) {
  const { image, userId, street, number, city, observations } = req.body;

  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {

    // ajustar a endpoint
    const url = `https://altaenvios.lightdata.com.ar/api/altaEnvio`;
    const companyId = company.did;
    const enviosDireccionesDestino = { calle: street, numero: number, localidad: city };

    // ajustar parametros a envio foto (usuario foto)
    const reqBody = {
      "data": { idEmpresa: companyId, quien: userId, enviosDireccionesDestino: enviosDireccionesDestino, obs: observations, elim: 69, lote: "envioFoto" },
    };

    const response = await axios.post(url, reqBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    logPurple(`Response de altaEnvioFoto: ${JSON.stringify(response.data)}`);

    if (!response.data) {
      throw new CustomException({
        title: 'Error en altaEnvioFoto',
        message: 'No se pudo registrar el envio de foto',
      });
    } else {
      const shipmentId = response.data.did;

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

      const url_assignment = `http://localhost:13000/api/asignaciones/asignar-web`;

      const companyId2 = parseInt(company.did, 10);
      const req_body_asignar = {
        shipmentId: shipmentId, userId: userId, driverId: userId, deviceFrom: "APP NUEVA", profile: 3, companyId: companyId2, appVersion: "1.0.74",
        brand: "samsung", model: "samsung a15", androidVersion: "14", deviceId: "UTAS34.82-106-4"
      };
      logCyan(`ReqBody Asignar: ${JSON.stringify(req_body_asignar)}`);
      const response_assign = await axios.post(url_assignment, req_body_asignar, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      logPurple(`Response de asignacion de envio: ${JSON.stringify(response_assign.data)}`);
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

