import { Router } from 'express';
import { identification } from '../controller/auth/identification.js';
import { login } from '../controller/auth/login.js';
import { whatsappMessagesList } from '../controller/auth/whatsappMessagesList.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from 'lightdata-tools';
import mysql2 from 'mysql2';
import { companiesService, jwtSecret } from '../db.js';

const auth = Router();

auth.post('/company-identification', async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['companyCode'], optional: [] });

        const { companyCode } = req.body;
        const company = await companiesService.getByCode(companyCode);

        const dbConfig = getProductionDbConfig(company);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();

        const result = await identification(dbConnection, company);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json();
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

auth.post('/login', async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['username', 'password'], optional: [] });

        const { companyId } = req.user;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();

        const result = await login(dbConnection, req);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

auth.get('/whatsapp-message-list', verifyToken(jwtSecret), async (req, res) => {
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

        const result = await whatsappMessagesList(dbConnection);
        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

export default auth;
