import { Router } from 'express';
import { saveRoute } from '../controller/collect/save_route.js';
import { getRoute } from '../controller/collect/get_route.js';
import { startCollectRoute } from '../controller/collect/start_route.js';
import { getCollectDetails } from '../controller/collect/get_collect_details.js';
import { shipmentsFromClient } from '../controller/collect/get_shipments_from_client.js';
import { getCollectList } from '../controller/collect/get_collect_list.js';
import { getSettlementList } from '../controller/settlements/get_settlement_list.js';
import { getSettlementDetails } from '../controller/settlements/get_settlement_details.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { companiesService, jwtSecret } from '../db.js';
import { errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from 'lightdata-tools';
import mysql2 from 'mysql2';

const collect = Router();

collect.get("/get-route", verifyToken(jwtSecret), async (req, res) => {
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

        const result = await getRoute(dbConnection, req, company);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

collect.post("/start-route", verifyToken(jwtSecret), async (req, res) => {
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

        const result = await startCollectRoute(dbConnection);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

collect.post("/save-route", verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], {
            required: [
                'companyId',
                'userId',
                'operationDate',
                'additionalRouteData',
                'orders'
            ], optional: []
        });


        const { companyId } = req.body;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();

        const result = await saveRoute(dbConnection, req, company);

        crearLog(req, startTime, JSON.stringify(result), false);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

collect.get("/get-collect-details", verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    const { companyId, userId, profile } = req.body;
    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: [], optional: [] });

        const company = await companiesService.getById(companyId);
        const dbConfig = getProductionDbConfig(company);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();
        const result = await getCollectDetails(company, userId, profile);

        crearLog(req, startTime, JSON.stringify(result), false);
        res.status(Status.ok).json({ body: collectDetails, message: "Colecta obtenida correctamente" });
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

collect.get("/get-client-details", verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    const { companyId, userId, profile, clientId } = req.body;
    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['clientId'], optional: [] });

        const company = await companiesService.getById(companyId);
        const dbConfig = getProductionDbConfig(company);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();
        const result = await shipmentsFromClient(company, clientId);

        crearLog(req, startTime, JSON.stringify(result), false);
        res.status(Status.ok).json({ body: shipments, message: "Envíos obtenidos correctamente" });
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

collect.get("/get-collect-list", verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    const { companyId, userId, profile, from, to } = req.body;
    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['from', 'to'], optional: [] });

        const company = await companiesService.getById(companyId);
        const dbConfig = getProductionDbConfig(company);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();
        const result = await getCollectList(company, userId, from, to);

        crearLog(req, startTime, JSON.stringify(result), false);
        res.status(Status.ok).json({ body: list, message: "Listado de colectas obtenido correctamente" });
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

collect.get("/get-settlement-list", verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    const { companyId, userId, profile, from, to } = req.body;
    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['from', 'to'], optional: [] });

        const company = await companiesService.getById(companyId);
        const dbConfig = getProductionDbConfig(company);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();
        const result = await getSettlementList(company, from, to);

        crearLog(req, startTime, JSON.stringify(result), false);
        res.status(Status.ok).json({ body: settlements, message: "Listado de liquidaciones obtenido correctamente" });
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

collect.get("/get-settlement-details", verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    const { companyId, userId, profile, settlementId } = req.body;
    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['settlementId'], optional: [] });

        const company = await companiesService.getById(companyId);
        const dbConfig = getProductionDbConfig(company);
        dbConnection = mysql2.createConnection(dbConfig);
        dbConnection.connect();
        const result = await getSettlementDetails(company, settlementId);

        crearLog(req, startTime, JSON.stringify(result), false);
        res.status(Status.ok).json({ body: details, message: "Detalle de liquidación obtenido correctamente" });
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

export default collect;
