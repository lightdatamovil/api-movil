import { getCompanyById } from '../db.js';
import verifyToken from '../src/funciones/verifyToken.js';
import express from 'express';
import { getShipmentIdFromQr, crossDocking, driverList, enterFlex, getProductsFromShipment } from "../controller/qrController.js";
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logPurple, logRed } from '../src/funciones/logsCustom.js';

const qr = express.Router();

qr.post('/driver-list', verifyToken, async (req, res) => {
    const startTime = performance.now();
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
        logRed(`Error en la ruta /listadochoferes: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

qr.post('/cross-docking', async (req, res) => {
    const startTime = performance.now();
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
        logRed(`Error en la ruta /cross-docking: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

qr.post('/get-shipment-id', async (req, res) => {
    const startTime = performance.now();
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
        logRed(`Error en la ruta /get-shipment-id: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

qr.post('/products-from-shipment', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['dataQr'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { dataQr } = req.body;

    try {
        const response = await getProductsFromShipment(JSON.parse(dataQr));

        return res.json(response);
    } catch (error) {
        logRed(`Error en la ruta /detalle: ${error.stack}`);
        res.status(500).json({ success: false, message: "Error interno del servidor." });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

qr.post('/enter-flex', verifyToken, async (req, res) => {
    const startTime = performance.now();
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
        logRed(`Error en la ruta /enter-flex: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default qr