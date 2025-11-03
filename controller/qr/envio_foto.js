import axios from "axios";
import { CustomException, executeQuery } from "lightdata-tools";
import { axiosInstance, urlAltaEnvioMicroservice, urlFotoEnviosUploadImage } from "../../db.js";

export async function altaEnvioFoto({ db, req, company }) {
  const { image, userId, address, driverId, appVersion, brand, model, androidVersion, deviceId, deviceFrom, profile } = req.body;

  const companyId = company.did;
  const enviosDireccionesDestino = { calle: address };

  // ajustar parametros a envio foto (usuario foto)
  const reqBody = {
    "data": { idEmpresa: companyId, quien: userId, enviosDireccionesDestino: enviosDireccionesDestino, elim: 69, lote: "envioFoto" },
  };

  const response = await axiosInstance.post(urlAltaEnvioMicroservice, reqBody, {
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

    const reqBody = { image, shipmentId, companyId };

    const res = await axios.post(urlFotoEnviosUploadImage, reqBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!res.data) {
      throw new CustomException({
        title: 'Error en subida de imagen',
        message: 'No se pudo subir la imagen',
      });
    } else {
      const shipmentId = response.data.did;
      const server = 1;

      const reqBody = { image, shipmentId, companyId };
      const url = urlFotoEnviosUploadImage;

      const res = await axios.post(url, reqBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!res.data) {
        throw new CustomException({
          title: 'Error en subida de imagen',
          message: 'No se pudo subir la imagen',
        });
      }

      const insertQuery = "INSERT INTO envios_fotos (elim, didEnvio, nombre, server, quien ) VALUES ( 69, ?, ?, ?, ?)";

      await executeQuery({ dbConnection: db, query: insertQuery, values: [shipmentId, res.data, server, userId] });

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
  }
}

