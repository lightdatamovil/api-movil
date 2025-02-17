import { Router } from 'express';
import { getCompanyById } from '../db.js';
import { getRoutaByUserId, geolocalize } from '../controller/mapsController/maps.js';

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

export default map;