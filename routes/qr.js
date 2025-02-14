const { getCompanyById, getDbConfig } = require('../db');

const mysql = require('mysql');
const verifyToken = require('../src/funciones/verifyToken');
const crossDocking = require('../controller/qrController/qr');
const qr = require('express').Router();
const {getPackageIdFromQr}=require("../controller/qrController/qr")

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

qr.post('/listadochoferes', verifyToken, async (req, res) => {

    const { idEmpresa, perfil, diduser, idDispositivo, modelo, marca, versionAndroid, versionApp } = req.body;
    const company = getCompanyById(idEmpresa);
    if (!company) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: 'Empresa no encontrada' });
    } else {
        let dbConfig = getDbConfig(company);
        const dbConnection = mysql.createConnection(dbConfig);
        dbConnection.connect();
        var Atemp = [];

        let query = "SELECT u.did, concat( u.nombre,' ', u.apellido) as nombre FROM `sistema_usuarios` as u JOIN sistema_usuarios_accesos as a on ( a.elim=0 and a.superado=0 and a.usuario = u.did) where u.elim=0 and u.superado=0 and a.perfil=3 ORDER BY nombre ASC";
        const results = await executeQuery(dbConnection, query, []);
        for (i = 0; i < results.length; i++) {
            var row = results[i];
            var objetoJSON = {
                "id": row.did,
                "nombre": row.nombre
            }
            Atemp.push(objetoJSON);
        }

        dbConnection.end();
        crearLog(idEmpresa, 0, "/api/listadochoferes", { estadoRespuesta: true, body: Atemp, mensaje: "" }, diduser, idDispositivo, modelo, marca, versionAndroid, versionApp);
        res.status(200).json({ estadoRespuesta: true, body: Atemp, mensaje: "" });
    }
});

qr.post('/get-package-id', async (req, res) => {
    const { dataQr, didEmpresa } = req.body;
    if (!dataQr || !didEmpresa) {
        return res.status(400).json({ message: "Faltan datos" });
    }
    try {
        const response = await getPackageIdFromQr(dataQr, didEmpresa);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports= qr