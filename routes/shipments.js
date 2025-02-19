import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { shipmentDetails, shipmentList, uploadImage } from '../controller/shipmentsController/shipments.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';

const shipments = Router();

shipments.post('/shipment-list', async (req, res) => {
  const mensajeError = verifyParamaters(req.body, ['from', 'dashboardValue'], true);

  if (mensajeError) {
    return res.status(400).json({ message: mensajeError });
  }

  const { companyId, userId, profile, from, dashboardValue } = req.body;

  try {
    const company = await getCompanyById(companyId);

    const result = await shipmentList(company, userId, profile, from, dashboardValue);

    return res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

shipments.post("/shipment-details", verifyToken, async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
});

shipments.post('/upload-image', async (req, res) => {

  const mensajeError = verifyParamaters(req.body, ['shipmentId', 'shipmentState', 'image'], true);

  if (mensajeError) {
    return res.status(400).json({ message: mensajeError });
  }

  const { companyId, shipmentId, userId, shipmentState, image } = req.body;

  try {
    const company = await getCompanyById(companyId);

    const response = await uploadImage(company, shipmentId, userId, shipmentState, image);

    res.status(200).json({ body: response, message: "Imagen subida correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default shipments;