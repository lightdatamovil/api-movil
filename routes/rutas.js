
const mysql = require('mysql');
const rutas = require('express').Router();
const verifyToken = require('../src/funciones/verifyToken');
const { buscarEmpresaById } = require('../db');

rutas.post('/comenzarruta', verifyToken, async (req, res) => {
	const { didEmpresa, perfil, didUser } = req.body;
	const empresa = buscarEmpresaById(didEmpresa);
	if (!empresa) {
		return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: 'Empresa no encontrada' });
	} else {

		let dbConfig = {
			host: "149.56.182.49",
			user: "ue" + empresa.id,
			password: "78451296",
			database: "e" + empresa.id,
			port: 44339
		};

		const dbConnection = mysql.createConnection(dbConfig);
		dbConnection.connect();

	}
});

rutas.post('/terminarruta', verifyToken, async (req, res) => {
	const { didEmpresa, perfil, didUser } = req.body;
	const empresa = buscarEmpresaById(didEmpresa);
	if (!empresa) {
		return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: 'Empresa no encontrada' });
	} else {

	}
});
rutas.post('/verificarrutacomenzada', verifyToken, async (req, res) => {
	const { didEmpresa, perfil, didUser, idDispositivo, modelo, marca, versionAndroid, versionApp } = req.body;
	try {
		const empresa = buscarEmpresaById(didEmpresa);
		if (!empresa) {
			return res.status(400).json({ estadoRespuesta: false, body: {}, mensaje: 'Empresa no encontrada' });
		} else {

			let dbConfig = {
				host: "149.56.182.49",
				user: "ue" + empresa.id,
				password: "78451296",
				database: "e" + empresa.id,
				port: 44339
			};

			const dbConnection = mysql.createConnection(dbConfig);
			dbConnection.connect();

			const sql = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ${didUser} AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

			dbConnection.query(sql, (err, results) => {
				if (err) {
					res.status(200).json({ estadoRespuesta: false, body: {}, mensaje: "" });
					console.error('Error al ejecutar la consulta: ' + err.stack);
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