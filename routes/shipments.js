import { Router } from "express";
import { nextDeliver } from "../controller/shipments/next_deliver.js";
import { shipmentDetails } from "../controller/shipments/get_shipment_details.js";
import { shipmentList } from "../controller/shipments/get_shipment_list.js";
import { crearLog } from "../src/funciones/crear_log.js";
import { errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from "lightdata-tools";
import { companiesService, jwtSecret } from "../db.js";
import mysql2 from "mysql2";

const shipments = Router();

shipments.post("/shipment-list", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: ["from", "shipmentStates", "isAssignedToday"], optional: [] });

    const { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company);
    dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    const result = await shipmentList(dbConnection, req, company);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

shipments.post("/shipment-details", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: ['shipmentId'], optional: [] });

    const { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company);
    dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    const result = await shipmentDetails(dbConnection, req);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

shipments.post("/next-visit", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: ['shipmentId'], optional: [] });

    const { companyId, userId, shipmentId } = req.body;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company);
    dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    const result = await nextDeliver(company, shipmentId, userId);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

export default shipments;
