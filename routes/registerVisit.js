import { Router } from 'express';
import { registerVisit } from '../controller/register_visit/register_visit.js';
import { uploadImage } from '../controller/register_visit/upload_image.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { hostProductionDb, portProductionDb, companiesService, jwtSecret } from '../db.js';
import { errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from 'lightdata-tools';
import mysql2 from 'mysql2';

const registerVisitRoute = Router();

registerVisitRoute.post('/register', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], {
            required: [
                'shipmentId',
                'shipmentState',
                'observation',
                'latitude',
                'longitude',
                'recieverName',
                'recieverDNI',
            ], optional: []
        });

        const { companyId } = req.body;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();

        const result = await registerVisit(dbConnection, req, company);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

registerVisitRoute.post('/upload-image', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], {
            required: [
                'shipmentId',
                'shipmentState',
                'image',
                'lineId'
            ], optional: []
        });

        const { companyId } = req.body;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();

        const result = await uploadImage(dbConnection, req, company);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

export default registerVisitRoute;
