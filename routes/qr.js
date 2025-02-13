const { getCompanyById, getDbConfig } = require('../db');

const mysql = require('mysql');
const verifyToken = require('../src/funciones/verifyToken');

const qr = require('express').Router();
qr.post('/crossdocking', verifyToken, async (req, res) => {

    const { didEmpresa, perfil, quien, dataqr } = req.body;
    var idEmpresa = didEmpresa;

    const Adataqr = JSON.parse(dataqr);

    var Aclientescompany = AclientesXEmpresa[idEmpresa];
    var Ausuarioscompany = AusuariosXEmpresa[idEmpresa];
    var Azonascompany = AzonasXEmpresa[idEmpresa];

    try {
        const company = getCompanyById(idEmpresa);
        if (!company) {
            return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: 'Empresa no encontrada' });
        }

        var dataEnvio = new Object();
        var didenvio = 0;

        let dbConfig = getDbConfig(company);
        const dbConnection = mysql.createConnection(dbConfig);

        dbConnection.connect();

        var sqldidenvio = "";

        if (Adataqr.hasOwnProperty('sender_id')) {

            sqldidenvio = " AND ml_shipment_id = '" + Adataqr.id + "' AND ml_vendedor_id = '" + Adataqr.sender_id + "'";
            didenvio = 77;
        } else {
            sqldidenvio = " and did = " + Adataqr.did;
            didenvio = 77;
        }

        if (didenvio > 0) {
            var queryE = "SELECT e.estado_envio, e.didCliente, e.choferAsignado, e.didEnvioZona ,date_format(e.fecha_inicio, '%d/%m/%Y') as fecha  FROM envios as e WHERE e.elim=0 and e.superado=0 " + sqldidenvio;

            const results = await executeQuery(dbConnection, queryE, []);
            var datatemp = results[0];

            dataEnvio["Fecha"] = datatemp.fecha;
            dataEnvio["zonaNombre"] = busxarzona(datatemp.didEnvioZona, Azonascompany);
            dataEnvio["Chofer"] = buscarusuario(datatemp.choferAsignado, Ausuarioscompany);
            dataEnvio["Cliente"] = buscarcliente(datatemp.didCliente, Aclientescompany);
            dataEnvio["estado"] = datatemp.estado_envio * 1;

            dbConnection.end();
            res.status(200).json({ estadoRespuesta: true, body: dataEnvio, mensaje: "" });
        } else {
            dbConnection.end();
            res.status(200).json({ estadoRespuesta: false, body: "", mensaje: "No esta cargado el envio en el sistema" });
        }

    } catch (error) {
        res.status(500).json({ estadoRespuesta: false, body: "", mensaje: 'Error interno del servidor' });
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

module.exports = qr;