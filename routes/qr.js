import mysql2 from "mysql2";
import { Router } from "express";
import verifyToken from "../src/funciones/verifyToken.js";
import { getCompanyById, getProdDbConfig } from "../db.js";
import { getShipmentIdFromQr } from "../controller/qr/get_shipment_id.js";
import { getProductsFromShipment } from "../controller/qr/get_products.js";
import { enterFlex } from "../controller/qr/enter_flex.js";
import { armado } from "../controller/qr/armado.js";
import { verifyParamaters } from "../src/funciones/verifyParameters.js";
import { logGreen, logPurple, logRed } from "../src/funciones/logsCustom.js";
import CustomException from "../classes/custom_exception.js";
import Status from "../classes/status.js";
import { driverList } from "../controller/qr/get_driver_list.js";
import { crossDocking } from "../controller/qr/cross_docking.js";
import { getSkuAndStockFlex } from "../controller/qr/get_sku_and_stock _flex.js";
import { parseIfJson } from "../src/funciones/isValidJson.js";
import { crearLog } from "../src/funciones/crear_log.js";
import { getCantidadAsignaciones } from "../controller/qr/get_cantidad_asignaciones.js";
import { altaEnvioFoto } from "../controller/qr/envio_foto.js";
import { handleError } from "../src/funciones/handle_error.js";
import { verificarTodo } from "../src/funciones/verificar_all.js";

const qr = Router();

function dameHeaders(req) {
  return {
    "X-Company-Id": req.header("X-Company-Id"),
    "X-User-Id": req.header("X-User-Id"),
    "X-Profile": req.header("X-Profile")
  };
}

qr.get("/driver-list", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = dameHeaders(req);

  const company = await getCompanyById(companyId);
  console.log("🔍 Header X-Company-Id:", companyId);

  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {
    const result = await driverList(company, dbConnection);
    logGreen(`Listado de choferes obtenido correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/driver-list", true);
    res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    handleError(req, res, error);
  } finally {
    dbConnection.end();
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución driver-list: ${endTime - startTime} ms`);
  }
});

qr.post("/cross-docking", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = dameHeaders(req);
  const requiredBodyFields = ["companyId", "dataQr"];

  const company = await getCompanyById(companyId);
  console.log("🔍 Header X-Company-Id:", companyId);

  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();
  try {

    if (!verificarTodo(req, res, [], requiredBodyFields)) return;
    logGreen(`Iniciando cross-docking para la empresa: ${companyId}`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/cross-docking", true);
    const response = await crossDocking(req.body.dataQr, company, dbConnection);
    logGreen(`Cross-docking completado correctamente`);
    res.status(200).json({ success: true, body: response, message: "Datos obtenidos correctamente" });
  } catch (error) {
    handleError(req, res, error);
  } finally {

    dbConnection.end();
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución cross-docking: ${endTime - startTime} ms`);
  }
});

// este endpoint se llama de otros lados de la app
qr.post("/get-shipment-id", async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = dameHeaders(req);

  const company = await getCompanyById(companyId);
  console.log(" Header X-Company-Id:", companyId);

  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {
    verificarTodo(req, res, [], ["dataQr"]);

    dataQr = parseIfJson(dataQr);

    const response = await getShipmentIdFromQr(dataQr, company);

    logGreen(`ID de envío obtenido correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(response), "/get-shipment-id", true);
    res.status(200).json({ success: true, body: response, message: "Datos obtenidos correctamente" });
  } catch (error) {
    handleError(req, res, error);
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución get-shipment-id: ${endTime - startTime} ms`);
  }
});

qr.post("/products-from-shipment", verifyToken, async (req, res) => {
  const startTime = performance.now();
  let { companyId, userId, profile, dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(req.body, ["dataQr"], true);
    if (mensajeError) {
      logRed(`Error en products-from-shipment: ${mensajeError}`);
      throw new CustomException({
        title: "Error en products-from-shipment",
        message: mensajeError,
      });
    }

    dataQr = parseIfJson(dataQr);

    const company = await getCompanyById(companyId);
    const response = await getProductsFromShipment(company, dataQr);

    logGreen(`Productos obtenidos correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(response), "/products-from-shipment", true);
    res
      .status(200)
      .json({ body: response, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en products-from-shipment: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/products-from-shipment", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en products-from-shipment: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/products-from-shipment", false);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  } finally {
    const endTime = performance.now();
    logPurple(
      `Tiempo de ejecución products-from-shipment: ${endTime - startTime} ms`
    );
  }
});

