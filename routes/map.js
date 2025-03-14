import { Router } from 'express';
import { getCompanyById } from '../db.js';
import { getRoutaByUserId, geolocalize, saveRoute } from '../controller/mapsController.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logPurple, logRed } from '../src/funciones/logsCustom.js';

const map = Router();

map.post('/get-route-by-user', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, [], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await getRoutaByUserId(company, userId);

        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        logRed(`Error en get-route-by-user: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

map.post('/geolocalize', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['shipmentId', 'latitude', 'longitude'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }
    const { companyId, shipmentId, latitude, longitude } = req.body;

    try {
        const company = await getCompanyById(companyId);

        await geolocalize(company, shipmentId, latitude, longitude);

        res.status(200).json({ message: "Datos obtenidos correctamente" });
    } catch (error) {
        logRed(`Error en geolocalize: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }

});
map.post('/save-route', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['totalDelay', 'operationDate', 'distance', 'additionalRouteData', 'orders'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, totalDelay, operationDate, distance, additionalRouteData, orders } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const response = await saveRoute(company, userId, operationDate, orders, distance, totalDelay, additionalRouteData);

        res.status(200).json({ body: response, message: "Ruta guardada correctamente." });
    } catch (error) {
        logRed(`Error en save-route: ${error.message}`);
        res.status(500).json({ message: error.message });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default map;