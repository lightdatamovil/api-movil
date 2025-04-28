import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { nextDeliver } from '../controller/shipments/next_deliver.js';
import { shipmentDetails } from '../controller/shipments/get_shipment_details.js';
import { shipmentList } from '../controller/shipments/get_shipment_list.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logGreen, logPurple, logRed } from '../src/funciones/logsCustom.js';
import CustomException from '../classes/custom_exception.js';

const shipments = Router();

shipments.post('/shipment-list', verifyToken, async (req, res) => {
  const startTime = performance.now();
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ['companyId', 'userId', 'profile', 'from', 'shipmentStates', 'isAssignedToday'],
      true
    );
    if (mensajeError) {
      logRed(`Error en shipment-list: ${mensajeError}`);
      throw new CustomException({ title: 'Error en shipment-list', message: mensajeError });
    }

    const { companyId, userId, profile, from, shipmentStates, isAssignedToday } = req.body;
    const company = await getCompanyById(companyId);
    const result = await shipmentList(company, userId, profile, from, shipmentStates, isAssignedToday);

    logGreen(`Listado de envíos obtenido correctamente`);
    res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en shipment-list: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en shipment-list: ${error}`);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución shipment-list: ${endTime - startTime} ms`);
  }
});

shipments.post('/shipment-details', verifyToken, async (req, res) => {
  const startTime = performance.now();
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ['companyId', 'userId', 'shipmentId'],
      true
    );
    if (mensajeError) {
      logRed(`Error en shipment-details: ${mensajeError}`);
      throw new CustomException({ title: 'Error en shipment-details', message: mensajeError });
    }

    const { companyId, userId, shipmentId } = req.body;
    const company = await getCompanyById(companyId);
    const result = await shipmentDetails(company, shipmentId, userId);

    logGreen(`Detalle de envío obtenido correctamente`);
    res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en shipment-details: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en shipment-details: ${error}`);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución shipment-details: ${endTime - startTime} ms`);
  }
});

shipments.post('/next-visit', verifyToken, async (req, res) => {
  const startTime = performance.now();
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ['companyId', 'userId', 'shipmentId', 'dateYYYYMMDD'],
      true
    );
    if (mensajeError) {
      logRed(`Error en next-visit: ${mensajeError}`);
      throw new CustomException({ title: 'Error en next-visit', message: mensajeError });
    }

    const { companyId, userId, shipmentId, dateYYYYMMDD } = req.body;
    const company = await getCompanyById(companyId);
    const result = await nextDeliver(company, shipmentId, dateYYYYMMDD, userId);

    logGreen(`Próxima visita obtenida correctamente`);
    res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en next-visit: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en next-visit: ${error}`);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución next-visit: ${endTime - startTime} ms`);
  }
});

export default shipments;