qr.post("/enter-flex", async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, dataQr, profile } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "profile", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en enter-flex: ${mensajeError}`);
      throw new CustomException({
        title: "Error en enter-flex",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    await enterFlex(company, dataQr, userId, profile);

    logGreen(`Enter flex ejecutado correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify({ message: "exito" }), "/enter-flex", true);
    res
      .status(200)
      .json({ message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en enter-flex: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/enter-flex", false);
      res.status(400).json({ message: error.title, title: error.message });
    } else {
      logRed(`Error 500 en enter-flex: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/enter-flex", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución enter-flex: ${endTime - startTime} ms`);
  }
});

qr.post("/sku", verifyToken, async (req, res) => {
  const startTime = performance.now();
  let { companyId, userId, profile, dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en sku: ${mensajeError}`);
      throw new CustomException({
        title: "Error en sku",
        message: mensajeError,
      });
    }

    dataQr = parseIfJson(dataQr);

    const company = await getCompanyById(companyId);
    let result = await getSkuAndStockFlex(company, dataQr);

    logGreen(`SKU y cantidad de ítems obtenidos correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/sku", true);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en sku: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/sku", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en sku: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/sku", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución sku: ${endTime - startTime} ms`);
  }
});

qr.post("/armado", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile, dataEnvios, didCliente } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["userId", "dataEnvios", "didCliente"],
      true
    );
    if (mensajeError) {
      logRed(`Error en armado: ${mensajeError}`);
      throw new CustomException({
        title: "Error en armado",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const result = await armado(company, userId, dataEnvios, didCliente);

    logGreen(`Armado ejecutado correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/armado", true);
    res.status(200).json({
      body: result,
      message: "Datos obtenidos correctamente",
      success: true,
    });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en armado: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/armado", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en armado: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/armado", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución armado: ${endTime - startTime} ms`);
  }
});
qr.post("/cantidad-asignaciones", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      [],
      true
    );
    if (mensajeError) {
      logRed(`Error en armado: ${mensajeError}`);
      throw new CustomException({
        title: "Error en armado",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const result = await getCantidadAsignaciones(company, userId, profile);

    logGreen(`get-cantidad-asignaciones ejecutado correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/cantidad-asignaciones", true);
    res.status(200).json({
      body: result,
      message: "Datos obtenidos correctamente",
      success: true,
    });
  } catch (error) {
    if (error instanceof CustomException) {
      logOrange(`Error 400 en cantidad-asignaciones: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/cantidad-asignaciones", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en cantidad-asignaciones: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/cantidad-asignaciones", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución armado: ${endTime - startTime} ms`);
  }
});

qr.post('/alta-envio-foto', verifyToken, async (req, res) => {
  const startTime = performance.now();
  try {
    const mensajeError = verificarTodo(req, res, [], [
      'image',
      'companyId',
      'userId',
      'street',
      'number',
      'city',
      'observations',
      'appVersion',
      'brand',
      'model',
      'androidVersion',
      'deviceId',
      'deviceFrom',
      'profile',
      'driverId',
    ]);
    const companyId = req.body.companyId;
    const company = await getCompanyById(companyId);
    const result = await altaEnvioFoto(company, req);

    logGreen(`Envio de foto registrado y asignado correctamente`);
    res.status(Status.created).json({ body: result, message: "Envio - imagen registrada correctamente" });
  } catch (error) {
    handleError(req, res, error);
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución alta-envio-foto: ${endTime - startTime} ms`);
  }
});
export default qr;
