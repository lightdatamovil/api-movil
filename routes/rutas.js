
const mysql = require('mysql');
const rutas = require('express').Router();
const verifyToken = require('../src/funciones/verifyToken');
const { getCompanyById } = require('../db');

rutas.post('/comenzarruta', verifyToken, async (req, res) => {
	const { didEmpresa, perfil, didUser } = req.body;
	const company = getCompanyById(didEmpresa);
	if (!company) {
		return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: 'Empresa no encontrada' });
	} else {

		let dbConfig = getDbConfig(company);

		const dbConnection = mysql.createConnection(dbConfig);
		dbConnection.connect();

	}
});

rutas.post('/terminarruta', verifyToken, async (req, res) => {
	const { didEmpresa, perfil, didUser } = req.body;
	const company = getCompanyById(didEmpresa);
	if (!company) {
		return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: 'Empresa no encontrada' });
	} else {

	}
});
rutas.post('/verificarrutacomenzada', verifyToken, async (req, res) => {
	const { didEmpresa, perfil, didUser, idDispositivo, modelo, marca, versionAndroid, versionApp } = req.body;
	try {
		const company = getCompanyById(didEmpresa);
		if (!company) {
			return res.status(400).json({ estadoRespuesta: false, body: {}, mensaje: 'Empresa no encontrada' });
		} else {

			let dbConfig = getDbConfig(company);

			const dbConnection = mysql.createConnection(dbConfig);
			dbConnection.connect();

			const sql = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ${didUser} AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

			dbConnection.query(sql, (err, results) => {
				if (err) {
					res.status(200).json({ estadoRespuesta: false, body: {}, mensaje: "" });
					return;
				}

				let esta = false;
				if (results.length > 0) {
					esta2 = results[0].tipo;
					if (esta2 == 0) {
						esta = true;
					}
				}
				dbConnection.end();
				crearLog(didEmpresa, 0, "/api/verificarrutacomenzada", esta, didUser, idDispositivo, modelo, marca, versionAndroid, versionApp);
				res.status(200).json({ estadoRespuesta: true, body: esta, mensaje: "" });

			});
		}
	} catch (e) {
		res.status(400).json({ estadoRespuesta: true, body: {}, mensaje: e });
	}
});

module.exports = rutas;