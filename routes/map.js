import { Router } from 'express';
import { getRouteByUserId } from '../controller/maps/get_route.js';
import { geolocalize } from '../controller/maps/geolocalize.js';
import { saveRoute } from '../controller/maps/save_route.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { hostProductionDb, portProductionDb, companiesService, jwtSecret } from '../db.js';
import { connectMySQL, errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from 'lightdata-tools';

const map = Router();

map.post('/get-route-by-user', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: [], optional: [] });

        const { companyId } = req.body;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = await connectMySQL(dbConfig);

        const result = await getRouteByUserId(dbConnection, req, company);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

map.post('/geolocalize', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['shipmentId', 'latitude', 'longitude'], optional: [] });

        const { companyId, shipmentId, latitude, longitude } = req.body;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = await connectMySQL(dbConfig);

        const result = await geolocalize(company, shipmentId, latitude, longitude);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

map.post('/save-route', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['orders', 'distance', 'totalDelay', 'additionalRouteData'], optional: [] });

        const { companyId } = req.body;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = await connectMySQL(dbConfig);

        const result = await saveRoute(dbConnection, req, company);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

export default map;
