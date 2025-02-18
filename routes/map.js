import { Router } from 'express';
import { getCompanyById } from '../db.js';
import { handleRuta } from '../controller/mapsController/maps.js';


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

        const result = await geolocalize(company, userId);

        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});
map.post('/ruta', async (req, res) => {
    const { didEmpresa, didUser, perfil, demoraTotal, fechaOpe, distancia, dataRuta, ordenes } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!didEmpresa || !didUser || !perfil || !Array.isArray(ordenes) || ordenes.length === 0) {
        return res.status(400).json({ estadoRespuesta: false, mensaje: "Faltan datos requeridos." });
    }

    console.log("Did Empresa:", didEmpresa);
    console.log("Ordenes:", ordenes);

    // Obtener la compañía usando didEmpresa
    const company = await getCompanyById(didEmpresa); // Cambiado de idEmpresa a didEmpresa

    try {
        const response = await handleRuta({ didEmpresa, didUser, perfil, demoraTotal, fechaOpe, distancia, dataRuta, ordenes }, company);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ estadoRespuesta: false, body: "", mensaje: error.message });
    }
});



export default map;