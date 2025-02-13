const mysql = require('mysql');
const accounts = require('express').Router();
const verifyToken = require('../src/funciones/verifyToken');
const { getCompanyById, getDbConfig } = require('../db');

accounts.post('/account-list', verifyToken, async (req, res) => {
	const { companyId, profile, userId, deviceId, appVersion, brand, model, androidVersion } = req.body;

	if (!companyId || !profile || !userId || !deviceId || !appVersion || !brand || !model || !androidVersion) {
		return res.status(400).json({ body: null, message: 'Algunos de los datos estan vacios.' });
	}

	try {
		const company = await getCompanyById(companyId);

		const result = await accounts(username, password, company);

		res.status(200).json({ body: result, message: "Lista de cuentas obtenida correctamente" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	} finally {
		dbConnection.end();
	}
});

module.exports = accounts;