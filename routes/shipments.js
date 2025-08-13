import { Router } from "express";
import verifyToken from "../src/funciones/verifyToken.js";
import { getCompanyById } from "../db.js";
import { nextDeliver } from "../controller/shipments/next_deliver.js";
import { shipmentDetails } from "../controller/shipments/get_shipment_details.js";
import { shipmentList } from "../controller/shipments/get_shipment_list.js";
import { verifyParamaters } from "../src/funciones/verifyParameters.js";
import { logGreen, logPurple, logRed } from "../src/funciones/logsCustom.js";
import CustomException from "../classes/custom_exception.js";
import { crearLog } from "../src/funciones/crear_log.js";
import { errorHandler, getHeaders, Status, verifyAll } from "lightdata-tools";

const shipments = Router();

shipments.post("/shipment-list", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = getHeaders(req);
  const company = await getCompanyById(companyId);

  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {
    const requiredBodyFields = [
      "from",
      "shipmentStates",
      "isAssignedToday",
    ];
    verifyAll(req, [], requiredBodyFields);
    /// revisar ese endpoint 
    const result = await shipmentList(
      dbConnection,
      company,
      userId,
      profile,
      req
    );
    logGreen(`Listado de envíos obtenido correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/shipment-list", true);
    res.status(Status.ok).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    errorHandler(error, req, res);
  } finally {
    dbConnection.end();
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución shipment-list: ${endTime - startTime} ms`);
  }
});

shipments.post("/shipment-details", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = getHeaders(req);
  const company = await getCompanyById(companyId);

  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();
  try {
    const requiredBodyFields = ["shipmentId"];
    verifyAll(req, [], requiredBodyFields);
    const result = await shipmentDetails(dbConnection, company, userId, req);
    logGreen(`Detalle de envío obtenido correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/shipment-details", true);
    res.status(Status.ok).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    errorHandler(error, req, res);
  } finally {
    dbConnection.end();
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución shipment-details: ${endTime - startTime} ms`);
  }
});

shipments.post("/next-visit", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = getHeaders(req);
  const company = await getCompanyById(companyId);

  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();
  try {
    verifyAll(req, [], ["shipmentId"]);
    const result = await nextDeliver(dbConnection, company, userId, req);
    logGreen(`Próxima visita obtenida correctamente`);
    crearLog(companyId, result.id, result.profile, req.body, performance.now() - startTime, JSON.stringify(result), "/next-visit", true);
    res.status(Status.ok).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    errorHandler(error, req, res);
  } finally {
    dbConnection.end();
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución next-visit: ${endTime - startTime} ms`);
  }
});

export default shipments;
