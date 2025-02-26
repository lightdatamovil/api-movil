import { getCompanyById } from '../db.js';
import verifyToken from '../src/funciones/verifyToken.js';
import express from 'express';
import { getShipmentIdFromQr, crossDocking, driverList, enterFlex, getProductsFromShipment } from "../controller/qrController/qr.js";
import { verifyParamaters } from '../src/funciones/verifyParameters.js';

const qr = express.Router();

qr.post('/driver-list', verifyToken, async (req, res) => {

    const mensajeError = verifyParamaters(req.body, [], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await driverList(company);

        // crearLog(companyId, 0, "/api/listadochoferes", { estadoRespuesta: true, body: Atemp, mensaje: "" }, userId, idDispositivo, modelo, marca, versionAndroid, versionApp);

        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

qr.post('/cross-docking', async (req, res) => {
    const mensajeError = verifyParamaters(req.body, ['dataQr'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, dataQr } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const response = await crossDocking(dataQr, company);

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

qr.post('/get-shipment-id', async (req, res) => {
    const mensajeError = verifyParamaters(req.body, ['dataQr'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, dataQr } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const response = await getShipmentIdFromQr(JSON.parse(dataQr), company);

        res.status(200).json({ success: true, body: response, message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

qr.post('/products-from-shipment', async (req, res) => {

    const mensajeError = verifyParamaters(req.body, ['dataQr'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, dataQr } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const response = await getProductsFromShipment(company, dataQr);

        return res.json(response);
    } catch (error) {
        console.error("Error en la ruta /detalle:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
});

qr.post('/enter-flex', verifyToken, async (req, res) => {

    const mensajeError = verifyParamaters(req.body, ['dataQr'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, dataQr } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await enterFlex(company, dataQr, userId);

        // crearLog(companyId, 0, "/api/listadochoferes", { estadoRespuesta: true, body: Atemp, mensaje: "" }, userId, idDispositivo, modelo, marca, versionAndroid, versionApp);

        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default qr