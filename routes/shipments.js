const shipments = require('express').Router();
const verifyToken = require('../src/funciones/verifyToken');
const { getCompanyById } = require('../db');
const { shipmentDetails } = require('../controller/shipmentsController/shipments');

shipments.post("/shipment-details", verifyToken, async (req, res) => {
  const { companyId, profile, userId, shipmentId, deviceId, appVersion, brand, model, androidVersion } = req.body;

  if (!companyId || !profile || !userId || !shipmentId) {
    return res.status(400).json({ message: "Algunos de los datos estan vacios." });
  }

  try {
    const company = await getCompanyById(companyId);

    const result = await shipmentDetails(company, shipmentId, userId);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = shipments;