import { Router } from 'express';
import { getSettlementList } from '../controller/settlements/get_settlement_list.js';
import { getSettlementDetails } from '../controller/settlements/get_settlement_details.js';
import { getSettlementShipmentDetails } from '../controller/settlements/get_settlement_shipment_details.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { connectMySQL, errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from 'lightdata-tools';
import { hostProductionDb, portProductionDb, companiesService, jwtSecret } from '../db.js';

const settlements = Router();

settlements.post('/settlement-list', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['from', 'to'], optional: [] });

        const { companyId } = req.body;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = await connectMySQL(dbConfig);

        const result = await getSettlementList(dbConnection, req);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

settlements.post('/settlement-details', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['settlementId'], optional: [] });

        const { companyId } = req.body;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = await connectMySQL(dbConfig);

        const result = await getSettlementDetails(dbConnection, req, company);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

settlements.post('/settlement-shipment-details', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: [], optional: [] });

        const { companyId, userId } = req.body;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = await connectMySQL(dbConfig);

        const result = await getSettlementShipmentDetails(company, userId);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

export default settlements;
