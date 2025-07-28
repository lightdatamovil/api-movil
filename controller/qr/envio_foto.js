import { getProdDbConfig, executeQuery } from "../../db.js";
import mysql2 from "mysql2";
import axios from "axios";
import { logCyan, logPurple, logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";


export async function altaEnvioFoto(company, req) {
  const { image, userId } = req.body;

  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {

    // ajustar a endpoint
    const url = `https://altaenvios.lightdata.com.ar/api/altaEnvio`;
    const companyId = company.did;

    // ajustar parametros a envio foto (usuario foto)
    const reqBody = {
      "data": { idEmpresa: companyId, quien: userId, calle: street, numero: number, localidad: city, obs: observations, elim: 69 },
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
      const shipmentId = response.did;

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

