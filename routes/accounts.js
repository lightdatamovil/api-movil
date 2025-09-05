import { Router } from 'express';
import { companiesService, hostProductionDb, jwtSecret, portProductionDb } from '../db.js';
import { accountList } from '../controller/accounts/accountList.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { connectMySQL, errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from 'lightdata-tools';

const accounts = Router();

accounts.get('/account-list', verifyToken(jwtSecret), async (req, res) => {
	const startTime = performance.now();

	let dbConnection;

	try {
		verifyHeaders(req, []);
		verifyAll(req, [], { required: [], optional: [] });

		const { companyId } = req.user;
		const company = await companiesService.getById(companyId);

		const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
		dbConnection = await connectMySQL(dbConfig);

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
