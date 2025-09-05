import { Router } from "express";
import { getShipmentIdFromQr } from "../controller/qr/get_shipment_id.js";
import { getProductsFromShipment } from "../controller/qr/get_products.js";
import { enterFlex } from "../controller/qr/enter_flex.js";
import { driverList } from "../controller/qr/get_driver_list.js";
import { crossDocking } from "../controller/qr/cross_docking.js";
import { crearLog } from "../src/funciones/crear_log.js";
import { getCantidadAsignaciones } from "../controller/qr/get_cantidad_asignaciones.js";
import { altaEnvioFoto } from "../controller/qr/envio_foto.js";
import { hostProductionDb, portProductionDb, companiesService, jwtSecret } from "../db.js";
import { connectMySQL, errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from "lightdata-tools";

const qr = Router();

qr.post("/driver-list", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: [], optional: [] });

    const { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await driverList(dbConnection);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

qr.post("/cross-docking", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: ['dataQr'], optional: [] });

    let { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await crossDocking(dbConnection, req, company);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

qr.post("/get-shipment-id", async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: ['dataQr'], optional: [] });

    let { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await getShipmentIdFromQr(dbConnection, req, company);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

qr.post("/products-from-shipment", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: ['dataQr'], optional: [] });

    let { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await getProductsFromShipment(dbConnection, req);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

qr.post("/enter-flex", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: ['dataQr'], optional: [] });

    const { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await enterFlex(dbConnection, req, company);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

qr.post("/cantidad-asignaciones", verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: [], optional: [] });

    const { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await getCantidadAsignaciones(dbConnection, req);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.ok).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});


qr.post('/alta-envio-foto', verifyToken(jwtSecret), async (req, res) => {
  const startTime = performance.now();

  let dbConnection;

  try {
    verifyHeaders(req, []);
    verifyAll(req, [], { required: ['image', 'driverId'], optional: [] });

    const { companyId } = req.user;
    const company = await companiesService.getById(companyId);

    const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
    dbConnection = await connectMySQL(dbConfig);

    const result = await altaEnvioFoto(company, req);

    crearLog(req, startTime, JSON.stringify(result), true);
    res.status(Status.created).json(result);
  } catch (error) {
    crearLog(req, startTime, JSON.stringify(error), false);
    errorHandler(req, res, error);
  } finally {
    if (dbConnection) dbConnection.end();
  }
});

export default qr;
