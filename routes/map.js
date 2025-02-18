import { Router } from 'express';
import { getCompanyById } from '../db.js';
import { getRoutaByUserId, geolocalize, saveRoute } from '../controller/mapsController/maps.js';

const map = Router();
map.post('/get-route-by-user', async (req, res) => {
    const { companyId, profile, userId, deviceId, model, brand, androidVersion, appVersion } = req.body;

    if (!companyId || !profile || !userId || !deviceId || !model || !brand || !androidVersion || !appVersion) {
        return res.status(400).json({ message: 'Faltan datos' });
    }

    try {
        const company = await getCompanyById(companyId);

        const result = await getRoutaByUserId(company, userId);

        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

map.post('/geolocalize', async (req, res) => {
    const { companyId, profile, userId, shipmentId, latitude, longitude, deviceId, model, brand, androidVersion, appVersion } = req.body;

    if (!companyId || !profile || !userId || !deviceId || !model || !brand || !androidVersion || !appVersion) {
        return res.status(400).json({ message: 'Faltan datos' });
    }

    try {
        const company = await getCompanyById(companyId);

        await geolocalize(company, userId);

        res.status(200).json({ message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});
map.post('/save-route', async (req, res) => {
    const { companyId, userId, profile, totalDelay, operationDate, distance, additionalRouteData, orders } = req.body;

    if (!companyId || !userId || !profile || !orders || orders.length == 0 || !operationDate || totalDelay === null || totalDelay === undefined ||
        operationDate === null || operationDate === undefined || !additionalRouteData) {
        return res.status(400).json({ message: "Faltan datos requeridos u ordenes esta vacia." });
    }

    try {
        const company = await getCompanyById(companyId);

        const response = await saveRoute(company, operationDate, orders, userId, distance, totalDelay, additionalRouteData);

        res.status(200).json({ body: response, message: "Ruta guardada correctamente." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default map;