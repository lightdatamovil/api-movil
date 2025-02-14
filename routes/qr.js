const { getCompanyById } = require('../db');

const verifyToken = require('../src/funciones/verifyToken');
const crossDocking = require('../controller/qrController/qr');
const qr = require('express').Router();

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

qr.post('/drivers-list', verifyToken, async (req, res) => {

    const { companyId, profile, userId, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !profile || !userId || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const result = await driversList(company);

        // crearLog(companyId, 0, "/api/listadochoferes", { estadoRespuesta: true, body: Atemp, mensaje: "" }, userId, idDispositivo, modelo, marca, versionAndroid, versionApp);

        res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = qr;