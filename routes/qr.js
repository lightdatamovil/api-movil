import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import {
    getShipmentIdFromQrLocal,
    crossDocking,
    driverList,
    getSkuAndNumberOfItems,
    getProductsFromShipment,
    enterFlex
} from "../controller/qrController.js";
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logGreen, logPurple, logRed } from '../src/funciones/logsCustom.js';
import CustomException from '../clases/custom_exception.js';

const qr = Router();

qr.post('/driver-list', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, ['companyId'], true);
        if (mensajeError) {
            logRed(`Error en driver-list: ${mensajeError}`);
            throw new CustomException({ title: 'Error en driver-list', message: mensajeError });
        }

        const { companyId } = req.body;
        const company = await getCompanyById(companyId);
        const result = await driverList(company);

        logGreen(`Listado de choferes obtenido correctamente`);
        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en driver-list: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en driver-list: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución driver-list: ${endTime - startTime} ms`);
    }
});

qr.post('/cross-docking', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, ['companyId', 'dataQr'], true);
        if (mensajeError) {
            logRed(`Error en cross-docking: ${mensajeError}`);
            throw new CustomException({ title: 'Error en cross-docking', message: mensajeError });
        }

        const { companyId, dataQr } = req.body;
        const company = await getCompanyById(companyId);
        const response = await crossDocking(dataQr, company);

        logGreen(`Cross-docking completado correctamente`);
        res.status(200).json({ body: response, message: "Datos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en cross-docking: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en cross-docking: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución cross-docking: ${endTime - startTime} ms`);
    }
});

qr.post('/get-shipment-id', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, ['companyId', 'dataQr'], true);
        if (mensajeError) {
            logRed(`Error en get-shipment-id: ${mensajeError}`);
            throw new CustomException({ title: 'Error en get-shipment-id', message: mensajeError });
        }

        const { companyId, dataQr } = req.body;
        const company = await getCompanyById(companyId);
        const response = await getShipmentIdFromQrLocal(dataQr, company);

        logGreen(`ID de envío obtenido correctamente`);
        res.status(200).json({ success: true, body: response, message: "Datos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en get-shipment-id: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en get-shipment-id: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución get-shipment-id: ${endTime - startTime} ms`);
    }
});

qr.post('/products-from-shipment', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, ['dataQr'], true);
        if (mensajeError) {
            logRed(`Error en products-from-shipment: ${mensajeError}`);
            throw new CustomException({ title: 'Error en products-from-shipment', message: mensajeError });
        }

        const { dataQr } = req.body;
        const parsed = JSON.parse(dataQr);
        const response = await getProductsFromShipment(parsed);

        logGreen(`Productos obtenidos correctamente`);
        res.status(200).json({ body: response, message: "Datos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en products-from-shipment: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en products-from-shipment: ${error}`);
            res.status(500).json({ success: false, message: 'Error interno del servidor.' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución products-from-shipment: ${endTime - startTime} ms`);
    }
});

qr.post('/enter-flex', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, ['companyId', 'userId', 'dataQr'], true);
        if (mensajeError) {
            logRed(`Error en enter-flex: ${mensajeError}`);
            throw new CustomException({ title: 'Error en enter-flex', message: mensajeError });
        }

        const { companyId, userId, dataQr } = req.body;
        const company = await getCompanyById(companyId);
        const result = await enterFlex(company, dataQr, userId);

        logGreen(`Enter flex ejecutado correctamente`);
        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en enter-flex: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en enter-flex: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución enter-flex: ${endTime - startTime} ms`);
    }
});

qr.post('/sku', verifyToken, async (req, res) => {
    const startTime = performance.now();
    try {
        const mensajeError = verifyParamaters(req.body, ['companyId', 'dataQr'], true);
        if (mensajeError) {
            logRed(`Error en sku: ${mensajeError}`);
            throw new CustomException({ title: 'Error en sku', message: mensajeError });
        }

        const { companyId, dataQr } = req.body;
        const company = await getCompanyById(companyId);
        const result = await getSkuAndNumberOfItems(company, dataQr);

        logGreen(`SKU y cantidad de ítems obtenidos correctamente`);
        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en sku: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en sku: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución sku: ${endTime - startTime} ms`);
    }
});

export default qr;
