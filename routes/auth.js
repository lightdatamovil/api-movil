const express = require('express');
const mysql = require('mysql');
const { buscarEmpresaById } = require('../db');
const verifyToken = require('../src/funciones/verifyToken');
const { loginUser, install } = require('../controller/authController/auth');

const auth = express.Router();

auth.post('/login', async (req, res) => {
    try {
        const { username, password, idEmpresa, idDispositivo, versionApp, marca, modelo, versionAndroid } = req.body;

        if (!username || !password) {
            return res.json({ estado: false, mensaje: "Algunos de los datos estan vac��os." });
        }

        const empresa = buscarEmpresaById(idEmpresa);

        const loginResult = await loginUser(username, password, empresa);

        // crearLog(idEmpresa, 0, "/api/login", loginResult, loginResult.body.id, idDispositivo, modelo, marca, versionAndroid, versionApp);

        res.json(loginResult);

    } catch (error) {
        console.error("Error en /api/login:", error);
        res.json({ status: false, error });
    }
});

auth.post('/install', async (req, res) => {
    const { codigoEmpresa, idDispositivo, versionApp, marca, modelo, versionAndroid } = req.body;
    const empresa = buscarEmpresaByCodigo(codigoEmpresa);

    const installResult = install(empresa);

    const { b64, ...installResultFiltered } = installResult;

    crearLog(installResultFiltered.id, 0, "/api/install", installResultFiltered, 0, idDispositivo, modelo, marca, versionAndroid, versionApp);
    res.json(installResult);

});

auth.post('/listadowsp', verifyToken, async (req, res) => {
    try {
        const { idEmpresa, userId, idDispositivo, modelo, marca, versionAndroid, versionApp } = req.body;

        const empresa = buscarEmpresaById(idEmpresa);

        if (!empresa) {
            return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: 'Empresa no encontrada' });
        }

        let dbConfig = {
            host: "bhsmysql1.lightdata.com.ar",
            user: empresa.dbuser,
            password: empresa.dbpass,
            database: empresa.dbname
        };

        const dbConnection = mysql.createConnection(dbConfig);

        await dbConnection.connect();

        const Atemp = [];

        const query = "SELECT texto FROM `mensajeria_app` WHERE superado=0 ORDER BY tipo ASC;";

        const results = await executeQuery(dbConnection, query, []);

        results.forEach(row => Atemp.push(row.texto));

        dbConnection.end();

        crearLog(idEmpresa, 0, "/api/listadowsp", { estadoRespuesta: true, body: Atemp, mensaje: "Mensajes tra��dos correctamente" }, userId, idDispositivo, modelo, marca, versionAndroid, versionApp);
        res.status(200).json({
            estadoRespuesta: true,
            body: Atemp,
            mensaje: "Mensajes tra��dos correctamente"
        });

    } catch (e) {
        res.status(500).json({
            estadoRespuesta: false,
            body: null,
            mensaje: `Algo fall��... ${e}`
        });
    }
});
module.exports = auth;