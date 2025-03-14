import express from 'express';
import { getCompanyById } from '../db.js';
import { getSettlementList, getSettlementDetails, getSettlementShipmentDetails } from '../controller/settlementController.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logRed } from '../src/funciones/logsCustom.js';

const settlements = express.Router();

settlements.post('/settlement-list', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['from', 'to'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, from, to } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const settlementList = await getSettlementList(company, userId, from, to);

        res.status(200).json({ body: settlementList, message: "Datos obtenidos correctamente" });
    } catch (error) {
        logRed(`Error en settlement-list: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

settlements.post('/settlement-details', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['settlementId'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, settlementId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const setllementDetails = await getSettlementDetails(company, settlementId);

        res.status(200).json({ body: setllementDetails, message: "Datos obtenidos correctamente" });
    } catch (error) {
        logRed(`Error en settlement-details: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

settlements.post('/settlement-shipment-details', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, [], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }
    const { companyId, userId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await getSettlementShipmentDetails(company, userId);

        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        logRed(`Error en settlement-shipment-details: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default settlements;