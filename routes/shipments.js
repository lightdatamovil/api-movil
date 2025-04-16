import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { nextDeliver, shipmentDetails, shipmentList } from '../controller/shipmentsController.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logPurple, logRed } from '../src/funciones/logsCustom.js';

const shipments = Router();

shipments.post('/shipment-list', async (req, res) => {
  const startTime = performance.now();
  const mensajeError = verifyParamaters(req.body, ['from', 'shipmentStates', 'isAssignedToday'], true);

  if (mensajeError) {
    return res.status(400).json({ message: mensajeError });
  }

  const { companyId, userId, profile, from, shipmentStates, isAssignedToday } = req.body;

  try {
    const company = await getCompanyById(companyId);

    const result = await shipmentList(company, userId, profile, from, shipmentStates, isAssignedToday);

    res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    logRed(`Error en shipment-list: ${error.stack}`);
    res.status(500).json({ message: error.stack });
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

shipments.post("/shipment-details", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const mensajeError = verifyParamaters(req.body, ['shipmentId'], true);

  if (mensajeError) {
    return res.status(400).json({ message: mensajeError });
  }

  const { companyId, userId, shipmentId } = req.body;

  try {
    const company = await getCompanyById(companyId);

    const result = await shipmentDetails(company, shipmentId, userId);

    res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    logRed(`Error en shipment-details: ${error.stack}`);
    res.status(500).json({ message: error.stack });
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

shipments.post("/next-visit", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const mensajeError = verifyParamaters(req.body, ['shipmentId', 'dateYYYYMMDD'], true);

  if (mensajeError) {
    return res.status(400).json({ message: mensajeError });
  }

  const { companyId, userId, shipmentId, dateYYYYMMDD } = req.body;

  try {
    const company = await getCompanyById(companyId);

    const result = await nextDeliver(company, shipmentId, dateYYYYMMDD, userId);

    res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    logRed(`Error en next-visit: ${error.stack}`);
    res.status(500).json({ message: error.stack });
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

export default shipments;
