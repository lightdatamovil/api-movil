import { Router } from "express";
import { verifyStartedRoute } from "../controller/home/verify_started_route.js";
import { startRoute } from "../controller/home/start_route.js";
import { finishRoute } from "../controller/home/finish_route.js";
import { getHomeData } from "../controller/home/get_home_data.js";
import { crearLog } from "../src/funciones/crear_log.js";
import { hostProductionDb, portProductionDb, companiesService, jwtSecret } from "../db.js";
import { connectMySQL, errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from "lightdata-tools";

const home = Router();

home.post("/home", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: [], optional: [] });

    const { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await getHomeData(dbConnection, req);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

home.post("/start-route", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: [], optional: [] });

    const { companyId, userId, deviceFrom } = req.body;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await startRoute(company, userId, deviceFrom);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

home.post("/end-route", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: [], optional: [] });

    const { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await finishRoute(dbConnection, req);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

home.post("/verify-started-route", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: [], optional: [] });

    const { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await verifyStartedRoute(dbConnection, req);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

export default home;
