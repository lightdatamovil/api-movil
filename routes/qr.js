import { getCompanyById } from '../db.js';
import verifyToken from '../src/funciones/verifyToken.js';
import express from 'express';
import { getShipmentIdFromQr, crossDocking, driverList, detalleML } from "../controller/qrController/qr.js";

const qr = express.Router();

qr.post('/cross-docking', async (req, res) => {
    const { companyId, profile, userId, dataQr, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !profile || !userId || !dataQr || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const response = await crossDocking(dataQr, company);

        res.status(200).json({ body: response, message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

qr.post('/get-shipment-id', async (req, res) => {
    const { dataQr, companyId, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!dataQr || !companyId || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const response = await getShipmentIdFromQr(dataQr, company);

        res.status(200).json({ body: response, message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

qr.post('/driver-list', verifyToken, async (req, res) => {

    const { companyId, profile, userId, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !profile || !userId || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const result = await driverList(company);

        // crearLog(companyId, 0, "/api/listadochoferes", { estadoRespuesta: true, body: Atemp, mensaje: "" }, userId, idDispositivo, modelo, marca, versionAndroid, versionApp);

        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
qr.post('/detalle', async (req, res) => {
    try {
        const dataQR = req.body.dataqr || req.body.data; // Validar los campos
        if (!dataQR) {
            return res.status(400).json({ estado: false, mensaje: "Falta el campo 'dataqr' o 'data'." });
        }

        const response = await detalleML(dataQR);
        return res.json(response);
    } catch (error) {
        console.error("Error en la ruta /detalle:", error);
        return res.status(500).json({ estado: false, mensaje: "Error interno del servidor." });
    }
});

export default qr