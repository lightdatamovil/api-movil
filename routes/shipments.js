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

    const company = await getCompanyById(companyId);
    const result = await shipmentDetails(dbConnection, company, userId, req);

    logGreen(`Detalle de envío obtenido correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/shipment-details", true);
    res
      .status(200)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en shipment-details: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/shipment-details", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en shipment-details: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/shipment-details", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(
      `Tiempo de ejecución shipment-details: ${endTime - startTime} ms`
    );
  }
});

shipments.post("/next-visit", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile, shipmentId } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "shipmentId"],
      true
    );
    if (mensajeError) {
      logRed(`Error en next-visit: ${mensajeError}`);
      throw new CustomException({
        title: "Error en next-visit",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const result = await nextDeliver(company, shipmentId, userId);

    logGreen(`Próxima visita obtenida correctamente`);
    crearLog(companyId, result.id, result.profile, req.body, performance.now() - startTime, JSON.stringify(result), "/next-visit", true);
    res
      .status(200)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en next-visit: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/next-visit", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en next-visit: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/shipment-details", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución next-visit: ${endTime - startTime} ms`);
  }
});

export default shipments;
