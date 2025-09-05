import { Router } from 'express';
import { companiesService, jwtSecret } from '../db.js';
import { accountList } from '../controller/accounts/accountList.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from 'lightdata-tools';
import mysql2 from 'mysql2';

const accounts = Router();

accounts.get('/account-list', verifyToken(jwtSecret), async (req, res) => {
	const startTime = performance.now();

	let dbConnection;

	try {
		verifyHeaders(req, []);
		verifyAll(req, [], { required: [], optional: [] });

		const { companyId } = req.user;
		const company = await companiesService.getById(companyId);

		const dbConfig = getProductionDbConfig(company);
		dbConnection = mysql2.createConnection(dbConfig);
		dbConnection.connect();

		const result = await accountList(dbConnection, req);

		crearLog(req, startTime, JSON.stringify(result), true);
		res.status(Status.ok).json(result);
	} catch (error) {
		crearLog(req, startTime, JSON.stringify(error), false);
		errorHandler(req, res, error);
	} finally {
		if (dbConnection) dbConnection.end();
	}
});

export default accounts;
