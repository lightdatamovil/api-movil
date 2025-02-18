import express from 'express';
import { getCompanyById } from '../db.js';
import { getSettlementList, getSettlementDetails, getSettlementShipmentDetails } from '../controller/settlementController/setttlement.js';

const settlements = express.Router();

settlements.post('/settlement-list', async (req, res) => {
    const { companyId, profile, userId, from, to, deviceId, model, brand, androidVersion, appVersion } = req.body;

    if (!companyId || !profile || !userId || !from || !to || !deviceId || !model || !brand || !androidVersion || !appVersion) {
        return res.status(400).json({ message: 'Faltan datos' });
    }

    try {
        const company = await getCompanyById(companyId);

        const settlementList = await getSettlementList(company, userId, from, to);

        res.status(200).json({ body: settlementList, message: "Datos obtenidos correctamente" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

settlements.post('/settlement-details', async (req, res) => {
    const { companyId, profile, userId, settlementId, deviceId, model, brand, androidVersion, appVersion } = req.body;

    if (!companyId || !profile || !userId || !deviceId || !model || !brand || !androidVersion || !appVersion) {
        return res.status(400).json({ message: 'Faltan datos' });
    }

    try {
        const company = await getCompanyById(companyId);

        const setllementDetails = await getSettlementDetails(company, settlementId);

        res.status(200).json({ body: setllementDetails, message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

settlements.post('/settlement-shipment-details', async (req, res) => {
    const { companyId, profile, userId, shipmentId, deviceId, model, brand, androidVersion, appVersion } = req.body;

    if (!companyId || !profile || !userId || !shipmentId || !deviceId || !model || !brand || !androidVersion || !appVersion) {
        return res.status(400).json({ message: 'Faltan datos' });
    }

    try {
        const company = await getCompanyById(companyId);

        const result = await getSettlementShipmentDetails(company, userId);

        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default settlements;